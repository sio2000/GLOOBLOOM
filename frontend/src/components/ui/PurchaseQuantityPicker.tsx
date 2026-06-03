"use client";

import {
  formatEur,
  MAX_PURCHASE_QUANTITY,
  totalPriceCents,
  unitPriceCents,
  PaymentAction,
} from "@/lib/payments";

interface PurchaseQuantityPickerProps {
  action: PaymentAction;
  label: string;
  hint?: string;
  quantity: number;
  onChange: (quantity: number) => void;
  accent: "cyan" | "green";
  max?: number;
}

const DEFAULT_MAX = MAX_PURCHASE_QUANTITY;

export function PurchaseQuantityPicker({
  action,
  label,
  hint,
  quantity,
  onChange,
  accent,
  max = DEFAULT_MAX,
}: PurchaseQuantityPickerProps) {
  const unit = unitPriceCents(action);
  const total = totalPriceCents(action, quantity);
  const border =
    accent === "cyan" ? "border-cyan-400/25 text-cyan-300/80" : "border-green-400/25 text-green-300/80";
  const btn =
    accent === "cyan"
      ? "border-cyan-400/20 hover:border-cyan-400/40 text-cyan-200/90"
      : "border-green-400/20 hover:border-green-400/40 text-green-200/90";

  const dec = () => onChange(Math.max(1, quantity - 1));
  const inc = () => onChange(Math.min(max, quantity + 1));

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wider text-white/40">{label}</span>
        <span className={`text-[10px] ${accent === "cyan" ? "text-cyan-400/50" : "text-green-400/50"}`}>
          {formatEur(unit)} each
        </span>
      </div>
      <div className={`flex items-center justify-between rounded-xl border bg-white/5 px-3 py-2.5 ${border}`}>
        <button
          type="button"
          onClick={dec}
          disabled={quantity <= 1}
          className={`w-10 h-10 rounded-lg border text-lg font-medium transition-all disabled:opacity-30 ${btn}`}
          aria-label="Decrease quantity"
        >
          −
        </button>
        <div className="text-center px-2">
          <p className="text-2xl font-display text-white/90 tabular-nums">{quantity}</p>
          <p className="text-[9px] text-white/30 uppercase tracking-widest">
            {quantity === 1 ? "unit" : "units"}
          </p>
        </div>
        <button
          type="button"
          onClick={inc}
          disabled={quantity >= max}
          className={`w-10 h-10 rounded-lg border text-lg font-medium transition-all disabled:opacity-30 ${btn}`}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      {hint && <p className="mt-2 text-[10px] text-center text-white/30 leading-relaxed">{hint}</p>}
      <p className="mt-3 text-center text-sm font-medium text-white/70">
        Total: <span className="text-white/90">{formatEur(total)}</span>
      </p>
    </div>
  );
}
