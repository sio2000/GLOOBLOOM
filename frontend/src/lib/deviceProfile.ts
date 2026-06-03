/** Hardware + form-factor detection for adaptive quality startup. */

import { getDeviceViewport, type DeviceViewport } from "@/lib/device";

export type DeviceClass = "phone" | "tablet" | "desktop";

export interface DeviceProfile {
  deviceClass: DeviceClass;
  cores: number;
  memoryGb: number;
  isMobile: boolean;
  isPhone: boolean;
  isTouch: boolean;
  gpuTier: 0 | 1 | 2 | 3;
  saveData: boolean;
  lowEnd: boolean;
  score: number;
}

function detectGpuTier(): 0 | 1 | 2 | 3 {
  if (typeof document === "undefined") return 2;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return 0;
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    if (!dbg) return 1;
    const renderer = (
      gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) as string
    ).toLowerCase();
    if (
      /swiftshader|llvmpipe|mesa|intel hd [2-4]|uhd 6[0-2]0|hd graphics 4/.test(
        renderer
      )
    )
      return 0;
    if (/intel|iris xe|uhd 7|hd graphics 5|mali-[gt]5|adreno [45]/.test(renderer))
      return 1;
    if (/nvidia gtx 10|nvidia gtx 16|rx 5[0-9]|mali-g7|adreno 6/.test(renderer))
      return 2;
    if (/nvidia rtx|radeon rx 6|apple m[1-9]|geforce rtx/.test(renderer))
      return 3;
    return 2;
  } catch {
    return 1;
  }
}

function deviceClassFromViewport(vp: DeviceViewport): DeviceClass {
  if (vp.isPhone) return "phone";
  if (vp.isMobile) return "tablet";
  return "desktop";
}

export function detectDeviceProfile(): DeviceProfile {
  const vp = getDeviceViewport();
  const cores = navigator.hardwareConcurrency ?? 4;
  const memoryGb =
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const saveData = Boolean(
    (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
      ?.saveData
  );
  const gpuTier = detectGpuTier();
  const deviceClass = deviceClassFromViewport(vp);

  let score = 0;
  score += Math.min(cores, 16) * 4;
  score += Math.min(memoryGb, 16) * 6;
  score += gpuTier * 12;
  if (deviceClass === "desktop") score += 10;
  else if (deviceClass === "tablet") score += 4;
  if (saveData) score -= 20;
  if (vp.isPhone) score -= 15;

  const lowEnd =
    memoryGb < 6 ||
    cores <= 4 ||
    gpuTier <= 0 ||
    (vp.isMobile && memoryGb < 8);

  return {
    deviceClass,
    cores,
    memoryGb,
    isMobile: vp.isMobile,
    isPhone: vp.isPhone,
    isTouch: vp.isTouch,
    gpuTier,
    saveData,
    lowEnd,
    score,
  };
}
