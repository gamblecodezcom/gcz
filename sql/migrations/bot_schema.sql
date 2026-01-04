-- ===========================================
-- GCZ UNIFIED BOT + ENGAGEMENT SCHEMA PATCH
-- NON‑DESTRUCTIVE, ADDITIVE ONLY
-- ===========================================

-- 1) AUTORESPONSES
CREATE TABLE IF NOT EXISTS autoresponses (
  id BIGSERIAL PRIMARY KEY,
  trigger TEXT NOT NULL UNIQUE,
  response TEXT NOT NULL,
  buttons JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) NOTIFICATION PROFILES
CREATE TABLE IF NOT EXISTS notification_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT,                -- optional internal user_id
  telegram_id BIGINT UNIQUE,     -- primary link for bot
  telegram_raffle_alerts BOOLEAN DEFAULT TRUE,
  telegram_giveaway_alerts BOOLEAN DEFAULT TRUE,
  telegram_secret_code_hints BOOLEAN DEFAULT FALSE,
  email_alerts BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) WHEEL HISTORY (if not already)
CREATE TABLE IF NOT EXISTS wheel_spins (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  result TEXT NOT NULL,
  reward_value NUMERIC(18, 2) DEFAULT 0,
  entries_added BIGINT DEFAULT 0,
  jackpot BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wheel_spins_telegram_id_idx
  ON wheel_spins (telegram_id);

-- 4) RAFFLES (core, if missing minimal structure)
CREATE TABLE IF NOT EXISTS raffles (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  prize_value TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS raffle_entries (
  id BIGSERIAL PRIMARY KEY,
  raffle_id BIGINT NOT NULL,
  telegram_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS raffle_entries_raffle_id_idx
  ON raffle_entries (raffle_id);

CREATE INDEX IF NOT EXISTS raffle_entries_telegram_id_idx
  ON raffle_entries (telegram_id);

-- 5) GIVEAWAYS (minimal)
CREATE TABLE IF NOT EXISTS giveaways (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  prize_value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS giveaway_entries (
  id BIGSERIAL PRIMARY KEY,
  giveaway_id BIGINT NOT NULL,
  telegram_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS giveaway_entries_giveaway_id_idx
  ON giveaway_entries (giveaway_id);

CREATE INDEX IF NOT EXISTS giveaway_entries_telegram_id_idx
  ON giveaway_entries (telegram_id);

-- 6) DROPS (minimal support for /drops features)
CREATE TABLE IF NOT EXISTS drops (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  site_code TEXT,
  bonus_type TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7) PROMOS
CREATE TABLE IF NOT EXISTS promos (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  site_code TEXT,
  url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8) USER PROGRESS (missions, stats, leaderboard)
CREATE TABLE IF NOT EXISTS users_progress (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  total_entries BIGINT DEFAULT 0,
  total_spins BIGINT DEFAULT 0,
  total_affiliate_clicks BIGINT DEFAULT 0,
  total_giveaway_entries BIGINT DEFAULT 0,
  total_giveaway_wins BIGINT DEFAULT 0,
  missions_completed BIGINT DEFAULT 0,
  streak_days INT DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (telegram_id)
);

CREATE INDEX IF NOT EXISTS users_progress_entries_idx
  ON users_progress (total_entries DESC, total_spins DESC);

-- 9) USER MISSIONS (daily missions)
CREATE TABLE IF NOT EXISTS user_missions (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  mission_date DATE NOT NULL,
  spin_completed BOOLEAN DEFAULT FALSE,
  raffle_entry_completed BOOLEAN DEFAULT FALSE,
  affiliate_visit_completed BOOLEAN DEFAULT FALSE,
  secret_code_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (telegram_id, mission_date)
);

-- 10) USER BADGES
CREATE TABLE IF NOT EXISTS user_badges (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  badge_code TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (telegram_id, badge_code)
);

CREATE INDEX IF NOT EXISTS user_badges_telegram_id_idx
  ON user_badges (telegram_id);

-- 11) GCZ POINTS (virtual currency)
CREATE TABLE IF NOT EXISTS user_points (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL UNIQUE,
  balance BIGINT DEFAULT 0,
  lifetime_earned BIGINT DEFAULT 0,
  lifetime_spent BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_points_ledger (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  delta BIGINT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_points_ledger_telegram_id_idx
  ON user_points_ledger (telegram_id);

-- 12) VIP SYSTEM
CREATE TABLE IF NOT EXISTS user_vip_levels (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL UNIQUE,
  vip_level TEXT NOT NULL DEFAULT 'BRONZE',
  vip_points BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13) SECRET CODES
CREATE TABLE IF NOT EXISTS secret_codes (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  max_uses INT,
  uses INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS secret_code_redemptions (
  id BIGSERIAL PRIMARY KEY,
  code_id BIGINT NOT NULL,
  telegram_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (code_id, telegram_id)
);

CREATE INDEX IF NOT EXISTS secret_code_redemptions_code_id_idx
  ON secret_code_redemptions (code_id);

-- 14) USER INBOX (unified notifications)
CREATE TABLE IF NOT EXISTS user_inbox (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  type TEXT NOT NULL,
  title TEXT,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_inbox_telegram_id_idx
  ON user_inbox (telegram_id);

-- 15) ADMIN LOGS
CREATE TABLE IF NOT EXISTS admin_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_telegram_id BIGINT,
  action TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16) SERVICE HEALTH LOGS (for watchdog/debugging)
CREATE TABLE IF NOT EXISTS service_health_logs (
  id BIGSERIAL PRIMARY KEY,
  service_name TEXT NOT NULL,
  status TEXT NOT NULL,  -- e.g. "UP", "DOWN", "RESTARTED"
  detail TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS service_health_logs_service_idx
  ON service_health_logs (service_name, created_at DESC);

-- 17) SIMPLE FK HINTS (OPTIONAL, ONLY IF USERS TABLE EXISTS)
-- These are written in a safe way: if "users" doesn't exist, they do nothing.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'users'
  ) THEN
    -- Example: link notification_profiles.user_id -> users.id (if columns match types)
    BEGIN
      ALTER TABLE notification_profiles
      ADD CONSTRAINT notification_profiles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id)
      ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN
      -- constraint already exists, ignore
      NULL;
    END;
  END IF;
END $$;