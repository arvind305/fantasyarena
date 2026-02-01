# Fantasy Sports Game — Deployment Guide

## Architecture

```
[Vercel - React UI]  -->  [Render - Express API]
   ui/ (port 3001)          src/ (port 10000)
```

---

## 1. Deploy Backend to Render

### Option A: Via Dashboard

1. Push the **root project** (`Fantasy Sports Game/`) to a GitHub repo.
2. Go to https://dashboard.render.com → **New → Web Service**.
3. Connect the GitHub repo.
4. Configure:
   - **Name**: `fantasy-sports-api`
   - **Root Directory**: (leave blank — the repo root)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `Node`
   - **Plan**: Free
5. Add environment variable:
   - `FRONTEND_URL` = your Vercel URL once deployed (e.g. `https://fantasy-sports-ui.vercel.app`)
6. Click **Create Web Service**. Render will build and deploy.
7. Note your service URL, e.g. `https://fantasy-sports-api.onrender.com`.

### Option B: Via render.yaml

The included `render.yaml` defines the service. Render auto-detects it if you connect the repo via the Blueprint feature.

### Verify

```
curl https://fantasy-sports-api.onrender.com/
# → "Fantasy Sports Game API is running"

curl -X POST https://fantasy-sports-api.onrender.com/match/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Match"}'
# → {"id":"1","name":"Test Match",...}
```

> **Note**: Render free tier spins down after 15 min of inactivity. First request after idle may take ~30s.

---

## 2. Deploy Frontend to Vercel

1. Push the **`ui/`** folder to its own GitHub repo, OR use the same repo and set root directory.
2. Go to https://vercel.com → **Add New Project**.
3. Import the repo.
4. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `ui` (if using the same repo as backend)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `build` (default)
5. Add environment variable:
   - `REACT_APP_API_URL` = your Render backend URL (e.g. `https://fantasy-sports-api.onrender.com`)
6. Click **Deploy**.

The included `vercel.json` handles SPA routing (all paths → `index.html`).

### Verify

Open your Vercel URL in a browser. Navigate between Create Match, Pick Team, and Leaderboard pages.

---

## 3. Link the Two Deployments

After both are live:

1. **On Render**: Set env var `FRONTEND_URL` to your Vercel URL.
   This restricts CORS to only your frontend.

2. **On Vercel**: Set env var `REACT_APP_API_URL` to your Render URL.
   This tells the frontend where the API lives.

3. Redeploy both after setting env vars (Render redeploys automatically on env change; on Vercel, trigger a redeploy from the dashboard).

---

## 4. End-to-End Test

1. Open frontend in browser.
2. **Create Match** → enter a name → click Create → note the `id` in the response.
3. **Pick Team** → enter the match ID, a user ID, comma-separated player names → Submit.
4. **Leaderboard** → enter the match ID → Load.

> Since scoring uses random values in the stub service, you need to call the `/match/:id/score` endpoint via curl to populate scores before the leaderboard shows data:
>
> ```
> curl -X POST https://fantasy-sports-api.onrender.com/match/1/score
> ```

---

## Local Development

```bash
# Terminal 1 — backend
npm install
npm run dev
# → http://localhost:10000

# Terminal 2 — frontend
cd ui
npm install
npm start
# → http://localhost:3001 (proxies API to localhost:3000)
```

For local dev with the new port, update `ui/package.json` proxy to `http://localhost:10000`, or set `REACT_APP_API_URL=http://localhost:10000` in `ui/.env`.
