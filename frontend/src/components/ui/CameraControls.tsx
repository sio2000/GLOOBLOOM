"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useOrganismStore } from "@/store/useOrganismStore";
import { useCameraStore } from "@/store/useCameraStore";
import { getCameraLimits } from "@/lib/plantScale";
import { useDeviceInfo } from "@/hooks/useDeviceInfo";

function ArrowButton({
  label,
  onPress,
  onRelease,
  direction,
}: {
  label: string;
  onPress: () => void;
  onRelease: () => void;
  direction: "up" | "down";
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      className="group relative w-[4.5rem] h-[4.5rem] max-sm:w-[3.25rem] max-sm:h-[3.25rem] rounded-2xl max-sm:rounded-xl flex items-center justify-center overflow-hidden
        border border-emerald-400/25 bg-gradient-to-b from-emerald-950/70 to-black/70
        backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]
        hover:border-emerald-300/45 hover:shadow-[0_8px_40px_rgba(52,211,153,0.15)]
        active:scale-95 transition-all duration-200"
      whileTap={{ scale: 0.93 }}
      onPointerDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      onPointerUp={onRelease}
      onPointerLeave={onRelease}
      onPointerCancel={onRelease}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className="relative text-emerald-200/90 group-hover:text-emerald-100 drop-shadow-[0_0_8px_rgba(110,231,183,0.35)]"
      >
        {direction === "up" ? (
          <path d="M12 4l8 8H4l8-8z" fill="currentColor" />
        ) : (
          <path d="M12 20l-8-8h16l-8 8z" fill="currentColor" />
        )}
      </svg>
    </motion.button>
  );
}

export function CameraControls() {
  const stage = useOrganismStore((s) => s.state?.ecosystemStage ?? 1);
  const growth = useOrganismStore((s) => s.state?.growth ?? 0);
  const device = useDeviceInfo();
  const viewOffsetY = useCameraStore((s) => s.viewOffsetY);
  const nudgeUp = useCameraStore((s) => s.nudgeUp);
  const nudgeDown = useCameraStore((s) => s.nudgeDown);
  const resetView = useCameraStore((s) => s.resetView);

  const limits = getCameraLimits(stage, growth, {
    isMobile: device.isMobile,
    isPortrait: device.isPortrait,
    isPhone: device.isPhone,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRepeat = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startRepeat = useCallback(
    (direction: "up" | "down") => {
      const tick = () => {
        if (direction === "up") nudgeUp(limits.panStep, limits.panRange);
        else nudgeDown(limits.panStep, limits.panRange);
      };
      tick();
      stopRepeat();
      intervalRef.current = setInterval(tick, 100);
    },
    [limits.panRange, limits.panStep, nudgeDown, nudgeUp, stopRepeat]
  );

  useEffect(() => stopRepeat, [stopRepeat]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        nudgeUp(limits.panStep, limits.panRange);
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        nudgeDown(limits.panStep, limits.panRange);
      }
      if (e.key === "Home") resetView();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [limits.panRange, limits.panStep, nudgeDown, nudgeUp, resetView]);

  return (
    <div className="fixed right-5 max-sm:right-1 top-1/2 -translate-y-1/2 z-30 pointer-events-auto max-sm:scale-[0.82] max-sm:origin-center">
      <div
        className="flex flex-col items-center gap-3 max-sm:gap-2 p-3 max-sm:p-2 rounded-3xl max-sm:rounded-2xl
          border border-white/8 bg-black/40 backdrop-blur-2xl
          shadow-[0_12px_48px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)]"
      >
        <ArrowButton
          label="Move view up"
          direction="up"
          onPress={() => startRepeat("up")}
          onRelease={stopRepeat}
        />

        <motion.button
          type="button"
          onClick={resetView}
          title="Center view on plant"
          className="relative w-[5.5rem] h-[3.25rem] max-sm:w-[4rem] max-sm:h-[2.75rem] rounded-2xl max-sm:rounded-xl overflow-hidden
            border border-amber-300/30
            bg-gradient-to-br from-amber-500/25 via-emerald-500/15 to-violet-500/20
            hover:from-amber-400/35 hover:via-emerald-400/25 hover:to-violet-400/30
            hover:border-amber-200/45
            shadow-[0_4px_24px_rgba(251,191,36,0.12),inset_0_1px_0_rgba(255,255,255,0.15)]
            transition-all duration-300 active:scale-95"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.12),transparent_70%)]" />
          <span className="relative flex flex-col items-center justify-center h-full gap-0.5">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-amber-100/80">
              <circle cx="12" cy="12" r="3" fill="currentColor" />
              <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
            </svg>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-100/90">
              Mid
            </span>
          </span>
        </motion.button>

        <ArrowButton
          label="Move view down"
          direction="down"
          onPress={() => startRepeat("down")}
          onRelease={stopRepeat}
        />

        {Math.abs(viewOffsetY) > 0.05 && (
          <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20">
            <p className="text-[10px] text-emerald-300/70 tracking-wide">shifted</p>
          </div>
        )}
      </div>
    </div>
  );
}
