export type PaymentAction = "water" | "leaf" | "comment";

/** Must match backend — Stripe EUR minimum is €0.50 per unit */
export const PAYMENT_AMOUNTS_CENTS: Record<PaymentAction, number> = {
  water: 50,
  leaf: 50,
  comment: 50,
};

export const MAX_PURCHASE_QUANTITY = 50;

export const PAYMENT_LABELS: Record<PaymentAction, string> = {
  water: "Water the organism",
  leaf: "Engrave a leaf",
  comment: "Live feed comment",
};

export function formatEur(cents: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function unitPriceCents(action: PaymentAction): number {
  return Math.max(50, PAYMENT_AMOUNTS_CENTS[action]);
}

export function clampPurchaseQuantity(raw: number): number {
  if (!Number.isFinite(raw)) return 1;
  return Math.min(MAX_PURCHASE_QUANTITY, Math.max(1, Math.floor(raw)));
}

export function totalPriceCents(action: PaymentAction, quantity: number): number {
  return unitPriceCents(action) * clampPurchaseQuantity(quantity);
}

export function priceFor(action: PaymentAction): string {
  return formatEur(unitPriceCents(action));
}

export function priceForQuantity(action: PaymentAction, quantity: number): string {
  return formatEur(totalPriceCents(action, quantity));
}
