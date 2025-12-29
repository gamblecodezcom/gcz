#!/bin/bash
# ============================================================
#   GambleCodez Compact AI‑Powered VPS Control Panel (v3.1)
#   Optimized for Termux, SSH, Android readability, and speed
# ============================================================

GZ_VPS_IP="72.60.113.42"
GZ_PROJECT_DIR="/var/www/html/gcz"
GZ_BACKUP_DIR="$GZ_PROJECT_DIR/backups"
GZ_DB_NAME="gambledb"
mkdir -p "$GZ_BACKUP_DIR"

# ------------------------------------------------------------
main_menu() {
  clear
  echo -e "\033[1m|GambleCodez VPS Dashboard|\033[0m"
  echo "+----------------------------------------------+"
  echo "VPS      : ONLINE"

  # PM2 STATUS (safe fallback)
  echo -n "PM2      : "
  pm2 list | grep -E "gcz-(api|bot|redirect|watchdog|discord)" \
    | awk '{print $4"="$10}' | paste -sd'  ' -

  echo "Site     : $(curl -s -o /dev/null -w '%{http_code}' https://gamblecodez.com)"
  echo "Redirect : $(curl -s -o /dev/null -w '%{http_code}' https://gamblecodez.com/affiliates/redirect/test)"
  echo "------------------------------------------------"

  echo -e "\033[1mMENU 1/2\033[0m"
  echo "[1] Start ALL services"
  echo "[2] Restart ALL services"
  echo "[3] Stop ALL services"
  echo "[4] PM2 list"
  echo "[5] Logs (all)"
  echo "[6] Health detail"
  echo "[7] Edit shell settings"
  echo "[8] Next page"
  echo "[9] Auto-refresh view"
  echo "[R] Redirect Menu"
  echo "[0] Exit"
  echo -n "Select: "
  read choice

  case "$choice" in
    1) pm2 start ecosystem.config.cjs && pm2 save ;;
    2) pm2 reload ecosystem.config.cjs && pm2 save ;;
    3) pm2 stop ecosystem.config.cjs ;;
    4) pm2 list ;;
    5) pm2 logs ;;
    6) curl -s https://gamblecodez.com/health ;;
    7) nano ~/.bashrc ;;
    8) bash "$GZ_PROJECT_DIR/gcz-control-next.sh" ;;
    9) watch -n 5 bash "$GZ_PROJECT_DIR/gcz-control.sh" ;;
    R|r) bash "$GZ_PROJECT_DIR/redirect-menu.sh" ;;
    0) exit 0 ;;
    *) echo "Invalid" && sleep 1 ;;
  esac

  main_menu
}

main_menu