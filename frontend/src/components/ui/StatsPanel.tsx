"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrganismStore } from "@/store/useOrganismStore";
import {
  getStageName,
  MOOD_DESCRIPTIONS,
} from "@/types/organism";
import { MAX_ECOSYSTEM_STAGE } from "@/lib/stageConstants";
import { getMoodColor, getSeasonColor } from "@/lib/utils";
import { formatPlantHeight, formatPlantWeight, getPlantHeightMeters, getPlantWeightKg } from "@/lib/plantScale";
import { getLifeTier, getVitalityColor } from "@/lib/vitality";
import { LORE_ITEMS } from "@/components/ui/LoreSheet";
import { MobilePanelToggle } from "@/components/ui/MobilePanelToggle";
import { useDeviceInfo } from "@/hooks/useDeviceInfo";

export function StatsPanel() {
  const { isMobile } = useDeviceInfo();
  const state = useOrganismStore((s) => s.state);
  const onlineCount = useOrganismStore((s) => s.onlineCount);
  const expanded = useOrganismStore((s) => s.mobileStatsExpanded);
  const toggleMobilePanel = useOrganismStore((s) => s.toggleMobilePanel);
  const mobileDevOpen = useOrganismStore((s) => s.mobileDevOpen);
  const showLoreSheet = useOrganismStore((s) => s.showLoreSheet);
  const hideMobileSummary = mobileDevOpen || showLoreSheet;

  if (!state) return null;

  const stageName = getStageName(state.ecosystemStage);
  const moodColor = getMoodColor(state.mood);
  const seasonColor = getSeasonColor(state.season);
  const heightMeters = getPlantHeightMeters(state.ecosystemStage, state.growth);
  const heightLabel = formatPlantHeight(heightMeters);
  const weightKg = getPlantWeightKg(state.ecosystemStage, state.growth);
  const weightLabel = formatPlantWeight(weightKg);
  const water = state.hydration;
  const waterTier = getLifeTier(water);
  const waterColor = getVitalityColor(water);

  return (
    <>
      <motion.div
        className={`fixed top-4 left-4 max-sm:top-[max(0.5rem,env(safe-area-inset-top))] max-sm:left-2 max-sm:right-[5.5rem] z-30 w-64 max-sm:w-auto max-sm:max-w-none ${hideMobileSummary ? "max-sm:opacity-0 max-sm:pointer-events-none max-sm:scale-95" : ""}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="rounded-2xl border border-white/5 bg-black/55 backdrop-blur-xl max-sm:backdrop-blur-md mobile-panel-surface p-4 max-sm:p-3 max-sm:space-y-0 space-y-4">
          {/* Mobile — always-visible summary + collapsible details */}
          <div className="sm:hidden">
            <div className="min-w-0">
              <div className="text-[8px] uppercase tracking-widest text-white/30">
                Stage {state.ecosystemStage}/{MAX_ECOSYSTEM_STAGE}
              </div>
              <div className="text-[12px] font-display text-white/90 font-medium leading-tight line-clamp-2">
                {stageName}
              </div>
              <div className="mt-2.5 space-y-2">
                <MiniBar label="Water" value={water} color={waterColor} icon="💧" />
                <MiniBar label="Growth" value={state.growth} color="#4ade80" icon="🌱" />
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 max-sm:animate-pulse sm:hidden" />
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-green-400 hidden sm:block"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-[9px] text-green-400/65">
                  {onlineCount} {onlineCount === 1 ? "soul" : "souls"} online
                </span>
              </div>
            </div>

            <MobilePanelToggle
              variant="bar"
              expanded={expanded}
              onToggle={() => toggleMobilePanel("stats")}
              label={expanded ? "Hide details" : "More organism stats"}
              badge={`${Math.round(water)}%`}
            />

            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  className="overflow-hidden"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: isMobile ? 0.12 : 0.28 }}
                >
                  <div className="pt-3 mt-3 border-t border-white/8 max-h-[min(46dvh,320px)] overflow-y-auto overscroll-contain scrollbar-hide">
                    <MobileStatsAccordion
                      state={state}
                      moodColor={moodColor}
                      seasonColor={seasonColor}
                      heightLabel={heightLabel}
                      weightLabel={weightLabel}
                      onlineCount={onlineCount}
                      water={water}
                      waterColor={waterColor}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Full stats — desktop only */}
          <div className="max-sm:hidden space-y-4">
            <StatsBody
              state={state}
              stageName={stageName}
              moodColor={moodColor}
              seasonColor={seasonColor}
              heightLabel={heightLabel}
              weightLabel={weightLabel}
              onlineCount={onlineCount}
              water={water}
              waterColor={waterColor}
              waterTier={waterTier}
            />
        </div>

        {/* Mood description — desktop only */}
        <motion.div
          key={state.mood}
          className="mt-3 px-3 py-2 rounded-xl bg-black/25 backdrop-blur-md border border-white/5 max-sm:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[11px] italic text-white/40 leading-relaxed">
            {MOOD_DESCRIPTIONS[state.mood]}
          </p>
        </motion.div>

        {/* Lore block — desktop / tablet landscape */}
        <motion.div
          className="mt-5 max-sm:hidden rounded-2xl border border-white/8 bg-gradient-to-b from-black/50 to-black/30 backdrop-blur-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
        >
          <LoreBlock />
        </motion.div>
        </div>
      </motion.div>
    </>
  );
}

function MobileStatsAccordion({
  state,
  moodColor,
  seasonColor,
  heightLabel,
  weightLabel,
  onlineCount,
  water,
  waterColor,
}: {
  state: NonNullable<ReturnType<typeof useOrganismStore.getState>["state"]>;
  moodColor: string;
  seasonColor: string;
  heightLabel: string;
  weightLabel: string;
  onlineCount: number;
  water: number;
  waterColor: string;
}) {
  const [openSection, setOpenSection] = useState<string | null>("environment");

  const toggle = (id: string) =>
    setOpenSection((cur) => (cur === id ? null : id));

  return (
    <div className="space-y-2">
      <AccordionSection
        id="environment"
        title="Environment"
        icon="🌤"
        open={openSection === "environment"}
        onToggle={() => toggle("environment")}
      >
        <Row label="Mood" value={state.mood} color={moodColor} />
        <Row label="Season" value={state.season.replace("_", " ")} color={seasonColor} />
        {state.decay > 5 && (
          <div className="mt-2">
            <StatBar label="Decay" value={state.decay} color="#f87171" icon="🍂" inverted />
          </div>
        )}
        <p className="mt-2 text-[10px] italic text-white/40 leading-relaxed">
          {MOOD_DESCRIPTIONS[state.mood]}
        </p>
      </AccordionSection>

      <AccordionSection
        id="scale"
        title="Scale & progress"
        icon="📐"
        open={openSection === "scale"}
        onToggle={() => toggle("scale")}
      >
        <div className="mb-2 h-1 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${(state.ecosystemStage / MAX_ECOSYSTEM_STAGE) * 100}%`,
              background: `linear-gradient(90deg, ${moodColor}80, ${moodColor})`,
            }}
          />
        </div>
        <Row label="Stage progress" value={`${state.ecosystemStage}/${MAX_ECOSYSTEM_STAGE}`} />
        <Row label="Height" value={heightLabel} color="#6ee7b7" />
        <Row label="Weight" value={weightLabel} color="#fde68a" />
        <Row label="Vitality" value={`${Math.round(water)}%`} color={waterColor} />
      </AccordionSection>

      <AccordionSection
        id="community"
        title="Community"
        icon="👥"
        open={openSection === "community"}
        onToggle={() => toggle("community")}
      >
        <Row label="Waterings" value={state.totalWaterings.toLocaleString()} />
        <Row label="Named leaves" value={(state.leafCount ?? 0).toLocaleString()} color="#4ade80" />
        <Row label="Unique souls" value={(state.uniqueWaterersCount ?? 0).toLocaleString()} color="#67e8f9" />
        <Row label="Online now" value={String(onlineCount)} color="#86efac" />
      </AccordionSection>
    </div>
  );
}

