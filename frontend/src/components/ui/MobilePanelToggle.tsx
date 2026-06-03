"use client";

import { motion } from "framer-motion";

export function MobilePanelToggle({
  expanded,
  onToggle,
  label,
  badge,
  variant = "chip",
}: {
  expanded: boolean;
  onToggle: () => void;
  label: string;
  badge?: string | number;
  variant?: "chip" | "bar";
}) {
  if (variant === "bar") {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="sm:hidden w-full mt-2.5 flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-emerald-400/20 bg-emerald-950/25 hover:bg-emerald-950/40 hover:border-emerald-400/35 transition-all"
      >
        <span className="text-[9px] uppercase tracking-[0.14em] text-emerald-300/75 font-medium">
          {label}
        </span>
        <span className="flex items-center gap-1.5 text-[9px] text-white/40">
          {badge !== undefined && (
            <span className="text-emerald-400/80 tabular-nums">{badge}</span>
          )}
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-[11px] leading-none text-emerald-300/60"
          >
            ▾
          </motion.span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="sm:hidden flex items-center gap-1.5 px-2 py-1 rounded-lg border border-white/10 bg-black/50 text-[9px] uppercase tracking-widest text-white/45 hover:text-white/70 transition-colors"
    >
      <motion.span
        animate={{ rotate: expanded ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        className="text-[10px] leading-none"
      >
        ▾
      </motion.span>
      {label}
      {badge !== undefined && (
        <span className="text-emerald-400/70 tabular-nums">{badge}</span>
      )}
    </button>
  );
}
