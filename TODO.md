# GCZ Roadmap Mapping (Implementation Status)

Legend:
- Implemented = working or production-ready
- Partial = exists but stubbed, disconnected, or incomplete
- Missing = implied by design but not present

## 1. Frontend (Vite + React)
- [x] (Implemented) Core app shell and routing in `frontend/src/App.tsx`, `frontend/src/main.tsx`.
- [ ] (Partial) Global layout wiring (navbar/footer mounted everywhere) in `frontend/src/components/Layout/Navbar.tsx`, `frontend/src/components/Layout/Footer.tsx`.
- [x] (Implemented) Drops page scaffold in `frontend/src/pages/Drops.tsx`, `frontend/src/components/Drops/DropsBoard.tsx`.
- [x] (Implemented) Dashboard and profile screens in `frontend/src/pages/Dashboard.tsx`, `frontend/src/pages/Profile.tsx`.
- [ ] (Missing) News/Updates page in `frontend/src/pages/News.tsx`.
- [ ] (Missing) About page in `frontend/src/pages/About.tsx`.
- [ ] (Missing) FAQ/Support page in `frontend/src/pages/Support.tsx`.
- [ ] (Partial) Legal coverage: Terms/Privacy exist (`frontend/src/pages/Terms.tsx`, `frontend/src/pages/Privacy.tsx`); missing Age/Jurisdiction and Risk pages.
- [ ] (Partial) API client auth injection and unified error UX in `frontend/src/utils/api.ts`, `frontend/src/utils/errorHandler.ts`.
- [ ] (Partial) Drops API integration (active/archived/detail) for `frontend/src/pages/Drops.tsx`.
- [ ] (Missing) Announcements API integration for News page.
- [ ] (Missing) Telemetry module (CTA click tracking).

## 2. Backend (FastAPI services)
- [x] (Implemented) Core API service in `backend/main.py` with routing and logging.
- [x] (Implemented) Drops service backed by CSV in `backend/drops.py`.
- [x] (Implemented) Redirect service backed by CSV in `backend/redirect.py`.
- [x] (Implemented) Auth endpoints and JWT flow in `backend/routes/auth.py`.
- [x] (Implemented) Profile endpoint in `backend/routes/profile.py`.
- [x] (Implemented) Promos endpoints in `backend/routes/promos.py`.
- [x] (Implemented) Affiliates, casinos, giveaways, admin, dashboard routes in `backend/routes/`.
- [ ] (Partial) Drops lifecycle APIs (detail, admin CRUD, status transitions) are missing in FastAPI.
- [ ] (Missing) Announcements APIs and storage layer.
- [ ] (Partial) DB schema alignment for drops/announcements/audit (see `sql/`).

## 3. Node/Express API Layer (legacy)
- [ ] (Partial) Routes, controllers, middleware exist in `routes/`, `controllers/`, `middleware/`, `services/`.
- [ ] (Missing) Express app/server wiring (no `server.js` or route registration found).
- [ ] (Partial) Drops API stubs in `routes/drops.js` (list/approve pending are placeholders).
- [ ] (Partial) Admin routes exist in `routes/admin/` but not mounted.

## 4. Admin Panel (legacy/static)
- [ ] (Partial) Static admin HTML/JS pages in `admin/` and `admin/js/`.
- [ ] (Partial) Admin data loader in `admin/app.js` calls `/api/*`, but backend wiring is unclear.
- [ ] (Missing) Modern admin UI for drops CRUD, announcements, and health dashboards.

## 5. Drops Engine + Workflow
- [x] (Implemented) CSV-backed drop feed in `backend/drops.py`.
- [ ] (Partial) Drops intake + AI review pipeline in `routes/drops.js`, `services/promoReview.js`, `services/promoStore.js`.
- [ ] (Partial) Telegram distribution of approved promos in `services/dropsPipeline.js`, `services/promoTelegram.js`.
- [ ] (Missing) End-to-end lifecycle worker for create → schedule → announce → close → results.

## 6. Telegram Bot
- [x] (Implemented) Bot runtime in `bot/bot.js`, routes auto-loader in `bot/routes/index.js`.
- [ ] (Partial) Drops consumption uses API endpoints that may not exist (`bot/services/drops.js` expects `/drops/latest`).
- [ ] (Partial) Scheduler APIs referenced but not found (`bot/services/scheduler.js` calls `/api/schedule`).
- [ ] (Missing) Explicit onboarding/linking flow for users and consent logging.

## 7. Discord Bot
- [x] (Implemented) Discord client in `discord/client.js`, message intake in `discord/handlers/messageHandler.js`.
- [ ] (Partial) Promo intake posts to `/api/drops/intake` but backend server wiring is missing.
- [ ] (Missing) Announcements mirroring and user link flows.

## 8. Workers, Cron Jobs, Schedulers
- [x] (Implemented) Drops pipeline runner in `jobs/dropsPipeline.js` with cron entry `scripts/drops-pipeline.cron`.
- [x] (Implemented) Daily jobs and CSV warmups in `jobs/daily.js`, `jobs/reconcile.js`, `jobs/warmup.js`.
- [ ] (Partial) Drops lifecycle scheduler (create/schedule/close/results) missing.

## 9. PM2 Ecosystem (prod + sandbox)
- [x] (Implemented) Production PM2 services in `ecosystem.config.cjs`.
- [x] (Implemented) Sandbox PM2 services in `ecosystem.sandbox.json`.
- [ ] (Partial) Port consistency between `RUNBOOK.md` and `ecosystem.config.cjs`.

## 10. Auth, Profiles, Affiliates, Payments
- [x] (Implemented) Auth/JWT in `backend/routes/auth.py`, `backend/services/auth.py`.
- [x] (Implemented) Profiles in `backend/routes/profile.py`, models in `backend/models/user.py`.
- [x] (Implemented) Affiliates in `backend/routes/affiliates.py`, `backend/services/affiliates_service.py`.
- [ ] (Missing) Payment processing modules (no Stripe/PayPal service code found).

## 11. Logging, Monitoring, Deployment
- [x] (Implemented) Structured logging in `backend/logging_config.py`.
- [x] (Implemented) Watchdogs in `gcz_watchdog.py`, `ai/ai_watchdog.py`.
- [ ] (Partial) External monitoring/alerting (no alert hooks or dashboards wired).
- [x] (Implemented) Deployment/runbooks in `RUNBOOK.md`, `ecosystem.config.cjs`.
- [x] (Implemented) Backup artifacts in `_auto_backups/`, `backups/`, `auto-dev.*.json`.

## 12. AI/Automation
- [x] (Implemented) AI service in `ai/server.py`, workflows in `ai/workflows/`.
- [ ] (Partial) AI webhook handling split between `ai/telegram-webhook.py` and `telegram-webhook.py`.

## Gaps to Implement
- [ ] Express app bootstrap (new `server.js`) to mount `routes/` and admin APIs.
- [ ] Drops lifecycle worker (new `jobs/dropsLifecycle.js`) with DB-backed state machine.
- [ ] Announcements module (new `backend/routes/announcements.py`, `backend/services/announcements_service.py`, and frontend `frontend/src/pages/News.tsx`).
- [ ] Admin drops CRUD UI (new `frontend/src/components/Admin/DropsAdmin.tsx` or legacy admin JS updates).
- [ ] Unified API contract between bots and backend (documented endpoints in `RUNBOOK.md`).
