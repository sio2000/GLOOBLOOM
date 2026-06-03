"use client";

import { useOrganismStore } from "@/store/useOrganismStore";
import { useSceneRuntimeStore } from "@/store/useSceneRuntimeStore";

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

/** WebGL fully stopped — driven by useMobileSceneFreeze on mobile. */
export function useScenePaused(): boolean {
  return useSceneRuntimeStore((s) => s.sceneFrozen);
}
