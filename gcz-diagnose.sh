#!/bin/bash
# ============================================================
#   GambleCodez Unified Diagnose + Auto-Heal (v8 Clean)
#   One root: /var/www/html/gcz
#   One DB: Neon (source of truth)
#   Local Postgres: async mirror (best-effort, non-fatal)
# ============================================================

GZ="/var/www/html/gcz"
CSV="$GZ/master_affiliates.csv"
SCHEMA="$GZ/sql/base_schema.sql"
DB="$AI_AGENT_NEON_DB_URL"
LOCAL_DB="postgresql://gamblecodez:Dope-19881988@localhost:5432/gambledb"

echo -e "\033[1m🧠 GambleCodez — Unified Diagnose + Auto-Heal (v8)\033[0m"

# ============================================================
# 0. CLEANUP (safe, non-destructive now)
# ============================================================
echo "[clean] skipping /root/gcz removal (system-linked or legacy)"
# just report if it exists, don't delete
if [ -d "/root/gcz" ]; then
  echo "[clean] note: /root/gcz exists (legacy/system-linked)"
fi

# ============================================================
# 1. BACKEND HEALTH
# ============================================================
echo "[heal] backend deps"
cd "$GZ" || exit 1
npm install --silent || echo "[warn] npm install (backend) failed — continuing"

# ============================================================
# 2. FRONTEND BUILD (non-blocking)
# ============================================================
if [[ -f "$GZ/frontend/package.json" ]]; then
  echo "[heal] frontend deps + build"
  cd "$GZ/frontend" || echo "[warn] frontend dir missing" 
  npm install --silent || echo "[warn] npm install (frontend) failed — continuing"
  # Allow TS warnings/errors to NOT break the whole diagnose run
  npm run build || echo "[warn] frontend build failed (non-blocking)"
  cd "$GZ" || exit 1
else
  echo "[info] no frontend/package.json, skipping frontend build"
fi

# ============================================================
# 3. APPLY SCHEMA TO NEON
# ============================================================
if [[ -f "$SCHEMA" ]]; then
  echo "[heal] applying base schema to Neon"
  psql "$DB" -f "$SCHEMA" || echo "[warn] schema apply to Neon failed"
else
  echo "[warn] schema missing at $SCHEMA"
fi

# ============================================================
# 4. CSV IMPORT → NEON (FK-safe)
# ============================================================
if [[ -f "$CSV" ]]; then
  echo "[heal] importing affiliates_master from CSV (FK-safe)"

  psql "$DB" << EOF
TRUNCATE daily_drops, affiliates_master RESTART IDENTITY CASCADE;

\\copy affiliates_master(
    name,
    affiliate_url,
    priority,
    category,
    status,
    level,
    date_added,
    bonus_code,
    bonus_description,
    icon_url,
    resolved_domain,
    redemption_speed,
    redemption_minimum,
    redemption_type
)
FROM '$CSV'
CSV HEADER;

SELECT COUNT(*) AS imported_rows FROM affiliates_master;
EOF

  if [[ $? -ne 0 ]]; then
    echo "[warn] CSV import encountered errors — check data / constraints"
  fi
else
  echo "[warn] CSV missing at $CSV"
fi

# ============================================================
# 5. NEON SCHEMA VALIDATOR (clean table list)
# ============================================================
if [[ -f "$SCHEMA" ]]; then
  echo "[validate] checking Neon schema vs base_schema.sql"

  psql "$DB" -c "\dt" > /tmp/neon_tables.txt

  # Only grab CREATE TABLE lines, strip quotes + (
  grep -E "^CREATE TABLE" "$SCHEMA" \
    | awk '{print $3}' \
    | sed 's/[\"(]//g' \
    > /tmp/schema_tables.txt

  echo "=== Missing Tables in Neon ==="
  comm -23 <(sort /tmp/schema_tables.txt) <(sort /tmp/neon_tables.txt) || true

  echo "=== Extra Tables in Neon ==="
  comm -13 <(sort /tmp/schema_tables.txt) <(sort /tmp/neon_tables.txt) || true

else
  echo "[warn] cannot validate schema — $SCHEMA not found"
fi

# ============================================================
# 6. GOOSE → NEON BRIDGE
# ============================================================
echo "[bridge] syncing Goose to Neon env"
export GOOSE_DB_URL="$DB"
export GOOSE_MIGRATIONS="$GZ/sql"

# ============================================================
# 7. SYNC LOCAL POSTGRES FROM NEON (best-effort)
# ============================================================
echo "[sync] syncing local Postgres from Neon (best-effort async mirror)"

if command -v pg_dump >/dev/null 2>&1; then
  if pg_dump "$DB" > /tmp/neon_dump.sql 2>/tmp/neon_dump.err; then
    # best-effort restore without DROP SCHEMA to avoid permission failures
    if psql "$LOCAL_DB" -f /tmp/neon_dump.sql; then
      echo "[sync] local Postgres restore completed (no DROP SCHEMA)"
    else
      echo "[warn] local Postgres restore failed — check roles/permissions"
    fi
  else
    echo "[warn] pg_dump failed (likely version mismatch) — see /tmp/neon_dump.err"
  fi
else
  echo "[warn] pg_dump not installed — local mirror sync skipped"
fi

# ============================================================
# 8. PM2 RELOAD
# ============================================================
echo "[heal] reloading PM2"
pm2 reload "$GZ/ecosystem.config.cjs" || echo "[warn] PM2 reload failed"
pm2 save || echo "[warn] PM2 save failed"

echo "[status] PM2:"
pm2 status || echo "[warn] PM2 status failed"

# ============================================================
# 9. NIGHTLY AUTO-HEAL CRON (self-install)
# ============================================================
CRONLINE="0 3 * * * $GZ/gcz-diagnose.sh >> $GZ/logs/auto_audit.log 2>&1"
crontab -l 2>/dev/null | grep -q "$GZ/gcz-diagnose.sh"
if [[ $? -ne 0 ]]; then
  (crontab -l 2>/dev/null; echo "$CRONLINE") | crontab -
  echo "[cron] nightly auto-heal installed"
else
  echo "[cron] nightly auto-heal already active"
fi

echo -e "\n\033[1m✓ Diagnose Complete — Unified, Neon-Synced, Errors Tolerated\033[0m"