/** Central rules for mobile 3D runtime — used by frame hooks and Canvas. */

import { usePerformanceStore } from "@/store/usePerformanceStore";
import { useSceneRuntimeStore } from "@/store/useSceneRuntimeStore";

export function isDemandMode(): boolean {
  const perf = usePerformanceStore.getState();
  return perf.isMobile && perf.demandMode;
}

/** Plant / lighting animation hooks — respects mobileStatic freeze. */
export function shouldRunAnimationFrames(): boolean {
  const rt = useSceneRuntimeStore.getState();
  if (rt.sceneFrozen) return false;
  if (rt.isScrolling) return false;
  if (rt.uiInteracting) return false;

  const perf = usePerformanceStore.getState();
  if (perf.settings().mobileStatic) return false;

  return rt.animationPumpActive;
}

/** Creature hooks — animate even when the rest of the scene is static. */
export function shouldRunCreatureFrames(): boolean {
  const rt = useSceneRuntimeStore.getState();
  if (rt.sceneFrozen) return false;
  if (rt.isScrolling) return false;
  if (rt.uiInteracting) return false;

  const { enableCreatures, creatureFrameSkip } =
    usePerformanceStore.getState().settings();
  if (!enableCreatures || creatureFrameSkip >= 999) return false;

  return true;
}

/** Request a single demand-mode render. */
export function requestSceneRender(): void {
  useSceneRuntimeStore.getState().invalidate?.();
}
