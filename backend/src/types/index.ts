export type OrganismMood =
  | "transcendent"
  | "thriving"
  | "content"
  | "thirsty"
  | "dormant"
  | "decaying"
  | "critical";

export type Season = "bloom" | "mist" | "golden_decay" | "neon_rain";

export type CreatureType =
  | "butterfly"
  | "moth"
  | "jellyfish"
  | "firefly"
  | "bird"
  | "spore";

export type ActivityType =
  | "watering"
  | "bloom"
  | "mutation"
  | "decay"
  | "creature"
  | "season"
  | "milestone"
  | "rare_event"
  | "micro_evolution"
  | "comment";

export interface OrganismState {
  id: string;
  hydration: number;
  growth: number;
  decay: number;
  mutationLevel: number;
  beautyLevel: number;
  biodiversity: number;
  ecosystemStage: number;
  mood: OrganismMood;
  season: Season;
  totalWaterings: number;
  totalUsers: number;
  leafCount: number;
  uniqueWaterersCount: number;
  lastWatered: Date;
  updatedAt: Date;
}

export interface LeafData {
  id: string;
  username: string;
  color: string;
  posX: number;
  posY: number;
  posZ: number;
  scale: number;
  rotation: number;
}

export interface WateringEvent {
  username: string;
  amount: number;
  sessionId: string;
}

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  message: string;
  username?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ServerToClientEvents {
  organism_state: (state: OrganismState) => void;
  leaves_update: (leaves: LeafData[]) => void;
  activity: (entry: ActivityEntry) => void;
  online_count: (count: number) => void;
  watering_effect: (data: { username: string; sessionId: string; amount: number }) => void;
  bloom_event: (data: { flowerType: string; position: [number, number, number] }) => void;
  creature_spawn: (data: { type: CreatureType; id: string }) => void;
  mutation_event: (data: { level: number; description: string }) => void;
  micro_evolution: (data: { message: string; waterings: number }) => void;
  season_change: (season: Season) => void;
  rare_event: (data: { name: string; description: string }) => void;
  payment_required: (data: { action: "water" | "leaf" | "comment" }) => void;
}

export interface ClientToServerEvents {
  water: (data: WateringEvent) => void;
  add_leaf: (data: { username: string; sessionId: string }) => void;
  post_comment: (data: { username: string; message: string; sessionId: string }) => void;
  ping: () => void;
}

export interface AdminCommand {
  action: "reset" | "mutate" | "rain" | "season" | "decay" | "creatures" | "bloom";
  payload?: Record<string, unknown>;
}
