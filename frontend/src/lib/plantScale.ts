/** Shared plant dimension helpers — keep trunk math consistent across components. */

const GROUP_OFFSET_Y = -0.3;

export function getScales(stage: number) {
  const s = Math.max(1, Math.min(stage, 100));
  const widthScale = 0.80 + s * 0.018;
  const heightScale = 1.20 + s * 0.058;
  return { widthScale, heightScale };
}

export function getTrunkMetrics(stage: number, growth: number) {
  const trunkBaseY = -0.48;
  const trunkHeight = 0.55 + stage * 0.095 + growth * 0.014 + (stage >= 50 ? (stage - 50) * 0.045 : 0);
  const trunkTopY = trunkBaseY + trunkHeight;
  const trunkRadiusBottom = 0.055 + stage * 0.0035 + growth * 0.0012 + (stage >= 50 ? (stage - 50) * 0.002 : 0);
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
  const crownRadius = 0.22 + stage * 0.004 + growth * 0.0015;
  const bottom = (groupOffsetY + trunkBaseY) * heightScale;
  const top = (groupOffsetY + trunkTopY + crownRadius * 0.6) * heightScale;
  const worldHeight = Math.max(2, top - bottom);
  const centerY = (top + bottom) / 2;
  return { bottom, top, worldHeight, centerY, heightScale, widthScale };
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
    fogNear: mobile ? 14 : 18,
    fogFar: Math.max(120, worldHeight * 5 + 80),
    targetY: centerY,
    cameraY,
    cameraZ,
    fov,
    panRange,
    panStep,
    worldHeight,
  };
}
