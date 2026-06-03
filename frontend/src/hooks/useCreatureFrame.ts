import { useRef } from "react";
import { useFrame, type RootState } from "@react-three/fiber";
import { usePerformanceStore } from "@/store/usePerformanceStore";

/** Throttled updates for flying creatures — real-time clock (not plant animTimeScale). */
export function useCreatureFrame(
  callback: (state: RootState, delta: number) => void
) {
  const counter = useRef(0);
  const accumDelta = useRef(0);

  useFrame((state, delta) => {
    const frameSkip = usePerformanceStore.getState().settings().creatureFrameSkip;
    accumDelta.current += delta;
    counter.current += 1;
    if (counter.current % frameSkip !== 0) return;

    const d = accumDelta.current;
    accumDelta.current = 0;
    callback(state, d);
  });
}
