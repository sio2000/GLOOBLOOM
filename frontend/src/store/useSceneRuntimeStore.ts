import { create } from "zustand";

interface SceneRuntimeState {
  sceneFrozen: boolean;
  isScrolling: boolean;
  uiInteracting: boolean;
  isCameraInteracting: boolean;
  cameraInteractionEndTimer: ReturnType<typeof setTimeout> | null;
  animationPumpActive: boolean;
  invalidate: (() => void) | null;
  registerInvalidate: (fn: () => void) => void;
  setScrolling: (v: boolean) => void;
  setUiInteracting: (v: boolean) => void;
  setSceneFrozen: (v: boolean) => void;
  setAnimationPump: (v: boolean) => void;
  setCameraInteracting: (v: boolean) => void;
  setCameraInteractionEndTimer: (t: ReturnType<typeof setTimeout> | null) => void;
}

export const useSceneRuntimeStore = create<SceneRuntimeState>((set) => ({
  sceneFrozen: false,
  isScrolling: false,
  uiInteracting: false,
  isCameraInteracting: false,
  cameraInteractionEndTimer: null,
  animationPumpActive: true,
  invalidate: null,

  registerInvalidate: (fn) => set({ invalidate: fn }),

  setScrolling: (v) => set({ isScrolling: v }),

  setUiInteracting: (v) => set({ uiInteracting: v }),

  setSceneFrozen: (v) => set({ sceneFrozen: v }),

  setAnimationPump: (v) => set({ animationPumpActive: v }),

  setCameraInteracting: (v) => set({ isCameraInteracting: v }),

  setCameraInteractionEndTimer: (t) => set({ cameraInteractionEndTimer: t }),
}));
