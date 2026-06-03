/** Shared plant dimension helpers — keep trunk math consistent across components. */

import { clampStage, extendedHeightDamping, LEGACY_MAX_STAGE } from "./stageConstants";

const GROUP_OFFSET_Y = -0.3;

function stageBonus(stage: number, from: number, rate: number): number {
  return stage > from ? (stage - from) * rate : 0;
}

/** Extended-tier bonus — only counts stages above 100, with damped rates. */
function extStageBonus(stage: number, from: number, rate: number): number {
  if (stage <= Math.max(from, LEGACY_MAX_STAGE)) return 0;
  return (stage - Math.max(from, LEGACY_MAX_STAGE)) * rate;
}

export function getScales(stage: number) {
  const s = clampStage(stage);
  const legacy = Math.min(s, LEGACY_MAX_STAGE);
  let widthScale = 0.80 + legacy * 0.018;
  let heightScale = 1.20 + legacy * 0.058;

  if (s > LEGACY_MAX_STAGE) {
    const ext = s - LEGACY_MAX_STAGE;
    const damp = extendedHeightDamping(s);
    widthScale += ext * 0.003 * damp;
    heightScale += ext * 0.009 * damp;
  }

  return { widthScale, heightScale };
}

export function getTrunkMetrics(stage: number, growth: number) {
  const s = clampStage(stage);
  const legacy = Math.min(s, LEGACY_MAX_STAGE);
  const damp = extendedHeightDamping(s);
  const trunkBaseY = -0.48;

  const growthContrib =
    s > LEGACY_MAX_STAGE
      ? growth * 0.003 * damp
      : growth * 0.014;

  let trunkHeight =
    0.55 +
    legacy * 0.095 +
    growthContrib +
    stageBonus(s, 50, 0.045) +
    extStageBonus(s, 100, 0.007 * damp) +
    extStageBonus(s, 200, 0.009 * damp) +
    extStageBonus(s, 300, 0.011 * damp);

  const trunkTopY = trunkBaseY + trunkHeight;

  let trunkRadiusBottom =
    0.055 +
    legacy * 0.0035 +
    (s > LEGACY_MAX_STAGE ? growth * 0.00035 * damp : growth * 0.0012) +
    stageBonus(s, 50, 0.002) +
    extStageBonus(s, 100, 0.00045 * damp) +
    extStageBonus(s, 200, 0.00055 * damp);

  const trunkRadiusTop = trunkRadiusBottom * 0.52;
  return {
    trunkBaseY,
    trunkHeight,
    trunkTopY,
    trunkRadiusBottom,
    trunkRadiusTop,
  };
}

/** World-space Y range of the trunk (group offset + scale applied). */
export function getTrunkWorldYRange(
  stage: number,
  growth: number,
  groupOffsetY = GROUP_OFFSET_Y
) {
  const { trunkBaseY, trunkTopY } = getTrunkMetrics(stage, growth);
  const { heightScale } = getScales(stage);
  return {
    bottom: (groupOffsetY + trunkBaseY) * heightScale,
    top: (groupOffsetY + trunkTopY) * heightScale,
    heightScale,
  };
}

export function getPlantWorldBounds(
  stage: number,
  growth: number,
  groupOffsetY = GROUP_OFFSET_Y
) {
  const { trunkBaseY, trunkTopY } = getTrunkMetrics(stage, growth);
  const { heightScale, widthScale } = getScales(stage);
  const s = clampStage(stage);
  const legacy = Math.min(s, LEGACY_MAX_STAGE);
  const damp = extendedHeightDamping(s);

  const crownRadius =
    0.22 +
    legacy * 0.004 +
    (s > LEGACY_MAX_STAGE ? growth * 0.0004 * damp : growth * 0.0015) +
    stageBonus(s, 50, 0.005) +
    extStageBonus(s, 100, 0.0012 * damp) +
    extStageBonus(s, 200, 0.0018 * damp);

  const bottom = (groupOffsetY + trunkBaseY) * heightScale;
  const top = (groupOffsetY + trunkTopY + crownRadius * 0.6) * heightScale;
  const worldHeight = Math.max(2, top - bottom);
  const centerY = (top + bottom) / 2;
  return { bottom, top, worldHeight, centerY, heightScale, widthScale };
}

/** Narrative scale: one world unit ≈ this many meters of plant height */
const METERS_PER_WORLD_UNIT = 12;

