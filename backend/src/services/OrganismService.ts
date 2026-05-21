import { PrismaClient } from "@prisma/client";
import {
  OrganismState,
  OrganismMood,
  Season,
  ActivityEntry,
  ActivityType,
  CreatureType,
} from "../types/index.js";

function parseMeta(metadata: string | null): Record<string, unknown> | undefined {
  if (!metadata) return undefined;
  try { return JSON.parse(metadata) as Record<string, unknown>; }
  catch { return undefined; }
}

// 100 stages — each requires ~5 waterings (6 growth per stage, 1.25 growth per watering)
// calcStage formula: Math.floor(growth / 6) + 1, capped at 100

const MICRO_EVOLUTIONS = [
  "A new tendril slowly uncurled between the branches",
  "The organism's hue shifted — deeper, more alive",
  "A small bud appeared at the tip of a branch",
  "The roots spread further beneath the substrate",
  "A cloud of microscopic spores drifted upward",
  "Faint veins of light appeared on the surface",
  "A new growth node formed at the stem junction",
  "The organism exhaled a breath of luminous mist",
  "Tiny crystalline nodules formed along the bark",
  "The surface pattern deepened, more complex now",
  "A new leaf unfurled from an unexpected angle",
  "The organism pulsed — a heartbeat, almost audible",
];

const RARE_EVENTS = [
  { name: "Crystal Resonance",    description: "The organism hummed a frequency only dreaming things can hear" },
  { name: "Midnight Bloom",       description: "A flower bloomed that only exists in three hours of darkness" },
  { name: "Spore Cascade",        description: "Thousands of luminous spores drifted upward into the void" },
  { name: "Memory Petal",         description: "A petal fell and left a glowing imprint in the air" },
  { name: "Bioluminescent Tide",  description: "Waves of blue-green light pulsed through every branch" },
];

export class OrganismService {
  private prisma: PrismaClient;
  private onBroadcast: ((event: string, data: unknown) => void) | null = null;
  private decayInterval: NodeJS.Timeout | null = null;
  private seasonInterval: NodeJS.Timeout | null = null;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  setbroadcaster(fn: (event: string, data: unknown) => void) {
    this.onBroadcast = fn;
  }

  private broadcast(event: string, data: unknown) {
    if (this.onBroadcast) this.onBroadcast(event, data);
  }

  // ── Extra computed fields ─────────────────────────────
  private async getExtraFields(organismId: string) {
    const [leafCount, uniqueWaterersRaw] = await Promise.all([
      this.prisma.leaf.count({ where: { organismId } }),
      this.prisma.watering.findMany({
        where: { organismId },
        select: { username: true },
        distinct: ["username"],
      }),
    ]);
    return { leafCount, uniqueWaterersCount: uniqueWaterersRaw.length };
  }

  async initialize(): Promise<OrganismState> {
    let organism = await this.prisma.organism.findFirst();
    if (!organism) {
      organism = await this.prisma.organism.create({ data: {} });
      await this.logActivity("milestone", "The organism awakened for the first time", undefined, { stage: 1 });
    }
    this.startDecayLoop();
    this.startSeasonCycle();
    return this.toFullState(organism);
  }

  async getState(): Promise<OrganismState> {
    const organism = await this.prisma.organism.findFirst();
    if (!organism) return this.initialize();
    return this.toFullState(organism);
  }

  private async toFullState(organism: Parameters<typeof this.toBaseState>[0]): Promise<OrganismState> {
    const extra = await this.getExtraFields(organism.id);
    return { ...this.toBaseState(organism), ...extra };
  }

