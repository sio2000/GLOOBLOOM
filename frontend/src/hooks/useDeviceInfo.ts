"use client";

import { useEffect, useState, useRef } from "react";
import { getDeviceViewport, type DeviceViewport } from "@/lib/device";
import { MOBILE_RESIZE_DEBOUNCE_MS } from "@/lib/mobilePerf";

export function useDeviceInfo(): DeviceViewport {
  const [viewport, setViewport] = useState<DeviceViewport>(() => getDeviceViewport());
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
