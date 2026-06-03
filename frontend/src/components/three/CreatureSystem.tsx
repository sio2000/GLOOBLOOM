"use client";

import { useRef, useMemo } from "react";
import { useCreatureFrame } from "@/hooks/useCreatureFrame";
import * as THREE from "three";
import { getStageColor } from "@/types/organism";
import { clampStage, extendedScaleMultiplier } from "@/lib/stageConstants";
import { getPlantWorldBounds } from "@/lib/plantScale";
import { createFlightProfile, sampleFlight } from "@/lib/insectFlight";
import {
  applyPlantAvoidance,
  buildPlantFlightBounds,
  type PlantFlightBounds,
} from "@/lib/plantFlightAvoidance";

interface Props {
  stage: number;
  hydration: number;
  activeCreatures: { id: string; type: string; spawnedAt: number }[];
  heightScale: number;
  growth: number;
}

// ─────────────────────────────────────────────────────────
// FIREFLY — stage 3+
// ─────────────────────────────────────────────────────────
function Firefly({ seed, color, plantHeight, centerY, stage, growth }: { seed: number; color: string; plantHeight: number; centerY: number; stage: number; growth: number }) {
  const ref   = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const phase = seed * 6.28;
  const spd   = 0.28 + (seed % 7) * 0.05;
  const flight = useMemo(
    () => createFlightProfile(seed, plantHeight, centerY, spd, "drift", 0.48, stage, growth),
    [seed, plantHeight, centerY, spd, stage, growth]
  );

  useCreatureFrame(({ clock }) => {
    if (!ref.current || !matRef.current) return;
    const { pos } = sampleFlight(flight, clock);
    ref.current.position.copy(pos);
    const t = clock.elapsedTime * spd + phase;
    // Blink: bright but NOT above bloom threshold (< 0.92)
    matRef.current.emissiveIntensity = Math.sin(t * 3.5 + phase) > 0.1 ? 0.70 : 0.06;
  });

  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[0.016, 6, 6]} />
      <meshStandardMaterial ref={matRef} color={color} emissive={color}
        emissiveIntensity={0.65} transparent opacity={0.95} />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────
// DRAGONFLY — stage 10+  (thin elongated wings, darting)
// ─────────────────────────────────────────────────────────
const DRAGONFLY_WING = new THREE.PlaneGeometry(0.16, 0.045, 2, 2);
const DRAGONFLY_BODY = new THREE.CapsuleGeometry(0.006, 0.10, 4, 6);

