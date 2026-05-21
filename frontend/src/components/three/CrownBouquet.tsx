"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTrunkMetrics } from "@/lib/plantScale";

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
}) {
  const grp = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);

  const petalColor = useMemo(() => new THREE.Color(palette.petal), [palette.petal]);
  const centerColor = useMemo(() => new THREE.Color(palette.center), [palette.center]);
  const emissive = 0.25 + (hydration / 100) * 0.35;

  const tilt = variant % 2 === 0 ? -0.35 : 0.25;
  const droop = THREE.MathUtils.lerp(0.85, 0.15, openT);

  useFrame(({ clock }) => {
    if (!grp.current || !head.current) return;
    const t = clock.elapsedTime;
    grp.current.position.y = height + Math.sin(t * 0.6 + phase) * 0.04 * scale;
    head.current.rotation.z = Math.sin(t * 0.45 + phase) * 0.06 * openT;
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

export function CrownBouquet({ stage, growth, hydration }: Props) {
  const rootRef = useRef<THREE.Group>(null);
  const budRef = useRef<THREE.Group>(null);
  const bouquetRef = useRef<THREE.Group>(null);

  const trunk = useMemo(() => getTrunkMetrics(stage, growth), [stage, growth]);
  const crownRadius = 0.22 + stage * 0.004 + growth * 0.0015 + (stage >= 50 ? (stage - 50) * 0.005 : 0);
  const anchorY = trunk.trunkTopY + crownRadius * 0.55;

  // Bloom progression: starts budding at 58, fully unfurled at 100
  const bloomT = useMemo(() => {
    if (stage < 58) return 0;
    return easeOutCubic(Math.min(1, (stage - 58) / 42));
  }, [stage]);

  const growthFine = useMemo(
    () => Math.min(0.12, (growth % 15) / 15 * 0.12),
    [growth]
  );
  const openT = Math.min(1, bloomT + growthFine);

  const bouquetScale = useMemo(() => {
    if (stage < 58) return 0;
    const base = 1.8 + stage * 0.06;
    return base * THREE.MathUtils.lerp(0.08, 1, openT);
  }, [stage, openT]);

  const flowers = useMemo(() => {
    if (stage < 58) return [];
    const count = Math.min(10 + Math.floor((stage - 58) / 3), 22);
    return Array.from({ length: count }, (_, i) => {
      const ring = i % 3;
      const angle = (i / count) * Math.PI * 2 + i * 0.62;
      const radius = (0.12 + ring * 0.14 + (i % 5) * 0.03) * bouquetScale;
      const height = (0.05 + ring * 0.18 + (i % 4) * 0.06) * bouquetScale;
      return {
        id: i,
        angle,
        radius,
        height,
        scale: (0.9 + (i % 4) * 0.22 + stage * 0.012) * bouquetScale,
        petalCount: 6 + (i % 4),
        palette: BOUQUET_PALETTE[i % BOUQUET_PALETTE.length]!,
        phase: i * 1.7,
        variant: i,
      };
    });
  }, [stage, bouquetScale]);

  const wrapLeaves = useMemo(() => {
    if (stage < 62) return [];
    const count = Math.min(8 + Math.floor((stage - 62) / 4), 16);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (i / count) * Math.PI * 2 + 0.3,
      height: -0.08 * bouquetScale + (i % 3) * 0.04,
      radius: 0.18 * bouquetScale + (i % 2) * 0.06,
      scale: 0.35 * bouquetScale,
    }));
  }, [stage, bouquetScale]);

  useFrame(({ clock }) => {
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
        {wrapLeaves.map((l) => (
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

        {flowers.map((f) => (
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

        {/* Central hero flower — largest at stage 90+ */}
        {stage >= 70 && (
          <group position={[0, 0.12 * bouquetScale, 0]}>
            <BouquetFlower
              angle={0}
              radius={0}
              height={0}
              scale={(2.2 + (stage - 70) * 0.04) * bouquetScale}
              openT={openT}
              palette={BOUQUET_PALETTE[(stage + 3) % BOUQUET_PALETTE.length]!}
              petalCount={8}
              phase={0}
              hydration={hydration}
              variant={0}
            />
          </group>
        )}
      </group>
    </group>
  );
}
