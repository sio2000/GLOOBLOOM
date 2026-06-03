"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  dashboardFetchStats,
  dashboardLogin,
  DashboardStats,
  formatEurDashboard,
  getDashboardToken,
  setDashboardToken,
} from "@/lib/dashboardApi";

export default function AdminDashboardPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardFetchStats();
      setStats(data);
      setAuthed(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load";
      if (msg === "Unauthorized" || msg === "Not authenticated") {
        setAuthed(false);
        setDashboardToken(null);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getDashboardToken()) {
      void loadStats();
    }
  }, [loadStats]);

  const submitLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await dashboardLogin(password);
      setPassword("");
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setDashboardToken(null);
    setAuthed(false);
    setStats(null);
  };

  const org = stats?.organism as Record<string, unknown> | undefined;

  return (
    <main className="min-h-[100dvh] bg-[#060908] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-400/50 mb-1">
              Gloobloom
            </p>
            <h1 className="font-display text-2xl sm:text-3xl text-white/90">
              Admin Dashboard
            </h1>
            <p className="text-sm text-white/40 mt-1">
              Live organism metrics, payments & activity
            </p>
          </div>
          <div className="flex items-center gap-3">
            {authed && (
              <button
                type="button"
                onClick={() => void loadStats()}
                disabled={loading}
                className="px-3 py-2 rounded-lg border border-white/10 text-xs text-white/60 hover:text-white/85"
              >
                Refresh
              </button>
            )}
            <Link
              href="/"
              className="px-3 py-2 rounded-lg border border-emerald-400/25 text-xs text-emerald-300/80 hover:border-emerald-400/45"
            >
              ← Back to organism
            </Link>
          </div>
        </div>

        {!authed ? (
          <form
            onSubmit={submitLogin}
            className="max-w-md mx-auto rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8"
          >
            <h2 className="text-lg font-medium text-white/85 mb-1">Sign in</h2>
            <p className="text-xs text-white/40 mb-6">
              Password is set via <code className="text-white/55">ADMIN_PANEL_PASSWORD</code> on
              the backend (Render env vars).
            </p>
            <label className="block text-[10px] uppercase tracking-wider text-white/35 mb-2">
              Dashboard password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white/80 outline-none focus:border-emerald-400/40"
              autoComplete="current-password"
              required
            />
            {error && <p className="mt-3 text-xs text-red-400/90">{error}</p>}
            <button
              type="submit"
              disabled={loading || !password}
              className="mt-5 w-full py-3 rounded-xl bg-emerald-900/50 border border-emerald-400/25 text-emerald-100 text-sm font-medium disabled:opacity-40"
            >
              {loading ? "Signing in…" : "Enter dashboard"}
            </button>
          </form>
        ) : (
          stats && (
            <div className="space-y-6">
              <p className="text-[10px] text-white/30">
                Updated {new Date(stats.generatedAt).toLocaleString()}
              </p>

              <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Online now" value={String(stats.onlineNow)} accent="green" />
                <StatCard label="Stage" value={String(org?.ecosystemStage ?? "—")} />
                <StatCard label="Total waterings" value={stats.totals.waterings.toLocaleString()} />
                <StatCard
                  label="Revenue"
                  value={formatEurDashboard(stats.payments.revenueCents)}
                  accent="cyan"
                />
              </section>

              <section className="grid lg:grid-cols-2 gap-4">
                <Panel title="Organism vitals">
                  <GridRow label="Hydration" value={`${Math.round(Number(org?.hydration ?? 0))}%`} />
                  <GridRow label="Growth" value={`${Math.round(Number(org?.growth ?? 0))}%`} />
                  <GridRow label="Decay" value={`${Math.round(Number(org?.decay ?? 0))}%`} />
                  <GridRow label="Mood" value={String(org?.mood ?? "—")} />
                  <GridRow label="Season" value={String(org?.season ?? "—").replace("_", " ")} />
                  <GridRow label="Mutation level" value={String(org?.mutationLevel ?? "—")} />
                </Panel>

                <Panel title="Community & payments">
                  <GridRow label="Named leaves" value={stats.totals.leaves.toLocaleString()} />
                  <GridRow label="Unique souls" value={String(org?.uniqueWaterersCount ?? "—")} />
                  <GridRow label="Active creatures" value={String(stats.totals.activeCreatures)} />
                  <GridRow label="Activity log entries" value={stats.totals.activities.toLocaleString()} />
                  <GridRow label="Payments consumed" value={String(stats.payments.consumed)} />
                  <GridRow label="Payments pending" value={String(stats.payments.pending)} />
                </Panel>
              </section>

              <section className="grid lg:grid-cols-2 gap-4">
                <Panel title="Recent activity">
                  <ul className="space-y-2 max-h-64 overflow-y-auto">
                    {stats.recentActivity.map((a) => (
                      <li key={a.id} className="text-xs border-b border-white/5 pb-2">
                        <span className="text-white/45">{a.type}</span> — {a.message}
                        <div className="text-[10px] text-white/25 mt-0.5">
                          {new Date(a.createdAt).toLocaleString()}
                          {a.username ? ` · ${a.username}` : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Panel>

                <Panel title="Recent payments">
                  <ul className="space-y-2 max-h-64 overflow-y-auto">
                    {stats.recentPayments.map((p) => (
                      <li key={p.id} className="text-xs border-b border-white/5 pb-2">
                        {p.action} ×{p.quantity} — {formatEurDashboard(p.amountCents)}
                        <span className="text-white/35"> ({p.status})</span>
                        <div className="text-[10px] text-white/25 mt-0.5">
                          {p.username} · {new Date(p.createdAt).toLocaleString()}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Panel>
              </section>

              <button
                type="button"
                onClick={logout}
                className="text-xs text-white/35 hover:text-white/60 underline"
              >
                Sign out
              </button>
            </div>
          )
        )}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "green" | "cyan";
}) {
  const border =
    accent === "green"
      ? "border-green-400/20"
      : accent === "cyan"
        ? "border-cyan-400/20"
        : "border-white/10";
  const valueColor =
    accent === "green"
      ? "text-green-300/90"
      : accent === "cyan"
        ? "text-cyan-300/90"
        : "text-white/85";

  return (
    <div className={`rounded-xl border bg-black/30 p-4 ${border}`}>
      <p className="text-[9px] uppercase tracking-wider text-white/35 mb-1">{label}</p>
      <p className={`text-xl font-medium tabular-nums ${valueColor}`}>{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/25 p-4">
      <h3 className="text-[10px] uppercase tracking-[0.16em] text-white/40 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function GridRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-white/40">{label}</span>
      <span className="text-xs text-white/75 tabular-nums">{value}</span>
    </div>
  );
}
