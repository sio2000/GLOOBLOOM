"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrganismStore } from "@/store/useOrganismStore";

const TYPE_STYLES: Record<string, { border: string; text: string; bg: string }> = {
  bloom: {
    border: "border-pink-400/30",
    text: "text-pink-300",
    bg: "bg-pink-950/40",
  },
  mutation: {
    border: "border-violet-400/30",
    text: "text-violet-300",
    bg: "bg-violet-950/40",
  },
  season: {
    border: "border-indigo-400/30",
    text: "text-indigo-300",
    bg: "bg-indigo-950/40",
  },
  rare: {
    border: "border-yellow-400/30",
    text: "text-yellow-300",
    bg: "bg-yellow-950/40",
  },
  info: {
    border: "border-white/10",
    text: "text-white/60",
    bg: "bg-black/40",
  },
};

export function NotificationToast() {
  const notif = useOrganismStore((s) => s.showNotification);
  const clearNotif = useOrganismStore((s) => s.clearNotif);

  useEffect(() => {
    if (!notif) return;
    const timer = setTimeout(clearNotif, 4500);
    return () => clearTimeout(timer);
  }, [notif, clearNotif]);

  const styles = TYPE_STYLES[notif?.type ?? "info"] ?? TYPE_STYLES.info;

  return (
    <div className="fixed top-4 max-sm:top-[max(0.75rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-[90] pointer-events-none px-4 w-full max-w-sm flex justify-center">
      <AnimatePresence mode="popLayout">
        {notif && (
          <motion.div
            key={notif.message}
            className={`px-5 py-3 rounded-2xl border backdrop-blur-xl ${styles.border} ${styles.bg} shadow-xl`}
            initial={{ opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            <p className={`text-xs font-medium tracking-wide ${styles.text}`}>
              {notif.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
