-- ============================================================
-- REWARD TABLES MIGRATION
-- Creates tables for Runewager tips, crypto tips, lootbox rewards, and Telegram notifications
-- ============================================================

-- Runewager SC Tips
CREATE TABLE IF NOT EXISTS runewager_tips (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT,
  email TEXT,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'logged' CHECK (status IN ('logged', 'pending', 'completed')),
  note TEXT,
  admin_name TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_runewager_tips_user_id ON runewager_tips(user_id);
CREATE INDEX IF NOT EXISTS idx_runewager_tips_status ON runewager_tips(status);
CREATE INDEX IF NOT EXISTS idx_runewager_tips_created_at ON runewager_tips(created_at DESC);

-- Crypto Tips
CREATE TABLE IF NOT EXISTS crypto_tips (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  asset TEXT NOT NULL CHECK (asset IN ('BTC', 'ETH', 'SOL', 'USDT')),
  amount NUMERIC NOT NULL,
  delivery_method TEXT DEFAULT 'cwallet' CHECK (delivery_method IN ('cwallet', 'on_chain', 'telegram')),
  status TEXT DEFAULT 'logged' CHECK (status IN ('logged', 'pending', 'completed')),
  tx_hash TEXT,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crypto_tips_user_id ON crypto_tips(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_tips_status ON crypto_tips(status);
CREATE INDEX IF NOT EXISTS idx_crypto_tips_created_at ON crypto_tips(created_at DESC);

-- Lootbox Rewards
CREATE TABLE IF NOT EXISTS lootbox_rewards (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  site TEXT NOT NULL,
  prize_type TEXT NOT NULL,
  claim_url TEXT NOT NULL,
  status TEXT DEFAULT 'logged' CHECK (status IN ('logged', 'pending', 'claimed', 'expired')),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lootbox_rewards_user_id ON lootbox_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_lootbox_rewards_status ON lootbox_rewards(status);
CREATE INDEX IF NOT EXISTS idx_lootbox_rewards_created_at ON lootbox_rewards(created_at DESC);

-- Telegram Notifications
CREATE TABLE IF NOT EXISTS telegram_notifications (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  telegram_username TEXT,
  telegram_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('raffle_win', 'secret_code', 'claim_notification')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_telegram_notifications_user_id ON telegram_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_notifications_type ON telegram_notifications(type);
CREATE INDEX IF NOT EXISTS idx_telegram_notifications_sent_at ON telegram_notifications(sent_at DESC);

-- User Linked Sites (if it doesn't exist)
CREATE TABLE IF NOT EXISTS user_linked_sites (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('username', 'email', 'player_id')),
  identifier_value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, site_id)
);

CREATE INDEX IF NOT EXISTS idx_user_linked_sites_user_id ON user_linked_sites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_linked_sites_site_id ON user_linked_sites(site_id);

-- Activity Log (if it doesn't exist)
CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
