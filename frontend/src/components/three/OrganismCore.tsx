"use client";

import { useRef, useMemo } from "react";
import { useAdaptiveFrame } from "@/hooks/useAdaptiveFrame";
import * as THREE from "three";
import { getStageColor } from "@/types/organism";
import { clampStage, extendedScaleMultiplier, getVisualStageForSizing } from "@/lib/stageConstants";
import { getTrunkMetrics } from "@/lib/plantScale";
import { ORGANISM_VERT, ORGANISM_FRAG } from "./shaders";

interface Props {
  hydration: number;
  growth: number;
  decay: number;
  stage: number;
}

function useTargetColors(stage: number) {
  return useMemo(() => {
    const c = getStageColor(stage);
    return {
      core: new THREE.Color(c.core),
      glow: new THREE.Color(c.glow),
      accent: new THREE.Color(c.accent),
    };
  }, [stage]);
}

function TrunkLeaf({
  heightPos,
  angle,
  trunkMetrics,
  stage,
}: {
  heightPos: number;
  angle: number;
  trunkMetrics: ReturnType<typeof getTrunkMetrics>;
  stage: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const phase = useMemo(() => angle * 2.1, [angle]);

  const attachY =
    trunkMetrics.trunkBaseY + heightPos * trunkMetrics.trunkHeight;
  const radius = THREE.MathUtils.lerp(
    trunkMetrics.trunkRadiusBottom,
    trunkMetrics.trunkRadiusTop,
    heightPos
  );

  useAdaptiveFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.7 + phase) * 0.12;
  });

  const leafGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.03, 0.02, 0.06, 0.05, 0.05, 0.10);
    shape.bezierCurveTo(0.03, 0.13, 0.01, 0.14, 0, 0.15);
    shape.bezierCurveTo(-0.01, 0.14, -0.03, 0.13, -0.05, 0.10);
    shape.bezierCurveTo(-0.06, 0.05, -0.03, 0.02, 0, 0);
    return new THREE.ShapeGeometry(shape, 8);
  }, []);

  return (
    <group
      ref={ref}
      position={[
        Math.cos(angle) * (radius + 0.02),
        attachY,
        Math.sin(angle) * (radius + 0.02),
      ]}
      rotation={[0.3, angle + Math.PI / 2, 0.15]}
    >
      <mesh geometry={leafGeo} scale={0.8 + (stage % 3) * 0.15}>
        <meshStandardMaterial
          color="#2d9220"
          emissive="#1a6010"
          emissiveIntensity={0.15}
          side={THREE.DoubleSide}
          roughness={0.65}
        />
      </mesh>
    </group>
  );
}

