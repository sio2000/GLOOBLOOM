/** Client-side device / viewport helpers for mobile framing & layout. */

export interface DeviceViewport {
  width: number;
  height: number;
  aspect: number;
  isPortrait: boolean;
  isMobile: boolean;
  isPhone: boolean;
  isTouch: boolean;
}

export function isMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

/** Stable viewport for SSR and the first client paint (prevents hydration mismatch). */
export const SSR_DEFAULT_VIEWPORT: DeviceViewport = {
  width: 1280,
  height: 800,
  aspect: 1280 / 800,
  isPortrait: false,
  isMobile: false,
  isPhone: false,
  isTouch: false,
};

export function getDeviceViewport(): DeviceViewport {
  if (typeof window === "undefined") {
    return SSR_DEFAULT_VIEWPORT;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const isPortrait = height >= width;
  const isTouch = isTouchDevice();
  const uaMobile = isMobileUserAgent();
  const narrow = Math.min(width, height) < 768;
  const isMobile = uaMobile || (isTouch && narrow);
  const isPhone = isMobile && Math.min(width, height) < 600;

  return {
    width,
    height,
    aspect: width / height,
    isPortrait,
    isMobile,
    isPhone,
    isTouch,
  };
}

import type { QualityTier } from "@/lib/performance";
import { detectDeviceMaxTier } from "@/lib/performance";

export function getDeviceMaxQualityTier(): QualityTier {
  if (typeof window === "undefined") return "medium";
  return detectDeviceMaxTier();
}
