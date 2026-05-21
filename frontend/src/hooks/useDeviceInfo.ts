"use client";

import { useEffect, useState } from "react";
import { getDeviceViewport, type DeviceViewport } from "@/lib/device";

export function useDeviceInfo(): DeviceViewport {
  const [viewport, setViewport] = useState<DeviceViewport>(() => getDeviceViewport());

  useEffect(() => {
    const update = () => setViewport(getDeviceViewport());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return viewport;
}
