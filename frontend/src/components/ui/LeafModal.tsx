"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrganismStore } from "@/store/useOrganismStore";
import { usePayments } from "@/hooks/usePayments";
import { api } from "@/lib/api";
import { PaymentPriceBadge } from "@/components/ui/PaymentPriceBadge";
import { PurchaseQuantityPicker } from "@/components/ui/PurchaseQuantityPicker";
import { priceForQuantity } from "@/lib/payments";

export function LeafModal() {
  const show = useOrganismStore((s) => s.showLeafModal);
  const setShow = useOrganismStore((s) => s.setShowLeafModal);
  const storedUsername = useOrganismStore((s) => s.username);
  const setUsername = useOrganismStore((s) => s.setUsername);
  const setLeaves = useOrganismStore((s) => s.setLeaves);
  const showNotif = useOrganismStore((s) => s.showNotif);
  const [input, setInput] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const { startCheckout, checkoutLoading, paymentsRequired } = usePayments();

  const submit = async () => {
    const name = (input.trim() || storedUsername?.trim() || "").slice(0, 24);
    if (!name || submitting) return;
    setSubmitting(true);
    setUsername(name);

    let result: { openedModal: boolean; fulfilled: boolean };
    try {
      result = await startCheckout("leaf", name, undefined, quantity);
    } catch (err) {
      showNotif(err instanceof Error ? err.message : "Checkout failed", "decay");
      setSubmitting(false);
      return;
    }

    if (result.fulfilled) {
      api.getLeaves().then(setLeaves).catch(() => undefined);
      setShow(false);
      setInput("");
      showNotif(
        quantity > 1
          ? `🍃 ${quantity} leaves now carry your name!`
          : "🍃 Your name is now a leaf!",
        "bloom"
      );
    } else if (result.openedModal) {
      setShow(false);
      setInput("");
    }

    setSubmitting(false);
  };

  const busy = submitting || checkoutLoading;
  const price = priceForQuantity("leaf", quantity);

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            className="fixed inset-0 z-[78] bg-black/85 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShow(false)}
          />

          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center p-4 max-sm:items-end max-sm:p-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm max-sm:max-w-none rounded-3xl max-sm:rounded-t-3xl max-sm:rounded-b-none border border-green-500/15 bg-[#0a0f0d] backdrop-blur-2xl p-8 max-sm:p-6 max-sm:pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl max-sm:max-h-[min(88dvh,100%)] max-sm:min-h-[min(52dvh,100%)] overflow-y-auto"
              initial={{ scale: 0.88, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.88, y: 24 }}
              transition={{ type: "spring", damping: 22, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center mb-6">
                <motion.div
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-green-900/60 to-emerald-900/40 border border-green-400/25 flex items-center justify-center"
                  animate={{ rotate: [0, 8, -8, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity }}
                >
                  <span className="text-3xl select-none">🍃</span>
                </motion.div>
              </div>

              <h2 className="text-center font-display text-xl text-white/90 mb-2">
                Engrave a leaf
              </h2>
              <p className="text-center text-xs text-white/35 mb-4 leading-relaxed">
                Your name grows on the organism — visible to everyone
              </p>

              <PurchaseQuantityPicker
                action="leaf"
                label="How many named leaves?"
                hint="Each leaf displays the same name you enter below."
                quantity={quantity}
                onChange={setQuantity}
                accent="green"
              />

              <div className="flex justify-center mb-4">
                <PaymentPriceBadge action="leaf" quantity={quantity} />
              </div>

              <label className="block text-[10px] uppercase tracking-wider text-white/35 mb-2">
                Name on every leaf
              </label>
              <input
                type="text"
                placeholder="your name or alias"
                value={input || storedUsername}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                maxLength={24}
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 placeholder-white/20 text-sm outline-none focus:border-green-400/40 focus:ring-1 focus:ring-green-400/20 transition-all"
              />

              <motion.button
                onClick={submit}
                disabled={!(input.trim() || storedUsername?.trim()) || busy}
                className="mt-5 w-full py-3.5 rounded-xl bg-gradient-to-r from-green-900/60 to-emerald-900/50 border border-green-400/20 text-green-100 text-sm font-medium tracking-wide transition-all hover:border-green-400/40 disabled:opacity-40 disabled:cursor-not-allowed"
                whileTap={{ scale: 0.97 }}
              >
                {busy
                  ? "Loading…"
                  : paymentsRequired
                    ? `Pay ${price} & place leaf${quantity > 1 ? ` ×${quantity}` : ""}`
                    : quantity > 1
                      ? `🍃 Place ${quantity} leaves`
                      : "🍃 Place leaf"}
              </motion.button>

              {paymentsRequired && (
                <p className="mt-3 text-[10px] text-center text-white/30 leading-relaxed">
                  Secure payment via Stripe
                </p>
              )}

              <button
                onClick={() => setShow(false)}
                className="mt-3 w-full text-[10px] text-white/20 hover:text-white/40 transition-colors"
              >
                cancel
              </button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
