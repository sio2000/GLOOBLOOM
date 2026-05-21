"use client";

import { Suspense, useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Stars,
  AdaptiveDpr,
  PerformanceMonitor,
  Preload,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { OrganismCore } from "./OrganismCore";
import { BranchSystem } from "./BranchSystem";
import { FlowerSystem } from "./FlowerSystem";
import { ParticleField } from "./ParticleField";
import { CreatureSystem } from "./CreatureSystem";
import { AtmosphereSystem } from "./AtmosphereSystem";
import { LeafSystem } from "./LeafSystem";
import { WateringFlameSystem } from "./WateringFlameSystem";
import { MajorBranchSystem } from "./MajorBranchSystem";
import { CrownBouquet } from "./CrownBouquet";
import { GiantFlyingInsects } from "./GiantFlyingInsects";
import { HighStageEffects } from "./HighStageEffects";
import { useOrganismStore } from "@/store/useOrganismStore";
import { useCameraStore } from "@/store/useCameraStore";
import { usePerformanceStore } from "@/store/usePerformanceStore";
import { STAGE_COLORS, Season } from "@/types/organism";
import { getScales, getCameraLimits } from "@/lib/plantScale";
import { scaledCount } from "@/lib/performance";
import { useDeviceInfo } from "@/hooks/useDeviceInfo";

function SceneLighting({ stage, season, hydration, castShadow, shadowMapSize }: {
  stage: number; season: Season; hydration: number;
  castShadow: boolean; shadowMapSize: number;
}) {
  const ambientRef   = useRef<THREE.AmbientLight>(null);
  const mainLightRef = useRef<THREE.PointLight>(null);
  const rimLightRef  = useRef<THREE.PointLight>(null);
  const fillLightRef = useRef<THREE.PointLight>(null);
  const colors = STAGE_COLORS[Math.min(stage, 100)] ?? STAGE_COLORS[1]!;

  const seasonAmbient: Record<Season, string> = {
    bloom:        "#162616",
    mist:         "#141e28",
    golden_decay: "#221a06",
    neon_rain:    "#0e0618",
  };

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ambientRef.current)   ambientRef.current.intensity = 0.28 + stage * 0.002;
    if (mainLightRef.current) {
      mainLightRef.current.position.x = Math.sin(t * 0.25) * 2.8;
      mainLightRef.current.position.z = Math.cos(t * 0.20) * 2.8;
      mainLightRef.current.position.y = 1.8 + Math.sin(t * 0.15) * 0.5;
      mainLightRef.current.intensity = 0.90 + (hydration / 100) * 0.35 + Math.sin(t * 0.8) * 0.08;
    }
    if (rimLightRef.current)  rimLightRef.current.intensity = 0.45 + Math.sin(t * 0.6 + 2) * 0.08;
    if (fillLightRef.current) fillLightRef.current.intensity = 0.35 + Math.sin(t * 0.4) * 0.05;
  });

  return (
    <>
      <ambientLight color="#ffffff" intensity={0.90} />
      <ambientLight ref={ambientRef} color={seasonAmbient[season]} intensity={0.28} />
      <pointLight color="#30a828" intensity={0.65} position={[0, 2.5, 3.5]} distance={12} decay={1.8} />
      <pointLight ref={mainLightRef} color={colors.glow}   intensity={0.90} position={[2, 1.8, 2]}   distance={14} decay={1.5} castShadow={castShadow} shadow-mapSize={[shadowMapSize, shadowMapSize]} />
      <pointLight ref={rimLightRef}  color={colors.accent}  intensity={0.45} position={[-2, 1.0, -3]} distance={10} decay={2} />
      <pointLight ref={fillLightRef} color={colors.core}    intensity={0.35} position={[0, -0.5, 0]}  distance={6}  decay={2} />
      <directionalLight color="#ffffff" intensity={0.40} position={[3, 8, 3]} />
    </>
  );
}

function PostProcessing({ stage, enabled, multisampling }: { stage: number; enabled: boolean; multisampling: number }) {
  if (!enabled) return null;
  const bloomIntensity = 0.025 + Math.min(stage, 100) * 0.0015;

  return (
    <EffectComposer multisampling={multisampling}>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={0.92}
        luminanceSmoothing={0.85}
        radius={0.28}
        blendFunction={BlendFunction.ADD}
      />
      <Vignette offset={0.35} darkness={0.55} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}

function CameraRig({
  limits,
  isMobile,
}: {
  limits: ReturnType<typeof getCameraLimits>;
  isMobile: boolean;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const viewOffsetY = useCameraStore((s) => s.viewOffsetY);
  const targetVec = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const targetY = limits.targetY + viewOffsetY;
    targetVec.set(0, targetY, 0);
    controls.target.lerp(targetVec, Math.min(1, delta * 6));
    controls.update();
  });

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.minDistance = limits.minDistance;
    controls.maxDistance = limits.maxDistance;
    controls.update();
  }, [limits.minDistance, limits.maxDistance]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={!isMobile}
      enableZoom
      enableDamping
      dampingFactor={0.06}
      minDistance={limits.minDistance}
      maxDistance={limits.maxDistance}
      maxPolarAngle={Math.PI * 0.92}
      minPolarAngle={Math.PI * 0.02}
      rotateSpeed={isMobile ? 0.55 : 0.45}
      zoomSpeed={isMobile ? 0.85 : 1.5}
      panSpeed={isMobile ? 0.4 : 0.65}
      autoRotate
      autoRotateSpeed={isMobile ? 0.08 : 0.12}
      makeDefault
    />
  );
}

