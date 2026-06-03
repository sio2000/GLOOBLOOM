import type { DeviceProfile } from "@/lib/deviceProfile";
import { detectDeviceProfile } from "@/lib/deviceProfile";

export type QualityTier =
  | "ultra_low"
  | "low"
  | "medium"
  | "high"
  | "ultra";

export interface QualitySettings {
  tier: QualityTier;
  dpr: [number, number];
  shadows: boolean;
  shadowMapSize: number;
  antialias: boolean;
  bloom: boolean;
  bloomMultisampling: number;
  starsMultiplier: number;
  sporeMultiplier: number;
  dustMultiplier: number;
  seasonParticleMultiplier: number;
  frameSkip: number;
  creatureFrameSkip: number;
  creatureMultiplier: number;
  insectMultiplier: number;
  pollenMultiplier: number;
  geoQuality: number;
  animTimeScale: number;
  demandMode: boolean;
  ultraLow: boolean;
  mobileStatic: boolean;
  enablePostProcessing: boolean;
  enableCreatures: boolean;
  enableParticles: boolean;
  enableAtmosphere: boolean;
  enableHighStageFx: boolean;
  enableGiantInsects: boolean;
  enableStars: boolean;
  enableExtendedStage: boolean;
  enableRootDecor: boolean;
  enableWateringFlames: boolean;
  maxStarCount: number;
  labelsMax: number;
  drawDistanceScale: number;
  lazyWorldMaxPhase: number;
}

export const TIER_ORDER: QualityTier[] = [
  "ultra_low",
  "low",
  "medium",
  "high",
  "ultra",
];

const BASE: Omit<QualitySettings, "tier"> = {
  dpr: [1, 1],
  shadows: false,
  shadowMapSize: 0,
  antialias: false,
  bloom: false,
  bloomMultisampling: 0,
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
  demandMode: false,
  ultraLow: false,
  mobileStatic: false,
  enablePostProcessing: false,
  enableCreatures: true,
  enableParticles: true,
  enableAtmosphere: true,
  enableHighStageFx: true,
  enableGiantInsects: true,
  enableStars: true,
  enableExtendedStage: true,
  enableRootDecor: true,
  enableWateringFlames: true,
  maxStarCount: 8000,
  labelsMax: 100,
  drawDistanceScale: 1,
  lazyWorldMaxPhase: 3,
};

export const QUALITY_PRESETS: Record<QualityTier, QualitySettings> = {
  ultra_low: {
    ...BASE,
    tier: "ultra_low",
    dpr: [0.38, 0.48],
    frameSkip: 999,
    creatureMultiplier: 0.58,
    insectMultiplier: 0.48,
    pollenMultiplier: 0.1,
    starsMultiplier: 0.55,
    sporeMultiplier: 0.12,
    dustMultiplier: 0.1,
    seasonParticleMultiplier: 0.1,
    geoQuality: 0.32,
    animTimeScale: 0,
    demandMode: true,
    ultraLow: true,
    mobileStatic: true,
    enableCreatures: false,
    enableParticles: false,
    enableAtmosphere: false,
    enableHighStageFx: false,
    enableGiantInsects: true,
    enableStars: true,
    enableExtendedStage: false,
    enableRootDecor: true,
    enableWateringFlames: false,
    shadows: false,
    shadowMapSize: 0,
    maxStarCount: 128,
    creatureFrameSkip: 6,
    labelsMax: 0,
    drawDistanceScale: 1,
    lazyWorldMaxPhase: 3,
  },
  low: {
    ...BASE,
    tier: "low",
    dpr: [0.5, 0.62],
    frameSkip: 999,
    creatureMultiplier: 0.72,
    insectMultiplier: 0.55,
    animTimeScale: 0,
    mobileStatic: true,
    pollenMultiplier: 0.2,
    starsMultiplier: 0.42,
    sporeMultiplier: 0.22,
    dustMultiplier: 0.18,
    seasonParticleMultiplier: 0.2,
    geoQuality: 0.45,
    demandMode: true,
    enableParticles: false,
    enableAtmosphere: false,
    enablePostProcessing: false,
    enableHighStageFx: false,
    enableGiantInsects: true,
    enableRootDecor: true,
    enableExtendedStage: false,
    shadows: false,
    shadowMapSize: 0,
    maxStarCount: 168,
    enableStars: true,
    creatureFrameSkip: 5,
    labelsMax: 0,
    enableCreatures: false,
    drawDistanceScale: 1,
    lazyWorldMaxPhase: 3,
  },
  medium: {
    ...BASE,
    tier: "medium",
    dpr: [0.85, 1.05],
    shadows: true,
    shadowMapSize: 256,
    antialias: true,
    frameSkip: 2,
    creatureFrameSkip: 2,
    creatureMultiplier: 0.55,
    insectMultiplier: 0.5,
    pollenMultiplier: 0.55,
    starsMultiplier: 0.45,
    sporeMultiplier: 0.5,
    dustMultiplier: 0.45,
    seasonParticleMultiplier: 0.5,
    geoQuality: 0.72,
    animTimeScale: 0.65,
    bloom: true,
    bloomMultisampling: 2,
    enablePostProcessing: true,
    maxStarCount: 2000,
    labelsMax: 40,
    drawDistanceScale: 0.9,
    lazyWorldMaxPhase: 2,
  },
  high: {
    ...BASE,
    tier: "high",
    dpr: [1, 1.25],
    shadows: true,
    shadowMapSize: 512,
    antialias: true,
    bloom: true,
    bloomMultisampling: 3,
    frameSkip: 1,
    creatureFrameSkip: 2,
    creatureMultiplier: 0.85,
    insectMultiplier: 0.82,
    pollenMultiplier: 0.85,
    starsMultiplier: 0.75,
    geoQuality: 0.9,
    animTimeScale: 0.88,
    enablePostProcessing: true,
    maxStarCount: 5000,
    labelsMax: 70,
    drawDistanceScale: 1,
    lazyWorldMaxPhase: 3,
  },
  ultra: {
    ...BASE,
    tier: "ultra",
    dpr: [1, 1.5],
    shadows: true,
    shadowMapSize: 1024,
    antialias: true,
    bloom: true,
    bloomMultisampling: 4,
    frameSkip: 1,
    creatureFrameSkip: 1,
    animTimeScale: 1,
    enablePostProcessing: true,
    maxStarCount: 8000,
    labelsMax: 100,
    drawDistanceScale: 1.1,
    lazyWorldMaxPhase: 3,
  },
};

