"use client";

import { OrganismCore } from "./OrganismCore";
import { BranchSystem } from "./BranchSystem";
import { FlowerSystem } from "./FlowerSystem";
import { LeafSystem } from "./LeafSystem";
import { MajorBranchSystem } from "./MajorBranchSystem";
import { GiantTrunkBranchSystem } from "./GiantTrunkBranchSystem";
import { CrownBouquet } from "./CrownBouquet";
import { ExtendedStageSystems } from "./ExtendedStageSystems";
import { ParticleField } from "./ParticleField";
import { CreatureSystem } from "./CreatureSystem";
import { AtmosphereSystem } from "./AtmosphereSystem";
import { RootMushroomSystem } from "./RootMushroomSystem";
import { RootFeatherSystem } from "./RootFeatherSystem";
import { WateringFlameSystem } from "./WateringFlameSystem";
import { GiantFlyingInsects } from "./GiantFlyingInsects";
import { HighStageEffects } from "./HighStageEffects";
import { SceneVisibilityGate } from "./SceneVisibilityGate";
import { useOrganismStore } from "@/store/useOrganismStore";
import { usePerformanceStore } from "@/store/usePerformanceStore";
import type { Season } from "@/types/organism";
import type { LeafData } from "@/types/organism";

interface Props {
  stage: number;
  growth: number;
  decay: number;
  hydration: number;
  season: Season;
  totalWaterings: number;
  widthScale: number;
  heightScale: number;
  leaves: LeafData[];
}

export function LazyWorldContent({
  stage,
  growth,
  decay,
  hydration,
  season,
  totalWaterings,
  widthScale,
  heightScale,
  leaves,
}: Props) {
  const perf = usePerformanceStore((s) => s.settings());
  const worldPhase = usePerformanceStore((s) => s.worldPhase);
  const activeCreatures = useOrganismStore((s) => s.activeCreatures);

  const phaseOk = (min: number) => worldPhase >= min;

  return (
    <>
      {perf.enableAtmosphere && phaseOk(1) && (
        <SceneVisibilityGate worldY={2}>
          <AtmosphereSystem
            stage={stage}
            season={season}
            hydration={hydration}
            decay={decay}
          />
        </SceneVisibilityGate>
      )}

      {perf.enableRootDecor && phaseOk(2) && (
        <SceneVisibilityGate worldY={-1}>
          <RootMushroomSystem
            stage={stage}
            growth={growth}
            totalWaterings={totalWaterings}
            hydration={hydration}
          />
          <RootFeatherSystem
            stage={stage}
            growth={growth}
            totalWaterings={totalWaterings}
            hydration={hydration}
          />
        </SceneVisibilityGate>
      )}

      <group position={[0, -0.3, 0]} scale={[widthScale, heightScale, widthScale]}>
        <OrganismCore
          hydration={hydration}
          growth={growth}
          decay={decay}
          stage={stage}
        />
        <BranchSystem
          stage={stage}
          growth={growth}
          hydration={hydration}
          decay={decay}
        />
        <FlowerSystem stage={stage} hydration={hydration} growth={growth} />
        <LeafSystem leaves={leaves} stage={stage} growth={growth} />
        <MajorBranchSystem
          stage={stage}
          growth={growth}
          hydration={hydration}
          leaves={leaves}
        />
        <GiantTrunkBranchSystem
          stage={stage}
          growth={growth}
          hydration={hydration}
        />
        <CrownBouquet stage={stage} hydration={hydration} growth={growth} />
        {perf.enableExtendedStage && phaseOk(3) && (
          <ExtendedStageSystems
            stage={stage}
            growth={growth}
            hydration={hydration}
          />
        )}
      </group>

      {perf.enableWateringFlames && phaseOk(2) && (
        <WateringFlameSystem stage={stage} growth={growth} />
      )}

      {perf.enableParticles && phaseOk(2) && (
        <SceneVisibilityGate worldY={4}>
          <ParticleField
            stage={stage}
            hydration={hydration}
            season={season}
            growth={growth}
          />
        </SceneVisibilityGate>
      )}

      {perf.enableCreatures && phaseOk(2) && (
        <CreatureSystem
          stage={stage}
          hydration={hydration}
          activeCreatures={activeCreatures}
          heightScale={heightScale}
          growth={growth}
        />
      )}

      {perf.enableGiantInsects && phaseOk(3) && (
        <GiantFlyingInsects stage={stage} growth={growth} />
      )}

      {perf.enableHighStageFx && phaseOk(3) && (
        <HighStageEffects stage={stage} growth={growth} />
      )}
    </>
  );
}