function Dragonfly({ seed, color, plantHeight, centerY, stage, growth }: { seed: number; color: string; plantHeight: number; centerY: number; stage: number; growth: number }) {
  const grp  = useRef<THREE.Group>(null);
  const w1   = useRef<THREE.Mesh>(null);
  const w2   = useRef<THREE.Mesh>(null);
  const w3   = useRef<THREE.Mesh>(null);
  const w4   = useRef<THREE.Mesh>(null);
  const phase = seed * 2.7;
  const spd   = 0.48 + (seed % 5) * 0.1;
  const flight = useMemo(
    () => createFlightProfile(seed, plantHeight, centerY, spd, "zigzag", 0.55, stage, growth),
    [seed, plantHeight, centerY, spd, stage, growth]
  );

  useCreatureFrame(({ clock }) => {
    if (!grp.current) return;
    const { pos, yaw } = sampleFlight(flight, clock);
    const flap = Math.sin(clock.elapsedTime * 11 + phase) * 0.7;
    grp.current.position.copy(pos);
    grp.current.rotation.y = yaw;
    [w1, w2, w3, w4].forEach((w, i) => {
      if (w.current) w.current.rotation.y = (i < 2 ? 1 : -1) * flap * (i % 2 === 0 ? 1 : 0.8);
    });
  });

  return (
    <group ref={grp}>
      {/* Front wing pair */}
      <mesh ref={w1} geometry={DRAGONFLY_WING} position={[0.09, 0, -0.02]} rotation={[-0.1, 0, 0.05]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3}
          side={THREE.DoubleSide} transparent opacity={0.60} roughness={0.1} />
      </mesh>
      <mesh ref={w2} geometry={DRAGONFLY_WING} position={[-0.09, 0, -0.02]} scale={[-1,1,1]} rotation={[-0.1, 0, -0.05]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3}
          side={THREE.DoubleSide} transparent opacity={0.60} roughness={0.1} />
      </mesh>
      {/* Rear wing pair — slightly offset */}
      <mesh ref={w3} geometry={DRAGONFLY_WING} position={[0.085, 0, 0.03]} rotation={[0.08, 0, 0.03]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25}
          side={THREE.DoubleSide} transparent opacity={0.50} roughness={0.12} />
      </mesh>
      <mesh ref={w4} geometry={DRAGONFLY_WING} position={[-0.085, 0, 0.03]} scale={[-1,1,1]} rotation={[0.08, 0, -0.03]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25}
          side={THREE.DoubleSide} transparent opacity={0.50} roughness={0.12} />
      </mesh>
      {/* Body */}
      <mesh geometry={DRAGONFLY_BODY} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#0a1a05" roughness={0.85} />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.015, 0.008, -0.06]}>
        <sphereGeometry args={[0.006, 5, 5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[-0.015, 0.008, -0.06]}>
        <sphereGeometry args={[0.006, 5, 5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────
// BUTTERFLY — stage 18+
// ─────────────────────────────────────────────────────────
const WING_GEO = new THREE.PlaneGeometry(0.14, 0.10, 3, 3);

function Butterfly({ seed, color, accent, plantHeight, centerY, stage, growth }: { seed: number; color: string; accent: string; plantHeight: number; centerY: number; stage: number; growth: number }) {
  const grp  = useRef<THREE.Group>(null);
  const wL   = useRef<THREE.Mesh>(null);
  const wR   = useRef<THREE.Mesh>(null);
  const phase = seed * 2.1;
  const spd   = 0.36 + (seed % 5) * 0.05;
  const flight = useMemo(
    () => createFlightProfile(seed, plantHeight, centerY, spd, "lissajous", 0.5, stage, growth),
    [seed, plantHeight, centerY, spd, stage, growth]
  );

  useCreatureFrame(({ clock }) => {
    if (!grp.current) return;
    const { pos, yaw } = sampleFlight(flight, clock);
    const flap = Math.sin(clock.elapsedTime * 4.5 + phase) * 0.65;
    grp.current.position.copy(pos);
    grp.current.rotation.y = yaw + Math.PI / 2;
    if (wL.current) wL.current.rotation.y = flap;
    if (wR.current) wR.current.rotation.y = -flap;
  });

  return (
    <group ref={grp}>
      <mesh ref={wL} geometry={WING_GEO} position={[0.075, 0, 0]}>
        <meshStandardMaterial color={color} emissive={accent} emissiveIntensity={0.35}
          side={THREE.DoubleSide} transparent opacity={0.85} roughness={0.2} />
      </mesh>
      <mesh ref={wR} geometry={WING_GEO} position={[-0.075, 0, 0]} scale={[-1,1,1]}>
        <meshStandardMaterial color={color} emissive={accent} emissiveIntensity={0.35}
          side={THREE.DoubleSide} transparent opacity={0.85} roughness={0.2} />
      </mesh>
      <mesh>
        <capsuleGeometry args={[0.007, 0.055, 4, 8]} />
        <meshStandardMaterial color="#101008" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────
// DREAM MOTH — stage 28+
// ─────────────────────────────────────────────────────────
function DreamMoth({ seed, color, plantHeight, centerY, stage, growth }: { seed: number; color: string; plantHeight: number; centerY: number; stage: number; growth: number }) {
  const grp   = useRef<THREE.Group>(null);
  const wL    = useRef<THREE.Mesh>(null);
  const wR    = useRef<THREE.Mesh>(null);
  const phase = seed * 3.1;
  const spd   = 0.32 + (seed % 4) * 0.06;
  const flight = useMemo(
    () => createFlightProfile(seed, plantHeight, centerY, spd, "wave", 0.58, stage, growth),
    [seed, plantHeight, centerY, spd, stage, growth]
  );

  const wingGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.20, 0.13, 4, 4);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.abs(p.getX(i) / 0.2) * 0.05);
    p.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, []);

  useCreatureFrame(({ clock }) => {
    if (!grp.current) return;
    const { pos, yaw } = sampleFlight(flight, clock);
    const flap = Math.sin(clock.elapsedTime * 4.5 + phase) * 0.55;
    grp.current.position.copy(pos);
    grp.current.rotation.y = yaw + Math.PI / 2;
    if (wL.current) wL.current.rotation.y = flap;
    if (wR.current) wR.current.rotation.y = -flap;
  });

  return (
    <group ref={grp}>
      <mesh ref={wL} geometry={wingGeo} position={[0.11, 0, 0]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.28}
          side={THREE.DoubleSide} transparent opacity={0.70} roughness={0.35} />
      </mesh>
      <mesh ref={wR} geometry={wingGeo} position={[-0.11, 0, 0]} scale={[-1,1,1]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.28}
          side={THREE.DoubleSide} transparent opacity={0.70} roughness={0.35} />
      </mesh>
      <mesh>
        <capsuleGeometry args={[0.010, 0.07, 4, 8]} />
        <meshStandardMaterial color="#0d0d10" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────
// WILL-O-WISP — stage 30+  (drifting luminous orbs)
// ─────────────────────────────────────────────────────────
function WillOWisp({ seed, color, plantHeight, centerY, flightBounds }: { seed: number; color: string; plantHeight: number; centerY: number; flightBounds: PlantFlightBounds }) {
  const ref   = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const phase = seed * 4.2;
  const spd   = 0.18 + (seed % 5) * 0.04;
  const maxH  = plantHeight * (0.5 + (seed % 4) * 0.1);
  const r     = Math.max(1.8, 0.8 + (seed % 5) * 0.5 + plantHeight * 0.06);

  useCreatureFrame(({ clock }) => {
    if (!ref.current || !matRef.current) return;
    const t = clock.elapsedTime * spd + phase;
    ref.current.position.set(
      Math.sin(t * 0.6) * r + Math.sin(t * 1.8 + 1.2) * r * 0.4,
      centerY + 0.5 + ((clock.elapsedTime * spd * 0.3 + phase * 0.5) % maxH),
      Math.cos(t * 0.6) * r + Math.cos(t * 2.1) * r * 0.3,
    );
    applyPlantAvoidance(ref.current.position, flightBounds);
    // Pulse between bright and dim — never above 0.85
    matRef.current.emissiveIntensity = 0.50 + Math.sin(clock.elapsedTime * 2.2 + phase) * 0.28;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.055, 8, 8]} />
      <meshStandardMaterial ref={matRef} color={color} emissive={color}
        emissiveIntensity={0.55} transparent opacity={0.78} roughness={0.05} />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────
// JELLYFISH SPORE — stage 40+
// ─────────────────────────────────────────────────────────
function JellyfishSpore({ seed, color, plantHeight, centerY, flightBounds }: { seed: number; color: string; plantHeight: number; centerY: number; flightBounds: PlantFlightBounds }) {
  const grp   = useRef<THREE.Group>(null);
  const phase = seed * 2.7;
  const spd   = 0.24 + (seed % 5) * 0.04;
  const maxH  = plantHeight * (0.55 + (seed % 3) * 0.1);
  const startX = (seed % 7 - 3.5) * 1.2;
  const startZ = ((seed * 3) % 7 - 3.5) * 1.2;

  useCreatureFrame(({ clock }) => {
    if (!grp.current) return;
    const t = clock.elapsedTime * spd + phase;
    grp.current.position.x = startX + Math.sin(t * 0.7) * 0.85;
    grp.current.position.y = centerY + ((clock.elapsedTime * 0.07 * spd + phase * 0.5) % maxH) + 0.2;
    grp.current.position.z = startZ + Math.cos(t * 0.6) * 0.85;
    grp.current.rotation.y = clock.elapsedTime * 0.12;
    applyPlantAvoidance(grp.current.position, flightBounds);
  });

  return (
    <group ref={grp}>
      <mesh>
        <sphereGeometry args={[0.09, 9, 9, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5}
          transparent opacity={0.48} roughness={0.05} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.02, 0]}>
        <sphereGeometry args={[0.045, 7, 7]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.50}
          transparent opacity={0.38} roughness={0.1} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.04, -0.05, Math.sin(a) * 0.04]}>
            <capsuleGeometry args={[0.004, 0.09 + (i % 3) * 0.05, 3, 5]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4}
              transparent opacity={0.38} />
          </mesh>
        );
      })}
    </group>
  );
}

