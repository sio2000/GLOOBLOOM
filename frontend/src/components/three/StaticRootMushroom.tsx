"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { MUSHROOM_VARIANTS } from "@/lib/rootMushrooms";
import { geoSeg } from "@/lib/performance";
import { usePerformanceStore } from "@/store/usePerformanceStore";

function makeMushroomCapGeo(segments: number): THREE.LatheGeometry {
  const points: THREE.Vector2[] = [
    new THREE.Vector2(0.015, 0.0),
    new THREE.Vector2(0.38, 0.0),
    new THREE.Vector2(0.44, 0.012),
    new THREE.Vector2(0.46, 0.035),
    new THREE.Vector2(0.44, 0.07),
    new THREE.Vector2(0.36, 0.13),
    new THREE.Vector2(0.22, 0.19),
    new THREE.Vector2(0.1, 0.22),
    new THREE.Vector2(0.0, 0.225),
  ];
  return new THREE.LatheGeometry(points, segments);
}

const STEM_TOP = 0.4;
const STEM_R_BOT = 0.055;
const STEM_R_TOP = 0.038;

function capSpot(seed: number, i: number): [number, number, number] {
  const a = seed * 19.1 + i * 3.17;
  const u = Math.sin(a) * 43758.5453 - Math.floor(Math.sin(a) * 43758.5453);
  const v = Math.sin(a * 1.9) * 43758.5453 - Math.floor(Math.sin(a * 1.9) * 43758.5453);
  const theta = u * Math.PI * 2;
  const r = 0.08 + v * 0.26;
  const y = 0.14 + (1 - r / 0.34) * 0.07;
  return [Math.cos(theta) * r, y, Math.sin(theta) * r];
}

/** Toadstool at root — clear stem (λαιμός) + cap, static for mobile. */
export function StaticRootMushroom({
  position,
  angle,
  variant,
  scale,
  hydration,
}: {
  position: [number, number, number];
  angle: number;
  variant: number;
  scale: number;
  hydration: number;
}) {
  const geoQuality = usePerformanceStore((s) => s.settings().geoQuality);
  const capGeo = useMemo(
    () => makeMushroomCapGeo(geoSeg(24, geoQuality, 12)),
    [geoQuality]
  );
  const palette = MUSHROOM_VARIANTS[variant % MUSHROOM_VARIANTS.length]!;
  const emissive = 0.1 + (hydration / 100) * 0.14;
  const capTilt = (variant % 3 - 1) * 0.05;
  const spots = useMemo(
    () => Array.from({ length: 6 }, (_, i) => capSpot(variant * 11 + 3, i)),
    [variant]
  );
  const gillCount = geoSeg(20, geoQuality, 12);

  return (
    <group position={position} rotation-y={angle} scale={scale}>
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.52, 14]} />
        <meshStandardMaterial color="#2e4a28" emissive="#142010" emissiveIntensity={0.05} roughness={0.96} />
      </mesh>

      <mesh position={[0, STEM_R_BOT * 0.5, 0]}>
        <sphereGeometry args={[STEM_R_BOT * 1.6, 10, 8, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.38]} />
        <meshStandardMaterial color={palette.stemDark} roughness={0.88} />
      </mesh>

      <mesh position={[0, STEM_TOP / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[STEM_R_TOP, STEM_R_BOT, STEM_TOP, 10]} />
        <meshStandardMaterial
          color={palette.stem}
          emissive={palette.stemEmissive}
          emissiveIntensity={0.06}
          roughness={0.82}
        />
      </mesh>

      {[0.22, 0.38].map((t, i) => (
        <mesh key={i} position={[0, STEM_TOP * t, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[STEM_R_BOT * (1.05 - t * 0.3), 0.004, 4, 10]} />
          <meshStandardMaterial color={palette.stemDark} roughness={0.9} />
        </mesh>
      ))}

      <mesh position={[0, STEM_TOP * 0.72, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[STEM_R_BOT * 1.35, 0.007, 5, 12]} />
        <meshStandardMaterial color={palette.stem} roughness={0.78} />
      </mesh>

      <group position={[0, STEM_TOP - 0.005, 0]}>
        {Array.from({ length: gillCount }, (_, i) => {
          const a = (i / gillCount) * Math.PI * 2;
          return (
            <mesh key={i} rotation={[Math.PI / 2 + 0.08, a, 0]}>
              <boxGeometry args={[0.34, 0.003, 0.018]} />
              <meshStandardMaterial
                color={palette.gills}
                emissive={palette.gillEmissive}
                emissiveIntensity={0.16}
                side={THREE.DoubleSide}
                transparent
                opacity={0.9}
              />
            </mesh>
          );
        })}
      </group>

      <group position={[0, STEM_TOP, 0]} rotation={[capTilt, 0, capTilt * 0.5]}>
        <mesh geometry={capGeo} castShadow receiveShadow>
          <meshStandardMaterial
            color={palette.cap}
            emissive={palette.capEmissive}
            emissiveIntensity={emissive}
            roughness={0.48}
            metalness={0.02}
          />
        </mesh>
        <mesh position={[0, 0.19, 0]} scale={[0.55, 0.35, 0.55]}>
          <sphereGeometry args={[0.22, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
          <meshStandardMaterial color={palette.capTop} roughness={0.35} transparent opacity={0.35} depthWrite={false} />
        </mesh>
        {spots.map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]} scale={0.045 + (i % 3) * 0.012}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshStandardMaterial color={palette.spots} roughness={0.35} flatShading />
          </mesh>
        ))}
      </group>
    </group>
  );
}
