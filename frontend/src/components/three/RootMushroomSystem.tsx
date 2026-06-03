"use client";

import { useRef, useMemo } from "react";
import { useAdaptiveFrame } from "@/hooks/useAdaptiveFrame";
import * as THREE from "three";
import { getScales, getTrunkMetrics } from "@/lib/plantScale";
import { computeRootPlacements } from "@/lib/rootGrowth";
import {
  type RootMushroomDef,
  getMushroomWorldHeight,
  getVisibleRootMushrooms,
  MUSHROOM_VARIANTS,
} from "@/lib/rootMushrooms";
import { usePerformanceStore } from "@/store/usePerformanceStore";
import { geoSeg } from "@/lib/performance";

/** Classic toadstool cap — wide flat underside, domed top */
function makeMushroomCapGeo(segments: number): THREE.LatheGeometry {
  const points: THREE.Vector2[] = [
    new THREE.Vector2(0.015, 0.0),
    new THREE.Vector2(0.38, 0.0),
    new THREE.Vector2(0.44, 0.012),
    new THREE.Vector2(0.46, 0.035),
    new THREE.Vector2(0.44, 0.07),
    new THREE.Vector2(0.36, 0.13),
    new THREE.Vector2(0.22, 0.19),
    new THREE.Vector2(0.10, 0.22),
    new THREE.Vector2(0.0, 0.225),
  ];
  return new THREE.LatheGeometry(points, segments);
}

const CAP_GEO_CACHE = new Map<number, THREE.LatheGeometry>();

function getCapGeo(segments: number): THREE.LatheGeometry {
  if (!CAP_GEO_CACHE.has(segments)) {
    CAP_GEO_CACHE.set(segments, makeMushroomCapGeo(segments));
  }
  return CAP_GEO_CACHE.get(segments)!;
}

function capSpot(seed: number, i: number): [number, number, number] {
  const a = seed * 19.1 + i * 3.17;
  const u = Math.sin(a) * 43758.5453 - Math.floor(Math.sin(a) * 43758.5453);
  const v = Math.sin(a * 1.9) * 43758.5453 - Math.floor(Math.sin(a * 1.9) * 43758.5453);
  const theta = u * Math.PI * 2;
  const r = 0.08 + v * 0.26;
  const y = 0.14 + (1 - r / 0.34) * 0.07;
  return [Math.cos(theta) * r, y, Math.sin(theta) * r];
}

