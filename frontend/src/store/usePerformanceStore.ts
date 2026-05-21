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
  return {
    ...settings,
    dpr: [Math.min(settings.dpr[0], 0.8), Math.min(settings.dpr[1], 1)] as [number, number],
    frameSkip: Math.max(settings.frameSkip, 2),
    starsMultiplier: settings.starsMultiplier * 0.8,
    sporeMultiplier: settings.sporeMultiplier * 0.85,
    dustMultiplier: settings.dustMultiplier * 0.8,
    seasonParticleMultiplier: settings.seasonParticleMultiplier * 0.8,
    geoQuality: settings.geoQuality * 0.9,
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
