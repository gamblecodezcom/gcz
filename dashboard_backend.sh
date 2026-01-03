#!/bin/bash
source "$(dirname "$0")/gcz-env.sh"

clear
box_top
echo -e "┃           ${C_CYAN}FASTAPI BACKEND HEALTH${C_RESET}               ┃"
box_bottom
echo

REDIRECT_CODE=$(http_code "$REDIRECT_HEALTH")
DROPS_CODE=$(http_code "$DROPS_HEALTH")

echo -e "${C_CYAN}Redirect Engine: ${C_RESET}$(status_color "$REDIRECT_CODE")"
echo -e "${C_CYAN}Drops Engine:    ${C_RESET}$(status_color "$DROPS_CODE")"

PORT1=$(ss -tulpn | grep ":$REDIRECT_PORT " >/dev/null && echo "ACTIVE" || echo "DOWN")
PORT2=$(ss -tulpn | grep ":$DROPS_PORT " >/dev/null && echo "ACTIVE" || echo "DOWN")

echo -e "${C_CYAN}Port $REDIRECT_PORT: ${C_RESET}$(status_color "$PORT1")"
echo -e "${C_CYAN}Port $DROPS_PORT:    ${C_RESET}$(status_color "$PORT2")"

echo
echo -e "${C_YELLOW}Ctrl+C to return${C_RESET}"
