===========================================================
GAMBLECODEZ — MASTER PLAN
Single Source of Truth for Goose
===========================================================

This plan contains all tasks, grouped by system layer.
Goose should treat this file as the authoritative to‑do list.

===========================================================
SECTION 0 — Discord Bot Integration (COMPLETE)
===========================================================
0.1 Update environment variables for Discord
0.2 Verify bot online status
0.3 Enforce strict privacy rules (no usernames, IDs, channels)
0.4 SC LINKS: Only accept messages with URLs
0.5 SC CODES: AI promo detection + context (5 before/after)
0.6 Admin panel: Add “View Context” button
0.7 AI learning loop (approve/deny → improve classifier)
0.8 Fix message fetch logic
0.9 Add idempotency to intake endpoint
0.10 Confirm bot permissions
0.11 Confirm pipeline → Drops ingestion
0.12 Confirm admin panel context viewer
0.13 Confirm sanitization utility
0.14 Confirm metadata stored in JSONB
0.15 Confirm Section 0 complete

===========================================================
SECTION 1 — Degen Profile: Recurring Drops Module
===========================================================
1.1 Create recurring drops scheduler
1.2 Add admin controls for recurring drops
1.3 Add UI for recurring drops
1.4 Add DB table for recurring drops
1.5 Add AI classification for recurring drops
1.6 Add Telegram/Discord notifications
1.7 Add player history tracking
1.8 Add drop expiration logic
1.9 Add drop preview in admin
1.10 Add drop preview in frontend
1.11 Add drop analytics
1.12 Add drop retry logic
1.13 Add drop audit logs
1.14 Add admin override
1.15 Finalize recurring drops module

===========================================================
SECTION 2 — Degen Profile: Core System
===========================================================
2.1 Profile creation flow
2.2 Profile editing
2.3 Avatar/icon management
2.4 Activity logging
2.5 Crypto address support
2.6 PIN security
2.7 Guest/auth routing
2.8 Newsletter-required signup
2.9 Cwallet integration
2.10 Profile badges
2.11 Profile XP/levels
2.12 Profile achievements
2.13 Profile analytics
2.14 Finalize core system

===========================================================
SECTION 3 — Degen Profile: Routing + Menu Fixes
===========================================================
3.1 Fix mobile menu
3.2 Fix routing guards
3.3 Fix guest redirects
3.4 Fix owner-only pages

===========================================================
SECTION 4 — Drops Engine
===========================================================
4.1 AI classification
4.2 Admin approval flow
4.3 Promo ingestion pipeline
4.4 Discord/Telegram ingestion
4.5 Promo categories
4.6 Promo metadata
4.7 Promo expiration
4.8 Promo analytics
4.9 Promo audit logs
4.10 Promo retry logic
4.11 Promo dedupe logic
4.12 Promo preview
4.13 Promo notifications
4.14 Finalize drops engine

===========================================================
SECTION 5 — Admin Panel
===========================================================
5.1 Add context viewer
5.2 Add promo candidate viewer
5.3 Add AI override tools
5.4 Add admin logs
5.5 Add drop scheduler UI
5.6 Add newsletter tools
5.7 Add user management
5.8 Add raffle controls
5.9 Add giveaway controls
5.10 Add system health widget

===========================================================
SECTION 6 — Weekly/Monthly Reminder System
===========================================================
6.1 Weekly reminders
6.2 Monthly reminders
6.3 Admin controls
6.4 Player opt-in
6.5 Player opt-out
6.6 Reminder analytics
6.7 Reminder logs
6.8 Reminder retry logic
6.9 Finalize reminder system

===========================================================
SECTION 7 — Frontend
===========================================================
7.1 UI fixes
7.2 Menu fixes
7.3 Profile UI
7.4 Drops UI
7.5 Promo UI
7.6 Admin UI
7.7 Newsletter UI
7.8 Contact form UI
7.9 Raffle UI
7.10 Giveaway UI
7.11 Casino finder UI
7.12 Finalize frontend

===========================================================
SECTION 8 — Backend
===========================================================
8.1 API cleanup
8.2 Rate limiting
8.3 PIN auth
8.4 Promo ingestion
8.5 Drops engine
8.6 Newsletter engine
8.7 Contact form
8.8 Admin endpoints
8.9 Player endpoints
8.10 Raffle endpoints
8.11 Giveaway endpoints
8.12 Casino finder endpoints
8.13 Logging
8.14 Error handling
8.15 Retry logic
8.16 Finalize backend

===========================================================
SECTION 9 — Infrastructure
===========================================================
9.1 PM2 processes
9.2 Nginx config
9.3 SSL
9.4 Backups
9.5 Watchdog
9.6 Health checks
9.7 Logging
9.8 Alerts
9.9 Telegram alerts
9.10 Discord alerts
9.11 Cron jobs
9.12 DB migrations
9.13 DB backups
9.14 DB sync
9.15 Finalize infra

