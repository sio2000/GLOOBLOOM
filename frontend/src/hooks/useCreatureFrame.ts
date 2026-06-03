import { useRef } from "react";
import { useFrame, type RootState } from "@react-three/fiber";
import { usePerformanceStore } from "@/store/usePerformanceStore";
import { shouldRunAnimationFrames, requestSceneRender } from "@/lib/sceneRuntime";

/** Throttled updates for flying creatures — real-time clock (not plant animTimeScale). */
export function useCreatureFrame(
  callback: (state: RootState, delta: number) => void
) {
  const counter = useRef(0);
  const accumDelta = useRef(0);

  useFrame((state, delta) => {
    if (!shouldRunAnimationFrames()) return;
    const { creatureFrameSkip, enableCreatures } =
      usePerformanceStore.getState().settings();
    if (!enableCreatures || creatureFrameSkip >= 999) return;

    const frameSkip = creatureFrameSkip;
    accumDelta.current += delta;
    counter.current += 1;
    if (counter.current % frameSkip !== 0) return;

    const d = accumDelta.current;
    accumDelta.current = 0;
    callback(state, d);
    if (usePerformanceStore.getState().demandMode) requestSceneRender();
  });
}
