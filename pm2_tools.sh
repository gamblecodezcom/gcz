#!/bin/bash
source "$(dirname "$0")/gcz-env.sh"

clear
box_top
echo -e "┃              ${C_CYAN}PM2 QUICK ACTIONS${C_RESET}                  ┃"
box_bottom
echo
echo -e "${C_CYAN}[1]${C_RESET} Start ALL"
echo -e "${C_CYAN}[2]${C_RESET} Reload ALL"
echo -e "${C_CYAN}[3]${C_RESET} Stop ALL"
echo -e "${C_CYAN}[4]${C_RESET} PM2 List"
echo -e "${C_CYAN}[0]${C_RESET} Back"
echo
echo -n "Select: "
read pchoice

case "$pchoice" in
  1) pm2 start "$GZ_ROOT/ecosystem.config.cjs" && pm2 save ;;
  2) pm2 reload "$GZ_ROOT/ecosystem.config.cjs" && pm2 save ;;
  3) pm2 stop "$GZ_ROOT/ecosystem.config.cjs" ;;
  4) pm2 list ;;
  0) ;;
  *) echo "Invalid"; sleep 1 ;;
esac

read -p "Enter to return..."
