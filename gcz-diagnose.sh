#!/usr/bin/env bash
# ============================================================
#  GAMBLECODEZ — DIAGNOSE/ REPAIR
# ============================================================

set -euo pipefail

ROOT="/root/gcz"
ENV_FILE="$ROOT/.env"

echo "======================================================"
echo " 🧠 GambleCodez — Full System Deep Check (Self-Heal)"
echo "======================================================"
echo

# ------------------------------------------------------------
# LOAD ENV
# ------------------------------------------------------------
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
else
  echo "🚫 ENV: $ENV_FILE not found"
fi

API_URL="${BACKEND_API_URL:-https://gamblecodez.com}"
REDIRECT_HEALTH_URL="${REDIRECT_BASE_URL:-https://gamblecodez.com/affiliates/redirect}/health"
CSV_PATH="${AFFILIATES_CSV_PATH:-/root/gcz/master_affiliates.csv}"
NEON_DB_URL="${AI_AGENT_NEON_DB_URL:-}"

# ------------------------------------------------------------
# DATABASE PASSWORD FROM ENV (NO PROMPTS)
# ------------------------------------------------------------
if [[ -n "${DATABASE_URL:-}" ]]; then
  tmp="${DATABASE_URL#*://}"
  tmp="${tmp#*:}"
  export PGPASSWORD="${tmp%%@*}"
fi

FAIL=0

# ------------------------------------------------------------
# SELF-HEAL HELPERS (SAME CORE AS CONTROL)
# ------------------------------------------------------------
fix_node_modules() {
  echo "[heal] ensuring node modules (express, node-fetch, pm2)..."
  cd "$ROOT" || return
  npm list express >/dev/null 2>&1 || npm install express --silent
  npm list node-fetch >/dev/null 2>&1 || npm install node-fetch --silent
  npm list pm2 >/dev/null 2>&1 || npm install pm2 --silent || true
}

fix_package_type_module() {
  if ! grep -q '"type": "module"' "$ROOT/package.json"; then
    echo "[heal] adding \"type\": \"module\" to package.json"
    tmp="$(mktemp)"
    if command -v jq >/dev/null 2>&1; then
      jq '.type="module"' "$ROOT/package.json" > "$tmp" && mv "$tmp" "$ROOT/package.json"
    else
      sed -i '0,/{/s//{\n  "type": "module",/' "$ROOT/package.json"
    fi
  fi
}

fix_backend_init() {
  if [[ ! -f "$ROOT/backend/__init__.py" ]]; then
    echo "[heal] adding backend/__init__.py"
    touch "$ROOT/backend/__init__.py"
  fi
}

fix_affiliates_csv_header() {
  if [[ -f "$CSV_PATH" ]]; then
    if ! head -n1 "$CSV_PATH" | grep -q "resolved_domain"; then
      echo "[heal] adding resolved_domain column to CSV header"
      tmp="$(mktemp)"
      awk 'BEGIN{FS=OFS=","} NR==1{for(i=1;i<=NF;i++)if($i=="resolved_domain")f=1; if(!f){$0=$0",resolved_domain"} }1' "$CSV_PATH" > "$tmp"
      mv "$tmp" "$CSV_PATH"
    fi
  fi
}

fix_affiliates_sql_column() {
  echo "[heal] ensuring resolved_domain column in affiliates_master"
  psql -U gamblecodez -h localhost -d gambledb -c \
    "ALTER TABLE affiliates_master ADD COLUMN IF NOT EXISTS resolved_domain TEXT;" >/dev/null 2>&1 || true
}

fix_pm2_processes() {
  echo "[heal] ensuring PM2 processes exist"
  cd "$ROOT" || return
  pm2 describe gcz-api >/dev/null 2>&1 || pm2 start server.js --name gcz-api || true
  pm2 describe gcz-bot >/dev/null 2>&1 || pm2 start start-bot.js --name gcz-bot || true
  pm2 describe gcz-watchdog >/dev/null 2>&1 || pm2 start watchdog.js --name gcz-watchdog || true
  pm2 describe gcz-redirect >/dev/null 2>&1 || pm2 start python3 --name gcz-redirect -- "$ROOT/backend/redirect.py" || true
  pm2 save || true
}

self_heal_core() {
  echo "==== [heal] Core self-healing starting ===="
  fix_node_modules
  fix_package_type_module
  fix_backend_init
  fix_affiliates_csv_header
  fix_affiliates_sql_column
  fix_pm2_processes
  echo "==== [heal] Core self-healing complete ===="
}

