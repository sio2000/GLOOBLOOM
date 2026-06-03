"use client";

import { PaymentAction, priceFor, priceForQuantity } from "@/lib/payments";

interface PaymentPriceBadgeProps {
  action: PaymentAction;
  quantity?: number;
  className?: string;
}

export function PaymentPriceBadge({
  action,
  quantity = 1,
  className = "",
}: PaymentPriceBadgeProps) {
  const label = quantity > 1 ? priceForQuantity(action, quantity) : priceFor(action);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-medium text-white/55 ${className}`}
    >
      <span aria-hidden>🔒</span>
      {label}
      {quantity > 1 && (
        <span className="text-white/35">· {quantity}×</span>
      )}
    </span>
  );
}