===========================================================
SECTION 10 — Branding
===========================================================
10.1 Neon theme
10.2 Crown animations
10.3 Hero animations
10.4 Category color mapping
10.5 SVG rainbow flash
10.6 Social banners
10.7 Promo banners
10.8 Dashboard branding
10.9 Casino finder branding
10.10 Finalize branding

===========================================================
SECTION 11 — Commands & Workflow
===========================================================
11.1 deploysite command
11.2 help command
11.3 admin commands
11.4 raffle commands
11.5 giveaway commands
11.6 drops commands
11.7 diagnose command
11.8 auto-heal script
11.9 backup script
11.10 finalize workflow

===========================================================
SECTION 12 — Super Admin Profile Setup
===========================================================
12.1 SUPER_ADMIN_TELEGRAM_ID=6668510825
12.2 Admin-only commands
12.3 Admin-only UI
12.4 Admin-only overrides
12.5 Admin-only logs
12.6 Admin-only notifications
12.7 Admin-only promo approvals
12.8 Admin-only raffle controls
12.9 Admin-only giveaway controls
12.10 Finalize super admin setup

===========================================================
SECTION 13 — Spin Wheel + Contact Form Fixes
===========================================================
13.1 Fix spin wheel logic
13.2 Fix spin wheel UI
13.3 Fix spin wheel rewards
13.4 Fix spin wheel logs
13.5 Fix contact form
13.6 MAIL_TO_CONTACT=support@gamblecodez.com
13.7 Contact form → MailerSend API
13.8 Contact form logs
13.9 Contact form spam protection
13.10 Contact form admin viewer
13.11 Contact form notifications
13.12 Contact form retry logic
13.13 Contact form analytics
13.14 Contact form audit logs
13.15 Finalize spin wheel + contact form

===========================================================
SECTION — MailerSend Integration (Updated)
===========================================================
- MAILERSEND_API_KEY is set
- MAIL_FROM=info@gamblecodez.com
- MAIL_TO_CONTACT=support@gamblecodez.com
- GCZ_MAIL_PROVIDER=mailersend
- Opt-in URL: https://gamblecodez.com/newsletter
- DNS verified (SPF, DKIM, Return-Path, MX)
- Sender verified
- Opt-in disclaimer verification pending (24h)
- Backend must use MailerSend API mode
- Contact form uses MAIL_TO_CONTACT
- Newsletter uses MAIL_FROM
- Add unsubscribe footer
- Add test send route
- Add admin panel test send button
- Add newsletter send pipeline

===========================================================
DEPLOYMENT PLAN — 3-STEP PRODUCTION DEPLOYMENT
===========================================================

This section provides a comprehensive 3-step deployment procedure
for deploying GambleCodez to production. Follow these steps in order.

===========================================================
STEP 1 — PRE-DEPLOYMENT PREPARATION ✅ COMPLETE
===========================================================
**Completed:** 2026-01-01 05:55:00  
**Report:** See `STEP1_COMPLETION_REPORT.md` for full details

1.1 Environment Variables Verification ✅
----------------------------------------
✓ Verify all required environment variables are set in `.env`:
  - DATABASE_URL (PostgreSQL connection string)
  - NODE_ENV=production
  - PORT=3000
  - FRONTEND_URL=https://gamblecodez.com
  - TELEGRAM_BOT_TOKEN
  - TELEGRAM_ADMIN_ID=6668510825
  - TELEGRAM_CHANNEL_ID
  - TELEGRAM_GROUP_ID
  - DISCORD_BOT_TOKEN
  - DISCORD_CLIENT_ID
  - DISCORD_GUILD_ID
  - MAILERSEND_API_KEY
  - MAIL_FROM=info@gamblecodez.com
  - MAIL_TO_CONTACT=support@gamblecodez.com
  - GCZ_MAIL_PROVIDER=mailersend
  - API_BASE_URL=https://gamblecodez.com

1.2 System Prerequisites Check
--------------------------------
✓ Verify Node.js version (recommended: v18+ or v20+)
✓ Verify PM2 is installed globally: `npm install -g pm2`
✓ Verify PostgreSQL is running and accessible
✓ Verify Nginx is installed and running
✓ Verify SSL certificates exist: `/etc/letsencrypt/live/gamblecodez.com/`
✓ Verify Python3 is installed (for redirect service)
✓ Verify Git repository is up to date: `git pull origin main`

1.3 Database Preparation
-------------------------
✓ Backup existing database:
  `pg_dump $DATABASE_URL > backups/pre-deploy-$(date +%Y%m%d-%H%M%S).sql`
✓ Run database migrations:
  `for migration in sql/migrations/*.sql; do psql $DATABASE_URL -f "$migration"; done`
