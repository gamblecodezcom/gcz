#!/bin/bash
source "$(dirname "$0")/gcz-env.sh"

clear
box_top
echo -e "┃             ${C_CYAN}DATABASE & CSV STATUS${C_RESET}               ┃"
box_bottom
echo

if [[ -n "$NEON_DB" ]]; then
  NEON_OK=$(psql "$NEON_DB" -t -c "SELECT 1;" 2>/dev/null | xargs)
  [[ "$NEON_OK" == "1" ]] && NEON_STATUS="CONNECTED" || NEON_STATUS="ERR"
else
  NEON_STATUS="NO_ENV"
fi

LOCAL_OK=$(psql "$LOCAL_DB" -t -c "SELECT 1;" 2>/dev/null | xargs)
[[ "$LOCAL_OK" == "1" ]] && LOCAL_STATUS="CONNECTED" || LOCAL_STATUS="ERR"

echo -e "${C_CYAN}Neon DB:         ${C_RESET}$(status_color "$NEON_STATUS")"
echo -e "${C_CYAN}Local DB:        ${C_RESET}$(status_color "$LOCAL_STATUS")"

[[ -f "$GZ_CSV" ]] && CSV_STATUS="FOUND" || CSV_STATUS="MISSING"
echo -e "${C_CYAN}CSV File:        ${C_RESET}$(status_color "$CSV_STATUS")"

if [[ -n "$NEON_DB" ]]; then
  BUGS=$(psql "$NEON_DB" -t -c "SELECT COUNT(*) FROM bug_reports WHERE status != 'fixed';" 2>/dev/null | xargs)
else
  BUGS="NO_ENV"
fi

echo -e "${C_CYAN}Unresolved Bugs: ${C_RESET}$(status_color "$BUGS")"
echo
echo -e "${C_YELLOW}Ctrl+C to return${C_RESET}"