function RootMushroom({
  def,
  targetHeight,
  hydration,
  baseY,
  position,
}: {
  def: RootMushroomDef;
  targetHeight: number;
  hydration: number;
  baseY: number;
  position: [number, number, number];
}) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const capMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const heightRef = useRef(Math.max(0.04, targetHeight * def.heightMul));
  const capTilt = useMemo(() => (def.id % 3 - 1) * 0.06, [def.id]);
  const geoQuality = usePerformanceStore((s) => s.settings().geoQuality);
  const capSegs = geoSeg(32, geoQuality, 16);
  const capGeo = useMemo(() => getCapGeo(capSegs), [capSegs]);
  const palette = MUSHROOM_VARIANTS[def.variant]!;
  const spots = useMemo(
    () => Array.from({ length: 7 }, (_, i) => capSpot(def.id * 11 + def.variant, i)),
    [def.id, def.variant]
  );

  const STEM_TOP = 0.40;
  const STEM_R_BOT = 0.055;
  const STEM_R_TOP = 0.038;

  useAdaptiveFrame(({ clock }, delta) => {
    const goal = Math.max(0.04, targetHeight * def.heightMul);
    heightRef.current = THREE.MathUtils.lerp(heightRef.current, goal, Math.min(1, delta * 1.5));
    const h = heightRef.current;
    const wobble = Math.sin(clock.elapsedTime * 0.85 + def.angle) * 0.01 * Math.min(1.5, h);

    if (rootRef.current) {
      rootRef.current.position.set(position[0], baseY + wobble, position[2]);
      rootRef.current.rotation.y = def.angle + Math.sin(clock.elapsedTime * 0.12 + def.id) * 0.03;
    }
    if (bodyRef.current) {
      bodyRef.current.scale.set(h, h, h);
    }
    if (capMatRef.current) {
      capMatRef.current.emissiveIntensity =
        0.1 + (hydration / 100) * 0.14 + Math.sin(clock.elapsedTime * 1.2 + def.id) * 0.03;
    }
  });

  return (
    <group ref={rootRef}>
      <group ref={bodyRef} scale={[heightRef.current, heightRef.current, heightRef.current]}>
        {/* Mycelium pad */}
        <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[0.52, 16]} />
          <meshStandardMaterial color="#2e4a28" emissive="#142010" emissiveIntensity={0.05} roughness={0.96} />
        </mesh>

        {/* Volva (egg sac remnant) */}
        <mesh position={[0, STEM_R_BOT * 0.5, 0]}>
          <sphereGeometry args={[STEM_R_BOT * 1.6, 12, 8, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.38]} />
          <meshStandardMaterial color={palette.stemDark} roughness={0.88} />
        </mesh>

        {/* Stem — tapered, fibrous rings */}
        <mesh position={[0, STEM_TOP / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[STEM_R_TOP, STEM_R_BOT, STEM_TOP, 12]} />
          <meshStandardMaterial color={palette.stem} emissive={palette.stemEmissive} emissiveIntensity={0.06} roughness={0.82} />
        </mesh>
        {[0.22, 0.38].map((t, i) => (
          <mesh key={i} position={[0, STEM_TOP * t, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[STEM_R_BOT * (1.05 - t * 0.3), 0.004, 4, 12]} />
            <meshStandardMaterial color={palette.stemDark} roughness={0.9} />
          </mesh>
        ))}

        {/* Skirt ring (annulus) */}
        <mesh position={[0, STEM_TOP * 0.72, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[STEM_R_BOT * 1.35, 0.007, 5, 16]} />
          <meshStandardMaterial color={palette.stem} roughness={0.78} />
        </mesh>

        {/* Gills — radial plates under cap */}
        <group position={[0, STEM_TOP - 0.005, 0]}>
          {Array.from({ length: 28 }, (_, i) => {
            const a = (i / 28) * Math.PI * 2;
            return (
              <mesh key={i} rotation={[Math.PI / 2 + 0.08, a, 0]} position={[0, 0, 0]}>
                <boxGeometry args={[0.34, 0.003, 0.018]} />
                <meshStandardMaterial
                  color={palette.gills}
                  emissive={palette.gillEmissive}
                  emissiveIntensity={0.18}
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.92}
                />
              </mesh>
            );
          })}
        </group>

        {/* Cap */}
        <group position={[0, STEM_TOP, 0]} rotation={[capTilt, 0, capTilt * 0.5]}>
          <mesh geometry={capGeo} castShadow receiveShadow>
            <meshStandardMaterial
              ref={capMatRef}
              color={palette.cap}
              emissive={palette.capEmissive}
              emissiveIntensity={0.1}
              roughness={0.48}
              metalness={0.02}
            />
          </mesh>
          {/* Cap top highlight dome */}
          <mesh position={[0, 0.19, 0]} scale={[0.55, 0.35, 0.55]}>
            <sphereGeometry args={[0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
            <meshStandardMaterial color={palette.capTop} roughness={0.35} transparent opacity={0.35} depthWrite={false} />
          </mesh>
          {/* White spots */}
          {spots.map(([x, y, z], i) => (
            <mesh key={i} position={[x, y, z]} scale={0.045 + (i % 3) * 0.012}>
              <sphereGeometry args={[1, 8, 6]} />
              <meshStandardMaterial color={palette.spots} roughness={0.35} flatShading />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

export function RootMushroomSystem({
  stage,
  growth,
  totalWaterings,
  hydration,
}: {
  stage: number;
  growth: number;
  totalWaterings: number;
  hydration: number;
}) {
  const mushrooms = useMemo(() => getVisibleRootMushrooms(stage), [stage]);
  const targetHeight = getMushroomWorldHeight(totalWaterings, stage, growth);

  const placements = useMemo(
    () => computeRootPlacements(stage, growth, mushrooms, getScales, getTrunkMetrics),
    [stage, Math.floor(growth / 8), mushrooms]
  );

  if (mushrooms.length === 0) return null;

  return (
    <group>
      {placements.map(({ def, position, baseY }) => (
        <RootMushroom
          key={def.id}
          def={def as RootMushroomDef}
          targetHeight={targetHeight}
          hydration={hydration}
          baseY={baseY}
          position={position}
        />
      ))}
    </group>
  );
}
