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
  detectMinTier,
  dynamicScaleFloor,
  tierIndex,
  TIER_ORDER,
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
import {
  INSECT_RELIEF_MIN,
  INSECT_RELIEF_STEP_DOWN,
  INSECT_RELIEF_STEP_UP,
  canRestoreInsects,
  shouldReduceInsectsForLeaves,
} from "@/lib/leafPressure";

export interface PerformanceMetrics {
  fps: FpsSnapshot;
  dynamicScale: number;
  worldPhase: number;
  tier: QualityTier;
  capTier: QualityTier;
}

/** Grace window after init — ignore degrades while shaders compile / assets
 *  stream / the lazy world ramps up, so transient hitches don't strip quality. */
const STARTUP_GRACE_MS = 7000;

function raiseTierToFloor(tier: QualityTier, floor: QualityTier): QualityTier {
  return TIER_ORDER[Math.max(tierIndex(tier), tierIndex(floor))]!;
}

interface PerformanceState {
  tier: QualityTier;
  capTier: QualityTier;
  minTier: QualityTier;
  graceUntil: number;
  profile: DeviceProfile | null;
  isMobile: boolean;
  demandMode: boolean;
  ultraLow: boolean;
  initialized: boolean;
  dynamicScale: number;
  worldPhase: number;
  lastTierChangeAt: number;
  namedLeafCount: number;
  /** 1 = full insects; lowered only when many leaves + FPS struggle (never culls leaves). */
  insectReliefScale: number;
  metrics: FpsSnapshot;
  init: () => void;
  tickFrame: (deltaSec: number, renderMs?: number) => void;
  setWorldPhase: (phase: number) => void;
  setNamedLeafCount: (count: number) => void;
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
  isMobile: boolean,
  insectReliefScale: number
): QualitySettings {
  let s = applyDynamicScale(getQualitySettings(tier), dynamicScale);
  const relief = Math.max(INSECT_RELIEF_MIN, Math.min(1, insectReliefScale));
  if (relief < 0.999) {
    s = {
      ...s,
      creatureMultiplier: s.creatureMultiplier * relief,
      insectMultiplier: s.insectMultiplier * relief,
      enableGiantInsects: relief >= 0.45 ? s.enableGiantInsects : false,
    };
  }
  if (isMobile) {
    const ultra = tierIndex(s.tier) <= tierIndex("ultra_low");
    s = {
      ...s,
      demandMode: true,
      mobileStatic: true,
      frameSkip: 999,
      animTimeScale: 0,
      enableParticles: false,
      enableAtmosphere: false,
      enableHighStageFx: false,
      enableWateringFlames: false,
      enableExtendedStage: false,
      shadows: false,
      shadowMapSize: 0,
      labelsMax: 0,
      enableCreatures: false,
      enableGiantInsects: true,
      insectMultiplier: 0.08,
      // Update flying creatures every frame (ultra_low: every 2nd) so motion
      // reads as continuous flight instead of the old stuttery skip-stepping.
      creatureFrameSkip: ultra ? 2 : 1,
      creatureMultiplier: 0,
      enableStars: true,
      maxStarCount: Math.min(s.maxStarCount, ultra ? 128 : 168),
      geoQuality: Math.min(s.geoQuality, ultra ? 0.3 : 0.36),
      lazyWorldMaxPhase: 2,
      enablePostProcessing: false,
    };
  }
  return s;
}

