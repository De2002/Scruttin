import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface AudioSettings {
  enabled: boolean;
  url: string | null;
  key: string | null;
  filename: string | null;
}

interface AudioContextType {
  audioEnabled: boolean;
  audioSettings: AudioSettings | null;
  volume: number;
  isLoading: boolean;
  toggleAudio: () => void;
  setVolume: (v: number) => void;
  refreshSettings: () => void;
}

const AudioContext = createContext<AudioContextType>({
  audioEnabled: false,
  audioSettings: null,
  volume: 0.5,
  isLoading: true,
  toggleAudio: () => {},
  setVolume: () => {},
  refreshSettings: () => {},
});

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [audioSettings, setAudioSettings] = useState<AudioSettings | null>(null);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem("scruttin_audio_enabled") === "true"; } catch { return false; }
  });
  const [volume, setVolumeState] = useState<number>(() => {
    try { return parseFloat(localStorage.getItem("scruttin_audio_volume") || "0.4"); } catch { return 0.4; }
  });
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "background_audio")
        .maybeSingle();

      if (!error && data?.value) {
        setAudioSettings(data.value as AudioSettings);
      }
    } catch (e) {
      console.log("Audio settings fetch:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Create and manage audio element
  useEffect(() => {
    if (!audioSettings?.url) return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }

    const audio = audioRef.current;
    // Use the r2-audio edge function as a proxy so no public R2 access needed
    const audioUrl = audioSettings.key
      ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/r2-audio?key=${encodeURIComponent(audioSettings.key)}`
      : audioSettings.url || "";
    if (audio.src !== audioUrl) {
      audio.src = audioUrl;
      audio.load();
    }
    audio.volume = volume;

    return () => {
      // Don't destroy on settings change — just update
    };
  }, [audioSettings?.url, audioSettings?.key]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    localStorage.setItem("scruttin_audio_volume", String(volume));
  }, [volume]);

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSettings?.url) return;

    if (audioEnabled) {
      audio.play().catch((e) => console.log("Audio play blocked:", e));
    } else {
      audio.pause();
    }
  }, [audioEnabled, audioSettings?.url]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const toggleAudio = () => {
    setAudioEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("scruttin_audio_enabled", String(next));
      return next;
    });
  };

  const setVolume = (v: number) => {
    setVolumeState(v);
  };

  return (
    <AudioContext.Provider
      value={{
        audioEnabled,
        audioSettings,
        volume,
        isLoading,
        toggleAudio,
        setVolume,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  return useContext(AudioContext);
}
