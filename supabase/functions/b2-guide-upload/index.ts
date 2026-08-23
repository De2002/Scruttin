import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const ADMIN_EMAIL = "mderrickm00@gmail.com";
const B2_BUCKET = "Scruttin";
const B2_S3_ENDPOINT = "https://s3.us-east-005.backblazeb2.com";

// AWS Signature V4 helpers for B2 S3-compatible API
async function sha256(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

async function getSigningKey(secret: string, date: string, region: string, service: string): Promise<ArrayBuffer> {
  const kDate = await hmacSha256(new TextEncoder().encode("AWS4" + secret), date);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return hmacSha256(kService, "aws4_request");
}

function getAmzDate(): { amzDate: string; dateStamp: string } {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);
  return { amzDate, dateStamp };
}

async function signedPut(
  keyId: string,
  appKey: string,
  bucket: string,
  key: string,
  body: ArrayBuffer,
  contentType: string
): Promise<Response> {
  const region = "us-east-005";
  const service = "s3";
  const host = `s3.us-east-005.backblazeb2.com`;
  const url = `${B2_S3_ENDPOINT}/${bucket}/${key}`;
  const { amzDate, dateStamp } = getAmzDate();

  const payloadHash = await sha256(body);
  const headers = {
    host,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": payloadHash,
    "content-type": contentType,
  };

  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalHeaders = Object.entries(headers).sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}\n`).join("");

  const canonicalRequest = [
    "PUT",
    `/${bucket}/${key}`,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, await sha256(new TextEncoder().encode(canonicalRequest))].join("\n");

  const signingKey = await getSigningKey(appKey, dateStamp, region, service);
  const signature = Array.from(new Uint8Array(await hmacSha256(signingKey, stringToSign)))
    .map((b) => b.toString(16).padStart(2, "0")).join("");

  const authorization = `AWS4-HMAC-SHA256 Credential=${keyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return fetch(url, {
    method: "PUT",
    headers: {
      ...headers,
      Authorization: authorization,
    },
    body,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Auth check
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin check
    if (user.email !== ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "DELETE") {
      const { id } = await req.json();
      if (!id) return new Response(JSON.stringify({ error: "Missing id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

      // Get file key first
      const { data: record } = await supabase.from("guide_audio").select("file_key").eq("id", id).maybeSingle();
      if (record) {
        // Soft delete — just mark inactive
        await supabase.from("guide_audio").update({ is_active: false }).eq("id", id);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const phase = formData.get("phase") as string | null;
    const topic = (formData.get("topic") as string | null) || null;
    const title = formData.get("title") as string | null;

    if (!file || !phase || !title) {
      return new Response(JSON.stringify({ error: "Missing file, phase, or title" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const keyId = Deno.env.get("B2_KEY_ID");
    const appKey = Deno.env.get("B2_APPLICATION_KEY");

    if (!keyId || !appKey) {
      return new Response(JSON.stringify({ error: "B2 credentials not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ext = file.name.split(".").pop() || "mp3";
    const safePhase = phase.replace(/[^a-z0-9_]/gi, "_");
    const safeTopic = topic ? topic.replace(/[^a-z0-9_]/gi, "_") : "general";
    const filename = `guide_${safePhase}_${safeTopic}_${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();

    console.log(`Uploading guide audio: ${filename}`);
    const putResp = await signedPut(keyId, appKey, B2_BUCKET, filename, arrayBuffer, file.type || "audio/mpeg");

    if (!putResp.ok) {
      const errText = await putResp.text();
      console.error("B2 upload failed:", errText);
      return new Response(JSON.stringify({ error: `B2 upload failed: ${errText}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deactivate any existing active audio for this phase/topic combo
    let deactivateQuery = supabase.from("guide_audio").update({ is_active: false }).eq("phase", phase);
    if (topic) {
      deactivateQuery = deactivateQuery.eq("topic", topic);
    } else {
      deactivateQuery = deactivateQuery.is("topic", null);
    }
    await deactivateQuery;

    // Save record
    const { data: newRecord, error: insertErr } = await supabase.from("guide_audio").insert({
      phase,
      topic: topic || null,
      title,
      filename,
      file_key: filename,
      uploaded_by: user.email,
      is_active: true,
    }).select().single();

    if (insertErr) {
      console.error("DB insert error:", insertErr);
      return new Response(JSON.stringify({ error: "Failed to save audio record" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, record: newRecord }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("b2-guide-upload error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
