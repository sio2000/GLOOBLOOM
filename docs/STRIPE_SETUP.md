# Stripe payments — GLOOBLOOM

## Pricing

| Action | Price |
|--------|-------|
| Water | €0.50 |
| Name on leaf | €0.50 |
| Live feed comment | €0.50 |

Stripe requires at least **€0.50** per EUR charge; lower amounts are rejected by the API.

## Flow

1. User taps water / leaf / send comment.
2. Backend creates an **embedded** Stripe Checkout Session.
3. A **payment panel** opens on the same page (no full redirect).
4. After payment → celebration modal + action runs once.
5. Webhook `checkout.session.completed` marks the payment as `paid`.

## Backend `.env`

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
```

Get the **publishable** key from [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/test/apikeys) (starts with `pk_test_`).

For local dev **without** payments:

```env
STRIPE_SKIP_PAYMENTS=true
```

## Webhook (local)

```bash
stripe listen --forward-to localhost:4000/api/payments/webhook
```

Copy the `whsec_...` value into `STRIPE_WEBHOOK_SECRET`.

## Production

1. Use live keys on your backend host.
2. Webhook endpoint: `https://YOUR-API/api/payments/webhook`
3. Event: `checkout.session.completed`
4. `FRONTEND_URL` = your production frontend URL.
