"use client";

import { useRef, useMemo } from "react";
import { useAdaptiveFrame } from "@/hooks/useAdaptiveFrame";
import * as THREE from "three";
import { LilyFlower, RoseFlower, TulipFlower } from "./bouquet/ExtendedFlowers";
import { MAX_ECOSYSTEM_STAGE, extendedHeightDamping, getVisualStageForSizing, LEGACY_MAX_STAGE } from "@/lib/stageConstants";
import { getTrunkMetrics } from "@/lib/plantScale";
import { usePerformanceStore } from "@/store/usePerformanceStore";

interface Props {
  stage: number;
  growth: number;
  hydration: number;
}

const BOUQUET_PALETTE = [
  { petal: "#ff6eb4", center: "#ffe066", stamen: "#fff8dc" },
  { petal: "#ffb347", center: "#ffd700", stamen: "#fff5cc" },
  { petal: "#c77dff", center: "#f0d0ff", stamen: "#ffffff" },
  { petal: "#6ecfff", center: "#b8ecff", stamen: "#f0fbff" },
  { petal: "#ff8a8a", center: "#ffc4c4", stamen: "#fff0f0" },
  { petal: "#8dff9a", center: "#d4ffe0", stamen: "#f5fff8" },
  { petal: "#ff9ff3", center: "#ffd6fa", stamen: "#fff0fd" },
  { petal: "#ffe066", center: "#fff3b0", stamen: "#fffde7" },
];

function makePetalGeometry(width: number, length: number): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(width * 0.42, length * 0.06, width * 0.95, length * 0.28, width * 0.72, length * 0.58);
  shape.bezierCurveTo(width * 0.38, length * 0.9, width * 0.1, length * 0.98, 0, length);
  shape.bezierCurveTo(-width * 0.1, length * 0.98, -width * 0.38, length * 0.9, -width * 0.72, length * 0.58);
  shape.bezierCurveTo(-width * 0.95, length * 0.28, -width * 0.42, length * 0.06, 0, 0);
  const geo = new THREE.ShapeGeometry(shape, 14);
  geo.translate(0, length * 0.52, 0);
  geo.computeVertexNormals();
  return geo;
}

const PETAL_GEO = makePetalGeometry(1, 1);

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function BouquetFlower({
  angle,
  radius,
  height,
  scale,
  openT,
  palette,
  petalCount,
  phase,
  hydration,
  variant,
  staticPosition = false,
}: {
  angle: number;
  radius: number;
  height: number;
  scale: number;
  openT: number;
  palette: { petal: string; center: string; stamen: string };
  petalCount: number;
  phase: number;
  hydration: number;
  variant: number;
  /** When true, flower stays fixed at `height` (no vertical bob). */
  staticPosition?: boolean;
}) {
  const grp = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);

  const petalColor = useMemo(() => new THREE.Color(palette.petal), [palette.petal]);
  const centerColor = useMemo(() => new THREE.Color(palette.center), [palette.center]);
  const emissive = 0.25 + (hydration / 100) * 0.35;

  const tilt = variant % 2 === 0 ? -0.35 : 0.25;
  const droop = THREE.MathUtils.lerp(0.85, 0.15, openT);

  useAdaptiveFrame(({ clock }) => {
    if (!grp.current || !head.current) return;
    if (!staticPosition) {
      const t = clock.elapsedTime;
      grp.current.position.y = height + Math.sin(t * 0.6 + phase) * 0.04 * scale;
      head.current.rotation.z = Math.sin(t * 0.45 + phase) * 0.06 * openT;
    } else {
      grp.current.position.y = height;
    }
  });

  const petalW = 0.055 * scale;
  const petalL = 0.13 * scale;
  const petalOpen = openT * Math.PI * 0.55;

  return (
    <group
      ref={grp}
      position={[Math.cos(angle) * radius, height, Math.sin(angle) * radius]}
      rotation={[tilt * droop, angle + Math.PI, 0]}
    >
      <group ref={head}>
        {Array.from({ length: petalCount }, (_, i) => {
          const a = (i / petalCount) * Math.PI * 2;
          return (
            <mesh
              key={`p-${i}`}
              geometry={PETAL_GEO}
              scale={[petalW, petalL, 1]}
              rotation={[petalOpen, 0, a]}
            >
              <meshStandardMaterial
                color={petalColor}
                emissive={petalColor}
                emissiveIntensity={emissive}
                side={THREE.DoubleSide}
                transparent
                opacity={0.95}
                roughness={0.32}
              />
            </mesh>
          );
        })}

        {Array.from({ length: Math.max(5, petalCount - 2) }, (_, i) => {
          const a = (i / Math.max(5, petalCount - 2)) * Math.PI * 2 + 0.4;
          return (
            <mesh
              key={`i-${i}`}
              geometry={PETAL_GEO}
              scale={[petalW * 0.65, petalL * 0.72, 1]}
              rotation={[petalOpen * 0.85, 0, a]}
            >
              <meshStandardMaterial
                color={centerColor}
                emissive={centerColor}
                emissiveIntensity={emissive * 0.8}
                side={THREE.DoubleSide}
                transparent
                opacity={0.9}
                roughness={0.38}
              />
            </mesh>
          );
        })}

        <mesh position={[0, 0, 0.02 * scale]}>
          <sphereGeometry args={[0.035 * scale, 14, 14]} />
          <meshStandardMaterial
            color={palette.stamen}
            emissive={palette.stamen}
            emissiveIntensity={1.2}
            roughness={0.15}
          />
        </mesh>
      </group>
    </group>
  );
}