  async water(username: string, sessionId: string): Promise<OrganismState> {
    const organism = await this.prisma.organism.findFirst();
    if (!organism) throw new Error("Organism not found");

    const hydrationGain = parseFloat(process.env.GROWTH_PER_WATERING ?? "2.5");
    const prevStage = this.calcStage(organism.growth);

    const newHydration = Math.min(100, organism.hydration + hydrationGain * 2);
    const newGrowth    = organism.growth + hydrationGain * 0.5;   // NO cap — cumulative up to stage 100
    const newDecay     = Math.max(0,   organism.decay - 2);
    const newBeauty    = Math.min(100, organism.beautyLevel + hydrationGain * 0.3);
    const newBio       = Math.min(100, organism.biodiversity + hydrationGain * 0.2);
    const newStage     = this.calcStage(newGrowth);
    const newMood      = this.calcMood(newHydration, newDecay, newGrowth);

    const updated = await this.prisma.organism.update({
      where: { id: organism.id },
      data: {
        hydration:     newHydration,
        growth:        newGrowth,
        decay:         newDecay,
        beautyLevel:   newBeauty,
        biodiversity:  newBio,
        ecosystemStage: newStage,
        mood:          newMood,
        totalWaterings: { increment: 1 },
        lastWatered:   new Date(),
      },
    });

    await this.prisma.watering.create({
      data: { organismId: organism.id, username, amount: hydrationGain * 2, sessionId },
    });

    await this.logActivity("watering", `${username} watered the organism`, username);
    this.broadcast("watering_effect", { username, sessionId, amount: hydrationGain * 2 });

    // Stage evolution
    if (newStage > prevStage) {
      await this.logActivity("milestone", `Stage ${newStage} reached — the organism evolves`, username, { stage: newStage });
      this.broadcast("mutation_event", { level: newStage, description: `Stage ${newStage} — the organism transcended` });
    }

    // Micro-evolution every 5 waterings
    if (updated.totalWaterings % 5 === 0 && updated.totalWaterings > 0) {
      await this.triggerMicroEvolution(updated.id, updated.totalWaterings);
    }

    if (Math.random() < 0.14) await this.triggerBloom(updated.id);
    if (Math.random() < 0.09) await this.spawnCreature(updated.id, newStage);
    if (Math.random() < 0.04) await this.triggerRareEvent();
    if (updated.totalWaterings % 50 === 0) await this.triggerMutation(updated.id, organism.mutationLevel);

    const fullState = await this.toFullState(updated);
    this.broadcast("organism_state", fullState);
    return fullState;
  }

  async addLeaf(username: string, sessionId: string): Promise<void> {
    const organism = await this.prisma.organism.findFirst();
    if (!organism) return;

    const stage = organism.ecosystemStage;
    const growth = organism.growth;
    const trunkBaseY = -0.48;
    const trunkHeight = 0.55 + stage * 0.095 + growth * 0.014 + (stage >= 50 ? (stage - 50) * 0.045 : 0);
    const trunkRadiusBottom = 0.055 + stage * 0.0035 + growth * 0.0012 + (stage >= 50 ? (stage - 50) * 0.002 : 0);
    const trunkRadiusTop = trunkRadiusBottom * 0.52;

    const majorBranches = [
      { unlockStage: 12, heightPos: 0.28, angle: 0.85, baseLength: 0.95, tilt: 0.42 },
      { unlockStage: 28, heightPos: 0.54, angle: 2.35, baseLength: 1.15, tilt: 0.38 },
      { unlockStage: 45, heightPos: 0.78, angle: 4.55, baseLength: 1.35, tilt: 0.35 },
    ];

    const unlocked = majorBranches.filter((b) => stage >= b.unlockStage);
    const colors = ["#7fff7f","#40ffcc","#a0ff60","#60ffa0","#80ffff","#c0ff80","#ffff80","#ff80c0"];

    let posX: number;
    let posY: number;
    let posZ: number;
    let rotation: number;

    if (unlocked.length > 0 && Math.random() < 0.55) {
      const branch = unlocked[Math.floor(Math.random() * unlocked.length)]!;
      const progress = Math.min(1, (stage - branch.unlockStage) / 14 + 0.35);
      const length = (branch.baseLength + stage * 0.014 + growth * 0.002) * progress;
      const attachY = trunkBaseY + branch.heightPos * trunkHeight;
      const attachR = trunkRadiusBottom + (trunkRadiusTop - trunkRadiusBottom) * branch.heightPos;
      const along = 0.55 + Math.random() * 0.35;
      posY = attachY + Math.sin(branch.tilt) * length * along;
      const tipHoriz = Math.cos(branch.tilt) * length * along + attachR * 0.15;
      posX = Math.cos(branch.angle) * (attachR + tipHoriz);
      posZ = Math.sin(branch.angle) * (attachR + tipHoriz);
      rotation = branch.angle + Math.random() * Math.PI;
    } else {
      const heightPos = 0.08 + Math.random() * 0.88;
      const angle = Math.random() * Math.PI * 2;
      const trunkRadius = trunkRadiusBottom + (trunkRadiusTop - trunkRadiusBottom) * heightPos;
      const surfaceRadius = trunkRadius + 0.03 + Math.random() * 0.04;
      posY = trunkBaseY + heightPos * trunkHeight;
      posX = Math.cos(angle) * surfaceRadius;
      posZ = Math.sin(angle) * surfaceRadius;
      rotation = Math.random() * Math.PI * 2;
    }

    await this.prisma.leaf.create({
      data: {
        organismId: organism.id,
        username,
        color: colors[Math.floor(Math.random() * colors.length)]!,
        posX,
        posY,
        posZ,
        scale: 0.7 + Math.random() * 0.6,
        rotation,
      },
    });

    await this.logActivity("milestone", `${username} placed their name on a leaf`, username);
    const fullState = await this.getState();
    this.broadcast("organism_state", fullState);
    this.broadcast("leaves_update", await this.getLeaves());
  }

