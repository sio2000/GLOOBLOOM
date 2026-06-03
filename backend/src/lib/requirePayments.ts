import { paymentsEnabled } from "../constants/payments.js";

export function requirePaymentsEnabled(): void {
  if (paymentsEnabled()) {
    throw new Error("PAYMENT_REQUIRED");
  }
}

export function isPaymentGateActive(): boolean {
  return paymentsEnabled();
}
