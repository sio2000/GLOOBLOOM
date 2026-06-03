"use client";

import { Suspense, useRef, useMemo, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useAdaptiveFrame } from "@/hooks/useAdaptiveFrame";
import {
  OrbitControls,
  Stars,
  AdaptiveDpr,
  Preload,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useOrganismStore } from "@/store/useOrganismStore";
import { useCameraStore } from "@/store/useCameraStore";
import { usePerformanceStore } from "@/store/usePerformanceStore";
import { useSceneRuntimeStore } from "@/store/useSceneRuntimeStore";
import { getStageColor, Season } from "@/types/organism";
import { MAX_ECOSYSTEM_STAGE } from "@/lib/stageConstants";
import { getScales, getCameraLimits } from "@/lib/plantScale";
import { scaledCount } from "@/lib/performance";
import { useDeviceInfo } from "@/hooks/useDeviceInfo";
import { MobileTouchPan } from "./MobileTouchPan";
import { SceneDemandDriver } from "./SceneDemandDriver";
import { AdaptivePerformanceMonitor } from "./AdaptivePerformanceMonitor";
import { LazyWorldContent } from "./LazyWorldContent";
import { StaticMobileStars } from "./StaticMobileStars";
import { MOBILE_STATIC_STAR_CAP, mobileTierKey } from "@/lib/mobileInsectCaps";
import {
  beginCameraInteraction,
  endCameraInteraction,
  requestSceneRender,
} from "@/lib/sceneRuntime";
import { applyZoomAwareFog } from "@/lib/sceneFog";
import { getSceneSkyColor, SCENE_SKY_HEX } from "@/lib/sceneBackground";

function PostProcessing({
  stage,
  enabled,
  multisampling,
}: {
  stage: number;
  enabled: boolean;
  multisampling: number;
}) {
  if (!enabled) return null;
  const bloomIntensity =
    0.025 + Math.min(stage, MAX_ECOSYSTEM_STAGE) * 0.0015;
  return (
    <EffectComposer multisampling={multisampling}>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={0.92}
        luminanceSmoothing={0.85}
        radius={0.28}
        blendFunction={BlendFunction.ADD}
      />
    </EffectComposer>
  );
}

function SceneLighting({
  stage,
  season,
  hydration,
  castShadow,
  shadowMapSize,
  staticMode,
}: {
  stage: number;
  season: Season;
  hydration: number;
  castShadow: boolean;
  shadowMapSize: number;
  staticMode: boolean;
}) {
  const bright = staticMode ? 1.28 : 1;
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const mainLightRef = useRef<THREE.PointLight>(null);
  const rimLightRef = useRef<THREE.PointLight>(null);
  const fillLightRef = useRef<THREE.PointLight>(null);
  const colors = getStageColor(stage);

  const seasonAmbient: Record<Season, string> = {
    bloom: "#162616",
    mist: "#141e28",
    golden_decay: "#221a06",
    neon_rain: "#0e0618",
  };

  useAdaptiveFrame(({ clock }) => {
    if (staticMode) return;
    const t = clock.elapsedTime;
    if (ambientRef.current)
      ambientRef.current.intensity = 0.28 + stage * 0.002;
    if (mainLightRef.current) {
      mainLightRef.current.position.x = Math.sin(t * 0.25) * 2.8;
      mainLightRef.current.position.z = Math.cos(t * 0.2) * 2.8;
      mainLightRef.current.position.y = 1.8 + Math.sin(t * 0.15) * 0.5;
      mainLightRef.current.intensity =
        0.9 + (hydration / 100) * 0.35 + Math.sin(t * 0.8) * 0.08;
    }
    if (rimLightRef.current)
      rimLightRef.current.intensity = 0.45 + Math.sin(t * 0.6 + 2) * 0.08;
    if (fillLightRef.current)
      fillLightRef.current.intensity = 0.35 + Math.sin(t * 0.4) * 0.05;
  });

  return (
    <>
      <ambientLight color="#ffffff" intensity={0.9 * bright} />
      <ambientLight
        ref={staticMode ? undefined : ambientRef}
        color={seasonAmbient[season]}
        intensity={(0.28 + stage * 0.002) * bright}
      />
      <pointLight
        color="#30a828"
        intensity={0.65 * bright}
        position={[0, 2.5, 3.5]}
        distance={12}
        decay={1.8}
      />
      <pointLight
        ref={staticMode ? undefined : mainLightRef}
        color={colors.glow}
        intensity={(0.9 + (hydration / 100) * 0.35) * bright}
        position={[2, 1.8, 2]}
        distance={14}
        decay={1.5}
        castShadow={castShadow}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
      />
      <pointLight
        ref={staticMode ? undefined : rimLightRef}
        color={colors.accent}
        intensity={0.45 * bright}
        position={[-2, 1.0, -3]}
        distance={10}
        decay={2}
      />
      <pointLight
        ref={staticMode ? undefined : fillLightRef}
        color={colors.core}
        intensity={0.35 * bright}
        position={[0, -0.5, 0]}
        distance={6}
        decay={2}
      />
      <directionalLight color="#ffffff" intensity={0.4 * bright} position={[3, 8, 3]} />
      {staticMode && (
        <hemisphereLight
          color="#b8e8c8"
          groundColor="#1a2818"
          intensity={0.55}
          position={[0, 6, 0]}
        />
      )}
    </>
  );
}