export function detectStartupTier(profile?: DeviceProfile): QualityTier {
  const p = profile ?? detectDeviceProfile();

  if (p.saveData || p.lowEnd || p.gpuTier === 0) return "ultra_low";
  if (p.deviceClass === "phone") return "ultra_low";
  if (p.deviceClass === "tablet") {
    if (p.memoryGb < 6 || p.cores <= 6) return "ultra_low";
    return "low";
  }

  if (p.score >= 95 && p.memoryGb >= 16 && p.cores >= 12 && p.gpuTier >= 3)
    return "ultra";
  if (p.score >= 72 && p.memoryGb >= 8 && p.cores >= 8 && p.gpuTier >= 2)
    return "high";
  if (p.score >= 48 && p.memoryGb >= 6 && p.cores >= 6) return "medium";
  if (p.score >= 28) return "low";
  return "ultra_low";
}

export function detectDeviceMaxTier(profile?: DeviceProfile): QualityTier {
  const p = profile ?? detectDeviceProfile();
  if (p.deviceClass === "phone") return "low";
  if (p.deviceClass === "tablet") return "low";
  if (p.gpuTier <= 1 && p.memoryGb < 8) return "medium";
  if (p.gpuTier >= 3 && p.memoryGb >= 16 && p.cores >= 12) return "ultra";
  if (p.gpuTier >= 2 && p.memoryGb >= 8) return "high";
  return "medium";
}

export function getQualitySettings(tier: QualityTier): QualitySettings {
  return { ...QUALITY_PRESETS[tier] };
}

export function tierIndex(tier: QualityTier): number {
  return TIER_ORDER.indexOf(tier);
}

export function clampTier(tier: QualityTier, max: QualityTier): QualityTier {
  return TIER_ORDER[Math.min(tierIndex(tier), tierIndex(max))]!;
}

export function degradeTier(current: QualityTier): QualityTier {
  const i = tierIndex(current);
  return TIER_ORDER[Math.max(0, i - 1)]!;
}

export function improveTier(current: QualityTier, max: QualityTier): QualityTier {
  const i = tierIndex(current);
  const maxI = tierIndex(max);
  return TIER_ORDER[Math.min(maxI, i + 1)]!;
}

/** Fine-grained multiplier from dynamic scaler (0.35–1). */
export function applyDynamicScale(
  settings: QualitySettings,
  scale: number
): QualitySettings {
  const s = Math.max(0.35, Math.min(1, scale));
  return {
    ...settings,
    starsMultiplier: settings.starsMultiplier * s,
    sporeMultiplier: settings.sporeMultiplier * s,
    dustMultiplier: settings.dustMultiplier * s,
    seasonParticleMultiplier: settings.seasonParticleMultiplier * s,
    creatureMultiplier: settings.creatureMultiplier * s,
    insectMultiplier: settings.insectMultiplier * s,
    pollenMultiplier: settings.pollenMultiplier * s,
    geoQuality: settings.geoQuality * (0.5 + s * 0.5),
    maxStarCount: Math.max(
      settings.tier === "ultra_low" ? 16 : 8,
      Math.round(settings.maxStarCount * s)
    ),
    labelsMax: Math.round(settings.labelsMax * s),
    drawDistanceScale: Math.max(
      settings.tier === "ultra_low" || settings.tier === "low" ? 0.92 : 0.75,
      settings.drawDistanceScale * (0.82 + s * 0.18)
    ),
    enableHighStageFx: s >= 0.55 && settings.enableHighStageFx,
    enableGiantInsects: settings.enableGiantInsects,
    enableParticles: settings.enableParticles,
    enableCreatures: settings.enableCreatures,
    enableAtmosphere: settings.enableAtmosphere,
    enableRootDecor: settings.enableRootDecor,
    enableExtendedStage: settings.enableExtendedStage,
    bloom: s >= 0.7 && settings.bloom,
    enablePostProcessing: s >= 0.65 && settings.enablePostProcessing,
  };
}

export function scaledCount(base: number, multiplier: number): number {
  if (base <= 0) return 0;
  return Math.max(1, Math.round(base * multiplier));
}

export function geoSeg(base: number, quality: number, min = 4): number {
  return Math.max(min, Math.round(base * quality));
}

/** @deprecated use detectStartupTier */
export function detectDeviceTier(): QualityTier {
  return detectStartupTier();
}

export function detectUltraLowDevice(): boolean {
  return detectStartupTier() === "ultra_low";
}
