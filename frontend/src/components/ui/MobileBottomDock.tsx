"use client";

import { useState } from "react";
import { ActivityFeed, FeedCommentComposer } from "@/components/ui/ActivityFeed";
import { OrganismActionButtons } from "@/components/ui/OrganismActionButtons";
import { useHasMounted } from "@/hooks/useHasMounted";
import { useUiOverlayActive } from "@/hooks/useUiOverlayActive";
import { useOrganismStore } from "@/store/useOrganismStore";

/** Mobile: compact actions; feed/comment expand on demand. Hidden when modals open. */
export function MobileBottomDock() {
  const mounted = useHasMounted();
  const overlayActive = useUiOverlayActive();
  const mobileFeedOpen = useOrganismStore((s) => s.mobileFeedOpen);
  const toggleMobilePanel = useOrganismStore((s) => s.toggleMobilePanel);

  if (!mounted || overlayActive) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex flex-col gap-2 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pointer-events-none sm:hidden"
      aria-label="Actions"
    >
      {mobileFeedOpen && (
        <div className="pointer-events-auto flex flex-col gap-2 min-w-0">
          <ActivityFeed layout="dock" />
          <FeedCommentComposer compact />
        </div>
      )}

      <div className="pointer-events-auto flex flex-col gap-2 rounded-t-2xl border border-white/8 bg-black/90 px-3 pt-2 pb-2 shadow-[0_-8px_40px_rgba(0,0,0,0.5)]">
        <button
          type="button"
          onClick={() => toggleMobilePanel("feed")}
          className="w-full py-2 min-h-[44px] text-[9px] uppercase tracking-widest text-white/35 hover:text-white/55 transition-colors touch-manipulation"
        >
          {mobileFeedOpen ? "Hide feed & comments ▾" : "Live feed & comments ▴"}
        </button>

        <OrganismActionButtons />
      </div>
    </div>
  );
}
