/** Fixed lanes around the trunk so climbers never share the same meridian. */

export const TRUNK_LANE_COUNT = 9;

export function trunkLaneAngle(lane: number): number {
  return ((lane % TRUNK_LANE_COUNT) / TRUNK_LANE_COUNT) * Math.PI * 2;
}

/** Full usable trunk height ratios (world Y = base + height * ratio). */
export const TRUNK_Y_FULL = { min: 0.04, max: 0.96 };
export const TRUNK_Y_ROOT = { min: 0.02, max: 0.17 };

export const CATERPILLAR_LANES = [0, 3, 6] as const;
export const LADYBUG_LANES = [1, 2, 4, 7] as const;
export const BUTTERFLY_LANES = [5, 8] as const;

export function trunkYRange(
  trunkBaseY: number,
  trunkHeight: number,
  range: { min: number; max: number }
) {
  return {
    yMin: trunkBaseY + trunkHeight * range.min,
    yMax: trunkBaseY + trunkHeight * range.max,
  };
}
