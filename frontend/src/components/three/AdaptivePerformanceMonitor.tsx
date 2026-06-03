"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { usePerformanceStore } from "@/store/usePerformanceStore";
import { useSceneRuntimeStore } from "@/store/useSceneRuntimeStore";
import { runMemoryGuard } from "@/lib/memoryGuard";

/** Samples FPS / frame time and drives adaptive tier + dynamic scale. */
export function AdaptivePerformanceMonitor() {
  const tickFrame = usePerformanceStore((s) => s.tickFrame);
  const setWorldPhase = usePerformanceStore((s) => s.setWorldPhase);
  const initialized = usePerformanceStore((s) => s.initialized);
  const gl = useThree((s) => s.gl);
  const sceneFrozen = useSceneRuntimeStore((s) => s.sceneFrozen);
  const memTick = useRef(0);
  const renderStart = useRef(0);

  useFrame((_, delta) => {
    if (sceneFrozen) return;
    const renderMs = renderStart.current
      ? performance.now() - renderStart.current
      : delta * 1000;
    renderStart.current = performance.now();
    tickFrame(delta, renderMs);
  });

  useEffect(() => {
    if (!initialized) return;
    setWorldPhase(0);
    const advance = () => {
      const max = usePerformanceStore.getState().settings().lazyWorldMaxPhase;
      const cur = usePerformanceStore.getState().worldPhase;
      if (cur < max) {
        usePerformanceStore.getState().setWorldPhase(cur + 1);
        if (cur + 1 < max) schedule();
      }
    };
    const schedule = () => {
      if (typeof requestIdleCallback !== "undefined") {
        requestIdleCallback(() => advance(), { timeout: 800 });
      } else {
        setTimeout(advance, 400);
      }
    };
    schedule();
    const t1 = setTimeout(() => advance(), 600);
    const t2 = setTimeout(() => advance(), 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [initialized, setWorldPhase]);

  useEffect(() => {
    const id = setInterval(() => {
      memTick.current += 1;
      if (memTick.current % 5 === 0) runMemoryGuard(gl);
    }, 12000);
    return () => clearInterval(id);
  }, [gl]);

  return null;
}
