import { API_URL, ADMIN_SECRET } from "./constants";
import { OrganismState, LeafData, ActivityEntry } from "@/types/organism";
import { PaymentAction } from "@/lib/payments";

export interface PaymentConfigResponse {
  enabled: boolean;
  skipPayments: boolean;
  currency: string;
  prices: Record<PaymentAction, number>;
  maxQuantity?: number;
  publishableKey: string | null;
}

export interface FulfillPaymentResult {
  action: PaymentAction;
  username: string;
  quantity?: number;
  alreadyConsumed?: boolean;
  state?: OrganismState;
  entry?: ActivityEntry;
}

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
    const raw = err.error;
    let message = "Request failed";
    if (typeof raw === "string") {
      message = raw;
    } else if (raw?.fieldErrors) {
      const fields = Object.entries(raw.fieldErrors as Record<string, string[]>)
        .map(([k, v]) => `${k}: ${v.join(", ")}`)
        .join("; ");
      message = fields || message;
    } else if (raw?.formErrors?.length) {
      message = raw.formErrors.join("; ");
    }
    throw new Error(message);
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

  postComment: (username: string, message: string): Promise<ActivityEntry> =>
    fetchJSON("/api/organism/comment", {
      method: "POST",
      body: JSON.stringify({ username, message }),
    }),

  getPaymentConfig: (): Promise<PaymentConfigResponse> =>
    fetchJSON("/api/payments/config"),

  createCheckout: (body: {
    action: PaymentAction;
    username: string;
    userSessionId: string;
    message?: string;
    quantity?: number;
  }): Promise<{ clientSecret: string; sessionId: string }> =>
    fetchJSON("/api/payments/checkout", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  fulfillPayment: (
    stripeSessionId: string,
    userSessionId: string
  ): Promise<FulfillPaymentResult> =>
    fetchJSON("/api/payments/fulfill", {
      method: "POST",
      body: JSON.stringify({ stripeSessionId, userSessionId }),
    }),

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