  async getLeaves() {
    const organism = await this.prisma.organism.findFirst();
    if (!organism) return [];
    return this.prisma.leaf.findMany({
      where: { organismId: organism.id },
      orderBy: { createdAt: "desc" },
      take: 80,
    });
  }

  async getActivityFeed(limit = 20): Promise<ActivityEntry[]> {
    const logs = await this.prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return logs.map((l) => ({
      id: l.id,
      type: l.type as ActivityType,
      message: l.message,
      username: l.username ?? undefined,
      metadata: parseMeta(l.metadata),
      createdAt: l.createdAt,
    }));
  }

  private async triggerMicroEvolution(organismId: string, waterCount: number) {
    const idx = Math.floor(Math.random() * MICRO_EVOLUTIONS.length);
    const message = MICRO_EVOLUTIONS[idx];
    await this.logActivity("micro_evolution", message!, undefined, { waterCount });
    this.broadcast("micro_evolution", { message, waterings: waterCount });
  }

  private async triggerBloom(organismId: string) {
    const flowers = [
      "a prismatic orchid","a glowing moon-petal","a crystalline lotus",
      "a dream blossom","a spectral rose","an impossible star-flower",
    ];
    const flower = flowers[Math.floor(Math.random() * flowers.length)];
    const pos: [number,number,number] = [(Math.random()-0.5)*3, Math.random()*2, (Math.random()-0.5)*3];
    await this.logActivity("bloom", `${flower} bloomed in the organism`);
    this.broadcast("bloom_event", { flowerType: flower, position: pos });
  }

  private async spawnCreature(organismId: string, stage: number) {
    const getPool = (s: number): CreatureType[] => {
      if (s <  3)  return [];
      if (s <  8)  return ["firefly"];
      if (s < 15)  return ["firefly", "butterfly"];
      if (s < 25)  return ["butterfly", "firefly", "moth"];
      if (s < 40)  return ["butterfly", "moth", "jellyfish"];
      if (s < 60)  return ["moth", "jellyfish", "bird"];
      return ["jellyfish", "bird", "spore", "butterfly", "moth"];
    };
    const pool = getPool(stage);
    if (!pool.length) return;

    const type: CreatureType = pool[Math.floor(Math.random() * pool.length)]!;
    const creature = await this.prisma.creature.create({ data: { organismId, type } });

    const msgs: Record<string, string> = {
      butterfly: "A luminous butterfly emerged from the canopy",
      moth: "A dream moth drifted through the bioluminescent fog",
      jellyfish: "A floating jellyfish-spore rose from the roots",
      firefly: "Fireflies awoke, blinking their ancient morse code",
      bird: "An impossible bird landed briefly and sang one note",
      spore: "Thousands of glowing spores spiraled upward",
    };

    await this.logActivity("creature", msgs[type] ?? `A ${type} appeared`);
    this.broadcast("creature_spawn", { type, id: creature.id });
  }

