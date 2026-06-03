import { useRef } from "react";
import { useFrame, type RootState } from "@react-three/fiber";
import { usePerformanceStore } from "@/store/usePerformanceStore";
import { withAnimClock } from "@/lib/animClock";

/** Runs callback every N frames with scaled animation clock based on quality tier */
export function useThrottledFrame(
  callback: (state: RootState, delta: number) => void
) {
  const counter = useRef(0);
  const accumDelta = useRef(0);

  useFrame((state, delta) => {
    const { frameSkip, animTimeScale } = usePerformanceStore.getState().settings();
    accumDelta.current += delta;
    counter.current += 1;
    if (counter.current % frameSkip !== 0) return;

    const scaledDelta = accumDelta.current * animTimeScale;
    accumDelta.current = 0;
    callback(withAnimClock(state, animTimeScale), scaledDelta);
  });
}
