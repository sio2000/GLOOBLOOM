"use client";

import { useRef, useMemo } from "react";
import { useAdaptiveFrame } from "@/hooks/useAdaptiveFrame";
import * as THREE from "three";
import { getTrunkMetrics } from "@/lib/plantScale";
import { extendedScaleMultiplier, isExtendedStage } from "@/lib/stageConstants";
import {
  CATERPILLAR_LANES,
  TRUNK_Y_FULL,
  trunkLaneAngle,
  trunkYRange,
} from "@/lib/trunkLanes";
import { getStageColor } from "@/types/organism";
import {
  TrunkClimber,
  TrunkButterflyClimber,
  buildTrunkClimbers,
} from "./TrunkClimberCreatures";
import { AnimatedCaterpillar } from "./insects/AnimatedCaterpillar";
import { useCreatureFrame } from "@/hooks/useCreatureFrame";
import { applyPlantAvoidance, buildPlantFlightBounds } from "@/lib/plantFlightAvoidance";
import { usePerformanceStore } from "@/store/usePerformanceStore";
import { limitMobileSpeciesCount } from "@/lib/sceneBackground";

interface Props {
  stage: number;
  growth: number;
  hydration: number;
}

function seeded(seed: number, n: number): number {
  const x = Math.sin(seed * 127.1 + n * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function RootWaterLily({
  angle,
  dist,
  baseY,
  scale,
  seed,
  hydration,
}: {
  angle: number;
  dist: number;
  baseY: number;
  scale: number;
  seed: number;
  hydration: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useAdaptiveFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.position.y = baseY + Math.sin(t * 0.7 + seed) * 0.015 * scale;
    ref.current.rotation.y = Math.sin(t * 0.2 + seed) * 0.08;
  });

  const padColor = seed % 2 === 0 ? "#2a6838" : "#1e5830";
  const flowerColor = ["#ff6090", "#ffe040", "#ffffff", "#ff9040"][Math.floor(seed) % 4]!;

  return (
    <group ref={ref} position={[Math.cos(angle) * dist, baseY, Math.sin(angle) * dist]} scale={scale}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.22, 16]} />
        <meshStandardMaterial color={padColor} emissive="#0a3018" emissiveIntensity={0.06} roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.09, 3, 8]} />
        <meshStandardMaterial color={padColor} emissive="#143820" emissiveIntensity={0.04} roughness={0.9} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.06, 0.025, Math.sin(a) * 0.06]} rotation={[0.4, a, 0]}>
            <boxGeometry args={[0.025, 0.06, 0.008]} />
            <meshStandardMaterial
              color={flowerColor}
              emissive={flowerColor}
              emissiveIntensity={0.2 + (hydration / 100) * 0.25}
              side={THREE.DoubleSide}
            />
          </mesh>
        );
      })}
      <mesh position={[0, 0.04, 0]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#ffe880" emissive="#ffd040" emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

const MAX_CATERPILLARS = 2;

function SatellitePlant({
  angle,
  dist,
  baseY,
  scale,
  seed,
  colors,
}: {
  angle: number;
  dist: number;
  baseY: number;
  scale: number;
  seed: number;
  colors: { glow: string; accent: string };
}) {
  const ref = useRef<THREE.Group>(null);
  useAdaptiveFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.25 + seed) * 0.12;
    ref.current.position.y = baseY + Math.sin(clock.elapsedTime * 0.5 + seed) * 0.02 * scale;
  });

  return (
    <group ref={ref} position={[Math.cos(angle) * dist, baseY, Math.sin(angle) * dist]} scale={scale}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.018, 0.24, 6]} />
        <meshStandardMaterial color="#2a6018" roughness={0.85} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2 + seed;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.06, 0.18 + (i % 2) * 0.04, Math.sin(a) * 0.06]} rotation={[0.4, a, 0.2]}>
            <coneGeometry args={[0.04, 0.1, 5]} />
            <meshStandardMaterial color={colors.glow} emissive={colors.accent} emissiveIntensity={0.15} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.28, 0]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color={colors.accent} emissive={colors.accent} emissiveIntensity={0.35} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

