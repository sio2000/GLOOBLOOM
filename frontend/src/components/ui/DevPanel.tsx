"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrganismStore } from "@/store/useOrganismStore";
import { api } from "@/lib/api";
import { ADMIN_SECRET } from "@/lib/constants";
import { getOrCreateSessionId } from "@/lib/utils";
import { CloseButton } from "@/components/ui/CloseButton";

function DevToolsMenu({
  onClose,
  className,
}: {
  onClose: () => void;
  className: string;
}) {
  const setState = useOrganismStore((s) => s.setState);
  const setIsWatering = useOrganismStore((s) => s.setIsWatering);
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog((l) => [msg, ...l].slice(0, 6));

  const handleReset = async () => {
    if (busy) return;
    if (!ADMIN_SECRET) {
      addLog("✗ Set NEXT_PUBLIC_ADMIN_SECRET");
      return;
    }
    setBusy("reset");
    try {
      setState(await api.admin.reset());
      addLog("✓ Reset complete");
    } catch (err) {
      addLog(`✗ ${err instanceof Error ? err.message : "Reset failed"}`);
    } finally {
      setBusy(null);
    }
  };

  const runDevWater = async (count: number, key: string, label: string) => {
    if (busy) return;
    if (!ADMIN_SECRET) {
      addLog("✗ Set NEXT_PUBLIC_ADMIN_SECRET");
      return;
    }
    setBusy(key);
    addLog(`${label}…`);
    try {
      const state = await api.admin.devWater(count, getOrCreateSessionId());
      setState(state);
      setIsWatering(true);
      setTimeout(() => setIsWatering(false), count > 50 ? 2500 : 1000);
      addLog(`✓ ${count} waterings applied`);
    } catch (err) {
      addLog(`✗ ${err instanceof Error ? err.message : "Water failed"}`);
    } finally {
      setBusy(null);
    }
  };

  const btn =
    "w-full flex items-center gap-2.5 px-3 py-3 min-h-[44px] rounded-xl text-xs transition-all disabled:opacity-40 touch-manipulation";

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ type: "spring", damping: 22, stiffness: 280 }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[9px] uppercase tracking-widest text-amber-400/50">
          Dev Tools
        </span>
        <CloseButton onClick={onClose} label="Close dev tools" />
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={handleReset}
          disabled={!!busy}
          className={`${btn} border border-red-500/20 bg-red-950/20 hover:bg-red-950/40 text-red-300/70`}
        >
          {busy === "reset" ? "⟳" : "🔄"} Reset Organism
        </button>
        <button
          type="button"
          onClick={() => runDevWater(8, "water", "⚡ Fast watering ×8")}
          disabled={!!busy}
          className={`${btn} border border-cyan-500/20 bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-300/70`}
        >
          {busy === "water" ? "💧" : "⚡"} Fast Water ×8
        </button>
        <button
          type="button"
          onClick={() => runDevWater(50, "water50", "💧 Dev watering ×50")}
          disabled={!!busy}
          className={`${btn} border border-emerald-500/20 bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-300/70`}
        >
          {busy === "water50" ? "💧" : "🌊"} Dev 50 Water
        </button>
        <button
          type="button"
          onClick={() => runDevWater(300, "water300", "🌊 Dev watering ×300")}
          disabled={!!busy}
          className={`${btn} border border-violet-500/20 bg-violet-950/20 hover:bg-violet-950/40 text-violet-300/70`}
        >
          {busy === "water300" ? "💧" : "🚀"} Dev 300 Water
        </button>
      </div>

      {log.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
          {log.map((entry, i) => (
            <p key={i} className="text-[9px] text-white/25 font-mono leading-snug">
              {entry}
            </p>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function DevPanel({ embedded = false }: { embedded?: boolean }) {
  const mobileOpen = useOrganismStore((s) => s.mobileDevOpen);
  const toggleMobilePanel = useOrganismStore((s) => s.toggleMobilePanel);
  const openMobilePanel = useOrganismStore((s) => s.openMobilePanel);
  const [desktopOpen, setDesktopOpen] = useState(false);

  if (embedded) {
    return (
      <div className="relative w-full">
        <button
          type="button"
          onClick={() => toggleMobilePanel("dev")}
          className="w-full min-h-[44px] px-2 py-2 rounded-lg border border-amber-400/25 bg-black/50 text-amber-300/60 text-[9px] tracking-widest uppercase hover:border-amber-400/45 touch-manipulation"
        >
          ⚙ dev
        </button>
        <AnimatePresence>
          {mobileOpen && (
            <DevToolsMenu
              onClose={() => openMobilePanel(null)}
              className="fixed inset-x-3 top-[max(3.5rem,calc(env(safe-area-inset-top)+2.5rem))] z-[85] max-h-[min(70dvh,420px)] rounded-2xl border border-amber-400/15 bg-black/95 p-4 shadow-2xl overflow-y-auto overscroll-contain"
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="fixed bottom-8 left-4 z-50 max-sm:hidden">
      <button
        type="button"
        onClick={() => setDesktopOpen((v) => !v)}
        className="px-3 py-1.5 rounded-lg border border-amber-400/20 bg-black/50 text-amber-300/50 text-[9px] tracking-widest uppercase"
      >
        ⚙ dev
      </button>
      <AnimatePresence>
        {desktopOpen && (
          <DevToolsMenu
            onClose={() => setDesktopOpen(false)}
            className="absolute bottom-10 left-0 w-52 rounded-2xl border border-amber-400/15 bg-black/75 backdrop-blur-2xl p-4 shadow-2xl"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
