"use client";

import { useRef, useMemo } from "react";
import { useAdaptiveFrame } from "@/hooks/useAdaptiveFrame";
import * as THREE from "three";
import { getStageColor } from "@/types/organism";
import { Season } from "@/types/organism";
import { usePerformanceStore } from "@/store/usePerformanceStore";
import { geoSeg } from "@/lib/performance";
import { useThrottledFrame } from "@/hooks/useThrottledFrame";

interface Props {
  stage: number;
  season: Season;
  hydration: number;
  decay: number;
}

export function AtmosphereSystem({ stage, season, hydration, decay }: Props) {
  const colors = getStageColor(stage);

  return (
    <group>
      <GroundPlane colors={colors} stage={stage} decay={decay} />
      <VolumeFog season={season} stage={stage} />
      <CosmicRing stage={stage} colors={colors} />
      {stage >= 6 && <FloatingIslands stage={stage} colors={colors} />}
    </group>
  );
}

function GroundPlane({
  colors,
  stage,
  decay,
}: {
  colors: { core: string; glow: string; accent: string };
  stage: number;
  decay: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const geoQuality = usePerformanceStore((s) => s.settings().geoQuality);
  const circleSegs = geoSeg(64, geoQuality, 24);
  const baseColor = new THREE.Color(colors.core).multiplyScalar(0.35);
  const emissiveColor = new THREE.Color(colors.glow).multiplyScalar(0.06);

  useAdaptiveFrame(({ clock }) => {
    if (!matRef.current) return;
    const t = clock.elapsedTime;
    const pulse = Math.sin(t * 0.8) * 0.03 + 0.06;
    matRef.current.emissiveIntensity = pulse;
    if (decay > 20) {
      matRef.current.color.lerp(new THREE.Color("#1a2a0a"), 0.01);
    }
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]} receiveShadow>
      <circleGeometry args={[6, circleSegs]} />
      <meshStandardMaterial
        ref={matRef}
        color={baseColor}
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

function VolumeFog({ season, stage }: { season: Season; stage: number }) {
  const ref = useRef<THREE.Mesh>(null);

  const fogColors: Record<Season, string> = {
    bloom: "#1a3a1a",
    mist: "#2a3a4a",
    golden_decay: "#3a2a0a",
    neon_rain: "#1a0a3a",
  };

  const fogColor = new THREE.Color(fogColors[season] ?? "#1a2a1a");
  const fogOpacity = 0.1;

  useAdaptiveFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.05;
  });

  return (
    <mesh ref={ref} position={[0, 0.5, 0]}>
      <sphereGeometry args={[4 + stage * 0.3, 16, 16]} />
      <meshStandardMaterial
        color={fogColor}
        transparent
        opacity={fogOpacity}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function CosmicRing({
  stage,
  colors,
}: {
  stage: number;
  colors: { glow: string; accent: string };
}) {
  const ref = useRef<THREE.Mesh>(null);
  const geoQuality = usePerformanceStore((s) => s.settings().geoQuality);
  const tubeSegs = geoSeg(80, geoQuality, 32);
  const radialSegs = geoSeg(12, geoQuality, 6);

  useAdaptiveFrame(({ clock }, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x = Math.PI / 2 + Math.sin(clock.elapsedTime * 0.2) * 0.08;
    ref.current.rotation.z += delta * 0.06;
  });

  if (stage < 4) return null;

  const radius = 2.5 + (stage - 4) * 0.3;
  const opacity = 0.1 + (stage - 4) * 0.06;

  return (
    <mesh ref={ref} position={[0, 0, 0]}>
      <torusGeometry args={[radius, 0.04, radialSegs, tubeSegs]} />
      <meshStandardMaterial
        color={colors.glow}
        emissive={colors.accent}
        emissiveIntensity={1.2}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  );
}

function FloatingIsland({
  pos,
  scale,
  colors,
  phase,
}: {
  pos: THREE.Vector3;
  scale: number;
  colors: { core: string; glow: string };
  phase: number;
}) {
  const ref = useRef<THREE.Group>(null);

  useThrottledFrame(({ clock }, delta) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.position.y = pos.y + Math.sin(t * 0.4 + phase) * 0.15;
    ref.current.rotation.y += delta * 0.18;
  });

  return (
    <group ref={ref} position={pos} scale={scale}>
      <mesh>
        <sphereGeometry args={[0.3, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={colors.core}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      {Array.from({ length: 3 }, (_, i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.12, 0.35, Math.sin(a) * 0.12]}
          >
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial
              color={colors.glow}
              emissive={colors.glow}
              emissiveIntensity={1.5}
              transparent
              opacity={0.8}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function FloatingIslands({
  stage,
  colors,
}: {
  stage: number;
  colors: { core: string; glow: string };
}) {
  const islands = useMemo(() => {
    const count = (stage - 5) * 2 + 2;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const r = 2 + Math.random() * 1.5;
      return {
        id: i,
        pos: new THREE.Vector3(
          Math.cos(angle) * r,
          1 + Math.random() * 1.5,
          Math.sin(angle) * r
        ),
        scale: 0.6 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
      };
    });
  }, [stage]);

  return (
    <group>
      {islands.map((isl) => (
        <FloatingIsland
          key={isl.id}
          pos={isl.pos}
          scale={isl.scale}
          colors={colors}
          phase={isl.phase}
        />
      ))}
    </group>
  );
}