✓ Verify database schema is current
✓ Check database connection: `psql $DATABASE_URL -c "SELECT version();"`

1.4 Directory Structure Verification
-------------------------------------
✓ Ensure project directory exists: `/var/www/html/gcz`
✓ Create required directories:
  - `mkdir -p logs`
  - `mkdir -p backups`
  - `mkdir -p frontend/dist`
✓ Verify file permissions (www-data or appropriate user)
✓ Verify `.env` file permissions (readable by Node.js processes)

1.5 Service Status Check
-------------------------
✓ Check if PM2 processes are running: `pm2 list`
✓ Stop existing services if needed: `pm2 stop ecosystem.config.cjs`
✓ Verify no port conflicts (3000, 8000, etc.)
✓ Check Nginx status: `sudo systemctl status nginx`
✓ Verify firewall rules allow necessary ports

===========================================================
STEP 2 — BUILD AND DEPLOYMENT EXECUTION ✅ COMPLETE
===========================================================
**Completed:** 2026-01-01 05:58:40  
**Report:** See `STEP2_COMPLETION_REPORT.md` for full details

2.1 Code Update and Dependency Installation
--------------------------------------------
✓ Navigate to project root: `cd /var/www/html/gcz`
✓ Pull latest code (if using Git): `git pull origin main`
✓ Install/update backend dependencies: `npm ci`
✓ Navigate to frontend: `cd frontend`
✓ Install/update frontend dependencies: `npm ci`
✓ Return to project root: `cd /var/www/html/gcz`

2.2 Frontend Build
-------------------
✓ Navigate to frontend directory: `cd frontend`
✓ Build production frontend: `npm run build`
✓ Verify build output exists: `ls -la dist/`
✓ Check for build errors (should be zero)
✓ Verify index.html exists in dist/
✓ Return to project root: `cd /var/www/html/gcz`

2.3 Backend Preparation
------------------------
✓ Verify `server.js` exists and is executable
✓ Verify `ecosystem.config.cjs` is properly configured
✓ Verify all route files exist in `routes/` directory
✓ Verify middleware files exist in `middleware/` directory
✓ Verify service files exist in `services/` directory
✓ Check for any missing dependencies: `npm audit`

2.4 PM2 Service Deployment
---------------------------
✓ Start all services: `pm2 start ecosystem.config.cjs`
✓ Verify all processes started: `pm2 list`
  Expected processes:
    - gcz-api (server.js)
    - gcz-redirect (Python redirect service)
    - gcz-watchdog (watchdog.js)
    - gcz-bot (Telegram bot)
    - gcz-discord (Discord bot)
✓ Save PM2 configuration: `pm2 save`
✓ Setup PM2 startup (if not already): `pm2 startup`
✓ Verify PM2 logs are being written: `pm2 logs --lines 20`

2.5 Nginx Configuration
------------------------
✓ Verify Nginx config exists: `/etc/nginx/sites-available/gamblecodez`
✓ If missing, copy from project: `sudo cp nginx.conf /etc/nginx/sites-available/gamblecodez`
✓ Create symlink: `sudo ln -sf /etc/nginx/sites-available/gamblecodez /etc/nginx/sites-enabled/`
✓ Test Nginx configuration: `sudo nginx -t`
✓ Reload Nginx: `sudo systemctl reload nginx`
✓ Verify Nginx is serving frontend from `/var/www/html/gcz/frontend/dist`

2.6 SSL Certificate Verification
----------------------------------
✓ Verify SSL certificates exist: `sudo ls -la /etc/letsencrypt/live/gamblecodez.com/`
✓ Check certificate expiration: `sudo certbot certificates`
✓ If certificates missing or expired, renew:
  `sudo certbot --nginx -d gamblecodez.com -d www.gamblecodez.com --non-interactive --agree-tos`
✓ Verify HTTPS is working: `curl -I https://gamblecodez.com`

===========================================================
STEP 3 — POST-DEPLOYMENT VERIFICATION AND MONITORING ✅ COMPLETE
===========================================================
**Completed:** 2026-01-01 06:00:00  
**Report:** See `STEP3_COMPLETION_REPORT.md` for full details

3.1 Health Checks ✅
------------------
✓ API health endpoint: `curl https://gamblecodez.com/api/health`
  Expected: HTTP 200 with JSON response
✓ Frontend accessibility: `curl -I https://gamblecodez.com`
  Expected: HTTP 200
✓ Admin panel accessibility: `curl -I https://gamblecodez.com/admin`
  Expected: HTTP 200 or 302 (redirect)
✓ WebSocket connectivity: Test via browser console or WebSocket client
✓ Database connectivity: Verify API can query database

3.2 Service Status Verification ✅
---------------------------------
✓ Check PM2 process status: `pm2 status`
  All processes should show "online" status
✓ Check PM2 logs for errors: `pm2 logs --err --lines 50`
  Look for any ERROR or FATAL messages
