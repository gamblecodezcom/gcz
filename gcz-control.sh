#!/usr/bin/env bash
# ============================================================
#  GAMBLECODEZ — MASTER SYSTEM CONTROL (FINAL)
#  Single authoritative ops + admin execution surface
# ============================================================

set -euo pipefail

ROOT="/root/gcz"

# ------------------------------------------------------------
# LOAD ENV (AUTHORITATIVE SOURCE OF TRUTH)
# ------------------------------------------------------------
set -a
source "$ROOT/.env"
set +a

# ------------------------------------------------------------
# NORMALIZED RUNTIME VARS (FROM FINAL ENV)
# ------------------------------------------------------------
API_URL="${BACKENDAPIURL}"
REDIRECT_URL="${REDIRECTBASEURL}"
CSV="${AFFILIATESCSVPATH}"
BACKUP_PATH="${BACKUP_DIR}"

export TZ="${CRONTIMEZONE:-UTC}"

LOG_DIR="$ROOT/logs"

mkdir -p "$LOG_DIR" "$BACKUP_PATH"

cd "$ROOT" || exit 1

# ------------------------------------------------------------
# INTERNAL COMMANDS (ADMIN UI WILL CALL THESE)
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
  curl -s "$REDIRECT_URL/health" || echo "REDIRECT DOWN"
}

restart_all() {
  pm2 restart ecosystem.config.cjs --update-env
  pm2 save
}

restart_api()       { pm2 restart gcz-api; }
restart_bot()       { pm2 restart gcz-bot; }
restart_redirect()  { pm2 restart gcz-redirect; }
restart_watchdog()  { pm2 restart gcz-watchdog; }

run_daily() {
  echo "[daily] starting"
  node jobs/daily.js
}

warm_redirect() {
  echo "[warmup] starting"
  node jobs/warmup.js
}

reconcile_db_csv() {
  echo "[reconcile] starting"
  node jobs/reconcile.js
}

backup_all() {
  TS="$(date +%F_%H%M%S)"

  echo "[backup] CSV"
  cp "$CSV" "$BACKUP_PATH/master_affiliates_$TS.csv"

  echo "[backup] Postgres"
  pg_dump gambledb > "$BACKUP_PATH/gambledb_$TS.sql"
}

affiliate_audit() {
  echo "[audit] latest affiliates"
  psql -U gamblecodez -h localhost -d gambledb \
    -c "SELECT name, affiliateurl, level, date_added FROM affiliates_master ORDER BY date_added DESC LIMIT 25;"
}

view_logs_api()       { pm2 logs gcz-api; }
view_logs_bot()       { pm2 logs gcz-bot; }
view_logs_redirect()  { pm2 logs gcz-redirect; }
view_logs_watchdog()  { pm2 logs gcz-watchdog; }

# ------------------------------------------------------------
# NON-INTERACTIVE MODE (ADMIN DASHBOARD SAFE)
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
# INTERACTIVE DASHBOARD (SSH / TERMUX)
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
