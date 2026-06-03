/** Mirrors backend water/vitality tiers (hydration %). */

export const LIFE_LOW_THRESHOLD = 30;
export const LIFE_CRITICAL_THRESHOLD = 5;

export function getLifeTier(level: number): "healthy" | "twilight" | "critical" | "dead" {
  if (level <= 0) return "dead";
  if (level <= LIFE_CRITICAL_THRESHOLD) return "critical";
  if (level <= LIFE_LOW_THRESHOLD) return "twilight";
  return "healthy";
}

export function getVitalityColor(level: number): string {
  const tier = getLifeTier(level);
  if (tier === "critical") return "#f87171";
  if (tier === "twilight") return "#fbbf24";
  if (tier === "dead") return "#64748b";
  return "#38bdf8";
}
