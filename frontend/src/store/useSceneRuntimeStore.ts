import { create } from "zustand";

interface SceneRuntimeState {
  sceneFrozen: boolean;
  isScrolling: boolean;
  uiInteracting: boolean;
  animationPumpActive: boolean;
  invalidate: (() => void) | null;
  registerInvalidate: (fn: () => void) => void;
  setScrolling: (v: boolean) => void;
  setUiInteracting: (v: boolean) => void;
  setSceneFrozen: (v: boolean) => void;
  setAnimationPump: (v: boolean) => void;
}

export const useSceneRuntimeStore = create<SceneRuntimeState>((set, get) => ({
  sceneFrozen: false,
  isScrolling: false,
  uiInteracting: false,
  animationPumpActive: true,
  invalidate: null,

  registerInvalidate: (fn) => set({ invalidate: fn }),

  setScrolling: (v) => set({ isScrolling: v }),

  setUiInteracting: (v) => set({ uiInteracting: v }),

  setSceneFrozen: (v) => set({ sceneFrozen: v }),

  setAnimationPump: (v) => set({ animationPumpActive: v }),
}));
