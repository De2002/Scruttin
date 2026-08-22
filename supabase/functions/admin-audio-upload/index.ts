import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const ADMIN_EMAIL = "mderrickm00@gmail.com";
const R2_BUCKET = Deno.env.get("R2_BUCKET_NAME") || "scruttin-audio";
const R2_ENDPOINT = Deno.env.get("R2_ENDPOINT") || "";
const R2_ACCESS_KEY = Deno.env.get("R2_ACCESS_KEY_ID") || "";
const R2_SECRET_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY") || "";
const R2_REGION = "auto";

// AWS Signature V4 helper for R2 (S3-compatible)
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
  const kSigning = await hmac(kService, "aws4_request");
  return kSigning;
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

async function signedR2Request(
  method: string,
  key: string,
  body: Uint8Array | null,
  contentType: string
): Promise<Response> {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);

  const url = new URL(`${R2_ENDPOINT}/${R2_BUCKET}/${key}`);
  const host = url.hostname;

  const payloadHash = body ? await sha256(body) : "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  const bodyBytes = body || new Uint8Array(0);

  const headers: Record<string, string> = {
    host,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": payloadHash,
  };

  if (method !== "DELETE" && contentType) {
    headers["content-type"] = contentType;
  }

  const headerKeys = Object.keys(headers).sort();
  const canonicalHeaders = headerKeys.map((k) => `${k}:${headers[k]}\n`).join("");
  const signedHeaders = headerKeys.join(";");

  const canonicalRequest = [
    method,
    `/${R2_BUCKET}/${key}`,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${R2_REGION}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256(new TextEncoder().encode(canonicalRequest)),
  ].join("\n");

  const signingKey = await getSigningKey(R2_SECRET_KEY, dateStamp, R2_REGION, "s3");
  const signature = toHex(await hmac(signingKey, stringToSign));

  const authHeader = `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const reqHeaders: HeadersInit = {
    Authorization: authHeader,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": payloadHash,
  };

  if (method !== "DELETE" && contentType) {
    reqHeaders["Content-Type"] = contentType;
  }

  return fetch(`${R2_ENDPOINT}/${R2_BUCKET}/${key}`, {
    method,
    headers: reqHeaders,
    body: body || undefined,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user || user.email !== ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE — remove audio
    if (req.method === "DELETE") {
      await supabase
        .from("site_settings")
        .upsert({
          key: "background_audio",
          value: { enabled: false, url: null, key: null, filename: null },
          updated_at: new Date().toISOString(),
        }, { onConflict: "key" });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST — upload audio
    if (req.method === "POST") {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      const filename = (formData.get("filename") as string) || file?.name || "audio";

      if (!file) {
        return new Response(JSON.stringify({ error: "No file provided" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const ext = filename.split(".").pop() || "mp3";
      const key = `background-audio/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const fileBytes = new Uint8Array(await file.arrayBuffer());

      console.log(`Uploading ${filename} (${fileBytes.length} bytes) to R2 key: ${key}`);

      const r2Res = await signedR2Request("PUT", key, fileBytes, file.type || "audio/mpeg");

      if (!r2Res.ok) {
        const errText = await r2Res.text();
        console.error("R2 upload error:", r2Res.status, errText);
        return new Response(JSON.stringify({ error: `R2 upload failed: ${r2Res.status} ${errText}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Save to DB — URL is served via proxy edge function, not direct R2
      const audioUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/r2-audio?key=${encodeURIComponent(key)}`;

      await supabase
        .from("site_settings")
        .upsert({
          key: "background_audio",
          value: {
            enabled: true,
            url: audioUrl,
            key,
            filename,
          },
          updated_at: new Date().toISOString(),
        }, { onConflict: "key" });

      console.log("Audio saved to DB:", key);

      return new Response(JSON.stringify({ success: true, key, url: audioUrl, filename }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("admin-audio-upload error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
