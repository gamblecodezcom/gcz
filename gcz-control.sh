#!/usr/bin/env bash
# GAMBLECODEZ MASTER CONTROL DASHBOARD

set -euo pipefail
ROOT="/var/www/html/gcz"; ENV="$ROOT/.env"
[[ -f "$ENV" ]] && { set -a; source "$ENV"; set +a; }

pgfix() { export PGPASSWORD="${DATABASE_URL#*:}"; PGPASSWORD="${PGPASSWORD%%@*}"; }

heal_core() {
  pgfix
  pm2 list >/dev/null || npm i -g pm2
  [[ ! -f backend/__init__.py ]] && touch backend/__init__.py
  [[ ! -f "$ROOT/master_affiliates.csv" ]] && echo "missing master_affiliates.csv"
  for f in sql/*.sql; do [[ -f "$f" ]] && psql -U gamblecodez -h localhost -d gambledb -f "$f"; done
  pm2 start server.js --name gcz-api || true
  pm2 start start-bot.js --name gcz-bot || true
  pm2 start python3 --name gcz-redirect -- backend/redirect.py || true
  pm2 start watchdog.js --name gcz-watchdog || true
  pm2 save || true
}

backup_all() {
  TS=$(date +%F_%H%M%S); mkdir -p "$ROOT/backups"
  cp "$ROOT/master_affiliates.csv" "$ROOT/backups/master_affiliates_$TS.csv"
  pg_dump gambledb > "$ROOT/backups/db_$TS.sql"
}

if [[ "${1:-}" != "" ]]; then
  case "$1" in
    status) pm2 list; curl -s "$BACKENDAPIURL/health" ;;
    restart-api) heal_core; pm2 restart gcz-api ;;
    restart-bot) heal_core; pm2 restart gcz-bot ;;
    restart-redirect) heal_core; pm2 restart gcz-redirect ;;
    restart-watchdog) heal_core; pm2 restart gcz-watchdog ;;
    restart-all) heal_core; pm2 reload all ;;
    backup) backup_all ;;
    *) echo "Unknown command"; exit 1 ;;
  esac
  exit 0
fi

clear
echo "====================== GCZ CONTROL ======================"
echo " [1] Status All      [2] Restart ALL"
echo " [3] API             [4] Bot"
echo " [5] Redirect        [6] Watchdog"
echo " [7] Backup CSV/DB   [0] Exit"
read -rp "Choose: " C
case "$C" in
  1) "$0" status ;;
  2) "$0" restart-all ;;
  3) "$0" restart-api ;;
  4) "$0" restart-bot ;;
  5) "$0" restart-redirect ;;
  6) "$0" restart-watchdog ;;
  7) "$0" backup ;;
  0) exit 0 ;;
esac
