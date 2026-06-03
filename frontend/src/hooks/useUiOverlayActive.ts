"use client";

import { useOrganismStore } from "@/store/useOrganismStore";
import { usePerformanceStore } from "@/store/usePerformanceStore";

/** True when a full-screen sheet/modal should hide the mobile bottom dock. */
export function useUiOverlayActive(): boolean {
  const showWaterModal = useOrganismStore((s) => s.showWaterModal);
  const showLeafModal = useOrganismStore((s) => s.showLeafModal);
  const showLoreSheet = useOrganismStore((s) => s.showLoreSheet);
  const mobileDevOpen = useOrganismStore((s) => s.mobileDevOpen);
  const stripeCheckout = useOrganismStore((s) => s.stripeCheckout);
  const paymentCelebration = useOrganismStore((s) => s.paymentCelebration);

  return Boolean(
    showWaterModal ||
      showLeafModal ||
      showLoreSheet ||
      mobileDevOpen ||
      stripeCheckout ||
      paymentCelebration
  );
}

/** Pause WebGL when modals/checkout are open (frees main thread for Stripe). */
export function useScenePaused(): boolean {
  const stripeCheckout = useOrganismStore((s) => s.stripeCheckout);
  const showWaterModal = useOrganismStore((s) => s.showWaterModal);
  const showLeafModal = useOrganismStore((s) => s.showLeafModal);
  const paymentCelebration = useOrganismStore((s) => s.paymentCelebration);
  const showLoreSheet = useOrganismStore((s) => s.showLoreSheet);
  const mobileFeedOpen = useOrganismStore((s) => s.mobileFeedOpen);
  const mobileDevOpen = useOrganismStore((s) => s.mobileDevOpen);
  const mobileStatsExpanded = useOrganismStore((s) => s.mobileStatsExpanded);
  const showAdminPanel = useOrganismStore((s) => s.showAdminPanel);
  const isMobile = usePerformanceStore((s) => s.isMobile);

  const modalPause = Boolean(
    stripeCheckout ||
      showWaterModal ||
      showLeafModal ||
      paymentCelebration ||
      showLoreSheet
  );

  /** Mobile: pause GPU while scrolling heavy panels (stats accordion, feed, dev). */
  const mobilePanelPause =
    isMobile &&
    (mobileFeedOpen || mobileDevOpen || mobileStatsExpanded || showAdminPanel);

  return modalPause || mobilePanelPause;
}
