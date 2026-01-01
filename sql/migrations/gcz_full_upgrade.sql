-- ============================================================
-- AFFILIATES_MASTER PRIMARY KEY REPAIR
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='affiliates_master' AND column_name='id_new'
    ) THEN
        ALTER TABLE affiliates_master ADD COLUMN id_new SERIAL;
    END IF;
END$$;

UPDATE affiliates_master SET id_new = DEFAULT WHERE id_new IS NULL;

ALTER TABLE daily_drops        DROP CONSTRAINT IF EXISTS daily_drops_affiliate_id_fkey;
ALTER TABLE raffles            DROP CONSTRAINT IF EXISTS raffles_prize_site_id_fkey;
ALTER TABLE promos             DROP CONSTRAINT IF EXISTS promos_affiliate_id_fkey;
ALTER TABLE promo_decisions    DROP CONSTRAINT IF EXISTS promo_decisions_affiliate_id_fkey;
ALTER TABLE raw_drops          DROP CONSTRAINT IF EXISTS raw_drops_affiliate_id_fkey;
ALTER TABLE raw_drops          DROP CONSTRAINT IF EXISTS raw_drops_affiliate_fk;
ALTER TABLE promo_candidates   DROP CONSTRAINT IF EXISTS promo_candidates_affiliate_id_fkey;
ALTER TABLE promo_candidates   DROP CONSTRAINT IF EXISTS promo_candidates_affiliate_fk;
ALTER TABLE promo_candidates   DROP CONSTRAINT IF EXISTS promo_candidates_mapped_casino_fk;
ALTER TABLE drop_promos        DROP CONSTRAINT IF EXISTS drop_promos_affiliate_id_fkey;
ALTER TABLE drop_promos        DROP CONSTRAINT IF EXISTS drop_promos_affiliate_fk;
ALTER TABLE drop_promos        DROP CONSTRAINT IF EXISTS drop_promos_mapped_casino_fk;
ALTER TABLE drop_ai_learning   DROP CONSTRAINT IF EXISTS drop_ai_learning_affiliate_id_fkey;
ALTER TABLE drop_ai_learning   DROP CONSTRAINT IF EXISTS drop_ai_learning_affiliate_fk;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='affiliates_master' AND column_name='id'
    ) THEN
        ALTER TABLE affiliates_master DROP COLUMN id;
    END IF;
END$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='affiliates_master' AND column_name='id_new'
    ) THEN
        ALTER TABLE affiliates_master RENAME COLUMN id_new TO id;
    END IF;
END$$;

ALTER TABLE affiliates_master
    ADD CONSTRAINT affiliates_master_pkey PRIMARY KEY (id);

ALTER TABLE daily_drops
    ADD CONSTRAINT daily_drops_affiliate_id_fkey
    FOREIGN KEY (affiliate_id) REFERENCES affiliates_master(id);

ALTER TABLE raffles
    ADD CONSTRAINT raffles_prize_site_id_fkey
    FOREIGN KEY (prize_site_id) REFERENCES affiliates_master(id);

ALTER TABLE promos
    ADD CONSTRAINT promos_affiliate_id_fkey
    FOREIGN KEY (affiliate_id) REFERENCES affiliates_master(id);

ALTER TABLE promo_decisions
    ADD CONSTRAINT promo_decisions_affiliate_id_fkey
    FOREIGN KEY (affiliate_id) REFERENCES affiliates_master(id);

ALTER TABLE raw_drops
    ADD CONSTRAINT raw_drops_affiliate_id_fkey
    FOREIGN KEY (affiliate_id) REFERENCES affiliates_master(id);

ALTER TABLE promo_candidates
    ADD CONSTRAINT promo_candidates_affiliate_id_fkey
    FOREIGN KEY (affiliate_id) REFERENCES affiliates_master(id);

ALTER TABLE promo_candidates
    ADD CONSTRAINT promo_candidates_mapped_casino_fk
    FOREIGN KEY (mapped_casino) REFERENCES affiliates_master(id);

ALTER TABLE drop_promos
    ADD CONSTRAINT drop_promos_affiliate_id_fkey
    FOREIGN KEY (affiliate_id) REFERENCES affiliates_master(id);

ALTER TABLE drop_promos
    ADD CONSTRAINT drop_promos_mapped_casino_fk
    FOREIGN KEY (mapped_casino) REFERENCES affiliates_master(id);

