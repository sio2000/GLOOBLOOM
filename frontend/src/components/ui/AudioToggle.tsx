"use client";

import { motion } from "framer-motion";
import { useAudioSystem } from "@/hooks/useAudioSystem";

export function AudioToggle({ compact = false }: { compact?: boolean }) {
  const { init, toggleMute, isStarted, isMuted } = useAudioSystem();

  const handleClick = () => {
    if (!isStarted) init();
    else toggleMute();
  };

  const label = !isStarted ? "sound on" : isMuted ? "sound on" : "sound off";
  const icon = !isStarted || isMuted ? "🔇" : "🔊";
  const shortLabel = !isStarted || isMuted ? "Sound" : "Mute";

  return (
    <motion.button
      className={
        compact
          ? `w-full px-2 py-1.5 rounded-lg border backdrop-blur-md text-[8px] uppercase tracking-widest transition-all whitespace-nowrap ${
              isStarted && !isMuted
                ? "border-emerald-400/35 bg-emerald-950/40 text-emerald-300/80"
                : "border-white/10 bg-black/35 text-white/55"
            }`
          : `px-5 py-2 max-sm:px-3 max-sm:py-1.5 rounded-full border backdrop-blur-md text-[10px] max-sm:text-[9px] uppercase tracking-widest transition-all whitespace-nowrap ${
              isStarted && !isMuted
                ? "border-emerald-400/35 bg-emerald-950/40 text-emerald-300/80 hover:border-emerald-400/55"
                : "border-white/10 bg-black/35 text-white/45 hover:text-white/65 hover:border-white/20"
            }`
      }
      initial={{ opacity: 0, y: compact ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: compact ? 0 : 2.5 }}
      onClick={handleClick}
      whileTap={{ scale: 0.95 }}
      aria-label={label}
    >
      {compact ? (
        <span className="flex items-center justify-center gap-1">
          <span className="text-[10px] leading-none">{icon}</span>
          <span>{shortLabel}</span>
        </span>
      ) : (
        <>
          {icon} {label}
        </>
      )}
    </motion.button>
  );
}
