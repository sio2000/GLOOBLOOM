/** Water / hydration % — same tiered drain for life and water (not watered). */

export const LIFE_LOW_THRESHOLD = 30;
export const LIFE_CRITICAL_THRESHOLD = 5;

const MS_PER_MINUTE = 60_000;
const MS_PER_WEEK = 7 * 24 * 60 * 60 * MS_PER_MINUTE;
const MS_PER_TEN_YEARS = 10 * 365.25 * 24 * 60 * 60 * MS_PER_MINUTE;

/** 30% → 5% over one calendar week */
const LOSS_LOW_TO_CRITICAL_PER_MS = 25 / MS_PER_WEEK;

/** 5% → 0% over ten years */
const LOSS_CRITICAL_TO_ZERO_PER_MS = 5 / MS_PER_TEN_YEARS;

/** Tiered water loss: >30% normal, 30→5% in 1 week, 5→0% in 10 years. */
export function waterLossForInterval(currentWater: number, intervalMs: number): number {
  return hydrationLossForInterval(currentWater, intervalMs);
}

export function hydrationLossForInterval(
  currentWater: number,
  intervalMs: number
): number {
  if (currentWater <= 0) return 0;

  let lossPerMs: number;
  if (currentWater > LIFE_LOW_THRESHOLD) {
    const perMinute = parseFloat(process.env.HYDRATION_LOSS_PER_MINUTE ?? "0.5");
    lossPerMs = perMinute / MS_PER_MINUTE;
  } else if (currentWater > LIFE_CRITICAL_THRESHOLD) {
    lossPerMs = LOSS_LOW_TO_CRITICAL_PER_MS;
  } else {
    lossPerMs = LOSS_CRITICAL_TO_ZERO_PER_MS;
  }

  return lossPerMs * intervalMs;
}

export function decayGainForInterval(
  currentWater: number,
  intervalMs: number,
  minutesSinceWatered: number
): number {
  const tickMinutes = intervalMs / MS_PER_MINUTE;
  const idleBonus = minutesSinceWatered > 20 ? 0.15 * (tickMinutes / 1) : 0;

  if (currentWater > LIFE_LOW_THRESHOLD) {
    return currentWater < 20 ? idleBonus + 0.35 * (tickMinutes / 1) : idleBonus;
  }
  if (currentWater > LIFE_CRITICAL_THRESHOLD) {
    return 0.08 * (tickMinutes / 1);
  }
  return 0.02 * (tickMinutes / 1);
}
