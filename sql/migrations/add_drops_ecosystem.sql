-- ============================================================
-- DROPS ECOSYSTEM — CLEAN MERGED MIGRATION (BLOCK 1)
-- Core tables + dependencies
-- ============================================================


-- ------------------------------------------------------------
-- affiliates_master (cleaned, idempotent)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS affiliates_master (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  affiliate_url TEXT,
  priority INTEGER DEFAULT 0,
  category TEXT,
  status TEXT,
  level INTEGER,
  date_added TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  bonus_code TEXT,
  bonus_description TEXT,
  icon_url TEXT,
  resolved_domain TEXT,
  redemption_speed TEXT,
  redemption_minimum TEXT,
  redemption_type TEXT
);

ALTER TABLE affiliates_master ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE affiliates_master ALTER COLUMN name SET NOT NULL;

ALTER TABLE affiliates_master ADD COLUMN IF NOT EXISTS affiliate_url TEXT;
ALTER TABLE affiliates_master ADD COLUMN IF NOT EXISTS priority INTEGER;
ALTER TABLE affiliates_master ALTER COLUMN priority SET DEFAULT 0;

ALTER TABLE affiliates_master ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE affiliates_master ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE affiliates_master ADD COLUMN IF NOT EXISTS level INTEGER;

ALTER TABLE affiliates_master ADD COLUMN IF NOT EXISTS date_added TIMESTAMPTZ;
ALTER TABLE affiliates_master ALTER COLUMN date_added SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE affiliates_master ADD COLUMN IF NOT EXISTS bonus_code TEXT;
ALTER TABLE affiliates_master ADD COLUMN IF NOT EXISTS bonus_description TEXT;
ALTER TABLE affiliates_master ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE affiliates_master ADD COLUMN IF NOT EXISTS resolved_domain TEXT;
ALTER TABLE affiliates_master ADD COLUMN IF NOT EXISTS redemption_speed TEXT;
ALTER TABLE affiliates_master ADD COLUMN IF NOT EXISTS redemption_minimum TEXT;
ALTER TABLE affiliates_master ADD COLUMN IF NOT EXISTS redemption_type TEXT;



