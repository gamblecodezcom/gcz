#!/usr/bin/env bash
# GAMBLECODEZ DIAGNOSE + AUTO-REPAIR (v3)

set -euo pipefail
ROOT="/var/www/html/gcz"
ENV_FILE="$ROOT/.env"
CSV_PATH="${AFFILIATES_CSV_PATH:-$ROOT/master_affiliates.csv}"
FAIL=0

echo -e "\n🧠 GambleCodez — Full System Check + Auto-Heal\n"

[[ -f "$ENV_FILE" ]] && { set -a; source "$ENV_FILE"; set +a; } || echo "🚫 ENV file not found"
[[ -n "${DATABASE_URL:-}" ]] && export PGPASSWORD="${DATABASE_URL#*:}" && PGPASSWORD="${PGPASSWORD%%@*}"

heal() {
  echo "[heal] node modules + package.json"; cd "$ROOT"
  npm list express || npm i express; npm list node-fetch || npm i node-fetch; npm list pm2 || npm i pm2
  grep -q '"type": "module"' package.json || sed -i '1s/^/{\n  "type": "module",/' package.json
  pm2 describe gcz-api || pm2 start server.js --name gcz-api
  pm2 describe gcz-bot || pm2 start start-bot.js --name gcz-bot
  pm2 describe gcz-redirect || pm2 start python3 --name gcz-redirect -- backend/redirect.py
  pm2 describe gcz-watchdog || pm2 start watchdog.js --name gcz-watchdog
  pm2 save; [[ ! -f backend/__init__.py ]] && touch backend/__init__.py
  head -n1 "$CSV_PATH" | grep -q resolved_domain || sed -i '1s/$/,resolved_domain/' "$CSV_PATH"
  psql -U gamblecodez -h localhost -d gambledb -c "ALTER TABLE affiliates_master ADD COLUMN IF NOT EXISTS resolved_domain TEXT;"
  for f in "$ROOT"/sql/*.sql; do [[ -f "$f" ]] && psql -U gamblecodez -h localhost -d gambledb -f "$f" || FAIL=1; done
}

check() { local msg="$1" cmd="$2" r; r=$(eval "$cmd" 2>&1 || true); [[ -z "$r" ]] && echo "✅ $msg OK" && return; echo "$r" | grep -iqE "fail|err|not found|traceback" && echo "🚫 $msg: $r" && FAIL=1 || echo "✅ $msg OK"; }

heal
check "PM2 Core" "pm2 ping"
check "API /health" "curl -s https://gamblecodez.com/health"
check "System Status" "curl -s https://gamblecodez.com/system/status"
check "Redirect Health" "curl -s https://gamblecodez.com/affiliates/redirect/health"
check "Local DB" "psql -U gamblecodez -h localhost -d gambledb -c 'SELECT 1'"
check "Neon DB" "psql \"$AIAGENTNEONDBURL\" -c 'SELECT 1'"
check "CSV exists" "[[ -f $CSV_PATH ]]"
check "CSV header" "head -n1 $CSV_PATH | grep -q resolved_domain"
check "SSL cert" "curl -Iv https://gamblecodez.com 2>&1 | grep -i 'SSL certificate'"
check "Git Clean" "cd \"$ROOT\" && git status --porcelain"

[[ $FAIL -eq 0 ]] && echo -e "\n✅ ALL CHECKS PASSED\n" || echo -e "\n🚫 FAILURES DETECTED\n"
