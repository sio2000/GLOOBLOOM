/** Resolves Stripe publishable key and catches common copy-paste mistakes. */
export function resolveStripePublishableKey(): string | null {
  const pk = process.env.STRIPE_PUBLISHABLE_KEY?.trim();
  const sk = process.env.STRIPE_SECRET_KEY?.trim();

  if (!pk) return null;

  if (!pk.startsWith("pk_")) {
    console.error(
      "[STRIPE] STRIPE_PUBLISHABLE_KEY must start with pk_test_ or pk_live_ (Dashboard → Developers → API keys)"
    );
    return null;
  }

  if (sk?.startsWith("sk_")) {
    const pkBody = pk.replace(/^pk_(test|live)_/, "");
    const skBody = sk.replace(/^sk_(test|live)_/, "");
    if (pkBody === skBody) {
      console.error(
        "[STRIPE] STRIPE_PUBLISHABLE_KEY matches the secret key body — copy the separate Publishable key from Stripe Dashboard"
      );
      return null;
    }
  }

  return pk;
}
