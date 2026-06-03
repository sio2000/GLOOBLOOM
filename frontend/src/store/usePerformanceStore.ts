import { create } from "zustand";
import {
  type QualityTier,
  type QualitySettings,
  getQualitySettings,
  degradeTier,
  improveTier,
  clampTier,
  applyDynamicScale,
  detectStartupTier,
  detectDeviceMaxTier,
  tierIndex,
} from "@/lib/performance";
import {
  type DeviceProfile,
  detectDeviceProfile,
} from "@/lib/deviceProfile";
import {
  FpsTracker,
  evaluateDegrade,
  canImproveTier,
  type FpsSnapshot,
  type DegradeAction,
} from "@/lib/adaptiveMetrics";
import { getDeviceViewport } from "@/lib/device";

export interface PerformanceMetrics {
  fps: FpsSnapshot;
  dynamicScale: number;
  worldPhase: number;
  tier: QualityTier;
  capTier: QualityTier;
}

interface PerformanceState {
  tier: QualityTier;
  capTier: QualityTier;
  profile: DeviceProfile | null;
  isMobile: boolean;
  demandMode: boolean;
  ultraLow: boolean;
  initialized: boolean;
  dynamicScale: number;
  worldPhase: number;
  lastTierChangeAt: number;
  metrics: FpsSnapshot;
  init: () => void;
  tickFrame: (deltaSec: number, renderMs?: number) => void;
  setWorldPhase: (phase: number) => void;
  forceTier: (tier: QualityTier) => void;
  settings: () => QualitySettings;
  getMetrics: () => PerformanceMetrics;
}

const fpsTracker = new FpsTracker();

const EMPTY_SNAP: FpsSnapshot = {
  avg: 60,
  min: 60,
  p95FrameMs: 16.67,
  dropsBelow45: 0,
  samples: 0,
};

function buildSettings(
  tier: QualityTier,
  dynamicScale: number,
  isMobile: boolean
): QualitySettings {
  let s = applyDynamicScale(getQualitySettings(tier), dynamicScale);
  if (isMobile && tierIndex(s.tier) <= tierIndex("low")) {
    s = { ...s, demandMode: true };
  }
  return s;
}

function applyDegradeAction(
  action: DegradeAction,
  state: PerformanceState
): Partial<PerformanceState> {
  const now = performance.now();
  switch (action) {
    case "force_ultra_low":
      return {
        tier: "ultra_low",
        dynamicScale: 0.4,
        lastTierChangeAt: now,
      };
    case "tier_down":
      return {
        tier: degradeTier(state.tier),
        dynamicScale: Math.max(0.35, state.dynamicScale - 0.12),
        lastTierChangeAt: now,
      };
    case "scale_geometry":
      return {
        dynamicScale: Math.max(0.35, state.dynamicScale - 0.1),
        lastTierChangeAt: now,
      };
    case "scale_effects":
      return {
        dynamicScale: Math.max(0.4, state.dynamicScale - 0.08),
        lastTierChangeAt: now,
      };
    default:
      return {};
  }
}

export const usePerformanceStore = create<PerformanceState>((set, get) => ({
  tier: "medium",
  capTier: "high",
  profile: null,
  isMobile: false,
  demandMode: false,
  ultraLow: false,
  initialized: false,
  dynamicScale: 1,
  worldPhase: 0,
  lastTierChangeAt: 0,
  metrics: EMPTY_SNAP,

  init: () => {
    if (get().initialized) return;
    const profile = detectDeviceProfile();
    const capTier = detectDeviceMaxTier(profile);
    const tier = clampTier(detectStartupTier(profile), capTier);
    const vp = getDeviceViewport();
    const settings = getQualitySettings(tier);

    set({
      profile,
      capTier,
      tier,
      isMobile: vp.isMobile,
      demandMode: settings.demandMode,
      ultraLow: tier === "ultra_low",
      dynamicScale: 1,
      worldPhase: 0,
      initialized: true,
      lastTierChangeAt: performance.now(),
      metrics: EMPTY_SNAP,
    });
  },

  tickFrame: (deltaSec, renderMs) => {
    fpsTracker.pushFrame(deltaSec, renderMs);
    const snap = fpsTracker.snapshot();
    const state = get();
    const action = evaluateDegrade(snap);
    let patch: Partial<PerformanceState> = { metrics: snap };

    if (action !== "none") {
      patch = { ...patch, ...applyDegradeAction(action, state) };
    } else if (canImproveTier(snap, state.lastTierChangeAt)) {
      const next = improveTier(state.tier, state.capTier);
      if (next !== state.tier) {
        patch = {
          ...patch,
          tier: next,
          dynamicScale: Math.min(1, state.dynamicScale + 0.06),
          lastTierChangeAt: performance.now(),
        };
      } else if (state.dynamicScale < 0.98) {
        patch = {
          ...patch,
          dynamicScale: Math.min(1, state.dynamicScale + 0.04),
        };
      }
    }

    const next = { ...state, ...patch };
    const settings = buildSettings(next.tier, next.dynamicScale, next.isMobile);
    patch.demandMode = settings.demandMode;
    patch.ultraLow = next.tier === "ultra_low";

    set(patch);
  },

  setWorldPhase: (phase) => {
    const max = get().settings().lazyWorldMaxPhase;
    set({ worldPhase: Math.min(max, Math.max(0, phase)) });
  },

  forceTier: (tier) => {
    const { capTier } = get();
    set({
      tier: clampTier(tier, capTier),
      lastTierChangeAt: performance.now(),
    });
  },

  settings: () => {
    const { tier, dynamicScale, isMobile } = get();
    return buildSettings(tier, dynamicScale, isMobile);
  },

  getMetrics: () => {
    const { metrics, dynamicScale, worldPhase, tier, capTier } = get();
    return { fps: metrics, dynamicScale, worldPhase, tier, capTier };
  },
}));
