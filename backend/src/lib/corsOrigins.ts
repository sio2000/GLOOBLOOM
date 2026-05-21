/** Comma-separated FRONTEND_URL — supports Netlify production + preview URLs */
export function getCorsOrigins(): string | string[] {
  const raw = process.env.FRONTEND_URL ?? "http://localhost:3000";
  const origins = raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  return origins.length === 1 ? origins[0]! : origins;
}
