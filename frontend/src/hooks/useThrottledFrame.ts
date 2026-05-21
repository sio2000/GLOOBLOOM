import { useRef } from "react";
import { useFrame, type RootState } from "@react-three/fiber";
import { usePerformanceStore } from "@/store/usePerformanceStore";

/** Runs callback every N frames based on current quality tier */
export function useThrottledFrame(
  callback: (state: RootState, delta: number) => void
) {
  const frameSkip = usePerformanceStore((s) => s.settings().frameSkip);
  const counter = useRef(0);

  useFrame((state, delta) => {
    counter.current += 1;
    if (counter.current % frameSkip !== 0) return;
    callback(state, delta);
  });
}
