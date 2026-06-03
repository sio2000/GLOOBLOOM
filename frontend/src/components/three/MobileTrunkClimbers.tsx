"use client";

import { useMemo } from "react";
import { getTrunkMetrics } from "@/lib/plantScale";
import { mobileInsectScale } from "@/lib/mobileInsectScale";
import {
  CATERPILLAR_LANES,
  LADYBUG_LANES,
  TRUNK_Y_FULL,
  trunkLaneAngle,
  trunkYRange,
} from "@/lib/trunkLanes";
import { TrunkClimber } from "./TrunkClimberCreatures";
import { AnimatedCaterpillar } from "./insects/AnimatedCaterpillar";

interface Props {
  stage: number;
  growth: number;
}

/** Two ladybugs + one caterpillar on mobile trunk. */
export function MobileTrunkClimbers({ stage, growth }: Props) {
  const trunk = useMemo(() => getTrunkMetrics(stage, growth), [stage, growth]);

  const { yMin, yMax } = useMemo(
    () => trunkYRange(trunk.trunkBaseY, trunk.trunkHeight, TRUNK_Y_FULL),
    [trunk]
  );

  const flyScale = useMemo(() => mobileInsectScale(stage, growth), [stage, growth]);

  const ladybugScale = useMemo(() => flyScale * 0.62, [flyScale]);
  const caterpillarScale = useMemo(() => flyScale * 0.68, [flyScale]);

  const ladybugs = useMemo(
    () =>
      [LADYBUG_LANES[1]!, LADYBUG_LANES[3]!].map((lane, i) => ({
        angle: trunkLaneAngle(lane),
        seed: 2.1 + i * 2.7 + stage * 0.03,
        speed: 0.28 + (i % 2) * 0.015,
      })),
    [stage]
  );

  const caterpillars = useMemo(
    () => [
      {
        angle: trunkLaneAngle(CATERPILLAR_LANES[0]!),
        seed: 5.7,
        pattern: 0 as const,
        speed: 0.26,
      },
    ],
    []
  );

  if (stage < 5) return null;

  return (
    <group>
      {ladybugs.map((c, i) => (
        <TrunkClimber
          key={`m-lb-${i}`}
          trunk={trunk}
          yMin={yMin}
          yMax={yMax}
          angle={c.angle}
          trunkR={trunk.trunkRadiusBottom}
          speed={c.speed}
          scale={ladybugScale}
          seed={c.seed}
          mobileCrawl
        />
      ))}
      {caterpillars.map((c, i) => (
        <AnimatedCaterpillar
          key={`m-cat-${i}`}
          trunk={trunk}
          yMin={yMin}
          yMax={yMax}
          angle={c.angle}
          pattern={c.pattern}
          scale={caterpillarScale}
          seed={c.seed}
          speed={c.speed}
          mobileCrawl
        />
      ))}
    </group>
  );
}
