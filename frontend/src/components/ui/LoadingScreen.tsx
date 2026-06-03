"use client";

import { motion, AnimatePresence } from "framer-motion";

interface Props {
  isLoading: boolean;
}

export function LoadingScreen({ isLoading }: Props) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{
            background: "radial-gradient(ellipse at center, #0a0a1a 0%, #030308 70%)",
          }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 1.5, ease: "easeInOut" } }}
        >
          {/* Organism pulse */}
          <div className="relative w-32 h-32 mb-10">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border border-green-400/20"
                animate={{ scale: [1, 2.5, 1], opacity: [0.6, 0, 0.6] }}
                transition={{
                  duration: 3,
                  delay: i * 0.8,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            ))}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-green-900/40 to-purple-900/40 backdrop-blur-sm border border-green-400/30"
              animate={{ scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span
                className="text-4xl"
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                🌿
              </motion.span>
            </div>
          </div>

          <motion.h1
            className="text-2xl max-sm:text-xl sm:text-3xl font-display font-bold tracking-[0.2em] max-sm:tracking-[0.12em] text-green-300/80 mb-3 px-4 text-center"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            GLOOBLOOM
          </motion.h1>

          <motion.p
            className="text-sm text-green-400/40 tracking-widest uppercase"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            The organism is awakening
          </motion.p>

          <div className="mt-10 flex gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-1 h-6 bg-green-500/40 rounded-full"
                animate={{ scaleY: [0.4, 1, 0.4], opacity: [0.3, 0.8, 0.3] }}
                transition={{
                  duration: 1.2,
                  delay: i * 0.15,
                  repeat: Infinity,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
