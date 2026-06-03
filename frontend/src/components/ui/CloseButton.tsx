"use client";

/** High-contrast dismiss control — visible on dark overlays (min 44px touch target). */
export function CloseButton({
  onClick,
  label = "Close",
  className = "",
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`flex items-center justify-center min-w-11 min-h-11 w-11 h-11 rounded-full border-2 border-red-500/70 bg-red-950/80 text-red-400 text-xl font-bold leading-none shadow-[0_0_12px_rgba(239,68,68,0.35)] hover:bg-red-900/90 hover:border-red-400 hover:text-red-300 active:scale-95 transition-all ${className}`}
    >
      ×
    </button>
  );
}
