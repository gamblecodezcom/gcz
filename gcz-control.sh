#!/bin/bash
source "$(dirname "$0")/gcz-env.sh"

main_menu() {
  clear
  box_top
  echo -e "┃  ${C_CYAN}G A M B L E C O D E Z   V P S   D A S H B O A R D${C_RESET}       ┃"
  echo -e "┃                ${C_GREEN}v4.2 Modular${C_RESET}                     ┃"
  box_bottom
  echo

  echo -e "${C_CYAN}[1]${C_RESET} System Health Dashboard"
  echo -e "${C_CYAN}[2]${C_RESET} PM2 Dashboard"
  echo -e "${C_CYAN}[3]${C_RESET} Backend Dashboard"
  echo -e "${C_CYAN}[4]${C_RESET} Bot Dashboard"
  echo -e "${C_CYAN}[5]${C_RESET} Database & CSV Dashboard"
  echo -e "${C_CYAN}[6]${C_RESET} Tools & Utilities"
  echo -e "${C_CYAN}[7]${C_RESET} Logs Dashboard"
  echo -e "${C_CYAN}[0]${C_RESET} Exit"
  echo
  echo -n "Select: "
  read choice

  case "$choice" in
    1) watch -n 2 bash "$GZ_ROOT/dashboard_system.sh" ;;
    2) watch -n 2 bash "$GZ_ROOT/dashboard_pm2.sh" ;;
    3) watch -n 2 bash "$GZ_ROOT/dashboard_backend.sh" ;;
    4) watch -n 2 bash "$GZ_ROOT/dashboard_bots.sh" ;;
    5) watch -n 2 bash "$GZ_ROOT/dashboard_db.sh" ;;
    6) bash "$GZ_ROOT/tools_menu.sh" ;;
    7) bash "$GZ_ROOT/dashboard_logs.sh" ;;
    0) exit 0 ;;
    *) echo "Invalid"; sleep 1 ;;
  esac
}

main_menu
