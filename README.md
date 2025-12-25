# GambleCodez

Production stack for the GambleCodez platform, including backend API, admin panel, and frontend web app.

## Structure

- backend/ – Node.js API server and core logic
- admin/ – Admin panel and Telegram bot integrations
- frontend/ – Vite-based frontend application
- routes/ – API route definitions
- jobs/ – Background jobs and schedulers
- utils/ – Shared utilities
- ecosystem.config.js – PM2 process definitions
- server.js – Main backend entrypoint

## Prerequisites

- Node.js and npm
- PM2 (global)
- Nginx
- PostgreSQL
- Valid environment variables in:
  - /.env
  - /admin/.env
  - /frontend/.env

## Install and build

From repo root:

\`\`\`bash
cd /root/gcz
npm install
cd frontend && npm install && npm run build
\`\`\`

## Run with PM2

From repo root:

\`\`\`bash
cd /root/gcz
pm2 start ecosystem.config.js
\`\`\`

## Deployment notes

- Nginx serves the built frontend from \`frontend/dist\`
- Nginx proxies \`/api\` to the backend Node.js server
- Admin panel and bot depend on correct .env configuration
