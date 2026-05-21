"use client";

import { motion } from "framer-motion";
import { useOrganismStore } from "@/store/useOrganismStore";

export function NameLeafButton() {
  // Opens the dedicated leaf modal — completely separate from the water modal
  const setShowLeafModal = useOrganismStore((s) => s.setShowLeafModal);

  return (
    <motion.button
      className="fixed bottom-8 right-4 max-sm:bottom-[calc(max(6.5rem,env(safe-area-inset-bottom)+5.5rem))] max-sm:right-2 z-30 flex flex-col items-center gap-1.5 group"
      onClick={() => setShowLeafModal(true)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.5 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="w-14 h-14 max-sm:w-12 max-sm:h-12 rounded-full border border-green-400/20 bg-green-950/30 backdrop-blur-xl flex items-center justify-center hover:border-green-400/40 transition-all">
        <motion.span
          className="text-2xl select-none"
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, repeatType: "loop" }}
        >
          🍃
        </motion.span>
      </div>
      <span className="text-[9px] uppercase tracking-widest text-green-400/40 group-hover:text-green-400/70 transition-colors">
        name leaf
      </span>
    </motion.button>
  );
}
