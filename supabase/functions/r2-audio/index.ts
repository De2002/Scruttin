import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const B2_BUCKET_ID = Deno.env.get("B2_BUCKET_ID") || "";
const B2_KEY_ID = Deno.env.get("B2_KEY_ID") || "";
const B2_APPLICATION_KEY = Deno.env.get("B2_APPLICATION_KEY") || "";
const B2_FILE_NAME = Deno.env.get("B2_AUDIO_FILE_NAME") ||
  "Deep Focus Study - 40Hz Gamma Binaural Beats to Increase Focus _ Productivity(MP3_160K).mp3";

async function authorizeB2(): Promise<{ downloadUrl: string; authorizationToken: string }> {
  if (!B2_BUCKET_ID || !B2_KEY_ID || !B2_APPLICATION_KEY) {
    throw new Error("B2_BUCKET_ID, B2_KEY_ID, and B2_APPLICATION_KEY are required");
  }

  const credentials = btoa(`${B2_KEY_ID}:${B2_APPLICATION_KEY}`);
  const authResponse = await fetch("https://api.backblazeb2.com/b2api/v3/b2_authorize_account", {
    headers: { Authorization: `Basic ${credentials}` },
  });
  if (!authResponse.ok) throw new Error(`B2 authorization failed (${authResponse.status})`);
  const auth = await authResponse.json();

  const downloadResponse = await fetch(`${auth.apiUrl}/b2api/v3/b2_get_download_authorization`, {
    method: "POST",
    headers: { Authorization: auth.authorizationToken, "Content-Type": "application/json" },
    body: JSON.stringify({
      bucketId: B2_BUCKET_ID,
      fileNamePrefix: B2_FILE_NAME,
      validDurationInSeconds: 3600,
    }),
  });
  if (!downloadResponse.ok) {
    const detail = await downloadResponse.text();
    throw new Error(`B2 download authorization failed (${downloadResponse.status}): ${detail}`);
  }
  const download = await downloadResponse.json();
  return { downloadUrl: auth.downloadUrl, authorizationToken: download.authorizationToken };
}

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
    const { downloadUrl, authorizationToken } = await authorizeB2();
    const audioUrl = `${downloadUrl}/file/${encodeURIComponent(B2_BUCKET_ID)}/${encodeURIComponent(B2_FILE_NAME)}?Authorization=${encodeURIComponent(authorizationToken)}`;

    return new Response(JSON.stringify({ url: audioUrl, expiresIn: 3600 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("r2-audio error:", err);
    return new Response(String(err), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
