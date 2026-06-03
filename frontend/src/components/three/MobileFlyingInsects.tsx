"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useCreatureFrame } from "@/hooks/useCreatureFrame";
import { getPlantWorldBounds } from "@/lib/plantScale";
import type { FlyPath } from "@/lib/insectFlight";
import {
  createMobileFlightProfile,
  createFlightSmoother,
} from "@/lib/mobileFlight";
import type { QualityTier } from "@/lib/performance";
import {
  getMobileFlyingRoster,
  type MobileGiantKind,
  type MobileStageGiant,
} from "@/lib/mobileInsectCaps";
import { mobileInsectScale } from "@/lib/mobileInsectScale";

interface Props {
  stage: number;
  growth: number;
  tier: QualityTier;
}

interface FlyBase {
  seed: number;
  scale: number;
  plantHeight: number;
  centerY: number;
  stage: number;
  growth: number;
  path?: FlyPath;
  speed?: number;
}

function useMobileFly(
  seed: number,
  plantHeight: number,
  centerY: number,
  speed: number,
  path: FlyPath,
  stage: number,
  growth: number
) {
  const profile = useMemo(
    () =>
      createMobileFlightProfile(
        seed,
        plantHeight,
        centerY,
        speed,
        path,
        stage,
        growth
      ),
    [seed, plantHeight, centerY, speed, path, stage, growth]
  );
  const smooth = useMemo(() => createFlightSmoother(), []);
  return (clock: THREE.Clock) => smooth(profile, clock);
}

function LiteHoneyBee({ seed, scale, plantHeight, centerY, stage, growth, path = "orbit", speed = 0.5 }: FlyBase) {
  const grp = useRef<THREE.Group>(null);
  const wL = useRef<THREE.Mesh>(null);
  const wR = useRef<THREE.Mesh>(null);
  const fly = useMobileFly(seed, plantHeight, centerY, speed, path, stage, growth);

  useCreatureFrame(({ clock }) => {
    if (!grp.current) return;
    const { pos, yaw } = fly(clock);
    grp.current.position.copy(pos);
    grp.current.rotation.y = yaw;
    const flap = Math.sin(clock.elapsedTime * 14 + seed) * 0.72;
    if (wL.current) wL.current.rotation.z = flap;
    if (wR.current) wR.current.rotation.z = -flap;
  });

  return (
    <group ref={grp} scale={scale}>
      <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.04, 0.08, 4, 6]} />
        <meshStandardMaterial color="#ffd020" />
      </mesh>
      <mesh position={[0, 0.01, -0.03]}>
        <sphereGeometry args={[0.045, 6, 6]} />
        <meshStandardMaterial color="#ffc830" emissive="#886600" emissiveIntensity={0.06} />
      </mesh>
      <mesh ref={wL} position={[-0.07, 0.02, 0]}>
        <planeGeometry args={[0.07, 0.035]} />
        <meshStandardMaterial color="#eed090" side={THREE.DoubleSide} transparent opacity={0.85} />
      </mesh>
      <mesh ref={wR} position={[0.07, 0.02, 0]}>
        <planeGeometry args={[0.07, 0.035]} />
        <meshStandardMaterial color="#eed090" side={THREE.DoubleSide} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

