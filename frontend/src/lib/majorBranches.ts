import * as THREE from "three";
import { LeafData } from "@/types/organism";
import { getTrunkMetrics } from "@/lib/plantScale";

export interface MajorBranchDef {
  id: number;
  unlockStage: number;
  heightPos: number;
  angle: number;
  baseLength: number;
  tilt: number;
}

export const MAJOR_BRANCH_DEFS: MajorBranchDef[] = [
  { id: 0, unlockStage: 12, heightPos: 0.28, angle: 0.85, baseLength: 0.95, tilt: 0.42 },
  { id: 1, unlockStage: 28, heightPos: 0.54, angle: 2.35, baseLength: 1.15, tilt: 0.38 },
  { id: 2, unlockStage: 45, heightPos: 0.78, angle: 4.55, baseLength: 1.35, tilt: 0.35 },
];

/** 5 extra identical decorated twigs — same look as the original 2, random trunk spots */
export const CLONED_TWIG_DEFS: MajorBranchDef[] = [
  { id: 100, unlockStage: 1, heightPos: 0.17, angle: 1.12, baseLength: 0.95, tilt: 0.42 },
  { id: 101, unlockStage: 1, heightPos: 0.36, angle: 3.65, baseLength: 0.95, tilt: 0.42 },
  { id: 102, unlockStage: 1, heightPos: 0.49, angle: 5.45, baseLength: 0.95, tilt: 0.42 },
  { id: 103, unlockStage: 1, heightPos: 0.64, angle: 0.55, baseLength: 0.95, tilt: 0.42 },
  { id: 104, unlockStage: 1, heightPos: 0.83, angle: 2.95, baseLength: 0.95, tilt: 0.42 },
];

export function getBranchProgress(stage: number, growth: number, unlockStage: number): number {
  if (stage < unlockStage) return 0;
  const stagePart = Math.min(1, (stage - unlockStage) / 14);
  const growthPart = Math.min(0.15, (growth % 18) / 18 * 0.15);
  return Math.min(1, stagePart + growthPart);
}

export function getBranchLength(def: MajorBranchDef, stage: number, growth: number, progress: number): number {
  const trunk = getTrunkMetrics(stage, growth);
  const heightFrac = def.id >= 100 ? 0.12 : 0.10 + (def.id % 6) * 0.022;
  return trunk.trunkHeight * heightFrac * progress;
}

export function getLeafHeightPos(leaf: LeafData, stage: number, growth: number): number {
  const trunk = getTrunkMetrics(stage, growth);
  return (leaf.posY - trunk.trunkBaseY) / Math.max(0.001, trunk.trunkHeight);
}

export function getLeafBranchIndex(leaf: LeafData, stage: number, growth: number): number | null {
  const heightPos = getLeafHeightPos(leaf, stage, growth);
  let best: { id: number; dist: number; progress: number } | null = null;

  for (const def of MAJOR_BRANCH_DEFS) {
    const progress = getBranchProgress(stage, growth, def.unlockStage);
    if (progress < 0.25) continue;
    const dist = Math.abs(heightPos - def.heightPos);
    if (dist > 0.14) continue;
    if (!best || dist < best.dist) best = { id: def.id, dist, progress };
  }

  return best?.id ?? null;
}

export function filterTrunkLeaves(leaves: LeafData[], stage: number, growth: number): LeafData[] {
  return leaves.filter((leaf) => getLeafBranchIndex(leaf, stage, growth) === null);
}

export function filterBranchLeaves(leaves: LeafData[], branchId: number, stage: number, growth: number): LeafData[] {
  return leaves.filter((leaf) => getLeafBranchIndex(leaf, stage, growth) === branchId);
}

export function placeLeafOnBranch(
  def: MajorBranchDef,
  stage: number,
  growth: number,
  slot: number
): { posX: number; posY: number; posZ: number; rotation: number } {
  const trunk = getTrunkMetrics(stage, growth);
  const progress = Math.max(0.35, getBranchProgress(stage, growth, def.unlockStage));
  const length = getBranchLength(def, stage, growth, progress);
  const attachY = trunk.trunkBaseY + def.heightPos * trunk.trunkHeight;
  const attachR = THREE.MathUtils.lerp(
    trunk.trunkRadiusBottom,
    trunk.trunkRadiusTop,
    def.heightPos
  );

  const along = 0.55 + (slot % 5) * 0.09;
  const tipY = attachY + Math.sin(def.tilt) * length * along;
  const tipHoriz = Math.cos(def.tilt) * length * along + attachR * 0.15;
  const posX = Math.cos(def.angle) * (attachR + tipHoriz);
  const posZ = Math.sin(def.angle) * (attachR + tipHoriz);

  return { posX, posY: tipY, posZ, rotation: def.angle + slot * 0.7 };
}