-- ------------------------------------------------------------
-- user_notification_settings (with Drops columns)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_notification_settings (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,

  telegram_notifications BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,

  drops_enabled BOOLEAN DEFAULT true,
  drops_last_sent TIMESTAMPTZ,
  drops_frequency TEXT DEFAULT 'instant',
  drops_telegram BOOLEAN DEFAULT true,
  drops_email BOOLEAN DEFAULT false,
  drops_push BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE user_notification_settings ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE user_notification_settings ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE user_notification_settings ADD COLUMN IF NOT EXISTS telegram_notifications BOOLEAN;
ALTER TABLE user_notification_settings ALTER COLUMN telegram_notifications SET DEFAULT true;

ALTER TABLE user_notification_settings ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN;
ALTER TABLE user_notification_settings ALTER COLUMN email_notifications SET DEFAULT false;

ALTER TABLE user_notification_settings ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN;
ALTER TABLE user_notification_settings ALTER COLUMN push_notifications SET DEFAULT true;

ALTER TABLE user_notification_settings ADD COLUMN IF NOT EXISTS drops_enabled BOOLEAN;
ALTER TABLE user_notification_settings ALTER COLUMN drops_enabled SET DEFAULT true;

ALTER TABLE user_notification_settings ADD COLUMN IF NOT EXISTS drops_last_sent TIMESTAMPTZ;

ALTER TABLE user_notification_settings ADD COLUMN IF NOT EXISTS drops_frequency TEXT;
ALTER TABLE user_notification_settings ALTER COLUMN drops_frequency SET DEFAULT 'instant';

ALTER TABLE user_notification_settings ADD COLUMN IF NOT EXISTS drops_telegram BOOLEAN;
ALTER TABLE user_notification_settings ALTER COLUMN drops_telegram SET DEFAULT true;

ALTER TABLE user_notification_settings ADD COLUMN IF NOT EXISTS drops_email BOOLEAN;
ALTER TABLE user_notification_settings ALTER COLUMN drops_email SET DEFAULT false;

ALTER TABLE user_notification_settings ADD COLUMN IF NOT EXISTS drops_push BOOLEAN;
ALTER TABLE user_notification_settings ALTER COLUMN drops_push SET DEFAULT true;

ALTER TABLE user_notification_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE user_notification_settings ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE user_notification_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE user_notification_settings ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;



-- ------------------------------------------------------------
-- raw_drops
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS raw_drops (
  id BIGSERIAL PRIMARY KEY,

  source TEXT NOT NULL,
  source_message_id TEXT,
  source_channel TEXT,
  source_user TEXT,

  affiliate_id INTEGER REFERENCES affiliates_master(id),

  raw_text TEXT NOT NULL,
  detected_language TEXT,

  ingested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMPTZ,
  is_processed BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,

  jurisdiction_guess TEXT,
  casino_name_guess TEXT,

  meta JSONB DEFAULT '{}'::JSONB
);

ALTER TABLE raw_drops ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE raw_drops ALTER COLUMN source SET NOT NULL;

ALTER TABLE raw_drops ADD COLUMN IF NOT EXISTS source_message_id TEXT;
ALTER TABLE raw_drops ADD COLUMN IF NOT EXISTS source_channel TEXT;
ALTER TABLE raw_drops ADD COLUMN IF NOT EXISTS source_user TEXT;

ALTER TABLE raw_drops ADD COLUMN IF NOT EXISTS affiliate_id INTEGER;

ALTER TABLE raw_drops ADD COLUMN IF NOT EXISTS raw_text TEXT;
ALTER TABLE raw_drops ALTER COLUMN raw_text SET NOT NULL;

ALTER TABLE raw_drops ADD COLUMN IF NOT EXISTS detected_language TEXT;

ALTER TABLE raw_drops ADD COLUMN IF NOT EXISTS ingested_at TIMESTAMPTZ;
ALTER TABLE raw_drops ALTER COLUMN ingested_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE raw_drops ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

ALTER TABLE raw_drops ADD COLUMN IF NOT EXISTS is_processed BOOLEAN;
ALTER TABLE raw_drops ALTER COLUMN is_processed SET DEFAULT false;

ALTER TABLE raw_drops ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN;
ALTER TABLE raw_drops ALTER COLUMN is_hidden SET DEFAULT false;

ALTER TABLE raw_drops ADD COLUMN IF NOT EXISTS jurisdiction_guess TEXT;
ALTER TABLE raw_drops ADD COLUMN IF NOT EXISTS casino_name_guess TEXT;

ALTER TABLE raw_drops ADD COLUMN IF NOT EXISTS meta JSONB;
ALTER TABLE raw_drops ALTER COLUMN meta SET DEFAULT '{}'::JSONB;



-- ------------------------------------------------------------
-- ai_classification_snapshots
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_classification_snapshots (
  id BIGSERIAL PRIMARY KEY,

  raw_drop_id BIGINT NOT NULL REFERENCES raw_drops(id) ON DELETE CASCADE,

  model_name TEXT,
  model_version TEXT,

  run_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  label TEXT,
  score NUMERIC,

  details JSONB DEFAULT '{}'::JSONB
);

ALTER TABLE ai_classification_snapshots ADD COLUMN IF NOT EXISTS raw_drop_id BIGINT;
ALTER TABLE ai_classification_snapshots ADD COLUMN IF NOT EXISTS model_name TEXT;
ALTER TABLE ai_classification_snapshots ADD COLUMN IF NOT EXISTS model_version TEXT;

ALTER TABLE ai_classification_snapshots ADD COLUMN IF NOT EXISTS run_at TIMESTAMPTZ;
ALTER TABLE ai_classification_snapshots ALTER COLUMN run_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE ai_classification_snapshots ADD COLUMN IF NOT EXISTS label TEXT;
ALTER TABLE ai_classification_snapshots ADD COLUMN IF NOT EXISTS score NUMERIC;

ALTER TABLE ai_classification_snapshots ADD COLUMN IF NOT EXISTS details JSONB;
ALTER TABLE ai_classification_snapshots ALTER COLUMN details SET DEFAULT '{}'::JSONB;

-- ============================================================
-- DROPS ECOSYSTEM — CLEAN MERGED MIGRATION (BLOCK 2)
-- Mid-tier Drops tables
-- ============================================================


-- ------------------------------------------------------------
-- promo_candidates
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promo_candidates (
  id BIGSERIAL PRIMARY KEY,

  raw_drop_id BIGINT NOT NULL,
  classification_snapshot_id BIGINT,
  affiliate_id INTEGER,

  promo_code TEXT,
  promo_description TEXT,
  promo_url TEXT,
  jurisdiction TEXT,
  casino_name TEXT,

  confidence NUMERIC,
  ai_notes JSONB DEFAULT '{}'::JSONB,

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  is_valid BOOLEAN DEFAULT true,
  is_hidden BOOLEAN DEFAULT false
);

ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS raw_drop_id BIGINT;
ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS classification_snapshot_id BIGINT;
ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS affiliate_id INTEGER;

ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS promo_code TEXT;
ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS promo_description TEXT;
ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS promo_url TEXT;
ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS jurisdiction TEXT;
ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS casino_name TEXT;

ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS confidence NUMERIC;

ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS ai_notes JSONB;
ALTER TABLE promo_candidates ALTER COLUMN ai_notes SET DEFAULT '{}'::JSONB;

ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE promo_candidates ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE promo_candidates ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS is_valid BOOLEAN;
ALTER TABLE promo_candidates ALTER COLUMN is_valid SET DEFAULT true;

ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN;
ALTER TABLE promo_candidates ALTER COLUMN is_hidden SET DEFAULT false;



-- ------------------------------------------------------------
-- drop_promos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS drop_promos (
  id BIGSERIAL PRIMARY KEY,

  promo_candidate_id BIGINT NOT NULL,
  raw_drop_id BIGINT NOT NULL,
  affiliate_id INTEGER,

  promo_code TEXT,
  promo_description TEXT,
  promo_url TEXT,
  jurisdiction TEXT,
  casino_name TEXT,

  approved_at TIMESTAMPTZ,
  approved_by TEXT,

  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  ai_notes JSONB DEFAULT '{}'::JSONB
);

ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS promo_candidate_id BIGINT;
ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS raw_drop_id BIGINT;
ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS affiliate_id INTEGER;

ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS promo_code TEXT;
ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS promo_description TEXT;
ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS promo_url TEXT;
ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS jurisdiction TEXT;
ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS casino_name TEXT;

ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS approved_by TEXT;

ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS is_active BOOLEAN;
ALTER TABLE drop_promos ALTER COLUMN is_active SET DEFAULT true;

ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS is_featured BOOLEAN;
ALTER TABLE drop_promos ALTER COLUMN is_featured SET DEFAULT false;

ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE drop_promos ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE drop_promos ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS ai_notes JSONB;
ALTER TABLE drop_promos ALTER COLUMN ai_notes SET DEFAULT '{}'::JSONB;



-- ------------------------------------------------------------
-- drop_admin_actions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS drop_admin_actions (
  id BIGSERIAL PRIMARY KEY,

  admin_user TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id BIGINT NOT NULL,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE drop_admin_actions ADD COLUMN IF NOT EXISTS admin_user TEXT;
ALTER TABLE drop_admin_actions ALTER COLUMN admin_user SET NOT NULL;

ALTER TABLE drop_admin_actions ADD COLUMN IF NOT EXISTS action_type TEXT;
ALTER TABLE drop_admin_actions ALTER COLUMN action_type SET NOT NULL;

ALTER TABLE drop_admin_actions ADD COLUMN IF NOT EXISTS target_type TEXT;
ALTER TABLE drop_admin_actions ALTER COLUMN target_type SET NOT NULL;

ALTER TABLE drop_admin_actions ADD COLUMN IF NOT EXISTS target_id BIGINT;
ALTER TABLE drop_admin_actions ALTER COLUMN target_id SET NOT NULL;

ALTER TABLE drop_admin_actions ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE drop_admin_actions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE drop_admin_actions ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- ============================================================
-- DROPS ECOSYSTEM — CLEAN MERGED MIGRATION (BLOCK 3)
-- Dependent Drops tables
-- ============================================================


-- ------------------------------------------------------------
-- drop_ai_learning
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS drop_ai_learning (
  id BIGSERIAL PRIMARY KEY,

  raw_drop_id BIGINT NOT NULL,
  promo_candidate_id BIGINT,
  affiliate_id INTEGER,

  ai_label TEXT,
  admin_label TEXT,
  confidence NUMERIC,

  notes JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE drop_ai_learning ADD COLUMN IF NOT EXISTS raw_drop_id BIGINT;
ALTER TABLE drop_ai_learning ADD COLUMN IF NOT EXISTS promo_candidate_id BIGINT;
ALTER TABLE drop_ai_learning ADD COLUMN IF NOT EXISTS affiliate_id INTEGER;

ALTER TABLE drop_ai_learning ADD COLUMN IF NOT EXISTS ai_label TEXT;
ALTER TABLE drop_ai_learning ADD COLUMN IF NOT EXISTS admin_label TEXT;
ALTER TABLE drop_ai_learning ADD COLUMN IF NOT EXISTS confidence NUMERIC;

ALTER TABLE drop_ai_learning ADD COLUMN IF NOT EXISTS notes JSONB;
ALTER TABLE drop_ai_learning ALTER COLUMN notes SET DEFAULT '{}'::JSONB;

ALTER TABLE drop_ai_learning ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE drop_ai_learning ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;



-- ------------------------------------------------------------
-- drop_user_reports
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS drop_user_reports (
  id BIGSERIAL PRIMARY KEY,

  drop_promo_id BIGINT NOT NULL,
  user_id TEXT,
  report_type TEXT,
  report_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE drop_user_reports ADD COLUMN IF NOT EXISTS drop_promo_id BIGINT;
ALTER TABLE drop_user_reports ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE drop_user_reports ADD COLUMN IF NOT EXISTS report_type TEXT;
ALTER TABLE drop_user_reports ADD COLUMN IF NOT EXISTS report_notes TEXT;

ALTER TABLE drop_user_reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE drop_user_reports ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;



-- ------------------------------------------------------------
-- drop_notifications_sent
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS drop_notifications_sent (
  id BIGSERIAL PRIMARY KEY,

  drop_promo_id BIGINT NOT NULL,
  user_id TEXT NOT NULL,
  channel TEXT NOT NULL,

  sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  meta JSONB DEFAULT '{}'::JSONB
);

ALTER TABLE drop_notifications_sent ADD COLUMN IF NOT EXISTS drop_promo_id BIGINT;

ALTER TABLE drop_notifications_sent ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE drop_notifications_sent ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE drop_notifications_sent ADD COLUMN IF NOT EXISTS channel TEXT;
ALTER TABLE drop_notifications_sent ALTER COLUMN channel SET NOT NULL;

ALTER TABLE drop_notifications_sent ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;
ALTER TABLE drop_notifications_sent ALTER COLUMN sent_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE drop_notifications_sent ADD COLUMN IF NOT EXISTS meta JSONB;
ALTER TABLE drop_notifications_sent ALTER COLUMN meta SET DEFAULT '{}'::JSONB;

-- ============================================================
-- DROPS ECOSYSTEM — CLEAN MERGED MIGRATION (BLOCK 4)
-- Indexes, triggers, functions, constraints, JSONB hardening
-- ============================================================


-- ------------------------------------------------------------
-- INDEXES
-- ------------------------------------------------------------

-- raw_drops
CREATE INDEX IF NOT EXISTS idx_raw_drops_source ON raw_drops(source);
CREATE INDEX IF NOT EXISTS idx_raw_drops_affiliate_id ON raw_drops(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_raw_drops_ingested_at ON raw_drops(ingested_at);
CREATE INDEX IF NOT EXISTS idx_raw_drops_is_processed ON raw_drops(is_processed);

-- ai_classification_snapshots
CREATE INDEX IF NOT EXISTS idx_ai_snap_raw_drop_id ON ai_classification_snapshots(raw_drop_id);
CREATE INDEX IF NOT EXISTS idx_ai_snap_label ON ai_classification_snapshots(label);

-- promo_candidates
CREATE INDEX IF NOT EXISTS idx_promo_candidates_raw_drop_id ON promo_candidates(raw_drop_id);
CREATE INDEX IF NOT EXISTS idx_promo_candidates_affiliate_id ON promo_candidates(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_promo_candidates_is_valid ON promo_candidates(is_valid);

-- drop_promos
CREATE INDEX IF NOT EXISTS idx_drop_promos_candidate_id ON drop_promos(promo_candidate_id);
CREATE INDEX IF NOT EXISTS idx_drop_promos_affiliate_id ON drop_promos(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_drop_promos_is_active ON drop_promos(is_active);
CREATE INDEX IF NOT EXISTS idx_drop_promos_is_featured ON drop_promos(is_featured);

-- drop_admin_actions
CREATE INDEX IF NOT EXISTS idx_drop_admin_actions_target ON drop_admin_actions(target_type, target_id);

-- drop_ai_learning
CREATE INDEX IF NOT EXISTS idx_drop_ai_learning_raw_drop_id ON drop_ai_learning(raw_drop_id);
CREATE INDEX IF NOT EXISTS idx_drop_ai_learning_affiliate_id ON drop_ai_learning(affiliate_id);

-- drop_user_reports
CREATE INDEX IF NOT EXISTS idx_drop_user_reports_promo_id ON drop_user_reports(drop_promo_id);

-- drop_notifications_sent
CREATE INDEX IF NOT EXISTS idx_drop_notifications_sent_promo_id ON drop_notifications_sent(drop_promo_id);
CREATE INDEX IF NOT EXISTS idx_drop_notifications_sent_user_id ON drop_notifications_sent(user_id);



-- ------------------------------------------------------------
-- FUNCTIONS
-- ------------------------------------------------------------

DROP FUNCTION IF EXISTS update_timestamp CASCADE;

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;



-- ------------------------------------------------------------
-- TRIGGERS
-- ------------------------------------------------------------

-- promo_candidates.updated_at
DROP TRIGGER IF EXISTS trg_promo_candidates_updated_at ON promo_candidates;

CREATE TRIGGER trg_promo_candidates_updated_at
BEFORE UPDATE ON promo_candidates
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- drop_promos.updated_at
DROP TRIGGER IF EXISTS trg_drop_promos_updated_at ON drop_promos;

CREATE TRIGGER trg_drop_promos_updated_at
BEFORE UPDATE ON drop_promos
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- user_notification_settings.updated_at
DROP TRIGGER IF EXISTS trg_user_notification_settings_updated_at ON user_notification_settings;

CREATE TRIGGER trg_user_notification_settings_updated_at
BEFORE UPDATE ON user_notification_settings
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();



-- ------------------------------------------------------------
-- CONSTRAINTS (POSTGRES-SAFE DO BLOCKS)
-- ------------------------------------------------------------

-- raw_drops_affiliate_fk
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'raw_drops_affiliate_fk') THEN
    ALTER TABLE raw_drops
      ADD CONSTRAINT raw_drops_affiliate_fk
      FOREIGN KEY (affiliate_id) REFERENCES affiliates_master(id);
  END IF;
END $$;

-- ai_class_snap_raw_drop_fk
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ai_class_snap_raw_drop_fk') THEN
    ALTER TABLE ai_classification_snapshots
      ADD CONSTRAINT ai_class_snap_raw_drop_fk
      FOREIGN KEY (raw_drop_id) REFERENCES raw_drops(id) ON DELETE CASCADE;
  END IF;
END $$;

-- promo_candidates_raw_drop_fk
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promo_candidates_raw_drop_fk') THEN
    ALTER TABLE promo_candidates
      ADD CONSTRAINT promo_candidates_raw_drop_fk
      FOREIGN KEY (raw_drop_id) REFERENCES raw_drops(id) ON DELETE CASCADE;
  END IF;
END $$;

-- promo_candidates_snapshot_fk
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promo_candidates_snapshot_fk') THEN
    ALTER TABLE promo_candidates
      ADD CONSTRAINT promo_candidates_snapshot_fk
      FOREIGN KEY (classification_snapshot_id)
      REFERENCES ai_classification_snapshots(id) ON DELETE SET NULL;
  END IF;
END $$;

-- promo_candidates_affiliate_fk
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promo_candidates_affiliate_fk') THEN
    ALTER TABLE promo_candidates
      ADD CONSTRAINT promo_candidates_affiliate_fk
      FOREIGN KEY (affiliate_id) REFERENCES affiliates_master(id) ON DELETE SET NULL;
  END IF;
END $$;

-- drop_promos_candidate_fk
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'drop_promos_candidate_fk') THEN
    ALTER TABLE drop_promos
      ADD CONSTRAINT drop_promos_candidate_fk
      FOREIGN KEY (promo_candidate_id) REFERENCES promo_candidates(id) ON DELETE CASCADE;
  END IF;
END $$;

-- drop_promos_raw_drop_fk
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'drop_promos_raw_drop_fk') THEN
    ALTER TABLE drop_promos
      ADD CONSTRAINT drop_promos_raw_drop_fk
      FOREIGN KEY (raw_drop_id) REFERENCES raw_drops(id) ON DELETE CASCADE;
  END IF;
END $$;

-- drop_promos_affiliate_fk
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'drop_promos_affiliate_fk') THEN
    ALTER TABLE drop_promos
      ADD CONSTRAINT drop_promos_affiliate_fk
      FOREIGN KEY (affiliate_id) REFERENCES affiliates_master(id) ON DELETE SET NULL;
  END IF;
END $$;

-- drop_ai_learning_raw_drop_fk
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'drop_ai_learning_raw_drop_fk') THEN
    ALTER TABLE drop_ai_learning
      ADD CONSTRAINT drop_ai_learning_raw_drop_fk
      FOREIGN KEY (raw_drop_id) REFERENCES raw_drops(id) ON DELETE CASCADE;
  END IF;
END $$;

-- drop_ai_learning_candidate_fk
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'drop_ai_learning_candidate_fk') THEN
    ALTER TABLE drop_ai_learning
      ADD CONSTRAINT drop_ai_learning_candidate_fk
      FOREIGN KEY (promo_candidate_id) REFERENCES promo_candidates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- drop_ai_learning_affiliate_fk
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'drop_ai_learning_affiliate_fk') THEN
    ALTER TABLE drop_ai_learning
      ADD CONSTRAINT drop_ai_learning_affiliate_fk
      FOREIGN KEY (affiliate_id) REFERENCES affiliates_master(id) ON DELETE SET NULL;
  END IF;