function CameraSetup({
  limits,
  isMobile,
}: {
  limits: ReturnType<typeof getCameraLimits>;
  isMobile: boolean;
}) {
  const { camera } = useThree();

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = limits.fov;
    }
    camera.near = 0.05;
    camera.far = Math.max(800, limits.fogFar * 2);
    camera.position.set(0, limits.cameraY, limits.cameraZ);
    camera.updateProjectionMatrix();
  }, [camera, limits.cameraY, limits.cameraZ, limits.fov, limits.fogFar]);

  return <CameraRig limits={limits} isMobile={isMobile} />;
}

function PerformanceController() {
  const init = usePerformanceStore((s) => s.init);
  const degrade = usePerformanceStore((s) => s.degrade);
  const improve = usePerformanceStore((s) => s.improve);
  const device = useDeviceInfo();

  useEffect(() => { init(); }, [init]);

  return (
    <PerformanceMonitor
      flipflops={device.isMobile ? 2 : 4}
      onDecline={degrade}
      onIncline={improve}
    />
  );
}

function SceneContent() {
  const state          = useOrganismStore((s) => s.state);
  const leaves         = useOrganismStore((s) => s.leaves);
  const activeCreatures = useOrganismStore((s) => s.activeCreatures);
  const perf = usePerformanceStore((s) => s.settings());
  const device = useDeviceInfo();

  if (!state) return null;

  const { hydration, growth, decay, ecosystemStage: stage, season } = state;
  const { widthScale, heightScale } = getScales(stage);
  const cameraLimits = getCameraLimits(stage, growth, {
    isMobile: device.isMobile,
    isPortrait: device.isPortrait,
    isPhone: device.isPhone,
  });
  const starBase = stage >= 20 ? Math.min(1000 + stage * 80, 8000) : 800;
  const starCount = scaledCount(starBase, perf.starsMultiplier);

  return (
    <>
      <CameraSetup limits={cameraLimits} isMobile={device.isMobile} />
      <SceneLighting
        stage={stage}
        season={season}
        hydration={hydration}
        castShadow={perf.shadows}
        shadowMapSize={perf.shadowMapSize || 256}
      />

      <Stars
        radius={100}
        depth={60}
        count={starCount}
        factor={3.5}
        saturation={0.5}
        fade
        speed={0.25}
      />

      <AtmosphereSystem stage={stage} season={season} hydration={hydration} decay={decay} />

      <group position={[0, -0.3, 0]} scale={[widthScale, heightScale, widthScale]}>
        <OrganismCore hydration={hydration} growth={growth} decay={decay} stage={stage} />
        <BranchSystem stage={stage} growth={growth} hydration={hydration} decay={decay} />
        <FlowerSystem stage={stage} hydration={hydration} growth={growth} />
        <LeafSystem leaves={leaves} stage={stage} growth={growth} />
        <MajorBranchSystem stage={stage} growth={growth} hydration={hydration} leaves={leaves} />
        <CrownBouquet stage={stage} hydration={hydration} growth={growth} />
      </group>

      <WateringFlameSystem stage={stage} growth={growth} />
      <ParticleField stage={stage} hydration={hydration} season={season} growth={growth} />
      <CreatureSystem
        stage={stage}
        hydration={hydration}
        activeCreatures={activeCreatures}
        heightScale={heightScale}
        growth={growth}
      />
      <GiantFlyingInsects stage={stage} growth={growth} />

      <HighStageEffects stage={stage} growth={growth} />
      <PostProcessing stage={stage} enabled={perf.bloom} multisampling={perf.bloomMultisampling} />
    </>
  );
}

export function GloobloomScene() {
  const state = useOrganismStore((s) => s.state);
  const stage = state?.ecosystemStage ?? 1;
  const growth = state?.growth ?? 0;
  const perf = usePerformanceStore((s) => s.settings());
  const initPerf = usePerformanceStore((s) => s.init);
  const device = useDeviceInfo();
  const fogColor = (STAGE_COLORS[Math.min(stage, 100)] ?? STAGE_COLORS[1]!).fog;
  const cameraLimits = getCameraLimits(stage, growth, {
    isMobile: device.isMobile,
    isPortrait: device.isPortrait,
    isPhone: device.isPhone,
  });

  useEffect(() => { initPerf(); }, [initPerf]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] touch-none">
      <Canvas
        shadows={perf.shadows}
        dpr={perf.dpr}
        camera={{
          position: [0, cameraLimits.cameraY, cameraLimits.cameraZ],
          fov: cameraLimits.fov,
          near: 0.05,
          far: Math.max(800, cameraLimits.fogFar * 2),
        }}
        gl={{
          antialias: perf.antialias,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.80,
        }}
        scene={{ background: new THREE.Color(fogColor) }}
      >
        <AdaptiveDpr pixelated />
        <PerformanceController />
        <fog attach="fog" args={[fogColor, cameraLimits.fogNear, cameraLimits.fogFar]} />

        <Suspense fallback={null}>
          <SceneContent />
          {!device.isPhone && <Preload all />}
        </Suspense>
      </Canvas>
    </div>
  );
}
