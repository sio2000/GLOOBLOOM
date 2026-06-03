"use client";

import { motion } from "framer-motion";
import { AudioToggle } from "@/components/ui/AudioToggle";
import { DevPanel } from "@/components/ui/DevPanel";
import { LoreSheet } from "@/components/ui/LoreSheet";
import { useOrganismStore } from "@/store/useOrganismStore";

const MOBILE_UTILITY_BTN =
  "w-full px-2 py-1.5 rounded-lg border backdrop-blur-md text-[8px] uppercase tracking-widest transition-all";

/** Sound, Lore & Dev — stacked top-right on phones (no overlap). */
export function MobileTopUtilityBar() {
  const showLore = useOrganismStore((s) => s.showLoreSheet);
  const setShowLore = useOrganismStore((s) => s.setShowLoreSheet);

  return (
    <>
      <motion.div
        className="fixed top-[max(0.5rem,env(safe-area-inset-top))] right-2 z-40 flex flex-col gap-1.5 w-[4.75rem] sm:hidden pointer-events-auto"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.35 }}
        aria-label="Quick controls"
      >
        <AudioToggle compact />
        <button
          type="button"
          onClick={() => setShowLore(true)}
          className={`${MOBILE_UTILITY_BTN} border-emerald-400/25 bg-emerald-950/40 text-emerald-300/75 hover:border-emerald-400/45`}
          aria-label="About Gloobloom"
        >
          ℹ️ Lore
        </button>
        <DevPanel embedded />
      </motion.div>

      <LoreSheet open={showLore} onClose={() => setShowLore(false)} />
    </>
  );
}