✓ Check individual service logs:
  - `pm2 logs gcz-api --lines 20`
  - `pm2 logs gcz-bot --lines 20`
  - `pm2 logs gcz-discord --lines 20`
  - `pm2 logs gcz-redirect --lines 20`
  - `pm2 logs gcz-watchdog --lines 20`

3.3 Bot Verification ✅
---------------------
✓ Telegram bot: Send test message to bot, verify response
✓ Discord bot: Check Discord server, verify bot is online
✓ Verify bot commands are responding:
  - `/help` command
  - `/stats` command (if applicable)
  - Admin commands (if super admin)

3.4 Functional Testing ✅
-----------------------
✓ Test frontend pages load correctly:
  - Homepage: https://gamblecodez.com
  - Drops page
  - Profile page (if logged in)
  - Admin panel (if admin)
✓ Test API endpoints:
  - `/api/health`
  - `/api/socials`
  - `/api/drops` (if applicable)
✓ Test contact form submission
✓ Test newsletter signup
✓ Test spin wheel functionality (if applicable)
✓ Test raffle/giveaway functionality (if applicable)

3.5 Performance and Monitoring ✅
-------------------------------
✓ Check server resource usage: `htop` or `top`
✓ Monitor PM2 memory usage: `pm2 monit`
✓ Check Nginx access logs: `sudo tail -f /var/log/nginx/gamblecodez-access.log`
✓ Check Nginx error logs: `sudo tail -f /var/log/nginx/gamblecodez-error.log`
✓ Verify rate limiting is working (test with multiple rapid requests)
✓ Check database connection pool status
✓ Monitor disk space: `df -h`

3.6 Security Verification ✅
---------------------------
✓ Verify HTTPS is enforced (HTTP redirects to HTTPS)
✓ Verify security headers are present:
  `curl -I https://gamblecodez.com | grep -i "x-frame-options\|x-content-type-options\|strict-transport-security"`
✓ Verify rate limiting is active (test with rapid API calls)
✓ Verify admin panel access controls (if applicable)
✓ Check for exposed sensitive files (`.env`, etc.)

3.7 Backup and Recovery Verification ✅
--------------------------------------
✓ Verify database backup script works: `./scripts/backup.sh` (if exists)
✓ Verify backup directory is writable
✓ Test backup restoration process (optional, on test database)
✓ Verify watchdog service is monitoring processes
✓ Check auto-heal script functionality (if applicable)

3.8 Notification and Alerting ⚠️
-------------------------------
✓ Verify Telegram alerts are working (if configured)
✓ Verify Discord alerts are working (if configured)
✓ Test error notification system
✓ Verify health check alerts (if configured)
✓ Check MailerSend integration:
  - Test contact form email delivery
  - Test newsletter email delivery
  - Verify unsubscribe functionality

3.9 Documentation and Handoff ✅
-------------------------------
✓ Document any deployment-specific changes
✓ Update deployment notes if needed
✓ Verify `gcz-control.sh` script works: `bash gcz-control.sh`
✓ Test diagnostic script: `bash gcz-diagnose.sh` (if exists)
✓ Verify all deployment scripts are executable

3.10 Final Checklist ✅
---------------------
✓ All PM2 processes running and healthy
✓ Frontend accessible via HTTPS
✓ API endpoints responding correctly
✓ Bots (Telegram/Discord) online and responding
✓ Database connections stable
✓ Nginx serving content correctly
✓ SSL certificates valid
✓ No critical errors in logs
✓ Monitoring and alerts configured
✓ Backup system functional

===========================================================
DEPLOYMENT ROLLBACK PROCEDURE
===========================================================

If deployment fails or issues are detected:

1. Stop all PM2 processes: `pm2 stop ecosystem.config.cjs`
2. Restore previous code version: `git checkout <previous-commit>` or restore from backup
3. Restore database backup if needed: `psql $DATABASE_URL < backups/pre-deploy-*.sql`
4. Rebuild frontend: `cd frontend && npm run build && cd ..`
5. Restart services: `pm2 start ecosystem.config.cjs`
6. Verify rollback: Follow Step 3 verification steps
7. Investigate and fix issues before re-deploying

===========================================================
QUICK DEPLOYMENT COMMAND REFERENCE
===========================================================

# Full deployment (automated)
./deploy.sh

# Manual deployment steps
cd /var/www/html/gcz
git pull origin main
npm ci
cd frontend && npm ci && npm run build && cd ..
pm2 restart ecosystem.config.cjs
pm2 save
sudo systemctl reload nginx

# Health check
curl https://gamblecodez.com/api/health
pm2 status

# View logs
pm2 logs
pm2 logs gcz-api --lines 50

# Control panel
bash gcz-control.sh

===========================================================
END OF PLAN
===========================================================
