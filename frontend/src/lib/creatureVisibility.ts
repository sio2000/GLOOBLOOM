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
  const tier = usePerformanceStore.getState().tier;
  if (tier === "ultra_low" || tier === "low") return true;

  const maxDist = 120 * Math.max(0.9, drawDistanceScale);
  if (camera.position.distanceToSquared(position) > maxDist * maxDist) {
    return false;
  }
  return isWorldPointVisible(camera, position.y, 4, maxDist);
}

export type CreatureVisibilityCache = { last: boolean; tick: number };

export function checkCreatureVisible(
  camera: THREE.Camera,
  position: THREE.Vector3,
  seed: number,
  cache: CreatureVisibilityCache
): boolean {
  const tier = usePerformanceStore.getState().tier;
  if (tier === "ultra_low" || tier === "low") {
    cache.last = true;
    return true;
  }

  cache.tick += 1;
  const interval = 4;
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
