#!/usr/bin/env bash
# ============================================================
#  GAMBLECODEZ — MASTER SYSTEM CONTROL (SELF-HEAL AWARE)
# ============================================================

set -euo pipefail

ROOT="/root/gcz"
ENV_FILE="$ROOT/.env"

# ------------------------------------------------------------
# LOAD ENV
# ------------------------------------------------------------
if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

# ------------------------------------------------------------
# NORMALIZED RUNTIME VARS
# ------------------------------------------------------------
API_URL="${BACKEND_API_URL:-https://gamblecodez.com}"
REDIRECT_URL_BASE="${REDIRECT_BASE_URL:-https://gamblecodez.com/affiliates/redirect}"
REDIRECT_HEALTH_URL="${REDIRECT_URL_BASE}/health"
CSV="${AFFILIATES_CSV_PATH:-/root/gcz/master_affiliates.csv}"
BACKUP_PATH="${BACKUP_DIR:-/root/gcz/backups}"

export TZ="${CRON_TIMEZONE:-UTC}"
export PGPASSWORD="${PGPASSWORD:-}"

LOG_DIR="$ROOT/logs"
mkdir -p "$LOG_DIR" "$BACKUP_PATH"

cd "$ROOT" || exit 1

# ------------------------------------------------------------
# SELF-HEAL HELPERS
# ------------------------------------------------------------
fix_node_modules() {
  echo "[heal] ensuring node modules (express, node-fetch, pm2)..."
  npm list express >/dev/null 2>&1 || npm install express --silent
  npm list node-fetch >/dev/null 2>&1 || npm install node-fetch --silent
  npm list pm2 >/dev/null 2>&1 || npm install pm2 --silent || true
}

fix_package_type_module() {
  if ! grep -q '"type": "module"' "$ROOT/package.json"; then
    echo "[heal] adding \"type\": \"module\" to package.json"
    tmp="$(mktemp)"
    jq '.type="module"' "$ROOT/package.json" > "$tmp" 2>/dev/null || {
      # Fallback if jq not present
      sed -i '0,/{/s//{\n  "type": "module",/' "$ROOT/package.json"
      return
    }
    mv "$tmp" "$ROOT/package.json"
  fi
}

fix_backend_init() {
  if [[ ! -f "$ROOT/backend/__init__.py" ]]; then
    echo "[heal] adding backend/__init__.py"
    touch "$ROOT/backend/__init__.py"
  fi
}

fix_affiliates_csv_header() {
  if [[ -f "$CSV" ]]; then
    if ! head -n1 "$CSV" | grep -q "resolved_domain"; then
      echo "[heal] adding resolved_domain column to CSV header"
      tmp="$(mktemp)"
      awk 'BEGIN{FS=OFS=","} NR==1{for(i=1;i<=NF;i++)if($i=="resolved_domain")f=1; if(!f){$0=$0",resolved_domain"} }1' "$CSV" > "$tmp"
      mv "$tmp" "$CSV"
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
# COMMANDS
# ------------------------------------------------------------

status_all() {
  echo "==== PM2 STATUS ===="
  pm2 list || true
  echo

  echo "==== API HEALTH ===="
  curl -s "$API_URL/health" || echo "API DOWN"
  echo

  echo "==== SYSTEM STATUS ===="
  curl -s "$API_URL/system/status" || echo "SYSTEM CHECK FAILED"
  echo

  echo "==== REDIRECT HEALTH ===="
  curl -s "$REDIRECT_HEALTH_URL" || echo "REDIRECT DOWN"
}

restart_all() {
  self_heal_core
  pm2 restart ecosystem.config.cjs --update-env || true
  pm2 save || true
}

restart_api()       { self_heal_core; pm2 restart gcz-api || true; }
restart_bot()       { self_heal_core; pm2 restart gcz-bot || true; }
restart_redirect()  { self_heal_core; pm2 restart gcz-redirect || true; }
restart_watchdog()  { self_heal_core; pm2 restart gcz-watchdog || true; }

run_daily() {
  self_heal_core
  echo "[daily] starting"
  node jobs/daily.js
}

warm_redirect() {
  self_heal_core
  echo "[warmup] starting"
  node jobs/warmup.js
}

reconcile_db_csv() {
  self_heal_core
  echo "[reconcile] starting"
  node jobs/reconcile.js
}

backup_all() {
  self_heal_core
  TS="$(date +%F_%H%M%S)"

  echo "[backup] CSV"
  cp "$CSV" "$BACKUP_PATH/master_affiliates_$TS.csv"

  echo "[backup] Postgres"
  pg_dump gambledb > "$BACKUP_PATH/gambledb_$TS.sql"
}

affiliate_audit() {
  self_heal_core
  echo "[audit] latest affiliates"
  psql -U gamblecodez -h localhost -d gambledb \
    -c "SELECT name, affiliateurl, level, date_added FROM affiliates_master ORDER BY date_added DESC LIMIT 25;"
}

view_logs_api()       { pm2 logs gcz-api; }
view_logs_bot()       { pm2 logs gcz-bot; }
view_logs_redirect()  { pm2 logs gcz-redirect; }
view_logs_watchdog()  { pm2 logs gcz-watchdog; }

# ------------------------------------------------------------
# NON-INTERACTIVE MODE
# ------------------------------------------------------------

if [[ "${1:-}" != "" ]]; then
  case "$1" in
    status)           status_all ;;
    restart-all)      restart_all ;;
    restart-api)      restart_api ;;
    restart-bot)      restart_bot ;;
    restart-redirect) restart_redirect ;;
    restart-watchdog) restart_watchdog ;;
    run-daily)        run_daily ;;
    warmup)           warm_redirect ;;
    reconcile)        reconcile_db_csv ;;
    backup)           backup_all ;;
    audit)            affiliate_audit ;;
    *)
      echo "Unknown command"
      exit 1
    ;;
  esac
  exit 0
fi

# ------------------------------------------------------------
# INTERACTIVE DASHBOARD
# ------------------------------------------------------------

clear
echo "======================================================"
echo " 🧠 GambleCodez — Master Control Dashboard"
echo "======================================================"
echo
echo " [1] Full System Status"
echo " [2] Restart ALL services"
echo " [3] Restart API"
echo " [4] Restart Bot"
echo " [5] Restart Redirect"
echo " [6] Restart Watchdog"
echo " [7] Run Daily Automation"
echo " [8] Warm Redirect Cache"
echo " [9] Reconcile DB ↔ CSV"
echo " [10] Backup CSV + DB"
echo " [11] Affiliate Audit"
echo " [12] View Logs"
echo " [0] Exit"
echo
read -rp "Select option: " CHOICE

case "$CHOICE" in
  1) status_all ;;
  2) restart_all ;;
  3) restart_api ;;
  4) restart_bot ;;
  5) restart_redirect ;;
  6) restart_watchdog ;;
  7) run_daily ;;
  8) warm_redirect ;;
  9) reconcile_db_csv ;;
  10) backup_all ;;
  11) affiliate_audit ;;
  12)
    echo
    echo " [1] API Logs"
    echo " [2] Bot Logs"
    echo " [3] Redirect Logs"
    echo " [4] Watchdog Logs"
    read -rp "Select logs: " LOGC
    case "$LOGC" in
      1) view_logs_api ;;
      2) view_logs_bot ;;
      3) view_logs_redirect ;;
      4) view_logs_watchdog ;;
    esac
  ;;
  0) exit 0 ;;
  *) echo "Invalid option" ;;
esac