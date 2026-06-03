"use client";

import { forwardRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrganismStore } from "@/store/useOrganismStore";
import { usePayments } from "@/hooks/usePayments";
import { PaymentPriceBadge } from "@/components/ui/PaymentPriceBadge";
import { priceFor } from "@/lib/payments";
import { formatTimeAgo, getActivityIcon, truncateUsername } from "@/lib/utils";
import { ActivityEntry } from "@/types/organism";
import { useDeviceInfo } from "@/hooks/useDeviceInfo";
import { useHasMounted } from "@/hooks/useHasMounted";
import { MobilePanelToggle } from "@/components/ui/MobilePanelToggle";

const ENTRY_COLORS: Record<string, string> = {
  watering: "text-cyan-400/70",
  bloom: "text-pink-400/70",
  mutation: "text-violet-400/70",
  decay: "text-amber-500/60",
  creature: "text-green-400/70",
  season: "text-indigo-400/70",
  milestone: "text-yellow-400/70",
  rare_event: "text-rose-400/80",
  comment: "text-white/65",
  micro_evolution: "text-emerald-400/65",
};

const FeedEntry = forwardRef<HTMLDivElement, { entry: ActivityEntry }>(function FeedEntry(
  { entry },
  ref
) {
  const color = ENTRY_COLORS[entry.type] ?? "text-white/40";
  const icon = getActivityIcon(entry.type);
  const isComment = entry.type === "comment";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 20, y: -5 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex items-start gap-2 py-1.5"
    >
      <span className="text-sm flex-shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0 flex-1">
        {isComment && entry.username && (
          <p className="text-[9px] text-violet-300/50 mb-0.5 font-medium">
            {truncateUsername(entry.username, 20)}
          </p>
        )}
        <p className={`text-[11px] max-sm:text-[10px] leading-snug ${color}`}>{entry.message}</p>
        <p className="text-[9px] text-white/20 mt-0.5">{formatTimeAgo(entry.createdAt)}</p>
      </div>
    </motion.div>
  );
});

export function FeedCommentComposer({ compact = false }: { compact?: boolean }) {
  const username = useOrganismStore((s) => s.username);
  const setUsername = useOrganismStore((s) => s.setUsername);
  const showNotif = useOrganismStore((s) => s.showNotif);
  const { startCheckout, checkoutLoading, paymentsRequired } = usePayments();
  const [text, setText] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showName, setShowName] = useState(false);

  const submit = useCallback(async () => {
    const msg = text.trim();
    if (!msg || submitting || checkoutLoading) return;

    let author = username?.trim();
    if (!author) {
      const n = nameInput.trim();
      if (!n) {
        setShowName(true);
        return;
      }
      author = n.slice(0, 32);
      setUsername(author);
    }

    setSubmitting(true);
    let result: { openedModal: boolean; fulfilled: boolean };
    try {
      result = await startCheckout("comment", author, msg);
    } catch (err) {
      showNotif(err instanceof Error ? err.message : "Checkout failed", "decay");
      setSubmitting(false);
      return;
    }

    if (result.fulfilled) {
      setText("");
      setShowName(false);
      showNotif("💬 Your comment was posted!", "comment");
    }

    setSubmitting(false);
  }, [
    text,
    submitting,
    checkoutLoading,
    username,
    nameInput,
    startCheckout,
    setUsername,
    showNotif,
  ]);

  const busy = submitting || checkoutLoading;
  const commentPrice = priceFor("comment");

  return (
    <div
      className={`rounded-2xl border border-white/5 bg-black/40 backdrop-blur-xl pointer-events-auto select-text ${
        compact ? "px-2.5 py-2 space-y-1.5" : "px-3 py-2.5 border-t border-white/8 bg-black/25 space-y-2"
      }`}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {showName && !username && (
        <input
          type="text"
          placeholder="your name"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          maxLength={32}
          className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/75 text-[11px] outline-none focus:border-violet-400/35 select-text pointer-events-auto"
        />
      )}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Leave a comment…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submit()}
          onPointerDown={(e) => e.stopPropagation()}
          maxLength={280}
          className="flex-1 min-w-0 px-2.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 placeholder-white/25 text-[11px] outline-none focus:border-violet-400/30 select-text pointer-events-auto cursor-text"
        />
        <motion.button
          type="button"
          onClick={submit}
          disabled={!text.trim() || busy}
          className="shrink-0 px-3 py-2 rounded-xl border border-violet-400/25 bg-violet-950/40 text-violet-200/80 text-[10px] uppercase tracking-wider disabled:opacity-35 min-w-[4.5rem]"
          whileTap={{ scale: 0.95 }}
        >
          {busy ? "…" : paymentsRequired ? commentPrice : "Send"}
        </motion.button>
      </div>
      {!compact && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-[8px] text-white/20">280 characters · visible to everyone</p>
          {paymentsRequired && <PaymentPriceBadge action="comment" className="scale-90" />}
        </div>
      )}
    </div>
  );
}

