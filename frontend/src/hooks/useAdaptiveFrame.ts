import { useRef } from "react";
import { useFrame, type RootState } from "@react-three/fiber";
import { withAnimClock } from "@/lib/animClock";
import { usePerformanceStore } from "@/store/usePerformanceStore";

/** useFrame with hardware-adaptive animation speed — throttled on weak/mobile devices. */
export function useAdaptiveFrame(
  callback: (state: RootState, delta: number) => void
) {
  const counter = useRef(0);
  const accumDelta = useRef(0);

  useFrame((state, delta) => {
    const { frameSkip, animTimeScale } = usePerformanceStore.getState().settings();
    accumDelta.current += delta;
    counter.current += 1;
    if (frameSkip > 1 && counter.current % frameSkip !== 0) return;

    const scaledDelta = accumDelta.current * animTimeScale;
    accumDelta.current = 0;
    callback(withAnimClock(state, animTimeScale), scaledDelta);
  });
}
