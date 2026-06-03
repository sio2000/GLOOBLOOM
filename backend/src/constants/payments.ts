export type PaymentAction = "water" | "leaf" | "comment";

/** Stripe minimum for EUR charges (see stripe.com/docs/currencies) */
export const STRIPE_MIN_EUR_CENTS = 50;

/** Display / charge amounts in euro cents (must be >= STRIPE_MIN_EUR_CENTS) */
export const PAYMENT_AMOUNTS_CENTS: Record<PaymentAction, number> = {
  water: 50,
  leaf: 50,
  comment: 50,
};

export const MAX_PURCHASE_QUANTITY = 50;

export function unitAmountCents(action: PaymentAction): number {
  return Math.max(STRIPE_MIN_EUR_CENTS, PAYMENT_AMOUNTS_CENTS[action]);
}

/** @deprecated Use unitAmountCents — kept for single-unit call sites */
export function chargeAmountCents(action: PaymentAction): number {
  return unitAmountCents(action);
}

export function clampPurchaseQuantity(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number.parseInt(String(raw ?? 1), 10);
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_PURCHASE_QUANTITY, Math.max(1, Math.floor(n)));
}

export function totalAmountCents(action: PaymentAction, quantity: number): number {
  return unitAmountCents(action) * clampPurchaseQuantity(quantity);
}

export function checkoutProductName(action: PaymentAction, quantity: number): string {
  const q = clampPurchaseQuantity(quantity);
  if (action === "water") {
    return q === 1 ? PAYMENT_LABELS.water : `${q} waterings for Gloobloom`;
  }
  if (action === "leaf") {
    return q === 1 ? PAYMENT_LABELS.leaf : `${q} named leaves for Gloobloom`;
  }
  return PAYMENT_LABELS[action];
}

export const PAYMENT_LABELS: Record<PaymentAction, string> = {
  water: "Water the organism",
  leaf: "Engrave your name on a leaf",
  comment: "Post a live feed comment",
};

export function formatEur(cents: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function paymentsEnabled(): boolean {
  return (
    process.env.STRIPE_SKIP_PAYMENTS !== "true" &&
    Boolean(process.env.STRIPE_SECRET_KEY?.trim())
  );
}
