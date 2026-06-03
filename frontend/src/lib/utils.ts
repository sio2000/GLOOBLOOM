import { OrganismMood, Season } from "@/types/organism";

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

export function hexToRgb(
  hex: string
): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : null;
}

export function getMoodColor(mood: OrganismMood): string {
  const colors: Record<OrganismMood, string> = {
    transcendent: "#ffd700",
    thriving: "#4ade80",
    content: "#60a5fa",
    thirsty: "#fb923c",
    dormant: "#94a3b8",
    decaying: "#a78bfa",
    critical: "#f87171",
  };
  return colors[mood] ?? "#94a3b8";
}

export function getSeasonColor(season: Season): string {
  const colors: Record<Season, string> = {
    bloom: "#4ade80",
    mist: "#94a3b8",
    golden_decay: "#fbbf24",
    neon_rain: "#818cf8",
  };
  return colors[season] ?? "#4ade80";
}

export function formatTimeAgo(date: string | Date): string {
  const d = new Date(date);
  const now = Date.now();
  const diff = now - d.getTime();

  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function generateSessionId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const SESSION_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return generateSessionId();
  const stored = sessionStorage.getItem("gloobloom_session");
  if (stored && SESSION_UUID_RE.test(stored)) return stored;
  const id = generateSessionId();
  sessionStorage.setItem("gloobloom_session", id);
  return id;
}

export function getActivityIcon(type: string): string {
  const icons: Record<string, string> = {
    watering: "💧",
    bloom: "🌸",
    mutation: "✨",
    decay: "🍂",
    creature: "🦋",
    season: "🌙",
    milestone: "⭐",
    rare_event: "🌟",
    micro_evolution: "🧬",
    comment: "💬",
  };
  return icons[type] ?? "🌿";
}

export function truncateUsername(name: string, max = 16): string {
  return name.length > max ? name.slice(0, max) + "…" : name;
}
