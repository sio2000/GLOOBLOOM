"use client";

import { useRef, useMemo } from "react";
import { useAdaptiveFrame } from "@/hooks/useAdaptiveFrame";
import * as THREE from "three";
import { getScales, getTrunkMetrics } from "@/lib/plantScale";
import { computeRootPlacements } from "@/lib/rootGrowth";
import {
  type RootFeatherDef,
  getFeatherWorldHeight,
  getVisibleRootFeathers,
  FEATHER_VARIANTS,
} from "@/lib/rootFeathers";
import { usePerformanceStore } from "@/store/usePerformanceStore";
import { geoSeg } from "@/lib/performance";

function makeFeatherVaneGeo(): THREE.ShapeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.08, 0.04, 0.22, 0.18, 0.28, 0.38);
  shape.bezierCurveTo(0.32, 0.52, 0.30, 0.68, 0.22, 0.82);
  shape.bezierCurveTo(0.14, 0.92, 0.06, 0.98, 0, 1.0);
  shape.bezierCurveTo(-0.04, 0.96, -0.10, 0.88, -0.14, 0.78);
  shape.bezierCurveTo(-0.22, 0.62, -0.24, 0.46, -0.20, 0.32);
  shape.bezierCurveTo(-0.14, 0.14, -0.06, 0.04, 0, 0);
  const geo = new THREE.ShapeGeometry(shape, 10);
  geo.translate(0, 0.5, 0);
  return geo;
}

const FEATHER_VANE_GEO = makeFeatherVaneGeo();

function buildFeatherCurve(lean: number, curl: number, outward: THREE.Vector3): THREE.CatmullRomCurve3 {
  const ox = outward.x * lean * 1.35;
  const oz = outward.z * lean * 1.35;
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(ox * 0.25, 0.18 * curl, oz * 0.25),
    new THREE.Vector3(ox * 0.55, 0.42 * curl, oz * 0.55),
    new THREE.Vector3(ox * 0.85, 0.68 * curl, oz * 0.85),
    new THREE.Vector3(ox * 1.15, 0.88, oz * 1.15),
    new THREE.Vector3(ox * 1.35, 1.02, oz * 1.35),
  ]);
}

