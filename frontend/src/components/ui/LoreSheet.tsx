"use client";

import { motion, AnimatePresence } from "framer-motion";

export const LORE_ITEMS = [
  {
    icon: "🌍",
    accent: "from-violet-500/20 to-cyan-500/10",
    border: "border-violet-400/15",
    text: "This is the world's first mysterious digital plant! It belongs to everyone and if it isn't watered, it will rot and die.",
  },
  {
    icon: "💧",
    accent: "from-cyan-500/20 to-emerald-500/10",
    border: "border-cyan-400/15",
    text: "Every single drop of water makes the plant grow taller and stronger!",
  },
  {
    icon: "✨",
    accent: "from-amber-500/20 to-pink-500/10",
    border: "border-amber-400/15",
    text: "Every 9 drops of water unlock a new transformation!",
  },
] as const;

export function LoreSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[88] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[89] sm:hidden pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="pointer-events-auto flex flex-col w-full max-h-[min(82dvh,560px)] rounded-t-3xl border border-white/10 bg-gradient-to-b from-[#0a1210] to-black shadow-[0_-16px_48px_rgba(0,0,0,0.65)] overflow-hidden pb-[max(1rem,env(safe-area-inset-bottom))]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <div className="px-4 pb-3 flex items-center justify-between border-b border-white/8 shrink-0">
                <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/60">
                  The Secret of Gloobloom
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full border border-white/10 text-white/50 text-sm"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 space-y-2.5 scrollbar-hide">
                {LORE_ITEMS.map((item, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 p-3 rounded-xl border bg-gradient-to-br ${item.accent} ${item.border}`}
                  >
                    <span className="text-lg leading-none mt-0.5 shrink-0">{item.icon}</span>
                    <p className="text-[12px] text-white/70 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
