#!/bin/bash
# ============================================================
#   GambleCodez Auto-Diagnose & Self-Healing Script (v3)
# ============================================================

GZ_DIR="/var/www/html/gcz"
echo -e "\033[1m🧠 GambleCodez — Full System Check + Auto-Heal\033[0m"

# 1. NODE MODULES CHECK
echo "[heal] node modules + package.json"
cd "$GZ_DIR"
npm install --silent

# 2. FRONTEND BUILD (Vite fix)
if [[ -f "$GZ_DIR/frontend/package.json" ]]; then
  echo "[heal] frontend deps + build"
  cd "$GZ_DIR/frontend"
  npm install --silent
  if ! command -v vite &> /dev/null; then
    npm install vite --save-dev
  fi
  npm run build
  cd "$GZ_DIR"
fi

# 3. SQL MIGRATIONS
echo "[heal] running SQL migrations..."
for f in "$GZ_DIR"/sql/*.sql; do
  [[ -f "$f" ]] && echo "Running: $f" && PGPASSWORD="Dope-19881988" psql -U gamblecodez -h localhost -d gambledb -f "$f"
done

# 4. PM2 CHECK + BOT SCRIPT FIX
if ! grep -q "start-bot.js" "$GZ_DIR/ecosystem.config.cjs"; then
  echo "[heal] missing bot script in PM2 config — patching"
  sed -i '/gcz-watchdog/ a\
    {\
      name: "gcz-bot",\
      script: "start-bot.js",\
      cwd: "'$GZ_DIR'",\
      watch: false,\
      env: { NODE_ENV: "production" }\
    },' "$GZ_DIR/ecosystem.config.cjs"
fi

# 5. RELOAD PM2
echo "[heal] reloading PM2 config"
pm2 reload "$GZ_DIR/ecosystem.config.cjs"
pm2 save

# 6. STATUS
echo "[status] PM2 process list:"
pm2 status
