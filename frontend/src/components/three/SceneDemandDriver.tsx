"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { usePerformanceStore } from "@/store/usePerformanceStore";
import { useSceneRuntimeStore } from "@/store/useSceneRuntimeStore";
import { shouldRunAnimationFrames } from "@/lib/sceneRuntime";

/** Mobile demand frameloop: invalidate only when the scene must move. */
export function SceneDemandDriver() {
  const invalidate = useThree((s) => s.invalidate);
  const demandMode = usePerformanceStore((s) => s.demandMode);
  const sceneFrozen = useSceneRuntimeStore((s) => s.sceneFrozen);
  const isScrolling = useSceneRuntimeStore((s) => s.isScrolling);
  const pumpActive = useSceneRuntimeStore((s) => s.animationPumpActive);
  const ultraLow = usePerformanceStore((s) => s.ultraLow);
  const rafRef = useRef<number>(0);
  const lastTick = useRef(0);

  useEffect(() => {
    useSceneRuntimeStore.getState().registerInvalidate(invalidate);
    return () => useSceneRuntimeStore.getState().registerInvalidate(() => {});
  }, [invalidate]);

  useEffect(() => {
    if (!demandMode) return;
    invalidate();
  }, [demandMode, sceneFrozen, isScrolling, invalidate]);

  useEffect(() => {
    if (!demandMode || sceneFrozen || isScrolling) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      return;
    }

    const mobileStatic = usePerformanceStore.getState().settings().mobileStatic;
    if (mobileStatic) {
      invalidate();
      return;
    }

    const tier = usePerformanceStore.getState().tier;
    const targetFps = ultraLow
      ? 12
      : tier === "low" || tier === "ultra_low"
        ? 18
        : pumpActive
          ? tier === "ultra" || tier === "high"
            ? 60
            : 30
          : 0;
    if (targetFps <= 0) return;

    const interval = 1000 / targetFps;

    const loop = (now: number) => {
      if (now - lastTick.current >= interval && shouldRunAnimationFrames()) {
        lastTick.current = now;
        invalidate();
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [demandMode, sceneFrozen, isScrolling, pumpActive, ultraLow, invalidate]);

  return null;
}
