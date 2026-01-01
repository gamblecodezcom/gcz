#!/bin/bash
set -e

REPORT="gcz-report.txt"
ROOT="/var/www/html/gcz"

echo "=== GCZ FULL SYSTEM REPORT ($(date -Iseconds)) ===" | tee -a "$REPORT"
echo "Root: $ROOT" | tee -a "$REPORT"
echo "" | tee -a "$REPORT"

section() {
  echo -e "\n=== $1 ===" | tee -a "$REPORT"
}

append_cmd() {
  echo -e "\n--- $1 ---" | tee -a "$REPORT"
  shift
  "$@" 2>&1 | tee -a "$REPORT" || echo "[WARN] Command failed: $*" | tee -a "$REPORT"
}

cd "$ROOT"

############################################
# 1. HIGH-LEVEL HEALTH
############################################
section "HEALTH CHECKS"
append_cmd "curl localhost:3000/api/health" curl -fsS http://localhost:3000/api/health || true
append_cmd "curl https://gamblecodez.com/api/health" curl -fsS https://gamblecodez.com/api/health || true

############################################
# 2. PM2 STATUS
############################################
section "PM2 STATUS"
append_cmd "pm2 list" pm2 list

############################################
# 3. NGINX CONFIG
############################################
section "NGINX CONFIG: sites-enabled/gamblecodez"
append_cmd "cat /etc/nginx/sites-enabled/gamblecodez" cat /etc/nginx/sites-enabled/gamblecodez

############################################
# 4. APP ENTRY + API ROUTER
############################################
section "APP ENTRY (app.js or src/app.js)"
if [ -f "app.js" ]; then
  append_cmd "head app.js" sed -n '1,260p' app.js
elif [ -f "src/app.js" ]; then
  append_cmd "head src/app.js" sed -n '1,260p' src/app.js
else
  echo "[WARN] No app.js or src/app.js found" | tee -a "$REPORT"
fi

section "ROUTES: routes/api.js"
[ -f "routes/api.js" ] && append_cmd "routes/api.js (1-260)" sed -n '1,260p' routes/api.js || echo "[WARN] routes/api.js missing" | tee -a "$REPORT"

############################################
# 5. PROFILE / DROPS / NEWSLETTER ROUTES
############################################
section "ROUTES: profile.js"
[ -f "routes/profile.js" ] && append_cmd "routes/profile.js (1-260)" sed -n '1,260p' routes/profile.js || echo "[WARN] routes/profile.js missing" | tee -a "$REPORT"

section "ROUTES: drops.js"
[ -f "routes/drops.js" ] && append_cmd "routes/drops.js (1-260)" sed -n '1,260p' routes/drops.js || echo "[WARN] routes/drops.js missing" | tee -a "$REPORT"

section "ROUTES: newsletter.js"
[ -f "routes/newsletter.js" ] && append_cmd "routes/newsletter.js (1-260)" sed -n '1,260p' routes/newsletter.js || echo "[WARN] routes/newsletter.js missing" | tee -a "$REPORT"

############################################
# 6. AUTH / ADMIN ROUTES (IF PRESENT)
############################################
section "ROUTES DIRECTORY LISTING"
append_cmd "ls routes" ls routes

section "ROUTES: admin.js"
[ -f "routes/admin.js" ] && append_cmd "routes/admin.js (1-260)" sed -n '1,260p' routes/admin.js || echo "[WARN] routes/admin.js missing" | tee -a "$REPORT"

section "ROUTES: auth.js (if exists)"
[ -f "routes/auth.js" ] && append_cmd "routes/auth.js (1-260)" sed -n '1,260p' routes/auth.js || echo "[INFO] routes/auth.js not found (might be in profile/admin)" | tee -a "$REPORT"

############################################
# 7. DB SCHEMA: USERS + DROPS TABLES
############################################
section "DB SCHEMA: users / drop_promos / drops"
if [ -z "$AI_AGENT_NEON_DB_URL" ]; then
  echo "[WARN] AI_AGENT_NEON_DB_URL is not set; cannot inspect DB" | tee -a "$REPORT"
else
  append_cmd "\d users" psql "$AI_AGENT_NEON_DB_URL" -c "\d users"
  append_cmd "\d drop_promos" psql "$AI_AGENT_NEON_DB_URL" -c "\d drop_promos" || true
  append_cmd "\d drops" psql "$AI_AGENT_NEON_DB_URL" -c "\d drops" || true
fi

############################################
# 8. API ENDPOINT PROBES
############################################
section "API ENDPOINT PROBES"
append_cmd "curl /api/drops" curl -v https://gamblecodez.com/api/drops || true
append_cmd "curl /api/profile/me (no auth)" curl -v https://gamblecodez.com/api/profile/me || true
append_cmd "curl /api/auth/login (no payload)" curl -v https://gamblecodez.com/api/auth/login || true

echo -e "\n=== GCZ FULL SYSTEM REPORT COMPLETE ===" | tee -a "$REPORT"
echo "Report saved to: $ROOT/$REPORT" | tee -a "$REPORT"
