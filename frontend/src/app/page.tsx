"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useOrganismStore } from "@/store/useOrganismStore";
import { useSocket } from "@/hooks/useSocket";
import { useAudioSystem } from "@/hooks/useAudioSystem";
import { api } from "@/lib/api";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { StatsPanel } from "@/components/ui/StatsPanel";
import { OrganismActionButtons } from "@/components/ui/OrganismActionButtons";
import { ActivityFeed } from "@/components/ui/ActivityFeed";
import { MobileBottomDock } from "@/components/ui/MobileBottomDock";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { MobileTopUtilityBar } from "@/components/ui/MobileTopUtilityBar";
import { CameraControls } from "@/components/ui/CameraControls";
import { AudioToggle } from "@/components/ui/AudioToggle";
import { TitleSplash } from "@/components/ui/TitleSplash";
import { PaymentReturnHandler } from "@/components/ui/PaymentReturnHandler";
import { ADMIN_SECRET } from "@/lib/constants";

const WaterModal = dynamic(
  () => import("@/components/ui/WaterModal").then((m) => m.WaterModal),
  { ssr: false }
);
const LeafModal = dynamic(
  () => import("@/components/ui/LeafModal").then((m) => m.LeafModal),
  { ssr: false }
);
const AdminPanel = dynamic(
  () => import("@/components/ui/AdminPanel").then((m) => m.AdminPanel),
  { ssr: false }
);
const DevPanel = dynamic(
  () => import("@/components/ui/DevPanel").then((m) => m.DevPanel),
  { ssr: false }
);
const StripeCheckoutOverlay = dynamic(
  () =>
    import("@/components/ui/StripeCheckoutOverlay").then(
      (m) => m.StripeCheckoutOverlay
    ),
  { ssr: false }
);
const PaymentCelebrationModal = dynamic(
  () =>
    import("@/components/ui/PaymentCelebrationModal").then(
      (m) => m.PaymentCelebrationModal
    ),
  { ssr: false }
);

const GloobloomScene = dynamic(
  () =>
    import("@/components/three/GloobloomScene").then(
      (m) => m.GloobloomScene
    ),
  { ssr: false, loading: () => null }
);

function GloobloomApp() {
  const isLoading = useOrganismStore((s) => s.isLoading);
  const setState = useOrganismStore((s) => s.setState);
  const setLeaves = useOrganismStore((s) => s.setLeaves);
  const addActivity = useOrganismStore((s) => s.addActivity);
  const setShowAdminPanel = useOrganismStore((s) => s.setShowAdminPanel);
  const showAdminPanel = useOrganismStore((s) => s.showAdminPanel);
  const setIsLoading = useOrganismStore((s) => s.setIsLoading);
  const showNotif = useOrganismStore((s) => s.showNotif);
  const { updateMood } = useAudioSystem();
  const state = useOrganismStore((s) => s.state);

  useSocket();

  const searchParams = useSearchParams();
  const adminKey = searchParams.get("admin");
  const isAdmin = adminKey === ADMIN_SECRET && ADMIN_SECRET.length > 0;

  useEffect(() => {
    async function bootstrap() {
      try {
        const [orgState, leaves, activities] = await Promise.all([
          api.getState(),
          api.getLeaves(),
          api.getActivity(20),
        ]);
        setState(orgState);
        setLeaves(leaves);
        activities.forEach(addActivity);
      } catch {
        showNotif(
          "Could not reach the Gloobloom server. Check that the Render API is running.",
          "decay"
        );
        setIsLoading(false);
      }
    }
    bootstrap();
  }, [addActivity, setIsLoading, setLeaves, setState, showNotif]);

  useEffect(() => {
    if (state) {
      updateMood(state.mood, state.season);
    }
  }, [state?.mood, state?.season]);

  useEffect(() => {
    if (!isAdmin) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "`") setShowAdminPanel(!showAdminPanel);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isAdmin, showAdminPanel]);

  return (
    <main className="relative w-screen h-[100dvh] overflow-hidden no-select">
      {/* 3D — own layer so touch gestures reach OrbitControls */}
      <div className="fixed inset-0 z-0 touch-none">
        <GloobloomScene />
      </div>

      {/* UI overlay — interactive controls only */}
      <div className="absolute inset-0 pointer-events-none z-20 max-sm:[contain:strict]">
        <div className="pointer-events-auto">
          <StatsPanel />
        </div>

        <ActivityFeed layout="floating" />

        <div className="pointer-events-auto">
          <OrganismActionButtons className="hidden sm:flex fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto" />

          <div className="hidden sm:flex fixed right-4 z-30 flex-col items-center gap-3 pointer-events-auto top-[17%]">
            <AudioToggle />
            <CameraControls />
          </div>

          <div className="sm:hidden fixed left-2 z-30 pointer-events-auto top-1/2 -translate-y-1/2">
            <CameraControls />
          </div>

          <MobileTopUtilityBar />
          <DevPanel />
        </div>
      </div>

      <TitleSplash show={!isLoading} />

      {isAdmin && (
        <div className="fixed top-4 right-4 max-sm:top-[max(0.5rem,env(safe-area-inset-top))] max-sm:right-2 z-30 pointer-events-auto">
          <button
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className="px-3 py-1.5 rounded-lg border border-violet-400/20 bg-black/40 text-violet-300/60 text-[10px] tracking-wider uppercase hover:border-violet-400/40 transition-all backdrop-blur-sm"
          >
            ⚙ Admin
          </button>
        </div>
      )}
      <AdminPanel />

      <PaymentReturnHandler />
      <StripeCheckoutOverlay />
      <PaymentCelebrationModal />
      <WaterModal />
      <LeafModal />
      <NotificationToast />
      <LoadingScreen isLoading={isLoading} />
      <MobileBottomDock />
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <GloobloomApp />
    </Suspense>
  );
}
