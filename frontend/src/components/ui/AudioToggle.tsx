"use client";

import { motion } from "framer-motion";
import { useAudioSystem } from "@/hooks/useAudioSystem";

export function AudioToggle() {
  const { init, toggleMute, isStarted, isMuted } = useAudioSystem();

  const handleClick = () => {
    if (!isStarted) init();
    else toggleMute();
  };

  const label = !isStarted ? "sound on" : isMuted ? "sound on" : "sound off";
  const icon = !isStarted || isMuted ? "🔇" : "🔊";

  return (
    <motion.button
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 max-sm:bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+5.25rem)] z-30 px-5 py-2 max-sm:px-3 max-sm:py-1.5 rounded-full border backdrop-blur-md text-[10px] max-sm:text-[9px] uppercase tracking-widest transition-all ${
        isStarted && !isMuted
          ? "border-emerald-400/35 bg-emerald-950/40 text-emerald-300/80 hover:border-emerald-400/55"
          : "border-white/10 bg-black/35 text-white/45 hover:text-white/65 hover:border-white/20"
      }`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2.5 }}
      onClick={handleClick}
      whileTap={{ scale: 0.95 }}
      aria-label={label}
    >
      {icon} {label}
    </motion.button>
  );
}
