import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
  OrganismState,
  ActivityEntry,
  LeafData,
  BloomEvent,
  CreatureSpawnEvent,
  MutationEvent,
  RareEvent,
  WateringEffect,
} from "@/types/organism";
import { PaymentAction } from "@/lib/payments";
import { mobilePanelPatch, type MobilePanel } from "@/lib/mobileUi";

export interface StripeCheckoutState {
  clientSecret: string;
  sessionId: string;
  action: PaymentAction;
  quantity: number;
  publishableKey: string;
}

export interface PaymentCelebrationState {
  action: PaymentAction;
  username?: string;
  quantity?: number;
}

interface WateringParticle {
  id: string;
  x: number;
  y: number;
  username: string;
  timestamp: number;
}

interface OrganismStore {
  state: OrganismState | null;
  activities: ActivityEntry[];
  leaves: LeafData[];
  onlineCount: number;
  isLoading: boolean;
  isWatering: boolean;
  wateringCooldown: boolean;
  username: string;
  showUsernameModal: boolean;
  showWaterModal: boolean;
  showLeafModal: boolean;
  showLoreSheet: boolean;
  mobileStatsExpanded: boolean;
  mobileDevOpen: boolean;
  mobileFeedOpen: boolean;
  showAdminPanel: boolean;
  pendingWateringEffects: WateringParticle[];
  activeCreatures: { id: string; type: string; spawnedAt: number }[];
  pendingBloom: BloomEvent | null;
  pendingMutation: MutationEvent | null;
  pendingRareEvent: RareEvent | null;
  showNotification: { message: string; type: string } | null;
  stripeCheckout: StripeCheckoutState | null;
  paymentCelebration: PaymentCelebrationState | null;

  setState: (state: OrganismState) => void;
  addActivity: (entry: ActivityEntry) => void;
  setOnlineCount: (count: number) => void;
  setIsLoading: (v: boolean) => void;
  setIsWatering: (v: boolean) => void;
  setWateringCooldown: (v: boolean) => void;
  setUsername: (name: string) => void;
  setShowUsernameModal: (v: boolean) => void;
  setShowWaterModal: (v: boolean) => void;
  setShowLeafModal: (v: boolean) => void;
  setShowLoreSheet: (v: boolean) => void;
  openMobilePanel: (panel: MobilePanel | null) => void;
  toggleMobilePanel: (panel: MobilePanel) => void;
  setShowAdminPanel: (v: boolean) => void;
  setLeaves: (leaves: LeafData[]) => void;
  addWateringEffect: (effect: WateringParticle) => void;
  removeWateringEffect: (id: string) => void;
  addCreature: (creature: { id: string; type: string }) => void;
  removeCreature: (id: string) => void;
  setPendingBloom: (event: BloomEvent | null) => void;
  setPendingMutation: (event: MutationEvent | null) => void;
  setPendingRareEvent: (event: RareEvent | null) => void;
  showNotif: (message: string, type?: string) => void;
  clearNotif: () => void;
  setStripeCheckout: (checkout: StripeCheckoutState | null) => void;
  setPaymentCelebration: (celebration: PaymentCelebrationState | null) => void;
  clearPaymentCelebration: () => void;
}

export const useOrganismStore = create<OrganismStore>()(
  subscribeWithSelector((set, get) => ({
    state: null,
    activities: [],
    leaves: [],
    onlineCount: 0,
    isLoading: true,
    isWatering: false,
    wateringCooldown: false,
    username: "",
    showUsernameModal: false,
    showWaterModal: false,
    showLeafModal: false,
    showLoreSheet: false,
    mobileStatsExpanded: false,
    mobileDevOpen: false,
    mobileFeedOpen: false,
    showAdminPanel: false,
    pendingWateringEffects: [],
    activeCreatures: [],
    pendingBloom: null,
    pendingMutation: null,
    pendingRareEvent: null,
    showNotification: null,
    stripeCheckout: null,
    paymentCelebration: null,

    setState: (state) => set({ state, isLoading: false }),

    addActivity: (entry) =>
      set((s) => ({
        activities: [entry, ...s.activities].slice(0, 30),
      })),

    setOnlineCount: (count) => set({ onlineCount: count }),
    setIsLoading: (v) => set({ isLoading: v }),
    setIsWatering: (v) => set({ isWatering: v }),
    setWateringCooldown: (v) => set({ wateringCooldown: v }),
    setUsername: (name) => set({ username: name }),
    setShowUsernameModal: (v) => set({ showUsernameModal: v }),
    setShowWaterModal: (v) =>
      set(v ? { showWaterModal: true, ...mobilePanelPatch(null) } : { showWaterModal: false }),
    setShowLeafModal: (v) =>
      set(v ? { showLeafModal: true, ...mobilePanelPatch(null) } : { showLeafModal: false }),
    setShowLoreSheet: (v) =>
      set(v ? mobilePanelPatch("lore") : { showLoreSheet: false }),
    openMobilePanel: (panel) => set(mobilePanelPatch(panel)),
    toggleMobilePanel: (panel) => {
      const s = get();
      const isOpen =
        (panel === "stats" && s.mobileStatsExpanded) ||
        (panel === "lore" && s.showLoreSheet) ||
        (panel === "dev" && s.mobileDevOpen) ||
        (panel === "feed" && s.mobileFeedOpen);
      set(mobilePanelPatch(isOpen ? null : panel));
    },
    setShowAdminPanel: (v) => set({ showAdminPanel: v }),
    setLeaves: (leaves) => set({ leaves }),

    addWateringEffect: (effect) =>
      set((s) => ({
        pendingWateringEffects: [...s.pendingWateringEffects, effect].slice(-20),
      })),

    removeWateringEffect: (id) =>
      set((s) => ({
        pendingWateringEffects: s.pendingWateringEffects.filter((e) => e.id !== id),
      })),

    addCreature: (creature) =>
      set((s) => ({
        activeCreatures: [
          ...s.activeCreatures,
          { ...creature, spawnedAt: Date.now() },
        ].slice(-15),
      })),

    removeCreature: (id) =>
      set((s) => ({
        activeCreatures: s.activeCreatures.filter((c) => c.id !== id),
      })),

    setPendingBloom: (event) => set({ pendingBloom: event }),
    setPendingMutation: (event) => set({ pendingMutation: event }),
    setPendingRareEvent: (event) => set({ pendingRareEvent: event }),

    showNotif: (message, type = "info") =>
      set({ showNotification: { message, type } }),

    clearNotif: () => set({ showNotification: null }),

    setStripeCheckout: (checkout) =>
      set({
        stripeCheckout: checkout,
        ...(checkout ? mobilePanelPatch(null) : {}),
      }),
    setPaymentCelebration: (celebration) => set({ paymentCelebration: celebration }),
    clearPaymentCelebration: () => set({ paymentCelebration: null }),
  }))
);
