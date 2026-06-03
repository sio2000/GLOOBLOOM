"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { getStageColor } from "@/types/organism";
import { getPlantWorldBounds } from "@/lib/plantScale";
import { usePerformanceStore } from "@/store/usePerformanceStore";
import { geoSeg } from "@/lib/performance";
import { useThrottledFrame } from "@/hooks/useThrottledFrame";
import { useDeviceInfo } from "@/hooks/useDeviceInfo";

interface Props {
  stage: number;
  growth: number;
}

// ── Solar system planets — unlock gradually from stage 50 ─────────────────
interface PlanetDef {
  id: string;
  name: string;
  unlockStage: number;
  radius: number;
  color: string;
  emissive: string;
  emissiveIntensity: number;
  roughness: number;
  metalness: number;
  orbitSpeed: number;
  orbitRadius: number;
  orbitPhase: number;
  orbitTilt: number;
  lightColor: string;
  lightIntensity: number;
  hasRings?: boolean;
  ringColor?: string;
  hasBands?: boolean;
  bandColors?: [string, string];
  hasClouds?: boolean;
  hasPolarCap?: boolean;
  hasStorm?: boolean;
  tiltAxis?: number;
}

const SOLAR_PLANETS: PlanetDef[] = [
  {
    id: "mercury", name: "Mercury", unlockStage: 50,
    radius: 0.55, color: "#8a8078", emissive: "#4a4038", emissiveIntensity: 0.08,
    roughness: 0.92, metalness: 0.05, orbitSpeed: 0.07, orbitRadius: 14, orbitPhase: 0,
    orbitTilt: 0.12, lightColor: "#c8b8a0", lightIntensity: 0.6,
  },
  {
    id: "venus", name: "Venus", unlockStage: 56,
    radius: 0.85, color: "#e8c878", emissive: "#cc8840", emissiveIntensity: 0.2,
    roughness: 0.55, metalness: 0.05, orbitSpeed: 0.055, orbitRadius: 16, orbitPhase: 0.9,
    orbitTilt: 0.08, lightColor: "#ffcc80", lightIntensity: 0.9,
  },
  {
    id: "earth", name: "Earth", unlockStage: 62,
    radius: 0.9, color: "#2266aa", emissive: "#114488", emissiveIntensity: 0.15,
    roughness: 0.6, metalness: 0.08, orbitSpeed: 0.05, orbitRadius: 18, orbitPhase: 1.8,
    orbitTilt: 0.15, lightColor: "#88bbff", lightIntensity: 1.0, hasClouds: true,
  },
  {
    id: "mars", name: "Mars", unlockStage: 68,
    radius: 0.7, color: "#c85030", emissive: "#882818", emissiveIntensity: 0.18,
    roughness: 0.78, metalness: 0.06, orbitSpeed: 0.045, orbitRadius: 20, orbitPhase: 2.7,
    orbitTilt: 0.1, lightColor: "#ff8860", lightIntensity: 0.85, hasPolarCap: true,
  },
  {
    id: "jupiter", name: "Jupiter", unlockStage: 74,
    radius: 1.6, color: "#c87830", emissive: "#ff9040", emissiveIntensity: 0.22,
    roughness: 0.65, metalness: 0.08, orbitSpeed: 0.038, orbitRadius: 24, orbitPhase: 3.6,
    orbitTilt: 0.18, lightColor: "#ffb060", lightIntensity: 1.4,
    hasBands: true, bandColors: ["#e8a050", "#a04820"], hasStorm: true,
  },
  {
    id: "saturn", name: "Saturn", unlockStage: 80,
    radius: 1.45, color: "#e8c890", emissive: "#c8a060", emissiveIntensity: 0.2,
    roughness: 0.6, metalness: 0.1, orbitSpeed: 0.032, orbitRadius: 28, orbitPhase: 4.5,
    orbitTilt: 0.22, lightColor: "#ffe8b0", lightIntensity: 1.3,
    hasRings: true, ringColor: "#d8c8a0", hasBands: true, bandColors: ["#f0d8a8", "#b89860"],
    tiltAxis: 0.45,
  },
  {
    id: "uranus", name: "Uranus", unlockStage: 86,
    radius: 1.1, color: "#66ccdd", emissive: "#3388aa", emissiveIntensity: 0.25,
    roughness: 0.45, metalness: 0.12, orbitSpeed: 0.028, orbitRadius: 32, orbitPhase: 5.4,
    orbitTilt: 0.25, lightColor: "#88eeff", lightIntensity: 1.1, tiltAxis: 1.2,
  },
  {
    id: "neptune", name: "Neptune", unlockStage: 92,
    radius: 1.05, color: "#2244cc", emissive: "#112288", emissiveIntensity: 0.28,
    roughness: 0.4, metalness: 0.15, orbitSpeed: 0.024, orbitRadius: 36, orbitPhase: 6.2,
    orbitTilt: 0.2, lightColor: "#6688ff", lightIntensity: 1.2, hasStorm: true,
  },
];

