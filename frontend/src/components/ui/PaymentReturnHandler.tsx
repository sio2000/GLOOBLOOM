"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useOrganismStore } from "@/store/useOrganismStore";
import { usePayments } from "@/hooks/usePayments";
import { useAudioSystem } from "@/hooks/useAudioSystem";
import { applyPaymentFulfillment } from "@/lib/applyPaymentResult";

/** Fallback when Stripe return_url is hit (e.g. bookmarked link). Embedded flow uses onComplete. */
export function PaymentReturnHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const handled = useRef(false);
  const { fulfillReturn } = usePayments();
  const showNotif = useOrganismStore((s) => s.showNotif);
  const { playWaterChime, resume } = useAudioSystem();

  useEffect(() => {
    const status = searchParams.get("payment");
    if (!status || handled.current) return;

    if (status === "cancelled") {
      handled.current = true;
      showNotif("Payment cancelled", "info");
      router.replace("/", { scroll: false });
      return;
    }

    if (status !== "success") return;

    const stripeSessionId = searchParams.get("session_id");
    if (!stripeSessionId) return;

    handled.current = true;

    (async () => {
      try {
        const result = await fulfillReturn(stripeSessionId);
        await applyPaymentFulfillment(result, {
          playWaterChime,
          resumeAudio: resume,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Payment failed";
        showNotif(msg, "decay");
      } finally {
        router.replace("/", { scroll: false });
      }
    })();
  }, [searchParams, router, fulfillReturn, showNotif, playWaterChime, resume]);

  return null;
}
