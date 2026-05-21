"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useOrganismStore } from "@/store/useOrganismStore";
import { formatTimeAgo, getActivityIcon, truncateUsername } from "@/lib/utils";
import { ActivityEntry } from "@/types/organism";

const ENTRY_COLORS: Record<string, string> = {
  watering: "text-cyan-400/70",
  bloom: "text-pink-400/70",
  mutation: "text-violet-400/70",
  decay: "text-amber-500/60",
  creature: "text-green-400/70",
  season: "text-indigo-400/70",
  milestone: "text-yellow-400/70",
  rare_event: "text-rose-400/80",
};

function FeedEntry({ entry }: { entry: ActivityEntry }) {
  const color = ENTRY_COLORS[entry.type] ?? "text-white/40";
  const icon = getActivityIcon(entry.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, y: -5 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex items-start gap-2 py-1.5"
    >
      <span className="text-sm flex-shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className={`text-[11px] leading-snug ${color}`}>
          {entry.message}
        </p>
        <p className="text-[9px] text-white/20 mt-0.5">
          {formatTimeAgo(entry.createdAt)}
        </p>
      </div>
    </motion.div>
  );
}

export function ActivityFeed() {
  const activities = useOrganismStore((s) => s.activities);

  return (
    <motion.div
      className="fixed bottom-8 right-4 max-sm:bottom-[calc(max(6.5rem,env(safe-area-inset-bottom)+5.5rem))] max-sm:left-2 max-sm:right-auto z-30 w-64 max-sm:w-[10.5rem]"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1 }}
    >
      <div className="rounded-2xl border border-white/5 bg-black/35 backdrop-blur-xl overflow-hidden">
        <div className="px-3 py-2 border-b border-white/5">
          <span className="text-[9px] uppercase tracking-widest text-white/25">
            Live Feed
          </span>
        </div>

        <div className="px-3 py-1 max-h-52 max-sm:max-h-28 overflow-y-auto scrollbar-hide divide-y divide-white/[0.03]">
          <AnimatePresence initial={false} mode="popLayout">
            {activities.slice(0, 12).map((entry) => (
              <FeedEntry key={entry.id} entry={entry} />
            ))}
          </AnimatePresence>

          {activities.length === 0 && (
            <p className="text-[10px] text-white/20 py-3 text-center italic">
              The organism waits…
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