function planetRand(seed: number): number {
  const x = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface PlanetAnchor {
  baseX: number;
  baseZ: number;
  baseY: number;
  driftR: number;
  driftSpeed: number;
  driftPhase: number;
  wobbleAmp: number;
  wobbleFreq: number;
}

function buildPlanetAnchor(
  def: PlanetDef,
  plantTop: number,
  plantHeight: number
): PlanetAnchor {
  const s = def.unlockStage * 17 + def.orbitPhase * 100;
  const r = (n: number) => planetRand(s + n);
  const floorY = plantTop + 2.5 + def.radius * 2;

  return {
    baseX: (r(1) - 0.5) * (16 + plantHeight * 0.42),
    baseZ: (r(2) - 0.5) * (14 + plantHeight * 0.38) - 5 - r(3) * 8,
    baseY: floorY + r(4) * (plantHeight * 0.42 + 14) + def.orbitRadius * 0.12,
    driftR: 3 + r(5) * (def.orbitRadius * 0.32 + 6),
    driftSpeed: def.orbitSpeed * (0.45 + r(6) * 1.35),
    driftPhase: def.orbitPhase + r(7) * Math.PI * 2,
    wobbleAmp: 1 + r(8) * 3.5,
    wobbleFreq: 0.35 + r(9) * 1.1,
  };
}

function SolarSystemPlanet({
  def, stage, plantHeight, plantTop,
}: {
  def: PlanetDef; stage: number; plantHeight: number; plantTop: number;
}) {
  const grpRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const scaleIn = Math.min(1, (stage - def.unlockStage) / 6 + 0.4);
  const planetRadius = def.radius * (1 + (stage - def.unlockStage) * 0.004);
  const geoQuality = usePerformanceStore((s) => s.settings().geoQuality);
  const sphereSegs = geoSeg(32, geoQuality, 12);
  const ringSegs = geoSeg(64, geoQuality, 24);
  const anchor = useMemo(
    () => buildPlanetAnchor(def, plantTop, plantHeight),
    [def, plantTop, plantHeight]
  );
  const minY = plantTop + 1.5 + def.radius;

  useThrottledFrame(({ clock }) => {
    if (!grpRef.current || !lightRef.current) return;
    const t = clock.elapsedTime;
    const driftT = t * anchor.driftSpeed + anchor.driftPhase;
    const x =
      anchor.baseX +
      Math.cos(driftT) * anchor.driftR +
      Math.sin(t * anchor.wobbleFreq) * 0.8;
    const z =
      anchor.baseZ +
      Math.sin(driftT * 0.92) * anchor.driftR * 0.88 +
      Math.cos(t * anchor.wobbleFreq * 0.7) * 0.6;
    const y = Math.max(
      minY,
      anchor.baseY + Math.sin(t * anchor.wobbleFreq + anchor.driftPhase) * anchor.wobbleAmp
    );
    grpRef.current.position.set(x, y, z);
    grpRef.current.scale.setScalar(scaleIn);

    const dist = Math.sqrt(x * x + z * z);
    const proximity = 1 - Math.min(1, dist / (anchor.driftR + 18));
    lightRef.current.intensity = def.lightIntensity * (0.3 + proximity * 0.7);
    lightRef.current.position.set(x, y, z);

    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        def.emissiveIntensity * (0.6 + proximity * 0.5);
    }
  });

  return (
    <group ref={grpRef}>
      <pointLight
        ref={lightRef}
        color={def.lightColor}
        intensity={def.lightIntensity}
        distance={plantHeight * 4 + 40}
        decay={1.4}
      />

      <group rotation={[def.tiltAxis ?? 0, 0, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[planetRadius, sphereSegs, sphereSegs]} />
          <meshStandardMaterial
            color={def.color}
            emissive={def.emissive}
            emissiveIntensity={def.emissiveIntensity}
            roughness={def.roughness}
            metalness={def.metalness}
          />
        </mesh>

        {def.hasBands && def.bandColors && [0.3, 0.55, 0.78].map((lat, i) => (
          <mesh key={i} rotation={[lat * Math.PI * 0.35, i * 1.2, 0]}>
            <torusGeometry args={[planetRadius * 1.01, planetRadius * 0.05, 8, 48]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? def.bandColors![0] : def.bandColors![1]}
              transparent
              opacity={0.55}
              roughness={0.7}
            />
          </mesh>
        ))}

        {def.hasClouds && (
          <mesh>
            <sphereGeometry args={[planetRadius * 1.03, 24, 24]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.18} roughness={0.9} depthWrite={false} />
          </mesh>
        )}

        {def.hasClouds && (
          <>
            <mesh position={[planetRadius * 0.4, planetRadius * 0.2, planetRadius * 0.3]}>
              <sphereGeometry args={[planetRadius * 0.25, 10, 10]} />
              <meshStandardMaterial color="#eeeeff" transparent opacity={0.35} depthWrite={false} />
            </mesh>
            <mesh position={[-planetRadius * 0.3, -planetRadius * 0.15, planetRadius * 0.5]} scale={[1.4, 0.6, 1]}>
              <sphereGeometry args={[planetRadius * 0.2, 10, 10]} />
              <meshStandardMaterial color="#ddeeff" transparent opacity={0.3} depthWrite={false} />
            </mesh>
          </>
        )}

        {def.hasPolarCap && (
          <mesh position={[0, planetRadius * 0.85, 0]}>
            <sphereGeometry args={[planetRadius * 0.22, 10, 10]} />
            <meshStandardMaterial color="#eeeeff" emissive="#ccccdd" emissiveIntensity={0.15} roughness={0.8} />
          </mesh>
        )}

        {def.hasStorm && (
          <mesh position={[planetRadius * 0.35, -planetRadius * 0.2, planetRadius * 0.7]}>
            <sphereGeometry args={[planetRadius * 0.18, 12, 12]} />
            <meshStandardMaterial color="#cc4422" emissive="#882211" emissiveIntensity={0.3} roughness={0.5} />
          </mesh>
        )}

        {def.hasRings && (
          <mesh rotation={[Math.PI / 2.8, 0.4, 0.15]}>
            <ringGeometry args={[planetRadius * 1.35, planetRadius * 1.85, ringSegs]} />
            <meshStandardMaterial
              color={def.ringColor ?? "#d8c8a0"}
              emissive="#ffe8b0"
              emissiveIntensity={0.15}
              transparent
              opacity={0.72}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        )}

        <mesh ref={glowRef}>
          <sphereGeometry args={[planetRadius * 1.12, 16, 16]} />
          <meshStandardMaterial
            color={def.color}
            emissive={def.emissive}
            emissiveIntensity={def.emissiveIntensity}
            transparent
            opacity={0.1}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}

function SolarSystem({ stage, plantHeight, plantTop }: {
  stage: number; plantHeight: number; plantTop: number;
}) {
  return (
    <>
      {SOLAR_PLANETS.filter((p) => stage >= p.unlockStage).map((def) => (
        <SolarSystemPlanet
          key={def.id}
          def={def}
          stage={stage}
          plantHeight={plantHeight}
          plantTop={plantTop}
        />
      ))}
    </>
  );
}

// ── Aurora ribbons wrapping the plant ───────────────────────────────────
function AuroraRibbons({ stage, plantHeight, centerY, color }: {
  stage: number; plantHeight: number; centerY: number; color: string;
}) {
  const ribbons = useMemo(() => {
    const count = Math.min(3 + Math.floor((stage - 50) / 12), 7);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (i / count) * Math.PI * 2,
      phase: i * 1.7,
      hue: i % 3,
    }));
  }, [stage]);

  return (
    <group position={[0, centerY, 0]}>
      {ribbons.map((r) => (
        <AuroraRibbon
          key={r.id}
          angle={r.angle}
          phase={r.phase}
          height={plantHeight * 1.1}
          color={color}
          hue={r.hue}
        />
      ))}
    </group>
  );
}

