"use client";

import { useMemo, useState, useEffect } from "react";
import * as THREE from "three";
import { LadybugMesh } from "./insects/InsectMeshes";
import { requestSceneRender } from "@/lib/sceneRuntime";

const SHUFFLE_MS = 5 * 60 * 1000;
const MAX_CRITTERS = 3;

function seeded(seed: number, n: number): number {
  const x = Math.sin(seed * 127.1 + n * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function useSlowRootShuffle(
  base: [number, number, number],
  seed: number,
  radius: number
): [number, number, number] {
  const [pos, setPos] = useState(base);

  useEffect(() => {
    const shuffle = () => {
      const t = Date.now() * 0.001 + seed * 19.7;
      setPos([
        base[0] + Math.sin(t) * radius,
        base[1],
        base[2] + Math.cos(t * 1.17) * radius,
      ]);
      requestSceneRender();
    };
    shuffle();
    const id = window.setInterval(shuffle, SHUFFLE_MS);
    return () => window.clearInterval(id);
  }, [base[0], base[1], base[2], seed, radius]);

  return pos;
}

function StaticRootSpider({
  basePosition,
  scale,
  seed,
}: {
  basePosition: [number, number, number];
  scale: number;
  seed: number;
}) {
  const shuffleR = 0.045 * scale;
  const position = useSlowRootShuffle(basePosition, seed, shuffleR);

  return (
    <group position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[0.035, 10, 10]} />
        <meshStandardMaterial
          color="#1a1010"
          emissive="#402020"
          emissiveIntensity={0.12}
          roughness={0.7}
        />
      </mesh>
      <mesh position={[0, 0.02, 0.04]} scale={[1.2, 0.7, 1]}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshStandardMaterial color="#2a1818" roughness={0.75} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.04, -0.01, Math.sin(a) * 0.04]}
            rotation={[0.5, a, 0.3]}
          >
            <capsuleGeometry args={[0.004, 0.08, 3, 5]} />
            <meshStandardMaterial color="#1a1010" />
          </mesh>
        );
      })}
    </group>
  );
}

function StaticRootLadybug({
  basePosition,
  scale,
  seed,
}: {
  basePosition: [number, number, number];
  scale: number;
  seed: number;
}) {
  const shuffleR = 0.04 * scale;
  const position = useSlowRootShuffle(basePosition, seed + 40, shuffleR);

  return (
    <group position={position} rotation={[0, seed * 0.7, 0]}>
      <LadybugMesh scale={scale} />
    </group>
  );
}

export function RootStaticCritters({
  rootY,
  trunkRadius,
  stage,
}: {
  rootY: number;
  trunkRadius: number;
  stage: number;
}) {
  const critters = useMemo(() => {
    const count = Math.min(MAX_CRITTERS, stage >= 12 ? 3 : 2);
    const r = trunkRadius * 1.25 + 0.06;
    const items: {
      id: number;
      type: "spider" | "ladybug";
      pos: [number, number, number];
      scale: number;
      seed: number;
    }[] = [];

    items.push({
      id: 0,
      type: "spider",
      pos: [Math.cos(0.85) * r, rootY + 0.02, Math.sin(0.85) * r],
      scale: Math.max(2.2, trunkRadius * 14),
      seed: 2.1 + stage * 0.03,
    });

    const ladybugCount = count - 1;
    for (let i = 0; i < ladybugCount; i++) {
      const angle = seeded(i + 7, 1) * Math.PI * 2 + 1.2;
      items.push({
        id: i + 1,
        type: "ladybug",
        pos: [Math.cos(angle) * (r + 0.04), rootY + 0.015, Math.sin(angle) * (r + 0.04)],
        scale: Math.max(2.8, trunkRadius * 18),
        seed: 5.5 + i * 2.3 + stage * 0.05,
      });
    }

    return items;
  }, [rootY, trunkRadius, stage]);

  return (
    <group>
      {critters.map((c) =>
        c.type === "spider" ? (
          <StaticRootSpider
            key={c.id}
            basePosition={c.pos}
            scale={c.scale}
            seed={c.seed}
          />
        ) : (
          <StaticRootLadybug
            key={c.id}
            basePosition={c.pos}
            scale={c.scale}
            seed={c.seed}
          />
        )
      )}
    </group>
  );
}
