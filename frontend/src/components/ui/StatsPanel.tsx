"use client";

import { motion } from "framer-motion";
import { useOrganismStore } from "@/store/useOrganismStore";
import {
  ECOSYSTEM_STAGE_NAMES,
  MOOD_DESCRIPTIONS,
  SEASON_DESCRIPTIONS,
} from "@/types/organism";
import { getMoodColor, getSeasonColor } from "@/lib/utils";

export function StatsPanel() {
  const state = useOrganismStore((s) => s.state);
  const onlineCount = useOrganismStore((s) => s.onlineCount);

  if (!state) return null;

  const stageName =
    ECOSYSTEM_STAGE_NAMES[state.ecosystemStage] ?? "Unknown";
  const moodColor = getMoodColor(state.mood);
  const seasonColor = getSeasonColor(state.season);

  return (
    <motion.div
      className="fixed top-4 left-4 max-sm:top-[max(0.5rem,env(safe-area-inset-top))] max-sm:left-2 z-30 w-64 max-sm:w-[10.75rem]"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8 }}
    >
      {/* Main stats card */}
      <div className="rounded-2xl border border-white/5 bg-black/40 backdrop-blur-xl p-4 max-sm:p-2.5 space-y-4 max-sm:space-y-2.5">
        {/* Stage */}
        <div>
          <div className="text-[9px] uppercase tracking-widest text-white/30 mb-1">
            Stage {state.ecosystemStage} / 100
          </div>
          <div className="text-sm font-display text-white/90 font-medium">
            {stageName}
          </div>
          <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${moodColor}80, ${moodColor})`,
              }}
              animate={{
                width: `${(state.ecosystemStage / 100) * 100}%`,
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Hydration */}
        <StatBar
          label="Hydration"
          value={state.hydration}
          color="#38bdf8"
          icon="💧"
        />

        {/* Growth */}
        <StatBar
          label="Growth"
          value={state.growth}
          color="#4ade80"
          icon="🌱"
        />

        {/* Decay */}
        {state.decay > 5 && (
          <StatBar
            label="Decay"
            value={state.decay}
            color="#f87171"
            icon="🍂"
            inverted
          />
        )}

        <div className="pt-1 border-t border-white/5 space-y-2">
          {/* Mood */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-white/30">
              Mood
            </span>
            <span
              className="text-xs font-medium"
              style={{ color: moodColor }}
            >
              {state.mood}
            </span>
          </div>

          {/* Season */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-white/30">
              Season
            </span>
            <span
              className="text-xs font-medium"
              style={{ color: seasonColor }}
            >
              {state.season.replace("_", " ")}
            </span>
          </div>

          {/* Waterings */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-white/30">
              Waterings
            </span>
            <span className="text-xs text-white/60">
              {state.totalWaterings.toLocaleString()}
            </span>
          </div>

          {/* Named leaves */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-white/30">
              🍃 Named Leaves
            </span>
            <span className="text-xs text-green-400/70">
              {(state.leafCount ?? 0).toLocaleString()}
            </span>
          </div>

          {/* Unique waterers */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-white/30">
              👤 Unique Souls
            </span>
            <span className="text-xs text-cyan-400/70">
              {(state.uniqueWaterersCount ?? 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Online users */}
        <div className="flex items-center gap-2 pt-1">
          <motion.div
            className="w-2 h-2 rounded-full bg-green-400"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-xs text-green-400/70">
            {onlineCount} {onlineCount === 1 ? "soul" : "souls"} present
          </span>
        </div>
      </div>

      {/* Mood description */}
      <motion.div
        key={state.mood}
        className="mt-2 px-3 py-2 max-sm:px-2 max-sm:py-1.5 rounded-xl bg-black/25 backdrop-blur-md border border-white/5 max-sm:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-[10px] italic text-white/35 leading-relaxed">
          {MOOD_DESCRIPTIONS[state.mood]}
        </p>
      </motion.div>
    </motion.div>
  );
}

function StatBar({
  label,
  value,
  color,
  icon,
  inverted = false,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
  inverted?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">{icon}</span>
          <span className="text-[10px] uppercase tracking-wider text-white/35">
            {label}
          </span>
        </div>
        <span className="text-[10px] text-white/40">
          {Math.round(value)}%
        </span>
      </div>
      <div className="h-1 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: inverted
              ? `linear-gradient(90deg, ${color}40, ${color})`
              : `linear-gradient(90deg, ${color}80, ${color})`,
            boxShadow: `0 0 6px ${color}60`,
          }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
