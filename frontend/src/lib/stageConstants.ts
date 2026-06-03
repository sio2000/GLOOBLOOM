/** Global ecosystem stage limits — 400 total (100 legacy + 300 extended). */

export const MAX_ECOSYSTEM_STAGE = 400;
export const EXTENDED_STAGE_START = 101;
export const LEGACY_MAX_STAGE = 100;

export function clampStage(stage: number): number {
  return Math.min(Math.max(Math.floor(stage), 1), MAX_ECOSYSTEM_STAGE);
}

export function isExtendedStage(stage: number): boolean {
  return stage >= EXTENDED_STAGE_START;
}

/** 0→1 progress through extended tiers (101–400). */
export function extendedStageProgress(stage: number): number {
  if (stage < EXTENDED_STAGE_START) return 0;
  return Math.min(1, (stage - EXTENDED_STAGE_START) / (MAX_ECOSYSTEM_STAGE - EXTENDED_STAGE_START));
}

/** Scale multiplier for creatures / decor in extended stages. */
export function extendedScaleMultiplier(stage: number): number {
  if (!isExtendedStage(stage)) return 1;
  return 1 + extendedStageProgress(stage) * 2.2;
}

/**
 * Remaps stage 101–400 for visual sizing only.
 * At 400, sizes match what legacy formulas produced around stage 230.
 */
export function getVisualStageForSizing(stage: number): number {
  const s = clampStage(stage);
  if (s <= LEGACY_MAX_STAGE) return s;
  const p = extendedStageProgress(s);
  return LEGACY_MAX_STAGE + p * (230 - LEGACY_MAX_STAGE);
}

/**
 * Dampens visible height / meter growth for stages 101–400.
 * Stage still advances per drop; world units & m/km climb much slower.
 * ~1.0 at 101 → ~0.14 at 400 (~7× slower incremental height).
 */
export function extendedHeightDamping(stage: number): number {
  if (stage <= LEGACY_MAX_STAGE) return 1;
  const p = extendedStageProgress(stage);
  return Math.max(0.12, 1 - p * 0.86);
}
