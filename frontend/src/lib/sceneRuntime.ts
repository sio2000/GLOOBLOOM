/** Central rules for mobile 3D runtime — used by frame hooks and Canvas. */

import { usePerformanceStore } from "@/store/usePerformanceStore";
import { useSceneRuntimeStore } from "@/store/useSceneRuntimeStore";

export function isDemandMode(): boolean {
  const perf = usePerformanceStore.getState();
  return perf.isMobile && perf.demandMode;
}

/** All animation useFrame / useCreatureFrame callbacks should bail when false. */
export function shouldRunAnimationFrames(): boolean {
  const perf = usePerformanceStore.getState();
  if (!perf.isMobile) return true;

  const rt = useSceneRuntimeStore.getState();
  if (rt.sceneFrozen) return false;
  if (rt.isScrolling) return false;
  if (rt.uiInteracting) return false;
  if (perf.settings().mobileStatic) return false;

  return rt.animationPumpActive;
}

/** Request a single demand-mode render. */
export function requestSceneRender(): void {
  useSceneRuntimeStore.getState().invalidate?.();
}
