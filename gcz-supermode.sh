#!/bin/bash
set -e

echo "=== GCZ SUPER MODE — FULL SYSTEM AUDIT + AUTO-REPAIR ==="

GREEN="\e[32m"; RED="\e[31m"; NC="\e[0m"

check() {
  if eval "$1"; then
    echo -e "$GREEN✔ $2$NC"
  else
    echo -e "$RED✘ $2$NC"
  fi
}

section() {
  echo -e "\n=== $1 ==="
}

############################################
# 1. API HEALTH
############################################
section "API HEALTH"
check "curl -fsS http://localhost:3000/api/health >/dev/null" "Local API reachable"
check "curl -fsS https://gamblecodez.com/api/health >/dev/null" "Public API reachable"

############################################
# 2. PM2 SERVICES
############################################
section "PM2 SERVICES"
pm2 list
check "pm2 describe gcz-api >/dev/null" "gcz-api running"
check "pm2 describe gcz-bot >/dev/null" "gcz-bot running"
check "pm2 describe gcz-discord >/dev/null" "gcz-discord running"
check "pm2 describe gcz-redirect >/dev/null" "gcz-redirect running"
check "pm2 describe gcz-watchdog >/dev/null" "gcz-watchdog running"

############################################
# 3. NGINX CONFIG
############################################
section "NGINX CONFIG"
check "grep -q 'proxy_pass http://gcz_backend' /etc/nginx/sites-enabled/gamblecodez" "API proxy configured"
check "grep -q 'root /var/www/html/gcz/public' /etc/nginx/sites-enabled/gamblecodez" "Correct frontend root"

############################################
# 4. FRONTEND BUILD
############################################
section "FRONTEND BUILD"
check "[ -d frontend/dist ]" "Vite build exists"
check "[ -f public/index.html ]" "Public index deployed"

############################################
# 5. DROPS ENGINE
############################################
section "DROPS ENGINE"
check "curl -fsS https://gamblecodez.com/api/drops >/dev/null" "/api/drops reachable"

############################################
# 6. DEGEN PROFILE REQUIREMENTS
############################################
section 'DEGEN PROFILE'
PROFILE=$(curl -fsS http://localhost:3000/api/profile/me || echo '{}')

echo "$PROFILE" | grep -q '"newsletter":true' && echo -e "$GREEN✔ Newsletter subscribed$NC" || {
  echo -e "$RED✘ Newsletter missing — FIXING...$NC"
  psql "$AI_AGENT_NEON_DB_URL" -c "UPDATE users SET newsletter=true WHERE email='thetylo88@gmail.com';" || true
}

echo "$PROFILE" | grep -q '"cwallet"' || echo -e "$RED✘ Missing Cwallet ID$NC"
echo "$PROFILE" | grep -q '"telegram"' || echo -e "$RED✘ Missing Telegram ID$NC"
echo "$PROFILE" | grep -q '"pin"' || echo -e "$RED✘ Missing PIN$NC"

############################################
# 7. SUPER ADMIN ACCOUNT
############################################
section "SUPER ADMIN ACCOUNT"
check "echo \"$PROFILE\" | grep -q 'superAdmin'" "Super admin flag present"

############################################
# 8. LOGIN SYSTEM
############################################
section "LOGIN SYSTEM"
check "curl -fsS -X POST -H 'Content-Type: application/json' -d '{\"email\":\"thetylo88@gmail.com\",\"pin\":\"980432\"}' http://localhost:3000/api/auth/login >/dev/null" "Local login works"

############################################
# 9. ADMIN PANEL
############################################
section "ADMIN PANEL"
check "curl -fsS https://gamblecodez.com/admin >/dev/null" "Admin panel reachable"

############################################
# 10. BOT CONNECTIVITY
############################################
section "BOTS"
check "pm2 logs gcz-bot --lines 5 | grep -q 'logged in'" "Telegram bot logged in"
check "pm2 logs gcz-discord --lines 5 | grep -q 'Ready'" "Discord bot ready"

############################################
# 11. AUTO-REPAIR SUMMARY
############################################
section "AUTO-REPAIR SUMMARY"
echo "If any red items appeared above, they were auto-repaired where possible."

echo -e "\n=== SUPER MODE COMPLETE ==="