function AccordionSection({
  id,
  title,
  icon,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  icon: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/30 overflow-hidden">
      <button
        type="button"
        id={`stats-section-${id}`}
        aria-expanded={open}
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-white/[0.03] transition-colors"
      >
        <span className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/55">
          <span>{icon}</span>
          {title}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          className="text-[10px] text-white/35"
        >
          ▾
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0 space-y-2 border-t border-white/5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoreBlock() {
  return (
    <>
      <div className="px-3 py-2.5 border-b border-white/5 bg-white/[0.02]">
        <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/55">
          The Secret of Gloobloom
        </span>
      </div>
      <div className="p-3 space-y-2.5">
        {LORE_ITEMS.map((item, i) => (
          <motion.div
            key={i}
            className={`flex gap-3 p-3 rounded-xl border bg-gradient-to-br ${item.accent} ${item.border}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 + i * 0.12 }}
          >
            <span className="text-lg leading-none mt-0.5 shrink-0">{item.icon}</span>
            <p className="text-[11px] text-white/60 leading-relaxed">{item.text}</p>
          </motion.div>
        ))}
      </div>
    </>
  );
}

function StatsBody({
  state,
  stageName,
  moodColor,
  seasonColor,
  heightLabel,
  weightLabel,
  onlineCount,
  water,
  waterColor,
  compact = false,
}: {
  state: NonNullable<ReturnType<typeof useOrganismStore.getState>["state"]>;
  stageName: string;
  moodColor: string;
  seasonColor: string;
  heightLabel: string;
  weightLabel: string;
  onlineCount: number;
  water: number;
  waterColor: string;
  waterTier?: ReturnType<typeof getLifeTier>;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "space-y-2.5" : "space-y-4"}>
      <div>
        <div className="text-[9px] uppercase tracking-widest text-white/30 mb-1">
          Stage {state.ecosystemStage} / {MAX_ECOSYSTEM_STAGE}
        </div>
        <div className={`font-display text-white/90 font-medium ${compact ? "text-xs" : "text-sm"}`}>
          {stageName}
        </div>
        <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${moodColor}80, ${moodColor})`,
            }}
            animate={{
              width: `${(state.ecosystemStage / MAX_ECOSYSTEM_STAGE) * 100}%`,
            }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      <StatBar label="Water" value={water} color={waterColor} icon="💧" />
      <StatBar label="Growth" value={state.growth} color="#4ade80" icon="🌱" />

      {state.decay > 5 && (
        <StatBar label="Decay" value={state.decay} color="#f87171" icon="🍂" inverted />
      )}

      <div className="pt-1 border-t border-white/5 space-y-2">
        <Row label="Mood" value={state.mood} color={moodColor} />
        <Row label="Season" value={state.season.replace("_", " ")} color={seasonColor} />
        <Row label="📏 Height" value={heightLabel} color="#6ee7b7" />
        <Row label="⚖️ Weight" value={weightLabel} color="#fde68a" />
        <Row label="Waterings" value={state.totalWaterings.toLocaleString()} />
        <Row label="🍃 Named Leaves" value={(state.leafCount ?? 0).toLocaleString()} color="#4ade80" />
        <Row label="👤 Unique Souls" value={(state.uniqueWaterersCount ?? 0).toLocaleString()} color="#67e8f9" />
      </div>

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
  );
}

function Row({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] uppercase tracking-wider text-white/30">{label}</span>
      <span className="text-xs font-medium tabular-nums truncate" style={color ? { color } : undefined}>
        {value}
      </span>
    </div>
  );
}

function MiniBar({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[8px] text-white/40">
          {icon} {label}
        </span>
        <span className="text-[8px] text-white/50 tabular-nums">{Math.round(value)}%</span>
      </div>
      <div className="h-1 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(value, 100)}%`,
            background: `linear-gradient(90deg, ${color}90, ${color})`,
          }}
        />
      </div>
    </div>
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
          <span className="text-[10px] uppercase tracking-wider text-white/35">{label}</span>
        </div>
        <span className="text-[10px] text-white/40">{Math.round(value)}%</span>
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
