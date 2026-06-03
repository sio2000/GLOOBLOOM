"use client";

import { useEffect, useRef } from "react";
import { useOrganismStore } from "@/store/useOrganismStore";
import { usePerformanceStore } from "@/store/usePerformanceStore";
import { useSceneRuntimeStore } from "@/store/useSceneRuntimeStore";
import { requestSceneRender } from "@/lib/sceneRuntime";

const SCROLL_END_MS = 140;
const UI_END_MS = 200;

/** Freezes 3D + demand pump during panels, modals, scroll, and UI touch. */
export function useMobileSceneFreeze() {
  const isMobile = usePerformanceStore((s) => s.isMobile);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showWaterModal = useOrganismStore((s) => s.showWaterModal);
  const showLeafModal = useOrganismStore((s) => s.showLeafModal);
  const showLoreSheet = useOrganismStore((s) => s.showLoreSheet);
  const mobileDevOpen = useOrganismStore((s) => s.mobileDevOpen);
  const stripeCheckout = useOrganismStore((s) => s.stripeCheckout);
  const paymentCelebration = useOrganismStore((s) => s.paymentCelebration);
  const mobileFeedOpen = useOrganismStore((s) => s.mobileFeedOpen);
  const mobileStatsExpanded = useOrganismStore((s) => s.mobileStatsExpanded);
  const showAdminPanel = useOrganismStore((s) => s.showAdminPanel);
  const showUsernameModal = useOrganismStore((s) => s.showUsernameModal);

  const panelOpen = Boolean(
    showWaterModal ||
      showLeafModal ||
      showLoreSheet ||
      mobileDevOpen ||
      stripeCheckout ||
      paymentCelebration ||
      mobileFeedOpen ||
      mobileStatsExpanded ||
      showAdminPanel ||
      showUsernameModal
  );

  useEffect(() => {
    if (!isMobile) {
      useSceneRuntimeStore.getState().setSceneFrozen(false);
      return;
    }
    useSceneRuntimeStore.getState().setSceneFrozen(panelOpen);
    useSceneRuntimeStore.getState().setAnimationPump(!panelOpen);
    if (!panelOpen) requestSceneRender();
  }, [isMobile, panelOpen]);

  useEffect(() => {
    if (!isMobile) return;

    const onScroll = () => {
      useSceneRuntimeStore.getState().setScrolling(true);
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => {
        useSceneRuntimeStore.getState().setScrolling(false);
        requestSceneRender();
      }, SCROLL_END_MS);
    };

    const onTouchStart = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t?.closest("[data-ui-layer]")) return;
      useSceneRuntimeStore.getState().setUiInteracting(true);
      if (uiTimer.current) clearTimeout(uiTimer.current);
    };

    const endUi = () => {
      if (uiTimer.current) clearTimeout(uiTimer.current);
      uiTimer.current = setTimeout(() => {
        useSceneRuntimeStore.getState().setUiInteracting(false);
        requestSceneRender();
      }, UI_END_MS);
    };

    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
    window.addEventListener("touchend", endUi, { capture: true, passive: true });
    window.addEventListener("pointerup", endUi, { capture: true, passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("touchstart", onTouchStart, true);
      window.removeEventListener("touchend", endUi, true);
      window.removeEventListener("pointerup", endUi, true);
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
      if (uiTimer.current) clearTimeout(uiTimer.current);
    };
  }, [isMobile]);
}
