"use client";

import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { usePerformanceStore } from "@/store/usePerformanceStore";
import { useSceneRuntimeStore } from "@/store/useSceneRuntimeStore";
import {
  requestSceneRender,
  shouldRunCreatureFrames,
} from "@/lib/sceneRuntime";

/** Mobile demand frameloop: render on demand only — no continuous RAF pump. */
export function SceneDemandDriver() {
  const invalidate = useThree((s) => s.invalidate);
  const demandMode = usePerformanceStore((s) => s.demandMode);
  const mobileStatic = usePerformanceStore((s) => s.settings().mobileStatic);
  const sceneFrozen = useSceneRuntimeStore((s) => s.sceneFrozen);
  const isScrolling = useSceneRuntimeStore((s) => s.isScrolling);
  const idleCreatureRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    useSceneRuntimeStore.getState().registerInvalidate(invalidate);
    return () => useSceneRuntimeStore.getState().registerInvalidate(() => {});
  }, [invalidate]);

  useEffect(() => {
    if (!demandMode) return;
    requestSceneRender(true);
  }, [demandMode, sceneFrozen, isScrolling]);

  useEffect(() => {
    if (!demandMode || sceneFrozen || isScrolling) {
      if (idleCreatureRef.current) {
        clearInterval(idleCreatureRef.current);
        idleCreatureRef.current = null;
      }
      return;
    }

    if (mobileStatic) {
      if (idleCreatureRef.current) clearInterval(idleCreatureRef.current);
      const enableCreatures =
        usePerformanceStore.getState().settings().enableCreatures;
      if (enableCreatures) {
        const ms =
          usePerformanceStore.getState().tier === "ultra_low" ? 6000 : 4500;
        idleCreatureRef.current = setInterval(() => {
          if (useSceneRuntimeStore.getState().isCameraInteracting) return;
          if (!shouldRunCreatureFrames()) return;
          requestSceneRender(true);
        }, ms);
      }
      requestSceneRender(true);
      return () => {
        if (idleCreatureRef.current) clearInterval(idleCreatureRef.current);
      };
    }

    return undefined;
  }, [demandMode, sceneFrozen, isScrolling, mobileStatic]);

  return null;
}
