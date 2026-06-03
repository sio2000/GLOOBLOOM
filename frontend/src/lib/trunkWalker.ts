import * as THREE from "three";
import type { getTrunkMetrics } from "./plantScale";

export function smoothstep(t: number): number {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

export function trunkRadiusAt(
  trunk: ReturnType<typeof getTrunkMetrics>,
  y: number,
  surfaceOffset: number
): number {
  const t = THREE.MathUtils.clamp((y - trunk.trunkBaseY) / trunk.trunkHeight, 0, 1);
  const r = THREE.MathUtils.lerp(trunk.trunkRadiusBottom, trunk.trunkRadiusTop, t);
  return r + surfaceOffset;
}

export type TrunkWalkState = {
  y: number;
  direction: 1 | -1;
  stepPhase: number;
  moveAmount: number;
  /** 0 = bent crawl, 1 = reared upright off trunk */
  posture: number;
};

function cycleProgress(elapsed: number, speed: number, phase: number): number {
  return ((elapsed * speed * 0.045) + phase) % 1;
}

const DEFAULT_TRUNK_PAUSE = 0.52;
const MOBILE_TRUNK_PAUSE = 0.34;

function steppedInch(tri: number, pauseRatio = DEFAULT_TRUNK_PAUSE): number {
  const steps = 14;
  const raw = tri * steps;
  const stepIndex = Math.floor(raw);
  const stepFrac = raw - stepIndex;
  const moveRatio = 1 - pauseRatio;
  return (
    stepIndex / steps +
    (stepFrac > pauseRatio ? smoothstep((stepFrac - pauseRatio) / moveRatio) / steps : 0)
  );
}

function inchProgress(
  cycle: number,
  pauseRatio = DEFAULT_TRUNK_PAUSE
): { tri: number; direction: 1 | -1; moveAmount: number } {
  const tri = cycle < 0.5 ? cycle * 2 : 2 - cycle * 2;
  const direction: 1 | -1 = cycle < 0.5 ? 1 : -1;
  const steps = 14;
  const raw = tri * steps;
  const stepFrac = raw - Math.floor(raw);
  const moveRatio = 1 - pauseRatio;
  const moveAmount =
    stepFrac > pauseRatio ? smoothstep((stepFrac - pauseRatio) / moveRatio) : 0;
  return { tri, direction, moveAmount };
}

/** Stepped inching climb — brief pauses between vertical steps. */
export function computeNaturalTrunkWalk(
  elapsed: number,
  speed: number,
  phase: number,
  yMin: number,
  yMax: number
): TrunkWalkState {
  const cycle = cycleProgress(elapsed, speed, phase);
  const { tri, direction, moveAmount } = inchProgress(cycle);
  const inch = steppedInch(tri);
  const span = yMax - yMin;
  const y = yMin + inch * span;
  const stepPhase = elapsed * 4.8 + phase * 9;

  return {
    y,
    direction,
    stepPhase,
    moveAmount,
    posture: 0,
  };
}

/** Continuous smooth crawl — no stepped teleports between Y positions. */
export function computeMobileTrunkWalk(
  elapsed: number,
  speed: number,
  phase: number,
  yMin: number,
  yMax: number
): TrunkWalkState {
  const cycle = ((elapsed * speed * 0.078) + phase) % 1;
  const direction: 1 | -1 = cycle < 0.5 ? 1 : -1;
  const span = yMax - yMin;
  const t = cycle < 0.5 ? cycle * 2 : (cycle - 0.5) * 2;
  const inch = smoothstep(t);
  const y = direction === 1 ? yMin + inch * span : yMax - inch * span;
  const legDrive = Math.sin(elapsed * speed * 9.5 + phase * 11);
  const moveAmount = 0.35 + Math.abs(legDrive) * 0.65;
  const stepPhase = elapsed * 6.8 + phase * 9;

  return {
    y,
    direction,
    stepPhase,
    moveAmount,
    posture: 0,
  };
}

function midPausePosture(cycle: number, center: number, width: number): number {
  const dist = Math.abs(cycle - center);
  if (dist > width * 0.5) return 0;
  const t = 1 - dist / (width * 0.5);
  return smoothstep(Math.sin(t * Math.PI * 0.5));
}

/** Climb with a brief mid-trunk pause — rears upright, then bends and continues. */
export function computeTrunkWalkWithMidPause(
  elapsed: number,
  speed: number,
  phase: number,
  yMin: number,
  yMax: number
): TrunkWalkState {
  const cycle = cycleProgress(elapsed, speed, phase);
  const yMid = (yMin + yMax) * 0.5;
  const pauseWidth = 0.075;
  const posture = Math.max(
    midPausePosture(cycle, 0.25, pauseWidth),
    midPausePosture(cycle, 0.75, pauseWidth)
  );

  if (posture > 0.02) {
    return {
      y: yMid,
      direction: cycle < 0.5 ? 1 : -1,
      stepPhase: elapsed * 3.5 + phase * 7,
      moveAmount: 0,
      posture,
    };
  }

  const remapped =
    cycle < 0.25
      ? cycle / 0.25 * 0.5
      : cycle < 0.75
        ? 0.5 + ((cycle - 0.25) / 0.5) * 0.5
        : 0.5 + ((cycle - 0.75) / 0.25) * 0.5;

  const { tri, direction, moveAmount } = inchProgress(remapped);
  const inch = steppedInch(tri);
  const y = yMin + inch * (yMax - yMin);

  return {
    y,
    direction,
    stepPhase: elapsed * 4.8 + phase * 9,
    moveAmount,
    posture: 0,
  };
}
