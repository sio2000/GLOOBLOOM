"use client";

import { useRef, useMemo } from "react";
import { useAdaptiveFrame } from "@/hooks/useAdaptiveFrame";
import * as THREE from "three";
import { getTrunkMetrics } from "@/lib/plantScale";
import { usePerformanceStore } from "@/store/usePerformanceStore";

interface Props {
  stage: number;
  hydration: number;
  growth: number;
}

const FLOWER_PALETTE = [
  { petal: "#ff7eb8", center: "#ffe566", stamen: "#fff8dc" },
  { petal: "#ffb347", center: "#ffd700", stamen: "#fff5cc" },
  { petal: "#c77dff", center: "#f0d0ff", stamen: "#ffffff" },
  { petal: "#6ecfff", center: "#b8ecff", stamen: "#f0fbff" },
  { petal: "#ff8a8a", center: "#ffc4c4", stamen: "#fff0f0" },
  { petal: "#8dff9a", center: "#d4ffe0", stamen: "#f5fff8" },
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

function Flower({
  pos,
  scale,
  petalCount,
  palette,
  hydration,
  phase,
  outward,
}: {
  pos: [number, number, number];
  scale: number;
  petalCount: number;
  palette: { petal: string; center: string; stamen: string };
  hydration: number;
  phase: number;
  outward: THREE.Vector3;
}) {
  const grp = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  const orientation = useMemo(() => {
    const normal = outward.clone().normalize();
    if (normal.lengthSq() < 0.001) normal.set(0, 0, 1);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
    const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.18);
    return q.multiply(tilt);
  }, [outward.x, outward.y, outward.z]);

  const petalColor = useMemo(() => new THREE.Color(palette.petal), [palette.petal]);
  const centerColor = useMemo(() => new THREE.Color(palette.center), [palette.center]);
  const stamenColor = useMemo(() => new THREE.Color(palette.stamen), [palette.stamen]);
  const emissiveIntensity = 0.22 + (hydration / 100) * 0.28;

  useAdaptiveFrame(({ clock }) => {
    if (!grp.current || !headRef.current) return;
    const t = clock.elapsedTime;
    grp.current.position.y = pos[1] + Math.sin(t * 0.7 + phase) * 0.015 * scale;
    headRef.current.rotation.z = Math.sin(t * 0.5 + phase) * 0.04;
  });

  const petalW = 0.048 * scale;
  const petalL = 0.11 * scale;
  const innerCount = Math.max(4, petalCount - 2);

  return (
    <group ref={grp} position={pos} quaternion={orientation}>
      <group ref={headRef}>
        {/* Outer petal ring */}
        {Array.from({ length: petalCount }, (_, i) => {
          const angle = (i / petalCount) * Math.PI * 2;
          return (
            <mesh
              key={`o-${i}`}
              geometry={PETAL_GEO}
              scale={[petalW, petalL, 1]}
              rotation={[0, 0, angle]}
              castShadow
            >
              <meshStandardMaterial
                color={petalColor}
                emissive={petalColor}
                emissiveIntensity={emissiveIntensity}
                side={THREE.DoubleSide}
                transparent
                opacity={0.94}
                roughness={0.35}
                metalness={0.02}
              />
            </mesh>
          );
        })}

        {/* Inner petal ring — offset for fuller bloom */}
        {Array.from({ length: innerCount }, (_, i) => {
          const angle = (i / innerCount) * Math.PI * 2 + Math.PI / innerCount;
          return (
            <mesh
              key={`i-${i}`}
              geometry={PETAL_GEO}
              scale={[petalW * 0.72, petalL * 0.78, 1]}
              rotation={[0, 0, angle]}
            >
              <meshStandardMaterial
                color={centerColor}
                emissive={centerColor}
                emissiveIntensity={emissiveIntensity * 0.85}
                side={THREE.DoubleSide}
                transparent
                opacity={0.9}
                roughness={0.4}
              />
            </mesh>
          );
        })}

        {/* Pollen disc */}
        <mesh position={[0, 0, 0.008 * scale]}>
          <circleGeometry args={[0.028 * scale, 20]} />
          <meshStandardMaterial
            color={palette.center}
            emissive={centerColor}
            emissiveIntensity={0.55}
            roughness={0.45}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Stamen center */}
        <mesh position={[0, 0, 0.014 * scale]} castShadow>
          <sphereGeometry args={[0.018 * scale, 12, 12]} />
          <meshStandardMaterial
            color={palette.stamen}
            emissive={stamenColor}
            emissiveIntensity={1.1}
            roughness={0.12}
          />
        </mesh>

        {/* Tiny stamen dots around center */}
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2;
          const r = 0.022 * scale;
          return (
            <mesh key={`s-${i}`} position={[Math.cos(a) * r, Math.sin(a) * r, 0.012 * scale]}>
              <sphereGeometry args={[0.004 * scale, 6, 6]} />
              <meshStandardMaterial
                color="#fffacd"
                emissive="#ffd700"
                emissiveIntensity={0.9}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

export function FlowerSystem({ stage, hydration, growth }: Props) {
  const mobileStatic = usePerformanceStore((s) => s.settings().mobileStatic);

  const flowers = useMemo(() => {
    if (stage < 3) return [];
    const count = stage >= 50
      ? Math.min(20 + Math.floor((stage - 50) * 0.45), 38)
      : Math.min(4 + (stage - 2) * 2, 20);
    const trunk = getTrunkMetrics(stage, growth);
    const items: Array<{
      id: number;
      pos: [number, number, number];
      scale: number;
      petalCnt: number;
      phase: number;
      palette: (typeof FLOWER_PALETTE)[number];
      outward: THREE.Vector3;
    }> = [];

    for (let i = 0; i < count; i++) {
      const onTrunk = i % 3 === 0;
      const palette = FLOWER_PALETTE[i % FLOWER_PALETTE.length]!;

      if (mobileStatic && !onTrunk) continue;

      if (onTrunk) {
        const heightPos = 0.15 + ((i * 17) % 100) / 100 * 0.78;
        const angle = ((i * 31) % 100) / 100 * Math.PI * 2;
        const trunkRadius = THREE.MathUtils.lerp(
          trunk.trunkRadiusBottom,
          trunk.trunkRadiusTop,
          heightPos
        );
        const surfaceRadius = trunkRadius + 0.05;
        const y = trunk.trunkBaseY + heightPos * trunk.trunkHeight;
        const outward = new THREE.Vector3(Math.cos(angle), 0.05, Math.sin(angle)).normalize();

        items.push({
          id: i,
          pos: [Math.cos(angle) * surfaceRadius, y, Math.sin(angle) * surfaceRadius],
          scale: 0.7 + ((i * 13) % 100) / 100 * 0.35 + stage * 0.015,
          petalCnt: 6 + (i % 3),
          phase: ((i * 23) % 100) / 100 * Math.PI * 2,
          palette,
          outward,
        });
        continue;
      }

      const angle = (i / count) * Math.PI * 2 + i * 0.35;
      const radius = 0.55 + ((i * 19) % 100) / 100 * 0.7 + (stage - 3) * 0.12;
      const height =
        trunk.trunkBaseY + trunk.trunkHeight * (0.45 + ((i * 41) % 100) / 100 * 0.55);
      const outward = new THREE.Vector3(Math.cos(angle), 0.12, Math.sin(angle)).normalize();

      items.push({
        id: i,
        pos: [Math.cos(angle) * radius, height, Math.sin(angle) * radius],
        scale: 0.75 + ((i * 29) % 100) / 100 * 0.5 + stage * 0.02,
        petalCnt: 6 + (i % 4),
        phase: ((i * 37) % 100) / 100 * Math.PI * 2,
        palette,
        outward,
      });
    }

    return items;
  }, [stage, Math.floor(growth / 15), mobileStatic]);

  if (stage < 3) return null;

  return (
    <group>
      {flowers.map((f) => (
        <Flower
          key={f.id}
          pos={f.pos}
          scale={f.scale}
          petalCount={f.petalCnt}
          palette={f.palette}
          hydration={hydration}
          phase={f.phase}
          outward={f.outward}
        />
      ))}
    </group>
  );
}
