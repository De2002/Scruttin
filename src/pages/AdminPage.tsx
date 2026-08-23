import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { PHASES } from "@/constants/phases";

const ADMIN_EMAIL = "mderrickm00@gmail.com";

interface GuideAudioRecord {
  id: string;
  phase: string;
  topic: string | null;
  title: string;
  filename: string;
  file_key: string;
  duration_seconds: number | null;
  uploaded_at: string;
  uploaded_by: string | null;
  is_active: boolean;
}

export default function AdminPage() {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [guideRecords, setGuideRecords] = useState<GuideAudioRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPhase, setSelectedPhase] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [audioTitle, setAudioTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Guard
  useEffect(() => {
    if (user && user.email !== ADMIN_EMAIL) {
      navigate("/dashboard");
      toast.error("Access denied.");
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchRecords();
  }, []);

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-navy-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const fetchRecords = async () => {
    setLoadingRecords(true);
    const { data } = await supabase
      .from("guide_audio")
      .select("*")
      .order("uploaded_at", { ascending: false });
    setGuideRecords(data || []);
    setLoadingRecords(false);
  };

  const currentPhaseTopics = PHASES.find((p) => p.id === selectedPhase)?.topics || [];

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("audio/")) {
      toast.error("Please select an audio file.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error("File must be under 100MB.");
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedPhase || !audioTitle.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setUploading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("phase", selectedPhase);
    formData.append("title", audioTitle.trim());
    if (selectedTopic) formData.append("topic", selectedTopic);

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/b2-guide-upload`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }
    );

    if (!response.ok) {
      const text = await response.text();
      toast.error(`Upload failed: ${text}`);
    } else {
      toast.success("Guide audio uploaded successfully.");
      setSelectedFile(null);
      setSelectedPhase("");
      setSelectedTopic("");
      setAudioTitle("");
      fetchRecords();
    }
    setUploading(false);
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm("Remove this guide audio?")) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/b2-guide-upload`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      }
    );

    if (response.ok) {
      toast.success("Audio removed.");
      fetchRecords();
    } else {
      toast.error("Failed to remove audio.");
    }
  };

  const fmtSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getPhaseLabel = (phaseId: string) =>
    PHASES.find((p) => p.id === phaseId)?.title || phaseId;

  const getTopicLabel = (phaseId: string, topicId: string) =>
    PHASES.find((p) => p.id === phaseId)?.topics.find((t) => t.id === topicId)?.title || topicId;

  const activeRecords = guideRecords.filter((r) => r.is_active);
  const inactiveRecords = guideRecords.filter((r) => !r.is_active);

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

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <div>
          <h1 className="text-white font-serif text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-white/40 text-sm">Manage guide audio files for each phase and topic of Scruttin.</p>
        </div>

        {/* Background audio note */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-start gap-3">
          <div className="w-8 h-8 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
              <path d="M9 19V6l12-3v13M9 19c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm12-3c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-green-300 text-sm font-semibold">Background Focus Audio — Active</p>
            <p className="text-white/40 text-xs mt-0.5">The site-wide background audio (40Hz Gamma Binaural Beats) is hardcoded and plays automatically. Users can toggle it from the dashboard.</p>
          </div>
        </div>

        {/* Guide Audio Upload */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-400/15 border border-amber-400/30 rounded-xl flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-400">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">Upload Guide Audio</h2>
              <p className="text-white/40 text-xs">Add founder voice guides for any phase or topic — they'll appear as a play button for users.</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Phase selector */}
            <div>
              <label className="block text-white/60 text-xs font-semibold uppercase tracking-wide mb-1.5">Phase *</label>
              <select
                value={selectedPhase}
                onChange={(e) => { setSelectedPhase(e.target.value); setSelectedTopic(""); }}
                className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400"
              >
                <option value="">Select a phase…</option>
                {PHASES.filter((p) => p.id !== "onboarding").map((p) => (
                  <option key={p.id} value={p.id}>{p.number}. {p.title}</option>
                ))}
              </select>
            </div>

            {/* Topic selector (optional) */}
            {selectedPhase && currentPhaseTopics.length > 0 && (
              <div>
                <label className="block text-white/60 text-xs font-semibold uppercase tracking-wide mb-1.5">Specific Topic (optional)</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400"
                >
                  <option value="">Applies to entire phase</option>
                  {currentPhaseTopics.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
                <p className="text-white/30 text-xs mt-1">If no topic is selected, this audio plays for the whole phase (unless a more specific one exists).</p>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-white/60 text-xs font-semibold uppercase tracking-wide mb-1.5">Audio Title *</label>
              <input
                type="text"
                value={audioTitle}
                onChange={(e) => setAudioTitle(e.target.value)}
                placeholder="e.g. 'Company Description Intro Guide'"
                className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* File drop area */}
            <div>
              <label className="block text-white/60 text-xs font-semibold uppercase tracking-wide mb-1.5">Audio File *</label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleFileSelect(file);
                }}
                onClick={() => !selectedFile && fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  dragOver ? "border-amber-400 bg-amber-400/5" :
                  selectedFile ? "border-green-500/50 bg-green-500/5 cursor-default" :
                  "border-white/20 hover:border-white/40"
                }`}
              >
                <input ref={fileRef} type="file" accept="audio/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
                {selectedFile ? (
                  <div>
                    <p className="text-green-300 text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-white/40 text-xs mt-1">{fmtSize(selectedFile.size)}</p>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                      className="mt-2 text-white/40 hover:text-white text-xs underline">Change file</button>
                  </div>
                ) : (
                  <div>
                    <p className="text-white/50 text-sm">Drop audio file or click to browse</p>
                    <p className="text-white/30 text-xs mt-1">MP3, M4A, WAV · Max 100MB</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading || !selectedFile || !selectedPhase || !audioTitle.trim()}
              className="w-full bg-amber-400 text-navy-900 font-bold py-3 rounded-xl hover:bg-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading to Backblaze B2…" : "Upload Guide Audio"}
            </button>
          </div>
        </div>

        {/* Existing guide audio */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-7">
          <h2 className="text-white font-semibold text-lg mb-4">Uploaded Guide Audio</h2>

          {loadingRecords ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeRecords.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-6">No guide audio uploaded yet. Upload files above to add guides per phase.</p>
          ) : (
            <div className="space-y-3">
              {activeRecords.map((record) => (
                <div key={record.id} className="flex items-start gap-4 bg-white/5 rounded-xl p-4">
                  <div className="w-9 h-9 bg-amber-400/15 rounded-lg flex items-center justify-center shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{record.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs bg-amber-400/15 text-amber-300 px-2 py-0.5 rounded">
                        {getPhaseLabel(record.phase)}
                      </span>
                      {record.topic && (
                        <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded">
                          {getTopicLabel(record.phase, record.topic)}
                        </span>
                      )}
                      <span className="text-white/30 text-xs">
                        {new Date(record.uploaded_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeactivate(record.id)}
                    className="text-red-400 hover:text-red-300 text-xs border border-red-400/30 px-2.5 py-1 rounded-lg hover:bg-red-400/10 transition-colors shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
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
