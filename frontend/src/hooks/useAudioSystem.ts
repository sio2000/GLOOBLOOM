"use client";

import { useEffect, useReducer, useCallback } from "react";
import { OrganismMood, Season } from "@/types/organism";
import { audioEngine } from "@/lib/audioEngine";

export function useAudioSystem() {
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    const unsub = audioEngine.subscribe(rerender);
    return () => { unsub(); };
  }, []);

  const init = useCallback(() => audioEngine.init(), []);
  const toggleMute = useCallback(() => audioEngine.toggleMute(), []);
  const setMuted = useCallback((v: boolean) => audioEngine.setMuted(v), []);
  const updateMood = useCallback((mood: OrganismMood, season: Season) => {
    audioEngine.updateMood(mood, season);
  }, []);
  const playWaterChime = useCallback(() => audioEngine.playWaterChime(), []);
  const resume = useCallback(() => audioEngine.resume(), []);

  return {
    init,
    toggleMute,
    setMuted,
    updateMood,
    playWaterChime,
    resume,
    isStarted: audioEngine.isStarted,
    isMuted: audioEngine.isMuted,
  };
}
