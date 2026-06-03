"use client";

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrganismStore } from "@/store/useOrganismStore";
import { usePayments } from "@/hooks/usePayments";
import { priceFor } from "@/lib/payments";

export function WateringButton() {
  const { paymentsRequired, checkoutLoading } = usePayments();
  const username = useOrganismStore((s) => s.username);
  const isWatering = useOrganismStore((s) => s.isWatering);
  const cooldown = useOrganismStore((s) => s.wateringCooldown);
  const setShowWaterModal = useOrganismStore((s) => s.setShowWaterModal);

  const handleWater = useCallback(() => {
    if (cooldown || checkoutLoading) return;
    setShowWaterModal(true);
  }, [cooldown, checkoutLoading, setShowWaterModal]);

  const label = cooldown
    ? "cooldown…"
    : paymentsRequired
      ? priceFor("water")
      : "water";

  return (
    <div className="flex flex-col items-center gap-3 max-sm:gap-2">
      <motion.button
        onClick={handleWater}
        disabled={cooldown || checkoutLoading}
        className="relative group"
        whileHover={{ scale: cooldown ? 1 : 1.06 }}
        whileTap={{ scale: cooldown ? 1 : 0.94 }}
        aria-label="Water the organism"
      >
        <AnimatePresence>
          {isWatering &&
            [0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border border-cyan-400/50"
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 2.5 + i * 0.5, opacity: 0 }}
                exit={{}}
                transition={{ duration: 1.2, delay: i * 0.15, ease: "easeOut" }}
              />
            ))}
        </AnimatePresence>

        <motion.div
          className="absolute -inset-3 rounded-full"
          animate={{
            boxShadow: cooldown
              ? "0 0 0 0 transparent"
              : "0 0 20px 4px rgba(56, 189, 248, 0.15)",
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />

        <div
          className={`
            relative w-20 h-20 max-sm:w-[4.25rem] max-sm:h-[4.25rem] rounded-full flex items-center justify-center
            border transition-all duration-300
            ${
              cooldown
                ? "border-white/10 bg-white/5"
                : "border-cyan-400/30 bg-cyan-950/40 hover:bg-cyan-900/50 hover:border-cyan-400/60"
            }
            backdrop-blur-xl shadow-lg
          `}
        >
          <motion.span
            className="text-3xl"
            animate={
              isWatering
                ? { scale: [1, 1.3, 0.9, 1.1, 1], rotate: [-5, 15, -10, 5, 0] }
                : { scale: 1 }
            }
            transition={{ duration: 0.6 }}
          >
            💧
          </motion.span>
        </div>
      </motion.button>

      <motion.div className="text-center" animate={{ opacity: cooldown ? 0.4 : 0.8 }}>
        <p className="text-[10px] uppercase tracking-widest text-cyan-400/60">{label}</p>
        {paymentsRequired && !cooldown && (
          <p className="text-[8px] text-white/25 mt-0.5">per watering</p>
        )}
        {!paymentsRequired && !cooldown && username && (
          <p className="text-[8px] text-white/25 mt-0.5">tap to choose amount</p>
        )}
      </motion.div>
    </div>
  );
}