function CameraRig({
  limits,
  isMobile,
  staticCamera,
  fogNear,
  fogFar,
}: {
  limits: ReturnType<typeof getCameraLimits>;
  isMobile: boolean;
  staticCamera: boolean;
  fogNear: number;
  fogFar: number;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const viewOffsetY = useCameraStore((s) => s.viewOffsetY);
  const { camera, scene } = useThree();

  const syncTargetAndFog = () => {
    const controls = controlsRef.current;
    if (!controls) return;
    const targetY = limits.targetY + viewOffsetY;
    controls.target.set(0, targetY, 0);
    controls.update();
    applyZoomAwareFog(scene, camera, targetY, fogNear, fogFar);
  };

  useEffect(() => {
    syncTargetAndFog();
    requestSceneRender(true);
  }, [limits.targetY, viewOffsetY, fogNear, fogFar]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.minDistance = limits.minDistance;
    controls.maxDistance = limits.maxDistance;
    controls.update();
    requestSceneRender(true);
  }, [limits.minDistance, limits.maxDistance]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={!isMobile}
      enableZoom
      enableDamping={false}
      minDistance={limits.minDistance}
      maxDistance={limits.maxDistance}
      maxPolarAngle={Math.PI * 0.92}
      minPolarAngle={Math.PI * 0.02}
      rotateSpeed={isMobile ? 0.5 : 0.45}
      zoomSpeed={isMobile ? 0.55 : 1.5}
      panSpeed={isMobile ? 0.35 : 0.65}
      enableRotate
      autoRotate={false}
      makeDefault
      onStart={() => {
        beginCameraInteraction();
      }}
      onEnd={() => {
        syncTargetAndFog();
        endCameraInteraction(isMobile ? 160 : 80);
      }}
      onChange={() => {
        if (isMobile) {
          const controls = controlsRef.current;
          if (controls) {
            const targetY = limits.targetY + viewOffsetY;
            controls.target.set(0, targetY, 0);
          }
          applyZoomAwareFog(scene, camera, limits.targetY + viewOffsetY, fogNear, fogFar);
        }
        requestSceneRender();
      }}
    />
  );
}

/** Initial fog setup — updates happen from CameraRig on zoom (no per-frame hook). */
function SceneFogBootstrap({
  baseNear,
  baseFar,
  targetY,
}: {
  baseNear: number;
  baseFar: number;
  targetY: number;
}) {
  const { camera, scene } = useThree();
  const viewOffsetY = useCameraStore((s) => s.viewOffsetY);

  useEffect(() => {
    applyZoomAwareFog(scene, camera, targetY + viewOffsetY, baseNear, baseFar);
    requestSceneRender(true);
  }, [baseNear, baseFar, targetY, viewOffsetY, camera, scene]);

  return null;
}

function CameraSetup({
  limits,
  isMobile,
  staticCamera,
  fogNear,
  fogFar,
}: {
  limits: ReturnType<typeof getCameraLimits>;
  isMobile: boolean;
  staticCamera: boolean;
  fogNear: number;
  fogFar: number;
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
    requestSceneRender();
  }, [camera, limits.cameraY, limits.cameraZ, limits.fov, limits.fogFar]);

  return (
    <CameraRig
      limits={limits}
      isMobile={isMobile}
      staticCamera={staticCamera}
      fogNear={fogNear}
      fogFar={fogFar}
    />
  );
}

