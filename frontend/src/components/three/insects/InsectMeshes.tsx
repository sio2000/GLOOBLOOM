"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useThrottledFrame } from "@/hooks/useThrottledFrame";
const LADYBUG_RED = "#c62828";
const LADYBUG_DARK = "#1a1010";
const LADYBUG_SPOT = "#0d0d0d";
const CAT_GREEN_A = "#4caf50";
const CAT_GREEN_B = "#388e3c";
const CAT_YELLOW = "#cddc39";

export type CaterpillarMotionPattern = 0 | 1 | 2;

/** Detailed ladybug with head, elytra, spots, legs, and antennae. */
export function LadybugMesh({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 0.012, 0]}>
        <sphereGeometry args={[0.028, 12, 12]} />
        <meshStandardMaterial color={LADYBUG_RED} emissive="#601010" emissiveIntensity={0.12} roughness={0.45} />
      </mesh>
      <mesh position={[0.024, 0.014, 0]}>
        <sphereGeometry args={[0.014, 10, 10]} />
        <meshStandardMaterial color={LADYBUG_DARK} roughness={0.55} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={`eye-${side}`} position={[0.032, 0.018, side * 0.008]}>
          <sphereGeometry args={[0.004, 6, 6]} />
          <meshStandardMaterial color="#f5f5f5" emissive="#ffffff" emissiveIntensity={0.15} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh
          key={`ant-${side}`}
          position={[0.038, 0.022, side * 0.006]}
          rotation={[0.3, side * 0.4, 0]}
        >
          <capsuleGeometry args={[0.0015, 0.018, 2, 4]} />
          <meshStandardMaterial color={LADYBUG_DARK} />
        </mesh>
      ))}
      <mesh position={[0, 0.016, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.004, 0.042, 0.001]} />
        <meshStandardMaterial color={LADYBUG_DARK} />
      </mesh>
      {[
        [0.008, 0.018, 0.012],
        [-0.006, 0.02, 0.014],
        [0.004, 0.016, -0.013],
        [-0.01, 0.018, -0.011],
        [0, 0.022, 0],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[0.005, 6, 6]} />
          <meshStandardMaterial color={LADYBUG_SPOT} roughness={0.7} />
        </mesh>
      ))}
      {[-1, 1].flatMap((side) =>
        [0, 1, 2].map((leg) => (
          <mesh
            key={`leg-${side}-${leg}`}
            position={[leg * 0.01 - 0.01, -0.004, side * 0.022]}
            rotation={[0.6, 0, side * 0.65]}
          >
            <capsuleGeometry args={[0.002, 0.014, 2, 4]} />
            <meshStandardMaterial color={LADYBUG_DARK} />
          </mesh>
        ))
      )}
    </group>
  );
}

const SEGMENT_COUNT = 8;
const SEGMENT_SPACING = 0.034;

/** Segmented caterpillar with animated body wave. Oriented along +X (head at +X). */
export function CaterpillarMesh({
  scale = 1,
  pattern = 0,
  slow = false,
}: {
  scale?: number;
  pattern?: CaterpillarMotionPattern;
  slow?: boolean;
}) {
  const segmentsRef = useRef<(THREE.Group | null)[]>([]);

  useThrottledFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pace = slow ? 0.35 : 1;
    const waveSpeed = (pattern === 0 ? 3.2 : pattern === 1 ? 5.8 : 2.4) * pace;
    const waveAmp = (pattern === 0 ? 0.005 : pattern === 1 ? 0.009 : 0.004) * (slow ? 0.85 : 1);
    const twistAmp = (pattern === 0 ? 0.07 : pattern === 1 ? 0.12 : 0.05) * (slow ? 0.8 : 1);

    segmentsRef.current.forEach((seg, i) => {
      if (!seg) return;
      const phase = t * waveSpeed - i * 0.62;
      seg.position.y = Math.sin(phase) * waveAmp;
      seg.rotation.z = Math.sin(phase * 0.9) * twistAmp;
      if (pattern === 1) {
        seg.position.x = i * SEGMENT_SPACING + Math.max(0, Math.sin(phase)) * 0.003;
      }
    });
  });

  return (
    <group scale={scale}>
      <mesh position={[SEGMENT_SPACING * (SEGMENT_COUNT - 0.5) + 0.02, 0.008, 0]}>
        <sphereGeometry args={[0.022, 12, 12]} />
        <meshStandardMaterial color={CAT_GREEN_A} emissive="#2a6018" emissiveIntensity={0.1} roughness={0.55} />
      </mesh>
      <mesh position={[SEGMENT_SPACING * (SEGMENT_COUNT - 0.5) + 0.034, 0.014, 0.012]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial color={CAT_GREEN_B} roughness={0.5} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh
          key={`eye-${side}`}
          position={[SEGMENT_SPACING * (SEGMENT_COUNT - 0.5) + 0.028, 0.014, side * 0.012]}
        >
          <sphereGeometry args={[0.004, 6, 6]} />
          <meshStandardMaterial color="#101010" />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <group key={`true-${side}`} position={[SEGMENT_SPACING * (SEGMENT_COUNT - 1.2), -0.004, side * 0.014]}>
          {[0, 1, 2].map((leg) => (
            <mesh
              key={leg}
              position={[leg * 0.008, 0, 0]}
              rotation={[0.7, 0, side * 0.55]}
            >
              <capsuleGeometry args={[0.002, 0.012, 2, 4]} />
              <meshStandardMaterial color={LADYBUG_DARK} />
            </mesh>
          ))}
        </group>
      ))}
      {Array.from({ length: SEGMENT_COUNT }, (_, i) => {
        const x = i * SEGMENT_SPACING;
        const radius = 0.02 - i * 0.0012;
        const color = i % 2 === 0 ? CAT_GREEN_A : CAT_GREEN_B;
        const band = i % 3 === 1 ? CAT_YELLOW : color;
        return (
          <group
            key={i}
            ref={(el) => {
              segmentsRef.current[i] = el;
            }}
            position={[x, 0, 0]}
          >
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <capsuleGeometry args={[radius, SEGMENT_SPACING * 0.82, 6, 10]} />
              <meshStandardMaterial color={band} emissive="#1a5010" emissiveIntensity={0.08} roughness={0.58} />
            </mesh>
            {[-1, 1].map((side) => (
              <mesh
                key={side}
                position={[0, -radius * 0.85, side * radius * 1.1]}
                rotation={[0.4, 0, side * 0.45]}
              >
                <capsuleGeometry args={[0.0025, 0.01, 2, 4]} />
                <meshStandardMaterial color={LADYBUG_DARK} />
              </mesh>
            ))}
            {i % 2 === 0 && (
              <mesh position={[0, radius * 1.05, 0]}>
                <coneGeometry args={[0.004, 0.012, 4]} />
                <meshStandardMaterial color={CAT_YELLOW} emissive="#a0c020" emissiveIntensity={0.12} />
              </mesh>
            )}
          </group>
        );
      })}
      <mesh position={[-0.012, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.012, 0.022, 5]} />
        <meshStandardMaterial color={CAT_GREEN_B} roughness={0.6} />
      </mesh>
    </group>
  );
}

/** Body length in local units (for path animation). */
export const CATERPILLAR_BODY_LENGTH = SEGMENT_SPACING * SEGMENT_COUNT;
