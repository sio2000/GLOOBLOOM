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
import { WateringButton } from "@/components/ui/WateringButton";
import { ActivityFeed } from "@/components/ui/ActivityFeed";
import { WaterModal } from "@/components/ui/WaterModal";
import { LeafModal } from "@/components/ui/LeafModal";
import { AdminPanel } from "@/components/ui/AdminPanel";
import { SeasonIndicator } from "@/components/ui/SeasonIndicator";
import { NotificationToast } from "@/components/ui/NotificationToast";
import { NameLeafButton } from "@/components/ui/NameLeafButton";
import { DevPanel } from "@/components/ui/DevPanel";
import { CameraControls } from "@/components/ui/CameraControls";
import { AudioToggle } from "@/components/ui/AudioToggle";
import { TitleSplash } from "@/components/ui/TitleSplash";
import { ADMIN_SECRET } from "@/lib/constants";

// R3F Canvas must be client-only and not SSR'd
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
  const { updateMood } = useAudioSystem();
  const state = useOrganismStore((s) => s.state);

  // Initialise socket connection
  useSocket();

  // Check admin access via URL param
  const searchParams = useSearchParams();
  const adminKey = searchParams.get("admin");
  const isAdmin = adminKey === ADMIN_SECRET && ADMIN_SECRET.length > 0;

  // Load initial data from REST API (fallback / SSR-safe bootstrap)
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
        // Socket will provide state when connected
      }
    }
    bootstrap();
  }, []);

  // Keep audio in sync with organism mood
  useEffect(() => {
    if (state) {
      updateMood(state.mood, state.season);
    }
  }, [state?.mood, state?.season]);

  // Keyboard shortcut for admin panel
  useEffect(() => {
    if (!isAdmin) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "`") setShowAdminPanel(!showAdminPanel);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isAdmin, showAdminPanel]);

  return (
    <main className="relative w-screen h-[100dvh] overflow-hidden no-select touch-none">
      {/* 3D scene - full screen */}
      <GloobloomScene />

      {/* UI overlay */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <div className="pointer-events-auto">
          <StatsPanel />
          <SeasonIndicator />
          <ActivityFeed />
          <WateringButton />
          <NameLeafButton />
          <DevPanel />
          <CameraControls />
        </div>
      </div>

      <TitleSplash show={!isLoading} />
      <AudioToggle />

      {/* Admin panel toggle */}
      {isAdmin && (
        <div className="fixed top-4 right-40 z-30">
          <button
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className="px-3 py-1.5 rounded-lg border border-violet-400/20 bg-black/40 text-violet-300/60 text-[10px] tracking-wider uppercase hover:border-violet-400/40 transition-all backdrop-blur-sm"
          >
            ⚙ Admin
          </button>
        </div>
      )}
      <AdminPanel />

      {/* Modals — each fully independent */}
      <WaterModal />
      <LeafModal />
      <NotificationToast />
      <LoadingScreen isLoading={isLoading} />
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
