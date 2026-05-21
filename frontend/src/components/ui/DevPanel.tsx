"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrganismStore } from "@/store/useOrganismStore";
import { useSocket } from "@/hooks/useSocket";
import { api } from "@/lib/api";

/**
 * DevPanel — floating development utility panel.
 * Always visible during development. Toggle with the ⚙ DEV button.
 *
 * Features:
 *  • Reset — calls admin reset API, wipes organism back to stage 1
 *  • Fast Water — fires 8 waterings with 80ms gaps so you can watch growth
 */
export function DevPanel() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const setState = useOrganismStore((s) => s.setState);
  const setIsWatering = useOrganismStore((s) => s.setIsWatering);
  const { water } = useSocket();

  const addLog = (msg: string) =>
    setLog((l) => [msg, ...l].slice(0, 6));

  const handleReset = async () => {
    if (busy) return;
    setBusy("reset");
    try {
      const newState = await api.admin.reset();
      setState(newState);
      addLog("✓ Reset complete");
    } catch {
      addLog("✗ Reset failed — check ADMIN_SECRET");
    } finally {
      setBusy(null);
    }
  };

  const handleFastWater = async () => {
    if (busy) return;
    setBusy("water");
    addLog("⚡ Fast watering ×8…");

    for (let i = 0; i < 8; i++) {
      water("DevTester");
      await new Promise((r) => setTimeout(r, 90));
    }

    setIsWatering(true);
    setTimeout(() => setIsWatering(false), 1000);

    addLog("✓ 8 waterings sent");
    setBusy(null);
  };

  const handleWater50 = async () => {
    if (busy) return;
    setBusy("water50");
    addLog("💧 Dev watering ×50…");

    for (let i = 0; i < 50; i++) {
      water("DevTester");
      await new Promise((r) => setTimeout(r, 80));
    }

    setIsWatering(true);
    setTimeout(() => setIsWatering(false), 1500);

    addLog("✓ 50 waterings sent");
    setBusy(null);
  };

  return (
    <div className="fixed bottom-8 left-4 max-sm:bottom-[max(1.25rem,env(safe-area-inset-bottom))] max-sm:left-2 z-50">
      {/* Toggle button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-1.5 rounded-lg border border-amber-400/20 bg-black/50 text-amber-300/50 text-[9px] tracking-widest uppercase hover:border-amber-400/40 hover:text-amber-300/80 transition-all backdrop-blur-sm"
        whileTap={{ scale: 0.96 }}
      >
        ⚙ dev
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute bottom-10 left-0 w-52 rounded-2xl border border-amber-400/15 bg-black/75 backdrop-blur-2xl p-4 shadow-2xl"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] uppercase tracking-widest text-amber-400/50">
                Dev Tools
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-white/25 hover:text-white/55 text-base leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-2">
              {/* Reset */}
              <motion.button
                onClick={handleReset}
                disabled={!!busy}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-red-500/20 bg-red-950/20 hover:bg-red-950/40 hover:border-red-500/40 text-red-300/70 text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                whileTap={{ scale: 0.97 }}
              >
                {busy === "reset" ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                    className="text-sm"
                  >
                    ⟳
                  </motion.span>
                ) : (
                  <span className="text-sm">🔄</span>
                )}
                Reset Organism
              </motion.button>

              {/* Fast Water */}
              <motion.button
                onClick={handleFastWater}
                disabled={!!busy}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-cyan-500/20 bg-cyan-950/20 hover:bg-cyan-950/40 hover:border-cyan-500/40 text-cyan-300/70 text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                whileTap={{ scale: 0.97 }}
              >
                {busy === "water" ? (
                  <motion.span
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                    className="text-sm"
                  >
                    💧
                  </motion.span>
                ) : (
                  <span className="text-sm">⚡</span>
                )}
                Fast Water ×8
              </motion.button>

              {/* Dev 50 Water */}
              <motion.button
                onClick={handleWater50}
                disabled={!!busy}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-emerald-500/20 bg-emerald-950/20 hover:bg-emerald-950/40 hover:border-emerald-500/40 text-emerald-300/70 text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                whileTap={{ scale: 0.97 }}
              >
                {busy === "water50" ? (
                  <motion.span
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                    className="text-sm"
                  >
                    💧
                  </motion.span>
                ) : (
                  <span className="text-sm">🌊</span>
                )}
                Dev 50 Water
              </motion.button>
            </div>

            {/* Log */}
            {log.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
                {log.map((entry, i) => (
                  <p key={i} className="text-[9px] text-white/25 font-mono leading-snug">
                    {entry}
                  </p>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