function applyDegradeAction(
  action: DegradeAction,
  state: PerformanceState
): Partial<PerformanceState> {
  const now = performance.now();
  const floor = dynamicScaleFloor(state.minTier);
  switch (action) {
    case "force_ultra_low":
      // Drop straight to the device floor (never below it) instead of always
      // nuking to ultra_low — keeps flame/bloom on capable machines.
      return {
        tier: state.minTier,
        dynamicScale: Math.max(floor, 0.4),
        lastTierChangeAt: now,
      };
    case "tier_down":
      return {
        tier: raiseTierToFloor(degradeTier(state.tier), state.minTier),
        dynamicScale: Math.max(floor, state.dynamicScale - 0.12),
        lastTierChangeAt: now,
      };
    case "scale_geometry":
      return {
        dynamicScale: Math.max(floor, state.dynamicScale - 0.1),
        lastTierChangeAt: now,
      };
    case "scale_effects":
      return {
        dynamicScale: Math.max(floor, state.dynamicScale - 0.08),
        lastTierChangeAt: now,
      };
    default:
      return {};
  }
}

export const usePerformanceStore = create<PerformanceState>((set, get) => ({
  tier: "medium",
  capTier: "high",
  minTier: "low",
  graceUntil: 0,
  profile: null,
  isMobile: false,
  demandMode: false,
  ultraLow: false,
  initialized: false,
  dynamicScale: 1,
  worldPhase: 0,
  lastTierChangeAt: 0,
  namedLeafCount: 0,
  insectReliefScale: 1,
  metrics: EMPTY_SNAP,

  init: () => {
    if (get().initialized) return;
    const profile = detectDeviceProfile();
    const capTier = detectDeviceMaxTier(profile);
    const minTier = clampTier(detectMinTier(profile), capTier);
    const tier = raiseTierToFloor(
      clampTier(detectStartupTier(profile), capTier),
      minTier
    );
    const vp = getDeviceViewport();
    const settings = getQualitySettings(tier);

    set({
      profile,
      capTier,
      minTier,
      graceUntil: performance.now() + STARTUP_GRACE_MS,
      tier,
      isMobile: vp.isMobile,
      demandMode: settings.demandMode,
      ultraLow: tier === "ultra_low",
      dynamicScale: 1,
      worldPhase: 0,
      namedLeafCount: 0,
      insectReliefScale: 1,
      initialized: true,
      lastTierChangeAt: performance.now(),
      metrics: EMPTY_SNAP,
    });
  },

  setNamedLeafCount: (count) => {
    const n = Math.max(0, Math.floor(count));
    if (get().namedLeafCount === n) return;
    set({ namedLeafCount: n });
  },

  tickFrame: (deltaSec, renderMs) => {
    fpsTracker.pushFrame(deltaSec, renderMs);
    const snap = fpsTracker.snapshot();
    const state = get();
    // During the startup grace window, ride out load-time hitches (shader
    // compile, asset streaming, lazy-world ramp) without degrading quality.
    const inGrace = performance.now() < state.graceUntil;
    const action = inGrace ? "none" : evaluateDegrade(snap);
    let patch: Partial<PerformanceState> = { metrics: snap };

    let relief = state.insectReliefScale;
    if (shouldReduceInsectsForLeaves(snap, state.namedLeafCount, state.isMobile)) {
      relief = Math.max(INSECT_RELIEF_MIN, relief - INSECT_RELIEF_STEP_DOWN);
    } else if (canRestoreInsects(snap, relief)) {
      relief = Math.min(1, relief + INSECT_RELIEF_STEP_UP);
    } else if (!state.namedLeafCount || relief < 1) {
      relief = Math.min(1, relief + INSECT_RELIEF_STEP_UP * 0.5);
    }
    if (relief !== state.insectReliefScale) {
      patch.insectReliefScale = relief;
    }

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
    const insectRelief = patch.insectReliefScale ?? next.insectReliefScale;
    const settings = buildSettings(
      next.tier,
      next.dynamicScale,
      next.isMobile,
      insectRelief
    );
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
    const { tier, dynamicScale, isMobile, insectReliefScale } = get();
    return buildSettings(tier, dynamicScale, isMobile, insectReliefScale);
  },

  getMetrics: () => {
    const { metrics, dynamicScale, worldPhase, tier, capTier } = get();
    return { fps: metrics, dynamicScale, worldPhase, tier, capTier };
  },
}));
