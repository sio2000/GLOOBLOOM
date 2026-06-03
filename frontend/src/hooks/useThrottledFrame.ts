import { useRef } from "react";
import { useFrame, type RootState } from "@react-three/fiber";
import { usePerformanceStore } from "@/store/usePerformanceStore";
import { withAnimClock } from "@/lib/animClock";
import { shouldRunAnimationFrames, requestSceneRender } from "@/lib/sceneRuntime";

/** Runs callback every N frames with scaled animation clock based on quality tier */
export function useThrottledFrame(
  callback: (state: RootState, delta: number) => void
) {
  const counter = useRef(0);
  const accumDelta = useRef(0);

  useFrame((state, delta) => {
    if (!shouldRunAnimationFrames()) return;
    const { frameSkip, animTimeScale, mobileStatic } =
      usePerformanceStore.getState().settings();
    if (mobileStatic || frameSkip >= 999 || animTimeScale <= 0) return;
    accumDelta.current += delta;
    counter.current += 1;
    if (counter.current % frameSkip !== 0) return;

    const scaledDelta = accumDelta.current * animTimeScale;
    accumDelta.current = 0;
    callback(withAnimClock(state, animTimeScale), scaledDelta);
    if (usePerformanceStore.getState().demandMode) requestSceneRender();
  });
}
