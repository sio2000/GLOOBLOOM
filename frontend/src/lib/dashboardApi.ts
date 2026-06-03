import { API_URL } from "./constants";

const TOKEN_KEY = "gloobloom_dashboard_token";

export interface DashboardStats {
  generatedAt: string;
  onlineNow: number;
  organism: Record<string, unknown>;
  totals: {
    leaves: number;
    waterings: number;
    activities: number;
    activeCreatures: number;
  };
  payments: {
    pending: number;
    paid: number;
    consumed: number;
    expired: number;
    revenueCents: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    username: string | null;
    createdAt: string;
  }>;
  recentPayments: Array<{
    id: string;
    action: string;
    quantity: number;
    amountCents: number;
    status: string;
    username: string;
    createdAt: string;
  }>;
  recentWaterings: Array<{ username: string; createdAt: string }>;
}

export function getDashboardToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setDashboardToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

async function dashboardFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? "Request failed");
  }
  return json.data ?? json;
}

export async function dashboardLogin(password: string): Promise<void> {
  const data = await dashboardFetch<{ token: string }>("/api/admin/dashboard/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  setDashboardToken(data.token);
}

export async function dashboardFetchStats(): Promise<DashboardStats> {
  const token = getDashboardToken();
  if (!token) throw new Error("Not authenticated");
  return dashboardFetch<DashboardStats>("/api/admin/dashboard/stats", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function formatEurDashboard(cents: number): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
