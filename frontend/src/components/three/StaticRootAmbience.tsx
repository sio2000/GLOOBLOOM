"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { getStageColor } from "@/types/organism";
import { getTrunkMetrics } from "@/lib/plantScale";
import { usePerformanceStore } from "@/store/usePerformanceStore";
import { geoSeg } from "@/lib/performance";

const ROOT_FLAME_COLORS = ["#ff9020", "#ffd020", "#38ff70", "#00e5ff"];

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

/** Ground disc + root torches — no per-frame updates (mobile-safe). */
export function StaticRootAmbience({
  stage,
  decay,
}: {
  stage: number;
  decay: number;
}) {
  const trunk = useMemo(() => getTrunkMetrics(stage, 0), [stage]);
  const baseY = trunk.trunkBaseY - 0.12;

  const flames = useMemo(() => {
    const count = stage >= 8 ? 5 : 3;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + 0.4;
      const r = 0.42 + (i % 2) * 0.12;
      return {
        id: i,
        pos: [Math.cos(angle) * r, baseY, Math.sin(angle) * r] as [number, number, number],
        color: ROOT_FLAME_COLORS[i % ROOT_FLAME_COLORS.length]!,
        scale: 0.85 + (i % 3) * 0.12,
      };
    });
  }, [stage, baseY]);

  return (
    <group>
      <StaticGroundPlane stage={stage} decay={decay} />
      {flames.map((f) => (
        <StaticRootFlame key={f.id} position={f.pos} color={f.color} scale={f.scale} />
      ))}
    </group>
  );
}
