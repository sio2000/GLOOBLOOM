import * as THREE from "three";
import {
  createFlightProfile,
  sampleFlight,
  type FlightProfile,
  type FlyPath,
} from "@/lib/insectFlight";

const GENTLE_PATHS: FlyPath[] = ["drift", "orbit", "ellipse", "wave"];

/** Slower, wider paths — less left/right teleport on mobile demand renders. */
export function createMobileFlightProfile(
  seed: number,
  plantHeight: number,
  centerY: number,
  speed: number,
  path: FlyPath,
  stage: number,
  growth: number
): FlightProfile {
  const gentle = GENTLE_PATHS[Math.floor(seed) % GENTLE_PATHS.length] ?? "drift";
  const p = createFlightProfile(
    seed,
    plantHeight,
    centerY,
    speed * 1.02,
    gentle,
    1,
    stage,
    growth
  );
  return {
    ...p,
    path: path === "zigzag" || path === "helix" ? gentle : path,
    pathB: GENTLE_PATHS[(Math.floor(seed) + 1) % GENTLE_PATHS.length]!,
    segmentDur: p.segmentDur * 0.96,
    speed: p.speed * 1.18,
  };
}

/** Light blend between sparse demand frames — avoids jumps without heavy lag. */
export function createFlightSmoother(lerpAlpha = 0.48) {
  const pos = new THREE.Vector3();
  let yaw = 0;
  let init = false;
  return (profile: FlightProfile, clock: THREE.Clock) => {
    const raw = sampleFlight(profile, clock);
    if (!init) {
      pos.copy(raw.pos);
      yaw = raw.yaw;
      init = true;
    } else {
      pos.lerp(raw.pos, lerpAlpha);
      yaw = THREE.MathUtils.lerp(yaw, raw.yaw, lerpAlpha);
    }
    return { pos: pos.clone(), yaw };
  };
}
