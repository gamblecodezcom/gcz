#!/bin/bash
source "$(dirname "$0")/gcz-env.sh"

clear
box_top
echo -e "┃        ${C_CYAN}SYSTEM HEALTH DASHBOARD (v4.2)${C_RESET}          ┃"
box_bottom
echo

UPTIME=$(uptime -p)
LOAD=$(cut -d " " -f1-3 /proc/loadavg)
MEM=$(free -h | awk "/Mem:/ {print \$3 \" / \" \$2}")
DISK=$(df -h / | awk "NR==2 {print \$3 \" / \" \$2 \" (\" \$5 \" used)\"}")

echo -e "${C_CYAN}Uptime:      ${C_RESET}${UPTIME}"
echo -e "${C_CYAN}CPU Load:    ${C_RESET}${C_GREEN}${LOAD}${C_RESET}"
echo -e "${C_CYAN}RAM Usage:   ${C_RESET}${C_GREEN}${MEM}${C_RESET}"
echo -e "${C_CYAN}Disk Usage:  ${C_RESET}${C_YELLOW}${DISK}${C_RESET}"

WD_STATUS=$(pm2 list | grep -E "$PM2_WATCHDOG" | awk "{print \$10}")
[[ -z "$WD_STATUS" ]] && WD_STATUS="UNKNOWN"

echo -e "${C_CYAN}Watchdog:    ${C_RESET}$(status_color "$WD_STATUS")"
echo
echo -e "${C_YELLOW}Ctrl+C to return${C_RESET}"