END $$;

-- drop_user_reports_promo_fk
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'drop_user_reports_promo_fk') THEN
    ALTER TABLE drop_user_reports
      ADD CONSTRAINT drop_user_reports_promo_fk
      FOREIGN KEY (drop_promo_id) REFERENCES drop_promos(id) ON DELETE CASCADE;
  END IF;
END $$;

-- drop_notifications_sent_promo_fk
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'drop_notifications_sent_promo_fk') THEN
    ALTER TABLE drop_notifications_sent
      ADD CONSTRAINT drop_notifications_sent_promo_fk
      FOREIGN KEY (drop_promo_id) REFERENCES drop_promos(id) ON DELETE CASCADE;
  END IF;
END $$;



-- ------------------------------------------------------------
-- CHECK CONSTRAINTS
-- ------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promo_candidates_jurisdiction_check') THEN
    ALTER TABLE promo_candidates
      ADD CONSTRAINT promo_candidates_jurisdiction_check
      CHECK (jurisdiction IS NULL OR jurisdiction <> '');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'drop_promos_jurisdiction_check') THEN
    ALTER TABLE drop_promos
      ADD CONSTRAINT drop_promos_jurisdiction_check
      CHECK (jurisdiction IS NULL OR jurisdiction <> '');
  END IF;
END $$;



-- ------------------------------------------------------------
-- JSONB HARDENING
-- ------------------------------------------------------------

UPDATE promo_candidates SET ai_notes = '{}'::jsonb WHERE ai_notes IS NULL;
UPDATE drop_promos SET ai_notes = '{}'::jsonb WHERE ai_notes IS NULL;
UPDATE drop_ai_learning SET notes = '{}'::jsonb WHERE notes IS NULL;
UPDATE drop_notifications_sent SET meta = '{}'::jsonb WHERE meta IS NULL;
