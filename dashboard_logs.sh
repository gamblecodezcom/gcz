#!/bin/bash
source "$(dirname "$0")/gcz-env.sh"

while true; do
  clear
  box_top
  echo -e "┃                 ${C_CYAN}LOGS VIEWER${C_RESET}                     ┃"
  box_bottom
  echo
  echo -e "${C_CYAN}[1]${C_RESET} Redirect Logs"
  echo -e "${C_CYAN}[2]${C_RESET} Drops Logs"
  echo -e "${C_CYAN}[3]${C_RESET} Bot Logs"
  echo -e "${C_CYAN}[4]${C_RESET} Discord Logs"
  echo -e "${C_CYAN}[5]${C_RESET} Watchdog Logs"
  echo -e "${C_CYAN}[6]${C_RESET} Combined Logs"
  echo -e "${C_CYAN}[0]${C_RESET} Back"
  echo
  echo -n "Select: "
  read choice

  case "$choice" in
    1) tail -n 50 -F "$GZ_LOGS/gcz-redirect-out.log" ;;
    2) tail -n 50 -F "$GZ_LOGS/gcz-drops-out.log" ;;
    3) tail -n 50 -F "$GZ_LOGS/gcz-bot-out.log" ;;
    4) tail -n 50 -F "$GZ_LOGS/gcz-discord-out.log" ;;
    5) tail -n 50 -F "$GZ_LOGS/gcz-watchdog-out.log" ;;
    6) tail -n 50 -F "$GZ_LOGS"/gcz-*-out.log ;;
    0) break ;;
    *) echo "Invalid"; sleep 1 ;;
  esac
done