export function ActivityFeed({ layout = "floating" }: { layout?: "floating" | "dock" }) {
  const activities = useOrganismStore((s) => s.activities);
  const mounted = useHasMounted();
  const { isPhone } = useDeviceInfo();
  const [expanded, setExpanded] = useState(false);
  const dockLayout = layout === "dock";
  const phoneLayout = dockLayout || (mounted && isPhone);
  const showFullFeed = dockLayout ? expanded : !phoneLayout || expanded;

  useEffect(() => {
    if (!mounted || dockLayout) return;
    setExpanded(!isPhone);
  }, [mounted, isPhone, dockLayout]);

  useEffect(() => {
    if (dockLayout) setExpanded(false);
  }, [dockLayout]);

  const latest = activities[0];

  const positionClass =
    layout === "dock"
      ? "relative w-full"
      : "hidden sm:block fixed bottom-8 right-4 z-30 w-80 pointer-events-auto isolate";

  return (
    <motion.div
      className={positionClass}
      initial={{ opacity: 0, x: layout === "dock" ? 0 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: layout === "dock" ? 0 : 1 }}
    >
      <div className="rounded-2xl border border-white/5 bg-black/35 backdrop-blur-xl overflow-hidden pointer-events-auto">
        <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between gap-2">
          <span className="text-[9px] uppercase tracking-widest text-white/25">Live Feed</span>
          {(dockLayout || phoneLayout) && (
            <MobilePanelToggle
              expanded={expanded}
              onToggle={() => setExpanded((v) => !v)}
              label={expanded ? "Hide" : "Show"}
              badge={activities.length || undefined}
            />
          )}
        </div>

        {phoneLayout && !expanded && latest && (
          <div className="px-3 py-2 max-sm:py-1.5">
            <p className="text-[10px] text-white/45 leading-snug line-clamp-2">
              {getActivityIcon(latest.type)} {latest.message}
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {showFullFeed && (
            <motion.div
              initial={phoneLayout ? { height: 0, opacity: 0 } : false}
              animate={{ height: "auto", opacity: 1 }}
              exit={phoneLayout ? { height: 0, opacity: 0 } : undefined}
            >
              <div
                className={`px-3 py-1 overflow-y-auto scrollbar-hide divide-y divide-white/[0.03] ${
                  dockLayout ? "max-h-[min(22dvh,9.5rem)]" : "max-h-[18rem] max-sm:max-h-32"
                }`}
              >
                <AnimatePresence initial={false}>
                  {activities.slice(0, 20).map((entry) => (
                    <FeedEntry key={entry.id} entry={entry} />
                  ))}
                </AnimatePresence>

                {activities.length === 0 && (
                  <p className="text-[10px] text-white/20 py-3 text-center italic">
                    The organism waits…
                  </p>
                )}
              </div>
              {!dockLayout && <FeedCommentComposer />}
            </motion.div>
          )}
        </AnimatePresence>

        {phoneLayout && !expanded && activities.length === 0 && (
          <p className="text-[9px] text-white/20 py-2 px-3 text-center italic">The organism waits…</p>
        )}

        {dockLayout && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="w-full py-1.5 text-[9px] uppercase tracking-widest text-violet-300/45 border-t border-white/5 hover:text-violet-300/70 transition-colors"
          >
            {activities.length > 0 ? "Show feed" : "Open feed"}
          </button>
        )}
      </div>
    </motion.div>
  );
}
