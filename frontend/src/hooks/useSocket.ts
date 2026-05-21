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
} from "@/types/organism";

let socketInstance: Socket | null = null;

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const store = useOrganismStore();

  useEffect(() => {
    if (socketInstance) {
      socketRef.current = socketInstance;
      return;
    }

    const sessionId = getOrCreateSessionId();

    const socket = io(WS_URL, {
      query: { sessionId },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketInstance = socket;
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[WS] Connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("[WS] Disconnected:", reason);
    });

    socket.on("organism_state", (state: OrganismState) => {
      store.setState(state);
    });

    socket.on("leaves_update", (leaves) => {
      store.setLeaves(leaves);
    });

    socket.on("activity", (entry: ActivityEntry) => {
      store.addActivity(entry);
    });

    socket.on("online_count", (count: number) => {
      store.setOnlineCount(count);
    });

    socket.on("watering_effect", (data: WateringEffect) => {
      store.addWateringEffect({
        id: `we_${Date.now()}_${Math.random()}`,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        username: data.username,
        timestamp: Date.now(),
      });
    });

    socket.on("bloom_event", (data: BloomEvent) => {
      store.setPendingBloom(data);
      store.showNotif(`🌸 ${data.flowerType} bloomed`, "bloom");
      setTimeout(() => store.setPendingBloom(null), 4000);
    });

    socket.on("creature_spawn", (data: CreatureSpawnEvent) => {
      store.addCreature({ id: data.id, type: data.type });
      setTimeout(() => store.removeCreature(data.id), 25000);
    });

    socket.on("mutation_event", (data: MutationEvent) => {
      store.setPendingMutation(data);
      store.showNotif(`✨ ${data.description}`, "mutation");
      setTimeout(() => store.setPendingMutation(null), 6000);
    });

    socket.on("season_change", (season: Season) => {
      store.showNotif(`🌙 Season changed: ${season.replace("_", " ")}`, "season");
    });

    socket.on("rare_event", (data: RareEvent) => {
      store.setPendingRareEvent(data);
      store.showNotif(`🌟 RARE: ${data.name}`, "rare");
      setTimeout(() => store.setPendingRareEvent(null), 8000);
    });

    socket.on("micro_evolution", (data: MicroEvolutionEvent) => {
      store.showNotif(`🧬 ${data.message}`, "micro_evolution");
    });

    return () => {};
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

  return { water, addLeaf };
}
