/**
 * Mobile geometry budget.
 *
 * On phones the scene renders in demand mode and re-renders every frame while
 * insects fly. Past a few hundred waterings the plant accumulates a lot of
 * static geometry (crown flowers, branches, leaf clusters) and each re-render
 * gets expensive enough to stutter / freeze weaker devices.
 *
 * These helpers thin out *static decor only* (never named leaves) at high
 * stages so the per-frame cost stays bounded. They are no-ops off mobile.
 */

/** Multiplier (0..1) applied to static decor counts on mobile at high stages. */
export function mobileGeoScale(stage: number, mobileStatic: boolean): number {
  if (!mobileStatic) return 1;
  if (stage < 80) return 1;
  if (stage < 140) return 0.82;
  if (stage < 220) return 0.64;
  if (stage < 300) return 0.5;
  return 0.4;
}

/** Apply the budget to a decor count, keeping at least `min` items. */
export function mobileDecorCount(
  count: number,
  stage: number,
  mobileStatic: boolean,
  min = 1
): number {
  if (!mobileStatic) return count;
  return Math.max(min, Math.round(count * mobileGeoScale(stage, mobileStatic)));
}
