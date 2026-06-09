# Audittool Vue (staging preview)

Vue 3 frontend for the PURASEC audit tool. Uses the **same backend** as [Audittool](../Audittool) (React) via `/api` proxy.

**Staging:** https://vue-staging.christavansanten.org

## Local development

1. Start the Audittool backend (from the Audittool repo):

   ```bash
   cd ../Audittool
   docker compose up postgres audit-service report-service api-gateway
   ```

2. Run the Vue dev server:

   ```bash
   npm install
   npm run dev
   ```

   Open http://localhost:5173 — Vite proxies `/api` to `http://localhost:8080`.

## Docker (staging-style)

```bash
docker compose up --build
```

Serves on http://127.0.0.1:3001 and proxies `/api` to the host gateway at `:8080`.

## Staging deploy

Push to `main` triggers `.github/workflows/deploy-staging.yml` (GitHub environment `staging`).

Required secrets in GitHub → **Settings → Environments → staging** (copy from the Audittool repo):

| Secret | Description |
|--------|-------------|
| `EC2_HOST` | Staging server |
| `EC2_USER` | SSH user |
| `EC2_SSH_KEY` | SSH private key |
| `EC2_PORT` | Optional SSH port |
| `EC2_VUE_APP_DIR` | Optional; default `~/Audittool-vue` on the server |

Until these secrets exist on **this repository**, use the **Audittool** repo workflow `Deploy Vue Staging` instead (reuses existing EC2 secrets).

### One-time server setup

1. Clone this repo on the staging EC2 next to Audittool, e.g. `~/Audittool-vue`, or run `bash deploy/bootstrap-staging.sh`.
2. Ensure Audittool backend is running (`api-gateway` on host port `8080`).
3. Add `deploy/Caddyfile.snippet` to the host Caddy config and reload Caddy.
4. Point DNS `vue-staging.christavansanten.org` to the staging EC2 IP.

CORS: `audit-service` already allows `https://*.christavansanten.org`.

## Scope (preview)

- Login (staff only)
- Dashboard stats
- Audit list with link to review overview
- Flat review page (HS + Annex) with per-item review comments

Not yet at parity with the React app.
