"use client";

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrganismStore } from "@/store/useOrganismStore";
import { useSocket } from "@/hooks/useSocket";
import { useAudioSystem } from "@/hooks/useAudioSystem";
import { WATERING_COOLDOWN_MS } from "@/lib/constants";

export function WateringButton() {
  const { water } = useSocket();
  const { playWaterChime, resume } = useAudioSystem();
  const username = useOrganismStore((s) => s.username);
  const isWatering = useOrganismStore((s) => s.isWatering);
  const cooldown = useOrganismStore((s) => s.wateringCooldown);
  const setIsWatering = useOrganismStore((s) => s.setIsWatering);
  const setCooldown = useOrganismStore((s) => s.setWateringCooldown);
  // Opens the dedicated water modal (separate from leaf modal)
  const setShowWaterModal = useOrganismStore((s) => s.setShowWaterModal);

  const handleWater = useCallback(() => {
    if (cooldown) return;
    resume();

    // If no name yet, open the water-specific modal
    if (!username) {
      setShowWaterModal(true);
      return;
    }

    // Name already known — water directly
    setIsWatering(true);
    setCooldown(true);
    playWaterChime();
    water(username);

    setTimeout(() => setIsWatering(false), 1200);
    setTimeout(() => setCooldown(false), WATERING_COOLDOWN_MS);
  }, [cooldown, username, water, playWaterChime, resume, setIsWatering, setCooldown, setShowWaterModal]);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 max-sm:bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-30 flex flex-col items-center gap-3 max-sm:gap-2">
      {/* Main water button */}
      <motion.button
        onClick={handleWater}
        disabled={cooldown}
        className="relative group"
        whileHover={{ scale: cooldown ? 1 : 1.06 }}
        whileTap={{ scale: cooldown ? 1 : 0.94 }}
      >
        {/* Ripple rings while watering */}
        <AnimatePresence>
          {isWatering &&
            [0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border border-cyan-400/50"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 2.5 + i * 0.5, opacity: 0 }}
                exit={{}}
                transition={{ duration: 1.2, delay: i * 0.15, ease: "easeOut" }}
              />
            ))}
        </AnimatePresence>

        {/* Outer glow ring */}
        <motion.div
          className="absolute -inset-3 rounded-full"
          animate={{
            boxShadow: cooldown
              ? "0 0 0 0 transparent"
              : "0 0 20px 4px rgba(56, 189, 248, 0.15)",
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />

        {/* Button core */}
        <div
          className={`
            relative w-20 h-20 max-sm:w-[4.25rem] max-sm:h-[4.25rem] rounded-full flex items-center justify-center
            border transition-all duration-300
            ${
              cooldown
                ? "border-white/10 bg-white/5"
                : "border-cyan-400/30 bg-cyan-950/40 hover:bg-cyan-900/50 hover:border-cyan-400/60"
            }
            backdrop-blur-xl shadow-lg
          `}
        >
          <motion.span
            className="text-3xl"
            animate={
              isWatering
                ? { scale: [1, 1.3, 0.9, 1.1, 1], rotate: [-5, 15, -10, 5, 0] }
                : { scale: 1 }
            }
            transition={{ duration: 0.6 }}
          >
            💧
          </motion.span>
        </div>
      </motion.button>

      {/* Label */}
      <motion.div
        className="text-center"
        animate={{ opacity: cooldown ? 0.4 : 0.8 }}
      >
        <p className="text-[10px] uppercase tracking-widest text-cyan-400/60">
          {cooldown ? "growing…" : "water"}
        </p>
      </motion.div>
    </div>
  );
}
