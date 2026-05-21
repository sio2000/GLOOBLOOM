"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { LeafData } from "@/types/organism";
import { getTrunkMetrics } from "@/lib/plantScale";
import {
  MAJOR_BRANCH_DEFS,
  MajorBranchDef,
  CLONED_TWIG_DEFS,
  getBranchProgress,
  getBranchLength,
  filterBranchLeaves,
} from "@/lib/majorBranches";

interface Props {
  stage: number;
  growth: number;
  hydration: number;
  leaves: LeafData[];
}

const FLOWER_COLORS = ["#ff7eb8", "#ffb347", "#c77dff", "#6ecfff", "#ff8a8a", "#8dff9a"];

/** Visual template — matches the 2 visible decorated twigs exactly */
const TWIG_TEMPLATE = {
  baseLength: 0.95,
  tilt: 0.42,
  thickness: 0.035,
  flowerCount: 4,
  showCaterpillar: true,
  showLadybugs: true,
  showButterflies: true,
};

function makePetalGeo(): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.42, 0.06, 0.95, 0.28, 0.72, 0.58);
  shape.bezierCurveTo(0.38, 0.9, 0.1, 0.98, 0, 1);
  shape.bezierCurveTo(-0.1, 0.98, -0.38, 0.9, -0.72, 0.58);
  shape.bezierCurveTo(-0.95, 0.28, -0.42, 0.06, 0, 0);
  const geo = new THREE.ShapeGeometry(shape, 12);
  geo.translate(0, 0.52, 0);
  return geo;
}

const PETAL_GEO = makePetalGeo();
const LEAF_GEO = (() => {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.55, 0.06, 1, 0.32, 0.82, 0.56);
  shape.bezierCurveTo(0.62, 0.78, 0.2, 0.93, 0, 1);
  shape.bezierCurveTo(-0.2, 0.93, -0.62, 0.78, -0.82, 0.56);
  shape.bezierCurveTo(-1, 0.32, -0.55, 0.06, 0, 0);
  return new THREE.ShapeGeometry(shape, 14);
})();

function BranchFlower({
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

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.5 + phase) * 0.05;
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} geometry={PETAL_GEO} scale={[0.05, 0.11, 1]} rotation={[0.55, 0, a]}>
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} side={THREE.DoubleSide} transparent opacity={0.92} />
          </mesh>
        );
      })}
      <mesh position={[0, 0, 0.01]}>
        <sphereGeometry args={[0.022, 10, 10]} />
        <meshStandardMaterial color="#ffe566" emissive="#ffd700" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function BranchCaterpillar({ length, phase }: { length: number; phase: number }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.position.y = length * 0.55 + Math.sin(t * 1.2 + phase) * 0.015;
    ref.current.rotation.z = Math.sin(t * 0.8 + phase) * 0.08;
  });

  return (
    <group ref={ref} position={[0.04, length * 0.55, 0.03]} rotation={[0, 0.3, 0.15]}>
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[i * 0.045, Math.sin(i * 0.8) * 0.012, 0]}>
          <sphereGeometry args={[0.022 - i * 0.002, 8, 8]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#6ecf4a" : "#4a9a30"} emissive="#2a6018" emissiveIntensity={0.12} roughness={0.65} />
        </mesh>
      ))}
      <mesh position={[-0.02, 0.01, 0.02]}>
        <sphereGeometry args={[0.012, 6, 6]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  );
}

function BranchLadybug({ branchLength, seed }: { branchLength: number; seed: number }) {
  const ref = useRef<THREE.Group>(null);
  const phase = seed * 2.1;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * 0.9 + phase;
    const r = 0.18 + Math.sin(t * 0.5) * 0.06;
    ref.current.position.set(
      Math.cos(t) * r,
      branchLength * 0.85 + Math.sin(t * 1.3) * 0.08,
      Math.sin(t) * r
    );
    ref.current.rotation.y = t;
  });

  return (
    <group ref={ref} scale={1.8}>
      <mesh scale={[1.1, 0.85, 1]}>
        <sphereGeometry args={[0.025, 10, 10]} />
        <meshStandardMaterial color="#e02020" emissive="#801010" emissiveIntensity={0.15} roughness={0.45} />
      </mesh>
    </group>
  );
}

