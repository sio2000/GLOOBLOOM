"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getOrCreateSessionId } from "@/lib/utils";
import { useSocket } from "@/hooks/useSocket";
import { PaymentAction, clampPurchaseQuantity } from "@/lib/payments";
import { useOrganismStore } from "@/store/useOrganismStore";

interface PaymentConfig {
  enabled: boolean;
  skipPayments: boolean;
  publishableKey: string | null;
}

export function usePayments() {
  const [config, setConfig] = useState<PaymentConfig>({
    enabled: false,
    skipPayments: true,
    publishableKey: null,
  });
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const setStripeCheckout = useOrganismStore((s) => s.setStripeCheckout);
  const { water, addLeaf, postComment } = useSocket();

  useEffect(() => {
    getOrCreateSessionId();
    api
      .getPaymentConfig()
      .then((c) => {
        const pk =
          c.publishableKey?.trim() ||
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ||
          null;
        setConfig({
          enabled: c.enabled,
          skipPayments: c.skipPayments,
          publishableKey: pk,
        });
      })
      .catch(() =>
        setConfig({ enabled: false, skipPayments: true, publishableKey: null })
      );
  }, []);

  const runFreeAction = useCallback(
    (action: PaymentAction, username: string, message?: string, quantity = 1) => {
      const q = clampPurchaseQuantity(quantity);
      if (action === "water") {
        for (let i = 0; i < q; i++) water(username);
      } else if (action === "leaf") {
        for (let i = 0; i < q; i++) addLeaf(username);
      } else if (message) postComment(username, message);
    },
    [water, addLeaf, postComment]
  );

  const startCheckout = useCallback(
    async (
      action: PaymentAction,
      username: string,
      message?: string,
      quantity = 1
    ): Promise<{ openedModal: boolean; fulfilled: boolean }> => {
      const cleanName = username.trim().slice(0, 32);
      if (!cleanName) {
        return { openedModal: false, fulfilled: false };
      }

      const qty =
        action === "comment" ? 1 : clampPurchaseQuantity(quantity);

      if (config.skipPayments || !config.enabled) {
        runFreeAction(action, cleanName, message, qty);
        return { openedModal: false, fulfilled: true };
      }

      const pk = config.publishableKey?.trim();
      if (!pk) {
        throw new Error(
          "Stripe publishable key missing. Add STRIPE_PUBLISHABLE_KEY to backend/.env (pk_test_ from Dashboard) and restart the backend."
        );
      }

      setCheckoutLoading(true);
      try {
        const payload: {
          action: PaymentAction;
          username: string;
          userSessionId: string;
          message?: string;
          quantity?: number;
        } = {
          action,
          username: cleanName,
          userSessionId: getOrCreateSessionId(),
        };
        const trimmedMsg = message?.trim();
        if (trimmedMsg) payload.message = trimmedMsg;
        if (action !== "comment") payload.quantity = qty;

        const { clientSecret, sessionId } = await api.createCheckout(payload);
        setStripeCheckout({
          clientSecret,
          sessionId,
          action,
          quantity: qty,
          publishableKey: pk,
        });
        return { openedModal: true, fulfilled: false };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Checkout failed";
        throw new Error(msg);
      } finally {
        setCheckoutLoading(false);
      }
    },
    [config, runFreeAction, setStripeCheckout]
  );

  const fulfillReturn = useCallback(async (stripeSessionId: string) => {
    return api.fulfillPayment(stripeSessionId, getOrCreateSessionId());
  }, []);

  return {
    config,
    checkoutLoading,
    paymentsRequired: config.enabled && !config.skipPayments,
    startCheckout,
    fulfillReturn,
    runFreeAction,
  };
}
