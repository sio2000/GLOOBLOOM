import { create } from "zustand";
import { requestSceneRender } from "@/lib/sceneRuntime";

interface CameraStore {
  viewOffsetY: number;
  nudgeUp: (step: number, max: number) => void;
  nudgeDown: (step: number, max: number) => void;
  shiftViewOffsetY: (delta: number, max: number) => void;
  resetView: () => void;
}

export const useCameraStore = create<CameraStore>((set, get) => ({
  viewOffsetY: 0,

  nudgeUp: (step, max) => {
    set({ viewOffsetY: Math.min(max, get().viewOffsetY + step) });
    requestSceneRender();
  },

  nudgeDown: (step, max) => {
    set({ viewOffsetY: Math.max(-max, get().viewOffsetY - step) });
    requestSceneRender();
  },

  shiftViewOffsetY: (delta, max) => {
    set({
      viewOffsetY: Math.max(-max, Math.min(max, get().viewOffsetY + delta)),
    });
    requestSceneRender();
  },

  resetView: () => {
    set({ viewOffsetY: 0 });
    requestSceneRender();
  },
}));
