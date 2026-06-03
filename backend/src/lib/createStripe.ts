import Stripe from "stripe";
import https from "node:https";
import tls from "node:tls";

function createHttpsAgent(): https.Agent {
  const getCa = (tls as typeof tls & {
    getCACertificates?: (type?: string) => string[] | Buffer[];
  }).getCACertificates;
  const ca = typeof getCa === "function" ? getCa("default") : undefined;

  return new https.Agent({
    ca,
    minVersion: "TLSv1.2",
  });
}

const baseOptions = {
  maxNetworkRetries: 1,
  timeout: 30_000,
} as const;

/** Fetch client — often works on Windows one-shot Node. */
export function createStripeFetch(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    ...baseOptions,
    httpClient: Stripe.createFetchHttpClient(),
  });
}

/** Node HTTPS client with OS CA store — works with tsx on some setups. */
export function createStripeNode(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    ...baseOptions,
    httpClient: Stripe.createNodeHttpClient(createHttpsAgent()),
  });
}

export function isStripeConnectionError(err: unknown): boolean {
  return err instanceof Stripe.errors.StripeConnectionError;
}

/** Try fetch first, then node+CA. */
export async function withStripe<T>(
  secretKey: string,
  fn: (stripe: Stripe) => Promise<T>
): Promise<T> {
  const clients = [createStripeFetch(secretKey), createStripeNode(secretKey)];
  let lastErr: unknown;

  for (const client of clients) {
    try {
      return await fn(client);
    } catch (err) {
      lastErr = err;
      if (!isStripeConnectionError(err)) throw err;
    }
  }

  throw lastErr;
}