ALTER TABLE drop_ai_learning
    ADD CONSTRAINT drop_ai_learning_affiliate_id_fkey
    FOREIGN KEY (affiliate_id) REFERENCES affiliates_master(id);

-- ============================================================
-- RAFFLE SCHEMA FINALIZATION
-- ============================================================

CREATE TABLE IF NOT EXISTS raffles (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    hidden BOOLEAN DEFAULT FALSE,
    secret BOOLEAN DEFAULT FALSE,
    secret_code TEXT,
    raffle_type TEXT DEFAULT 'manual',
    num_winners INTEGER DEFAULT 1,
    allow_repeat_winners BOOLEAN DEFAULT FALSE,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    prize_type TEXT,
    prize_value TEXT,
    prize_site_id INTEGER,
    sponsor_site TEXT,
    sponsor_campaign_id INTEGER,
    entry_sources JSONB DEFAULT '["daily_checkin","wheel","secret_code","manual"]'::jsonb,
    entries_per_source JSONB DEFAULT '{"wheel":5,"manual":0,"secret_code":10,"daily_checkin":1}'::jsonb,
    winner_selection_method TEXT DEFAULT 'random',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raffle_entries (
    id SERIAL PRIMARY KEY,
    raffle_id INTEGER NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    source TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raffle_winners (
    id SERIAL PRIMARY KEY,
    raffle_id INTEGER NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    prize_type TEXT,
    cwallet_claim_url TEXT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raffle_prize_urls (
    id SERIAL PRIMARY KEY,
    raffle_id INTEGER NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    assigned_to_user_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS endless_raffle_links (
    id SERIAL PRIMARY KEY,
    raffle_id INTEGER NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
    next_raffle_id INTEGER REFERENCES raffles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS raffle_admin_actions (
    id SERIAL PRIMARY KEY,
    raffle_id INTEGER,
    admin_user TEXT NOT NULL,
    action_type TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_raffle_entries_raffle_id ON raffle_entries(raffle_id);
CREATE INDEX IF NOT EXISTS idx_raffle_entries_user_id ON raffle_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_raffle_entries_source ON raffle_entries(source);
CREATE INDEX IF NOT EXISTS idx_raffle_entries_created_at ON raffle_entries(created_at);

CREATE INDEX IF NOT EXISTS idx_raffle_winners_raffle_id ON raffle_winners(raffle_id);
CREATE INDEX IF NOT EXISTS idx_raffle_winners_user_id ON raffle_winners(user_id);

-- ============================================================
-- REWARD TABLES
-- ============================================================

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

-- ============================================================
-- ENDLESS RAFFLE INITIALIZER
-- ============================================================

DO $$
DECLARE
  endless_raffle_id INTEGER;
  existing_linked_id INTEGER;
BEGIN
  SELECT target_raffle_id INTO existing_linked_id
  FROM wheel_config
  WHERE id = 1 AND target_raffle_id IS NOT NULL;

  IF existing_linked_id IS NOT NULL THEN
    SELECT id INTO endless_raffle_id
    FROM raffles
    WHERE id = existing_linked_id AND active = TRUE;

    IF endless_raffle_id IS NOT NULL THEN
      UPDATE raffles
      SET end_date = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = endless_raffle_id;
    END IF;
  END IF;

  IF endless_raffle_id IS NULL THEN
    INSERT INTO raffles (
      title,
      description,
      prize_value,
      secret_code,
      start_date,
      end_date,
      active,
      secret,
      hidden,
      prize_type,
      raffle_type,
      entry_sources,
      entries_per_source
    ) VALUES (
      'Never-Ending Raffle',
      'Spin the wheel daily to earn entries! This raffle never ends and winners are drawn periodically.',
      'Mystery Crypto Box',
      NULL,
      CURRENT_TIMESTAMP,
      NULL,
      TRUE,
      FALSE,
      FALSE,
      'crypto_box',
      'manual',
      '["daily_checkin","wheel","secret_code","manual"]'::jsonb,
      '{"wheel":5,"manual":0,"secret_code":10,"daily_checkin":1}'::jsonb
    )
    RETURNING id INTO endless_raffle_id;
  END IF;

  UPDATE wheel_config
  SET target_raffle_id = endless_raffle_id,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = 1
    AND (target_raffle_id IS NULL OR target_raffle_id != endless_raffle_id);
END $$;