function AuroraRibbon({
  angle, phase, height, color, hue,
}: {
  angle: number; phase: number; height: number; color: string; hue: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const ribbonColor = hue === 0 ? "#40ffaa" : hue === 1 ? "#aa60ff" : color;

  useThrottledFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = angle + Math.sin(clock.elapsedTime * 0.15 + phase) * 0.2;
    (ref.current.material as THREE.MeshStandardMaterial).opacity =
      0.18 + Math.sin(clock.elapsedTime * 0.8 + phase) * 0.08;
  });

  return (
    <mesh ref={ref} rotation={[0, angle, 0]}>
      <planeGeometry args={[0.8, height, 1, 16]} />
      <meshStandardMaterial
        color={ribbonColor}
        emissive={ribbonColor}
        emissiveIntensity={0.45}
        transparent
        opacity={0.22}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ── Small orbiting moons ─────────────────────────────────────────────────
function OrbitingMoon({ seed, plantHeight, centerY }: {
  seed: number; plantHeight: number; centerY: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const phase = seed * 2.3;
  const orbitR = 5 + seed * 1.8 + plantHeight * 0.15;
  const spd = 0.12 + seed * 0.03;
  const moonColors = ["#c8c8d0", "#d0c0a8", "#a8b8c8"];

  useThrottledFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * spd + phase;
    ref.current.position.set(
      Math.cos(t) * orbitR,
      centerY + plantHeight * 0.3 + Math.sin(t * 0.5) * 2,
      Math.sin(t) * orbitR
    );
  });

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.18 + seed * 0.04, 12, 12]} />
        <meshStandardMaterial
          color={moonColors[seed % 3]!}
          emissive="#888890"
          emissiveIntensity={0.12}
          roughness={0.85}
        />
      </mesh>
      {/* Crater dots for readability */}
      <mesh position={[0.06, 0.04, 0.08]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color="#888888" roughness={0.95} />
      </mesh>
    </group>
  );
}