function BranchButterfly({ branchLength, seed, color }: { branchLength: number; seed: number; color: string }) {
  const ref = useRef<THREE.Group>(null);
  const wL = useRef<THREE.Mesh>(null);
  const wR = useRef<THREE.Mesh>(null);
  const phase = seed * 1.5;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * 0.7 + phase;
    const flap = Math.sin(clock.elapsedTime * 8 + phase) * 0.55;
    ref.current.position.set(
      Math.cos(t) * 0.35,
      branchLength * 0.9 + Math.sin(t * 1.1) * 0.12,
      Math.sin(t) * 0.35
    );
    if (wL.current) wL.current.rotation.y = flap;
    if (wR.current) wR.current.rotation.y = -flap;
  });

  return (
    <group ref={ref} scale={2.2}>
      <mesh ref={wL} position={[0.05, 0, 0]}>
        <planeGeometry args={[0.1, 0.07]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} side={THREE.DoubleSide} transparent opacity={0.88} />
      </mesh>
      <mesh ref={wR} position={[-0.05, 0, 0]} scale={[-1, 1, 1]}>
        <planeGeometry args={[0.1, 0.07]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} side={THREE.DoubleSide} transparent opacity={0.88} />
      </mesh>
      <mesh>
        <capsuleGeometry args={[0.005, 0.04, 4, 6]} />
        <meshStandardMaterial color="#101008" />
      </mesh>
    </group>
  );
}

function BranchNameLeaf({ leaf, localPos }: { leaf: LeafData; localPos: [number, number, number] }) {
  const ls = leaf.scale * 1.2;
  const displayName = (leaf.username?.trim() || "Anonymous").slice(0, 14);
  const fontSize = Math.max(0.024, 0.032 * ls);

  return (
    <group position={localPos} rotation={[0.2, leaf.rotation, 0]}>
      <mesh geometry={LEAF_GEO} scale={[0.09 * ls, 0.22 * ls, 1]}>
        <meshStandardMaterial color="#2d9220" emissive="#1a6010" emissiveIntensity={0.1} side={THREE.DoubleSide} />
      </mesh>
      <Text position={[0, 0.05 * ls, 0.008]} fontSize={fontSize} color="#0a0a0a" anchorX="center" anchorY="middle"
        outlineWidth={fontSize * 0.12} outlineColor="#ffffff" outlineOpacity={0.95} fontWeight={700}>
        {displayName}
      </Text>
    </group>
  );
}

