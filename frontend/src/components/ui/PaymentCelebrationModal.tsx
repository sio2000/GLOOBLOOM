"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useOrganismStore } from "@/store/useOrganismStore";
import { getPaymentCelebrationCopy } from "@/lib/paymentSuccess";

const ACCENT_STYLES = {
  cyan: {
    ring: "border-cyan-400/35",
    glow: "shadow-[0_0_60px_rgba(34,211,238,0.25)]",
    btn: "from-cyan-900/70 to-blue-900/50 border-cyan-400/30 text-cyan-100",
    particle: "bg-cyan-400/60",
  },
  green: {
    ring: "border-green-400/35",
    glow: "shadow-[0_0_60px_rgba(74,222,128,0.25)]",
    btn: "from-green-900/70 to-emerald-900/50 border-green-400/30 text-green-100",
    particle: "bg-green-400/60",
  },
  violet: {
    ring: "border-violet-400/35",
    glow: "shadow-[0_0_60px_rgba(167,139,250,0.25)]",
    btn: "from-violet-900/70 to-purple-900/50 border-violet-400/30 text-violet-100",
    particle: "bg-violet-400/60",
  },
};

export function PaymentCelebrationModal() {
  const celebration = useOrganismStore((s) => s.paymentCelebration);
  const clear = useOrganismStore((s) => s.clearPaymentCelebration);

  const copy = celebration
    ? getPaymentCelebrationCopy(
        celebration.action,
        celebration.username,
        celebration.quantity ?? 1
      )
    : null;
  const styles = copy ? ACCENT_STYLES[copy.accent] : ACCENT_STYLES.cyan;

  return (
    <AnimatePresence>
      {celebration && copy && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={clear}
          />
          <motion.div
            className="fixed inset-0 z-[71] flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`relative pointer-events-auto w-full max-w-md rounded-3xl border bg-black/75 backdrop-blur-2xl p-8 text-center overflow-hidden ${styles.ring} ${styles.glow}`}
              initial={{ scale: 0.85, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 12, opacity: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.span
                  key={i}
                  className={`absolute w-1.5 h-1.5 rounded-full ${styles.particle}`}
                  style={{
                    left: `${15 + i * 17}%`,
                    top: `${20 + (i % 3) * 12}%`,
                  }}
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.6, 1.2, 0.6] }}
                  transition={{ duration: 2 + i * 0.2, repeat: Infinity }}
                />
              ))}

              <motion.div
                className="text-5xl mb-4"
                animate={{ scale: [1, 1.12, 1], rotate: [0, 6, -6, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1.5 }}
              >
                {copy.emoji}
              </motion.div>

              <h2 className="font-display text-2xl text-white/95 mb-2">{copy.title}</h2>
              <p className="text-sm text-white/50 leading-relaxed mb-6">{copy.subtitle}</p>

              <motion.button
                type="button"
                onClick={clear}
                className={`w-full py-3.5 rounded-xl bg-gradient-to-r border text-sm font-medium tracking-wide ${styles.btn}`}
                whileTap={{ scale: 0.97 }}
              >
                Continue exploring
              </motion.button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