function ExtendedFlyer({
  seed,
  plantHeight,
  centerY,
  accent,
  stage,
  growth,
}: {
  seed: number;
  plantHeight: number;
  centerY: number;
  accent: string;
  stage: number;
  growth: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const flightBounds = useMemo(() => buildPlantFlightBounds(stage, growth), [stage, growth]);
  const orbitR = Math.max(5, 4 + seeded(seed, 1) * (plantHeight * 0.35 + 12));
  const orbitY = centerY + plantHeight * (0.15 + seeded(seed, 2) * 0.55);
  const speed = 0.14 + seeded(seed, 3) * 0.1;
  const phase = seeded(seed, 4) * Math.PI * 2;
  const wL = useRef<THREE.Mesh>(null);
  const wR = useRef<THREE.Mesh>(null);
  const scale = 2.5 + seeded(seed, 6) * 2.5;

  useCreatureFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * speed + phase;
    ref.current.position.set(
      Math.cos(t) * orbitR,
      orbitY + Math.sin(t * 0.7) * 3 + Math.sin(t * 1.3) * 1.5,
      Math.sin(t) * orbitR
    );
    applyPlantAvoidance(ref.current.position, flightBounds);
    ref.current.rotation.y = t + Math.PI / 2;
    const flap = Math.sin(clock.elapsedTime * 5.5 + seed) * 0.55;
    if (wL.current) wL.current.rotation.z = flap;
    if (wR.current) wR.current.rotation.z = -flap;
  });

  return (
    <group ref={ref} scale={scale}>
      <mesh>
        <capsuleGeometry args={[0.012, 0.14, 4, 8]} />
        <meshStandardMaterial color="#101008" />
      </mesh>
      <mesh ref={wL} position={[0.12, 0, 0]}>
        <planeGeometry args={[0.28, 0.16]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.45} side={THREE.DoubleSide} transparent opacity={0.85} />
      </mesh>
      <mesh ref={wR} position={[-0.12, 0, 0]} scale={[-1, 1, 1]}>
        <planeGeometry args={[0.28, 0.16]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.45} side={THREE.DoubleSide} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

export function ExtendedStageSystems({ stage, growth, hydration }: Props) {
  if (!isExtendedStage(stage)) return null;

  const tier = usePerformanceStore((s) => s.tier);
  const lite = tier === "ultra_low" || tier === "low";
  const capN = (n: number, maxLite: number) => (lite ? Math.min(n, maxLite) : n);

  const colors = getStageColor(stage);
  const extMul = extendedScaleMultiplier(stage);
  const trunk = getTrunkMetrics(stage, growth);
  const baseY = trunk.trunkBaseY - 0.02;
  const trunkR = trunk.trunkRadiusBottom;
  const plantHeight = trunk.trunkHeight;
  const centerY = baseY + plantHeight * 0.45;
  const sizeBoost = Math.max(plantHeight * 0.055, trunkR * 16, 3.5);

  const lilies = useMemo(() => {
    const count = capN(Math.min(3 + Math.floor((stage - 101) / 18), 14), 4);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (i / count) * Math.PI * 2 + seeded(i, 0) * 0.5,
      dist: trunkR + (0.9 + seeded(i, 1) * 1.2) * extMul * 0.35,
      scale: (0.85 + seeded(i, 2) * 0.5) * Math.min(extMul, 2.2) * sizeBoost * 0.35,
      seed: i + stage * 0.1,
    }));
  }, [stage, trunkR, extMul, sizeBoost, lite]);

  const satellites = useMemo(() => {
    const count = capN(Math.min(5 + Math.floor((stage - 101) / 12), 24), 6);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (i / count) * Math.PI * 2 + seeded(i + 200, 0),
      dist: trunkR + (1.2 + seeded(i + 200, 1) * 2.5) * extMul * 0.5,
      scale: (0.7 + seeded(i + 200, 2) * 1.2) * Math.min(extMul * 0.45, 2),
      seed: i,
    }));
  }, [stage, trunkR, extMul, lite]);

  const caterpillars = useMemo(() => {
    const { trunkBaseY, trunkHeight } = trunk;
    const baseScale = sizeBoost * 0.65 * 0.25;
    const crawlSpeed = 0.26;
    const full = trunkYRange(trunkBaseY, trunkHeight, TRUNK_Y_FULL);
    const lanes = CATERPILLAR_LANES;
    return [
      {
        id: 1,
        yMin: full.yMin,
        yMax: full.yMax,
        angle: trunkLaneAngle(lanes[1]!),
        pattern: 1 as const,
        scale: baseScale * 3.3,
        seed: 5.7,
        speed: crawlSpeed,
        midPause: true,
      },
      {
        id: 2,
        yMin: full.yMin,
        yMax: full.yMax,
        angle: trunkLaneAngle(lanes[2]!),
        pattern: 2 as const,
        scale: baseScale * 3.2,
        seed: 11.3,
        speed: crawlSpeed,
        midPause: true,
      },
    ].slice(0, lite ? 1 : MAX_CATERPILLARS);
  }, [trunk, sizeBoost, lite]);

  const trunkBottomY = trunk.trunkBaseY;
  const trunkTopY = trunk.trunkTopY;

  const { trunk: trunkClimbers, butterflies: trunkButterflies } = useMemo(
    () => buildTrunkClimbers(stage, trunkR, trunkBottomY, trunkTopY, sizeBoost),
    [stage, trunkR, trunkBottomY, trunkTopY, sizeBoost]
  );

  const flyers = useMemo(() => {
    let count = Math.min(3 + Math.floor((stage - 101) / 18), 12);
    count = capN(limitMobileSpeciesCount(count, lite, 2), 2);
    return Array.from({ length: count }, (_, i) => i);
  }, [stage, lite]);

  return (
    <group>
      {lilies.map((l) => (
        <RootWaterLily key={l.id} {...l} baseY={baseY} hydration={hydration} />
      ))}
      {satellites.map((p) => (
        <SatellitePlant key={p.id} {...p} baseY={baseY} colors={colors} />
      ))}
      {caterpillars.map((c) => (
        <AnimatedCaterpillar
          key={c.id}
          trunk={trunk}
          yMin={c.yMin}
          yMax={c.yMax}
          angle={c.angle}
          pattern={c.pattern}
          scale={c.scale}
          seed={c.seed}
          speed={c.speed}
          midPause={c.midPause}
        />
      ))}
      {flyers.map((i) => (
        <ExtendedFlyer
          key={i}
          seed={i + stage * 0.17}
          plantHeight={plantHeight}
          centerY={centerY}
          accent={colors.accent}
          stage={stage}
          growth={growth}
        />
      ))}
      {trunkButterflies.slice(0, lite ? 2 : trunkButterflies.length).map((c) => (
        <TrunkButterflyClimber
          key={c.id}
          yMin={c.yMin}
          yMax={c.yMax}
          angle={c.angle}
          trunkR={trunkR}
          trunk={trunk}
          speed={c.speed}
          scale={c.scale}
          seed={c.seed}
          color={c.color}
        />
      ))}
      {!lite &&
        trunkClimbers.map((c) => (
          <TrunkClimber
            key={c.id}
            yMin={c.yMin}
            yMax={c.yMax}
            angle={c.angle}
            trunkR={trunkR}
            trunk={trunk}
            speed={c.speed}
            scale={c.scale}
            seed={c.seed}
          />
        ))}
    </group>
  );
}
