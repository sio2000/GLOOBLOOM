/** Render service name from render.yaml — override with Netlify env vars if different */
const PRODUCTION_API_URL = "https://gloobloom-api.onrender.com";

function resolveApiUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") return PRODUCTION_API_URL;
  return "http://localhost:4000";
}

export const API_URL = resolveApiUrl();
export const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL?.trim()?.replace(/\/$/, "") || API_URL;

/** Must match backend ADMIN_SECRET (see backend/.env.example). */
const DEV_ADMIN_SECRET = "gloobloom-admin-secret-change-me";

export const ADMIN_SECRET =
  process.env.NEXT_PUBLIC_ADMIN_SECRET?.trim() ||
  (process.env.NODE_ENV === "development" ? DEV_ADMIN_SECRET : "");

export const WATERING_COOLDOWN_MS = 3000;

export const MAX_ACTIVITY_ENTRIES = 30;

export const PARTICLE_COUNT = {
  low: 120,
  medium: 280,
  high: 500,
};

export const CREATURE_LIMITS = {
  butterflies: 6,
  moths: 4,
  jellyfish: 5,
  fireflies: 12,
  birds: 3,
  spores: 8,
};
