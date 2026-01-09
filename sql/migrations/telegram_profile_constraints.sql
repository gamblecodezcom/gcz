-- ==========================================================
-- Enforce 1:1 mapping between Degen profiles, Telegram, and Cwallet
-- ==========================================================

CREATE UNIQUE INDEX IF NOT EXISTS uniq_users_telegram_id
  ON users (telegram_id);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_users_cwallet_id
  ON users (cwallet_id);
