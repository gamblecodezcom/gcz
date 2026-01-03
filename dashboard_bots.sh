#!/bin/bash
source "$(dirname "$0")/gcz-env.sh"

clear
box_top
echo -e "┃                ${C_CYAN}BOT STATUS${C_RESET}                       ┃"
box_bottom
echo

TG=$(pm2 list | grep -E "$PM2_BOT" | awk "{print \$10}")
DS=$(pm2 list | grep -E "$PM2_DISCORD" | awk "{print \$10}")

[[ -z "$TG" ]] && TG="UNKNOWN"
[[ -z "$DS" ]] && DS="UNKNOWN"

echo -e "${C_CYAN}Telegram Bot: ${C_RESET}$(status_color "$TG")"
echo -e "${C_CYAN}Discord Bot:  ${C_RESET}$(status_color "$DS")"

echo
echo -e "${C_YELLOW}Ctrl+C to return${C_RESET}"
