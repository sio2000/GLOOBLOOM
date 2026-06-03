import { useRef } from "react";
import { useFrame, type RootState } from "@react-three/fiber";
import * as THREE from "three";
import { usePerformanceStore } from "@/store/usePerformanceStore";
import {
  shouldRunCreatureFrames,
  requestSceneRender,
} from "@/lib/sceneRuntime";
import {
  checkCreatureVisible,
  type CreatureVisibilityCache,
} from "@/lib/creatureVisibility";

export interface CreatureFrameContext {
  clock: THREE.Clock;
  camera: THREE.Camera;
  delta: number;
  /** Returns false when off-screen / too far — skip animation for this frame. */
  checkVisible: (position: THREE.Vector3) => boolean;
  setVisible: (object: THREE.Object3D | null, visible: boolean) => void;
}

/** Throttled updates for flying creatures — real-time clock (not plant animTimeScale). */
export function useCreatureFrame(
  callback: (ctx: CreatureFrameContext) => void,
  seed = 0
) {
  const counter = useRef(0);
  const accumDelta = useRef(0);
  const visCache = useRef<CreatureVisibilityCache>({ last: true, tick: 0 });

  useFrame((state, delta) => {
    if (!shouldRunCreatureFrames()) return;
    const { creatureFrameSkip, enableCreatures } =
      usePerformanceStore.getState().settings();
    if (!enableCreatures || creatureFrameSkip >= 999) return;

    const frameSkip = creatureFrameSkip;
    accumDelta.current += delta;
    counter.current += 1;
    if (counter.current % frameSkip !== 0) return;

    const d = accumDelta.current;
    accumDelta.current = 0;

    const ctx: CreatureFrameContext = {
      clock: state.clock,
      camera: state.camera,
      delta: d,
      checkVisible: (position) =>
        checkCreatureVisible(state.camera, position, seed, visCache.current),
      setVisible: (object, visible) => {
        if (object) object.visible = visible;
      },
    };

    callback(ctx);

    if (
      usePerformanceStore.getState().demandMode &&
      visCache.current.last
    ) {
      requestSceneRender();
    }
  });
}
