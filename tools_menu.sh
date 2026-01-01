#!/bin/bash
source "$(dirname "$0")/gcz-env.sh"

while true; do
  clear
  box_top
  echo -e "┃             ${C_CYAN}TOOLS & UTILITIES${C_RESET}                  ┃"
  box_bottom
  echo
  echo -e "${C_CYAN}[D]${C_RESET} Diagnose"
  echo -e "${C_CYAN}[S]${C_RESET} Sync Test Only"
  echo -e "${C_CYAN}[A]${C_RESET} Admin Shortcuts"
  echo -e "${C_CYAN}[P]${C_RESET} PM2 Quick Actions"
  echo -e "${C_CYAN}[R]${C_RESET} Redirect Tools"
  echo -e "${C_CYAN}[B]${C_RESET} Backup Tools"
  echo -e "${C_CYAN}[0]${C_RESET} Back"
  echo
  echo -n "Select: "
  read tchoice

  case "$tchoice" in
    D|d) bash "$GZ_ROOT/diagnose.sh" ;;
    S|s) bash "$GZ_ROOT/sync_test_only.sh" ;;
    A|a) bash "$GZ_ROOT/admin_shortcuts.sh" ;;
    P|p) bash "$GZ_ROOT/pm2_tools.sh" ;;
    R|r) bash "$GZ_ROOT/redirect_menu.sh" ;;
    B|b) bash "$GZ_ROOT/backup_tools.sh" ;;
    0) break ;;
    *) echo "Invalid"; sleep 1 ;;
  esac
done
