import { API_URL, ADMIN_SECRET } from "./constants";
import { OrganismState, LeafData, ActivityEntry } from "@/types/organism";

async function fetchJSON<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Request failed");
  }
  const data = await res.json();
  return data.data ?? data;
}

export const api = {
  getState: (): Promise<OrganismState> =>
    fetchJSON("/api/organism/state"),

  water: (username: string, sessionId: string): Promise<OrganismState> =>
    fetchJSON("/api/organism/water", {
      method: "POST",
      body: JSON.stringify({ username, sessionId }),
    }),

  addLeaf: (username: string, sessionId: string): Promise<void> =>
    fetchJSON("/api/organism/leaf", {
      method: "POST",
      body: JSON.stringify({ username, sessionId }),
    }),

  getLeaves: (): Promise<LeafData[]> =>
    fetchJSON("/api/organism/leaves"),

  getActivity: (limit = 20): Promise<ActivityEntry[]> =>
    fetchJSON(`/api/organism/activity?limit=${limit}`),

  admin: {
    reset: (): Promise<OrganismState> =>
      fetchJSON("/api/admin/reset", {
        method: "POST",
        headers: { "x-admin-secret": ADMIN_SECRET },
      }),

    mutate: (): Promise<OrganismState> =>
      fetchJSON("/api/admin/mutate", {
        method: "POST",
        headers: { "x-admin-secret": ADMIN_SECRET },
      }),

    setSeason: (season: string): Promise<void> =>
      fetchJSON("/api/admin/season", {
        method: "POST",
        headers: { "x-admin-secret": ADMIN_SECRET },
        body: JSON.stringify({ season }),
      }),

    decay: (): Promise<OrganismState> =>
      fetchJSON("/api/admin/decay", {
        method: "POST",
        headers: { "x-admin-secret": ADMIN_SECRET },
      }),

    spawnCreatures: (): Promise<void> =>
      fetchJSON("/api/admin/creatures", {
        method: "POST",
        headers: { "x-admin-secret": ADMIN_SECRET },
      }),

    bloom: (): Promise<void> =>
      fetchJSON("/api/admin/bloom", {
        method: "POST",
        headers: { "x-admin-secret": ADMIN_SECRET },
      }),
  },
};