function DecoratedTwig({
  def,
  stage,
  growth,
  hydration,
  branchLeaves,
  forceFull = false,
}: {
  def: MajorBranchDef;
  stage: number;
  growth: number;
  hydration: number;
  branchLeaves: LeafData[];
  forceFull?: boolean;
}) {
  const grp = useRef<THREE.Group>(null);
  const progress = forceFull ? 1 : getBranchProgress(stage, growth, def.unlockStage);
  const length = getBranchLength(
    { ...def, baseLength: TWIG_TEMPLATE.baseLength },
    stage,
    growth,
    Math.max(0.05, progress)
  );
  const thickness = TWIG_TEMPLATE.thickness + def.id * 0.0001;

  const trunk = useMemo(() => getTrunkMetrics(stage, growth), [stage, growth]);
  const attachY = trunk.trunkBaseY + def.heightPos * trunk.trunkHeight;
  const attachR = THREE.MathUtils.lerp(
    trunk.trunkRadiusBottom,
    trunk.trunkRadiusTop,
    def.heightPos
  ) * 1.1 + 0.04;
  const tilt = TWIG_TEMPLATE.tilt;

  useFrame(({ clock }) => {
    if (!grp.current) return;
    const t = clock.elapsedTime;
    grp.current.rotation.z = Math.sin(t * 0.45 + def.angle) * 0.035 * progress;
  });

  if (progress <= 0) return null;

  return (
    <group
      ref={grp}
      position={[Math.cos(def.angle) * attachR, attachY, Math.sin(def.angle) * attachR]}
      rotation={[tilt, def.angle, 0]}
    >
      {Array.from({ length: 4 }, (_, si) => {
        const segLen = length / 4;
        const curve = si * 0.06;
        return (
          <group key={si} position={[0, si * segLen, 0]} rotation={[curve, 0, 0]}>
            <mesh position={[0, segLen / 2, 0]} castShadow renderOrder={4}>
              <cylinderGeometry args={[thickness * (1 - si * 0.15), thickness * (1.1 - si * 0.08), segLen, 8]} />
              <meshStandardMaterial color="#1e5010" emissive="#0e2808" emissiveIntensity={0.08 + hydration * 0.001} roughness={0.82} />
            </mesh>
            <mesh position={[0, segLen, 0]}>
              <sphereGeometry args={[thickness * 1.5, 8, 8]} />
              <meshStandardMaterial color="#285c10" emissive="#1a3a08" emissiveIntensity={0.1} />
            </mesh>
          </group>
        );
      })}

      <group position={[0, length * 0.92, 0]}>
        {Array.from({ length: 4 }, (_, i) => (
          <mesh key={i} position={[Math.cos(i * 1.5) * 0.06, i * 0.02, Math.sin(i * 1.5) * 0.06]} rotation={[0.3, i, 0]}>
            <coneGeometry args={[0.04, 0.12, 5]} />
            <meshStandardMaterial color="#389020" emissive="#1a6010" emissiveIntensity={0.12} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      {Array.from({ length: TWIG_TEMPLATE.flowerCount }, (_, fi) => {
        const along = 0.45 + (fi / TWIG_TEMPLATE.flowerCount) * 0.45;
        return (
          <BranchFlower
            key={fi}
            position={[0.05 + (fi % 2) * 0.04, length * along, 0.03]}
            scale={1.4 + fi * 0.15}
            color={FLOWER_COLORS[(def.id + fi) % FLOWER_COLORS.length]!}
            phase={fi + def.id}
          />
        );
      })}

      {TWIG_TEMPLATE.showCaterpillar && <BranchCaterpillar length={length} phase={def.id} />}
      {TWIG_TEMPLATE.showLadybugs && <BranchLadybug branchLength={length} seed={def.id} />}
      {TWIG_TEMPLATE.showButterflies && (
        <BranchButterfly branchLength={length} seed={def.id} color={FLOWER_COLORS[def.id % FLOWER_COLORS.length]!} />
      )}

      {branchLeaves.map((leaf, li) => {
        const along = 0.35 + (li / Math.max(1, branchLeaves.length)) * 0.5;
        return (
          <BranchNameLeaf key={leaf.id} leaf={leaf} localPos={[0.06 + (li % 2) * 0.05, length * along, 0.04]} />
        );
      })}
    </group>
  );
}

export function MajorBranchSystem({ stage, growth, hydration, leaves }: Props) {
  if (stage < 3) return null;

  return (
    <group>
      {MAJOR_BRANCH_DEFS.map((def) => (
        <DecoratedTwig
          key={def.id}
          def={def}
          stage={stage}
          growth={growth}
          hydration={hydration}
          branchLeaves={filterBranchLeaves(leaves, def.id, stage, growth)}
        />
      ))}
      {CLONED_TWIG_DEFS.map((def) => (
        <DecoratedTwig
          key={def.id}
          def={def}
          stage={stage}
          growth={growth}
          hydration={hydration}
          branchLeaves={[]}
          forceFull
        />
      ))}
    </group>
  );
}
