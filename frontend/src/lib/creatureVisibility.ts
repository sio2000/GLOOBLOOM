import * as THREE from "three";
import { isWorldPointVisible } from "@/lib/sceneVisibility";
import { usePerformanceStore } from "@/store/usePerformanceStore";

const _scratch = new THREE.Vector3();

/** True when a creature at `position` should animate and draw. */
export function isCreaturePositionVisible(
  camera: THREE.Camera,
  position: THREE.Vector3,
  drawDistanceScale = 1
): boolean {
  const maxDist = 38 * drawDistanceScale;
  if (camera.position.distanceToSquared(position) > maxDist * maxDist) {
    return false;
  }
  return isWorldPointVisible(camera, position.y, 2.5, maxDist * 1.1);
}

export type CreatureVisibilityCache = { last: boolean; tick: number };

export function checkCreatureVisible(
  camera: THREE.Camera,
  position: THREE.Vector3,
  seed: number,
  cache: CreatureVisibilityCache
): boolean {
  cache.tick += 1;
  const tier = usePerformanceStore.getState().tier;
  const interval = tier === "ultra_low" || tier === "low" ? 6 : 4;
  if ((cache.tick + seed * 3) % interval !== 0) return cache.last;

  const scale = usePerformanceStore.getState().settings().drawDistanceScale;
  cache.last = isCreaturePositionVisible(camera, position, scale);
  return cache.last;
}

export function scratchPosition(
  x: number,
  y: number,
  z: number
): THREE.Vector3 {
  return _scratch.set(x, y, z);
}