# ------------------------------------------------------------
# CHECK WRAPPER
# ------------------------------------------------------------
check() {
  local NAME="$1"
  local CMD="$2"

  local OUT
  OUT=$(eval "$CMD" 2>&1 || true)

  if [[ -z "$OUT" ]]; then
    echo "✅ $NAME OK"
    return
  fi

  if echo "$OUT" | grep -qiE "error|fail|refused|not found|denied|fatal|unhealthy|exception|traceback|inactive"; then
    echo "🚫 $NAME: $(echo "$OUT" | head -n 2 | tr -d '\n')"
    FAIL=1
  else
    echo "✅ $NAME OK"
  fi
}

# ------------------------------------------------------------
# RUN CORE SELF-HEAL FIRST
# ------------------------------------------------------------
self_heal_core
echo

# ------------------------------------------------------------
# PM2 / PROCESS CHECKS
# ------------------------------------------------------------
echo "---- PM2 / Process ----"

check "PM2 Core" "pm2 ping"
check "API PM2 (gcz-api)" "pm2 describe gcz-api | grep -E 'status|script' || echo 'not found'"
check "Bot PM2 (gcz-bot)" "pm2 describe gcz-bot | grep -E 'status|script' || echo 'not found'"
check "Redirect PM2 (gcz-redirect)" "pm2 describe gcz-redirect | grep -E 'status|script' || echo 'not found'"
check "Watchdog PM2 (gcz-watchdog)" "pm2 describe gcz-watchdog | grep -E 'status|script' || echo 'not found'"

echo

# ------------------------------------------------------------
# HTTP / HEALTH ENDPOINTS
# ------------------------------------------------------------
echo "---- HTTP / Health ----"

check "API Health" "curl -sS -m 5 '$API_URL/health'"
check "System Status" "curl -sS -m 5 '$API_URL/system/status'"
check "Redirect Health" "curl -sS -m 5 '$REDIRECT_HEALTH_URL'"

echo

# ------------------------------------------------------------
# TELEGRAM BOT
# ------------------------------------------------------------
echo "---- Telegram Bot ----"

check "Bot Token Present" "[[ -n '\${TELEGRAM_BOT_TOKEN:-}' ]] || echo 'TELEGRAM_BOT_TOKEN missing'"
check "Bot Username Present" "[[ -n '\${TELEGRAM_BOT_USERNAME:-}' ]] || echo 'TELEGRAM_BOT_USERNAME missing'"

echo

# ------------------------------------------------------------
# DATABASES
# ------------------------------------------------------------
echo "---- Databases ----"

check "Local DB (Postgres)" "psql -U gamblecodez -h localhost -d gambledb -c 'SELECT 1;'"

if [[ -n "$NEON_DB_URL" ]]; then
  check "Neon DB" "psql '$NEON_DB_URL' -c 'SELECT 1;'"
else
  echo "🚫 Neon DB: AI_AGENT_NEON_DB_URL not set"
  FAIL=1
fi

echo

# ------------------------------------------------------------
# CSV / AFFILIATES
# ------------------------------------------------------------
echo "---- CSV / Affiliates ----"

check "CSV Exists" "[[ -f '$CSV_PATH' ]] && echo 'ok' || echo 'CSV missing: $CSV_PATH'"
check "CSV Header resolved_domain" "head -n1 '$CSV_PATH' | grep -q 'resolved_domain' && echo 'ok' || echo 'resolved_domain column missing'"

echo

# ------------------------------------------------------------
# GIT STATUS
# ------------------------------------------------------------
echo "---- Git Status ----"

check "Git Clean" "cd '$ROOT' && git status --porcelain || echo 'git repo error'"

echo

# ------------------------------------------------------------
# NGINX / SSL
# ------------------------------------------------------------
echo "---- Nginx / SSL ----"

check "Nginx Active" "systemctl is-active nginx || echo 'nginx inactive'"
check "SSL Certificate" "curl -Iv https://gamblecodez.com 2>&1 | grep -i 'SSL certificate' || echo 'no cert info'"

echo

# ------------------------------------------------------------
# SYSTEM HEALTH
# ------------------------------------------------------------
echo "---- System Health ----"

check "Open Ports" "ss -tulpn | head -n 20"
check "Disk Usage /root" "df -h /root"
check "Memory Usage" "free -h"

echo

# ------------------------------------------------------------
# SUMMARY
# ------------------------------------------------------------
if [[ $FAIL -eq 0 ]]; then
  echo "================================================="
  echo "        ✅ ALL SYSTEMS PASSED CLEANLY"
  echo "================================================="
  exit 0
else
  echo "================================================="
  echo "        🚫 ERRORS DETECTED — SEE ABOVE"
  echo "================================================="
  exit 1
fi