function legacyBouquetBase(stage: number): number {
  if (stage < 58) return 0;
  if (stage >= 95) return 3.2 + stage * 0.05;
  if (stage >= 88) return 2.6 + stage * 0.065;
  if (stage >= 75) return 2.1 + stage * 0.055;
  return 1.8 + stage * 0.06;
}

export function CrownBouquet({ stage, growth, hydration }: Props) {
  const mobileStatic = usePerformanceStore((s) => s.settings().mobileStatic);
  const rootRef = useRef<THREE.Group>(null);
  const budRef = useRef<THREE.Group>(null);
  const bouquetRef = useRef<THREE.Group>(null);

  const trunk = useMemo(() => getTrunkMetrics(stage, growth), [stage, growth]);
  const visualStage = getVisualStageForSizing(stage);
  const damp = extendedHeightDamping(stage);
  const legacy = Math.min(visualStage, LEGACY_MAX_STAGE);
  const crownRadius =
    0.22 +
    legacy * 0.004 +
    (stage > LEGACY_MAX_STAGE ? growth * 0.0004 * damp : growth * 0.0015) +
    (legacy >= 50 ? (legacy - 50) * 0.005 : 0) +
    (stage > LEGACY_MAX_STAGE ? (visualStage - LEGACY_MAX_STAGE) * 0.0012 * damp : 0);
  const anchorY = trunk.trunkTopY + crownRadius * 0.55;

  // Bloom progression: budding at 58, unfurled at 100, mega bloom by 400
  const bloomT = useMemo(() => {
    if (stage < 58) return 0;
    const span = stage >= 101 ? MAX_ECOSYSTEM_STAGE - 58 : 42;
    return easeOutCubic(Math.min(1, (stage - 58) / span));
  }, [stage]);

  const growthFine = useMemo(
    () => Math.min(0.12, (growth % 15) / 15 * 0.12),
    [growth]
  );
  const openT = Math.min(1, bloomT + growthFine);

  const bouquetScale = useMemo(() => {
    if (stage < 58) return 0;
    const base = legacyBouquetBase(visualStage);
    return base * THREE.MathUtils.lerp(0.08, 1, openT);
  }, [stage, visualStage, openT]);

  const flowers = useMemo(() => {
    if (stage < 58) return [];
    const vs = visualStage;
    const count =
      vs >= 300 ? Math.min(80 + Math.floor((vs - 300) * 0.8), 120) :
      vs >= 200 ? Math.min(58 + Math.floor((vs - 200) * 0.6), 85) :
      vs >= 150 ? Math.min(48 + Math.floor((vs - 150) * 0.5), 65) :
      vs >= 101 ? Math.min(38 + Math.floor((vs - 101) * 0.45), 55) :
      vs >= 95 ? Math.min(42 + Math.floor((vs - 95) * 3), 58) :
      vs >= 88 ? Math.min(32 + Math.floor((vs - 88) * 2.2), 48) :
      vs >= 75 ? Math.min(22 + Math.floor((vs - 75) / 1.4), 36) :
      Math.min(10 + Math.floor((vs - 58) / 3), 22);
    return Array.from({ length: count }, (_, i) => {
      const ring = i % 4;
      const angle = (i / count) * Math.PI * 2 + i * 0.62;
      const radius = (0.1 + ring * 0.12 + (i % 5) * 0.028) * bouquetScale;
      const height = (0.04 + ring * 0.14 + (i % 4) * 0.055) * bouquetScale;
      return {
        id: i,
        angle,
        radius,
        height,
        scale: (0.85 + (i % 4) * 0.2 + vs * 0.014) * bouquetScale,
        petalCount: 6 + (i % 5),
        palette: BOUQUET_PALETTE[i % BOUQUET_PALETTE.length]!,
        phase: i * 1.7,
        variant: i,
      };
    });
  }, [stage, visualStage, bouquetScale]);

  const fillerFlowers = useMemo(() => {
    if (stage < 90) return [];
    const vs = visualStage;
    const count = Math.min(12 + Math.floor((vs - 90) * 1.5), 24);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (i / count) * Math.PI * 2 + 0.8,
      radius: (0.28 + (i % 3) * 0.08) * bouquetScale,
      height: (0.22 + (i % 4) * 0.1) * bouquetScale,
      scale: (0.55 + (i % 3) * 0.12) * bouquetScale,
      palette: BOUQUET_PALETTE[(i + 4) % BOUQUET_PALETTE.length]!,
      phase: i * 2.3,
      variant: i + 10,
      petalCount: 5 + (i % 3),
    }));
  }, [stage, visualStage, bouquetScale]);

  const wrapLeaves = useMemo(() => {
    if (stage < 62) return [];
    const vs = visualStage;
    const count = Math.min(8 + Math.floor((vs - 62) / 4), vs >= 200 ? 40 : 16);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (i / count) * Math.PI * 2 + 0.3,
      height: -0.08 * bouquetScale + (i % 3) * 0.04,
      radius: 0.18 * bouquetScale + (i % 2) * 0.06,
      scale: 0.35 * bouquetScale,
    }));
  }, [stage, visualStage, bouquetScale]);

  const roses = useMemo(() => {
    if (stage < 101) return [];
    const vs = visualStage;
    const count = Math.min(8 + Math.floor((vs - 101) / 8), 45);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (i / count) * Math.PI * 2 + i * 0.4,
      radius: (0.15 + (i % 5) * 0.08) * bouquetScale,
      height: (0.08 + (i % 4) * 0.12) * bouquetScale,
      scale: (0.7 + (i % 3) * 0.25) * bouquetScale * 0.35,
      color: ["#e82050", "#ff4080", "#c01840", "#ff6090"][i % 4]!,
      phase: i * 1.3,
    }));
  }, [stage, visualStage, bouquetScale]);

  const tulips = useMemo(() => {
    if (stage < 115) return [];
    const vs = visualStage;
    const count = Math.min(6 + Math.floor((vs - 115) / 10), 35);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (i / count) * Math.PI * 2 + 1.2,
      radius: (0.2 + (i % 4) * 0.1) * bouquetScale,
      height: (0.05 + (i % 3) * 0.14) * bouquetScale,
      scale: (0.65 + (i % 3) * 0.2) * bouquetScale * 0.4,
      color: ["#ff6040", "#ffb020", "#ff3080", "#ffe040", "#ff8040"][i % 5]!,
      phase: i * 1.9,
    }));
  }, [stage, visualStage, bouquetScale]);

  const lilies = useMemo(() => {
    if (stage < 130) return [];
    const vs = visualStage;
    const count = Math.min(5 + Math.floor((vs - 130) / 12), 28);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (i / count) * Math.PI * 2 + 0.6,
      radius: (0.25 + (i % 3) * 0.12) * bouquetScale,
      height: (0.1 + (i % 4) * 0.11) * bouquetScale,
      scale: (0.75 + (i % 2) * 0.3) * bouquetScale * 0.38,
      color: "#f8f4ff",
      accent: "#ffe040",
      phase: i * 2.1,
    }));
  }, [stage, visualStage, bouquetScale]);

  useAdaptiveFrame(({ clock }) => {
    if (mobileStatic) return;
    const t = clock.elapsedTime;
    if (rootRef.current) {
      rootRef.current.rotation.y = Math.sin(t * 0.12) * 0.08 * openT;
    }
    if (budRef.current) {
      const budScale = THREE.MathUtils.lerp(0.15, 1, openT);
      budRef.current.scale.setScalar(budScale);
      budRef.current.rotation.z = Math.sin(t * 0.25) * 0.05 * (1 - openT);
    }
    if (bouquetRef.current) {
      bouquetRef.current.scale.setScalar(THREE.MathUtils.lerp(0.05, 1, openT));
    }
  });

  if (stage < 58) return null;

  return (
    <group ref={rootRef} position={[0, anchorY, 0]}>
      {/* Stalk — slowly extends as crown unfurls */}
      <mesh position={[0, 0.15 * bouquetScale * openT, 0]} rotation={[0.08 * (1 - openT), 0, 0]}>
        <cylinderGeometry args={[0.018 * bouquetScale, 0.028 * bouquetScale, 0.35 * bouquetScale * openT + 0.05, 8]} />
        <meshStandardMaterial color="#2a6018" emissive="#143008" emissiveIntensity={0.1} roughness={0.85} />
      </mesh>

      {/* Tight bud before full bloom */}
      <group ref={budRef} position={[0, 0.22 * bouquetScale, 0]} visible={openT < 0.95}>
        <mesh>
          <sphereGeometry args={[0.12 * bouquetScale, 12, 12]} />
          <meshStandardMaterial color="#3a8820" emissive="#1a5010" emissiveIntensity={0.15} roughness={0.7} />
        </mesh>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} rotation={[0.6, (i / 6) * Math.PI * 2, 0]} position={[0, 0.04 * bouquetScale, 0]}>
            <coneGeometry args={[0.04 * bouquetScale, 0.14 * bouquetScale, 6]} />
            <meshStandardMaterial color="#4caf50" emissive="#2e7d32" emissiveIntensity={0.12} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      {/* Giant unfolding bouquet */}
      <group ref={bouquetRef} position={[0, 0.28 * bouquetScale, 0]}>
        {/* Greenery wrap at base */}
        {!mobileStatic &&
          wrapLeaves.map((l) => (
          <mesh
            key={l.id}
            position={[Math.cos(l.angle) * l.radius, l.height, Math.sin(l.angle) * l.radius]}
            rotation={[0.5, l.angle, 0.3]}
            scale={l.scale}
          >
            <coneGeometry args={[0.06, 0.22, 5]} />
            <meshStandardMaterial color="#2d9220" emissive="#1a6010" emissiveIntensity={0.12} side={THREE.DoubleSide} />
          </mesh>
          ))}

        {!mobileStatic &&
          flowers.map((f) => (
          <BouquetFlower
            key={f.id}
            angle={f.angle}
            radius={f.radius}
            height={f.height}
            scale={f.scale}
            openT={openT}
            palette={f.palette}
            petalCount={f.petalCount}
            phase={f.phase}
            hydration={hydration}
            variant={f.variant}
          />
          ))}

        {!mobileStatic &&
          fillerFlowers.map((f) => (
          <BouquetFlower
            key={`fill-${f.id}`}
            angle={f.angle}
            radius={f.radius}
            height={f.height}
            scale={f.scale}
            openT={openT}
            palette={f.palette}
            petalCount={f.petalCount}
            phase={f.phase}
            hydration={hydration}
            variant={f.variant}
          />
          ))}

        {!mobileStatic &&
          roses.map((r) => (
          <RoseFlower key={`rose-${r.id}`} {...r} openT={openT} hydration={hydration} />
          ))}
        {!mobileStatic &&
          tulips.map((t) => (
          <TulipFlower key={`tulip-${t.id}`} {...t} openT={openT} hydration={hydration} />
          ))}
        {!mobileStatic &&
          lilies.map((l) => (
          <LilyFlower key={`lily-${l.id}`} {...l} openT={openT} hydration={hydration} />
          ))}

        {/* Central hero flower — largest at stage 90+ */}
        {stage >= 70 && (
          <group position={[0, 0.12 * bouquetScale, 0]}>
            <BouquetFlower
              angle={0}
              radius={0}
              height={0}
              scale={(2.8 + (visualStage - 70) * 0.06 + (visualStage >= 95 ? 1.2 : 0) + (visualStage >= 200 ? (visualStage - 200) * 0.02 : 0)) * bouquetScale}
              openT={openT}
              palette={BOUQUET_PALETTE[(stage + 3) % BOUQUET_PALETTE.length]!}
              petalCount={8}
              phase={0}
              hydration={hydration}
              variant={0}
              staticPosition
            />
          </group>
        )}
      </group>
    </group>
  );
}
