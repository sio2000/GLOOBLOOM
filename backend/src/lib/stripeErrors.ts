import Stripe from "stripe";

export function formatStripeError(err: unknown): string {
  if (err instanceof Stripe.errors.StripeConnectionError) {
    return (
      "Cannot connect to Stripe. Restart the backend (npm run dev) and check your internet connection."
    );
  }
  if (err instanceof Stripe.errors.StripeAuthenticationError) {
    return "Invalid Stripe API key. Check STRIPE_SECRET_KEY in backend .env";
  }
  if (err instanceof Stripe.errors.StripeInvalidRequestError) {
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Stripe request failed";
}
