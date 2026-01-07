# Repository Guidelines

## Project Structure & Module Organization
- `backend/` holds the FastAPI services (API, redirect, drops) plus config, models, routes, and utilities.
- `routes/`, `controllers/`, `middleware/`, and `services/` provide the Node/Express API layer and admin endpoints.
- `frontend/` is the Vite + React app; primary code lives in `frontend/src`, tests in `frontend/src/__tests__`.
- `bot/` and `discord/` contain worker processes for Telegram/Discord bots and schedulers.
- `ai/` contains automation, agents, and dashboards; `scripts/` has operational scripts.
- `public/` and `admin/` host static assets and legacy admin pages; `sql/` contains migrations.

## Build, Test, and Development Commands
- `npm install` (repo root) installs backend and shared Node dependencies.
- `npm --prefix frontend install` installs frontend dependencies.
- `pm2 start ecosystem.config.cjs` runs all services with the production process map.
- `uvicorn backend.main:app --reload --port 3000` runs the API locally (see `RUNBOOK.md` for ports).
- `npm --prefix frontend run dev` starts the Vite dev server.
- `npm run lint`, `npm run type-check`, `npm run test` execute frontend linting, TypeScript checks, and Jest tests.
- `npm run smoke` and `npm run checks` run smoke tests and the full CI-style checklist.

## Coding Style & Naming Conventions
- Follow existing formatting: 2-space indentation for JS/TS and 4-space indentation for Python.
- React components use `PascalCase.tsx` (e.g., `frontend/src/components/Drops/DropsBoard.tsx`).
- Utilities and hooks use `camelCase` file names (e.g., `frontend/src/utils/api.ts`).
- Python modules use `snake_case` and align with FastAPI conventions in `backend/`.
- Frontend linting is enforced via `frontend/eslint.config.js`; run `npm run lint` before PRs.

## Testing Guidelines
- Frontend tests use Jest + Testing Library; place tests in `frontend/src/__tests__/` or `*.test.tsx`.
- Run `npm --prefix frontend run test` for the suite and `npm --prefix frontend run test:coverage` for coverage.
- No backend test runner is configured; keep changes scoped and verify with local smoke/health checks.

## Commit & Pull Request Guidelines
- Git history shows short, descriptive messages (including automated “Daily auto-commit …” entries). Keep commits concise and action-oriented.
- PRs should include a clear summary, linked issues (if any), test results, and screenshots for UI changes.
- Note any config or env updates explicitly and reference `RUNBOOK.md` when relevant.

## Security & Configuration Tips
- Required env vars are documented in `RUNBOOK.md` (DB URLs, bot tokens, mail provider keys).
- Avoid committing secrets; prefer `.env` or process manager configuration for local runs.
