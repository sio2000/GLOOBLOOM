export type QualityTier = "low" | "medium" | "high";

export interface QualitySettings {
  tier: QualityTier;
  dpr: [number, number];
  shadows: boolean;
  shadowMapSize: number;
  antialias: boolean;
  bloom: boolean;
  bloomMultisampling: number;
  /** Ambient-only multipliers — content counts (flowers, creatures) stay unchanged */
  starsMultiplier: number;
  sporeMultiplier: number;
  dustMultiplier: number;
  seasonParticleMultiplier: number;
  /** Run heavy CPU animation loops every N frames */
  frameSkip: number;
  /** Throttle flying creatures separately — higher = less CPU */
  creatureFrameSkip: number;
  /** Scale creature instance counts (0.35–1) — visual density, not motion */
  creatureMultiplier: number;
  /** Scale giant insect copies (0.35–1) */
  insectMultiplier: number;
  /** Scale pollen orb count */
  pollenMultiplier: number;
  /** Scale geometry segment counts (0.4–1) */
  geoQuality: number;
  /** Scale animation time — slower motion on weak devices, same scene content */
  animTimeScale: number;
}

const TIER_ORDER: QualityTier[] = ["low", "medium", "high"];

export const QUALITY_SETTINGS: Record<QualityTier, QualitySettings> = {
  low: {
    tier: "low",
    dpr: [0.65, 0.85],
    shadows: false,
    shadowMapSize: 0,
    antialias: false,
    bloom: false,
    bloomMultisampling: 0,
    starsMultiplier: 0.3,
    sporeMultiplier: 0.4,
    dustMultiplier: 0.35,
    seasonParticleMultiplier: 0.4,
    frameSkip: 3,
    creatureFrameSkip: 4,
    creatureMultiplier: 0.42,
    insectMultiplier: 0.45,
    pollenMultiplier: 0.45,
    geoQuality: 0.45,
    animTimeScale: 0.38,
  },
  medium: {
    tier: "medium",
    dpr: [1, 1.2],
    shadows: true,
    shadowMapSize: 256,
    antialias: true,
    bloom: true,
    bloomMultisampling: 2,
    starsMultiplier: 0.65,
    sporeMultiplier: 0.7,
    dustMultiplier: 0.6,
    seasonParticleMultiplier: 0.65,
    frameSkip: 2,
    creatureFrameSkip: 3,
    creatureMultiplier: 0.72,
    insectMultiplier: 0.7,
    pollenMultiplier: 0.7,
    geoQuality: 0.72,
    animTimeScale: 0.68,
  },
  high: {
    tier: "high",
    dpr: [1, 1.5],
    shadows: true,
    shadowMapSize: 512,
    antialias: true,
    bloom: true,
    bloomMultisampling: 4,
    starsMultiplier: 1,
    sporeMultiplier: 1,
    dustMultiplier: 1,
    seasonParticleMultiplier: 1,
    frameSkip: 1,
    creatureFrameSkip: 2,
    creatureMultiplier: 1,
    insectMultiplier: 1,
    pollenMultiplier: 1,
    geoQuality: 1,
    animTimeScale: 1,
  },
};

export function detectDeviceTier(): QualityTier {
  if (typeof window === "undefined") return "medium";

  const ua = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod|Mobile|webOS/i.test(ua);
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;

  if (saveData || (isMobile && cores <= 6) || (coarse && memory <= 4)) return "low";
  if (isMobile || cores <= 4 || memory <= 4) return "medium";
  if (!isMobile && cores >= 8 && memory >= 8) return "high";
  return "medium";
}

export function getQualitySettings(tier: QualityTier): QualitySettings {
  return QUALITY_SETTINGS[tier];
}

export function clampTier(tier: QualityTier, max: QualityTier): QualityTier {
  const ti = TIER_ORDER.indexOf(tier);
  const maxI = TIER_ORDER.indexOf(max);
  return TIER_ORDER[Math.min(ti, maxI)]!;
}

export function degradeTier(current: QualityTier): QualityTier {
  const i = TIER_ORDER.indexOf(current);
  return TIER_ORDER[Math.max(0, i - 1)]!;
}

export function improveTier(current: QualityTier, max: QualityTier): QualityTier {
  const i = TIER_ORDER.indexOf(current);
  const maxI = TIER_ORDER.indexOf(max);
  return TIER_ORDER[Math.min(maxI, i + 1)]!;
}

/** Scale a count for ambient particles — never below 1 when base > 0 */
export function scaledCount(base: number, multiplier: number): number {
  if (base <= 0) return 0;
  return Math.max(1, Math.round(base * multiplier));
}

/** Geometry segment helper */
export function geoSeg(base: number, quality: number, min = 4): number {
  return Math.max(min, Math.round(base * quality));
}
