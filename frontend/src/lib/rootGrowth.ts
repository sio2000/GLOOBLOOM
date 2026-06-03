/** Shared root decoration growth — mushrooms, feathers, etc. */

import { getPlantHeightMeters, getPlantWorldBounds } from "./plantScale";
import { extendedStageProgress } from "./stageConstants";

export const METERS_PER_WORLD_UNIT = 12;
/** Narrative plant cap — decor peaks when the plant reaches ~1 km. */
export const MAX_PLANT_HEIGHT_M = 1000;
export const MAX_ROOT_DECOR_HEIGHT_M = 1000;
/** Slow growth: ~0.22 m per watering */
export const ROOT_HEIGHT_M_PER_WATERING = 0.22;
/** Extended-tier root decor climb per watering (raised so waterings still matter at 400). */
export const ROOT_HEIGHT_M_PER_WATERING_EXTENDED = 0.055;
export const MIN_ROOT_DECOR_HEIGHT_M = 0.35;
/** Approximate waterings when ecosystem reaches stage 100. */
export const LEGACY_WATERINGS_CAP = 520;

/** Tallest per-item heightMul in mushroom/feather defs (caps absolute decor height). */
const ROOT_DECOR_MAX_HEIGHT_MUL = 1.25;
/** Decor meshes never exceed this fraction of visible plant height. */
const ROOT_DECOR_PLANT_FRACTION = 0.15;

export const GROUP_OFFSET_Y = -0.3;

export function getRootDecorHeightMeters(
  totalWaterings: number,
  stage?: number,
  growth?: number
): number {
  const w = Math.max(0, totalWaterings);
  const legacyCap = stage != null && stage <= 100 ? w : LEGACY_WATERINGS_CAP;
  const legacyW = Math.min(w, legacyCap);
  const extW = Math.max(0, w - legacyCap);

  const fromWater =
    MIN_ROOT_DECOR_HEIGHT_M +
    legacyW * ROOT_HEIGHT_M_PER_WATERING +
    extW * ROOT_HEIGHT_M_PER_WATERING_EXTENDED;

  let heightM = Math.min(MAX_ROOT_DECOR_HEIGHT_M, fromWater);

  if (stage != null && growth != null) {
    const plantM = getPlantHeightMeters(stage, growth);
    const plantRatio = Math.min(1, plantM / MAX_PLANT_HEIGHT_M);
    const fromPlant =
      MIN_ROOT_DECOR_HEIGHT_M +
      plantRatio * (MAX_ROOT_DECOR_HEIGHT_M - MIN_ROOT_DECOR_HEIGHT_M);
    heightM = Math.max(heightM, fromPlant);
  }

  return Math.min(MAX_ROOT_DECOR_HEIGHT_M, heightM);
}

/**
 * Visual world-unit scale for root decor meshes — capped so the tallest item
 * stays within 10% of plant world height.
 */
export function getRootDecorVisualWorldHeight(
  totalWaterings: number,
  stage: number,
  growth: number
): number {
  const { worldHeight: plantWorldH } = getPlantWorldBounds(stage, growth);
  const plantM = getPlantHeightMeters(stage, growth);
  const plantRatio = Math.min(1, plantM / MAX_PLANT_HEIGHT_M);

  const waterM = getRootDecorHeightMeters(totalWaterings, stage, growth);
  const waterRatio = Math.min(1, waterM / MAX_ROOT_DECOR_HEIGHT_M);
  const progress = Math.min(1, Math.max(plantRatio * 0.92, waterRatio * 0.75));

  const maxBaseScale =
    (plantWorldH * ROOT_DECOR_PLANT_FRACTION) / ROOT_DECOR_MAX_HEIGHT_MUL;
  const minScale = Math.max(0.04, maxBaseScale * 0.1);

  return minScale + progress * (maxBaseScale - minScale);
}

export function getRootDecorWorldHeight(
  totalWaterings: number,
  stage?: number,
  growth?: number
): number {
  if (stage != null && growth != null) {
    return getRootDecorVisualWorldHeight(totalWaterings, stage, growth);
  }
  return getRootDecorHeightMeters(totalWaterings, stage) / METERS_PER_WORLD_UNIT;
}

/** Per-mushroom mesh scale — capped to plant fraction (never trunk-radius driven). */
export function getCappedRootMushroomScale(
  totalWaterings: number,
  stage: number,
  growth: number,
  heightMul: number
): number {
  return Math.max(0.04, getRootDecorWorldHeight(totalWaterings, stage, growth) * heightMul);
}

export interface RootPlacementDef {
  id: number;
  unlockStage: number;
  angle: number;
  distance: number;
  heightMul: number;
}

export function getVisibleRootDefs<T extends RootPlacementDef>(defs: T[], stage: number): T[] {
  return defs.filter((d) => stage >= d.unlockStage);
}

export function computeRootPlacements(
  stage: number,
  growth: number,
  defs: RootPlacementDef[],
  getScales: (s: number) => { heightScale: number; widthScale: number },
  getTrunkMetrics: (s: number, g: number) => { trunkBaseY: number; trunkRadiusBottom: number }
) {
  const { heightScale, widthScale } = getScales(stage);
  const trunk = getTrunkMetrics(stage, growth);
  const spreadMul = 1 + extendedStageProgress(stage) * 0.35;
  const baseY = (GROUP_OFFSET_Y + trunk.trunkBaseY) * heightScale - 0.02;
  const trunkR = trunk.trunkRadiusBottom * widthScale;

  return defs.map((d) => {
    const dist =
      (trunkR + d.distance * trunk.trunkRadiusBottom * widthScale * spreadMul) * 1.05;
    return {
      def: d,
      position: [Math.cos(d.angle) * dist, 0, Math.sin(d.angle) * dist] as [number, number, number],
      baseY,
    };
  });
}
