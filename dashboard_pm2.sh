#!/bin/bash
source "$(dirname "$0")/gcz-env.sh"

clear
box_top
echo -e "┃              ${C_CYAN}PM2 DASHBOARD${C_RESET}                     ┃"
box_bottom
echo

pm2 list | awk "
NR>3 && \$2 ~ /gcz-/ {
  printf \"%-15s %-10s %-8s %-6s\n\", \$2, \$10, \$11, \$12
}" | while read name status mem cpu; do
  printf "%-15s %s  %s  %s\n" "$name" "$(status_color "$status")" "$mem" "$cpu"
done

echo
echo -e "${C_YELLOW}Ctrl+C to return${C_RESET}"
