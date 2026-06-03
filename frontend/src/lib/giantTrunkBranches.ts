import * as THREE from "three";
import { getTrunkMetrics } from "@/lib/plantScale";

export interface GiantTrunkBranchDef {
  id: number;
  unlockStage: number;
  heightPos: number;
  angle: number;
  /** Max horizontal reach as a fraction of trunk height */
  lengthScale: number;
  /** Downward sag (radians, negative = droop) */
  droop: number;
  flowerCount: number;
}

export const GIANT_TRUNK_BRANCHES: GiantTrunkBranchDef[] = [
  { id: 0, unlockStage: 14, heightPos: 0.20, angle: 0.55, lengthScale: 0.42, droop: -0.11, flowerCount: 4 },
  { id: 1, unlockStage: 22, heightPos: 0.34, angle: 2.05, lengthScale: 0.48, droop: -0.13, flowerCount: 5 },
  { id: 2, unlockStage: 32, heightPos: 0.46, angle: 3.75, lengthScale: 0.54, droop: -0.10, flowerCount: 6 },
  { id: 3, unlockStage: 44, heightPos: 0.58, angle: 5.20, lengthScale: 0.62, droop: -0.14, flowerCount: 7 },
  { id: 4, unlockStage: 56, heightPos: 0.68, angle: 1.15, lengthScale: 0.70, droop: -0.12, flowerCount: 8 },
  { id: 5, unlockStage: 70, heightPos: 0.78, angle: 2.85, lengthScale: 0.78, droop: -0.09, flowerCount: 9 },
  { id: 6, unlockStage: 84, heightPos: 0.86, angle: 4.40, lengthScale: 0.88, droop: -0.11, flowerCount: 10 },
  { id: 7, unlockStage: 95, heightPos: 0.92, angle: 0.25, lengthScale: 0.98, droop: -0.08, flowerCount: 11 },
];

export function getGiantBranchProgress(
  stage: number,
  growth: number,
  unlockStage: number
): number {
  if (stage < unlockStage) return 0;
  const stagePart = Math.min(1, (stage - unlockStage) / 18);
  const growthPart = Math.min(0.12, ((growth % 24) / 24) * 0.12);
  return Math.min(1, stagePart + growthPart);
}

export function getGiantBranchLength(
  def: GiantTrunkBranchDef,
  stage: number,
  growth: number,
  progress: number
): number {
  const trunk = getTrunkMetrics(stage, growth);
  const stageBoost = 1 + Math.max(0, stage - def.unlockStage) * 0.004;
  return trunk.trunkHeight * def.lengthScale * stageBoost * progress * 0.25;
}

export function getGiantBranchThickness(stage: number, progress: number): number {
  return (0.055 + stage * 0.0018) * (0.35 + progress * 0.65);
}

/** Natural 3D branch curve — outward, slight lift, gravity droop, depth variation */
export function giantBranchCurvePoint(
  t: number,
  length: number,
  def: GiantTrunkBranchDef
): THREE.Vector3 {
  const x = t * length;
  const y =
    Math.sin(t * Math.PI * 0.9) * 0.16 * length +
    def.droop * t * t * 0.38 * length +
    Math.sin(t * 2.4 + def.id) * 0.025 * length;
  const z =
    Math.sin(t * Math.PI * 1.45 + def.id * 0.7 + def.angle * 0.35) * 0.16 * length * (0.3 + t * 0.7) +
    Math.cos(t * Math.PI * 1.1 + def.angle * 0.5) * 0.07 * length;
  return new THREE.Vector3(x, y, z);
}