// ─────────────────────────────────────────────────────────
// UFO DISC — stage 45+  (futuristic orbiting craft)
// ─────────────────────────────────────────────────────────
function UFODisc({ seed, color, accent, plantHeight, centerY, flightBounds }: {
  seed: number; color: string; accent: string; plantHeight: number; centerY: number; flightBounds: PlantFlightBounds;
}) {
  const grp   = useRef<THREE.Group>(null);
  const domeRef = useRef<THREE.Mesh>(null);
  const phase = seed * 1.4;
  const spd   = 0.14 + (seed % 4) * 0.04;
  const r     = Math.max(3.5, 2.2 + seed * 0.6 + plantHeight * 0.12);
  const orbitH = centerY + plantHeight * (0.55 + seed * 0.05);

  useCreatureFrame(({ clock }) => {
    if (!grp.current) return;
    const t = clock.elapsedTime * spd + phase;
    grp.current.position.set(
      Math.cos(t) * r,
      orbitH + Math.sin(t * 0.3) * 0.8,
      Math.sin(t) * r,
    );
    applyPlantAvoidance(grp.current.position, flightBounds);
    grp.current.rotation.y = t + Math.PI / 2;
    if (domeRef.current) {
      // Dome pulses
      (domeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.4 + Math.sin(clock.elapsedTime * 2.5 + phase) * 0.2;
    }
  });

  return (
    <group ref={grp}>
      {/* Main disc */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.20, 0.055, 8, 28]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35}
          roughness={0.15} metalness={0.7} />
      </mesh>
      {/* Disc flat body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.14, 0.04, 20]} />
        <meshStandardMaterial color={color} roughness={0.1} metalness={0.85}
          emissive={accent} emissiveIntensity={0.2} />
      </mesh>
      {/* Dome on top */}
      <mesh ref={domeRef} position={[0, 0.06, 0]}>
        <sphereGeometry args={[0.09, 10, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.45}
          transparent opacity={0.65} roughness={0.05} side={THREE.DoubleSide} />
      </mesh>
      {/* LED lights underneath */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.15, -0.03, Math.sin(a) * 0.15]}>
            <sphereGeometry args={[0.010, 4, 4]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.65} />
          </mesh>
        );
      })}
    </group>
  );
}

