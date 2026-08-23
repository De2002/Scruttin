import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const B2_BUCKET_ID = Deno.env.get("B2_BUCKET_ID") || "";
const B2_BUCKET_NAME = Deno.env.get("B2_BUCKET_NAME") || "Scruttin";
const B2_DOWNLOAD_URL = Deno.env.get("B2_DOWNLOAD_URL") || "";
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { downloadUrl, authorizationToken } = await authorizeB2();
    const baseDownloadUrl = B2_DOWNLOAD_URL || downloadUrl;
    const audioUrl = `${baseDownloadUrl}/file/${encodeURIComponent(B2_BUCKET_NAME)}/${encodeURIComponent(B2_FILE_NAME)}?Authorization=${encodeURIComponent(authorizationToken)}`;

    return new Response(JSON.stringify({ url: audioUrl, expiresIn: 3600 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("r2-audio error:", err);
    const message = err instanceof Error ? err.message : "Unable to authorize audio download";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
