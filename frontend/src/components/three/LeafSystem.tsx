"use client";

import { useRef, useMemo, useEffect } from "react";
import { useAdaptiveFrame } from "@/hooks/useAdaptiveFrame";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { LeafData } from "@/types/organism";
import { filterTrunkLeaves } from "@/lib/majorBranches";
import { usePerformanceStore } from "@/store/usePerformanceStore";

interface Props {
  leaves: LeafData[];
  stage?: number;
  growth?: number;
}

function makeLeafGeo(w = 0.09, h = 0.24): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo( w * 0.55, h * 0.06,  w,       h * 0.32, w * 0.82, h * 0.56);
  shape.bezierCurveTo( w * 0.62, h * 0.78,  w * 0.20, h * 0.93, 0,        h);
  shape.bezierCurveTo(-w * 0.20, h * 0.93, -w * 0.62, h * 0.78, -w * 0.82, h * 0.56);
  shape.bezierCurveTo(-w,       h * 0.32, -w * 0.55, h * 0.06, 0,        0);
  return new THREE.ShapeGeometry(shape, 18);
}

const LEAF_GEO = makeLeafGeo();
const VEIN_GEO = new THREE.CapsuleGeometry(0.004, 0.18, 3, 6);

function NameLeaf({
  leaf,
  showLabel = true,
  staticLeaf = false,
}: {
  leaf: LeafData;
  showLabel?: boolean;
  staticLeaf?: boolean;
}) {
  const grpRef = useRef<THREE.Group>(null);
  const phase = useMemo(() => (leaf.posX * 3.1 + leaf.posZ * 5.7) % (Math.PI * 2), [leaf.posX, leaf.posZ]);

  const ls = leaf.scale * 1.15;
  const leafH = 0.24 * ls;
  const displayName = (leaf.username?.trim() || "Anonymous").slice(0, 16);
  const fontSize = Math.max(0.028, 0.034 * ls);

  const leafQuaternion = useMemo(() => {
    const outward = new THREE.Vector3(leaf.posX, 0, leaf.posZ);
    if (outward.lengthSq() < 0.0001) outward.set(1, 0, 0);
    else outward.normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), outward);
    const spin = new THREE.Quaternion().setFromAxisAngle(outward, leaf.rotation);
    return spin.multiply(q);
  }, [leaf.posX, leaf.posZ, leaf.rotation]);

  const leafColor = useMemo(() => new THREE.Color(leaf.color || "#4caf50"), [leaf.color]);
  const displayCol = useMemo(
    () => leafColor.clone().lerp(new THREE.Color("#2d9220"), 0.35),
    [leafColor]
  );
  const veinCol = useMemo(
    () => leafColor.clone().lerp(new THREE.Color("#1a6010"), 0.4).getStyle(),
    [leafColor]
  );

  useAdaptiveFrame(({ clock }) => {
    if (staticLeaf || !grpRef.current) return;
    const t = clock.elapsedTime;
    grpRef.current.position.y = leaf.posY + Math.sin(t * 0.5 + phase) * 0.012;
  });

  return (
    <group
      ref={staticLeaf ? undefined : grpRef}
      position={[leaf.posX, leaf.posY, leaf.posZ]}
      quaternion={leafQuaternion}
    >
      <mesh geometry={LEAF_GEO} scale={ls} castShadow renderOrder={1}>
        <meshStandardMaterial
          color={displayCol}
          emissive={displayCol}
          emissiveIntensity={0.12}
          side={THREE.DoubleSide}
          roughness={0.55}
          transparent
          opacity={0.96}
        />
      </mesh>

      <mesh geometry={VEIN_GEO} scale={[ls, ls, ls]} position={[0, 0.09 * ls, 0.003]}>
        <meshStandardMaterial color={veinCol} emissive={veinCol} emissiveIntensity={0.2} transparent opacity={0.75} />
      </mesh>

      <mesh position={[0, -0.06 * ls, 0]}>
        <cylinderGeometry args={[0.003 * ls, 0.005 * ls, 0.10 * ls, 4]} />
        <meshStandardMaterial color="#1a4010" roughness={0.9} />
      </mesh>

      {showLabel && (
        <group position={[0, leafH * 0.48, 0.012 * ls]} rotation={[0, 0, 0]}>
          <Text
            fontSize={fontSize}
            color="#0a0a0a"
            anchorX="center"
            anchorY="middle"
            maxWidth={0.16 * ls}
            textAlign="center"
            renderOrder={10}
            outlineWidth={fontSize * 0.14}
            outlineColor="#ffffff"
            outlineOpacity={0.95}
            fontWeight={700}
            characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-. "
          >
            {displayName}
          </Text>
        </group>
      )}
    </group>
  );
}

export function LeafSystem({ leaves, stage = 1, growth = 0 }: Props) {
  const labelCap = usePerformanceStore((s) => s.settings().labelsMax);
  const mobileStatic = usePerformanceStore((s) => s.settings().mobileStatic);
  const setNamedLeafCount = usePerformanceStore((s) => s.setNamedLeafCount);
  const trunkLeaves = filterTrunkLeaves(leaves, stage, growth);

  useEffect(() => {
    setNamedLeafCount(leaves.length);
  }, [leaves.length, setNamedLeafCount]);

  if (!trunkLeaves.length) return null;

  return (
    <group>
      {trunkLeaves.map((leaf, index) => (
        <NameLeaf
          key={leaf.id}
          leaf={leaf}
          showLabel={index < labelCap}
          staticLeaf={mobileStatic}
        />
      ))}
    </group>
  );
}
