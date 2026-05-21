"use client";

import { useRef, useMemo } from "react";
import { useThrottledFrame } from "@/hooks/useThrottledFrame";
import * as THREE from "three";
import { getPlantWorldBounds } from "@/lib/plantScale";

interface Props {
  stage: number;
  growth: number;
}

type FlyPath = "orbit" | "figure8" | "vertical" | "ellipse" | "wave";

interface InsectFlyProps {
  seed: number;
  scale: number;
  plantHeight: number;
  centerY: number;
  path?: FlyPath;
}

/** Typical floating-flower scale — insects render at ~4.4× (doubled from prior 2.2×) */
function getInsectScale(stage: number, growth: number): number {
  const flowerRef = 0.75 + stage * 0.02 + growth * 0.0015;
  return flowerRef * 4.4;
}

function useFlyMotion(
  seed: number,
  plantHeight: number,
  centerY: number,
  speed = 0.35,
  path: FlyPath = "orbit"
) {
  const phase = seed * 2.17;
  const r = 1.8 + (seed % 4) * 0.6 + plantHeight * 0.08;
  const maxH = plantHeight * (0.35 + (seed % 3) * 0.1);
  const dir = seed % 2 === 0 ? 1 : -1;

  return (clock: THREE.Clock) => {
    const t = clock.elapsedTime * (speed + seed * 0.04) * dir + phase;
    let pos: THREE.Vector3;

    switch (path) {
      case "figure8":
        pos = new THREE.Vector3(
          Math.sin(t * 0.55) * r * 1.1,
          centerY + 0.8 + Math.sin(t * 1.1) * maxH * 0.7 + Math.cos(t * 0.35) * 0.4,
          Math.sin(t * 1.1) * r * 0.55 + Math.cos(t * 0.55) * 0.5
        );
        break;
      case "vertical":
        pos = new THREE.Vector3(
          Math.cos(seed * 0.9) * r * 0.45,
          centerY + 0.5 + ((Math.sin(t * 0.48) + 1) * 0.5) * maxH * 1.35,
          Math.sin(seed * 0.9) * r * 0.45 + Math.sin(t * 0.3) * 0.6
        );
        break;
      case "ellipse":
        pos = new THREE.Vector3(
          Math.cos(t * 0.5) * r * 1.35,
          centerY + 0.7 + Math.sin(t * 0.9) * maxH * 0.45,
          Math.sin(t * 0.5) * r * 0.65 + Math.cos(t * 1.4) * 0.35
        );
        break;
      case "wave":
        pos = new THREE.Vector3(
          Math.cos(t * 0.72) * r + Math.sin(t * 2.4) * 0.55,
          centerY + 0.65 + Math.abs(Math.sin(t * 0.55)) * maxH * 0.85,
          Math.sin(t * 0.72) * r * 0.9 - 1.2 + Math.cos(t * 1.9) * 0.4
        );
        break;
      default:
        pos = new THREE.Vector3(
          Math.cos(t * 0.65) * r + Math.sin(t * 1.8) * 0.4,
          centerY + 0.6 + Math.abs(Math.sin(t * 0.42)) * maxH + Math.sin(t * 2.1) * 0.15,
          Math.sin(t * 0.65) * r + Math.cos(t * 1.5) * 0.3
        );
    }

    const lookAhead = t + 0.12 * dir;
    const ahead =
      path === "figure8"
        ? new THREE.Vector3(Math.sin(lookAhead * 0.55) * r * 1.1, pos.y, Math.sin(lookAhead * 1.1) * r * 0.55)
        : path === "vertical"
          ? new THREE.Vector3(pos.x, centerY + 0.5 + ((Math.sin(lookAhead * 0.48) + 1) * 0.5) * maxH * 1.35, pos.z)
          : path === "ellipse"
            ? new THREE.Vector3(Math.cos(lookAhead * 0.5) * r * 1.35, pos.y, Math.sin(lookAhead * 0.5) * r * 0.65)
            : path === "wave"
              ? new THREE.Vector3(Math.cos(lookAhead * 0.72) * r, pos.y, Math.sin(lookAhead * 0.72) * r * 0.9 - 1.2)
              : new THREE.Vector3(Math.cos(lookAhead * 0.65) * r, pos.y, Math.sin(lookAhead * 0.65) * r);

    const yaw = Math.atan2(ahead.x - pos.x, ahead.z - pos.z);
    return { pos, t, yaw };
  };
}

