"use client";

import { motion } from "framer-motion";
import { useOrganismStore } from "@/store/useOrganismStore";
import { usePayments } from "@/hooks/usePayments";
import { priceFor } from "@/lib/payments";

export function NameLeafButton() {
  const { paymentsRequired } = usePayments();
  const setShowLeafModal = useOrganismStore((s) => s.setShowLeafModal);

  return (
    <button
      type="button"
      className="relative group flex flex-col items-center gap-3 max-sm:gap-2"
      onClick={() => setShowLeafModal(true)}
      aria-label="Engrave your name on a leaf"
    >
      <motion.div
        className="absolute -inset-3 rounded-full"
        animate={{
          boxShadow: "0 0 20px 4px rgba(74, 222, 128, 0.12)",
          opacity: [0.5, 1, 0.5],
        }}
        transition={{ duration: 2.5, repeat: Infinity }}
      />

      <div className="relative w-20 h-20 max-sm:w-[4.25rem] max-sm:h-[4.25rem] rounded-full border border-green-400/30 bg-green-950/40 backdrop-blur-xl flex items-center justify-center hover:bg-green-900/50 hover:border-green-400/60 transition-all shadow-lg">
        <motion.span
          className="text-3xl select-none"
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, repeatType: "loop" }}
        >
          🍃
        </motion.span>
      </div>
      <span className="text-[10px] uppercase tracking-widest text-green-400/60 group-hover:text-green-400/80 transition-colors">
        {paymentsRequired ? priceFor("leaf") : "name leaf"}
      </span>
      {paymentsRequired && (
        <span className="text-[8px] text-white/25 -mt-1">per leaf</span>
      )}
    </button>
  );
}
