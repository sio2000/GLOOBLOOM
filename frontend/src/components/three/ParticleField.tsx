"use client";

import { useRef, useMemo } from "react";
import { useAdaptiveFrame } from "@/hooks/useAdaptiveFrame";
import * as THREE from "three";
import { SPORE_VERT, SPORE_FRAG } from "./shaders";
import { getStageColor } from "@/types/organism";
import { usePerformanceStore } from "@/store/usePerformanceStore";
import { scaledCount } from "@/lib/performance";
import { useThrottledFrame } from "@/hooks/useThrottledFrame";

interface Props {
  stage: number;
  hydration: number;
  season: string;
  growth: number;
}

const BASE_SPORE_COUNT = 250;

export function ParticleField({ stage, hydration, season, growth }: Props) {
  const colors = getStageColor(stage);
  const sporeMultiplier = usePerformanceStore((s) => s.settings().sporeMultiplier);
  const seasonMultiplier = usePerformanceStore((s) => s.settings().seasonParticleMultiplier);

  // ── Spore uniforms ──────────────────────────────────────
  const sporeUniforms = useMemo(() => ({
    uTime:  { value: 0 },
    uColor: { value: new THREE.Color(colors.accent) },
  }), [colors.accent]);

  const sporeGeo = useMemo(() => {
    const raw = BASE_SPORE_COUNT + stage * 20 + (stage >= 50 ? (stage - 50) * 35 : 0);
    const count = scaledCount(raw, sporeMultiplier);
    const geo   = new THREE.BufferGeometry();
    const pos   = new Float32Array(count * 3);
    const vel   = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    const sizes = new Float32Array(count);
    const growthScale = 1 + growth * 0.008;

    for (let i = 0; i < count; i++) {
      const r     = (Math.random() * 2.0 + 0.4) * growthScale;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.random() * Math.PI;
      pos[i * 3]     = Math.sin(phi) * Math.cos(theta) * r;
      pos[i * 3 + 1] = Math.cos(phi) * r - 0.3;
      pos[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;
      vel[i * 3]     = (Math.random() - 0.5) * 0.35;
      vel[i * 3 + 1] = 0.25 + Math.random() * 0.5;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.35;
      phase[i]       = Math.random();
      sizes[i]       = 2.5 + Math.random() * 7;
    }

    geo.setAttribute("position",  new THREE.BufferAttribute(pos,   3));
    geo.setAttribute("aVelocity", new THREE.BufferAttribute(vel,   3));
    geo.setAttribute("aPhase",    new THREE.BufferAttribute(phase, 1));
    geo.setAttribute("aSize",     new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, [stage, Math.floor(growth / 18), sporeMultiplier]);

  useAdaptiveFrame(({ clock }) => {
    sporeUniforms.uTime.value = clock.elapsedTime;
    (sporeUniforms.uColor.value as THREE.Color).lerp(new THREE.Color(colors.accent), 0.02);
  });

  return (
    <group>
      <points geometry={sporeGeo}>
        <shaderMaterial
          vertexShader={SPORE_VERT}
          fragmentShader={SPORE_FRAG}
          uniforms={sporeUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.5 + (hydration / 100) * 0.4}
        />
      </points>

      {/* Ambient floating dust */}
      <DustMotes stage={stage} colors={colors} />

      {/* Pollen orbs — visible but not blinding */}
      {stage >= 4 && <PollenOrbs stage={stage} hydration={hydration} colors={colors} />}

      {/* Season effects */}
      {season === "neon_rain" && <NeonRain colors={colors} multiplier={seasonMultiplier} />}
      {season === "mist" && <MistParticles multiplier={seasonMultiplier} />}
    </group>
  );
}

// ─────────────────────────────────────────────────────────
// Ambient dust — tiny slow-drifting motes
// ─────────────────────────────────────────────────────────
function DustMotes({
  stage, colors,
}: { stage: number; colors: { glow: string } }) {
  const ref   = useRef<THREE.Points>(null);
  const dustMultiplier = usePerformanceStore((s) => s.settings().dustMultiplier);
  const count = scaledCount(50 + stage * 12, dustMultiplier);

  const geo = useMemo(() => {
    const g   = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 7;
      pos[i * 3 + 1] = Math.random() * 4 - 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 7;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);

  useThrottledFrame(({ clock }) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position;
    const t   = clock.elapsedTime;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, ((pos.getY(i) + 0.002) % 4) - 0.5);
      pos.setX(i, pos.getX(i) + Math.sin(t * 0.25 + i * 0.5) * 0.0008);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        color={colors.glow}
        size={0.012}
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─────────────────────────────────────────────────────────
// Pollen orbs — small glowing spheres orbiting the organism
// Emissive kept LOW — these should twinkle, not blind
// ─────────────────────────────────────────────────────────
function PollenOrbs({
  stage, hydration, colors,
}: { stage: number; hydration: number; colors: { glow: string; accent: string } }) {
  const orbs = useMemo(() => {
    const cnt = Math.min(6 + (stage - 3) * 4, 26);
    return Array.from({ length: cnt }, (_, i) => {
      const angle = (i / cnt) * Math.PI * 2;
      const r     = 0.75 + Math.random() * 1.6;
      return {
        id:    i,
        init:  new THREE.Vector3(Math.cos(angle) * r, 0.4 + Math.random() * 1.6, Math.sin(angle) * r),
        speed: 0.25 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
        col:   i % 2 === 0 ? colors.glow : colors.accent,
      };
    });
  }, [stage]);

  return (
    <group>
      {orbs.map((o) => (
        <PollenOrb key={o.id} init={o.init} speed={o.speed} phase={o.phase} col={o.col} />
      ))}
    </group>
  );
}

function PollenOrb({
  init, speed, phase, col,
}: { init: THREE.Vector3; speed: number; phase: number; col: string }) {
  const ref = useRef<THREE.Mesh>(null);

  useThrottledFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * speed + phase;
    ref.current.position.x = init.x + Math.sin(t * 0.65) * 0.28;
    ref.current.position.y = init.y + Math.sin(t * 0.5 + 1.2) * 0.22;
    ref.current.position.z = init.z + Math.cos(t * 0.55) * 0.28;
    ref.current.scale.setScalar(0.85 + Math.sin(t * 2.2) * 0.12);
  });

  return (
    <mesh ref={ref} position={init}>
      <sphereGeometry args={[0.016, 6, 6]} />
      <meshStandardMaterial
        color={col}
        emissive={col}
        emissiveIntensity={0.9}     // ↓ from 2.0 — visible but not blinding
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────
// Neon Rain — falling streaks for neon_rain season
// ─────────────────────────────────────────────────────────
function NeonRain({ colors, multiplier }: { colors: { accent: string }; multiplier: number }) {
  const ref   = useRef<THREE.Points>(null);
  const count = scaledCount(160, multiplier);

  const { geo, vel } = useMemo(() => {
    const g   = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const v   = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 9;
      pos[i * 3 + 1] = Math.random() * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 9;
      v[i]           = 0.018 + Math.random() * 0.035;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geo: g, vel: v };
  }, [count]);

  useThrottledFrame(() => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) - vel[i];
      pos.setY(i, y < -1 ? 5.5 : y);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        color={colors.accent}
        size={0.022}
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─────────────────────────────────────────────────────────
// Mist particles for mist season
// ─────────────────────────────────────────────────────────
function MistParticles({ multiplier }: { multiplier: number }) {
  const ref   = useRef<THREE.Points>(null);
  const count = scaledCount(80, multiplier);

  const geo = useMemo(() => {
    const g   = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = Math.random() * 3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [count]);

  useThrottledFrame(({ clock }) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position;
    const t   = clock.elapsedTime;
    for (let i = 0; i < pos.count; i++) {
      pos.setX(i, pos.getX(i) + Math.sin(t * 0.1 + i) * 0.001);
      pos.setZ(i, pos.getZ(i) + Math.cos(t * 0.08 + i) * 0.001);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        color="#8aaabb"
        size={0.12}
        transparent
        opacity={0.12}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
