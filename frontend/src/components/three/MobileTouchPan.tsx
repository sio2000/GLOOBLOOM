"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useOrganismStore } from "@/store/useOrganismStore";
import { useCameraStore } from "@/store/useCameraStore";
import { getCameraLimits } from "@/lib/plantScale";
import { useDeviceInfo } from "@/hooks/useDeviceInfo";

interface Props {
  containerRef: RefObject<HTMLElement | null>;
}

function touchMidY(touches: TouchList): number {
  return (touches[0]!.clientY + touches[1]!.clientY) / 2;
}

/** Two-finger vertical drag on mobile adjusts camera height along the plant. */
export function MobileTouchPan({ containerRef }: Props) {
  const device = useDeviceInfo();
  const stage = useOrganismStore((s) => s.state?.ecosystemStage ?? 1);
  const growth = useOrganismStore((s) => s.state?.growth ?? 0);
  const shiftViewOffsetY = useCameraStore((s) => s.shiftViewOffsetY);
  const limitsRef = useRef(getCameraLimits(stage, growth, { isMobile: true, isPhone: true }));

  useEffect(() => {
    limitsRef.current = getCameraLimits(stage, growth, {
      isMobile: device.isMobile,
      isPortrait: device.isPortrait,
      isPhone: device.isPhone,
    });
  }, [stage, growth, device.isMobile, device.isPortrait, device.isPhone]);

  useEffect(() => {
    if (!device.isPhone) return;

    const root = containerRef.current;
    if (!root) return;

    const canvas = root.querySelector("canvas");
    if (!canvas) return;

    let panning = false;
    let lastMidY = 0;
    let edgePan = false;
    let edgeLastY = 0;

    const isEdgePanTouch = (touch: Touch) => touch.clientX <= window.innerWidth * 0.14;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        panning = true;
        edgePan = false;
        lastMidY = touchMidY(e.touches);
        return;
      }
      if (e.touches.length === 1 && isEdgePanTouch(e.touches[0]!)) {
        edgePan = true;
        edgeLastY = e.touches[0]!.clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      const { panRange } = limitsRef.current;
      const sensitivity = panRange / Math.max(260, window.innerHeight * 0.32);

      if (panning && e.touches.length === 2) {
        const y = touchMidY(e.touches);
        const dy = lastMidY - y;
        lastMidY = y;
        shiftViewOffsetY(dy * sensitivity, panRange);
        e.preventDefault();
        return;
      }

      if (edgePan && e.touches.length === 1) {
        const t = e.touches[0]!;
        if (!isEdgePanTouch(t)) {
          edgePan = false;
          return;
        }
        const dy = edgeLastY - t.clientY;
        edgeLastY = t.clientY;
        if (Math.abs(dy) > 0.5) {
          shiftViewOffsetY(dy * sensitivity, panRange);
          e.preventDefault();
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) panning = false;
      if (e.touches.length === 0) edgePan = false;
    };

    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);
    canvas.addEventListener("touchcancel", onTouchEnd);

    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [device.isPhone, containerRef, shiftViewOffsetY]);

  return null;
}
