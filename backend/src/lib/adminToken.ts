import crypto from "crypto";

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

export function getDashboardPassword(): string | null {
  const value = process.env.ADMIN_PANEL_PASSWORD?.trim();
  return value || null;
}

export function issueDashboardToken(): string {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) {
    throw new Error("ADMIN_SECRET is not configured");
  }
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ exp, role: "dashboard" })).toString(
    "base64url"
  );
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyDashboardToken(token: string | undefined): boolean {
  if (!token?.trim()) return false;
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) return false;

  const [payload, sig] = token.trim().split(".");
  if (!payload || !sig) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  if (sig !== expected) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      exp?: number;
      role?: string;
    };
    if (data.role !== "dashboard") return false;
    if (!data.exp || Date.now() > data.exp) return false;
    return true;
  } catch {
    return false;
  }
}
