import type { RootState } from "@react-three/fiber";
import { usePerformanceStore } from "@/store/usePerformanceStore";

/** Current animation time scale from quality tier (and mobile tuning). */
export function getAnimTimeScale(): number {
  return usePerformanceStore.getState().settings().animTimeScale;
}

/** Drop-in clock with elapsed time scaled for adaptive animation speed. */
export function withAnimClock(state: RootState, scale = getAnimTimeScale()): RootState {
  const elapsed = state.clock.elapsedTime * scale;
  return {
    ...state,
    clock: {
      ...state.clock,
      elapsedTime: elapsed,
      getElapsedTime: () => elapsed,
    } as typeof state.clock,
  };
}
