"use client";

import { useRef, useMemo } from "react";
import { useAdaptiveFrame } from "@/hooks/useAdaptiveFrame";
import * as THREE from "three";
import { getTrunkMetrics } from "@/lib/plantScale";
import { getVisualStageForSizing } from "@/lib/stageConstants";
import {
  GIANT_TRUNK_BRANCHES,
  GiantTrunkBranchDef,
  getGiantBranchProgress,
  getGiantBranchLength,
  getGiantBranchThickness,
  giantBranchCurvePoint,
} from "@/lib/giantTrunkBranches";
import { usePerformanceStore } from "@/store/usePerformanceStore";

interface Props {
  stage: number;
  growth: number;
  hydration: number;
}

const FLOWER_COLORS = [
  "#ff5e9a", "#ff9040", "#d060ff", "#40c8ff", "#ff6060", "#60ff88",
  "#ffe040", "#ff4080", "#80ff40", "#4080ff", "#ff8040",
];

function makeGiantPetalGeo(): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.45, 0.08, 1.05, 0.32, 0.82, 0.62);
  shape.bezierCurveTo(0.42, 0.95, 0.12, 1.02, 0, 1.08);
  shape.bezierCurveTo(-0.12, 1.02, -0.42, 0.95, -0.82, 0.62);
  shape.bezierCurveTo(-1.05, 0.32, -0.45, 0.08, 0, 0);
  const geo = new THREE.ShapeGeometry(shape, 16);
  geo.translate(0, 0.58, 0);
  return geo;
}

const GIANT_PETAL_GEO = makeGiantPetalGeo();

function GiantBranchFlower({
  position,
  scale,
  color,
  phase,
}: {
  position: [number, number, number];
  scale: number;
  color: string;
  phase: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const petalCount = 8;

  useAdaptiveFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.rotation.z = Math.sin(t * 0.35 + phase) * 0.04;
    ref.current.rotation.y = Math.sin(t * 0.22 + phase * 1.3) * 0.06;
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      {Array.from({ length: petalCount }, (_, i) => {
        const a = (i / petalCount) * Math.PI * 2;
        return (
          <mesh
            key={i}
            geometry={GIANT_PETAL_GEO}
            scale={[0.14, 0.32, 1]}
            rotation={[0.5, 0, a]}
          >
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.45}
              side={THREE.DoubleSide}
              transparent
              opacity={0.94}
              roughness={0.35}
            />
          </mesh>
        );
      })}
      <mesh position={[0, 0, 0.02]}>
        <sphereGeometry args={[0.07, 14, 14]} />
        <meshStandardMaterial color="#ffe566" emissive="#ffd700" emissiveIntensity={0.95} />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <sphereGeometry args={[0.04, 10, 10]} />
        <meshStandardMaterial color="#ffaa22" emissive="#ff8800" emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

function BranchBeetle({
  branchLength,
  def,
  seed,
  stage,
}: {
  branchLength: number;
  def: GiantTrunkBranchDef;
  seed: number;
  stage: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const phase = seed * 3.1;

  useAdaptiveFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * 0.38 + phase;
    const along = (Math.sin(t * 0.55) * 0.5 + 0.5) * 0.7 + 0.15;
    const p = giantBranchCurvePoint(along, branchLength, def);
    ref.current.position.set(p.x, p.y + 0.042, p.z + 0.045);
    ref.current.rotation.y = Math.cos(t * 0.55) >= 0 ? -0.2 : Math.PI + 0.2;
  });

  return (
    <group ref={ref} scale={stage >= 101 ? 4.8 : 2.4}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.018, 0.05, 4, 8]} />
        <meshStandardMaterial color="#2a5820" emissive="#143010" emissiveIntensity={0.2} metalness={0.35} roughness={0.4} />
      </mesh>
    </group>
  );
}

