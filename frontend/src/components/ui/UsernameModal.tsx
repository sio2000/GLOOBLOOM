"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrganismStore } from "@/store/useOrganismStore";
import { useSocket } from "@/hooks/useSocket";
import { api } from "@/lib/api";
import { getOrCreateSessionId } from "@/lib/utils";

export function UsernameModal() {
  const show = useOrganismStore((s) => s.showUsernameModal);
  const setShow = useOrganismStore((s) => s.setShowUsernameModal);
  const setUsername = useOrganismStore((s) => s.setUsername);
  const [input, setInput] = useState("");
  const [addLeafMode, setAddLeafMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { water, addLeaf } = useSocket();

  const submit = async () => {
    const name = input.trim();
    if (!name || name.length < 1) return;
    setSubmitting(true);

    const cleanName = name.slice(0, 24);
    setUsername(cleanName);

    if (addLeafMode) {
      addLeaf(cleanName);
    } else {
      water(cleanName);
    }

    setShow(false);
    setSubmitting(false);
    setInput("");
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShow(false)}
          />

          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm rounded-3xl border border-white/10 bg-black/60 backdrop-blur-2xl p-8 shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 20 }}
            >
              {/* Decorative orb */}
              <div className="flex justify-center mb-6">
                <motion.div
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-green-900/60 to-cyan-900/40 border border-green-400/20 flex items-center justify-center"
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <span className="text-3xl">🌿</span>
                </motion.div>
              </div>

              <h2 className="text-center font-display text-xl text-white/90 mb-2">
                Leave your mark
              </h2>
              <p className="text-center text-xs text-white/35 mb-7 leading-relaxed">
                Your name will be woven into the organism — on leaves, in light
              </p>

              <input
                type="text"
                placeholder="your name or alias"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                maxLength={24}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 placeholder-white/20 text-sm outline-none focus:border-green-400/40 focus:ring-1 focus:ring-green-400/20 transition-all"
                autoFocus
              />

              {/* Mode toggle */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setAddLeafMode(false)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all ${
                    !addLeafMode
                      ? "bg-cyan-900/40 border border-cyan-400/30 text-cyan-300"
                      : "text-white/30 border border-white/5"
                  }`}
                >
                  💧 Water
                </button>
                <button
                  onClick={() => setAddLeafMode(true)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all ${
                    addLeafMode
                      ? "bg-green-900/40 border border-green-400/30 text-green-300"
                      : "text-white/30 border border-white/5"
                  }`}
                >
                  🍃 Name a Leaf
                </button>
              </div>

              <motion.button
                onClick={submit}
                disabled={!input.trim() || submitting}
                className="mt-5 w-full py-3 rounded-xl bg-gradient-to-r from-green-900/60 to-cyan-900/50 border border-green-400/20 text-green-300 text-sm font-medium tracking-wide transition-all hover:border-green-400/40 disabled:opacity-40 disabled:cursor-not-allowed"
                whileTap={{ scale: 0.97 }}
              >
                {submitting ? "Connecting…" : addLeafMode ? "Place leaf" : "Water the organism"}
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