export function OrganismCore({ hydration, growth, decay, stage }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const trunkGrpRef = useRef<THREE.Group>(null);

  const colors = getStageColor(stage);
  const targets = useTargetColors(stage);
  const trunkMetrics = useMemo(
    () => getTrunkMetrics(stage, growth),
    [stage, Math.floor(growth / 5)]
  );

  const visualStage = getVisualStageForSizing(stage);
  const crownRadius =
    0.22 +
    visualStage * 0.004 +
    growth * 0.0015 +
    (visualStage >= 50 ? (visualStage - 50) * 0.005 : 0);

  const crownGeo = useMemo(() => {
    const detail = stage >= 50 ? 5 : stage >= 25 ? 4 : 3;
    return new THREE.IcosahedronGeometry(crownRadius, detail);
  }, [crownRadius, stage >= 50 ? 2 : stage >= 25 ? 1 : 0]);

  const innerGeo = useMemo(
    () => new THREE.IcosahedronGeometry(crownRadius * 0.55, 3),
    [crownRadius]
  );

  const trunkSegments = useMemo(() => {
    const count = visualStage >= 50
      ? Math.min(12 + Math.floor((visualStage - 50) / 4), 22)
      : Math.min(4 + Math.floor(visualStage / 6), 12);
    return Array.from({ length: count }, (_, i) => {
      const t0 = i / count;
      const t1 = (i + 1) / count;
      const y0 = trunkMetrics.trunkBaseY + t0 * trunkMetrics.trunkHeight;
      const y1 = trunkMetrics.trunkBaseY + t1 * trunkMetrics.trunkHeight;
      const segH = y1 - y0;
      const rBottom = THREE.MathUtils.lerp(
        trunkMetrics.trunkRadiusBottom,
        trunkMetrics.trunkRadiusTop,
        t0
      );
      const rTop = THREE.MathUtils.lerp(
        trunkMetrics.trunkRadiusBottom,
        trunkMetrics.trunkRadiusTop,
        t1
      );
      return { id: i, y: y0 + segH / 2, segH, rBottom, rTop };
    });
  }, [stage, trunkMetrics]);

  const trunkLeaves = useMemo(() => {
    if (stage < 2) return [];
    const count = visualStage >= 50
      ? Math.min(24 + Math.floor((visualStage - 50) / 2), 50)
      : Math.min(3 + Math.floor(visualStage / 4) + Math.floor(growth / 12), 24);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      heightPos: 0.08 + Math.random() * 0.88,
      angle: (i / count) * Math.PI * 2 + (i % 5) * 0.55,
    }));
  }, [stage, Math.floor(growth / 12)]);

  const uniforms = useMemo<Record<string, THREE.IUniform>>(
    () => ({
      uTime: { value: 0 },
      uHydration: { value: hydration },
      uGrowth: { value: growth },
      uDecay: { value: decay },
      uStage: { value: stage },
      uColorCore: { value: new THREE.Color(colors.core) },
      uColorGlow: { value: new THREE.Color(colors.glow) },
      uColorAccent: { value: new THREE.Color(colors.accent) },
    }),
    []
  );

  const crownY = trunkMetrics.trunkTopY + crownRadius * 0.35;
  const rootY = trunkMetrics.trunkBaseY - 0.08;

  useAdaptiveFrame((_, delta) => {
    if (matRef.current) {
      const u = matRef.current.uniforms;
      u.uTime.value += delta;
      u.uHydration.value = THREE.MathUtils.lerp(u.uHydration.value, hydration, delta * 1.2);
      u.uGrowth.value = THREE.MathUtils.lerp(u.uGrowth.value, growth, delta * 0.4);
      u.uDecay.value = THREE.MathUtils.lerp(u.uDecay.value, decay, delta * 0.6);
      u.uStage.value = stage;
      (u.uColorCore.value as THREE.Color).lerp(targets.core, delta * 0.6);
      (u.uColorGlow.value as THREE.Color).lerp(targets.glow, delta * 0.6);
      (u.uColorAccent.value as THREE.Color).lerp(targets.accent, delta * 0.6);
    }

    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.03;
      meshRef.current.position.y = crownY + Math.sin((matRef.current?.uniforms.uTime.value ?? 0) * 0.75) * 0.025;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * 0.05;
    }
  });

  const barkColor = decay > 35 ? "#4a3820" : "#3d7234";
  const barkEmissive = 0.12 + (hydration / 100) * 0.22;

  return (
    <group>
      {/* Root bulb */}
      <mesh position={[0, rootY, 0]} castShadow receiveShadow>
        <sphereGeometry args={[trunkMetrics.trunkRadiusBottom * 1.8, 10, 10]} />
        <meshStandardMaterial color="#2a5524" emissive="#183818" emissiveIntensity={0.08} roughness={0.9} />
      </mesh>

      {/* Main trunk — grows tall with stage + growth */}
      <group ref={trunkGrpRef}>
        {trunkSegments.map((seg) => (
          <group key={seg.id}>
            <mesh position={[0, seg.y, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[seg.rTop, seg.rBottom, seg.segH, 10]} />
              <meshStandardMaterial
                color={barkColor}
                emissive="#1e4820"
                emissiveIntensity={barkEmissive}
                roughness={0.88}
                metalness={0.02}
              />
            </mesh>
            <mesh position={[0, seg.y + seg.segH * 0.42, 0]}>
              <torusGeometry args={[seg.rBottom * 1.15, 0.006, 6, 16]} />
              <meshStandardMaterial color="#2f7832" emissive="#184820" emissiveIntensity={0.06} roughness={0.9} />
            </mesh>
          </group>
        ))}

        {trunkLeaves.map((leaf) => (
          <TrunkLeaf
            key={leaf.id}
            heightPos={leaf.heightPos}
            angle={leaf.angle}
            trunkMetrics={trunkMetrics}
            stage={stage}
          />
        ))}
      </group>

      {/* Canopy crown at trunk top */}
      <mesh ref={meshRef} geometry={crownGeo} position={[0, crownY, 0]} castShadow receiveShadow>
        <shaderMaterial
          ref={matRef}
          vertexShader={ORGANISM_VERT}
          fragmentShader={ORGANISM_FRAG}
          uniforms={uniforms}
          transparent
          side={THREE.FrontSide}
          depthWrite
        />
      </mesh>

      <mesh ref={innerRef} geometry={innerGeo} position={[0, crownY, 0]}>
        <meshStandardMaterial
          color={colors.glow}
          emissive={new THREE.Color(colors.glow)}
          emissiveIntensity={0.14 + (hydration / 100) * 0.18}
          transparent
          opacity={0.28}
          roughness={0.2}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>

      {stage >= 30 && <CrystalSpikes stage={stage} colors={colors} growth={growth} crownY={crownY} />}
      {stage >= 50 && <BioluminescentVeins stage={stage} trunkMetrics={trunkMetrics} colors={colors} />}
      {stage >= 60 && <CosmicRings stage={stage} colors={colors} crownY={crownY} />}
    </group>
  );
}

