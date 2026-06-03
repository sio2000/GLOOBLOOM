import {
  getRootDecorHeightMeters,
  getRootDecorWorldHeight,
  getVisibleRootDefs,
  MAX_ROOT_DECOR_HEIGHT_M,
  type RootPlacementDef,
} from "./rootGrowth";

export {
  getRootDecorHeightMeters as getMushroomHeightMeters,
  getRootDecorWorldHeight as getMushroomWorldHeight,
  MAX_ROOT_DECOR_HEIGHT_M as MAX_MUSHROOM_HEIGHT_M,
};

export interface RootMushroomDef extends RootPlacementDef {
  variant: 0 | 1 | 2 | 3;
}

export const ROOT_MUSHROOM_DEFS: RootMushroomDef[] = [
  { id: 0, unlockStage: 1, angle: 0.55, distance: 0.55, variant: 0, heightMul: 1.0 },
  { id: 1, unlockStage: 1, angle: 2.25, distance: 0.48, variant: 1, heightMul: 0.68 },
  { id: 2, unlockStage: 1, angle: 4.05, distance: 0.52, variant: 0, heightMul: 0.52 },
  { id: 3, unlockStage: 4, angle: 1.35, distance: 0.62, variant: 2, heightMul: 0.82 },
  { id: 4, unlockStage: 8, angle: 3.55, distance: 0.58, variant: 3, heightMul: 0.74 },
  { id: 5, unlockStage: 14, angle: 5.35, distance: 0.65, variant: 1, heightMul: 0.88 },
  { id: 6, unlockStage: 22, angle: 0.95, distance: 0.72, variant: 2, heightMul: 0.61 },
  { id: 7, unlockStage: 28, angle: 2.85, distance: 0.68, variant: 3, heightMul: 0.95 },
  // Extended tiers (101–400)
  { id: 8, unlockStage: 105, angle: 1.75, distance: 0.78, variant: 0, heightMul: 1.12 },
  { id: 9, unlockStage: 120, angle: 4.65, distance: 0.82, variant: 2, heightMul: 0.98 },
  { id: 10, unlockStage: 140, angle: 0.35, distance: 0.88, variant: 1, heightMul: 1.08 },
  { id: 11, unlockStage: 165, angle: 3.15, distance: 0.92, variant: 3, heightMul: 1.15 },
  { id: 12, unlockStage: 190, angle: 5.55, distance: 0.85, variant: 0, heightMul: 0.92 },
  { id: 13, unlockStage: 220, angle: 2.05, distance: 0.95, variant: 2, heightMul: 1.2 },
  { id: 14, unlockStage: 260, angle: 4.25, distance: 1.0, variant: 1, heightMul: 1.05 },
  { id: 15, unlockStage: 300, angle: 1.15, distance: 1.05, variant: 3, heightMul: 1.18 },
  { id: 16, unlockStage: 340, angle: 3.85, distance: 1.08, variant: 0, heightMul: 1.25 },
  { id: 17, unlockStage: 380, angle: 0.65, distance: 1.12, variant: 2, heightMul: 1.1 },
];

export function getVisibleRootMushrooms(stage: number): RootMushroomDef[] {
  return getVisibleRootDefs(ROOT_MUSHROOM_DEFS, stage);
}

export const MUSHROOM_VARIANTS = [
  {
    cap: "#d42020",
    capTop: "#e83828",
    capEmissive: "#701010",
    spots: "#faf8f4",
    stem: "#f0e8dc",
    stemDark: "#d8cfc0",
    stemEmissive: "#908070",
    gills: "#f8ece8",
    gillEmissive: "#ff9070",
  },
  {
    cap: "#8b5cf6",
    capTop: "#a78bfa",
    capEmissive: "#401890",
    spots: "#ede9fe",
    stem: "#ede8f4",
    stemDark: "#d4cce0",
    stemEmissive: "#9080a8",
    gills: "#ddd0ff",
    gillEmissive: "#b070ff",
  },
  {
    cap: "#1a9870",
    capTop: "#28b888",
    capEmissive: "#084830",
    spots: "#e0fff4",
    stem: "#e8f4ec",
    stemDark: "#c8dcd0",
    stemEmissive: "#608870",
    gills: "#c0ecd8",
    gillEmissive: "#40d0a0",
  },
  {
    cap: "#f08818",
    capTop: "#ffa030",
    capEmissive: "#904808",
    spots: "#fff8e8",
    stem: "#f4ecd8",
    stemDark: "#dcd0b8",
    stemEmissive: "#a89058",
    gills: "#ffe0a8",
    gillEmissive: "#ffb838",
  },
] as const;