function GiantHorizontalBranch({
  def,
  stage,
  growth,
  hydration,
}: {
  def: GiantTrunkBranchDef;
  stage: number;
  growth: number;
  hydration: number;
}) {
  const grp = useRef<THREE.Group>(null);
  const mobileStatic = usePerformanceStore((s) => s.settings().mobileStatic);
  const visualStage = getVisualStageForSizing(stage);
  const progress = getGiantBranchProgress(stage, growth, def.unlockStage);
  const length = getGiantBranchLength(def, stage, growth, Math.max(0.04, progress));
  const thickness = getGiantBranchThickness(stage, progress);

  const trunk = useMemo(() => getTrunkMetrics(stage, growth), [stage, growth]);
  const attachY = trunk.trunkBaseY + def.heightPos * trunk.trunkHeight;
  const attachR =
    THREE.MathUtils.lerp(trunk.trunkRadiusBottom, trunk.trunkRadiusTop, def.heightPos) * 1.05 + 0.06;

  const segmentCount = 6 + Math.floor(progress * 3);

  const curvePoints = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= segmentCount; i++) {
      pts.push(giantBranchCurvePoint(i / segmentCount, length, def));
    }
    return pts;
  }, [segmentCount, length, def]);

  const segments = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    return curvePoints.slice(0, -1).map((p0, si) => {
      const p1 = curvePoints[si + 1]!;
      const dir = new THREE.Vector3().subVectors(p1, p0).normalize();
      return {
        si,
        mid: p0.clone().add(p1).multiplyScalar(0.5),
        quat: new THREE.Quaternion().setFromUnitVectors(up, dir),
        segLength: p0.distanceTo(p1),
        taper: 1 - si * 0.11,
      };
    });
  }, [curvePoints]);

  useAdaptiveFrame(({ clock }) => {
    if (!grp.current) return;
    const t = clock.elapsedTime;
    grp.current.rotation.z = Math.sin(t * 0.28 + def.angle) * 0.025 * progress;
  });

  if (progress <= 0.02) return null;

  return (
    <group
      ref={grp}
      position={[Math.cos(def.angle) * attachR, attachY, Math.sin(def.angle) * attachR]}
      rotation={[0, def.angle, 0]}
    >
      {segments.map(({ si, mid, quat, segLength, taper }) => (
          <group key={si} position={mid} quaternion={quat}>
            <mesh position={[0, segLength / 2, 0]} castShadow renderOrder={5}>
              <cylinderGeometry
                args={[
                  thickness * taper * 0.88,
                  thickness * (taper + 0.06),
                  segLength,
                  10,
                ]}
              />
              <meshStandardMaterial
                color="#2a6020"
                emissive="#143810"
                emissiveIntensity={0.1 + hydration * 0.0015}
                roughness={0.84}
              />
            </mesh>
            {si < segments.length - 1 && (
              <mesh position={[0, segLength, 0]}>
                <sphereGeometry args={[thickness * taper * 1.35, 10, 10]} />
                <meshStandardMaterial
                  color="#327018"
                  emissive="#1a4810"
                  emissiveIntensity={0.14}
                  roughness={0.78}
                />
              </mesh>
            )}
          </group>
        ))}

      {/* Small side twigs — break up the flat silhouette */}
      {progress > 0.45 &&
        [0.35, 0.62, 0.82].map((twigT, ti) => {
          const base = giantBranchCurvePoint(twigT, length, def);
          const twigLen = length * 0.14;
          const twist = (ti % 2 === 0 ? 1 : -1) * (0.55 + ti * 0.2);
          return (
            <group key={`twig-${ti}`} position={[base.x, base.y, base.z]} rotation={[twist, ti * 1.4, twist * 0.35]}>
              <mesh position={[twigLen / 2, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[thickness * 0.35, thickness * 0.5, twigLen, 6]} />
                <meshStandardMaterial color="#2d6822" emissive="#183810" emissiveIntensity={0.1} roughness={0.86} />
              </mesh>
            </group>
          );
        })}

      {/* Leaf clusters along branch curve */}
      {progress > 0.35 &&
        Array.from({ length: 3 + Math.floor(progress * 4) }, (_, li) => {
          const along = 0.18 + (li / (3 + Math.floor(progress * 4))) * 0.72;
          const p = giantBranchCurvePoint(along, length, def);
          const side = li % 2 === 0 ? 1 : -1;
          return (
            <group
              key={`leaf-${li}`}
              position={[p.x, p.y + side * 0.04, p.z + side * 0.05]}
              rotation={[side * 0.35, along * 4 + side * 0.4, side * 0.3]}
            >
                {Array.from({ length: 5 }, (_, j) => (
                  <mesh
                    key={j}
                    position={[j * 0.04, Math.sin(j) * 0.03, 0]}
                    rotation={[0.2, j * 0.5, 0]}
                  >
                    <coneGeometry args={[0.035 + j * 0.008, 0.12 + j * 0.025, 5]} />
                    <meshStandardMaterial
                      color="#389820"
                      emissive="#1a6010"
                      emissiveIntensity={0.16}
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                ))}
              </group>
            );
          })}

        {/* Flowers along the 3D branch curve */}
        {Array.from({ length: def.flowerCount }, (_, fi) => {
          const along = 0.22 + (fi / Math.max(1, def.flowerCount - 1)) * 0.72;
          const p = giantBranchCurvePoint(along, length, def);
          const side = fi % 2 === 0 ? 1 : -1;
          const flowerScale = (0.75 + fi * 0.1 + visualStage * 0.004) * (0.45 + progress * 0.55);
          return (
            <GiantBranchFlower
              key={fi}
              position={[
                p.x,
                p.y + side * (0.06 + (fi % 3) * 0.03),
                p.z + side * 0.05,
              ]}
              scale={flowerScale}
              color={FLOWER_COLORS[(def.id + fi) % FLOWER_COLORS.length]!}
              phase={fi * 1.7 + def.id}
            />
          );
        })}

        {progress > 0.55 && (() => {
          const tip = giantBranchCurvePoint(0.96, length, def);
          return (
            <GiantBranchFlower
              position={[tip.x, tip.y + 0.05, tip.z + 0.04]}
              scale={(1.05 + visualStage * 0.006) * progress}
              color={FLOWER_COLORS[(def.id + 3) % FLOWER_COLORS.length]!}
              phase={def.id * 2.1}
            />
          );
        })()}

        {progress > 0.3 && !mobileStatic && stage >= def.unlockStage + 8 && (
            <BranchBeetle branchLength={length} def={def} seed={def.id + 3} stage={stage} />
          )}
    </group>
  );
}

export function GiantTrunkBranchSystem({ stage, growth, hydration }: Props) {
  if (stage < 14) return null;

  return (
    <group>
      {GIANT_TRUNK_BRANCHES.map((def) => (
        <GiantHorizontalBranch
          key={def.id}
          def={def}
          stage={stage}
          growth={growth}
          hydration={hydration}
        />
      ))}
    </group>
  );
}
