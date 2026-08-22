import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const R2_BUCKET = Deno.env.get("R2_BUCKET_NAME") || "scruttin-audio";
const R2_ENDPOINT = Deno.env.get("R2_ENDPOINT") || "";
const R2_ACCESS_KEY = Deno.env.get("R2_ACCESS_KEY_ID") || "";
const R2_SECRET_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY") || "";
const R2_REGION = "auto";

async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

async function getSigningKey(
  secretKey: string,
  date: string,
  region: string,
  service: string
): Promise<ArrayBuffer> {
  const kDate = await hmac(new TextEncoder().encode(`AWS4${secretKey}`), date);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(data: ArrayBuffer | Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", data);
  return toHex(hash);
}

async function getSignedR2Url(key: string): Promise<string> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);

  const url = new URL(`${R2_ENDPOINT}/${R2_BUCKET}/${key}`);
  const host = url.hostname;
  const credentialScope = `${dateStamp}/${R2_REGION}/s3/aws4_request`;
  const expiresSeconds = 3600; // 1 hour

  const queryParams = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${R2_ACCESS_KEY}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresSeconds),
    "X-Amz-SignedHeaders": "host",
  });

  const canonicalQueryString = queryParams.toString()
    .split("&")
    .sort()
    .join("&");

  const canonicalRequest = [
    "GET",
    `/${R2_BUCKET}/${key}`,
    canonicalQueryString,
    `host:${host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256(new TextEncoder().encode(canonicalRequest)),
  ].join("\n");

  const signingKey = await getSigningKey(R2_SECRET_KEY, dateStamp, R2_REGION, "s3");
  const signature = toHex(await hmac(signingKey, stringToSign));

  return `${R2_ENDPOINT}/${R2_BUCKET}/${encodeURIComponent(key)}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const key = url.searchParams.get("key");

    if (!key) {
      return new Response("Missing key parameter", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Generate a pre-signed URL for the R2 object
    const signedUrl = await getSignedR2Url(key);

    // Proxy the request to R2, streaming audio back
    const r2Response = await fetch(signedUrl, {
      headers: {
        Range: req.headers.get("Range") || "",
      },
    });

    if (!r2Response.ok && r2Response.status !== 206) {
      console.error("R2 fetch error:", r2Response.status);
      return new Response("Audio file not found", {
        status: r2Response.status,
        headers: corsHeaders,
      });
    }

    // Stream back with audio-appropriate headers
    const responseHeaders = new Headers(corsHeaders);
    const contentType = r2Response.headers.get("Content-Type") || "audio/mpeg";
    responseHeaders.set("Content-Type", contentType);
    responseHeaders.set("Accept-Ranges", "bytes");
    responseHeaders.set("Cache-Control", "public, max-age=3600");

    const contentRange = r2Response.headers.get("Content-Range");
    if (contentRange) responseHeaders.set("Content-Range", contentRange);

    const contentLength = r2Response.headers.get("Content-Length");
    if (contentLength) responseHeaders.set("Content-Length", contentLength);

    return new Response(r2Response.body, {
      status: r2Response.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("r2-audio error:", err);
    return new Response(String(err), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
