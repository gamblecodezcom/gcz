#!/bin/bash
set -e

USER_ID="GambleCodez"
EMAIL="thetylo88@gmail.com"
USERNAME="GambleCodez"
TELEGRAM_USERNAME="GambleCodez"
TELEGRAM_ID="GambleCodez"   # adjust if you have numeric ID
CWALLET_ID="49657363"
PIN="980432"

echo "=== GCZ DEGEN BOOTSTRAP FOR $USER_ID ==="

if [ -z "$AI_AGENT_NEON_DB_URL" ]; then
  echo "[ERROR] AI_AGENT_NEON_DB_URL is not set. Aborting."
  exit 1
fi

echo "-> Upserting user in users table..."
psql "$AI_AGENT_NEON_DB_URL" <<SQL
INSERT INTO users (user_id, email, username, telegram_username, telegram_id, cwallet_id, locked, created_at, updated_at)
VALUES ('$USER_ID', '$EMAIL', '$USERNAME', '$TELEGRAM_USERNAME', '$TELEGRAM_ID', '$CWALLET_ID', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  telegram_username = EXCLUDED.telegram_username,
  telegram_id = EXCLUDED.telegram_id,
  cwallet_id = EXCLUDED.cwallet_id,
  locked = false,
  updated_at = CURRENT_TIMESTAMP;
SQL

echo "-> Setting PIN hash..."
PIN_HASH=$(printf "%s" "$PIN" | sha256sum | awk '{print $1}')
psql "$AI_AGENT_NEON_DB_URL" -c "
  UPDATE users
  SET pin_hash = '$PIN_HASH', updated_at = CURRENT_TIMESTAMP
  WHERE user_id = '$USER_ID';
"

echo "-> Subscribing to newsletter..."
psql "$AI_AGENT_NEON_DB_URL" <<SQL
INSERT INTO newsletter_subscribers (user_id, email, unsubscribed, created_at, updated_at)
VALUES ('$USER_ID', '$EMAIL', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (user_id, email) DO UPDATE SET
  unsubscribed = false,
  updated_at = CURRENT_TIMESTAMP;
SQL

echo "-> Fetching profile via API..."
curl -sS https://gamblecodez.com/api/profile \
  -H "x-user-id: $USER_ID" | jq . || curl -sS https://gamblecodez.com/api/profile -H "x-user-id: $USER_ID"

echo "=== DONE: Degen profile bootstrapped for $USER_ID ==="
