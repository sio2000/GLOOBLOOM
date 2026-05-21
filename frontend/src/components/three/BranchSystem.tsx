"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { STAGE_COLORS } from "@/types/organism";
import { getTrunkMetrics } from "@/lib/plantScale";

interface Props {
  stage: number;
  growth: number;
  hydration: number;
  decay: number;
}

interface BranchDef {
  id: number;
  angle: number;
  tilt: number;
  length: number;
  thickness: number;
  phase: number;
  heightPos: number;
  childCount: number;
}

function useBranchDefs(stage: number, growth: number): BranchDef[] {
  return useMemo(() => {
    const count = stage >= 50
      ? Math.min(20 + Math.floor((stage - 50) * 0.45), 38)
      : Math.min(4 + Math.floor(stage * 0.5), 20);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (i / count) * Math.PI * 2 + (i % 3) * 0.35,
      tilt: 0.35 + (i % 5) * 0.14,
      length: 0.55 + growth * 0.0012 + (i % 3) * 0.12,
      thickness: 0.018 + (i % 3) * 0.006 + stage * 0.00018,
      phase: (i * 1.618) % (Math.PI * 2),
      heightPos: 0.12 + (i / count) * 0.82,
      childCount: stage >= 15 ? Math.min(Math.floor(stage / 10), 4) : 0,
    }));
  }, [Math.floor(stage / 3), Math.floor(growth / 15)]);
}

