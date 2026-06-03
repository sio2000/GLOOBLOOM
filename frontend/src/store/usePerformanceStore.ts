import { create } from "zustand";
import {
  type QualityTier,
  type QualitySettings,
  getQualitySettings,
  degradeTier,
  improveTier,
  clampTier,
  detectUltraLowDevice,
} from "@/lib/performance";
import { getDeviceMaxQualityTier, getDeviceViewport } from "@/lib/device";

interface PerformanceState {
  tier: QualityTier;
  deviceMaxTier: QualityTier;
  isMobile: boolean;
  demandMode: boolean;
  ultraLow: boolean;
  initialized: boolean;
  init: () => void;
  degrade: () => void;
  improve: () => void;
  settings: () => QualitySettings;
}

function initialTierForDevice(ultraLow: boolean): QualityTier {
  const vp = getDeviceViewport();
  if (ultraLow || vp.isPhone) return "low";
  if (vp.isMobile) return "low";
  return getDeviceMaxQualityTier();
}

function mobileTune(
  settings: QualitySettings,
  isMobile: boolean,
  ultraLow: boolean
): QualitySettings {
  if (!isMobile) return settings;

  const vp = getDeviceViewport();
  const phone = vp.isPhone;
  const aggressive = true;
  const ultra = ultraLow || phone;

  const particleScale = ultra ? 0.03 : 0.06;
  const starScale = ultra ? 0.03 : 0.05;

  return {
    ...settings,
    tier: "low",
    demandMode: true,
    ultraLow: ultra,
    mobileStatic: aggressive,
    dpr: ultra
      ? ([0.5, 0.62] as [number, number])
      : ([0.55, 0.7] as [number, number]),
    frameSkip: 999,
    creatureFrameSkip: 999,
    creatureMultiplier: settings.creatureMultiplier * 0.06,
    insectMultiplier: settings.insectMultiplier * 0.04,
    pollenMultiplier: settings.pollenMultiplier * 0.05,
    starsMultiplier: settings.starsMultiplier * starScale,
    sporeMultiplier: settings.sporeMultiplier * particleScale,
    dustMultiplier: settings.dustMultiplier * particleScale,
    seasonParticleMultiplier: settings.seasonParticleMultiplier * particleScale,
    geoQuality: settings.geoQuality * (ultra ? 0.32 : 0.4),
    animTimeScale: 0,
    bloom: false,
    shadows: false,
    antialias: false,
    bloomMultisampling: 0,
    enablePostProcessing: false,
    enableCreatures: false,
    enableParticles: false,
    enableAtmosphere: false,
    enableHighStageFx: false,
    enableGiantInsects: false,
    enableStars: !ultra,
    enableExtendedStage: false,
    enableRootDecor: false,
    enableWateringFlames: false,
    maxStarCount: ultra ? 24 : 48,
    labelsMax: 0,
  };
}

export const usePerformanceStore = create<PerformanceState>((set, get) => ({
  tier: "medium",
  deviceMaxTier: "high",
  isMobile: false,
  demandMode: false,
  ultraLow: false,
  initialized: false,

  init: () => {
    if (get().initialized) return;
    const vp = getDeviceViewport();
    const ultraLow = vp.isMobile && detectUltraLowDevice();
    const deviceMaxTier = vp.isMobile ? "low" : getDeviceMaxQualityTier();
    const tier = clampTier(initialTierForDevice(ultraLow), deviceMaxTier);
    set({
      tier,
      deviceMaxTier,
      isMobile: vp.isMobile,
      demandMode: vp.isMobile,
      ultraLow,
      initialized: true,
    });
  },

  degrade: () => {
    const { tier } = get();
    set({ tier: degradeTier(tier) });
  },

  improve: () => {
    const { tier, deviceMaxTier, isMobile } = get();
    if (isMobile) return;
    set({ tier: clampTier(improveTier(tier, deviceMaxTier), deviceMaxTier) });
  },

  settings: () =>
    mobileTune(getQualitySettings(get().tier), get().isMobile, get().ultraLow),
}));