  private async triggerMutation(organismId: string, currentLevel: number) {
    const newLevel = Math.min(10, currentLevel + 1);
    await this.prisma.organism.update({ where: { id: organismId }, data: { mutationLevel: newLevel } });
    const mutations = [
      "The organism grew translucent veins of light",
      "New impossible geometry emerged from the stem",
      "The organism began humming at a frequency you feel, not hear",
      "Bioluminescent sap started flowing upward, against gravity",
      "Fractal patterns bloomed across every surface",
    ];
    const desc = mutations[Math.min(newLevel - 1, mutations.length - 1)];
    await this.logActivity("mutation", desc!, undefined, { level: newLevel });
    this.broadcast("mutation_event", { level: newLevel, description: desc });
  }

  private async triggerRareEvent() {
    const event = RARE_EVENTS[Math.floor(Math.random() * RARE_EVENTS.length)];
    await this.logActivity("rare_event", event!.description, undefined, { name: event!.name });
    this.broadcast("rare_event", event);
  }

  private startDecayLoop() {
    if (this.decayInterval) clearInterval(this.decayInterval);
    const intervalMs   = parseInt(process.env.DECAY_INTERVAL_MS ?? "60000");
    const lossPerTick  = parseFloat(process.env.HYDRATION_LOSS_PER_MINUTE ?? "0.5") * (intervalMs / 60000);

    this.decayInterval = setInterval(async () => {
      const organism = await this.prisma.organism.findFirst();
      if (!organism) return;

      const minutesSince = (Date.now() - new Date(organism.lastWatered).getTime()) / 60000;
      const decayInc = minutesSince > 20 ? 0.4 : 0;
      const newHydration = Math.max(0, organism.hydration - lossPerTick);
      const newDecay     = Math.min(100, organism.decay + (newHydration < 20 ? decayInc + 0.6 : decayInc));
      const newMood      = this.calcMood(newHydration, newDecay, organism.growth);

      await this.prisma.organism.update({
        where: { id: organism.id },
        data: { hydration: newHydration, decay: newDecay, mood: newMood },
      });

      if (newDecay > 30 && organism.decay <= 30) {
        await this.logActivity("decay", "The organism begins to wither. Leaves curl inward. The light dims.");
      }

      const fullState = await this.toFullState({ ...organism, hydration: newHydration, decay: newDecay, mood: newMood });
      this.broadcast("organism_state", fullState);
    }, intervalMs);
  }

  private startSeasonCycle() {
    if (this.seasonInterval) clearInterval(this.seasonInterval);
    const DURATION = 1000 * 60 * 60 * 6;
    const seasons: Season[] = ["bloom", "mist", "golden_decay", "neon_rain"];

    this.seasonInterval = setInterval(async () => {
      const organism = await this.prisma.organism.findFirst();
      if (!organism) return;
      const next = seasons[(seasons.indexOf(organism.season as Season) + 1) % seasons.length];
      await this.prisma.organism.update({ where: { id: organism.id }, data: { season: next } });
      const names: Record<Season, string> = { bloom: "Season of Bloom", mist: "Season of Mist", golden_decay: "Season of Golden Decay", neon_rain: "Season of Neon Rain" };
      await this.logActivity("season", `The ${names[next]} has begun`, undefined, { season: next });
      this.broadcast("season_change", next);
    }, DURATION);
  }

  async adminReset(): Promise<OrganismState> {
    const organism = await this.prisma.organism.findFirst();
    if (!organism) return this.initialize();
    // clear related data
    await this.prisma.watering.deleteMany({ where: { organismId: organism.id } });
    await this.prisma.leaf.deleteMany({ where: { organismId: organism.id } });
    await this.prisma.creature.deleteMany({ where: { organismId: organism.id } });
    const updated = await this.prisma.organism.update({
      where: { id: organism.id },
      data: { hydration: 50, growth: 0, decay: 0, mutationLevel: 0, beautyLevel: 10, biodiversity: 3, ecosystemStage: 1, mood: "thirsty", totalWaterings: 0, lastWatered: new Date() },
    });
    await this.logActivity("milestone", "The ecosystem was reset. A new cycle begins.");
    const full = await this.toFullState(updated);
    this.broadcast("organism_state", full);
    return full;
  }

