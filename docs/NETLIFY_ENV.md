# Netlify environment variables

Site: **https://aesthetic-sprite-583fdb.netlify.app/**

Netlify → **Site configuration** → **Environment variables** → **Add a variable** → scope **Production** (and **Build**).

## Required (set in Netlify UI even though defaults exist in `netlify.toml`)

| Variable | Value | Notes |
|----------|--------|--------|
| `NEXT_PUBLIC_API_URL` | `https://gloobloom-api.onrender.com` | Your Render backend URL (change if service name differs) |
| `NEXT_PUBLIC_WS_URL` | `https://gloobloom-api.onrender.com` | Same as API — Socket.io |
| `NEXT_PUBLIC_ADMIN_SECRET` | *(same as Render `ADMIN_SECRET`)* | For dev tools / `?admin=` console |

## After changing env vars

**Trigger deploy** → **Clear cache and deploy site** (required — `NEXT_PUBLIC_*` are baked in at build time).

## Render backend (required — Netlify is frontend only)

Deploy with `render.yaml`, then set on Render:

| Variable | Value |
|----------|--------|
| `FRONTEND_URL` | `https://aesthetic-sprite-583fdb.netlify.app` |
| `ADMIN_PANEL_PASSWORD` | Your dashboard password (`/admin`) |
| `ADMIN_SECRET` | Copy to Netlify `NEXT_PUBLIC_ADMIN_SECRET` |
| `STRIPE_SECRET_KEY` | Stripe test/live secret |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

Stripe webhook URL: `https://gloobloom-api.onrender.com/api/payments/webhook`

## Verify

1. Open `https://gloobloom-api.onrender.com/health` → `{"status":"alive",...}`
2. Reload Netlify site — no `localhost:4000` in browser console
3. Admin: `https://aesthetic-sprite-583fdb.netlify.app/admin`
