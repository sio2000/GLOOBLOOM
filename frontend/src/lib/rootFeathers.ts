import {
  getRootDecorHeightMeters,
  getRootDecorWorldHeight,
  getVisibleRootDefs,
  type RootPlacementDef,
} from "./rootGrowth";

export {
  getRootDecorHeightMeters as getFeatherHeightMeters,
  getRootDecorWorldHeight as getFeatherWorldHeight,
};

export interface RootFeatherDef extends RootPlacementDef {
  variant: 0 | 1 | 2;
  /** Outward lean direction offset from placement angle */
  lean: number;
  curl: number;
}

export const ROOT_FEATHER_DEFS: RootFeatherDef[] = [
  { id: 0, unlockStage: 2, angle: 0.25, distance: 0.75, variant: 0, heightMul: 1.05, lean: 0.35, curl: 1.1 },
  { id: 1, unlockStage: 2, angle: 1.85, distance: 0.68, variant: 1, heightMul: 0.78, lean: 0.42, curl: 0.95 },
  { id: 2, unlockStage: 6, angle: 3.45, distance: 0.82, variant: 2, heightMul: 0.92, lean: 0.38, curl: 1.2 },
  { id: 3, unlockStage: 10, angle: 5.05, distance: 0.70, variant: 0, heightMul: 0.65, lean: 0.48, curl: 0.88 },
  { id: 4, unlockStage: 16, angle: 2.65, distance: 0.88, variant: 1, heightMul: 0.88, lean: 0.32, curl: 1.05 },
  { id: 5, unlockStage: 24, angle: 4.55, distance: 0.78, variant: 2, heightMul: 1.0, lean: 0.45, curl: 1.15 },
  { id: 6, unlockStage: 32, angle: 0.95, distance: 0.92, variant: 0, heightMul: 0.72, lean: 0.40, curl: 1.0 },
  { id: 7, unlockStage: 108, angle: 2.15, distance: 0.98, variant: 1, heightMul: 1.1, lean: 0.44, curl: 1.18 },
  { id: 8, unlockStage: 135, angle: 4.75, distance: 1.02, variant: 2, heightMul: 0.95, lean: 0.5, curl: 1.25 },
  { id: 9, unlockStage: 170, angle: 1.05, distance: 1.08, variant: 0, heightMul: 1.15, lean: 0.38, curl: 1.12 },
  { id: 10, unlockStage: 210, angle: 3.35, distance: 1.12, variant: 1, heightMul: 1.05, lean: 0.52, curl: 1.3 },
  { id: 11, unlockStage: 270, angle: 5.65, distance: 1.15, variant: 2, heightMul: 1.2, lean: 0.46, curl: 1.15 },
  { id: 12, unlockStage: 330, angle: 0.55, distance: 1.2, variant: 0, heightMul: 1.08, lean: 0.55, curl: 1.28 },
];

export function getVisibleRootFeathers(stage: number): RootFeatherDef[] {
  return getVisibleRootDefs(ROOT_FEATHER_DEFS, stage);
}

export const FEATHER_VARIANTS = [
  {
    shaft: "#e8e0d0",
    shaftEmissive: "#a89878",
    vane: "#f8f4ec",
    vaneTip: "#fffef8",
    barb: "#ece4d4",
    emissive: "#ffe8c0",
    accent: "#ffd878",
  },
  {
    shaft: "#c8e8d8",
    shaftEmissive: "#689878",
    vane: "#e8fff4",
    vaneTip: "#f8fff8",
    barb: "#d0ecd8",
    emissive: "#a0ffd0",
    accent: "#60e8a0",
  },
  {
    shaft: "#dcd0f0",
    shaftEmissive: "#8878a8",
    vane: "#f0ecff",
    vaneTip: "#faf8ff",
    barb: "#e0d8f0",
    emissive: "#c0a0ff",
    accent: "#9070ff",
  },
] as const;