// ── Comet streak — rare dramatic pass ────────────────────────────────────
function CometStreak({ plantHeight, centerY }: { plantHeight: number; centerY: number }) {
  const headRef = useRef<THREE.Mesh>(null);
  const tailRef = useRef<THREE.Mesh>(null);

  useThrottledFrame(({ clock }) => {
    const cycle = 38;
    const p = (clock.elapsedTime % cycle) / cycle;
    if (!headRef.current || !tailRef.current) return;

    const visible = p > 0.05 && p < 0.35;
    headRef.current.visible = visible;
    tailRef.current.visible = visible;
    if (!visible) return;

    const t = (p - 0.05) / 0.3;
    headRef.current.position.set(
      THREE.MathUtils.lerp(-20, 20, t),
      centerY + plantHeight * 0.7 + Math.sin(t * Math.PI) * 4,
      -12 + t * 8
    );
    tailRef.current.position.copy(headRef.current.position);
    tailRef.current.position.x -= 2.5;
    tailRef.current.rotation.z = 0.3;
  });

  return (
    <group>
      <mesh ref={headRef} visible={false}>
        <sphereGeometry args={[0.25, 10, 10]} />
        <meshStandardMaterial color="#ffffff" emissive="#aaccff" emissiveIntensity={1.4} />
      </mesh>
      <mesh ref={tailRef} visible={false}>
        <coneGeometry args={[0.15, 3.5, 8]} />
        <meshStandardMaterial
          color="#88bbff"
          emissive="#4488ff"
          emissiveIntensity={0.6}
          transparent
          opacity={0.45}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ── Floating energy seeds — stage 65+ ────────────────────────────────────
function EnergySeeds({ stage, plantHeight, centerY, accent }: {
  stage: number; plantHeight: number; centerY: number; accent: string;
}) {
  const seeds = useMemo(() => {
    const count = Math.min(4 + Math.floor((stage - 65) / 5), 12);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (i / count) * Math.PI * 2,
      r: 2 + (i % 4) * 0.8,
      phase: i * 1.4,
    }));
  }, [stage]);

  return (
    <>
      {seeds.map((s) => (
        <EnergySeed key={s.id} {...s} plantHeight={plantHeight} centerY={centerY} accent={accent} />
      ))}
    </>
  );
}

function EnergySeed({
  angle, r, phase, plantHeight, centerY, accent,
}: {
  angle: number; r: number; phase: number; plantHeight: number; centerY: number; accent: string;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useThrottledFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * 0.3 + phase;
    ref.current.position.set(
      Math.cos(angle + t * 0.2) * r,
      centerY + ((t * 0.4 + phase) % plantHeight),
      Math.sin(angle + t * 0.2) * r
    );
    ref.current.rotation.y += 0.02;
  });

  return (
    <mesh ref={ref}>
      <octahedronGeometry args={[0.12, 0]} />
      <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.7} transparent opacity={0.85} />
    </mesh>
  );
}

export function HighStageEffects({ stage, growth }: Props) {
  if (stage < 50) return null;

  const device = useDeviceInfo();
  const bounds = getPlantWorldBounds(stage, growth);
  const colors = getStageColor(stage);
  const moonCount = device.isPhone
    ? Math.min(1 + Math.floor((stage - 50) / 25), 2)
    : Math.min(1 + Math.floor((stage - 50) / 15), 4);

  return (
    <group>
      <SolarSystem stage={stage} plantHeight={bounds.worldHeight} plantTop={bounds.top} />
      {!device.isPhone && (
        <AuroraRibbons stage={stage} plantHeight={bounds.worldHeight} centerY={bounds.centerY} color={colors.accent} />
      )}
      {Array.from({ length: moonCount }, (_, i) => (
        <OrbitingMoon key={i} seed={i} plantHeight={bounds.worldHeight} centerY={bounds.centerY} />
      ))}
      {stage >= 70 && !device.isPhone && <CometStreak plantHeight={bounds.worldHeight} centerY={bounds.centerY} />}
      {stage >= 65 && !device.isPhone && (
        <EnergySeeds stage={stage} plantHeight={bounds.worldHeight} centerY={bounds.centerY} accent={colors.accent} />
      )}
    </group>
  );
}
