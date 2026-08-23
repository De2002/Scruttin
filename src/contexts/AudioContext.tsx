import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// Hardcoded background audio URL from Backblaze B2
const BACKGROUND_AUDIO_URL =
  "https://f005.backblazeb2.com/file/Scruttin/Deep+Focus+Study+-+40Hz+Gamma+Binaural+Beats+to+Increase+Focus+_+Productivity(MP3_160K).mp3";

interface AudioContextType {
  audioEnabled: boolean;
  volume: number;
  isLoading: boolean;
  toggleAudio: () => void;
  setVolume: (v: number) => void;
  // Keep refreshSettings for backward compatibility
  refreshSettings: () => void;
  audioSettings: { url: string; key: null; filename: string } | null;
}

const AudioContext = createContext<AudioContextType>({
  audioEnabled: false,
  volume: 0.5,
  isLoading: false,
  toggleAudio: () => {},
  setVolume: () => {},
  refreshSettings: () => {},
  audioSettings: null,
});

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [audioEnabled, setAudioEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem("scruttin_audio_enabled") === "true";
    } catch {
      return false;
    }
  });
  const [volume, setVolumeState] = useState<number>(() => {
    try {
      return parseFloat(localStorage.getItem("scruttin_audio_volume") || "0.4");
    } catch {
      return 0.4;
    }
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.loop = true;
      audio.preload = "auto";
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  const playAudio = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("r2-audio");
    if (error || !data?.url) {
      throw error ?? new Error("B2 download authorization did not return an audio URL");
    }
    const audio = getAudio();
    audio.src = data.url;
    audio.volume = volume;
    return audio.play();
  }, [getAudio, volume]);

  // Create the element once and clean it up when the provider unmounts.
  useEffect(() => {
    getAudio();
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [getAudio]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    try {
      localStorage.setItem("scruttin_audio_volume", String(volume));
    } catch {
      // ignore
    }
  }, [volume]);

  // Keep state and the media element in sync. Playback is also attempted directly
  // from toggleAudio so browsers recognize the user's click as an allowed gesture.
  useEffect(() => {
    if (!audioEnabled) getAudio().pause();
  }, [audioEnabled, getAudio]);

  const toggleAudio = useCallback(() => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    try {
      localStorage.setItem("scruttin_audio_enabled", String(next));
    } catch {
      // ignore
    }

    if (next) {
      playAudio().catch((error) => {
        console.log("[v0] Background audio could not start:", error);
        setAudioEnabled(false);
        try {
          localStorage.setItem("scruttin_audio_enabled", "false");
        } catch {
          // ignore
        }
      });
    }
  }, [audioEnabled, playAudio]);

  const setVolume = (v: number) => {
    setVolumeState(v);
  };

  // audioSettings kept for any legacy UI references
  const audioSettings = { url: BACKGROUND_AUDIO_URL, key: null as null, filename: "Deep Focus Study - 40Hz" };

  return (
    <AudioContext.Provider
      value={{
        audioEnabled,
        audioSettings,
        volume,
        isLoading: false,
        toggleAudio,
        setVolume,
        refreshSettings: () => {},
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext);
}
