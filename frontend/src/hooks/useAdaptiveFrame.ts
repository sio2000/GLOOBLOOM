import { useFrame, type RootState } from "@react-three/fiber";
import { getAnimTimeScale, withAnimClock } from "@/lib/animClock";

/** useFrame with hardware-adaptive animation speed — counts unchanged, motion scales down on weak devices. */
export function useAdaptiveFrame(
  callback: (state: RootState, delta: number) => void
) {
  useFrame((state, delta) => {
    const scale = getAnimTimeScale();
    callback(withAnimClock(state, scale), delta * scale);
  });
}
