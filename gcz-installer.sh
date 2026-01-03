#!/bin/bash
# ============================================================
#  GambleCodez — GCZ Control v4.2 Installer (A1 Mode)
#  OVERWRITES all modules. Uses existing gcz-env.sh
# ============================================================

GZ_ROOT="/var/www/html/gcz"

echo "🔧 Installing GCZ Control v4.2 (A1 Mode — overwrite all)"
cd "$GZ_ROOT" || { echo "❌ Cannot cd into $GZ_ROOT"; exit 1; }

write_file() {
  FILE="$1"
  shift
  echo "📝 Writing $FILE"
  cat > "$FILE" << 'EOF'
$CONTENT$
EOF
  chmod +x "$FILE"
}

# gcz-control.sh
cat > "$GZ_ROOT/gcz-control.sh" << 'EOF'
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
EOF
chmod +x "$GZ_ROOT/gcz-control.sh"

# dashboard_system.sh
cat > "$GZ_ROOT/dashboard_system.sh" << 'EOF'
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
EOF
chmod +x "$GZ_ROOT/dashboard_system.sh"

# dashboard_pm2.sh
cat > "$GZ_ROOT/dashboard_pm2.sh" << 'EOF'
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
EOF
chmod +x "$GZ_ROOT/dashboard_pm2.sh"

# dashboard_backend.sh
cat > "$GZ_ROOT/dashboard_backend.sh" << 'EOF'
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
EOF
chmod +x "$GZ_ROOT/dashboard_backend.sh"

# dashboard_bots.sh
cat > "$GZ_ROOT/dashboard_bots.sh" << 'EOF'
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
EOF
chmod +x "$GZ_ROOT/dashboard_bots.sh"

# dashboard_db.sh
cat > "$GZ_ROOT/dashboard_db.sh" << 'EOF'
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
EOF
chmod +x "$GZ_ROOT/dashboard_db.sh"

# dashboard_logs.sh
cat > "$GZ_ROOT/dashboard_logs.sh" << 'EOF'
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
EOF
chmod +x "$GZ_ROOT/dashboard_logs.sh"

# tools_menu.sh
cat > "$GZ_ROOT/tools_menu.sh" << 'EOF'
#!/bin/bash
source "$(dirname "$0")/gcz-env.sh"

while true; do
  clear
  box_top
  echo -e "┃             ${C_CYAN}TOOLS & UTILITIES${C_RESET}                  ┃"
  box_bottom
  echo
  echo -e "${C_CYAN}[D]${C_RESET} Diagnose v9"
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
    D|d) bash "$GZ_ROOT/diagnose_v9.sh" ;;
    S|s) bash "$GZ_ROOT/sync_test_only.sh" ;;
    A|a) bash "$GZ_ROOT/admin_shortcuts.sh" ;;
    P|p) bash "$GZ_ROOT/pm2_tools.sh" ;;
    R|r) bash "$GZ_ROOT/redirect_menu.sh" ;;
    B|b) bash "$GZ_ROOT/backup_tools.sh" ;;
    0) break ;;
    *) echo "Invalid"; sleep 1 ;;
  esac
done
EOF
chmod +x "$GZ_ROOT/tools_menu.sh"

# diagnose_v9.sh
cat > "$GZ_ROOT/diagnose.sh" << 'EOF'
#!/bin/bash
source "$(dirname "$0")/gcz-env.sh"

clear
echo -e "${C_BOLD}${C_CYAN}🧠 Diagnose + Auto-Heal (v9-lite)${C_RESET}"
echo "Root       : $GZ_ROOT"
echo "Neon DB    : $NEON_DB"
echo "Local DB   : $LOCAL_DB"
echo "CSV        : $GZ_CSV"
echo "----------------------------------------------"

cd "$GZ_ROOT" || exit 1

echo "[heal] backend deps"
npm install --silent || echo "[warn] backend npm install failed"

if [[ -f "$GZ_ROOT/frontend/package.json" ]]; then
  echo "[heal] frontend deps + build"
  cd "$GZ_ROOT/frontend"
  npm install --silent
  npm run build
  cd "$GZ_ROOT"
fi

