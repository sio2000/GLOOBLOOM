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

/** Four ladybugs + four caterpillars — same visual weight as flying insects. */
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
      LADYBUG_LANES.map((lane, i) => ({
        angle: trunkLaneAngle(lane),
        seed: 2.1 + i * 2.7 + stage * 0.03,
        speed: 0.24 + (i % 2) * 0.018,
      })),
    [stage]
  );

  const caterpillars = useMemo(
    () => [
      {
        angle: trunkLaneAngle(CATERPILLAR_LANES[0]!),
        seed: 5.7,
        pattern: 0 as const,
        speed: 0.22,
      },
      {
        angle: trunkLaneAngle(CATERPILLAR_LANES[1]!),
        seed: 8.2,
        pattern: 1 as const,
        speed: 0.228,
      },
      {
        angle: trunkLaneAngle(CATERPILLAR_LANES[2]!),
        seed: 11.3,
        pattern: 2 as const,
        speed: 0.215,
      },
      {
        angle: trunkLaneAngle(4),
        seed: 14.6,
        pattern: 0 as const,
        speed: 0.22,
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
