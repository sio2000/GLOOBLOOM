/** Central rules for mobile 3D runtime — used by frame hooks and Canvas. */

import { usePerformanceStore } from "@/store/usePerformanceStore";
import { useSceneRuntimeStore } from "@/store/useSceneRuntimeStore";
import { useOrganismStore } from "@/store/useOrganismStore";

const MOBILE_RENDER_MIN_MS = 95;
const MOBILE_INTERACT_RENDER_MIN_MS = 150;
let lastMobileRenderMs = 0;
let mobileRenderTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Each demand-render redraws the whole scene, which gets much heavier past
 * stage 100. Stretching the minimum gap between renders (a few fps) at high
 * stages cuts that per-frame GPU cost without touching the plant or any
 * creature behaviour — the scene just refreshes slightly less often.
 */
function highStageRenderRelaxMs(): number {
  const stage = useOrganismStore.getState().state?.ecosystemStage ?? 1;
  if (stage >= 300) return 70;
  if (stage >= 200) return 50;
  if (stage >= 150) return 35;
  if (stage >= 100) return 22;
  return 0;
}

export function isDemandMode(): boolean {
  const perf = usePerformanceStore.getState();
  return perf.isMobile && perf.demandMode;
}

export function isCameraInteracting(): boolean {
  return useSceneRuntimeStore.getState().isCameraInteracting;
}

/** Plant / lighting animation hooks — respects mobileStatic freeze. */
export function shouldRunAnimationFrames(): boolean {
  const rt = useSceneRuntimeStore.getState();
  if (rt.sceneFrozen) return false;
  if (rt.isScrolling) return false;
  if (rt.uiInteracting) return false;
  if (rt.isCameraInteracting) return false;

  const perf = usePerformanceStore.getState();
  if (perf.settings().mobileStatic) return false;

  return rt.animationPumpActive;
}

/** Creature hooks — paused while the user pans/zooms the camera. */
export function shouldRunCreatureFrames(): boolean {
  const rt = useSceneRuntimeStore.getState();
  if (rt.sceneFrozen) return false;
  if (rt.isScrolling) return false;
  if (rt.uiInteracting) return false;
  if (rt.isCameraInteracting) return false;

  const { enableCreatures, enableGiantInsects, creatureFrameSkip } =
    usePerformanceStore.getState().settings();
  if (!enableCreatures && !enableGiantInsects) return false;
  if (creatureFrameSkip >= 999) return false;

  return true;
}

function flushRender() {
  const inv = useSceneRuntimeStore.getState().invalidate;
  if (!inv) return;
  lastMobileRenderMs = performance.now();
  if (mobileRenderTimer) {
    clearTimeout(mobileRenderTimer);
    mobileRenderTimer = null;
  }
  inv();
}

/** Request a demand-mode render (throttled on mobile during camera moves). */
export function requestSceneRender(force = false): void {
  const inv = useSceneRuntimeStore.getState().invalidate;
  if (!inv) return;

  const mobile = usePerformanceStore.getState().isMobile;
  if (!mobile || force) {
    flushRender();
    return;
  }

  const relax = highStageRenderRelaxMs();
  const minMs =
    (isCameraInteracting()
      ? MOBILE_INTERACT_RENDER_MIN_MS
      : MOBILE_RENDER_MIN_MS) + relax;
  const now = performance.now();
  const elapsed = now - lastMobileRenderMs;

  if (elapsed >= minMs) {
    flushRender();
    return;
  }

  if (mobileRenderTimer) return;
  mobileRenderTimer = setTimeout(() => {
    mobileRenderTimer = null;
    flushRender();
  }, minMs - elapsed);
}

export function beginCameraInteraction(): void {
  const rt = useSceneRuntimeStore.getState();
  if (rt.isCameraInteracting) return;
  rt.setCameraInteracting(true);
}

export function endCameraInteraction(delayMs = 140): void {
  if (useSceneRuntimeStore.getState().cameraInteractionEndTimer) {
    clearTimeout(useSceneRuntimeStore.getState().cameraInteractionEndTimer!);
  }
  const timer = setTimeout(() => {
    useSceneRuntimeStore.getState().setCameraInteracting(false);
    useSceneRuntimeStore.getState().setCameraInteractionEndTimer(null);
    requestSceneRender(true);
  }, delayMs) as ReturnType<typeof setTimeout>;
  useSceneRuntimeStore.getState().setCameraInteractionEndTimer(timer);
}
