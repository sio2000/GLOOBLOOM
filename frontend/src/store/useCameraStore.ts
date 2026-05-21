import { create } from "zustand";

interface CameraStore {
  viewOffsetY: number;
  nudgeUp: (step: number, max: number) => void;
  nudgeDown: (step: number, max: number) => void;
  resetView: () => void;
}

export const useCameraStore = create<CameraStore>((set, get) => ({
  viewOffsetY: 0,

  nudgeUp: (step, max) =>
    set({ viewOffsetY: Math.min(max, get().viewOffsetY + step) }),

  nudgeDown: (step, max) =>
    set({ viewOffsetY: Math.max(-max, get().viewOffsetY - step) }),

  resetView: () => set({ viewOffsetY: 0 }),
}));
