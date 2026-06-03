"use client";

import { useMemo, useState, useEffect } from "react";
import * as THREE from "three";
import { getStageColor } from "@/types/organism";
import { getTrunkMetrics } from "@/lib/plantScale";
import { usePerformanceStore } from "@/store/usePerformanceStore";
import { geoSeg } from "@/lib/performance";
import { requestSceneRender } from "@/lib/sceneRuntime";

const ROOT_FLAME_COLORS = [
  "#ff9020",
  "#ffd020",
  "#38ff70",
  "#00e5ff",
  "#ff40a0",
  "#e0c0ff",
];

const FLAME_SEGMENT_COLORS = ROOT_FLAME_COLORS;

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
  const [colorIndex, setColorIndex] = useState(0);
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
    const id = window.setInterval(tick, 7500);
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

  return (
    <group position={position} scale={scale}>
      <pointLight color={color} intensity={2.2} distance={8} decay={1.6} />
      <mesh material={glowMat}>
        <sphereGeometry args={[0.18, 10, 10]} />
      </mesh>
      <mesh position={[0, 0.08, 0]} material={coreMat}>
        <coneGeometry args={[0.1, 0.32, 10]} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <coneGeometry args={[0.055, 0.18, 8]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={1.6}
          transparent
          opacity={0.82}
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
}: {
  stage: number;
  growth: number;
  decay: number;
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

  const ringFlames = useMemo(() => {
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
  }, [stage, rootY, trunk.trunkRadiusBottom, ringScale]);

  return (
    <group>
      <StaticGroundPlane stage={stage} decay={decay} />
      <RootEternalFlame position={[0, rootY, 0]} scale={flameScale} />
      {ringFlames.map((f) => (
        <StaticRootFlame key={f.id} position={f.pos} color={f.color} scale={f.scale} />
      ))}
    </group>
  );
}