if [[ -n "$NEON_DB" && -f "$GZ_CSV" ]]; then
  echo "[heal] CSV → Neon"
  psql "$NEON_DB" << EOF2
TRUNCATE affiliates_master RESTART IDENTITY CASCADE;
\\copy affiliates_master FROM '$GZ_CSV' CSV HEADER;
SELECT COUNT(*) FROM affiliates_master;
EOF2
fi

echo "[sync] Neon → Local"
if pg_dump "$NEON_DB" > /tmp/neon_dump.sql 2>/tmp/neon_dump.err; then
  psql "$LOCAL_DB" -f /tmp/neon_dump.sql
fi

echo "[pm2] reload"
pm2 reload "$GZ_ROOT/ecosystem.config.cjs"
pm2 save

echo "[test] Redirect: $(http_code "$REDIRECT_HEALTH")"
echo "[test] Drops:    $(http_code "$DROPS_HEALTH")"

echo -e "\n${C_GREEN}✓ Complete${C_RESET}"
read -p "Enter to return..."
EOF
chmod +x "$GZ_ROOT/diagnose_v9.sh"

# sync_test_only.sh
cat > "$GZ_ROOT/sync_test_only.sh" << 'EOF'
#!/bin/bash
source "$(dirname "$0")/gcz-env.sh"

clear
box_top
echo -e "┃       ${C_CYAN}Neon + Local Sync Test${C_RESET}                ┃"
box_bottom
echo

if pg_dump "$NEON_DB" > /tmp/neon_dump_test.sql 2>/tmp/neon_dump_test.err; then
  echo "[ok] pg_dump succeeded"
else
  echo "[warn] pg_dump failed"
fi

read -p "Enter to return..."
EOF
chmod +x "$GZ_ROOT/sync_test_only.sh"

# pm2_tools.sh
cat > "$GZ_ROOT/pm2_tools.sh" << 'EOF'
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
EOF
chmod +x "$GZ_ROOT/pm2_tools.sh"

# admin_shortcuts.sh
cat > "$GZ_ROOT/admin_shortcuts.sh" << 'EOF'
#!/bin/bash
source "$(dirname "$0")/gcz-env.sh"

clear
box_top
echo -e "┃             ${C_CYAN}ADMIN SHORTCUTS${C_RESET}                     ┃"
box_bottom
echo
echo "Bug Admin  : https://gamblecodez.com/admin/bug-admin.html"
echo "Admin ToDo : https://gamblecodez.com/admin/bug-admin.html#todo"
echo
read -p "Enter to return..."
EOF
chmod +x "$GZ_ROOT/admin_shortcuts.sh"

# backup_tools.sh
cat > "$GZ_ROOT/backup_tools.sh" << 'EOF'
#!/bin/bash
source "$(dirname "$0")/gcz-env.sh"

clear
box_top
echo -e "┃              ${C_CYAN}BACKUP TOOLS${C_RESET}                       ┃"
box_bottom
echo

TS="$(date +%Y%m%d-%H%M%S)"
OUT="$GZ_BACKUPS/gcz-backup-$TS.tar.gz"

echo "Creating backup: $OUT"
tar -czf "$OUT" -C "$GZ_ROOT" . \
  --exclude="node_modules" \
  --exclude="logs" \
  --exclude="backups"

echo "[ok] backup created"
read -p "Enter to return..."
EOF
chmod +x "$GZ_ROOT/backup_tools.sh"

# redirect_menu.sh
cat > "$GZ_ROOT/redirect_menu.sh" << 'EOF'
#!/bin/bash
source "$(dirname "$0")/gcz-env.sh"

clear
box_top
echo -e "┃             ${C_CYAN}REDIRECT TOOLS (STUB)${C_RESET}               ┃"
box_bottom
echo
echo "FastAPI redirect engine:"
echo "  $REDIRECT_HEALTH"
echo
echo "This module is a placeholder for future redirect tools."
echo
read -p "Enter to return..."
EOF
chmod +x "$GZ_ROOT/redirect_menu.sh"

echo "✅ GCZ Control v4.2 installation complete (A1 Mode)"
echo "All modules were overwritten and rebuilt."