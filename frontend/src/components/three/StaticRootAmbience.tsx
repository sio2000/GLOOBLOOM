"use client";

import { useMemo, useState, useEffect } from "react";
import * as THREE from "three";
import { getStageColor } from "@/types/organism";
import { getTrunkMetrics } from "@/lib/plantScale";
import { usePerformanceStore } from "@/store/usePerformanceStore";
import { geoSeg } from "@/lib/performance";
import { requestSceneRender } from "@/lib/sceneRuntime";
import { RootStaticCritters } from "./RootStaticCritters";
import { StaticRootMushroom } from "./StaticRootMushroom";

const ROOT_FLAME_COLORS = [
  "#ff9020",
  "#ffd020",
  "#38ff70",
  "#00e5ff",
  "#ff40a0",
  "#e0c0ff",
];

const FLAME_SEGMENT_COLORS = ROOT_FLAME_COLORS;

/** Root torch hue cycle — every few hours (no animation loop). */
const FLAME_COLOR_INTERVAL_MS = 2.5 * 60 * 60 * 1000;

function StaticGroundPlane({
  stage,
  decay,
}: {
  stage: number;
  decay: number;
}) {
  const colors = getStageColor(stage);
  const geoQuality = usePerformanceStore((s) => s.settings().geoQuality);
  const circleSegs = geoSeg(64, geoQuality, 24);
  const baseColor = useMemo(
    () => new THREE.Color(colors.core).multiplyScalar(0.35),
    [colors.core]
  );
  const emissiveColor = useMemo(
    () => new THREE.Color(colors.glow).multiplyScalar(0.06),
    [colors.glow]
  );
  const groundColor = useMemo(() => {
    const c = baseColor.clone();
    if (decay > 20) c.lerp(new THREE.Color("#1a2a0a"), 0.35);
    return c;
  }, [baseColor, decay]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]} receiveShadow>
      <circleGeometry args={[6, circleSegs]} />
      <meshStandardMaterial
        color={groundColor}
        emissive={emissiveColor}
        emissiveIntensity={0.06}
        roughness={0.85}
        metalness={0.05}
        transparent
        opacity={0.92}
      />
    </mesh>
  );
}

/** Main root torch — fixed position; hue shifts on a slow timer (no motion). */
function RootEternalFlame({
  position,
  scale,
}: {
  position: [number, number, number];
  scale: number;
}) {
  const [colorIndex, setColorIndex] = useState(() =>
    Math.floor(Date.now() / FLAME_COLOR_INTERVAL_MS) % FLAME_SEGMENT_COLORS.length
  );
  const coreMat = useMemo(() => new THREE.MeshStandardMaterial(), []);
  const glowMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
      }),
    []
  );

  useEffect(() => {
    const tick = () => {
      setColorIndex((i) => (i + 1) % FLAME_SEGMENT_COLORS.length);
      requestSceneRender();
    };
    const id = window.setInterval(tick, FLAME_COLOR_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  const color = FLAME_SEGMENT_COLORS[colorIndex]!;
  const col = useMemo(() => new THREE.Color(color), [color]);

  useEffect(() => {
    coreMat.color.copy(col);
    coreMat.emissive.copy(col);
    coreMat.emissiveIntensity = 1.1;
    glowMat.color.copy(col);
    glowMat.emissive.copy(col);
    glowMat.emissiveIntensity = 0.5;
    requestSceneRender();
  }, [col, coreMat, glowMat]);

  const outerCol = useMemo(() => col.clone().lerp(new THREE.Color("#ff6020"), 0.35), [col]);

  return (
    <group position={position} scale={scale}>
      <pointLight color={color} intensity={2.2} distance={7} decay={1.6} />
      {/* Ember base */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.06, 0.14, 12]} />
        <meshStandardMaterial
          color="#3a1808"
          emissive="#ff4010"
          emissiveIntensity={0.55}
          roughness={0.9}
        />
      </mesh>
      {/* Outer flame body */}
      <mesh position={[0, 0.1, 0]} rotation={[0, 0.35, 0]}>
        <coneGeometry args={[0.14, 0.42, 10]} />
        <meshStandardMaterial
          color={outerCol}
          emissive={outerCol}
          emissiveIntensity={0.75}
          transparent
          opacity={0.55}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0.03, 0.12, -0.02]} rotation={[0, -0.5, 0.08]}>
        <coneGeometry args={[0.11, 0.36, 8]} />
        <meshStandardMaterial
          color={outerCol}
          emissive={outerCol}
          emissiveIntensity={0.65}
          transparent
          opacity={0.45}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[-0.025, 0.11, 0.02]} rotation={[0, 0.9, -0.06]}>
        <coneGeometry args={[0.09, 0.3, 8]} />
        <meshStandardMaterial
          color={outerCol}
          emissive={outerCol}
          emissiveIntensity={0.6}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>
      <mesh material={glowMat} position={[0, 0.09, 0]}>
        <sphereGeometry args={[0.14, 10, 10]} />
      </mesh>
      <mesh position={[0, 0.1, 0]} material={coreMat}>
        <coneGeometry args={[0.09, 0.34, 10]} />
      </mesh>
      <mesh position={[0, 0.24, 0]}>
        <coneGeometry args={[0.045, 0.22, 8]} />
        <meshStandardMaterial
          color="#fff8e8"
          emissive="#ffffff"
          emissiveIntensity={1.8}
          transparent
          opacity={0.88}
        />
      </mesh>
      <mesh position={[0, 0.34, 0]}>
        <coneGeometry args={[0.022, 0.1, 6]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={2.2}
          transparent
          opacity={0.75}
        />
      </mesh>
    </group>
  );
}