/** Total visible plant height in meters (trunk + crown). */
export function getPlantHeightMeters(stage: number, growth: number): number {
  const bounds = getPlantWorldBounds(stage, growth);
  const { heightScale } = getScales(stage);
  const s = clampStage(stage);
  const bouquetSpan = s >= 400 ? 342 : s >= 100 ? 100 : 42;
  const damp = extendedHeightDamping(s);
  const bouquetExtra =
    s >= 58
      ? (0.28 + Math.min(1, (s - 58) / bouquetSpan) * 0.85) *
        heightScale *
        (s > LEGACY_MAX_STAGE ? damp : 1)
      : 0;
  return (bounds.worldHeight + bouquetExtra) * METERS_PER_WORLD_UNIT;
}

/** Human-readable height — m, km, Mm as the plant grows */
export function formatPlantHeight(meters: number): string {
  const abs = Math.abs(meters);
  if (abs >= 1_000_000) {
    const v = meters / 1_000_000;
    return `${v >= 100 ? v.toFixed(0) : v.toFixed(2)} Mm`;
  }
  if (abs >= 1000) {
    const v = meters / 1000;
    return `${v >= 100 ? v.toFixed(0) : v.toFixed(2)} km`;
  }
  if (abs >= 100) return `${Math.round(meters)} m`;
  if (abs >= 10) return `${meters.toFixed(1)} m`;
  return `${meters.toFixed(2)} m`;
}

/** Estimated total biomass in kilograms (trunk + crown, scales with height & stage). */
export function getPlantWeightKg(stage: number, growth: number): number {
  const heightM = getPlantHeightMeters(stage, growth);
  const bounds = getPlantWorldBounds(stage, growth);
  const trunk = getTrunkMetrics(stage, growth);
  const radiusM = trunk.trunkRadiusBottom * bounds.widthScale * METERS_PER_WORLD_UNIT;

  const trunkDensity = 380;
  const trunkMass =
    Math.PI * radiusM * radiusM * heightM * 0.32 * trunkDensity;
  const crownMass = heightM * radiusM * 5.2 * (1 + clampStage(stage) * 0.022) * 95;
  const growthBonus = 1 + growth * 0.0035;

  return (trunkMass + crownMass) * growthBonus;
}

/** Human-readable weight — kg, t, kt, Mt */
export function formatPlantWeight(kg: number): string {
  const abs = Math.abs(kg);
  if (abs >= 1_000_000_000) {
    const v = kg / 1_000_000_000;
    return `${v >= 100 ? v.toFixed(0) : v.toFixed(2)} Gt`;
  }
  if (abs >= 1_000_000) {
    const v = kg / 1_000_000;
    return `${v >= 100 ? v.toFixed(0) : v.toFixed(2)} Mt`;
  }
  if (abs >= 1000) {
    const t = kg / 1000;
    return t >= 100 ? `${Math.round(t)} t` : `${t.toFixed(1)} t`;
  }
  if (abs >= 100) return `${Math.round(kg)} kg`;
  return `${kg.toFixed(1)} kg`;
}

/** Camera zoom / framing limits that scale with full plant height. */
export function getCameraLimits(
  stage: number,
  growth: number,
  opts?: { isMobile?: boolean; isPortrait?: boolean; isPhone?: boolean }
) {
  const { worldHeight, centerY } = getPlantWorldBounds(stage, growth);
  const mobile = opts?.isMobile ?? false;
  const portrait = opts?.isPortrait ?? false;
  const phone = opts?.isPhone ?? false;

  const maxDistance = Math.max(200, worldHeight * 10 + 150);
  const panRange = worldHeight * 0.55;
  const panStep = Math.max(0.6, worldHeight * 0.07);

  let cameraZ = Math.max(10, worldHeight * 1.05 + 12);
  let cameraY = centerY + worldHeight * 0.28;
  let fov = 50;

  if (mobile) {
    if (portrait) {
      cameraZ *= phone ? 1.42 : 1.28;
      cameraY = centerY + worldHeight * (phone ? 0.12 : 0.16);
      fov = phone ? 60 : 56;
    } else {
      cameraZ *= 1.18;
      cameraY = centerY + worldHeight * 0.2;
      fov = 54;
    }
  }

  return {
    minDistance: mobile ? 0.15 : 0.08,
    maxDistance,
    fogNear: mobile ? 28 : 22,
    fogFar: Math.max(mobile ? 420 : 280, worldHeight * 8 + 160),
    targetY: centerY,
    cameraY,
    cameraZ,
    fov,
    panRange,
    panStep,
    worldHeight,
  };
}
