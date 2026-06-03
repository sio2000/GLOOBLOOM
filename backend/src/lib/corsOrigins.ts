/**
 * CORS origin handling.
 *
 * FRONTEND_URL holds the canonical site URL(s) (comma-separated), but Netlify
 * also serves the app from rotating site / deploy-preview URLs (e.g.
 * regal-pika-842773.netlify.app). Pinning a single origin breaks whenever that
 * URL changes, so we additionally allow any *.netlify.app host plus localhost.
 */

type CorsCallback = (err: Error | null, allow?: boolean) => void;

/** Configured origins from FRONTEND_URL (trailing slashes stripped). */
export function getCorsOrigins(): string[] {
  const raw = process.env.FRONTEND_URL ?? "http://localhost:3000";
  return raw
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

/** Canonical site URL (first configured origin) — used for redirects/fallbacks. */
export function getPrimaryFrontendUrl(): string {
  return getCorsOrigins()[0] ?? "http://localhost:3000";
}

/** True when the request origin should be allowed to call the API. */
export function isAllowedOrigin(origin?: string | null): boolean {
  // Non-browser clients (curl, server-to-server, same-origin) send no Origin.
  if (!origin) return true;

  const normalized = origin.replace(/\/+$/, "");
  if (getCorsOrigins().includes(normalized)) return true;

  try {
    const { hostname } = new URL(normalized);
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    // Any Netlify production/preview site, and our own Render host.
    if (hostname.endsWith(".netlify.app")) return true;
    if (hostname.endsWith(".onrender.com")) return true;
  } catch {
    return false;
  }

  return false;
}

/**
 * Origin delegate compatible with both the `cors` middleware and socket.io.
 * Returning `true` makes `cors` reflect the request origin back, which is
 * required for `credentials: true` to work (the response must echo the exact
 * Origin, never a wildcard).
 */
export function corsOriginDelegate(
  origin: string | undefined,
  callback: CorsCallback
): void {
  if (isAllowedOrigin(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error(`Origin not allowed by CORS: ${origin}`));
}
