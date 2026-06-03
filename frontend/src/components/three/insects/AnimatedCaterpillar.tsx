"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useCreatureFrame } from "@/hooks/useCreatureFrame";
import { getTrunkMetrics } from "@/lib/plantScale";
import {
  computeMobileTrunkWalk,
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
  mobileCrawl = false,
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
  mobileCrawl?: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const orientRef = useRef<THREE.Group>(null);
  const phase = (seed * 0.17) % 1;
  const ySmooth = useRef((yMin + yMax) * 0.5);
  const surfaceOffset = 0.014 * scale;
  const barkCling = 0.01 * scale;

  useCreatureFrame(({ clock }) => {
    if (!ref.current) return;
    const elapsed = clock.elapsedTime;
    const walk = mobileCrawl
      ? computeMobileTrunkWalk(elapsed, speed, phase, yMin, yMax)
      : midPause
        ? computeTrunkWalkWithMidPause(elapsed, speed, phase, yMin, yMax)
        : computeNaturalTrunkWalk(elapsed, speed, phase, yMin, yMax);

    const y = mobileCrawl
      ? (ySmooth.current = THREE.MathUtils.lerp(ySmooth.current, walk.y, 0.5))
      : walk.y;

    const stepWobble = Math.sin(walk.stepPhase + pattern * 0.7) * (mobileCrawl ? 0.01 : 0.006);
    const wobbleA = angle + stepWobble;
    const radius = trunkRadiusAt(trunk, y, surfaceOffset);
    const cling = mobileCrawl ? barkCling : 0;
    const cx = Math.cos(wobbleA);
    const cz = Math.sin(wobbleA);

    ref.current.position.set(cx * (radius - cling), y, cz * (radius - cling));
    ref.current.rotation.y = wobbleA + Math.PI / 2;

    if (orientRef.current) {
      if (mobileCrawl) {
        orientRef.current.rotation.set(walk.direction === 1 ? 0 : Math.PI, 0, 0);
      } else {
        orientRef.current.rotation.set(0, walk.direction === 1 ? 0 : Math.PI, 0);
      }
    }

    if (bodyRef.current) {
      const crawlTilt = mobileCrawl
        ? Math.abs(walk.moveAmount) * 0.08 + Math.sin(walk.stepPhase * 1.3) * 0.04
        : walk.direction * walk.moveAmount * 0.13 + Math.sin(walk.stepPhase * 1.3) * 0.04;
      const bentTilt = crawlTilt * (1 - walk.posture);
      bodyRef.current.rotation.x = bentTilt;
      bodyRef.current.rotation.z = walk.posture * 0.22;

      const stepLift =
        Math.abs(Math.sin(walk.stepPhase * 2.2)) * 0.003 * scale * walk.moveAmount;
      bodyRef.current.position.y = stepLift;
      bodyRef.current.position.x = 0;
      bodyRef.current.position.z = 0;
    }
  }, seed);

  return (
    <group ref={ref}>
      <group ref={orientRef}>
        <group ref={bodyRef} rotation={[Math.PI / 2, 0, 0]}>
          <group rotation={[0, -Math.PI / 2, 0]}>
            <CaterpillarMesh pattern={pattern} slow={mobileCrawl} scale={scale} />
          </group>
        </group>
      </group>
    </group>
  );
}