// ─────────────────────────────────────────────────────────
// Leaf cluster at branch tip — organic glob of green
// ─────────────────────────────────────────────────────────
function LeafCluster({ color, accent, stage }: {
  color: string; accent: string; stage: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  const leafCount = Math.min(3 + Math.floor(stage / 8), 8);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    // Gentle leaf sway at higher stages
    if (stage >= 20) {
      ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.6 + phase) * 0.10;
      ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.45 + phase * 1.3) * 0.06;
    }
  });

  // Leaf-green color — always plant-green at early stages
  // Leaf clusters are always plant-green — only tips and flowers get stage color
  const leafCol = new THREE.Color("#2a9820").lerp(new THREE.Color(color), 0.12);

  return (
    <group ref={ref}>
      {Array.from({ length: leafCount }, (_, li) => {
        const la = (li / leafCount) * Math.PI * 2;
        const lr = 0.03 + (li % 3) * 0.02;
        return (
          <mesh key={li} position={[Math.cos(la) * lr, (li % 3) * 0.03, Math.sin(la) * lr]}>
            <sphereGeometry args={[0.022 + (li % 2) * 0.008, 5, 5]} />
            <meshStandardMaterial
              color={leafCol}
              emissive={leafCol}
              emissiveIntensity={0.18}
              transparent opacity={0.90}
              roughness={0.60}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ─────────────────────────────────────────────────────────
// Single branch with children + leaf cluster
// ─────────────────────────────────────────────────────────
function Branch({ def, colors, hydration, decay, stage, growth }: {
  def: BranchDef;
  colors: { core: string; glow: string; accent: string };
  hydration: number; decay: number; stage: number; growth: number;
}) {
  const grp = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!grp.current) return;
    const t = clock.elapsedTime;
    const swayAmount = 0.04 + Math.min(stage, 60) * 0.001;
    grp.current.rotation.z = Math.sin(t * 0.55 + def.phase) * swayAmount + Math.sin(t * 1.1 + def.phase * 1.7) * swayAmount * 0.5;
    grp.current.rotation.x = Math.sin(t * 0.38 + def.phase * 0.7) * swayAmount * 0.4;
  });

  const emissive = (hydration / 100) * 0.18 + 0.03;
  const trunkCol = decay > 35 ? "#2a4812" : "#1e5c0e";
  const trunkMetrics = getTrunkMetrics(stage, growth);
  const attachY = trunkMetrics.trunkBaseY + def.heightPos * trunkMetrics.trunkHeight;
  const attachRadius = THREE.MathUtils.lerp(
    trunkMetrics.trunkRadiusBottom,
    trunkMetrics.trunkRadiusTop,
    def.heightPos
  );

  const segments = stage >= 30 ? 3 : 2;
  const segLen   = def.length / segments;

  return (
    <group ref={grp} position={[Math.cos(def.angle) * attachRadius, attachY, Math.sin(def.angle) * attachRadius]} rotation={[def.tilt, def.angle, 0]}>
      {/* Trunk segments */}
      {Array.from({ length: segments }, (_, si) => (
        <group key={si} position={[0, si * segLen, 0]} rotation={[si * 0.07, 0, 0]}>
          <mesh position={[0, segLen / 2, 0]} castShadow>
            <cylinderGeometry args={[def.thickness * (1 - si * 0.22), def.thickness * (1.15 - si * 0.08), segLen, 6]} />
            <meshStandardMaterial
              color={trunkCol}
              emissive="#0e2808"
              emissiveIntensity={emissive}
              roughness={0.78}
              metalness={0.02}
            />
          </mesh>
          {/* Branch node knot — green knuckle */}
          <mesh position={[0, segLen, 0]}>
            <sphereGeometry args={[def.thickness * 1.6, 6, 6]} />
            <meshStandardMaterial
              color="#285c10" emissive="#1a3a08"
              emissiveIntensity={0.10} roughness={0.65}
            />
          </mesh>
        </group>
      ))}

      {/* Glowing tip — stage-colored bud at branch end */}
      <mesh position={[0, def.length, 0]}>
        <sphereGeometry args={[def.thickness * 2.8, 8, 8]} />
        <meshStandardMaterial
          color={colors.glow} emissive={colors.accent}
          emissiveIntensity={0.38}
          transparent opacity={0.92} roughness={0.12}
        />
      </mesh>

      {/* Leaf cluster at tip for plant-like look */}
      <group position={[0, def.length * 0.82, 0]}>
        <LeafCluster color={colors.glow} accent={colors.accent} stage={stage} />
      </group>

      {/* Child branches */}
      {stage >= 10 && Array.from({ length: def.childCount }, (_, ci) => (
        <ChildBranch key={ci} index={ci} parentLen={def.length}
          colors={colors} hydration={hydration} stage={stage} phase={def.phase + ci * 1.3} />
      ))}
    </group>
  );
}

function ChildBranch({ index, parentLen, colors, hydration, stage, phase }: {
  index: number; parentLen: number;
  colors: { core: string; glow: string; accent: string };
  hydration: number; stage: number; phase: number;
}) {
  const ref     = useRef<THREE.Group>(null);
  const attachY = parentLen * (0.30 + index * 0.20);
  const angle   = index * 2.4 + phase;
  const tilt    = 0.22 + (index % 3) * 0.18;
  const len     = 0.22 + (index % 4) * 0.12;
  // Child branches always green — stage color only on bud tips
  const branchCol = "#1e5c0e";

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.7 + phase) * 0.065;
  });

  return (
    <group ref={ref} position={[0, attachY, 0]} rotation={[tilt, angle, 0]}>
      <mesh position={[0, len / 2, 0]}>
        <cylinderGeometry args={[0.004, 0.009, len, 5]} />
        <meshStandardMaterial color={branchCol} emissive="#0e2a06"
          emissiveIntensity={0.08} roughness={0.85} />
      </mesh>
      {/* Leaf bud — stage color for visual interest, low emissive */}
      <mesh position={[0, len, 0]}>
        <sphereGeometry args={[0.019, 6, 6]} />
        <meshStandardMaterial color={colors.glow} emissive={colors.accent}
          emissiveIntensity={0.30} transparent opacity={0.88} />
      </mesh>
    </group>
  );
}

export function BranchSystem({ stage, growth, hydration, decay }: Props) {
  const branches = useBranchDefs(stage, growth);
  const colors   = STAGE_COLORS[Math.min(Math.max(stage, 1), 100)] ?? STAGE_COLORS[1]!;

  if (stage < 1) return null;

  return (
    <group>
      {branches.map((def) => (
        <Branch key={def.id} def={def} colors={colors}
          hydration={hydration} decay={decay} stage={stage} growth={growth} />
      ))}
    </group>
  );
}
