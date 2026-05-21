# GLOOBLOOM 🌿

> A surreal global internet plant organism that lives, breathes, and evolves through collective care.

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- npm 9+

### 1. Install all dependencies
```bash
npm run install:all
```

### 2. Configure environment
```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

### 3. Prepare database (SQLite)
```bash
npm run db:prepare
```

### 4. Start development servers
```bash
npm run dev
```

The app will be running at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Prisma Studio**: `npm run db:studio`

---

## Production Deployment

GLOOBLOOM uses **two hosts**:

| Part | Host | Why |
|------|------|-----|
| **Frontend** | [Netlify](https://www.netlify.com) | Next.js static/SSR |
| **Backend + WebSocket** | [Render](https://render.com) | Express + Socket.io need a persistent server |

> Netlify alone cannot run the realtime backend — deploy the API separately, then point the frontend env vars at it.

### Step 1 — Push to GitHub

Repo: [github.com/sio2000/GLOOBLOOM](https://github.com/sio2000/GLOOBLOOM)

### Step 2 — Deploy backend on Render

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
2. Connect the `GLOOBLOOM` GitHub repo
3. Render reads `render.yaml` and creates `gloobloom-api`
4. Set **FRONTEND_URL** to your Netlify URL (after step 3), e.g.  
   `https://gloobloom.netlify.app`
5. Copy the Render service URL, e.g. `https://gloobloom-api.onrender.com`

### Step 3 — Deploy frontend on Netlify

1. [Netlify](https://app.netlify.com) → **Add new site** → **Import from Git**
2. Select `sio2000/GLOOBLOOM`
3. Netlify auto-detects `netlify.toml` (base directory: `frontend`)
4. **Site settings → Environment variables**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://gloobloom-api.onrender.com` |
| `NEXT_PUBLIC_WS_URL` | `https://gloobloom-api.onrender.com` |
| `NEXT_PUBLIC_ADMIN_SECRET` | same as backend `ADMIN_SECRET` |

5. Deploy

### Step 4 — Link backend CORS

In Render, update **FRONTEND_URL** to your live Netlify URL.  
For preview deploys, use comma-separated URLs:

```
https://gloobloom.netlify.app,https://deploy-preview-123--gloobloom.netlify.app
```

Redeploy the backend after changing CORS.

---

## Architecture

```
gloobloom/
├── frontend/         # Next.js 14, React Three Fiber
├── backend/          # Express, Socket.io, Prisma (SQLite)
├── netlify.toml      # Netlify build config
├── render.yaml       # Render backend blueprint
└── package.json
```

## Environment Variables

See `backend/.env.example`, `backend/.env.production.example`, and `frontend/.env.production.example`.

---

*The organism is alive. Nurture it.*
