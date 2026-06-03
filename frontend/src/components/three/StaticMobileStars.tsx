"use client";

import { Stars } from "@react-three/drei";

/** Fixed starfield for mobile — speed 0, low count, no per-frame updates. */
export function StaticMobileStars({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <Stars
      radius={200}
      depth={70}
      count={count}
      factor={3.2}
      saturation={0.28}
      fade={false}
      speed={0}
    />
  );
}
