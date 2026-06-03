"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useCreatureFrame } from "@/hooks/useCreatureFrame";
import { getTrunkMetrics } from "@/lib/plantScale";
import {
  caterpillarTrunkRadius,
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
  const outwardLocal = useRef(new THREE.Vector3());

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
    const radius = mobileCrawl
      ? caterpillarTrunkRadius(trunk, y, scale)
      : trunkRadiusAt(trunk, y, 0.012 * scale);

    ref.current.position.set(Math.cos(wobbleA) * radius, y, Math.sin(wobbleA) * radius);
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

      if (mobileCrawl) {
        const outwardWorld = new THREE.Vector3(Math.cos(wobbleA), 0, Math.sin(wobbleA));
        outwardLocal.current.copy(outwardWorld);
        outwardLocal.current.applyAxisAngle(new THREE.Vector3(0, 1, 0), -(wobbleA + Math.PI / 2));
        const cling = 0.022 * scale;
        bodyRef.current.position.set(
          outwardLocal.current.x * cling,
          Math.abs(Math.sin(walk.stepPhase * 2.2)) * 0.003 * scale * walk.moveAmount,
          outwardLocal.current.z * cling
        );
      } else {
        bodyRef.current.position.y =
          Math.abs(Math.sin(walk.stepPhase * 2.2)) * 0.003 * scale * walk.moveAmount;
        bodyRef.current.position.x = 0;
        bodyRef.current.position.z = 0;
      }
    }
  }, seed);

  return (
    <group ref={ref} scale={scale}>
      <group ref={orientRef}>
        <group ref={bodyRef} rotation={[Math.PI / 2, 0, 0]}>
          <group rotation={[0, -Math.PI / 2, 0]}>
            <CaterpillarMesh pattern={pattern} slow={mobileCrawl} />
          </group>
        </group>
      </group>
    </group>
  );
}
