"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/** Loading screen exit fade is 1.5s — wait that out, then +0.5s gap before splash */
const SPLASH_ENTER_DELAY_MS = 2000;
const SPLASH_VISIBLE_MS = 4000;

export function TitleSplash({ show }: { show: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) {
      setVisible(false);
      return;
    }

    const enterTimer = setTimeout(() => setVisible(true), SPLASH_ENTER_DELAY_MS);
    const hideTimer = setTimeout(
      () => setVisible(false),
      SPLASH_ENTER_DELAY_MS + SPLASH_VISIBLE_MS
    );

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(hideTimer);
    };
  }, [show]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[15] pointer-events-none flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <motion.div
            className="text-center px-6 py-8 max-sm:px-5 max-sm:py-6 max-sm:mx-4 rounded-3xl border border-white/15 bg-black/30 backdrop-blur-md shadow-[0_0_100px_rgba(100,255,150,0.18)]"
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.05, y: -10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <h1 className="font-display text-4xl max-sm:text-[2rem] sm:text-6xl md:text-7xl font-bold tracking-[0.22em] max-sm:tracking-[0.14em] text-white/85 drop-shadow-[0_0_40px_rgba(255,255,255,0.35)]">
              GLOOBLOOM
            </h1>
            <p className="text-xs max-sm:text-[10px] sm:text-sm md:text-base tracking-[0.2em] max-sm:tracking-[0.12em] text-emerald-200/85 mt-4 max-sm:mt-3 uppercase font-semibold drop-shadow-[0_0_20px_rgba(120,255,180,0.35)]">
              The internet grows a dream
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
