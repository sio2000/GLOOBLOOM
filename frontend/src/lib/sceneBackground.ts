import * as THREE from "three";

/** Night sky — never lerp stage accent (avoids pink/magenta wash on high stages). */
export const SCENE_SKY_HEX = "#020408";

export function getSceneSkyColor(): THREE.Color {
  return new THREE.Color(SCENE_SKY_HEX);
}

/** Cap animated instances per species on mobile (max 2; if above, drop by one). */
export function limitMobileSpeciesCount(
  count: number,
  mobileLite: boolean,
  maxPerSpecies = 2
): number {
  if (!mobileLite || count <= 0) return count;
  if (count <= maxPerSpecies) return count;
  return Math.min(count - 1, maxPerSpecies);
}
