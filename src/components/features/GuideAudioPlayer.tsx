import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface GuideAudioRecord {
  id: string;
  phase: string;
  topic: string | null;
  title: string;
  filename: string;
  file_key: string;
  duration_seconds: number | null;
}

interface GuideAudioPlayerProps {
  phase: string;
  topic?: string;
}

const B2_BASE_URL = "https://f005.backblazeb2.com/file/Scruttin";

export default function GuideAudioPlayer({ phase, topic }: GuideAudioPlayerProps) {
  const [audioRecord, setAudioRecord] = useState<GuideAudioRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buffering, setBuffering] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLoading(true);
    setAudioRecord(null);
    setPlaying(false);
    setCurrentTime(0);
    setExpanded(false);
    setError(null);
    setBuffering(false);

    // Try to find audio for this specific phase + topic first, then phase-only
    const fetchAudio = async () => {
      let record: GuideAudioRecord | null = null;

      if (topic) {
        const { data } = await supabase
          .from("guide_audio")
          .select("*")
          .eq("phase", phase)
          .eq("topic", topic)
          .eq("is_active", true)
          .maybeSingle();
        record = data;
      }

      if (!record) {
        const { data } = await supabase
          .from("guide_audio")
          .select("*")
          .eq("phase", phase)
          .is("topic", null)
          .eq("is_active", true)
          .maybeSingle();
        record = data;
      }

      setAudioRecord(record);
      setLoading(false);
    };

    fetchAudio();
  }, [phase, topic]);

  useEffect(() => {
    // Cleanup audio when record changes
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [audioRecord?.id]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      audioRef.current?.pause();
    };
  }, []);

  if (loading || !audioRecord) return null;

  const audioUrl = `${B2_BASE_URL}/${encodeURIComponent(audioRecord.file_key)}`;

  const initAudio = () => {
    if (!audioRef.current) {
      const audio = new Audio(audioUrl);
      audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
      audio.addEventListener("ended", () => {
        setPlaying(false);
        setCurrentTime(0);
        if (intervalRef.current) clearInterval(intervalRef.current);
      });
      audioRef.current = audio;
    }
    return audioRef.current;
  };

  const startPlayback = (audio: HTMLAudioElement) => {
    setBuffering(true);
    setError(null);
    audio.play().then(() => {
      setBuffering(false);
      setPlaying(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => setCurrentTime(audio.currentTime), 250);
    }).catch((reason) => {
      setBuffering(false);
      setPlaying(false);
      setError("Audio could not load. Check the B2 file authorization.");
      console.log("[v0] Guide audio playback failed:", reason);
    });
  };

  const togglePlay = () => {
    const audio = initAudio();
    if (playing) {
      audio.pause();
      if (intervalRef.current) clearInterval(intervalRef.current);
      setPlaying(false);
    } else {
      startPlayback(audio);
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const formatTime = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Collapsed pill
  if (!expanded) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setExpanded(true);
            // Start playing when first opened
            const audio = initAudio();
            startPlayback(audio);
          }}
          className="flex items-center gap-2 bg-amber-400/15 border border-amber-400/30 text-amber-700 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-amber-400/25 transition-all group"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:scale-110 transition-transform">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Guide: {audioRecord.title}</span>
        </button>
      </div>
    );
  }

  // Expanded player
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-navy-900 text-sm">{audioRecord.title}</p>
              <p className="text-amber-600 text-xs">Guide walkthrough</p>
            </div>
            <button
              onClick={() => {
                setExpanded(false);
                if (playing && audioRef.current) {
                  audioRef.current.pause();
                  if (intervalRef.current) clearInterval(intervalRef.current);
                  setPlaying(false);
                }
              }}
              className="text-navy-400 hover:text-navy-600 transition-colors shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {error && (
            <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          {/* Controls */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={togglePlay}
              aria-label={buffering ? "Loading audio" : playing ? "Pause guide audio" : "Play guide audio"}
              disabled={buffering}
              className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center hover:bg-amber-300 disabled:opacity-60 transition-colors shrink-0"
            >
              {buffering ? (
                <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden="true" />
              ) : playing ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="2" y="1" width="4" height="12" rx="1" fill="white"/>
                  <rect x="8" y="1" width="4" height="12" rx="1" fill="white"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 1l10 6-10 6V1z" fill="white"/>
                </svg>
              )}
            </button>

            <div className="flex-1 flex items-center gap-2">
              <span className="text-xs text-navy-500 w-8 shrink-0">{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={seek}
                className="flex-1 h-1.5 accent-amber-400 cursor-pointer"
              />
              <span className="text-xs text-navy-500 w-8 shrink-0 text-right">{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