// ─────────────────────────────────────────────────────────
// COSMIC BIRD — stage 55+
// ─────────────────────────────────────────────────────────
function CosmicBird({ seed, color, plantHeight, centerY, flightBounds }: { seed: number; color: string; plantHeight: number; centerY: number; flightBounds: PlantFlightBounds }) {
  const grp   = useRef<THREE.Group>(null);
  const wL    = useRef<THREE.Mesh>(null);
  const wR    = useRef<THREE.Mesh>(null);
  const phase = seed * 1.9;
  const spd   = 0.2 + (seed % 3) * 0.05;
  const r     = Math.max(4, 2.8 + seed * 0.4 + plantHeight * 0.14);
  const orbitH = centerY + plantHeight * (0.6 + seed * 0.04);

  const wingGeo = useMemo(() => new THREE.PlaneGeometry(0.32, 0.12, 5, 3), []);

  useCreatureFrame(({ clock }) => {
    if (!grp.current) return;
    const t    = clock.elapsedTime * spd + phase;
    const flap = Math.sin(clock.elapsedTime * 2.8 + phase) * 0.38;
    grp.current.position.set(
      Math.cos(t) * r, orbitH + Math.sin(t * 0.3) * 0.8, Math.sin(t) * r,
    );
    applyPlantAvoidance(grp.current.position, flightBounds);
    grp.current.rotation.y = t + Math.PI / 2;
    if (wL.current) { wL.current.rotation.y = flap;  wL.current.rotation.z = -flap * 0.2; }
    if (wR.current) { wR.current.rotation.y = -flap; wR.current.rotation.z = flap * 0.2; }
  });

  return (
    <group ref={grp}>
      <mesh ref={wL} geometry={wingGeo} position={[0.18, 0, 0]} rotation={[0.1, 0, 0.05]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2}
          side={THREE.DoubleSide} transparent opacity={0.78} roughness={0.25} />
      </mesh>
      <mesh ref={wR} geometry={wingGeo} position={[-0.18, 0, 0]} scale={[-1,1,1]} rotation={[0.1, 0, -0.05]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2}
          side={THREE.DoubleSide} transparent opacity={0.78} roughness={0.25} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.018, 0.12, 5, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} roughness={0.4} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────
// PLASMA RING — stage 70+  (spinning energy ring)
// ─────────────────────────────────────────────────────────
function PlasmaRing({ seed, color, accent, plantHeight, centerY, flightBounds }: {
  seed: number; color: string; accent: string; plantHeight: number; centerY: number; flightBounds: PlantFlightBounds;
}) {
  const ref   = useRef<THREE.Mesh>(null);
  const phase = seed * 3.0;
  const r     = Math.max(3.2, 1.8 + seed * 0.5 + plantHeight * 0.1);
  const orbitH = centerY + plantHeight * (0.65 + seed * 0.04);

  useCreatureFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * 0.24 + phase;
    ref.current.position.set(Math.cos(t) * r, orbitH, Math.sin(t) * r);
    applyPlantAvoidance(ref.current.position, flightBounds);
    ref.current.rotation.x += 0.025;
    ref.current.rotation.y += 0.015;
    (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
      0.35 + Math.sin(clock.elapsedTime * 3 + phase) * 0.22;
  });

  return (
    <mesh ref={ref}>
      <torusGeometry args={[0.18, 0.020, 8, 40]} />
      <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.40}
        transparent opacity={0.72} roughness={0.05} />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────
// GIANT SCARAB BEETLE — stage 50+  (large, unmistakable)
// ─────────────────────────────────────────────────────────
function GiantScarabBeetle({ seed, plantHeight, centerY, flightBounds }: {
  seed: number; plantHeight: number; centerY: number; flightBounds: PlantFlightBounds;
}) {
  const grp = useRef<THREE.Group>(null);
  const wingL = useRef<THREE.Mesh>(null);
  const wingR = useRef<THREE.Mesh>(null);
  const phase = seed * 1.6;
  const spd = 0.28 + seed * 0.04;
  const r = Math.max(5, 4 + seed * 1.5 + plantHeight * 0.14);
  const scale = 1.3 + (seed % 3) * 0.4;
  const bodyCol = "#1a5020";
  const shellCol = "#2a7840";

  useCreatureFrame(({ clock }) => {
    if (!grp.current) return;
    const t = clock.elapsedTime * spd + phase;
    const flap = Math.sin(clock.elapsedTime * 5 + phase) * 0.5;
    grp.current.position.set(
      Math.cos(t) * r,
      centerY + plantHeight * (0.25 + Math.abs(Math.sin(t * 0.35)) * 0.55),
      Math.sin(t) * r
    );
    applyPlantAvoidance(grp.current.position, flightBounds);
    grp.current.rotation.y = t + Math.PI / 2;
    if (wingL.current) wingL.current.rotation.z = flap;
    if (wingR.current) wingR.current.rotation.z = -flap;
  });

  return (
    <group ref={grp} scale={scale}>
      {/* Elytra shell */}
      <mesh position={[0, 0, 0]} castShadow scale={[1.3, 0.65, 1.1]}>
        <sphereGeometry args={[0.18, 14, 14]} />
        <meshStandardMaterial color={shellCol} emissive="#0a3010" emissiveIntensity={0.15} roughness={0.35} metalness={0.45} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.02, -0.22]} castShadow>
        <sphereGeometry args={[0.09, 10, 10]} />
        <meshStandardMaterial color={bodyCol} roughness={0.6} />
      </mesh>
      {/* Mandibles */}
      <mesh position={[0.05, -0.02, -0.3]} rotation={[0.5, 0.3, 0]}>
        <coneGeometry args={[0.025, 0.08, 5]} />
        <meshStandardMaterial color="#102008" roughness={0.8} />
      </mesh>
      <mesh position={[-0.05, -0.02, -0.3]} rotation={[0.5, -0.3, 0]}>
        <coneGeometry args={[0.025, 0.08, 5]} />
        <meshStandardMaterial color="#102008" roughness={0.8} />
      </mesh>
      {/* Antennae */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.04, 0.06, -0.28]} rotation={[0.8, side * 0.4, 0]}>
          <capsuleGeometry args={[0.008, 0.14, 3, 5]} />
          <meshStandardMaterial color="#1a4018" />
        </mesh>
      ))}
      {/* Wings */}
      <mesh ref={wingL} position={[0.28, 0.05, 0]} rotation={[0, 0, 0.2]}>
        <planeGeometry args={[0.45, 0.32]} />
        <meshStandardMaterial color="#88ccff" emissive="#4488aa" emissiveIntensity={0.2}
          side={THREE.DoubleSide} transparent opacity={0.55} roughness={0.1} />
      </mesh>
      <mesh ref={wingR} position={[-0.28, 0.05, 0]} rotation={[0, 0, -0.2]} scale={[-1, 1, 1]}>
        <planeGeometry args={[0.45, 0.32]} />
        <meshStandardMaterial color="#88ccff" emissive="#4488aa" emissiveIntensity={0.2}
          side={THREE.DoubleSide} transparent opacity={0.55} roughness={0.1} />
      </mesh>
      {/* Six legs */}
      {[[0.12, -0.05, 0.1], [-0.12, -0.05, 0.1], [0.14, -0.06, 0], [-0.14, -0.06, 0], [0.12, -0.05, -0.1], [-0.12, -0.05, -0.1]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[0.6, 0, p[0] > 0 ? 0.4 : -0.4]}>
          <capsuleGeometry args={[0.012, 0.14, 3, 5]} />
          <meshStandardMaterial color={bodyCol} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────
// GIANT LUNA MOTH — stage 55+  (huge pale green wings + eyespots)
// ─────────────────────────────────────────────────────────
function GiantLunaMoth({ seed, plantHeight, centerY, flightBounds }: {
  seed: number; plantHeight: number; centerY: number; flightBounds: PlantFlightBounds;
}) {
  const grp = useRef<THREE.Group>(null);
  const wL = useRef<THREE.Mesh>(null);
  const wR = useRef<THREE.Mesh>(null);
  const phase = seed * 2.2;
  const spd = 0.24 + seed * 0.03;
  const r = Math.max(6, 5 + seed * 1.2 + plantHeight * 0.14);
  const scale = 1.6 + (seed % 2) * 0.5;

  const wingGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.55, 0.42, 6, 6);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.abs(p.getX(i) / 0.55) * 0.06);
    p.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, []);

  useCreatureFrame(({ clock }) => {
    if (!grp.current) return;
    const t = clock.elapsedTime * spd + phase;
    const flap = Math.sin(clock.elapsedTime * 3.5 + phase) * 0.45;
    grp.current.position.set(
      Math.cos(t * 0.6) * r,
      centerY + plantHeight * (0.4 + Math.abs(Math.sin(t * 0.3)) * 0.45),
      Math.sin(t * 0.6) * r
    );
    applyPlantAvoidance(grp.current.position, flightBounds);
    grp.current.rotation.y = t * 0.6;
    if (wL.current) wL.current.rotation.y = flap;
    if (wR.current) wR.current.rotation.y = -flap;
  });

  return (
    <group ref={grp} scale={scale}>
      <mesh ref={wL} geometry={wingGeo} position={[0.32, 0, 0]}>
        <meshStandardMaterial color="#c8f0b0" emissive="#80c060" emissiveIntensity={0.25}
          side={THREE.DoubleSide} transparent opacity={0.88} roughness={0.3} />
      </mesh>
      <mesh ref={wR} geometry={wingGeo} position={[-0.32, 0, 0]} scale={[-1, 1, 1]}>
        <meshStandardMaterial color="#c8f0b0" emissive="#80c060" emissiveIntensity={0.25}
          side={THREE.DoubleSide} transparent opacity={0.88} roughness={0.3} />
      </mesh>
      {/* Eyespots */}
      {[[0.22, 0.08], [-0.22, 0.08], [0.18, -0.1], [-0.18, -0.1]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.02]}>
          <circleGeometry args={[0.045, 12]} />
          <meshStandardMaterial color="#8040a0" emissive="#c060ff" emissiveIntensity={0.4} />
        </mesh>
      ))}
      <mesh>
        <capsuleGeometry args={[0.025, 0.18, 5, 8]} />
        <meshStandardMaterial color="#506040" roughness={0.85} />
      </mesh>
      {/* Fuzzy antennae */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.03, 0.1, -0.06]} rotation={[0.5, side * 0.2, 0]}>
          <capsuleGeometry args={[0.006, 0.28, 3, 5]} />
          <meshStandardMaterial color="#809060" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────
