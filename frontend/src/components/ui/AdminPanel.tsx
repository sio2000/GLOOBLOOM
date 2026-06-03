"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrganismStore } from "@/store/useOrganismStore";
import { api } from "@/lib/api";
import { Season } from "@/types/organism";

const SEASONS: Season[] = ["bloom", "mist", "golden_decay", "neon_rain"];

export function AdminPanel() {
  const show = useOrganismStore((s) => s.showAdminPanel);
  const setShow = useOrganismStore((s) => s.setShowAdminPanel);
  const setState = useOrganismStore((s) => s.setState);
  const [loading, setLoading] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const run = async (name: string, fn: () => Promise<unknown>) => {
    setLoading(name);
    try {
      await fn();
      setLog((l) => [`✓ ${name}`, ...l].slice(0, 8));
    } catch (e) {
      setLog((l) => [`✗ ${name} failed`, ...l].slice(0, 8));
    } finally {
      setLoading(null);
    }
  };

  const actions = [
    {
      id: "reset",
      label: "Reset Ecosystem",
      icon: "🔄",
      action: () => run("reset", () => api.admin.reset().then(setState)),
    },
    {
      id: "mutate",
      label: "Force Mutation",
      icon: "✨",
      action: () => run("mutate", () => api.admin.mutate().then(setState)),
    },
    {
      id: "decay",
      label: "Accelerate Decay",
      icon: "🍂",
      action: () => run("decay", () => api.admin.decay().then(setState)),
    },
    {
      id: "creatures",
      label: "Spawn Creatures",
      icon: "🦋",
      action: () => run("creatures", () => api.admin.spawnCreatures()),
    },
    {
      id: "bloom",
      label: "Trigger Bloom",
      icon: "🌸",
      action: () => run("bloom", () => api.admin.bloom()),
    },
  ];

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShow(false)}
          />
          <motion.div
            className="fixed right-4 top-16 max-sm:inset-x-2 max-sm:top-auto max-sm:bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 w-72 max-sm:w-auto"
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30 }}
          >
            <div className="rounded-2xl border border-violet-400/20 bg-black/70 backdrop-blur-2xl p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-violet-400">⚙️</span>
                  <span className="text-sm text-violet-300 font-medium">
                    Admin Console
                  </span>
                </div>
                <button
                  onClick={() => setShow(false)}
                  className="text-white/30 hover:text-white/60 text-lg"
                >
                  ×
                </button>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {actions.map((a) => (
                  <button
                    key={a.id}
                    onClick={a.action}
                    disabled={loading !== null}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/5 bg-white/3 hover:bg-white/6 hover:border-white/10 transition-all text-left disabled:opacity-50"
                  >
                    <span className="text-base">{a.icon}</span>
                    <span className="text-xs text-white/60">{a.label}</span>
                    {loading === a.id && (
                      <motion.div
                        className="ml-auto w-3 h-3 rounded-full border border-violet-400 border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Season picker */}
              <div className="mt-4">
                <p className="text-[9px] uppercase tracking-widest text-white/25 mb-2">
                  Set Season
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {SEASONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => run(`season:${s}`, () => api.admin.setSeason(s))}
                      className="py-1.5 px-2 rounded-lg border border-white/5 bg-white/3 hover:bg-white/6 text-[10px] text-white/40 hover:text-white/70 transition-all"
                    >
                      {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Log */}
              {log.length > 0 && (
                <div className="mt-4 space-y-1">
                  {log.map((entry, i) => (
                    <p key={i} className="text-[9px] text-white/25 font-mono">
                      {entry}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
