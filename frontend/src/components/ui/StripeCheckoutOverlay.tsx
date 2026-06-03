"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loadStripe, StripeEmbeddedCheckout } from "@stripe/stripe-js";
import { useOrganismStore } from "@/store/useOrganismStore";
import { usePayments } from "@/hooks/usePayments";
import { useAudioSystem } from "@/hooks/useAudioSystem";
import { applyPaymentFulfillment } from "@/lib/applyPaymentResult";
import { PAYMENT_LABELS } from "@/lib/payments";

export function StripeCheckoutOverlay() {
  const checkout = useOrganismStore((s) => s.stripeCheckout);
  const setCheckout = useOrganismStore((s) => s.setStripeCheckout);
  const showNotif = useOrganismStore((s) => s.showNotif);
  const { fulfillReturn } = usePayments();
  const { playWaterChime, resume } = useAudioSystem();
  const mountRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<StripeEmbeddedCheckout | null>(null);
  const [mounting, setMounting] = useState(false);

  const close = () => setCheckout(null);

  useEffect(() => {
    if (!checkout) return;

    let cancelled = false;
    let frame = 0;

    const mountCheckout = async () => {
      setMounting(true);
      try {
        const stripe = await loadStripe(checkout.publishableKey);
        if (!stripe || cancelled) return;

        const el = mountRef.current;
        if (!el) return;

        const embedded = await stripe.initEmbeddedCheckout({
          clientSecret: checkout.clientSecret,
          onComplete: async () => {
            try {
              const result = await fulfillReturn(checkout.sessionId);
              await applyPaymentFulfillment(result, {
                playWaterChime,
                resumeAudio: resume,
              });
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Could not confirm payment";
              showNotif(msg, "decay");
            } finally {
              setCheckout(null);
            }
          },
        });

        if (cancelled) {
          embedded.destroy();
          return;
        }

        instanceRef.current = embedded;
        embedded.mount(el);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not load checkout";
        showNotif(msg, "decay");
        setCheckout(null);
      } finally {
        if (!cancelled) setMounting(false);
      }
    };

    frame = requestAnimationFrame(() => {
      void mountCheckout();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [checkout, fulfillReturn, playWaterChime, resume, setCheckout, showNotif]);

  const label = checkout
    ? checkout.quantity > 1
      ? `${PAYMENT_LABELS[checkout.action]} ×${checkout.quantity}`
      : PAYMENT_LABELS[checkout.action]
    : "";

  return (
    <AnimatePresence>
      {checkout && (
        <>
          <motion.div
            className="fixed inset-0 z-[82] bg-black/85 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.div
            className="fixed inset-0 z-[83] flex items-center justify-center p-4 max-sm:items-end max-sm:p-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="pointer-events-auto w-full max-w-lg max-sm:max-w-none rounded-3xl max-sm:rounded-t-3xl border border-white/10 bg-[#0a0f0d] shadow-2xl overflow-hidden max-sm:max-h-[92dvh] flex flex-col"
              initial={{ y: 40, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 24, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/35">
                    Secure payment
                  </p>
                  <p className="text-sm font-medium text-white/85">{label}</p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="w-9 h-9 rounded-full border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-colors"
                  aria-label="Close payment"
                >
                  ×
                </button>
              </div>

              <div className="relative flex-1 min-h-[22rem] max-sm:min-h-[20rem] overflow-y-auto">
                {mounting && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                    <p className="text-xs text-white/40 tracking-widest uppercase">
                      Loading checkout…
                    </p>
                  </div>
                )}
                <div ref={mountRef} className="min-h-[22rem] w-full" />
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