// GIANT HORNET — stage 62+  (yellow-black, unmistakable)
// ─────────────────────────────────────────────────────────
function GiantHornet({ seed, plantHeight, centerY, flightBounds }: {
  seed: number; plantHeight: number; centerY: number; flightBounds: PlantFlightBounds;
}) {
  const grp = useRef<THREE.Group>(null);
  const wL = useRef<THREE.Mesh>(null);
  const wR = useRef<THREE.Mesh>(null);
  const phase = seed * 1.8;
  const spd = 0.42 + seed * 0.05;
  const r = Math.max(4.5, 3.5 + seed * 1.0 + plantHeight * 0.12);
  const scale = 1.4 + (seed % 2) * 0.3;

  useCreatureFrame(({ clock }) => {
    if (!grp.current) return;
    const t = clock.elapsedTime * spd + phase;
    const flap = Math.sin(clock.elapsedTime * 14 + phase) * 0.6;
    grp.current.position.set(
      Math.cos(t) * r + Math.sin(t * 2) * 0.5,
      centerY + plantHeight * (0.3 + Math.abs(Math.sin(t * 0.5)) * 0.5),
      Math.sin(t) * r
    );
    applyPlantAvoidance(grp.current.position, flightBounds);
    grp.current.rotation.y = Math.atan2(Math.sin(t) * r - grp.current.position.z, Math.cos(t) * r - grp.current.position.x);
    if (wL.current) wL.current.rotation.y = flap;
    if (wR.current) wR.current.rotation.y = -flap;
  });

  return (
    <group ref={grp} scale={scale}>
      {/* Abdomen — striped */}
      <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.35, 6, 10]} />
        <meshStandardMaterial color="#ffd020" emissive="#aa8800" emissiveIntensity={0.1} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.09, 0.08, 6, 8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.09, 0.08, 6, 8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
      </mesh>
      {/* Thorax */}
      <mesh position={[0, 0, -0.08]} castShadow scale={[1, 0.85, 1.1]}>
        <sphereGeometry args={[0.11, 10, 10]} />
        <meshStandardMaterial color="#ffd020" roughness={0.45} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.02, -0.2]}>
        <sphereGeometry args={[0.08, 10, 10]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
      </mesh>
      {/* Wings — translucent */}
      <mesh ref={wL} position={[0.22, 0.02, -0.02]} rotation={[-0.1, 0, 0.05]}>
        <planeGeometry args={[0.35, 0.14]} />
        <meshStandardMaterial color="#ddddff" emissive="#aaaacc" emissiveIntensity={0.15}
          side={THREE.DoubleSide} transparent opacity={0.5} roughness={0.08} />
      </mesh>
      <mesh ref={wR} position={[-0.22, 0.02, -0.02]} scale={[-1, 1, 1]} rotation={[-0.1, 0, -0.05]}>
        <planeGeometry args={[0.35, 0.14]} />
        <meshStandardMaterial color="#ddddff" emissive="#aaaacc" emissiveIntensity={0.15}
          side={THREE.DoubleSide} transparent opacity={0.5} roughness={0.08} />
      </mesh>
      {/* Stinger */}
      <mesh position={[0, 0, 0.38]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.025, 0.08, 5]} />
        <meshStandardMaterial color="#333333" roughness={0.8} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────
