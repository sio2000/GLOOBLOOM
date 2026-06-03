"use client";

import { useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { isWorldPointVisible } from "@/lib/sceneVisibility";
import { usePerformanceStore } from "@/store/usePerformanceStore";
import { shouldRunAnimationFrames } from "@/lib/sceneRuntime";

interface Props {
  children: React.ReactNode;
  worldY?: number;
  radius?: number;
}

/** Unmounts subtree when far outside camera frustum — saves draw + updates. */
export function SceneVisibilityGate({
  children,
  worldY = 0,
  radius = 14,
}: Props) {
  const camera = useThree((s) => s.camera);
  const drawScale = usePerformanceStore((s) => s.settings().drawDistanceScale);
  const [visible, setVisible] = useState(true);
  const maxDist = 90 * drawScale;

  useFrame(() => {
    if (!shouldRunAnimationFrames()) return;
    const v = isWorldPointVisible(camera, worldY, radius, maxDist);
    setVisible((prev) => (prev === v ? prev : v));
  });

  if (!visible) return null;
  return <>{children}</>;
}