function CrystalSpike({
  position,
  scale,
  color,
  emissive,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
  emissive: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useAdaptiveFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.scale.y = scale[1] * (Math.sin(clock.elapsedTime * 1.8 + phase) * 0.07 + 1);
    ref.current.rotation.y += 0.003;
  });

  return (
    <mesh ref={ref} position={position} scale={scale} castShadow>
      <coneGeometry args={[0.03, 0.55, 6]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={0.35}
        transparent
        opacity={0.9}
        roughness={0.12}
        metalness={0.3}
      />
    </mesh>
  );
}

function CrystalSpikes({
  stage,
  colors,
  growth,
  crownY,
}: {
  stage: number;
  colors: { core: string; glow: string; accent: string };
  growth: number;
  crownY: number;
}) {
  const spikes = useMemo(() => {
    const count = Math.min(8 + Math.floor((stage - 30) * 0.8), stage >= 50 ? 45 : 28);
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + i * 0.28;
      const radius = 0.35 + (i % 3) * 0.12;
      return {
        id: i,
        pos: [Math.cos(angle) * radius, crownY + 0.2 + (i % 4) * 0.15, Math.sin(angle) * radius] as [
          number,
          number,
          number,
        ],
        sca: [0.75 + (i % 3) * 0.2, 0.85 + (i % 4) * 0.25, 0.75 + (i % 3) * 0.2] as [
          number,
          number,
          number,
        ],
      };
    });
  }, [stage >= 50 ? 2 : stage >= 30 ? 1 : 0, Math.floor(growth / 25), crownY]);

  return (
    <group>
      {spikes.map((s) => (
        <CrystalSpike key={s.id} position={s.pos} scale={s.sca} color={colors.glow} emissive={colors.accent} />
      ))}
    </group>
  );
}

function BioluminescentVeins({
  stage,
  trunkMetrics,
  colors,
}: {
  stage: number;
  trunkMetrics: ReturnType<typeof getTrunkMetrics>;
  colors: { glow: string; accent: string };
}) {
  const veins = useMemo(() => {
    const count = Math.min(6 + Math.floor((stage - 50) / 5), 16);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      heightPos: 0.1 + (i / count) * 0.85,
      angle: (i / count) * Math.PI * 2 + i * 0.8,
    }));
  }, [stage]);

  return (
    <group>
      {veins.map((v) => {
        const y = trunkMetrics.trunkBaseY + v.heightPos * trunkMetrics.trunkHeight;
        const r = THREE.MathUtils.lerp(
          trunkMetrics.trunkRadiusBottom,
          trunkMetrics.trunkRadiusTop,
          v.heightPos
        );
        return (
          <mesh
            key={v.id}
            position={[Math.cos(v.angle) * r * 1.02, y, Math.sin(v.angle) * r * 1.02]}
            rotation={[0, v.angle, Math.PI / 2]}
          >
            <torusGeometry args={[r * 0.9, 0.004, 6, 20]} />
            <meshStandardMaterial
              color={colors.accent}
              emissive={colors.glow}
              emissiveIntensity={0.55}
              transparent
              opacity={0.75}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function CosmicRings({
  stage,
  colors,
  crownY,
}: {
  stage: number;
  colors: { glow: string; accent: string };
  crownY: number;
}) {
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  const r3 = useRef<THREE.Mesh>(null);
  const scale = 1.0 + (stage - 60) * 0.015;

  useAdaptiveFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (r1.current) {
      r1.current.rotation.z = t * 0.18;
      r1.current.rotation.x = Math.sin(t * 0.12) * 0.3;
    }
    if (r2.current) r2.current.rotation.y = t * 0.22;
    if (r3.current) r3.current.rotation.x = -t * 0.15;
  });

  return (
    <group position={[0, crownY, 0]} scale={scale}>
      <mesh ref={r1}>
        <torusGeometry args={[1.4, 0.016, 10, 80]} />
        <meshStandardMaterial color={colors.glow} emissive={colors.accent} emissiveIntensity={0.3} transparent opacity={0.42} depthWrite={false} />
      </mesh>
      <mesh ref={r2} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1.6, 0.012, 8, 80]} />
        <meshStandardMaterial color={colors.accent} emissive={colors.accent} emissiveIntensity={0.3} transparent opacity={0.42} depthWrite={false} />
      </mesh>
      <mesh ref={r3} rotation={[-Math.PI / 4, Math.PI / 6, 0]}>
        <torusGeometry args={[1.2, 0.009, 8, 60]} />
        <meshStandardMaterial color={colors.glow} emissive={colors.accent} emissiveIntensity={0.3} transparent opacity={0.42} depthWrite={false} />
      </mesh>
    </group>
  );
}
