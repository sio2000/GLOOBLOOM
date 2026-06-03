import * as THREE from "three";
import { clampStage, extendedHeightDamping, LEGACY_MAX_STAGE } from "./stageConstants";
import { getScales, getTrunkMetrics } from "./plantScale";

const GROUP_OFFSET_Y = -0.3;

export interface PlantFlightBounds {
  groupOffsetY: number;
  heightScale: number;
  widthScale: number;
  trunkBaseY: number;
  trunkTopY: number;
  trunkHeight: number;
  trunkRadiusBottom: number;
  trunkRadiusTop: number;
  crownRadius: number;
  bouquetExtra: number;
  stage: number;
}

export function buildPlantFlightBounds(stage: number, growth: number): PlantFlightBounds {
  const s = clampStage(stage);
  const trunk = getTrunkMetrics(s, growth);
  const { widthScale, heightScale } = getScales(s);
  const legacy = Math.min(s, LEGACY_MAX_STAGE);
  const damp = extendedHeightDamping(s);
  const bouquetSpan = s >= 400 ? 342 : s >= 100 ? 100 : 42;
  const bouquetExtra =
    s >= 58
      ? (0.28 + Math.min(1, (s - 58) / bouquetSpan) * 0.85) * (s > LEGACY_MAX_STAGE ? damp : 1)
      : 0;

  const crownRadius =
    0.22 +
    legacy * 0.004 +
    (s > LEGACY_MAX_STAGE ? growth * 0.0004 * damp : growth * 0.0015) +
    (s > 50 ? (s - 50) * 0.005 : 0);

  return {
    groupOffsetY: GROUP_OFFSET_Y,
    heightScale,
    widthScale,
    trunkBaseY: trunk.trunkBaseY,
    trunkTopY: trunk.trunkTopY,
    trunkHeight: trunk.trunkHeight,
    trunkRadiusBottom: trunk.trunkRadiusBottom,
    trunkRadiusTop: trunk.trunkRadiusTop,
    crownRadius,
    bouquetExtra,
    stage: s,
  };
}

function solidRadiusAtLocalY(localY: number, b: PlantFlightBounds): number {
  if (localY < b.trunkBaseY - 0.15) return 0;

  const t = THREE.MathUtils.clamp((localY - b.trunkBaseY) / Math.max(0.01, b.trunkHeight), 0, 1);
  const trunkR = THREE.MathUtils.lerp(b.trunkRadiusBottom, b.trunkRadiusTop, t);

  const legacy = Math.min(b.stage, LEGACY_MAX_STAGE);
  const branchReach =
    0.42 +
    legacy * 0.014 +
    b.trunkRadiusBottom * 2.2 +
    (b.stage > LEGACY_MAX_STAGE ? (b.stage - LEGACY_MAX_STAGE) * 0.0025 : 0);
  const foliageR = branchReach * (0.2 + t * t * 1.05);

  let crownR = 0;
  const crownStart = b.trunkTopY - b.trunkHeight * 0.06;
  if (localY > crownStart) {
    const crownT = THREE.MathUtils.clamp(
      (localY - crownStart) / (b.trunkHeight * 0.32 + b.bouquetExtra + 0.5),
      0,
      1
    );
    crownR = (b.crownRadius * 2.8 + b.bouquetExtra * 0.55) * (0.35 + crownT * 0.65);
  }

  return Math.max(trunkR * 1.2, foliageR, crownR);
}

/** Push world position outside trunk / branch / crown volume. */
export function applyPlantAvoidance(
  pos: THREE.Vector3,
  bounds: PlantFlightBounds,
  margin = 0.5
): void {
  const localY = (pos.y - bounds.groupOffsetY) / bounds.heightScale;
  const lx = pos.x / bounds.widthScale;
  const lz = pos.z / bounds.widthScale;
  const dist = Math.hypot(lx, lz);

  const solidR = solidRadiusAtLocalY(localY, bounds);
  if (solidR <= 0) return;

  const minDist = solidR + margin / bounds.widthScale;

  if (dist < 1e-4) {
    pos.set(minDist * bounds.widthScale, pos.y, 0);
    return;
  }

  if (dist < minDist) {
    const push = minDist / dist;
    pos.x = lx * push * bounds.widthScale;
    pos.z = lz * push * bounds.widthScale;
  }
}