const PATH_PAIRS: [FlyPath, FlyPath][] = [
  ["orbit", "figure8"],
  ["ellipse", "vertical"],
  ["wave", "orbit"],
  ["figure8", "wave"],
  ["vertical", "ellipse"],
  ["orbit", "wave"],
  ["ellipse", "figure8"],
];

// ── Honey Bee — yellow/black stripes, fuzzy body ─────────────────────────
function HoneyBee({ seed, scale, plantHeight, centerY, path = "orbit" }: InsectFlyProps) {
  const grp = useRef<THREE.Group>(null);
  const wL = useRef<THREE.Mesh>(null);
  const wR = useRef<THREE.Mesh>(null);
  const fly = useFlyMotion(seed, plantHeight, centerY, 0.42, path);
  const s = scale;

  useThrottledFrame(({ clock }) => {
    if (!grp.current) return;
    const { pos, t, yaw } = fly(clock);
    grp.current.position.copy(pos);
    grp.current.rotation.y = yaw;
    const flap = Math.sin(clock.elapsedTime * 22 + seed) * 0.75;
    if (wL.current) wL.current.rotation.z = flap;
    if (wR.current) wR.current.rotation.z = -flap;
  });

  return (
    <group ref={grp} scale={s}>
      {/* Abdomen — striped */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0, 0.06 + i * 0.055]} rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.045, 0.04, 8, 12]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#ffd020" : "#1a1a1a"} roughness={0.45} metalness={i % 2 === 0 ? 0.05 : 0.1} />
        </mesh>
      ))}
      {/* Thorax — fuzzy yellow */}
      <mesh position={[0, 0.01, -0.02]} castShadow>
        <sphereGeometry args={[0.055, 14, 14]} />
        <meshStandardMaterial color="#ffc830" emissive="#aa8800" emissiveIntensity={0.08} roughness={0.55} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.02, -0.09]}>
        <sphereGeometry args={[0.038, 12, 12]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.6} />
      </mesh>
      {/* Compound eyes */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.028, 0.03, -0.11]}>
          <sphereGeometry args={[0.018, 10, 10]} />
          <meshStandardMaterial color="#1a1a1a" emissive="#333355" emissiveIntensity={0.2} roughness={0.2} metalness={0.3} />
        </mesh>
      ))}
      {/* Antennae */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.02, 0.05, -0.12]} rotation={[0.6, side * 0.3, 0]}>
          <capsuleGeometry args={[0.004, 0.08, 4, 6]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}
      {/* Wings — translucent */}
      <mesh ref={wL} position={[0.09, 0.04, 0]} rotation={[0.1, 0, 0.15]}>
        <planeGeometry args={[0.14, 0.1, 4, 4]} />
        <meshStandardMaterial color="#ddddff" emissive="#aaaacc" emissiveIntensity={0.1} side={THREE.DoubleSide} transparent opacity={0.55} roughness={0.05} />
      </mesh>
      <mesh ref={wR} position={[-0.09, 0.04, 0]} rotation={[0.1, 0, -0.15]} scale={[-1, 1, 1]}>
        <planeGeometry args={[0.14, 0.1, 4, 4]} />
        <meshStandardMaterial color="#ddddff" emissive="#aaaacc" emissiveIntensity={0.1} side={THREE.DoubleSide} transparent opacity={0.55} roughness={0.05} />
      </mesh>
      {/* Six legs */}
      {[[0.04, -0.02, 0.04], [-0.04, -0.02, 0.04], [0.05, -0.03, 0], [-0.05, -0.03, 0], [0.04, -0.02, -0.04], [-0.04, -0.02, -0.04]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[0.5, p[0] > 0 ? 0.4 : -0.4, 0]}>
          <capsuleGeometry args={[0.006, 0.06, 3, 5]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

// ── Mosquito — long legs, proboscis, delicate wings ───────────────────────
function Mosquito({ seed, scale, plantHeight, centerY, path = "orbit" }: InsectFlyProps) {
  const grp = useRef<THREE.Group>(null);
  const wL = useRef<THREE.Mesh>(null);
  const wR = useRef<THREE.Mesh>(null);
  const fly = useFlyMotion(seed + 1, plantHeight, centerY, 0.55, path);
  const s = scale;

  useThrottledFrame(({ clock }) => {
    if (!grp.current) return;
    const { pos, yaw } = fly(clock);
    grp.current.position.copy(pos);
    grp.current.rotation.y = yaw;
    const flap = Math.sin(clock.elapsedTime * 28 + seed) * 0.85;
    if (wL.current) wL.current.rotation.y = flap;
    if (wR.current) wR.current.rotation.y = -flap;
  });

  return (
    <group ref={grp} scale={s}>
      {/* Abdomen — slender dark */}
      <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.022, 0.18, 6, 10]} />
        <meshStandardMaterial color="#3a3a48" emissive="#1a1a28" emissiveIntensity={0.05} roughness={0.5} />
      </mesh>
      {/* Thorax */}
      <mesh position={[0, 0, -0.02]} scale={[0.9, 0.85, 1.1]}>
        <sphereGeometry args={[0.032, 10, 10]} />
        <meshStandardMaterial color="#4a4a58" roughness={0.55} />
      </mesh>
      {/* Head + eyes */}
      <mesh position={[0, 0.01, -0.07]}>
        <sphereGeometry args={[0.028, 10, 10]} />
        <meshStandardMaterial color="#2a2a38" roughness={0.6} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.022, 0.02, -0.08]}>
          <sphereGeometry args={[0.014, 8, 8]} />
          <meshStandardMaterial color="#880000" emissive="#440000" emissiveIntensity={0.15} />
        </mesh>
      ))}
      {/* Proboscis */}
      <mesh position={[0, -0.01, -0.12]} rotation={[Math.PI / 2 + 0.3, 0, 0]}>
        <cylinderGeometry args={[0.004, 0.002, 0.14, 6]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} />
      </mesh>
      {/* Long legs — 6 spindly */}
      {Array.from({ length: 6 }, (_, i) => {
        const side = i % 2 === 0 ? 1 : -1;
        const z = (Math.floor(i / 2) - 1) * 0.05;
        return (
          <mesh key={i} position={[side * 0.06, -0.04, z]} rotation={[0.8, side * 0.5, 0]}>
            <capsuleGeometry args={[0.003, 0.14, 3, 5]} />
            <meshStandardMaterial color="#2a2a38" roughness={0.9} />
          </mesh>
        );
      })}
      {/* Wings — narrow V shape */}
      <mesh ref={wL} position={[0.07, 0.02, 0.01]} rotation={[-0.2, 0.3, 0.1]}>
        <planeGeometry args={[0.08, 0.035, 3, 3]} />
        <meshStandardMaterial color="#ccccdd" side={THREE.DoubleSide} transparent opacity={0.45} roughness={0.08} />
      </mesh>
      <mesh ref={wR} position={[-0.07, 0.02, 0.01]} rotation={[-0.2, -0.3, -0.1]} scale={[-1, 1, 1]}>
        <planeGeometry args={[0.08, 0.035, 3, 3]} />
        <meshStandardMaterial color="#ccccdd" side={THREE.DoubleSide} transparent opacity={0.45} roughness={0.08} />
      </mesh>
    </group>
  );
}

