import https from "node:https";

async function requestViaFetch(
  secretKey: string,
  method: string,
  path: string,
  body?: string
): Promise<string> {
  const url = `https://api.stripe.com/v1${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${secretKey}`,
  };
  const init: RequestInit = { method, headers };
  if (body) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    init.body = body;
  }

  const res = await fetch(url, init);
  const text = await res.text();
  if (!res.ok) {
    try {
      const parsed = JSON.parse(text) as { error?: { message?: string } };
      throw new Error(parsed.error?.message ?? `Stripe HTTP ${res.status}`);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("Stripe HTTP")) throw e;
      throw new Error(`Stripe HTTP ${res.status}`);
    }
  }
  return text;
}

function requestViaHttps(
  secretKey: string,
  method: string,
  path: string,
  body?: string,
  insecure = false
): Promise<string> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${secretKey}`,
    };
    if (body) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      headers["Content-Length"] = String(Buffer.byteLength(body));
    }

    const agent = insecure
      ? new https.Agent({ rejectUnauthorized: false, family: 4 })
      : undefined;

    const req = https.request(
      {
        hostname: "api.stripe.com",
        port: 443,
        path: `/v1${path}`,
        method,
        headers,
        agent,
        minVersion: "TLSv1.2",
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk as Buffer));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          if (res.statusCode && res.statusCode >= 400) {
            try {
              const parsed = JSON.parse(text) as { error?: { message?: string } };
              reject(new Error(parsed.error?.message ?? `Stripe HTTP ${res.statusCode}`));
            } catch {
              reject(new Error(`Stripe HTTP ${res.statusCode}`));
            }
            return;
          }
          resolve(text);
        });
      }
    );

    req.on("error", reject);
    req.setTimeout(30_000, () => req.destroy(new Error("Stripe request timed out")));
    if (body) req.write(body);
    req.end();
  });
}

/** Stripe REST over TLS — fetch first (reliable on Windows/tsx), https fallback. */
export async function stripeHttpsRequest(
  secretKey: string,
  method: string,
  path: string,
  body?: string
): Promise<string> {
  let lastErr: unknown;

  try {
    return await requestViaFetch(secretKey, method, path, body);
  } catch (err) {
    lastErr = err;
  }

  try {
    return await requestViaHttps(secretKey, method, path, body, false);
  } catch (err) {
    lastErr = err;
  }

  if (
    process.env.NODE_ENV === "development" &&
    process.env.STRIPE_DEV_TLS_RELAXED === "true"
  ) {
    console.warn(
      "[STRIPE] Retrying Stripe API with relaxed TLS (STRIPE_DEV_TLS_RELAXED)"
    );
    return requestViaHttps(secretKey, method, path, body, true);
  }

  const msg = lastErr instanceof Error ? lastErr.message : "Stripe connection failed";
  throw new Error(msg);
}