  async adminSetSeason(season: Season): Promise<void> {
    const organism = await this.prisma.organism.findFirst();
    if (!organism) return;
    await this.prisma.organism.update({ where: { id: organism.id }, data: { season } });
    this.broadcast("season_change", season);
    await this.logActivity("season", `Season manually shifted to ${season}`);
    this.broadcast("organism_state", await this.getState());
  }

  async adminAccelerateDecay(): Promise<OrganismState> {
    const organism = await this.prisma.organism.findFirst();
    if (!organism) throw new Error("No organism");
    const updated = await this.prisma.organism.update({
      where: { id: organism.id },
      data: { hydration: Math.max(0, organism.hydration - 30), decay: Math.min(100, organism.decay + 25), mood: "decaying" },
    });
    await this.logActivity("decay", "Temporal decay was accelerated by an external force.");
    return this.toFullState(updated);
  }

  async adminForceMutation(): Promise<OrganismState> {
    const organism = await this.prisma.organism.findFirst();
    if (!organism) throw new Error("No organism");
    await this.triggerMutation(organism.id, organism.mutationLevel);
    return this.getState();
  }

  async adminSpawnCreatures(): Promise<void> {
    const organism = await this.prisma.organism.findFirst();
    if (!organism) return;
    for (let i = 0; i < 3; i++) await this.spawnCreature(organism.id, organism.ecosystemStage);
  }

  async adminTriggerBloom(): Promise<void> {
    const organism = await this.prisma.organism.findFirst();
    if (!organism) return;
    await this.triggerBloom(organism.id);
  }

  private calcStage(growth: number): number {
    // 6 growth points per stage, ~5 waterings each (at 1.25 growth/watering)
    return Math.min(Math.max(Math.floor(growth / 6) + 1, 1), 100);
  }

  private calcMood(hydration: number, decay: number, growth: number): OrganismMood {
    const stage = this.calcStage(growth);
    if (stage >= 80 && hydration > 70) return "transcendent";
    if (hydration > 75 && decay < 10)  return "thriving";
    if (hydration > 50 && decay < 25)  return "content";
    if (hydration < 25 && decay < 30)  return "thirsty";
    if (decay > 60)                    return "critical";
    if (decay > 30)                    return "decaying";
    return "dormant";
  }

  private toBaseState(organism: {
    id: string; hydration: number; growth: number; decay: number;
    mutationLevel: number; beautyLevel: number; biodiversity: number;
    ecosystemStage: number; mood: string; season: string;
    totalWaterings: number; totalUsers: number; lastWatered: Date; updatedAt: Date;
  }): Omit<OrganismState, "leafCount" | "uniqueWaterersCount"> {
    return {
      id: organism.id,
      hydration: organism.hydration,
      growth: organism.growth,
      decay: organism.decay,
      mutationLevel: organism.mutationLevel,
      beautyLevel: organism.beautyLevel,
      biodiversity: organism.biodiversity,
      ecosystemStage: organism.ecosystemStage,
      mood: organism.mood as OrganismMood,
      season: organism.season as Season,
      totalWaterings: organism.totalWaterings,
      totalUsers: organism.totalUsers,
      lastWatered: organism.lastWatered,
      updatedAt: organism.updatedAt,
    };
  }

  private async logActivity(type: ActivityType, message: string, username?: string, metadata?: Record<string, unknown>) {
    const entry = await this.prisma.activityLog.create({
      data: { type, message, username: username ?? null, metadata: metadata ? JSON.stringify(metadata) : null },
    });
    this.broadcast("activity", {
      id: entry.id, type, message, username, metadata, createdAt: entry.createdAt,
    });
  }

  destroy() {
    if (this.decayInterval) clearInterval(this.decayInterval);
    if (this.seasonInterval) clearInterval(this.seasonInterval);
  }
}
