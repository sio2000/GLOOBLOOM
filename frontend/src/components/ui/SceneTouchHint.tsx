"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDeviceInfo } from "@/hooks/useDeviceInfo";

const STORAGE_KEY = "gloobloom-touch-hint-seen";

export function SceneTouchHint() {
  const { isTouch, isMobile } = useDeviceInfo();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isTouch || !isMobile) return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      /* private mode */
    }
    const t = setTimeout(() => setVisible(true), 2400);
    const hide = setTimeout(() => {
      setVisible(false);
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
    }, 7000);
    return () => {
      clearTimeout(t);
      clearTimeout(hide);
    };
  }, [isTouch, isMobile]);

  if (!isTouch || !isMobile) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed left-1/2 -translate-x-1/2 z-[25] pointer-events-none px-4 max-sm:top-[42%] sm:top-[38%]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35 }}
        >
          <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl px-4 py-3 text-center shadow-lg">
            <p className="text-[11px] text-white/55 tracking-wide leading-relaxed">
              <span className="text-emerald-300/80">Drag</span> to orbit ·{" "}
              <span className="text-cyan-300/80">Pinch</span> to zoom
            </p>
            <p className="text-[9px] text-white/30 mt-1 uppercase tracking-widest">
              Use arrows on the right to climb the trunk
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
