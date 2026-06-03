import type { QualityTier } from "@/lib/performance";
import type { FlyPath } from "@/lib/insectFlight";

/** Hard caps — tuned for smooth demand-mode pan/zoom. */
export const MOBILE_FLIGHT_CAP: Record<"ultra_low" | "low", number> = {
  ultra_low: 4,
  low: 5,
};

/** Max giant species (besides bees) per tier. */
export const MOBILE_GIANT_CAP: Record<"ultra_low" | "low", number> = {
  ultra_low: 2,
  low: 3,
};

/** Always prefer two bees on mobile when stage allows — giants fill remaining slots. */
export const MOBILE_BEE_CAP: Record<"ultra_low" | "low", number> = {
  ultra_low: 2,
  low: 2,
};

export const MOBILE_STATIC_STAR_CAP: Record<"ultra_low" | "low", number> = {
  ultra_low: 128,
  low: 168,
};

export type MobileGiantKind =
  | "mosquito"
  | "monarch"
  | "beetle"
  | "dragonfly"
  | "firefly";

export interface MobileStageGiant {
  kind: MobileGiantKind;
  unlockStage: number;
  path: FlyPath;
  speed: number;
  seed: number;
}

/** One giant species per stage band (bee handled separately). */
export const MOBILE_STAGE_GIANTS: MobileStageGiant[] = [
  { kind: "mosquito", unlockStage: 24, path: "drift", speed: 0.5, seed: 24 },
  { kind: "monarch", unlockStage: 36, path: "ellipse", speed: 0.46, seed: 36 },
  { kind: "beetle", unlockStage: 48, path: "orbit", speed: 0.48, seed: 48 },
  { kind: "dragonfly", unlockStage: 60, path: "wave", speed: 0.5, seed: 72 },
  { kind: "firefly", unlockStage: 72, path: "drift", speed: 0.42, seed: 84 },
];

export function mobileTierKey(
  tier: QualityTier
): "ultra_low" | "low" {
  return tier === "ultra_low" ? "ultra_low" : "low";
}

export function getMobileFlyingRoster(
  stage: number,
  tier: QualityTier
): { beeCount: number; giants: MobileStageGiant[] } {
  const key = mobileTierKey(tier);
  const maxTotal = MOBILE_FLIGHT_CAP[key];
  const wantBees =
    stage >= 12 ? Math.min(MOBILE_BEE_CAP[key], maxTotal) : 0;

  const unlocked = MOBILE_STAGE_GIANTS.filter((g) => stage >= g.unlockStage);
  const giantCap = Math.min(
    MOBILE_GIANT_CAP[key],
    Math.max(0, maxTotal - wantBees)
  );
  const giants = unlocked.slice(-giantCap);

  const beeCount = Math.min(wantBees, Math.max(0, maxTotal - giants.length));

  return { beeCount, giants };
}
