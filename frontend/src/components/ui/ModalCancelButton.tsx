"use client";

/** Full-width cancel — high contrast on dark modals (44px touch target). */
export function ModalCancelButton({
  onClick,
  label = "Cancel",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 w-full min-h-[44px] py-3 rounded-xl border-2 border-red-500/55 bg-red-950/40 text-red-300 text-sm font-semibold uppercase tracking-wider shadow-[0_0_10px_rgba(239,68,68,0.2)] hover:bg-red-950/65 hover:border-red-400/75 hover:text-red-200 active:scale-[0.98] transition-all touch-manipulation"
    >
      {label}
    </button>
  );
}
