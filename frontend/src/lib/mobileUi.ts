export type MobilePanel = "stats" | "lore" | "dev" | "feed";

export interface MobilePanelSlice {
  mobileStatsExpanded: boolean;
  showLoreSheet: boolean;
  mobileDevOpen: boolean;
  mobileFeedOpen: boolean;
}

export function mobilePanelSnapshot(s: MobilePanelSlice): MobilePanel | null {
  if (s.showLoreSheet) return "lore";
  if (s.mobileDevOpen) return "dev";
  if (s.mobileFeedOpen) return "feed";
  if (s.mobileStatsExpanded) return "stats";
  return null;
}

/** Only one mobile panel open at a time. Pass null to close all. */
export function mobilePanelPatch(panel: MobilePanel | null): Partial<MobilePanelSlice> {
  return {
    mobileStatsExpanded: panel === "stats",
    showLoreSheet: panel === "lore",
    mobileDevOpen: panel === "dev",
    mobileFeedOpen: panel === "feed",
  };
}
