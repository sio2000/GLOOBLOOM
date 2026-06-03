"use client";

import { useOrganismStore } from "@/store/useOrganismStore";

/** True when a full-screen sheet/modal should hide the mobile bottom dock. */
export function useUiOverlayActive(): boolean {
  const showWaterModal = useOrganismStore((s) => s.showWaterModal);
  const showLeafModal = useOrganismStore((s) => s.showLeafModal);
  const showLoreSheet = useOrganismStore((s) => s.showLoreSheet);
  const stripeCheckout = useOrganismStore((s) => s.stripeCheckout);
  const paymentCelebration = useOrganismStore((s) => s.paymentCelebration);

  return Boolean(
    showWaterModal ||
      showLeafModal ||
      showLoreSheet ||
      stripeCheckout ||
      paymentCelebration
  );
}
