"use client";

import { motion } from "framer-motion";
import { WateringButton } from "@/components/ui/WateringButton";
import { NameLeafButton } from "@/components/ui/NameLeafButton";

interface OrganismActionButtonsProps {
  className?: string;
}

/** Water + leaf buttons share one entrance animation so they appear together. */
export function OrganismActionButtons({ className = "" }: OrganismActionButtonsProps) {
  return (
    <motion.div
      className={`flex items-end justify-center gap-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.5 }}
    >
      <WateringButton />
      <NameLeafButton />
    </motion.div>
  );
}
