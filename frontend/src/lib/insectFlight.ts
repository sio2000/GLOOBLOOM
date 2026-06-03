import * as THREE from "three";
import {
  buildPlantFlightBounds,
  applyPlantAvoidance,
  type PlantFlightBounds,
} from "./plantFlightAvoidance";

export type FlyPath =
  | "orbit"
  | "figure8"
  | "vertical"
  | "ellipse"
  | "wave"
  | "spiral"
  | "lissajous"
  | "helix"
  | "wander"
  | "zigzag"
  | "drift";

const ALL_PATHS: FlyPath[] = [
  "orbit",
  "figure8",
  "vertical",
  "ellipse",
  "wave",
  "spiral",
  "lissajous",
  "helix",
  "wander",
  "zigzag",
  "drift",
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Layered pseudo-noise — incommensurate freqs so loops take minutes, not seconds */
function organicNoise(t: number, seed: number): number {
  return (
    Math.sin(t * 0.87 + seed) * 0.42 +
    Math.sin(t * 1.63 + seed * 1.17) * 0.28 +
    Math.sin(t * 2.71 + seed * 0.53) * 0.18 +
    Math.sin(t * 4.19 + seed * 2.31) * 0.12
  );
}

export interface FlightProfile {
  seed: number;
  speed: number;
  path: FlyPath;
  pathB: FlyPath;
  baseR: number;
  maxH: number;
  ox: number;
  oy: number;
  oz: number;
  dir: number;
  wanderSeed: number;
  segmentDur: number;
  scale: number;
  avoidance?: PlantFlightBounds;
}

export function createFlightProfile(
  seed: number,
  plantHeight: number,
  centerY: number,
  speed = 0.35,
  path: FlyPath = "wander",
  scale = 1,
  stage?: number,
  growth?: number
): FlightProfile {
  const r = (n: number) => seededRandom(seed + n);
  const pickPath = (offset: number) =>
    ALL_PATHS[Math.floor(r(offset) * ALL_PATHS.length)] ?? "wander";

  const avoidance =
    stage != null && growth != null ? buildPlantFlightBounds(stage, growth) : undefined;

  const minOrbit =
    avoidance != null
      ? Math.max(
          2.8,
          (avoidance.trunkRadiusBottom +
            avoidance.crownRadius +
            avoidance.stage * 0.012) *
            avoidance.widthScale *
            2.2
        )
      : 3.2;

  return {
    seed,
    // Global ~35% faster travel so winged insects look like they're flying,
    // not slowly drifting around the plant.
    speed: speed * (0.75 + r(1) * 0.85) * 1.35,
    path,
    pathB: pickPath(900),
    baseR: Math.max(minOrbit, (3.2 + r(2) * 4.0 + plantHeight * 0.16) * scale),
    maxH: plantHeight * (0.42 + r(3) * 0.5) * scale,
    ox: (r(4) - 0.5) * 3.2 * scale,
    oy: centerY + 0.3 + r(5) * 1.6,
    oz: (r(6) - 0.5) * 3.2 * scale - 0.8,
    dir: r(7) > 0.5 ? 1 : -1,
    wanderSeed: r(40) * 1000,
    segmentDur: 32 + r(41) * 58,
    scale,
    avoidance,
  };
}

function evalPath(
  path: FlyPath,
  t: number,
  r: number,
  maxH: number,
  cy: number,
  seed: number
): THREE.Vector3 {
  const n = organicNoise(t * 0.18, seed);
  const n2 = organicNoise(t * 0.24 + 40, seed + 17);
  const wobble = 1 + n * 0.28;
  const rw = r * wobble;

  switch (path) {
    case "figure8":
      return new THREE.Vector3(
        Math.sin(t * (0.48 + n * 0.06)) * rw * 1.35 + Math.cos(t * 1.91) * 0.65,
        cy + 0.7 + Math.sin(t * (0.95 + n2 * 0.05)) * maxH * 0.85 + Math.cos(t * 0.31) * 0.55,
        Math.sin(t * (1.05 + n2 * 0.07)) * rw * 0.72 + Math.cos(t * 0.52) * 0.75
      );
    case "vertical":
      return new THREE.Vector3(
        Math.cos(seed * 0.9) * rw * 0.55 + Math.sin(t * 0.67) * rw * 0.35 + n * 0.8,
        cy + 0.4 + ((Math.sin(t * (0.38 + n * 0.04)) + 1) * 0.5) * maxH * 1.55 + n2 * 0.7,
        Math.sin(seed * 0.9) * rw * 0.55 + Math.cos(t * 0.54) * 0.9 + n2 * 0.6
      );
    case "ellipse":
      return new THREE.Vector3(
        Math.cos(t * (0.44 + n * 0.05)) * rw * 1.55 + Math.sin(t * 2.2) * 0.5,
        cy + 0.65 + Math.sin(t * (0.82 + n2 * 0.06)) * maxH * 0.65 + Math.cos(t * 1.6) * 0.35,
        Math.sin(t * (0.44 + n2 * 0.04)) * rw * 0.85 + Math.cos(t * 1.35) * 0.55
      );
    case "wave":
      return new THREE.Vector3(
        Math.cos(t * (0.62 + n * 0.08)) * rw + Math.sin(t * 2.15) * 0.85 + Math.cos(t * 3.7) * 0.35,
        cy + 0.55 + Math.abs(Math.sin(t * (0.48 + n2 * 0.05))) * maxH * 1.05 + n * 0.45,
        Math.sin(t * (0.62 + n2 * 0.07)) * rw * 1.05 - 1.4 + Math.cos(t * 1.75) * 0.65
      );
    case "spiral":
      return new THREE.Vector3(
        Math.cos(t * (0.36 + n * 0.04)) * rw * (0.45 + (Math.sin(t * 0.06) + 1) * 0.42),
        cy + 0.45 + Math.abs(Math.sin(t * (0.31 + n2 * 0.03))) * maxH * 1.1 + Math.sin(t * 1.15) * 0.65,
        Math.sin(t * (0.36 + n2 * 0.04)) * rw * (0.45 + (Math.sin(t * 0.06) + 1) * 0.42)
      );
    case "lissajous":
      return new THREE.Vector3(
        Math.sin(t * (0.57 + seed * 0.02) + n * 0.1) * rw * 1.4 + Math.cos(t * 1.73) * 0.55,
        cy + 0.55 + Math.sin(t * (0.89 + seed * 0.015) + n2 * 0.08) * maxH * 0.9 + Math.cos(t * 2.05) * 0.35,
        Math.sin(t * (1.07 + seed * 0.012) + n * 0.09) * rw * 0.95 + Math.sin(t * 0.39) * 0.65
      );
    case "helix":
      return new THREE.Vector3(
        Math.cos(t * 0.52) * rw * (0.65 + n * 0.25),
        cy + 0.35 + Math.abs(Math.sin(t * (0.22 + n2 * 0.04) + seed * 0.1)) * maxH * 1.35 + Math.sin(t * 1.4) * 0.4,
        Math.sin(t * 0.52) * rw * (0.65 + n2 * 0.25)
      );
    case "zigzag":
      return new THREE.Vector3(
        Math.cos(t * 0.78) * rw + Math.sign(Math.sin(t * 3.2 + seed)) * rw * 0.22 + n * 0.5,
        cy + 0.5 + Math.abs(Math.sin(t * 0.55)) * maxH * 0.95 + Math.abs(n2) * 0.55,
        Math.sin(t * 0.78) * rw * 0.9 + Math.sign(Math.cos(t * 2.8 + seed)) * 0.45
      );
    case "drift":
      return new THREE.Vector3(
        organicNoise(t * 0.35, seed) * rw * 1.25 + Math.cos(t * 0.41) * rw * 0.35,
        cy + 0.5 + (organicNoise(t * 0.28 + 20, seed + 8) * 0.5 + 0.5) * maxH * 1.15,
        organicNoise(t * 0.31 + 35, seed + 22) * rw * 1.1 + Math.sin(t * 0.47) * rw * 0.4
      );
    case "wander":
      return new THREE.Vector3(
        Math.cos(t * (0.34 + n * 0.14)) * rw * (1 + n * 0.35) +
          Math.sin(t * 1.58) * rw * 0.32 +
          Math.cos(t * 2.83) * 0.45,
        cy +
          0.4 +
          Math.abs(Math.sin(t * (0.26 + n2 * 0.1))) * maxH * (0.9 + n * 0.3) +
          n2 * 0.75 +
          Math.sin(t * 1.95) * 0.25,
        Math.sin(t * (0.39 + n2 * 0.12)) * rw * (0.8 + n2 * 0.3) +
          Math.cos(t * 1.92) * 0.55 +
          Math.sin(t * 0.71) * 0.4
      );
    default:
      return new THREE.Vector3(
        Math.cos(t * (0.58 + n * 0.08)) * rw + Math.sin(t * 1.65) * 0.55 + Math.cos(t * 2.9) * 0.35,
        cy + 0.5 + Math.abs(Math.sin(t * (0.36 + n2 * 0.06))) * maxH * 1.05 + Math.sin(t * 2.05) * 0.25,
        Math.sin(t * (0.58 + n2 * 0.07)) * rw + Math.cos(t * 1.42) * 0.45 + Math.sin(t * 0.83) * 0.35
      );
  }
}

const _pos = new THREE.Vector3();
const _ahead = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();

export function sampleFlight(
  profile: FlightProfile,
  clock: THREE.Clock
): { pos: THREE.Vector3; t: number; yaw: number } {
  const elapsed = clock.elapsedTime;
  const segment = Math.floor(elapsed / profile.segmentDur);
  const segT = (elapsed % profile.segmentDur) / profile.segmentDur;
  const morph = smoothstep(0.68, 1.0, segT);

  const speedMod =
    1 +
    0.38 * Math.sin(elapsed * 0.08 + profile.seed) +
    0.2 * Math.sin(elapsed * 0.19 + profile.wanderSeed) +
    (Math.sin(elapsed * 0.041 + profile.seed * 0.7) > 0.93 ? 0.55 : 0);

  const t =
    elapsed * profile.speed * profile.dir * speedMod + profile.seed * 2.17;

  const pathA = segment % 2 === 0 ? profile.path : profile.pathB;
  const pathB = segment % 2 === 0 ? profile.pathB : profile.path;

  _a.copy(
    evalPath(pathA, t, profile.baseR, profile.maxH, profile.oy, profile.wanderSeed + segment)
  );
  _b.copy(
    evalPath(
      pathB,
      t + 0.55,
      profile.baseR * 1.08,
      profile.maxH * 1.05,
      profile.oy,
      profile.wanderSeed + segment + 1
    )
  );

  _pos.lerpVectors(_a, _b, morph);
  _pos.x += profile.ox + organicNoise(elapsed * 0.16, profile.wanderSeed) * 1.1;
  _pos.z += profile.oz + organicNoise(elapsed * 0.19 + 30, profile.wanderSeed + 5) * 1.1;

  if (profile.avoidance) {
    applyPlantAvoidance(_pos, profile.avoidance);
  }

  const lookT = t + 0.22 * profile.dir * (0.75 + speedMod * 0.35);
  _ahead.copy(
    evalPath(pathA, lookT, profile.baseR, profile.maxH, profile.oy, profile.wanderSeed + segment)
  );
  _ahead.x += profile.ox;
  _ahead.z += profile.oz;

  const yaw = Math.atan2(_ahead.x - _pos.x, _ahead.z - _pos.z);
  return { pos: _pos.clone(), t, yaw };
}