// ── Monarch Butterfly — orange/black with white spots ─────────────────────
function MonarchButterfly({ seed, scale, plantHeight, centerY, path = "orbit" }: InsectFlyProps) {
  const grp = useRef<THREE.Group>(null);
  const wL = useRef<THREE.Mesh>(null);
  const wR = useRef<THREE.Mesh>(null);
  const fly = useFlyMotion(seed + 2, plantHeight, centerY, 0.32, path);

  const wingGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.22, 0.18, 8, 8);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      p.setZ(i, Math.abs(x / 0.22) * 0.04);
    }
    p.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, []);

  useThrottledFrame(({ clock }) => {
    if (!grp.current) return;
    const { pos, t } = fly(clock);
    grp.current.position.copy(pos);
    grp.current.rotation.y = t * 0.5 + Math.PI / 2;
    const flap = Math.sin(clock.elapsedTime * 6 + seed) * 0.6;
    if (wL.current) wL.current.rotation.y = flap;
    if (wR.current) wR.current.rotation.y = -flap;
  });

  return (
    <group ref={grp} scale={scale}>
      <mesh ref={wL} geometry={wingGeo} position={[0.12, 0, 0]}>
        <meshStandardMaterial color="#ff7722" emissive="#cc4400" emissiveIntensity={0.2} side={THREE.DoubleSide} transparent opacity={0.92} roughness={0.3} />
      </mesh>
      <mesh ref={wR} geometry={wingGeo} position={[-0.12, 0, 0]} scale={[-1, 1, 1]}>
        <meshStandardMaterial color="#ff7722" emissive="#cc4400" emissiveIntensity={0.2} side={THREE.DoubleSide} transparent opacity={0.92} roughness={0.3} />
      </mesh>
      {/* Black wing borders + white spots */}
      {[[0.08, 0.05], [0.1, -0.04], [-0.08, 0.05], [-0.1, -0.04]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.015]}>
          <circleGeometry args={[0.012, 10]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffee" emissiveIntensity={0.15} />
        </mesh>
      ))}
      <mesh>
        <capsuleGeometry args={[0.012, 0.08, 6, 10]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.85} />
      </mesh>
    </group>
  );
}

