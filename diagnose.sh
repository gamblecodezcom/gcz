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
