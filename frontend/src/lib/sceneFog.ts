import * as THREE from "three";
import { getSceneSkyColor } from "@/lib/sceneBackground";

export function applyZoomAwareFog(
  scene: THREE.Scene,
  camera: THREE.Camera,
  targetY: number,
  baseNear: number,
  baseFar: number
): void {
  const target = new THREE.Vector3(0, targetY, 0);
  const dist = camera.position.distanceTo(target);
  const far = Math.max(baseFar, dist * 7, baseFar * 1.8);
  const near = Math.min(baseNear, Math.max(12, dist * 0.22));
  const fogColor = getSceneSkyColor();

  if (!scene.fog || !(scene.fog instanceof THREE.Fog)) {
    scene.fog = new THREE.Fog(fogColor.getHex(), near, far);
  } else {
    scene.fog.near = near;
    scene.fog.far = far;
    scene.fog.color.copy(fogColor);
  }
}
