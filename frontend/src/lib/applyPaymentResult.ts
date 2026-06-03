import { api } from "@/lib/api";
import { WATERING_COOLDOWN_MS } from "@/lib/constants";
import { FulfillPaymentResult } from "@/lib/api";
import { PaymentAction } from "@/lib/payments";
import { useOrganismStore } from "@/store/useOrganismStore";

export async function applyPaymentFulfillment(
  result: FulfillPaymentResult,
  opts?: {
    playWaterChime?: () => void;
    resumeAudio?: () => void;
  }
): Promise<PaymentAction> {
  const {
    setState,
    setUsername,
    setLeaves,
    setIsWatering,
    setWateringCooldown,
    setPaymentCelebration,
    setShowWaterModal,
    setShowLeafModal,
  } = useOrganismStore.getState();

  if (result.username) setUsername(result.username);

  const action = result.action;

  if (action === "water") {
    opts?.resumeAudio?.();
    setIsWatering(true);
    setWateringCooldown(true);
    opts?.playWaterChime?.();
    if (result.state) setState(result.state);
    setTimeout(() => setIsWatering(false), 1200);
    setTimeout(() => setWateringCooldown(false), WATERING_COOLDOWN_MS);
    setShowWaterModal(false);
  } else if (action === "leaf") {
    const leaves = await api.getLeaves();
    setLeaves(leaves);
    setShowLeafModal(false);
  }

  if (!result.alreadyConsumed) {
    setPaymentCelebration({
      action,
      username: result.username,
      quantity: result.quantity ?? 1,
    });
  }

  return action;
}
