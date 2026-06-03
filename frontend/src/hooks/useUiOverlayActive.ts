"use client";

import { useOrganismStore } from "@/store/useOrganismStore";

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
  return Boolean(
    stripeCheckout ||
      showWaterModal ||
      showLeafModal ||
      paymentCelebration ||
      showLoreSheet
  );
}
