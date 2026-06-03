/** Mobile-only performance helpers — no visual/feature changes on desktop. */

import type { QualityTier } from "@/lib/performance";

export const MOBILE_WS_STATE_THROTTLE_MS = 600;
export const MOBILE_WS_LEAVES_THROTTLE_MS = 800;
export const MOBILE_RESIZE_DEBOUNCE_MS = 180;

export function isMobileRuntime(): boolean {
  if (typeof window === "undefined") return false;
  const ua = /Android|iPhone|iPad|iPod|Mobile|webOS/i.test(navigator.userAgent);
  const narrow = Math.min(window.innerWidth, window.innerHeight) < 768;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  return ua || (coarse && narrow);
}

/** Cap expensive SDF Text labels — all leaf meshes still render; only names are skipped. */
export function getMaxNamedLeaves(tier: QualityTier, isPhone: boolean): number {
  if (isPhone) return tier === "low" ? 8 : 18;
  if (tier === "low") return 35;
  if (tier === "medium") return 60;
  return 100;
}

/** Hard cap star sprites on mobile — avoids thousands of points at high stage. */
export function mobileStarCap(base: number, isPhone: boolean): number {
  if (!isMobileRuntime()) return base;
  return isPhone ? Math.min(base, 280) : Math.min(base, 520);
}

export function throttle<T extends (...args: never[]) => void>(
  fn: T,
  ms: number
): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const wrapped = ((...args: Parameters<T>) => {
    lastArgs = args;
    if (timer) return;
    timer = setTimeout(() => {
      timer = null;
      if (lastArgs) fn(...lastArgs);
      lastArgs = null;
    }, ms);
  }) as T & { cancel: () => void };

  wrapped.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    lastArgs = null;
  };

  return wrapped;
}

export function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}
