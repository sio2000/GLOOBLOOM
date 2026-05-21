"use client";

import { motion } from "framer-motion";
import { useOrganismStore } from "@/store/useOrganismStore";
import { SEASON_DESCRIPTIONS } from "@/types/organism";
import { getSeasonColor } from "@/lib/utils";

const SEASON_ICONS: Record<string, string> = {
  bloom: "🌸",
  mist: "🌫️",
  golden_decay: "🍂",
  neon_rain: "⚡",
};

export function SeasonIndicator() {
  const state = useOrganismStore((s) => s.state);
  if (!state) return null;

  const season = state.season;
  const color = getSeasonColor(season);
  const icon = SEASON_ICONS[season] ?? "🌿";
  const desc = SEASON_DESCRIPTIONS[season];

  return (
    <motion.div
      className="fixed top-4 right-4 max-sm:top-[max(0.5rem,env(safe-area-inset-top))] max-sm:right-2 z-30"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.2 }}
    >
      <div className="rounded-2xl border border-white/5 bg-black/35 backdrop-blur-xl px-4 py-3 max-sm:px-2.5 max-sm:py-2 max-w-[160px] max-sm:max-w-[7.5rem]">
        <div className="flex items-center gap-2 mb-1">
          <motion.span
            className="text-base"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity, repeatType: "loop" }}
          >
            {icon}
          </motion.span>
          <span
            className="text-[10px] uppercase tracking-wider font-medium"
            style={{ color }}
          >
            {season.replace("_", " ")}
          </span>
        </div>
        <p className="text-[9px] text-white/25 leading-relaxed">{desc}</p>
      </div>

      {/* Mutation level */}
      {state.mutationLevel > 0 && (
        <div className="mt-2 rounded-xl border border-violet-400/10 bg-black/25 backdrop-blur-md px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">✨</span>
            <span className="text-[9px] uppercase tracking-wider text-violet-400/60">
              Mutation {state.mutationLevel}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