function RootFeather({
  def,
  targetHeight,
  hydration,
  baseY,
  position,
}: {
  def: RootFeatherDef;
  targetHeight: number;
  hydration: number;
  baseY: number;
  position: [number, number, number];
}) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const vaneGrpRef = useRef<THREE.Group>(null);
  const heightRef = useRef(Math.max(0.04, targetHeight * def.heightMul));
  const mobileStatic = usePerformanceStore((s) => s.settings().mobileStatic);
  const staticH = Math.max(0.04, targetHeight * def.heightMul);
  const geoQuality = usePerformanceStore((s) => s.settings().geoQuality);
  const tubeSegs = geoSeg(48, geoQuality, 24);
  const palette = FEATHER_VARIANTS[def.variant]!;

  const outward = useMemo(() => {
    const v = new THREE.Vector3(Math.cos(def.angle + def.lean), 0, Math.sin(def.angle + def.lean));
    return v.normalize();
  }, [def.angle, def.lean]);

  const curve = useMemo(
    () => buildFeatherCurve(def.lean, def.curl, outward),
    [def.lean, def.curl, outward]
  );

  const shaftGeo = useMemo(
    () => new THREE.TubeGeometry(curve, tubeSegs, 0.008, 6, false),
    [curve, tubeSegs]
  );

  const sampleFrames = useMemo(() => {
    const frames: { pos: THREE.Vector3; tangent: THREE.Vector3; normal: THREE.Vector3; t: number }[] = [];
    const normal = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    const binormal = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const count = 14;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const pos = curve.getPointAt(t);
      curve.getTangentAt(t, tangent).normalize();
      binormal.crossVectors(tangent, up).normalize();
      if (binormal.lengthSq() < 0.001) binormal.set(1, 0, 0);
      normal.crossVectors(binormal, tangent).normalize();
      frames.push({ pos: pos.clone(), tangent: tangent.clone(), normal: normal.clone(), t });
    }
    return frames;
  }, [curve]);

  useAdaptiveFrame(({ clock }, delta) => {
    if (mobileStatic) return;
    const goal = Math.max(0.04, targetHeight * def.heightMul);
    heightRef.current = THREE.MathUtils.lerp(heightRef.current, goal, Math.min(1, delta * 1.5));
    const h = heightRef.current;
    const sway = Math.sin(clock.elapsedTime * 0.55 + def.id * 1.3) * 0.04 * Math.min(1.2, h);
    const flutter = Math.sin(clock.elapsedTime * 2.2 + def.angle) * 0.025;

    if (rootRef.current) {
      rootRef.current.position.set(position[0], baseY, position[2]);
      rootRef.current.rotation.y = def.angle;
    }
    if (bodyRef.current) {
      bodyRef.current.scale.set(h, h, h);
      bodyRef.current.rotation.z = sway + flutter;
      bodyRef.current.rotation.x = sway * 0.35;
    }
    if (vaneGrpRef.current) {
      vaneGrpRef.current.rotation.y = Math.sin(clock.elapsedTime * 1.6 + def.id) * 0.06;
    }
  });

  return (
    <group
      ref={mobileStatic ? undefined : rootRef}
      position={mobileStatic ? [position[0], baseY, position[2]] : undefined}
      rotation-y={mobileStatic ? def.angle : undefined}
    >
      <group
        ref={mobileStatic ? undefined : bodyRef}
        scale={
          mobileStatic
            ? [staticH, staticH, staticH]
            : [heightRef.current, heightRef.current, heightRef.current]
        }
      >
        {/* Root quill base */}
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.06, 10]} />
          <meshStandardMaterial color="#3a4830" roughness={0.92} />
        </mesh>

        {/* Central rachis (shaft) */}
        <mesh geometry={shaftGeo} castShadow>
          <meshStandardMaterial
            color={palette.shaft}
            emissive={palette.shaftEmissive}
            emissiveIntensity={0.08}
            roughness={0.65}
          />
        </mesh>

        {/* Vanes + barbs along curve */}
        <group ref={vaneGrpRef}>
          {sampleFrames.map(({ pos, tangent, normal, t }, i) => {
            if (i === 0 || i === sampleFrames.length - 1) return null;
            const vaneW = 0.06 + t * 0.38;
            const vaneH = 0.12 + t * 0.55;
            const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
            const side = i % 2 === 0 ? 1 : -1;

            return (
              <group key={i} position={pos} quaternion={q}>
                <mesh
                  geometry={FEATHER_VANE_GEO}
                  scale={[vaneW * side, vaneH, 1]}
                  rotation={[0, 0, side * 0.12]}
                  position={[normal.x * 0.012 * side, 0, normal.z * 0.012 * side]}
                >
                  <meshStandardMaterial
                    color={t > 0.75 ? palette.vaneTip : palette.vane}
                    emissive={palette.emissive}
                    emissiveIntensity={0.08 + (hydration / 100) * 0.12 + t * 0.1}
                    side={THREE.DoubleSide}
                    transparent
                    opacity={0.88 - t * 0.08}
                    roughness={0.55}
                  />
                </mesh>
                {/* Barb filaments */}
                {Array.from({ length: 3 }, (_, b) => (
                  <mesh
                    key={b}
                    position={[(b - 1) * 0.04 * side, vaneH * 0.35, 0.004]}
                    rotation={[0, 0, side * (0.3 + b * 0.08)]}
                  >
                    <boxGeometry args={[0.025, 0.002, 0.004]} />
                    <meshStandardMaterial color={palette.barb} transparent opacity={0.7} side={THREE.DoubleSide} />
                  </mesh>
                ))}
              </group>
            );
          })}
        </group>

        {/* Iridescent tip glow */}
        {(() => {
          const tip = curve.getPointAt(1);
          return (
            <>
              <mesh position={tip} scale={0.04}>
                <sphereGeometry args={[1, 8, 8]} />
                <meshStandardMaterial
                  color={palette.accent}
                  emissive={palette.accent}
                  emissiveIntensity={0.6 + (hydration / 100) * 0.4}
                  transparent
                  opacity={0.85}
                />
              </mesh>
              <pointLight
                color={palette.accent}
                intensity={0.12 + (hydration / 100) * 0.18}
                distance={0.8}
                decay={2}
                position={tip}
              />
            </>
          );
        })()}
      </group>
    </group>
  );
}

export function RootFeatherSystem({
  stage,
  growth,
  totalWaterings,
  hydration,
}: {
  stage: number;
  growth: number;
  totalWaterings: number;
  hydration: number;
}) {
  const feathers = useMemo(() => getVisibleRootFeathers(stage), [stage]);
  const targetHeight = getFeatherWorldHeight(totalWaterings, stage, growth);

  const placements = useMemo(
    () => computeRootPlacements(stage, growth, feathers, getScales, getTrunkMetrics),
    [stage, Math.floor(growth / 8), feathers]
  );

  if (feathers.length === 0) return null;

  return (
    <group>
      {placements.map(({ def, position, baseY }) => (
        <RootFeather
          key={def.id}
          def={def as RootFeatherDef}
          targetHeight={targetHeight}
          hydration={hydration}
          baseY={baseY}
          position={position}
        />
      ))}
    </group>
  );
}
