import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useAudio } from "@/contexts/AudioContext";
import { toast } from "sonner";

const ADMIN_EMAIL = "mderrickm00@gmail.com";
const MAX_AUDIO_FILE_SIZE = 200 * 1024 * 1024;

export default function AdminPage() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const { audioSettings, refreshSettings } = useAudio();

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removing, setRemoving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Guard: admin only
  useEffect(() => {
    if (user && user.email !== ADMIN_EMAIL) {
      navigate("/dashboard");
      toast.error("Access denied.");
    }
  }, [user, navigate]);

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-navy-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("audio/")) {
      toast.error("Please select an audio file (MP3, WAV, OGG, FLAC, M4A).");
      return;
    }
    if (file.size > MAX_AUDIO_FILE_SIZE) {
      toast.error("File size must be under 200MB.");
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadProgress(0);

    try {
      // Get upload URL from edge function
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUploadProgress((p) => Math.min(p + 8, 85));
      }, 200);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("filename", selectedFile.name);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-audio-upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      clearInterval(progressInterval);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Upload failed");
      }

      const result = await response.json();
      setUploadProgress(100);
      toast.success("Background audio uploaded successfully.");
      setSelectedFile(null);
      refreshSettings();
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const handleRemoveAudio = async () => {
    if (!window.confirm("Remove the current background audio? This will stop it from playing site-wide.")) return;
    setRemoving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-audio-upload`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to remove audio");
      toast.success("Background audio removed.");
      refreshSettings();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRemoving(false);
    }
  };

  const fmtSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C]">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-amber-400 rounded flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2 2h10v2H2zM2 6h7v2H2zM2 10h5v2H2z" fill="#0F1E3C" />
            </svg>
          </div>
          <span className="text-white font-serif font-semibold">Scruttin</span>
          <span className="text-white/30 text-sm">·</span>
          <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">Admin</span>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-white/50 hover:text-white text-sm transition-colors"
        >
          ← Dashboard
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-white font-serif text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-white/40 text-sm">Manage site-wide settings for Scruttin.</p>
        </div>

        {/* Background Audio Section */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-7 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-400/15 border border-amber-400/30 rounded-xl flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-400">
                <path d="M9 19V6l12-3v13M9 19c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12-3c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Background Audio</h2>
              <p className="text-white/40 text-xs">Loops site-wide to aid focus and productivity</p>
            </div>
          </div>

          {/* Current audio status */}
          {audioSettings?.url || audioSettings?.key ? (
            <div className="mb-6 p-4 bg-sage-900/30 border border-sage-600/30 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-sage-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-sage-400">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sage-300 text-sm font-medium truncate">
                    {audioSettings.filename || "Background audio active"}
                  </p>
                  <p className="text-sage-500 text-xs">Currently set — plays when enabled by users</p>
                </div>
              </div>
              <button
                onClick={handleRemoveAudio}
                disabled={removing}
                className="text-red-400 hover:text-red-300 text-xs font-semibold border border-red-400/30 px-3 py-1.5 rounded-lg hover:bg-red-400/10 transition-colors shrink-0"
              >
                {removing ? "Removing…" : "Remove"}
              </button>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-white/40 text-sm">No background audio set. Upload a file below to enable it site-wide.</p>
            </div>
          )}

          {/* Upload area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !selectedFile && fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-amber-400 bg-amber-400/5"
                : selectedFile
                ? "border-sage-500 bg-sage-500/5 cursor-default"
                : "border-white/20 hover:border-white/40 hover:bg-white/5"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />

            {selectedFile ? (
              <div>
                <div className="w-12 h-12 bg-sage-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-sage-400">
                    <path d="M9 19V6l12-3v13M9 19c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12-3c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-white font-medium text-sm mb-1">{selectedFile.name}</p>
                <p className="text-white/40 text-xs mb-4">{fmtSize(selectedFile.size)} · {selectedFile.type}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                    className="text-white/50 hover:text-white text-xs border border-white/20 px-4 py-2 rounded-lg transition-colors"
                  >
                    Change File
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                    disabled={uploading}
                    className="bg-amber-400 text-navy-900 text-xs font-bold px-5 py-2 rounded-lg hover:bg-amber-300 transition-colors disabled:opacity-60"
                  >
                    {uploading ? "Uploading…" : "Upload to R2"}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/50">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-white/70 text-sm font-medium mb-1">
                  Drop an audio file here, or click to browse
                </p>
                <p className="text-white/30 text-xs">MP3, WAV, OGG, FLAC, M4A · Max 200MB</p>
              </div>
            )}
          </div>

          {/* Upload progress */}
          {uploading && uploadProgress > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-white/60 text-xs">Uploading to Cloudflare R2…</p>
                <p className="text-white/60 text-xs">{uploadProgress}%</p>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-amber-400 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-white/50 text-xs font-bold uppercase tracking-wide mb-2">How it works</p>
            <ul className="space-y-1.5 text-white/40 text-xs">
              <li className="flex items-start gap-2">
                <span className="shrink-0 text-amber-400/70">→</span>
                <span>Upload an audio file here → it uploads to Cloudflare R2 storage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 text-amber-400/70">→</span>
                <span>The file URL is saved in your database as the active background audio</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 text-amber-400/70">→</span>
                <span>Users can toggle it on/off from the Dashboard — it loops automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="shrink-0 text-amber-400/70">→</span>
                <span>Preference is saved per user across sessions via localStorage</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Admin info */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-white/30 text-xs font-bold uppercase tracking-wide mb-3">Admin Session</p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-400/20 rounded-full flex items-center justify-center">
              <span className="text-amber-400 text-xs font-bold">{user.email?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <p className="text-white text-sm font-medium">{user.name || user.email}</p>
              <p className="text-white/40 text-xs">{user.email} · Admin</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
