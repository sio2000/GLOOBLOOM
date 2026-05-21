"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrganismStore } from "@/store/useOrganismStore";
import { useSocket } from "@/hooks/useSocket";
import { useAudioSystem } from "@/hooks/useAudioSystem";
import { WATERING_COOLDOWN_MS } from "@/lib/constants";

export function WaterModal() {
  const show = useOrganismStore((s) => s.showWaterModal);
  const setShow = useOrganismStore((s) => s.setShowWaterModal);
  const setUsername = useOrganismStore((s) => s.setUsername);
  const setIsWatering = useOrganismStore((s) => s.setIsWatering);
  const setCooldown = useOrganismStore((s) => s.setWateringCooldown);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { water } = useSocket();
  const { playWaterChime, resume } = useAudioSystem();

  const submit = () => {
    const name = input.trim();
    if (!name || submitting) return;
    setSubmitting(true);

    const cleanName = name.slice(0, 24);
    setUsername(cleanName);

    resume();
    setIsWatering(true);
    setCooldown(true);
    playWaterChime();
    water(cleanName);

    setTimeout(() => setIsWatering(false), 1200);
    setTimeout(() => setCooldown(false), WATERING_COOLDOWN_MS);

    setShow(false);
    setSubmitting(false);
    setInput("");
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShow(false)}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm rounded-3xl border border-cyan-500/15 bg-black/65 backdrop-blur-2xl p-8 shadow-2xl"
              initial={{ scale: 0.88, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.88, y: 24 }}
              transition={{ type: "spring", damping: 22, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Orb */}
              <div className="flex justify-center mb-6">
                <motion.div
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-900/60 to-blue-900/40 border border-cyan-400/25 flex items-center justify-center"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity }}
                >
                  <span className="text-3xl select-none">💧</span>
                </motion.div>
              </div>

              <h2 className="text-center font-display text-xl text-white/90 mb-2">
                Water the organism
              </h2>
              <p className="text-center text-xs text-white/35 mb-7 leading-relaxed">
                Every drop nourishes the collective dream
              </p>

              <input
                type="text"
                placeholder="your name or alias"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                maxLength={24}
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 placeholder-white/20 text-sm outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20 transition-all"
              />

              <motion.button
                onClick={submit}
                disabled={!input.trim() || submitting}
                className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-900/60 to-blue-900/50 border border-cyan-400/20 text-cyan-300 text-sm font-medium tracking-wide transition-all hover:border-cyan-400/40 disabled:opacity-40 disabled:cursor-not-allowed"
                whileTap={{ scale: 0.97 }}
              >
                {submitting ? "Watering…" : "💧 Water the organism"}
              </motion.button>

              <button
                onClick={() => setShow(false)}
                className="mt-3 w-full text-[10px] text-white/20 hover:text-white/40 transition-colors"
              >
                watch silently
              </button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