function StaticRootFlame({
  position,
  color,
  scale,
}: {
  position: [number, number, number];
  color: string;
  scale: number;
}) {
  const col = useMemo(() => new THREE.Color(color), [color]);

  return (
    <group position={position} scale={scale}>
      <pointLight color={color} intensity={0.55} distance={2.2} decay={2} />
      <mesh position={[0, 0.06, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.35}
          transparent
          opacity={0.28}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <coneGeometry args={[0.06, 0.2, 8]} />
        <meshStandardMaterial
          color={col}
          emissive={col}
          emissiveIntensity={0.85}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0, 0.11, 0]}>
        <coneGeometry args={[0.035, 0.12, 6]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={1.2}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}

/** Ground disc + root torches — lives inside scaled plant group. */
export function StaticRootAmbience({
  stage,
  growth,
  decay,
  hydration = 100,
  minimalFlame = false,
}: {
  stage: number;
  growth: number;
  decay: number;
  hydration?: number;
  /** Mobile: single root torch only (no ring lights). */
  minimalFlame?: boolean;
}) {
  const trunk = useMemo(() => getTrunkMetrics(stage, growth), [stage, growth]);
  const rootY = trunk.trunkBaseY + 0.02;
  const flameScale = useMemo(
    () => Math.max(1.8, trunk.trunkRadiusBottom * 28),
    [trunk.trunkRadiusBottom]
  );
  const ringScale = useMemo(
    () => Math.max(0.9, trunk.trunkRadiusBottom * 10),
    [trunk.trunkRadiusBottom]
  );

  const staticMushrooms = useMemo(() => {
    if (!minimalFlame) return [];
    const r = trunk.trunkRadiusBottom * 1.45 + 0.1;
    return [
      {
        id: 0,
        pos: [Math.cos(1.1) * r, rootY, Math.sin(1.1) * r] as [number, number, number],
        angle: 1.1,
        variant: 0,
        scale: Math.max(1.15, trunk.trunkRadiusBottom * 18),
      },
      {
        id: 1,
        pos: [Math.cos(4.2) * (r + 0.06), rootY, Math.sin(4.2) * (r + 0.06)] as [
          number,
          number,
          number,
        ],
        angle: 4.2,
        variant: 2,
        scale: Math.max(1.0, trunk.trunkRadiusBottom * 15),
      },
    ];
  }, [minimalFlame, rootY, trunk.trunkRadiusBottom]);

  const ringFlames = useMemo(() => {
    if (minimalFlame) return [];
    const count = stage >= 8 ? 4 : 2;
    const r = trunk.trunkRadiusBottom * 1.35 + 0.08;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + 0.55;
      return {
        id: i,
        pos: [Math.cos(angle) * r, rootY, Math.sin(angle) * r] as [number, number, number],
        color: ROOT_FLAME_COLORS[i % ROOT_FLAME_COLORS.length]!,
        scale: ringScale * (0.75 + (i % 2) * 0.15),
      };
    });
  }, [stage, rootY, trunk.trunkRadiusBottom, ringScale, minimalFlame]);

  return (
    <group>
      <StaticGroundPlane stage={stage} decay={decay} />
      <RootEternalFlame
        position={[0, rootY, 0]}
        scale={minimalFlame ? flameScale * 0.85 : flameScale}
      />
      {staticMushrooms.map((m) => (
        <StaticRootMushroom
          key={m.id}
          position={m.pos}
          angle={m.angle}
          variant={m.variant}
          scale={m.scale}
          hydration={hydration}
        />
      ))}
      {!minimalFlame &&
        ringFlames.map((f) => (
          <StaticRootFlame key={f.id} position={f.pos} color={f.color} scale={f.scale} />
        ))}
      {!minimalFlame && (
        <RootStaticCritters
          rootY={rootY}
          trunkRadius={trunk.trunkRadiusBottom}
          stage={stage}
        />
      )}
    </group>
  );
}
