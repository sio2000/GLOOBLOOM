import {
  PaymentAction,
  checkoutProductName,
  clampPurchaseQuantity,
  unitAmountCents,
} from "../constants/payments.js";
import { stripeHttpsRequest } from "./stripeHttps.js";

type CheckoutSessionResponse = {
  id: string;
  url: string | null;
  client_secret?: string | null;
  payment_status?: string;
  status?: string;
};

function buildCheckoutBody(input: {
  action: PaymentAction;
  unitAmount: number;
  quantity: number;
  frontendUrl: string;
  userSessionId: string;
  username: string;
  message?: string;
}): string {
  const quantity = clampPurchaseQuantity(input.quantity);
  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("ui_mode", "embedded_page");
  params.set("redirect_on_completion", "never");
  params.append("payment_method_types[]", "card");
  params.set("line_items[0][quantity]", String(quantity));
  params.set("line_items[0][price_data][currency]", "eur");
  params.set("line_items[0][price_data][unit_amount]", String(input.unitAmount));
  params.set(
    "line_items[0][price_data][product_data][name]",
    checkoutProductName(input.action, quantity)
  );
  params.set(
    "line_items[0][price_data][product_data][description]",
    "GLOOBLOOM — collective living organism"
  );
  params.set("metadata[action]", input.action);
  params.set("metadata[quantity]", String(quantity));
  params.set("metadata[userSessionId]", input.userSessionId);
  params.set("metadata[username]", input.username.slice(0, 32));
  params.set("metadata[message]", (input.message ?? "").slice(0, 280));
  return params.toString();
}

export async function createCheckoutSessionRest(
  secretKey: string,
  input: {
    action: PaymentAction;
    username: string;
    userSessionId: string;
    message?: string;
    quantity?: number;
    frontendUrl: string;
  }
): Promise<{ id: string; clientSecret: string }> {
  const quantity = clampPurchaseQuantity(input.quantity ?? 1);
  const unitAmount = unitAmountCents(input.action);
  const body = buildCheckoutBody({ ...input, unitAmount, quantity });
  const text = await stripeHttpsRequest(secretKey, "POST", "/checkout/sessions", body);
  const data = JSON.parse(text) as CheckoutSessionResponse;

  if (!data.id || !data.client_secret) {
    throw new Error("Stripe did not return an embedded checkout session");
  }

  return { id: data.id, clientSecret: data.client_secret };
}

export async function retrieveCheckoutSessionRest(
  secretKey: string,
  sessionId: string
): Promise<{ payment_status: string | null; status: string | null }> {
  const text = await stripeHttpsRequest(
    secretKey,
    "GET",
    `/checkout/sessions/${encodeURIComponent(sessionId)}`
  );
  const data = JSON.parse(text) as CheckoutSessionResponse;
  return {
    payment_status: data.payment_status ?? null,
    status: data.status ?? null,
  };
}

export async function pingStripeRest(secretKey: string): Promise<void> {
  await stripeHttpsRequest(secretKey, "GET", "/checkout/sessions?limit=1");
}