// ── Jewel Beetle — metallic green/blue, hard shell ────────────────────────
function JewelBeetle({ seed, scale, plantHeight, centerY, path = "orbit" }: InsectFlyProps) {
  const grp = useRef<THREE.Group>(null);
  const wL = useRef<THREE.Mesh>(null);
  const wR = useRef<THREE.Mesh>(null);
  const fly = useFlyMotion(seed + 3, plantHeight, centerY, 0.38, path);
  const shellColor = seed % 2 === 0 ? "#00cc88" : "#2288ff";
  const shellEmissive = seed % 2 === 0 ? "#006644" : "#114488";

  useThrottledFrame(({ clock }) => {
    if (!grp.current) return;
    const { pos, yaw } = fly(clock);
    grp.current.position.copy(pos);
    grp.current.rotation.y = yaw;
    const flap = Math.sin(clock.elapsedTime * 16 + seed) * 0.55;
    if (wL.current) wL.current.rotation.z = flap;
    if (wR.current) wR.current.rotation.z = -flap;
  });

  return (
    <group ref={grp} scale={scale}>
      {/* Elytra — metallic shell */}
      <mesh position={[0, 0.02, 0]} castShadow scale={[1.2, 0.7, 1]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={shellColor} emissive={shellEmissive} emissiveIntensity={0.25} roughness={0.15} metalness={0.75} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.02, -0.1]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color="#1a3020" roughness={0.6} />
      </mesh>
      {/* Mandibles */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.025, -0.01, -0.13]} rotation={[0.4, side * 0.3, 0]}>
          <coneGeometry args={[0.012, 0.04, 5]} />
          <meshStandardMaterial color="#0a1808" roughness={0.8} />
        </mesh>
      ))}
      {/* Wings under shell */}
      <mesh ref={wL} position={[0.1, 0.04, 0.02]} rotation={[0, 0, 0.2]}>
        <planeGeometry args={[0.12, 0.08, 3, 3]} />
        <meshStandardMaterial color="#88ddff" side={THREE.DoubleSide} transparent opacity={0.5} roughness={0.1} />
      </mesh>
      <mesh ref={wR} position={[-0.1, 0.04, 0.02]} rotation={[0, 0, -0.2]} scale={[-1, 1, 1]}>
        <planeGeometry args={[0.12, 0.08, 3, 3]} />
        <meshStandardMaterial color="#88ddff" side={THREE.DoubleSide} transparent opacity={0.5} roughness={0.1} />
      </mesh>
      {/* Six legs */}
      {[[0.07, -0.02, 0.05], [-0.07, -0.02, 0.05], [0.08, -0.03, 0], [-0.08, -0.03, 0], [0.07, -0.02, -0.05], [-0.07, -0.02, -0.05]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[0.55, p[0] > 0 ? 0.35 : -0.35, 0]}>
          <capsuleGeometry args={[0.008, 0.07, 4, 6]} />
          <meshStandardMaterial color="#1a3020" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

// ── Cicada — broad amber wings, bulbous eyes ────────────────────────────
function Cicada({ seed, scale, plantHeight, centerY, path = "orbit" }: InsectFlyProps) {
  const grp = useRef<THREE.Group>(null);
  const wL = useRef<THREE.Mesh>(null);
  const wR = useRef<THREE.Mesh>(null);
  const fly = useFlyMotion(seed + 4, plantHeight, centerY, 0.28, path);

  useThrottledFrame(({ clock }) => {
    if (!grp.current) return;
    const { pos, yaw } = fly(clock);
    grp.current.position.copy(pos);
    grp.current.rotation.y = yaw;
    const flap = Math.sin(clock.elapsedTime * 12 + seed) * 0.45;
    if (wL.current) wL.current.rotation.y = flap;
    if (wR.current) wR.current.rotation.y = -flap;
  });

  return (
    <group ref={grp} scale={scale}>
      {/* Broad wings — amber veined */}
      <mesh ref={wL} position={[0.14, 0, 0]} rotation={[0, 0.1, 0]}>
        <planeGeometry args={[0.2, 0.14, 6, 6]} />
        <meshStandardMaterial color="#c8a060" emissive="#886830" emissiveIntensity={0.12} side={THREE.DoubleSide} transparent opacity={0.75} roughness={0.35} />
      </mesh>
      <mesh ref={wR} position={[-0.14, 0, 0]} scale={[-1, 1, 1]} rotation={[0, -0.1, 0]}>
        <planeGeometry args={[0.2, 0.14, 6, 6]} />
        <meshStandardMaterial color="#c8a060" emissive="#886830" emissiveIntensity={0.12} side={THREE.DoubleSide} transparent opacity={0.75} roughness={0.35} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.04, 0.12, 8, 12]} />
        <meshStandardMaterial color="#3a4828" emissive="#1a2810" emissiveIntensity={0.08} roughness={0.65} />
      </mesh>
      {/* Bulbous red eyes */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.045, 0.02, -0.06]}>
          <sphereGeometry args={[0.032, 12, 12]} />
          <meshStandardMaterial color="#cc2200" emissive="#881100" emissiveIntensity={0.3} roughness={0.25} />
        </mesh>
      ))}
      {/* Short antennae */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.03, 0.04, -0.08]} rotation={[0.5, side * 0.2, 0]}>
          <capsuleGeometry args={[0.004, 0.05, 3, 5]} />
          <meshStandardMaterial color="#2a3820" />
        </mesh>
      ))}
    </group>
  );
}

