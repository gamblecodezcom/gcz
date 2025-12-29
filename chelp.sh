#!/bin/bash
# ============================================================
#   GambleCodez CLI Cheat Sheet & Aliases (Unified)
# ============================================================

echo -e "\n📚 \033[1mGambleCodez VPS Command Helper\033[0m\n"

cat << EOF

🔁 PM2 Shortcuts
────────────────────────────────────────────
pm2 start ecosystem.config.cjs             # Start all services
pm2 restart ecosystem.config.cjs           # Restart all services
pm2 reload ecosystem.config.cjs            # Zero-downtime reload
pm2 status                                 # Check status
pm2 logs gcz-api --lines 1000              # API logs
pm2 logs gcz-bot --lines 1000              # Bot logs
pm2 logs gcz-discord --lines 1000          # Discord bot logs
pm2 logs gcz-redirect --lines 1000         # Redirect service logs
pm2 logs gcz-watchdog --lines 1000         # Watchdog logs
pm2 save                                   # Save PM2 process list

🤖 Bot Commands
────────────────────────────────────────────
pm2 restart gcz-bot                        # Restart Telegram bot
pm2 logs gcz-bot --lines 1000              # View bot logs
nano start-bot.js                          # Open bot entrypoint
ls bot/routes/                             # Bot command routes
ls bot/services/                           # Bot service logic
cat bot/config.js                          # Bot config

🧪 Diagnose + Auto-Heal
────────────────────────────────────────────
gczdiag                                     # Run full system diagnose
bash /var/www/html/gcz/gcz-diagnose.sh      # Direct call (same as above)
bash /var/www/html/gcz/gcz-control.sh       # Main control panel

🧬 Git Commands
────────────────────────────────────────────
git pull                                    # Pull latest
git add . && git commit -m "msg"            # Stage + commit
git push                                    # Push to GitHub
git push --force                            # Force push
gitstatus                                    # Status shortcut
gitlog                                       # Recent commits

📦 Project Structure
────────────────────────────────────────────
Root:             /var/www/html/gcz
Frontend:         /var/www/html/gcz/frontend
Backend Entry:    /var/www/html/gcz/server.js
API Routes:       /var/www/html/gcz/routes
Bot Entrypoint:   /var/www/html/gcz/start-bot.js
Discord Bot:      /var/www/html/gcz/start-discord.js
Redirect Python:  /var/www/html/gcz/backend/redirect.py
SQL Schema:       /var/www/html/gcz/sql/base_schema.sql
CSV Master:       /var/www/html/gcz/master_affiliates.csv

🗄 Database Shortcuts
────────────────────────────────────────────
sql               # Local Postgres
sqllive           # Neon (production)
dbtest            # Quick DB health check

EOF