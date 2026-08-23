import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";

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

  // Initialize audio element once
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio(BACKGROUND_AUDIO_URL);
      audio.loop = true;
      audio.volume = volume;
      audio.preload = "none";
      audioRef.current = audio;
    }
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    try {
      localStorage.setItem("scruttin_audio_volume", String(volume));
    } catch {
      // ignore
    }
  }, [volume]);

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audioEnabled) {
      audio.play().catch((e) => console.log("Audio play blocked:", e));
    } else {
      audio.pause();
    }
  }, [audioEnabled]);

  const toggleAudio = () => {
    setAudioEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("scruttin_audio_enabled", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

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
