#!/bin/bash
# ============================================================
#   GambleCodez CLI Cheat Sheet & Aliases
# ============================================================

echo -e "\n📚 \033[1mGambleCodez VPS Command Helper\033[0m\n"

cat << EOF

🔁 PM2 Shortcuts
────────────────────────────────────────────
pm2 start ecosystem.config.cjs           # Start all services
pm2 restart ecosystem.config.cjs         # Restart all services
pm2 reload ecosystem.config.cjs          # Zero-downtime reload
pm2 status                               # Check status
pm2 logs gcz-api --lines 1000            # API logs
pm2 logs gcz-bot --lines 1000            # Bot logs
pm2 save                                 # Save process list

📦 Bot Commands
────────────────────────────────────────────
pm2 restart gcz-bot                      # Restart bot
pm2 logs gcz-bot --lines 1000            # View bot logs
nano start-bot.js                        # Open main bot logic
ls bot/routes/                           # Check bot commands
ls bot/services/                         # Check bot logic layers
cat bot/config.js                        # Show token config

🧪 Diagnose + Fix
────────────────────────────────────────────
bash gcz-diagnose.sh                    # Run self-healing script
bash gcz-control.sh                    # Main control panel

🧬 Git Commands
────────────────────────────────────────────
git pull                                # Pull latest
git add . && git commit -m "msg"        # Stage + commit
git push origin main                    # Push to GitHub
git push origin main --force            # Force push

🧵 Other Paths
────────────────────────────────────────────
Frontend:         /var/www/html/gcz/frontend
Backend Entry:    /var/www/html/gcz/server.js
Redirect Python:  /var/www/html/gcz/backend/redirect.py
Bot Entrypoint:   /var/www/html/gcz/start-bot.js

EOF
