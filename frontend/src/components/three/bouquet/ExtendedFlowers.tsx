"use client";

import { useRef, useMemo } from "react";
import { useAdaptiveFrame } from "@/hooks/useAdaptiveFrame";
import * as THREE from "three";

function easeOpen(openT: number) {
  return 1 - Math.pow(1 - openT, 3);
}

export function RoseFlower({
  angle,
  radius,
  height,
  scale,
  openT,
  color,
  hydration,
  phase,
}: {
  angle: number;
  radius: number;
  height: number;
  scale: number;
  openT: number;
  color: string;
  hydration: number;
  phase: number;
}) {
  const grp = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const open = easeOpen(openT);
  const petalColor = useMemo(() => new THREE.Color(color), [color]);
  const emissive = 0.28 + (hydration / 100) * 0.35;

  useAdaptiveFrame(({ clock }) => {
    if (!grp.current || !head.current) return;
    grp.current.position.y = height + Math.sin(clock.elapsedTime * 0.55 + phase) * 0.03 * scale;
    head.current.rotation.z = Math.sin(clock.elapsedTime * 0.4 + phase) * 0.05 * open;
  });

  const layers = 4;
  const petalsPerLayer = 7;

  return (
    <group ref={grp} position={[Math.cos(angle) * radius, height, Math.sin(angle) * radius]} rotation={[0, angle + Math.PI, 0]}>
      <group ref={head} scale={scale * open}>
        {Array.from({ length: layers }, (_, layer) =>
          Array.from({ length: petalsPerLayer }, (_, i) => {
            const a = (i / petalsPerLayer) * Math.PI * 2 + layer * 0.45;
            const tilt = 0.35 + layer * 0.22;
            const w = 0.04 + layer * 0.012;
            const l = 0.08 + layer * 0.025;
            return (
              <mesh key={`${layer}-${i}`} rotation={[tilt, 0, a]} position={[0, layer * 0.012, 0]}>
                <boxGeometry args={[w, l, 0.012]} />
                <meshStandardMaterial color={petalColor} emissive={petalColor} emissiveIntensity={emissive} roughness={0.38} />
              </mesh>
            );
          })
        )}
        <mesh position={[0, 0.04 * scale, 0]}>
          <sphereGeometry args={[0.025 * scale, 10, 10]} />
          <meshStandardMaterial color="#2a6018" emissive="#143010" emissiveIntensity={0.12} />
        </mesh>
      </group>
    </group>
  );
}

export function TulipFlower({
  angle,
  radius,
  height,
  scale,
  openT,
  color,
  hydration,
  phase,
}: {
  angle: number;
  radius: number;
  height: number;
  scale: number;
  openT: number;
  color: string;
  hydration: number;
  phase: number;
}) {
  const grp = useRef<THREE.Group>(null);
  const open = easeOpen(openT);
  const petalColor = useMemo(() => new THREE.Color(color), [color]);
  const emissive = 0.25 + (hydration / 100) * 0.3;

  useAdaptiveFrame(({ clock }) => {
    if (!grp.current) return;
    grp.current.position.y = height + Math.sin(clock.elapsedTime * 0.6 + phase) * 0.025 * scale;
  });

  return (
    <group ref={grp} position={[Math.cos(angle) * radius, height, Math.sin(angle) * radius]} rotation={[0, angle + Math.PI, 0]} scale={scale}>
      <mesh position={[0, 0.06 * open, 0]}>
        <cylinderGeometry args={[0.012 * scale, 0.018 * scale, 0.12 * scale, 8]} />
        <meshStandardMaterial color="#3a7828" roughness={0.82} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        const cup = THREE.MathUtils.lerp(0.15, 0.55, open);
        return (
          <mesh key={i} rotation={[cup, 0, a]} position={[0, 0.12 * scale, 0]}>
            <boxGeometry args={[0.045 * scale, 0.14 * scale, 0.008 * scale]} />
            <meshStandardMaterial color={petalColor} emissive={petalColor} emissiveIntensity={emissive} side={THREE.DoubleSide} roughness={0.35} />
          </mesh>
        );
      })}
    </group>
  );
}

export function LilyFlower({
  angle,
  radius,
  height,
  scale,
  openT,
  color,
  accent,
  hydration,
  phase,
}: {
  angle: number;
  radius: number;
  height: number;
  scale: number;
  openT: number;
  color: string;
  accent: string;
  hydration: number;
  phase: number;
}) {
  const grp = useRef<THREE.Group>(null);
  const open = easeOpen(openT);
  const petalColor = useMemo(() => new THREE.Color(color), [color]);
  const emissive = 0.3 + (hydration / 100) * 0.35;

  useAdaptiveFrame(({ clock }) => {
    if (!grp.current) return;
    grp.current.position.y = height + Math.sin(clock.elapsedTime * 0.5 + phase) * 0.035 * scale;
    grp.current.rotation.z = Math.sin(clock.elapsedTime * 0.35 + phase) * 0.04 * open;
  });

  return (
    <group ref={grp} position={[Math.cos(angle) * radius, height, Math.sin(angle) * radius]} rotation={[-0.2, angle + Math.PI, 0]} scale={scale}>
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} rotation={[0.25 * open, 0, a]} position={[0, 0.02, 0]}>
            <boxGeometry args={[0.035 * scale, 0.2 * scale, 0.006 * scale]} />
            <meshStandardMaterial color={petalColor} emissive={petalColor} emissiveIntensity={emissive} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2 + 0.5;
        return (
          <mesh key={`s-${i}`} rotation={[0.5, 0, a]} position={[0, 0.04 * scale, 0]}>
            <boxGeometry args={[0.004 * scale, 0.08 * scale, 0.003 * scale]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.2} />
          </mesh>
        );
      })}
    </group>
  );
}
