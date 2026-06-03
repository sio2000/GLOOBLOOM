"use client";

import { Suspense, useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
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
import { requestSceneRender } from "@/lib/sceneRuntime";

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
}: {
  limits: ReturnType<typeof getCameraLimits>;
  isMobile: boolean;
  staticCamera: boolean;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const viewOffsetY = useCameraStore((s) => s.viewOffsetY);
  const targetVec = useMemo(() => new THREE.Vector3(), []);

  useAdaptiveFrame((_, delta) => {
    if (staticCamera) return;
    const controls = controlsRef.current;
    if (!controls) return;
    const targetY = limits.targetY + viewOffsetY;
    targetVec.set(0, targetY, 0);
    controls.target.lerp(targetVec, Math.min(1, delta * 6));
    controls.update();
  });

  useEffect(() => {
    if (!staticCamera) return;
    const controls = controlsRef.current;
    if (!controls) return;
    const targetY = limits.targetY + viewOffsetY;
    controls.target.set(0, targetY, 0);
    controls.update();
    requestSceneRender();
  }, [staticCamera, limits.targetY, viewOffsetY]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.minDistance = limits.minDistance;
    controls.maxDistance = limits.maxDistance;
    controls.update();
    requestSceneRender();
  }, [limits.minDistance, limits.maxDistance]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={!isMobile}
      enableZoom
      enableDamping={!staticCamera}
      dampingFactor={0.06}
      minDistance={limits.minDistance}
      maxDistance={limits.maxDistance}
      maxPolarAngle={Math.PI * 0.92}
      minPolarAngle={Math.PI * 0.02}
      rotateSpeed={isMobile ? 0.65 : 0.45}
      zoomSpeed={isMobile ? 1.1 : 1.5}
      panSpeed={isMobile ? 0.4 : 0.65}
      enableRotate
      autoRotate={false}
      makeDefault
      onChange={() => {
        requestSceneRender();
      }}
    />
  );
}

/** Keeps fog end beyond camera distance so zoom-out does not wash the scene to black. */
function ZoomAwareFog({
  stage,
  baseNear,
  baseFar,
  targetY,
}: {
  stage: number;
  baseNear: number;
  baseFar: number;
  targetY: number;
}) {
  const { camera, scene } = useThree();
  const viewOffsetY = useCameraStore((s) => s.viewOffsetY);
  const target = useMemo(() => new THREE.Vector3(), []);
  const fogColor = useMemo(() => new THREE.Color(getStageColor(stage).fog), [stage]);

  const apply = () => {
    target.set(0, targetY + viewOffsetY, 0);
    const dist = camera.position.distanceTo(target);
    const far = Math.max(baseFar, dist * 7, baseFar * 1.8);
    const near = Math.min(baseNear, Math.max(12, dist * 0.22));
    if (!scene.fog || !(scene.fog instanceof THREE.Fog)) {
      scene.fog = new THREE.Fog(fogColor.getHex(), near, far);
    } else {
      scene.fog.near = near;
      scene.fog.far = far;
      scene.fog.color.copy(fogColor);
    }
  };

  useEffect(() => {
    apply();
    requestSceneRender();
  }, [stage, baseNear, baseFar, targetY, viewOffsetY]);

  useFrame(() => {
    apply();
  });

  return null;
}

function CameraSetup({
  limits,
  isMobile,
  staticCamera,
}: {
  limits: ReturnType<typeof getCameraLimits>;
  isMobile: boolean;
  staticCamera: boolean;
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
    <CameraRig limits={limits} isMobile={isMobile} staticCamera={staticCamera} />
  );
}

function SceneContent() {
  const state = useOrganismStore((s) => s.state);
  const leaves = useOrganismStore((s) => s.leaves);
  const perf = usePerformanceStore((s) => s.settings());
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
  const starCount = perf.enableStars
    ? Math.min(
        perf.maxStarCount,
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
      />
      <SceneLighting
        stage={stage}
        season={season}
        hydration={hydration}
        castShadow={perf.shadows}
        shadowMapSize={perf.shadowMapSize || 256}
        staticMode={perf.mobileStatic}
      />

      {starCount > 0 && (
        <Stars
          radius={100}
          depth={60}
          count={starCount}
          factor={3.5}
          saturation={0.5}
          fade
          speed={perf.mobileStatic ? 0 : 0.25}
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

      <ZoomAwareFog
        stage={stage}
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
  const sceneBg = useMemo(() => {
    const c = getStageColor(stage ?? 1);
    const col = new THREE.Color(c.fog);
    col.lerp(new THREE.Color(c.glow), device.isMobile ? 0.2 : 0.1);
    return col;
  }, [stage, device.isMobile]);
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
      >
        <AdaptiveDpr pixelated />
        <Suspense fallback={null}>
          <SceneContent />
          {tier === "ultra" || tier === "high" ? <Preload all /> : null}
        </Suspense>
      </Canvas>
    </div>
  );
}
