import * as THREE from "three";

const _proj = new THREE.Vector3();

/** Distance + frustum gate for optional unmount / freeze. */
export function isWorldPointVisible(
  camera: THREE.Camera,
  worldY: number,
  radius = 12,
  maxDistance = 120
): boolean {
  if (!(camera instanceof THREE.PerspectiveCamera)) return true;

  const dist = Math.abs(camera.position.y - worldY);
  if (dist > maxDistance) return false;

  _proj.set(0, worldY, 0).project(camera);
  if (_proj.z < -1 || _proj.z > 1) return false;
  const margin = radius / Math.max(dist, 1);
  return (
    _proj.x >= -1 - margin &&
    _proj.x <= 1 + margin &&
    _proj.y >= -1 - margin &&
    _proj.y <= 1 + margin
  );
}

export function distanceQualityScale(
  distance: number,
  near = 8,
  far = 80
): number {
  if (distance <= near) return 1;
  if (distance >= far) return 0.15;
  return 1 - ((distance - near) / (far - near)) * 0.85;
}