function LiteGiantInsect({
  kind,
  seed,
  scale,
  plantHeight,
  centerY,
  stage,
  growth,
  path,
  speed,
}: FlyBase & { kind: MobileGiantKind }) {
  const grp = useRef<THREE.Group>(null);
  const wL = useRef<THREE.Mesh>(null);
  const wR = useRef<THREE.Mesh>(null);
  const fly = useMobileFly(
    seed,
    plantHeight,
    centerY,
    speed ?? 0.32,
    path ?? "orbit",
    stage,
    growth
  );

  useCreatureFrame(({ clock }) => {
    if (!grp.current) return;
    const { pos, yaw } = fly(clock);
    grp.current.position.copy(pos);
    grp.current.rotation.y = yaw;
    const flap = Math.sin(clock.elapsedTime * 12 + seed) * 0.65;
    if (wL.current) wL.current.rotation.z = flap;
    if (wR.current) wR.current.rotation.z = -flap;
  });

  const body =
    kind === "mosquito" ? (
      <>
        <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.02, 0.14, 4, 6]} />
          <meshStandardMaterial color="#3a3a48" />
        </mesh>
        <mesh position={[0, 0, -0.04]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color="#4a4a58" />
        </mesh>
      </>
    ) : kind === "monarch" ? (
      <>
        <mesh>
          <capsuleGeometry args={[0.025, 0.06, 4, 6]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <mesh position={[0, 0.02, -0.02]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color="#2a1810" />
        </mesh>
      </>
    ) : kind === "beetle" ? (
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.055, 0.1, 6, 8]} />
        <meshStandardMaterial color="#1a6048" emissive="#0a3020" emissiveIntensity={0.2} metalness={0.45} />
      </mesh>
    ) : kind === "dragonfly" ? (
      <>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.02, 0.16, 4, 6]} />
          <meshStandardMaterial color="#2a4858" emissive="#103040" emissiveIntensity={0.15} />
        </mesh>
        <mesh position={[0, 0.02, -0.05]}>
          <sphereGeometry args={[0.035, 6, 6]} />
          <meshStandardMaterial color="#1a3848" />
        </mesh>
      </>
    ) : (
      <>
        <mesh>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshStandardMaterial color="#1a2818" emissive="#88ff40" emissiveIntensity={0.35} />
        </mesh>
        <pointLight color="#aaff66" intensity={0.35} distance={1.2} decay={2} />
      </>
    );

  const wingColor =
    kind === "monarch"
      ? "#ff7020"
      : kind === "dragonfly"
        ? "#88ccee"
        : kind === "firefly"
          ? "#ccff88"
          : "#ccccdd";

  return (
    <group ref={grp} scale={scale}>
      {body}
      <mesh ref={wL} position={[-0.1, 0.02, 0]}>
        <planeGeometry args={[0.12, kind === "dragonfly" ? 0.04 : 0.08]} />
        <meshStandardMaterial color={wingColor} side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>
      <mesh ref={wR} position={[0.1, 0.02, 0]}>
        <planeGeometry args={[0.12, kind === "dragonfly" ? 0.04 : 0.08]} />
        <meshStandardMaterial color={wingColor} side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

function renderGiant(g: MobileStageGiant, flyProps: Omit<FlyBase, "seed" | "path" | "speed"> & { scale: number }) {
  return (
    <LiteGiantInsect
      key={g.kind}
      kind={g.kind}
      seed={g.seed}
      path={g.path}
      speed={g.speed}
      {...flyProps}
    />
  );
}

/** Mobile flying insects — bees + one giant per stage band, hard-capped totals. */
export function MobileFlyingInsects({ stage, growth, tier }: Props) {
  const { beeCount, giants } = getMobileFlyingRoster(stage, tier);
  if (beeCount <= 0 && giants.length === 0) return null;

  const bounds = getPlantWorldBounds(stage, growth);
  const flyProps = {
    plantHeight: bounds.worldHeight,
    centerY: bounds.centerY,
    stage,
    growth,
  };

  return (
    <group>
      {beeCount >= 1 && (
        <LiteHoneyBee seed={10} scale={mobileInsectScale(stage, growth)} path="orbit" {...flyProps} />
      )}
      {beeCount >= 2 && (
        <LiteHoneyBee
          seed={127}
          scale={mobileInsectScale(stage, growth, 0.98)}
          path="drift"
          {...flyProps}
        />
      )}
      {giants.map((g) =>
        renderGiant(g, {
          ...flyProps,
          scale: mobileInsectScale(stage, growth, g.kind === "beetle" ? 1.18 : 1.12),
        })
      )}
    </group>
  );
}

/** @deprecated Use MobileFlyingInsects */
export const MobileHoneyBees = MobileFlyingInsects;
