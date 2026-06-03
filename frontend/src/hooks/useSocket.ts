"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { WS_URL } from "@/lib/constants";
import { useOrganismStore } from "@/store/useOrganismStore";
import { getOrCreateSessionId } from "@/lib/utils";
import {
  OrganismState,
  ActivityEntry,
  WateringEffect,
  BloomEvent,
  CreatureSpawnEvent,
  MutationEvent,
  MicroEvolutionEvent,
  RareEvent,
  Season,
  LeafData,
} from "@/types/organism";
import {
  isMobileRuntime,
  throttle,
  MOBILE_WS_STATE_THROTTLE_MS,
  MOBILE_WS_LEAVES_THROTTLE_MS,
} from "@/lib/mobilePerf";

let socketInstance: Socket | null = null;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (socketInstance) {
      socketRef.current = socketInstance;
      return;
    }

    const sessionId = getOrCreateSessionId();
    const mobile = isMobileRuntime();

    const socket = io(WS_URL, {
      query: { sessionId },
      transports: mobile ? ["websocket"] : ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketInstance = socket;
    socketRef.current = socket;

    const onOrganismState = (state: OrganismState) =>
      useOrganismStore.getState().setState(state);
    const onLeavesUpdate = (leaves: LeafData[]) =>
      useOrganismStore.getState().setLeaves(leaves);

    const throttledState = mobile
      ? throttle(onOrganismState, MOBILE_WS_STATE_THROTTLE_MS)
      : null;
    const throttledLeaves = mobile
      ? throttle(onLeavesUpdate, MOBILE_WS_LEAVES_THROTTLE_MS)
      : null;

    socket.on("connect", () => {
      console.log("[WS] Connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[WS] Disconnected:", reason);
    });

    socket.on("organism_state", throttledState ?? onOrganismState);
    socket.on("leaves_update", throttledLeaves ?? onLeavesUpdate);

    socket.on("activity", (entry: ActivityEntry) => {
      useOrganismStore.getState().addActivity(entry);
    });

    socket.on("online_count", (count: number) => {
      useOrganismStore.getState().setOnlineCount(count);
    });

    socket.on("watering_effect", (data: WateringEffect) => {
      useOrganismStore.getState().addWateringEffect({
        id: `we_${Date.now()}_${Math.random()}`,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        username: data.username,
        timestamp: Date.now(),
      });
    });

    socket.on("bloom_event", (data: BloomEvent) => {
      const store = useOrganismStore.getState();
      store.setPendingBloom(data);
      store.showNotif(`🌸 ${data.flowerType} bloomed`, "bloom");
      setTimeout(() => useOrganismStore.getState().setPendingBloom(null), 4000);
    });

    socket.on("creature_spawn", (data: CreatureSpawnEvent) => {
      useOrganismStore.getState().addCreature({ id: data.id, type: data.type });
      setTimeout(() => useOrganismStore.getState().removeCreature(data.id), 25000);
    });

    socket.on("mutation_event", (data: MutationEvent) => {
      const store = useOrganismStore.getState();
      store.setPendingMutation(data);
      store.showNotif(`✨ ${data.description}`, "mutation");
      setTimeout(() => useOrganismStore.getState().setPendingMutation(null), 6000);
    });

    socket.on("season_change", (season: Season) => {
      useOrganismStore.getState().showNotif(`🌙 Season changed: ${season.replace("_", " ")}`, "season");
    });

    socket.on("rare_event", (data: RareEvent) => {
      const store = useOrganismStore.getState();
      store.setPendingRareEvent(data);
      store.showNotif(`🌟 RARE: ${data.name}`, "rare");
      setTimeout(() => useOrganismStore.getState().setPendingRareEvent(null), 8000);
    });

    socket.on("micro_evolution", (data: MicroEvolutionEvent) => {
      useOrganismStore.getState().showNotif(`🧬 ${data.message}`, "micro_evolution");
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("organism_state", throttledState ?? onOrganismState);
      socket.off("leaves_update", throttledLeaves ?? onLeavesUpdate);
      socket.off("activity");
      socket.off("online_count");
      socket.off("watering_effect");
      socket.off("bloom_event");
      socket.off("creature_spawn");
      socket.off("mutation_event");
      socket.off("season_change");
      socket.off("rare_event");
      socket.off("micro_evolution");
      throttledState?.cancel();
      throttledLeaves?.cancel();
    };
  }, []);

  const water = (username: string) => {
    const socket = socketRef.current ?? socketInstance;
    if (!socket) return;
    socket.emit("water", {
      username: username || "Anonymous",
      amount: 10,
      sessionId: getOrCreateSessionId(),
    });
  };

  const addLeaf = (username: string) => {
    const socket = socketRef.current ?? socketInstance;
    if (!socket) return;
    socket.emit("add_leaf", {
      username,
      sessionId: getOrCreateSessionId(),
    });
  };

  const postComment = (username: string, message: string) => {
    const socket = socketRef.current ?? socketInstance;
    if (!socket) return;
    socket.emit("post_comment", {
      username: username || "Anonymous",
      message,
      sessionId: getOrCreateSessionId(),
    });
  };

  return { water, addLeaf, postComment };
}
