"use client";

import { useRef, type RefObject } from "react";
import * as THREE from "three";
import { useCreatureFrame } from "@/hooks/useCreatureFrame";
import { getTrunkMetrics } from "@/lib/plantScale";
import {
  computeMobileTrunkWalk,
  computeNaturalTrunkWalk,
  trunkRadiusAt,
} from "@/lib/trunkWalker";
import {
  BUTTERFLY_LANES,
  LADYBUG_LANES,
  TRUNK_Y_FULL,
  TRUNK_Y_ROOT,
  trunkLaneAngle,
  trunkYRange,
} from "@/lib/trunkLanes";
import { LadybugMesh } from "./insects/InsectMeshes";

function seeded(seed: number, n: number): number {
  const x = Math.sin(seed * 127.1 + n * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

type ClimberProps = {
  yMin: number;
  yMax: number;
  angle: number;
  trunkR: number;
  trunk?: ReturnType<typeof getTrunkMetrics>;
  speed: number;
  scale: number;
  seed: number;
  mobileCrawl?: boolean;
};

function useTrunkWalk(props: ClimberProps) {
  const { yMin, yMax, angle, trunkR, trunk, speed, seed, scale, mobileCrawl } = props;
  const ref = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const orientRef = useRef<THREE.Group>(null);
  const phase = seeded(seed, 0) * 0.85;
  const surfaceOffset = 0.014 * scale;
  const ySmooth = useRef((yMin + yMax) * 0.5);

  useCreatureFrame(({ clock }) => {
    if (!ref.current) return;
    const walk = mobileCrawl
      ? computeMobileTrunkWalk(clock.elapsedTime, speed, phase, yMin, yMax)
      : computeNaturalTrunkWalk(clock.elapsedTime, speed, phase, yMin, yMax);

    const y = mobileCrawl
      ? (ySmooth.current = THREE.MathUtils.lerp(ySmooth.current, walk.y, 0.5))
      : walk.y;

    const stepWobble = Math.sin(walk.stepPhase) * (mobileCrawl ? 0.012 : 0.008);
    const wobbleA = angle + stepWobble;
    const radius = trunk
      ? trunkRadiusAt(trunk, y, surfaceOffset)
      : trunkR + surfaceOffset;

    ref.current.position.set(
      Math.cos(wobbleA) * radius,
      y,
      Math.sin(wobbleA) * radius
    );
    ref.current.rotation.y = wobbleA + Math.PI / 2;

    if (orientRef.current) {
      orientRef.current.rotation.y = walk.direction === 1 ? 0 : Math.PI;
    }

    if (bodyRef.current) {
      const stride = walk.moveAmount * 0.11;
      bodyRef.current.rotation.x =
        walk.direction * stride + Math.sin(walk.stepPhase * 1.4) * 0.035;
      bodyRef.current.rotation.z = Math.sin(walk.stepPhase * 2.1) * 0.04;
      bodyRef.current.position.y =
        Math.abs(Math.sin(walk.stepPhase * 2)) * 0.0025 * scale;
    }
  }, seed);

  return { ref, bodyRef, orientRef };
}

export function TrunkClimber(props: ClimberProps) {
  const { ref, bodyRef, orientRef } = useTrunkWalk(props);
  const { scale } = props;

  return (
    <group ref={ref}>
      <group ref={orientRef}>
        <group ref={bodyRef} rotation={[Math.PI / 2, 0, 0]}>
          <LadybugMesh scale={scale} />
        </group>
      </group>
    </group>
  );
}

function TrunkButterflyMesh({
  scale,
  color,
  wingL,
  wingR,
}: {
  scale: number;
  color: string;
  wingL: RefObject<THREE.Mesh | null>;
  wingR: RefObject<THREE.Mesh | null>;
}) {
  return (
    <group scale={scale}>
      <mesh>
        <capsuleGeometry args={[0.004, 0.028, 4, 6]} />
        <meshStandardMaterial color="#101008" />
      </mesh>
      <mesh ref={wingL as RefObject<THREE.Mesh>} position={[0.024, 0.004, 0]}>
        <planeGeometry args={[0.055, 0.038]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.42}
          side={THREE.DoubleSide}
          transparent
          opacity={0.88}
        />
      </mesh>
      <mesh ref={wingR as RefObject<THREE.Mesh>} position={[-0.024, 0.004, 0]} scale={[-1, 1, 1]}>
        <planeGeometry args={[0.055, 0.038]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.42}
          side={THREE.DoubleSide}
          transparent
          opacity={0.88}
        />
      </mesh>
    </group>
  );
}

export function TrunkButterflyClimber({
  color,
  ...props
}: ClimberProps & { color: string }) {
  const ref = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const orientRef = useRef<THREE.Group>(null);
  const wingL = useRef<THREE.Mesh>(null);
  const wingR = useRef<THREE.Mesh>(null);
  const phase = seeded(props.seed, 0) * 0.85;
  const surfaceOffset = 0.014 * props.scale;

  useCreatureFrame(({ clock }) => {
    if (!ref.current) return;
    const walk = computeNaturalTrunkWalk(
      clock.elapsedTime,
      props.speed,
      phase,
      props.yMin,
      props.yMax
    );

    const flap = Math.sin(clock.elapsedTime * 5 + walk.stepPhase) * 0.4;
    if (wingL.current) wingL.current.rotation.z = flap;
    if (wingR.current) wingR.current.rotation.z = -flap;

    const stepWobble = Math.sin(walk.stepPhase) * 0.008;
    const wobbleA = props.angle + stepWobble;
    const radius = props.trunk
      ? trunkRadiusAt(props.trunk, walk.y, surfaceOffset)
      : props.trunkR + surfaceOffset;

    ref.current.position.set(
      Math.cos(wobbleA) * radius,
      walk.y,
      Math.sin(wobbleA) * radius
    );
    ref.current.rotation.y = wobbleA + Math.PI / 2;

    if (orientRef.current) {
      orientRef.current.rotation.y = walk.direction === 1 ? 0 : Math.PI;
    }

    if (bodyRef.current) {
      const stride = walk.moveAmount * 0.1;
      bodyRef.current.rotation.x =
        walk.direction * stride + Math.sin(walk.stepPhase * 1.4) * 0.03;
    }
  }, props.seed);

  return (
    <group ref={ref}>
      <group ref={orientRef}>
        <group ref={bodyRef} rotation={[Math.PI / 2, 0, 0]}>
          <TrunkButterflyMesh
            scale={props.scale}
            color={color}
            wingL={wingL}
            wingR={wingR}
          />
        </group>
      </group>
    </group>
  );
}

export const MAX_TRUNK_LADYBUGS = 4;
export const MAX_TRUNK_BUTTERFLIES = 2;

const BUTTERFLY_COLORS = ["#ffb347", "#c77dff", "#6ecfff", "#ff7eb8"];

export function buildTrunkClimbers(
  stage: number,
  _trunkR: number,
  yBottom: number,
  yTop: number,
  sizeBoost: number
) {
  const span = yTop - yBottom;
  const full = trunkYRange(yBottom, span, TRUNK_Y_FULL);

  const trunk = LADYBUG_LANES.map((lane, i) => ({
    id: `trunk-${i}`,
    angle: trunkLaneAngle(lane),
    yMin: full.yMin,
    yMax: full.yMax,
    speed: 0.28 + seeded(i, 4) * 0.2,
    scale: (3.5 + seeded(i, 5) * 4.5) * sizeBoost * 0.18,
    seed: i + stage * 0.13,
  }));

  const butterflies = BUTTERFLY_LANES.map((lane, i) => ({
    id: `bf-trunk-${i}`,
    angle: trunkLaneAngle(lane),
    yMin: full.yMin,
    yMax: full.yMax,
    speed: 0.26 + seeded(i + 20, 3) * 0.18,
    scale: (3.2 + seeded(i + 20, 4) * 3.8) * sizeBoost * 0.2,
    seed: i + stage * 0.19 + 50,
    color: BUTTERFLY_COLORS[i % BUTTERFLY_COLORS.length]!,
  }));

  return { trunk, butterflies, root: [] as typeof trunk };
}