function SceneContent() {
  const state = useOrganismStore((s) => s.state);
  const leaves = useOrganismStore((s) => s.leaves);
  const perf = usePerformanceStore((s) => s.settings());
  const tier = usePerformanceStore((s) => s.tier);
  const device = useDeviceInfo();

  if (!state) return null;

  const { hydration, growth, decay, ecosystemStage: stage, season, totalWaterings } =
    state;
  const { widthScale, heightScale } = getScales(stage);
  const cameraLimits = getCameraLimits(stage, growth, {
    isMobile: device.isMobile,
    isPortrait: device.isPortrait,
    isPhone: device.isPhone,
  });
  const fogScale =
    perf.tier === "ultra_low" || perf.tier === "low"
      ? 1
      : Math.max(0.88, perf.drawDistanceScale);
  const fogFar = cameraLimits.fogFar * fogScale;
  const mobileStarCap = perf.mobileStatic
    ? MOBILE_STATIC_STAR_CAP[mobileTierKey(tier)]
    : perf.maxStarCount;
  const starCount = perf.enableStars
    ? Math.min(
        mobileStarCap,
        scaledCount(perf.maxStarCount, perf.starsMultiplier)
      )
    : 0;

  return (
    <>
      <SceneDemandDriver />
      <AdaptivePerformanceMonitor />
      <CameraSetup
        limits={cameraLimits}
        isMobile={device.isMobile}
        staticCamera={perf.mobileStatic}
        fogNear={cameraLimits.fogNear}
        fogFar={fogFar}
      />
      <SceneLighting
        stage={stage}
        season={season}
        hydration={hydration}
        castShadow={perf.shadows}
        shadowMapSize={perf.shadowMapSize || 256}
        staticMode={perf.mobileStatic}
      />

      {starCount > 0 && perf.mobileStatic && (
        <StaticMobileStars count={starCount} />
      )}
      {starCount > 0 && !perf.mobileStatic && (
        <Stars
          radius={220}
          depth={120}
          count={starCount}
          factor={4.2}
          saturation={0.35}
          fade={false}
          speed={0.25}
        />
      )}

      <LazyWorldContent
        stage={stage}
        growth={growth}
        decay={decay}
        hydration={hydration}
        season={season}
        totalWaterings={totalWaterings}
        widthScale={widthScale}
        heightScale={heightScale}
        leaves={leaves}
      />

      <PostProcessing
        stage={stage}
        enabled={perf.enablePostProcessing}
        multisampling={perf.bloomMultisampling}
      />

      <SceneFogBootstrap
        baseNear={cameraLimits.fogNear}
        baseFar={fogFar}
        targetY={cameraLimits.targetY}
      />
    </>
  );
}

export function GloobloomScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const state = useOrganismStore((s) => s.state);
  const stage = state?.ecosystemStage ?? 1;
  const growth = state?.growth ?? 0;
  const perf = usePerformanceStore((s) => s.settings());
  const initPerf = usePerformanceStore((s) => s.init);
  const demandMode = usePerformanceStore((s) => s.demandMode);
  const tier = usePerformanceStore((s) => s.tier);
  const device = useDeviceInfo();
  const sceneFrozen = useSceneRuntimeStore((s) => s.sceneFrozen);
  const sceneBg = useMemo(() => getSceneSkyColor(), []);
  const cameraLimits = getCameraLimits(stage, growth, {
    isMobile: device.isMobile,
    isPortrait: device.isPortrait,
    isPhone: device.isPhone,
  });

  const frameloop = sceneFrozen ? "never" : demandMode ? "demand" : "always";

  useEffect(() => {
    initPerf();
  }, [initPerf]);

  useEffect(() => {
    requestSceneRender();
  }, [stage, growth, sceneFrozen, frameloop, tier]);

  return (
    <div ref={containerRef} className="fixed inset-0 w-full h-[100dvh] touch-none">
      <MobileTouchPan containerRef={containerRef} />
      <Canvas
        frameloop={frameloop}
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
          powerPreference:
            tier === "ultra_low" || tier === "low"
              ? "low-power"
              : "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: device.isMobile ? 1.08 : 0.88,
          stencil: false,
          depth: true,
        }}
        scene={{ background: sceneBg }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color(SCENE_SKY_HEX);
        }}
      >
        {!device.isMobile ? <AdaptiveDpr pixelated /> : null}
        <Suspense fallback={null}>
          <SceneContent />
          {tier === "ultra" || tier === "high" ? <Preload all /> : null}
        </Suspense>
      </Canvas>
    </div>
  );
}
