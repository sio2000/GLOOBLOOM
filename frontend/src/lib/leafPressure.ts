/** When many user-named leaves load the GPU, shed insects only — never hide leaves. */

export const LEAF_PRESSURE_COUNT_MOBILE = 28;
export const LEAF_PRESSURE_COUNT_DESKTOP = 55;

export const INSECT_RELIEF_MIN = 0.2;
export const INSECT_RELIEF_STEP_DOWN = 0.12;
export const INSECT_RELIEF_STEP_UP = 0.05;

export function isHeavyLeafLoad(count: number, isMobile: boolean): boolean {
  const threshold = isMobile ? LEAF_PRESSURE_COUNT_MOBILE : LEAF_PRESSURE_COUNT_DESKTOP;
  return count >= threshold;
}

export function shouldReduceInsectsForLeaves(
  snap: { avg: number; dropsBelow45: number; samples: number },
  leafCount: number,
  isMobile: boolean
): boolean {
  if (!isHeavyLeafLoad(leafCount, isMobile)) return false;
  if (snap.samples < 40) return false;
  return snap.avg < 48 || snap.dropsBelow45 >= 6;
}

export function canRestoreInsects(
  snap: { avg: number; samples: number },
  currentScale: number
): boolean {
  if (currentScale >= 1) return false;
  if (snap.samples < 50) return false;
  return snap.avg > 54;
}
