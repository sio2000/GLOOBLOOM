"use client";

import { useEffect, useState, useRef } from "react";
import {
  getDeviceViewport,
  SSR_DEFAULT_VIEWPORT,
  type DeviceViewport,
} from "@/lib/device";
import { MOBILE_RESIZE_DEBOUNCE_MS } from "@/lib/mobilePerf";

/**
 * Client viewport — starts with SSR_DEFAULT_VIEWPORT so server HTML matches
 * the first client render; real values apply after mount.
 */
export function useDeviceInfo(): DeviceViewport {
  const [viewport, setViewport] =
    useState<DeviceViewport>(SSR_DEFAULT_VIEWPORT);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const apply = () => setViewport(getDeviceViewport());
    const schedule = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(apply, MOBILE_RESIZE_DEBOUNCE_MS);
    };

    apply();
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("orientationchange", schedule, { passive: true });
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
    };
  }, []);

  return viewport;
}
