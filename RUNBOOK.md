# GambleCodez Deployment Runbook

## Overview
This repo hosts the GambleCodez API (FastAPI), redirect and drops services, plus bot/Discord workers. Runtime processes are managed by PM2 with `ecosystem.config.cjs`.

## Services & Ports
| Service | Process | Port | Health Check | Notes |
| --- | --- | --- | --- | --- |
| API | `gcz-api` | `3000` | `GET /api/health` or `GET /health` | FastAPI app in `backend/main.py` |
| Redirect | `gcz-redirect` | `8000` | `GET /health` or `GET /api/health` | Redirect engine in `backend/redirect.py` |
| Drops | `gcz-drops` | `8002` | `GET /api/drops/health` or `GET /health` | Drops engine in `backend/drops.py` |
| Telegram Bot | `gcz-bot` | N/A | Logs only | `bot/start-bot.js` |
| Discord Bot | `gcz-discord` | N/A | Logs only | `discord/start-discord.js` |
| Watchdog | `gcz-watchdog` | N/A | Logs only | `watchdog.js` |

## Environment Variables
### Core API
- `DATABASE_URL` (Postgres connection string)
- `AI_AGENT_NEON_DB_URL` (fallback Postgres connection string)
- `LOG_LEVEL` (e.g. `info`, `debug`)
- `SERVICE_NAME` (optional override for JSON log `service` field)

### Mail / Contact
- `MAILERSEND_API_KEY` (MailerSend API key)
- `GCZ_MAIL_PROVIDER` (`mailersend` to enable MailerSend)

### Bots
- `TELEGRAM_BOT_TOKEN` (Telegram bot token)
- `DISCORD_BOT_TOKEN` (Discord bot token)
- `API_BASE_URL` / `BACKEND_API_URL` (API base URL for bots; defaults to `https://gamblecodez.com`)

### Drops AI
- `PERPLEXITY_API_KEY` (Perplexity API access)

## PM2 Configuration
PM2 is configured in `ecosystem.config.cjs` with the following defaults:
- `gcz-api` -> `uvicorn backend.main:app --host 0.0.0.0 --port 3000`
- `gcz-redirect` -> `uvicorn backend.redirect:app --host 0.0.0.0 --port 8000`
- `gcz-drops` -> `uvicorn backend.drops:app --host 0.0.0.0 --port 8002`
- `gcz-bot` -> `bot/start-bot.js`
- `gcz-discord` -> `discord/start-discord.js`
- `gcz-watchdog` -> `watchdog.js`

Logs are written to `./logs/*.log` (see `error_file` and `out_file` entries in `ecosystem.config.cjs`).

## Startup & Deployment
1. Install dependencies:
   - `npm install` (root)
   - `npm install` (in `frontend/` if deploying the Vite app)
2. Ensure environment variables are loaded (shell or `.env` managed by your process supervisor).
3. Start services:
   - `pm2 start ecosystem.config.cjs`
4. Confirm health endpoints return `200 OK`.

## Reverse Proxy Expectations
- **Public API** should proxy to `gcz-api` on port `3000`.
- **Redirects** should proxy to `gcz-redirect` on port `8000`.
- **Drops service** should proxy to `gcz-drops` on port `8002`.
- Preserve the `X-Request-ID` header if set by upstream; services will generate one otherwise.
- Disable response buffering for SSE routes (e.g. `/api/realtime/events`) via `X-Accel-Buffering: no`.

## Health Checks
- `GET /api/health` (gcz-api)
- `GET /health` (gcz-redirect)
- `GET /api/drops/health` (gcz-drops)

Each returns JSON with service name, uptime seconds, and additional metadata.

## Observability
- JSON structured logs are emitted to stdout/stderr across services.
- Request IDs are attached to responses via `X-Request-ID` and included in logs.
- Unhandled exceptions return `500` with a request ID for support correlation.

## Automated Checks
Use these commands locally or in CI:
- `npm run lint` (frontend lint)
- `npm run type-check` (frontend type check)
- `npm run test` (frontend unit tests)
- `npm run smoke` (service health smoke tests)
- `npm run checks` (runs all of the above)
