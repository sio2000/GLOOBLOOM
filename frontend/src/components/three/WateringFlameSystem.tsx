"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useOrganismStore } from "@/store/useOrganismStore";
import { getTrunkWorldYRange } from "@/lib/plantScale";

const FLAME_SEGMENT_COLORS = [
  "#1a8cff",
  "#00e5ff",
  "#38ff70",
  "#b8ff20",
  "#ffd020",
  "#ff9020",
  "#ff40a0",
  "#e0c0ff",
];

interface ActiveFlame {
  id: string;
  progress: number;
  speed: number;
}

function SingleFlame({
  flame,
  bottomY,
  topY,
  onDone,
}: {
  flame: ActiveFlame;
  bottomY: number;
  topY: number;
  onDone: (id: string) => void;
}) {
  const grpRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const progressRef = useRef(0);
  const doneRef = useRef(false);
  const coreMat = useMemo(() => new THREE.MeshStandardMaterial(), []);
  const glowMat = useMemo(() => new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.35, depthWrite: false }), []);

  useFrame(({ clock }, delta) => {
    if (doneRef.current || !grpRef.current) return;

    progressRef.current = Math.min(1, progressRef.current + delta * flame.speed);
    const progress = progressRef.current;
    const segmentIndex = Math.min(7, Math.floor(progress * 8));
    const color = new THREE.Color(FLAME_SEGMENT_COLORS[segmentIndex]!);

    grpRef.current.position.y = bottomY + progress * (topY - bottomY);

    const pulse = 0.85 + Math.sin(clock.elapsedTime * 14) * 0.15;
    if (coreRef.current) coreRef.current.scale.setScalar(0.9 + pulse * 0.25);
    if (glowRef.current) glowRef.current.scale.setScalar(1.6 + pulse * 0.5);

    coreMat.color.copy(color);
    coreMat.emissive.copy(color);
    glowMat.color.copy(color);
    glowMat.emissive.copy(color);

    if (lightRef.current) {
      lightRef.current.color.copy(color);
      lightRef.current.intensity = 2.4 * (1 - progress * 0.25) * (0.8 + pulse * 0.35);
    }

    if (progress >= 1) {
      doneRef.current = true;
      onDone(flame.id);
    }
  });

  return (
    <group ref={grpRef}>
      <pointLight ref={lightRef} intensity={2.4} distance={6} decay={1.6} />
      <mesh ref={glowRef} material={glowMat}>
        <sphereGeometry args={[0.12, 10, 10]} />
      </mesh>
      <mesh ref={coreRef} position={[0, 0.04, 0]} material={coreMat}>
        <coneGeometry args={[0.07, 0.22, 8]} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <coneGeometry args={[0.04, 0.14, 6]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={1.8}
          transparent
          opacity={0.75}
        />
      </mesh>
    </group>
  );
}

export function WateringFlameSystem({
  stage,
  growth,
}: {
  stage: number;
  growth: number;
}) {
  const isWatering = useOrganismStore((s) => s.isWatering);
  const pendingEffects = useOrganismStore((s) => s.pendingWateringEffects);
  const removeEffect = useOrganismStore((s) => s.removeWateringEffect);

  const [flames, setFlames] = useState<ActiveFlame[]>([]);
  const wasWateringRef = useRef(false);
  const seenEffectsRef = useRef<Set<string>>(new Set());

  const { bottom, top } = useMemo(
    () => getTrunkWorldYRange(stage, growth),
    [stage, growth]
  );

  const spawnFlame = () => {
    const id = `flame_${Date.now()}_${Math.random()}`;
    setFlames((prev) => [...prev.slice(-6), { id, progress: 0, speed: 0.85 }]);
  };

  useEffect(() => {
    if (isWatering && !wasWateringRef.current) spawnFlame();
    wasWateringRef.current = isWatering;
  }, [isWatering]);

  useEffect(() => {
    for (const effect of pendingEffects) {
      if (seenEffectsRef.current.has(effect.id)) continue;
      seenEffectsRef.current.add(effect.id);
      spawnFlame();
      setTimeout(() => removeEffect(effect.id), 1500);
    }
  }, [pendingEffects, removeEffect]);

  if (!flames.length) return null;

  return (
    <group>
      {flames.map((flame) => (
        <SingleFlame
          key={flame.id}
          flame={flame}
          bottomY={bottom}
          topY={top}
          onDone={(id) => setFlames((prev) => prev.filter((f) => f.id !== id))}
        />
      ))}
    </group>
  );
}