// ── Dragonfly — iridescent, four wings, huge eyes ─────────────────────────
function Dragonfly({ seed, scale, plantHeight, centerY, path = "orbit" }: InsectFlyProps) {
  const grp = useRef<THREE.Group>(null);
  const fWL = useRef<THREE.Mesh>(null);
  const fWR = useRef<THREE.Mesh>(null);
  const bWL = useRef<THREE.Mesh>(null);
  const bWR = useRef<THREE.Mesh>(null);
  const fly = useFlyMotion(seed + 5, plantHeight, centerY, 0.48, path);
  const bodyHue = seed % 2 === 0 ? "#22aacc" : "#44cc88";

  useThrottledFrame(({ clock }) => {
    if (!grp.current) return;
    const { pos, yaw } = fly(clock);
    grp.current.position.copy(pos);
    grp.current.rotation.y = yaw;
    const flap = Math.sin(clock.elapsedTime * 18 + seed) * 0.55;
    const rear = Math.sin(clock.elapsedTime * 18 + seed + 0.4) * 0.45;
    if (fWL.current) fWL.current.rotation.z = flap;
    if (fWR.current) fWR.current.rotation.z = -flap;
    if (bWL.current) bWL.current.rotation.z = rear;
    if (bWR.current) bWR.current.rotation.z = -rear;
  });

  return (
    <group ref={grp} scale={scale}>
      {/* Long segmented abdomen */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0, 0, 0.08 + i * 0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.028 - i * 0.003, 0.035, 6, 10]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? bodyHue : "#1a3040"}
            emissive={bodyHue}
            emissiveIntensity={0.15}
            roughness={0.2}
            metalness={0.55}
          />
        </mesh>
      ))}
      {/* Thorax */}
      <mesh position={[0, 0.01, -0.02]} castShadow>
        <sphereGeometry args={[0.042, 14, 14]} />
        <meshStandardMaterial color="#2a4858" emissive="#1a2838" emissiveIntensity={0.1} roughness={0.35} metalness={0.4} />
      </mesh>
      {/* Bulbous compound eyes */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.055, 0.03, -0.07]}>
          <sphereGeometry args={[0.038, 14, 14]} />
          <meshStandardMaterial color="#224466" emissive="#4488cc" emissiveIntensity={0.35} roughness={0.15} metalness={0.5} />
        </mesh>
      ))}
      {/* Front wing pair — broad, veined */}
      <mesh ref={fWL} position={[0.1, 0.03, -0.01]} rotation={[0.05, 0.1, 0.1]}>
        <planeGeometry args={[0.16, 0.07, 6, 4]} />
        <meshStandardMaterial color="#aaddff" emissive="#6688cc" emissiveIntensity={0.12} side={THREE.DoubleSide} transparent opacity={0.5} roughness={0.05} />
      </mesh>
      <mesh ref={fWR} position={[-0.1, 0.03, -0.01]} rotation={[0.05, -0.1, -0.1]} scale={[-1, 1, 1]}>
        <planeGeometry args={[0.16, 0.07, 6, 4]} />
        <meshStandardMaterial color="#aaddff" emissive="#6688cc" emissiveIntensity={0.12} side={THREE.DoubleSide} transparent opacity={0.5} roughness={0.05} />
      </mesh>
      {/* Rear wing pair — narrower */}
      <mesh ref={bWL} position={[0.08, 0.02, 0.04]} rotation={[0.08, 0.05, 0.08]}>
        <planeGeometry args={[0.12, 0.05, 4, 3]} />
        <meshStandardMaterial color="#88ccff" emissive="#5588bb" emissiveIntensity={0.1} side={THREE.DoubleSide} transparent opacity={0.45} roughness={0.08} />
      </mesh>
      <mesh ref={bWR} position={[-0.08, 0.02, 0.04]} rotation={[0.08, -0.05, -0.08]} scale={[-1, 1, 1]}>
        <planeGeometry args={[0.12, 0.05, 4, 3]} />
        <meshStandardMaterial color="#88ccff" emissive="#5588bb" emissiveIntensity={0.1} side={THREE.DoubleSide} transparent opacity={0.45} roughness={0.08} />
      </mesh>
      {/* Six spindly legs */}
      {[[0.05, -0.02, 0.02], [-0.05, -0.02, 0.02], [0.06, -0.03, -0.02], [-0.06, -0.03, -0.02], [0.05, -0.02, -0.06], [-0.05, -0.02, -0.06]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[0.7, p[0] > 0 ? 0.5 : -0.5, 0]}>
          <capsuleGeometry args={[0.004, 0.09, 3, 5]} />
          <meshStandardMaterial color="#1a2830" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ── Firefly — dark body, glowing amber abdomen ──────────────────────────
function Firefly({ seed, scale, plantHeight, centerY, path = "orbit" }: InsectFlyProps) {
  const grp = useRef<THREE.Group>(null);
  const wL = useRef<THREE.Mesh>(null);
  const wR = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const fly = useFlyMotion(seed + 6, plantHeight, centerY, 0.36, path);

  useThrottledFrame(({ clock }) => {
    if (!grp.current) return;
    const { pos, yaw } = fly(clock);
    grp.current.position.copy(pos);
    grp.current.rotation.y = yaw;
    const flap = Math.sin(clock.elapsedTime * 14 + seed) * 0.65;
    if (wL.current) wL.current.rotation.z = flap;
    if (wR.current) wR.current.rotation.z = -flap;
    if (glowRef.current) {
      glowRef.current.intensity = 0.6 + Math.sin(clock.elapsedTime * 3 + seed) * 0.5;
    }
  });

  return (
    <group ref={grp} scale={scale}>
      <pointLight ref={glowRef} color="#ffcc44" intensity={0.8} distance={6} decay={2} position={[0, 0, 0.14]} />
      {/* Glowing lantern segments */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0, 0.1 + i * 0.045]} rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.032, 0.03, 8, 10]} />
          <meshStandardMaterial
            color="#ffdd22"
            emissive="#ffaa00"
            emissiveIntensity={0.7 + i * 0.1}
            roughness={0.25}
            transparent
            opacity={0.92}
          />
        </mesh>
      ))}
      {/* Dark thorax & head */}
      <mesh position={[0, 0.01, -0.02]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color="#1a2018" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.02, -0.07]}>
        <sphereGeometry args={[0.03, 10, 10]} />
        <meshStandardMaterial color="#121810" roughness={0.75} />
      </mesh>
      {/* Antennae */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.018, 0.04, -0.09]} rotation={[0.5, side * 0.25, 0]}>
          <capsuleGeometry args={[0.003, 0.07, 3, 5]} />
          <meshStandardMaterial color="#0a1008" />
        </mesh>
      ))}
      {/* Soft wings */}
      <mesh ref={wL} position={[0.08, 0.03, 0.01]} rotation={[0.1, 0.15, 0.12]}>
        <planeGeometry args={[0.11, 0.08, 4, 4]} />
        <meshStandardMaterial color="#334433" side={THREE.DoubleSide} transparent opacity={0.55} roughness={0.4} />
      </mesh>
      <mesh ref={wR} position={[-0.08, 0.03, 0.01]} rotation={[0.1, -0.15, -0.12]} scale={[-1, 1, 1]}>
        <planeGeometry args={[0.11, 0.08, 4, 4]} />
        <meshStandardMaterial color="#334433" side={THREE.DoubleSide} transparent opacity={0.55} roughness={0.4} />
      </mesh>
      {/* Legs */}
      {[[0.04, -0.02, 0.03], [-0.04, -0.02, 0.03], [0.05, -0.03, 0], [-0.05, -0.03, 0], [0.04, -0.02, -0.03], [-0.04, -0.02, -0.03]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[0.55, p[0] > 0 ? 0.35 : -0.35, 0]}>
          <capsuleGeometry args={[0.005, 0.06, 3, 5]} />
          <meshStandardMaterial color="#1a2018" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

const GIANT_INSECTS = [
  { id: "bee", unlockStage: 12, Component: HoneyBee },
  { id: "mosquito", unlockStage: 24, Component: Mosquito },
  { id: "monarch", unlockStage: 36, Component: MonarchButterfly },
  { id: "beetle", unlockStage: 48, Component: JewelBeetle },
  { id: "cicada", unlockStage: 60, Component: Cicada },
  { id: "dragonfly", unlockStage: 72, Component: Dragonfly },
  { id: "firefly", unlockStage: 84, Component: Firefly },
] as const;

export function GiantFlyingInsects({ stage, growth }: Props) {
  const bounds = getPlantWorldBounds(stage, growth);
  const insectScale = getInsectScale(stage, growth);
  const flyProps = { plantHeight: bounds.worldHeight, centerY: bounds.centerY };

  return (
    <group>
      {GIANT_INSECTS.map((insect, i) => {
        if (stage < insect.unlockStage) return null;
        const Insect = insect.Component;
        const progress = Math.min(1, (stage - insect.unlockStage) / 8 + 0.5);
        const [pathA, pathB] = PATH_PAIRS[i % PATH_PAIRS.length]!;
        return (
          <group key={insect.id} scale={progress}>
            <Insect seed={i + 10} scale={insectScale} path={pathA} {...flyProps} />
            <Insect seed={i + 60} scale={insectScale * 0.95} path={pathB} {...flyProps} />
          </group>
        );
      })}
    </group>
  );
}