// Main export — renders creatures based on current stage
// ─────────────────────────────────────────────────────────
export function CreatureSystem({ stage, hydration, activeCreatures, heightScale, growth }: Props) {
  const s = clampStage(stage);
  const extMul = extendedScaleMultiplier(stage);
  const colors = getStageColor(s);
  const bounds = getPlantWorldBounds(s, growth);
  const { worldHeight: plantHeight, centerY } = bounds;
  const flightBounds = useMemo(() => buildPlantFlightBounds(s, growth), [s, growth]);

  const highTier = s >= 50;
  const extBonus = s >= 101 ? Math.floor((s - 100) / 12) : 0;
  const fireflyCount    = s >= 3  ? Math.min(2 + Math.floor(s * 0.11) + extBonus, highTier ? 24 : 15) : 0;
  const dragonflyCount  = s >= 10 ? Math.min(Math.floor((s - 10) * 0.09) + 1 + extBonus, highTier ? 12 : 7) : 0;
  const wispCount       = s >= 30 ? Math.min(Math.floor((s - 30) * 0.08) + 1, highTier ? 7 : 4) : 0;
  const butterflyCount  = s >= 18 ? Math.min(Math.floor((s - 18) * 0.1) + 1, highTier ? 10 : 6) : 0;
  const mothCount       = s >= 28 ? Math.min(Math.floor((s - 28) * 0.08) + 1, highTier ? 8 : 5) : 0;
  const jellyfishCount  = s >= 40 ? Math.min(Math.floor((s - 40) * 0.09) + 1, highTier ? 10 : 5) : 0;
  const ufoCount        = s >= 45 ? Math.min(Math.floor((s - 45) * 0.06) + 1, highTier ? 8 : 4) : 0;
  const birdCount       = s >= 55 ? Math.min(Math.floor((s - 55) * 0.08) + 1, highTier ? 8 : 4) : 0;
  const plasmaCount     = s >= 70 ? Math.min(Math.floor((s - 70) * 0.07) + 1, highTier ? 8 : 4) : 0;
  const scarabCount     = s >= 50 ? Math.min(1 + Math.floor((s - 50) / 8), 5) : 0;
  const lunaMothCount   = s >= 55 ? Math.min(1 + Math.floor((s - 55) / 10), 4) : 0;
  const hornetCount     = s >= 62 ? Math.min(1 + Math.floor((s - 62) / 12), 3) : 0;

  const creatureProps = { plantHeight, centerY, stage: s, growth, flightBounds };

  // ── Each creature type has its own distinct colour ──────────────────────
  // This ensures you can immediately tell WHAT you're looking at.
  // These are independent of the stage palette so creatures always contrast.
  const CREATURE_COLORS = {
    firefly:    colors.accent,          // tiny dots — uses stage accent for sparkle
    dragonfly:  "#00ddff",              // cyan-blue — sharp, iridescent wings
    wisp:       "#aa44ff",              // purple — ghostly drifting orbs
    butterfly:  colors.glow,           // stage-tinted — delicate wings
    moth:       "#d080ff",             // lavender — dreamy night flier
    jellyfish:  "#40aaff",             // sky blue — translucent bell
    ufoDisk:    "#90b8c8",             // silver-blue hull
    ufoAccent:  "#00ffcc",             // mint-cyan LED lights
    bird:       "#ffe066",             // golden-yellow — cosmic bird
    plasma:     "#4466ff",             // electric indigo ring
    plasmaAcc:  "#88aaff",
  };

  return (
    <group>
      {Array.from({ length: fireflyCount }, (_, i) => (
        <Firefly key={`ff_${i}`} seed={i} color={CREATURE_COLORS.firefly} {...creatureProps} />
      ))}
      {Array.from({ length: dragonflyCount }, (_, i) => (
        <Dragonfly key={`df_${i}`} seed={i} color={CREATURE_COLORS.dragonfly} {...creatureProps} />
      ))}
      {Array.from({ length: wispCount }, (_, i) => (
        <WillOWisp key={`wi_${i}`} seed={i} color={CREATURE_COLORS.wisp} {...creatureProps} />
      ))}
      {Array.from({ length: butterflyCount }, (_, i) => (
        <Butterfly key={`bf_${i}`} seed={i} color={CREATURE_COLORS.butterfly} accent={colors.accent} {...creatureProps} />
      ))}
      {Array.from({ length: mothCount }, (_, i) => (
        <DreamMoth key={`mo_${i}`} seed={i} color={CREATURE_COLORS.moth} {...creatureProps} />
      ))}
      {Array.from({ length: jellyfishCount }, (_, i) => (
        <JellyfishSpore key={`jf_${i}`} seed={i} color={CREATURE_COLORS.jellyfish} {...creatureProps} />
      ))}
      {Array.from({ length: ufoCount }, (_, i) => (
        <UFODisc key={`ufo_${i}`} seed={i} color={CREATURE_COLORS.ufoDisk} accent={CREATURE_COLORS.ufoAccent} {...creatureProps} />
      ))}
      {Array.from({ length: birdCount }, (_, i) => (
        <CosmicBird key={`cb_${i}`} seed={i} color={CREATURE_COLORS.bird} {...creatureProps} />
      ))}
      {Array.from({ length: plasmaCount }, (_, i) => (
        <PlasmaRing key={`pr_${i}`} seed={i} color={CREATURE_COLORS.plasma} accent={CREATURE_COLORS.plasmaAcc} {...creatureProps} />
      ))}
      {Array.from({ length: scarabCount }, (_, i) => (
        <GiantScarabBeetle key={`scarab_${i}`} seed={i} {...creatureProps} />
      ))}
      {Array.from({ length: lunaMothCount }, (_, i) => (
        <GiantLunaMoth key={`luna_${i}`} seed={i} {...creatureProps} />
      ))}
      {Array.from({ length: hornetCount }, (_, i) => (
        <GiantHornet key={`hornet_${i}`} seed={i} {...creatureProps} />
      ))}

      {activeCreatures.map((c, i) => {
        const seed = i + 200;
        if (c.type === "butterfly") return <Butterfly key={c.id} seed={seed} color={CREATURE_COLORS.butterfly} accent={colors.accent} {...creatureProps} />;
        if (c.type === "moth")      return <DreamMoth key={c.id} seed={seed} color={CREATURE_COLORS.moth} {...creatureProps} />;
        if (c.type === "jellyfish") return <JellyfishSpore key={c.id} seed={seed} color={CREATURE_COLORS.jellyfish} {...creatureProps} />;
        if (c.type === "bird")      return <CosmicBird key={c.id} seed={seed} color={CREATURE_COLORS.bird} {...creatureProps} />;
        return <Firefly key={c.id} seed={seed} color={CREATURE_COLORS.firefly} {...creatureProps} />;
      })}
    </group>
  );
}
