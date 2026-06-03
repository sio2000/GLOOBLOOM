"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useThrottledFrame } from "@/hooks/useThrottledFrame";
import { getTrunkMetrics } from "@/lib/plantScale";
import {
  computeNaturalTrunkWalk,
  computeTrunkWalkWithMidPause,
  trunkRadiusAt,
} from "@/lib/trunkWalker";
import { CaterpillarMesh, type CaterpillarMotionPattern } from "./InsectMeshes";

export function AnimatedCaterpillar({
  trunk,
  yMin,
  yMax,
  angle,
  pattern,
  scale,
  seed,
  speed = 0.26,
  midPause = false,
}: {
  trunk: ReturnType<typeof getTrunkMetrics>;
  yMin: number;
  yMax: number;
  angle: number;
  pattern: CaterpillarMotionPattern;
  scale: number;
  seed: number;
  speed?: number;
  midPause?: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const orientRef = useRef<THREE.Group>(null);
  const phase = (seed * 0.17) % 1;
  const surfaceOffset = 0.012 * scale;

  useThrottledFrame(({ clock }) => {
    if (!ref.current) return;
    const elapsed = clock.elapsedTime;
    const walk = midPause
      ? computeTrunkWalkWithMidPause(elapsed, speed, phase, yMin, yMax)
      : computeNaturalTrunkWalk(elapsed, speed, phase, yMin, yMax);

    const stepWobble = Math.sin(walk.stepPhase + pattern * 0.7) * 0.006;
    const wobbleA = angle + stepWobble;
    const radius = trunkRadiusAt(trunk, walk.y, surfaceOffset);

    ref.current.position.set(Math.cos(wobbleA) * radius, walk.y, Math.sin(wobbleA) * radius);
    ref.current.rotation.y = wobbleA + Math.PI / 2;

    if (orientRef.current) {
      orientRef.current.rotation.y = walk.direction === 1 ? 0 : Math.PI;
    }

    if (bodyRef.current) {
      const crawlTilt =
        walk.direction * walk.moveAmount * 0.13 + Math.sin(walk.stepPhase * 1.3) * 0.04;
      const bentTilt = crawlTilt * (1 - walk.posture);
      bodyRef.current.rotation.x = bentTilt;
      bodyRef.current.rotation.z = walk.posture * 0.22;
      bodyRef.current.position.y =
        Math.abs(Math.sin(walk.stepPhase * 2.2)) * 0.003 * scale * walk.moveAmount;
    }
  });

  return (
    <group ref={ref} scale={scale}>
      <group ref={orientRef}>
        <group ref={bodyRef} rotation={[Math.PI / 2, 0, 0]}>
          <group rotation={[0, -Math.PI / 2, 0]}>
            <CaterpillarMesh pattern={pattern} slow />
          </group>
        </group>
      </group>
    </group>
  );
}
