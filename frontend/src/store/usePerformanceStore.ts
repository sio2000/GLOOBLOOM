import { create } from "zustand";
import {
  type QualityTier,
  type QualitySettings,
  getQualitySettings,
  degradeTier,
  improveTier,
  clampTier,
} from "@/lib/performance";

interface PerformanceState {
  tier: QualityTier;
  deviceMaxTier: QualityTier;
  isMobile: boolean;
  initialized: boolean;
  init: () => void;
  degrade: () => void;
  improve: () => void;
  settings: () => QualitySettings;
}

function initialTierForDevice(): QualityTier {
  const vp = getDeviceViewport();
  if (vp.isPhone) return "low";
  if (vp.isMobile) return "medium";
  return getDeviceMaxQualityTier();
}

function mobileTune(settings: QualitySettings, isMobile: boolean): QualitySettings {
  if (!isMobile) return settings;

  const vp = getDeviceViewport();
  const phone = vp.isPhone;

  return {
    ...settings,
    dpr: phone
      ? ([Math.min(settings.dpr[0], 0.68), Math.min(settings.dpr[1], 0.85)] as [number, number])
      : ([Math.min(settings.dpr[0], 0.78), Math.min(settings.dpr[1], 0.95)] as [number, number]),
    frameSkip: Math.max(settings.frameSkip, phone ? 4 : 3),
    creatureFrameSkip: Math.max(settings.creatureFrameSkip, phone ? 5 : 4),
    creatureMultiplier: settings.creatureMultiplier * (phone ? 0.55 : 0.75),
    insectMultiplier: settings.insectMultiplier * (phone ? 0.5 : 0.72),
    pollenMultiplier: settings.pollenMultiplier * (phone ? 0.5 : 0.72),
    starsMultiplier: settings.starsMultiplier * (phone ? 0.28 : 0.48),
    sporeMultiplier: settings.sporeMultiplier * (phone ? 0.6 : 0.82),
    dustMultiplier: settings.dustMultiplier * (phone ? 0.55 : 0.78),
    seasonParticleMultiplier: settings.seasonParticleMultiplier * (phone ? 0.55 : 0.78),
    geoQuality: settings.geoQuality * (phone ? 0.62 : 0.77),
    animTimeScale: settings.animTimeScale * (phone ? 0.72 : 0.84),
    bloom: phone ? false : settings.bloom,
    shadows: phone ? false : settings.shadows,
    antialias: phone ? false : settings.antialias,
    bloomMultisampling: phone ? 0 : settings.bloomMultisampling,
  };
}

import { getDeviceMaxQualityTier, getDeviceViewport } from "@/lib/device";

export const usePerformanceStore = create<PerformanceState>((set, get) => ({
  tier: "medium",
  deviceMaxTier: "high",
  isMobile: false,
  initialized: false,

  init: () => {
    if (get().initialized) return;
    const vp = getDeviceViewport();
    const deviceMaxTier = getDeviceMaxQualityTier();
    const tier = clampTier(initialTierForDevice(), deviceMaxTier);
    set({ tier, deviceMaxTier, isMobile: vp.isMobile, initialized: true });
  },

  degrade: () => {
    const { tier } = get();
    set({ tier: degradeTier(tier) });
  },

  improve: () => {
    const { tier, deviceMaxTier } = get();
    set({ tier: clampTier(improveTier(tier, deviceMaxTier), deviceMaxTier) });
  },

  settings: () => mobileTune(getQualitySettings(get().tier), get().isMobile),
}));
