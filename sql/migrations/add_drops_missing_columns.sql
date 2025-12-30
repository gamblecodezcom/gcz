-- ============================================================
-- DROPS ECOSYSTEM — MISSING COLUMNS MIGRATION
-- Adds columns that the code expects but schema doesn't have
-- ============================================================

-- ------------------------------------------------------------
-- raw_drops - Add missing columns
-- ------------------------------------------------------------
ALTER TABLE raw_drops ADD COLUMN IF NOT EXISTS source_channel_id TEXT;
ALTER TABLE raw_drops ADD COLUMN IF NOT EXISTS source_user_id TEXT;
ALTER TABLE raw_drops ADD COLUMN IF NOT EXISTS source_username TEXT;
ALTER TABLE raw_drops ADD COLUMN IF NOT EXISTS raw_urls TEXT[];
ALTER TABLE raw_drops ADD COLUMN IF NOT EXISTS bonus_code_candidates TEXT[];
ALTER TABLE raw_drops ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE raw_drops ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Update status constraint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'raw_drops_status_check') THEN
    ALTER TABLE raw_drops
      ADD CONSTRAINT raw_drops_status_check
      CHECK (status IN ('pending', 'processing', 'classified', 'error', 'skipped'));
  END IF;
END $$;

-- ------------------------------------------------------------
-- ai_classification_snapshots - Add missing columns
-- ------------------------------------------------------------
ALTER TABLE ai_classification_snapshots ADD COLUMN IF NOT EXISTS is_promo BOOLEAN;
ALTER TABLE ai_classification_snapshots ADD COLUMN IF NOT EXISTS confidence_score NUMERIC;
ALTER TABLE ai_classification_snapshots ADD COLUMN IF NOT EXISTS extracted_codes TEXT[];
ALTER TABLE ai_classification_snapshots ADD COLUMN IF NOT EXISTS extracted_urls TEXT[];
ALTER TABLE ai_classification_snapshots ADD COLUMN IF NOT EXISTS resolved_domains TEXT[];
ALTER TABLE ai_classification_snapshots ADD COLUMN IF NOT EXISTS guessed_casino TEXT;
ALTER TABLE ai_classification_snapshots ADD COLUMN IF NOT EXISTS guessed_jurisdiction TEXT;
ALTER TABLE ai_classification_snapshots ADD COLUMN IF NOT EXISTS proposed_headline TEXT;
ALTER TABLE ai_classification_snapshots ADD COLUMN IF NOT EXISTS proposed_description TEXT;
ALTER TABLE ai_classification_snapshots ADD COLUMN IF NOT EXISTS validity_score NUMERIC;
ALTER TABLE ai_classification_snapshots ADD COLUMN IF NOT EXISTS is_spam BOOLEAN DEFAULT false;
ALTER TABLE ai_classification_snapshots ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN DEFAULT false;
ALTER TABLE ai_classification_snapshots ADD COLUMN IF NOT EXISTS duplicate_of_raw_drop_id BIGINT;

-- ------------------------------------------------------------
-- promo_candidates - Add missing columns
-- ------------------------------------------------------------
ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS ai_snapshot_id BIGINT;
ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS promo_type TEXT;
ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS bonus_code TEXT;
ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS promo_url TEXT;
ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS resolved_domain TEXT;
ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS mapped_casino_id INTEGER;
ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS jurisdiction_tags TEXT[];
ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS validity_score NUMERIC;
ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS is_spam BOOLEAN DEFAULT false;
ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN DEFAULT false;
ALTER TABLE promo_candidates ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Update status constraint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promo_candidates_status_check') THEN
    ALTER TABLE promo_candidates
      ADD CONSTRAINT promo_candidates_status_check
      CHECK (status IN ('pending', 'approved', 'denied', 'non_promo'));
  END IF;
END $$;

-- Update promo_type constraint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promo_candidates_promo_type_check') THEN
    ALTER TABLE promo_candidates
      ADD CONSTRAINT promo_candidates_promo_type_check
      CHECK (promo_type IS NULL OR promo_type IN ('code', 'url', 'hybrid', 'info_only'));
  END IF;
END $$;

-- Add foreign key for ai_snapshot_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promo_candidates_ai_snapshot_fk') THEN
    ALTER TABLE promo_candidates
      ADD CONSTRAINT promo_candidates_ai_snapshot_fk
      FOREIGN KEY (ai_snapshot_id) REFERENCES ai_classification_snapshots(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add foreign key for mapped_casino_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'promo_candidates_mapped_casino_fk') THEN
    ALTER TABLE promo_candidates
      ADD CONSTRAINT promo_candidates_mapped_casino_fk
      FOREIGN KEY (mapped_casino_id) REFERENCES affiliates_master(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ------------------------------------------------------------
-- drop_promos - Add missing columns
-- ------------------------------------------------------------
ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS source_raw_drop_id BIGINT;
ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS source_promo_candidate_id BIGINT;
ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS promo_type TEXT;
ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS bonus_code TEXT;
ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS promo_url TEXT;
ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS resolved_domain TEXT;
ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS mapped_casino_id INTEGER;
ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS jurisdiction_tags TEXT[];
ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS quick_signup_url TEXT;
ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS validity_flags JSONB DEFAULT '{}'::JSONB;
ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS audit_trail JSONB DEFAULT '[]'::JSONB;
ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;
ALTER TABLE drop_promos ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Update status constraint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'drop_promos_status_check') THEN
    ALTER TABLE drop_promos
      ADD CONSTRAINT drop_promos_status_check
      CHECK (status IN ('active', 'inactive', 'expired', 'archived'));
  END IF;
END $$;

-- Update promo_type constraint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'drop_promos_promo_type_check') THEN
    ALTER TABLE drop_promos
      ADD CONSTRAINT drop_promos_promo_type_check
      CHECK (promo_type IS NULL OR promo_type IN ('code', 'url', 'hybrid', 'info_only'));
  END IF;
END $$;

-- Add foreign key for mapped_casino_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'drop_promos_mapped_casino_fk') THEN
    ALTER TABLE drop_promos
      ADD CONSTRAINT drop_promos_mapped_casino_fk
      FOREIGN KEY (mapped_casino_id) REFERENCES affiliates_master(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ------------------------------------------------------------
-- drop_user_reports - Add missing columns
-- ------------------------------------------------------------
ALTER TABLE drop_user_reports ADD COLUMN IF NOT EXISTS report_type TEXT;
ALTER TABLE drop_user_reports ADD COLUMN IF NOT EXISTS report_text TEXT;

-- Update report_type constraint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'drop_user_reports_type_check') THEN
    ALTER TABLE drop_user_reports
      ADD CONSTRAINT drop_user_reports_type_check
      CHECK (report_type IS NULL OR report_type IN ('invalid_promo', 'spam', 'duplicate', 'expired', 'other'));
  END IF;
END $$;

-- ------------------------------------------------------------
-- drop_admin_actions - Fix column names
-- ------------------------------------------------------------
ALTER TABLE drop_admin_actions ADD COLUMN IF NOT EXISTS resource_type TEXT;
ALTER TABLE drop_admin_actions ADD COLUMN IF NOT EXISTS resource_id BIGINT;
ALTER TABLE drop_admin_actions ADD COLUMN IF NOT EXISTS changes JSONB DEFAULT '{}'::JSONB;
ALTER TABLE drop_admin_actions ADD COLUMN IF NOT EXISTS reason TEXT;

-- Update target_type to resource_type if needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drop_admin_actions' AND column_name = 'target_type') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drop_admin_actions' AND column_name = 'resource_type') THEN
      ALTER TABLE drop_admin_actions RENAME COLUMN target_type TO resource_type;
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drop_admin_actions' AND column_name = 'target_id') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drop_admin_actions' AND column_name = 'resource_id') THEN
      ALTER TABLE drop_admin_actions RENAME COLUMN target_id TO resource_id;
    END IF;
  END IF;
END $$;

-- ------------------------------------------------------------
-- INDEXES for new columns
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_raw_drops_status ON raw_drops(status);
CREATE INDEX IF NOT EXISTS idx_raw_drops_source_user_id ON raw_drops(source_user_id);
CREATE INDEX IF NOT EXISTS idx_promo_candidates_status ON promo_candidates(status);
CREATE INDEX IF NOT EXISTS idx_promo_candidates_ai_snapshot_id ON promo_candidates(ai_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_promo_candidates_mapped_casino_id ON promo_candidates(mapped_casino_id);
CREATE INDEX IF NOT EXISTS idx_drop_promos_status ON drop_promos(status);
CREATE INDEX IF NOT EXISTS idx_drop_promos_mapped_casino_id ON drop_promos(mapped_casino_id);
CREATE INDEX IF NOT EXISTS idx_drop_promos_featured ON drop_promos(featured);
CREATE INDEX IF NOT EXISTS idx_drop_promos_expires_at ON drop_promos(expires_at);
CREATE INDEX IF NOT EXISTS idx_drop_promos_jurisdiction_tags ON drop_promos USING GIN(jurisdiction_tags);

-- ------------------------------------------------------------
-- Update existing data defaults
-- ------------------------------------------------------------
UPDATE raw_drops SET status = 'pending' WHERE status IS NULL;
UPDATE promo_candidates SET status = 'pending' WHERE status IS NULL;
UPDATE drop_promos SET status = 'active' WHERE status IS NULL;
UPDATE drop_promos SET featured = false WHERE featured IS NULL;
UPDATE drop_promos SET view_count = 0 WHERE view_count IS NULL;
UPDATE drop_promos SET click_count = 0 WHERE click_count IS NULL;
UPDATE drop_promos SET validity_flags = '{}'::jsonb WHERE validity_flags IS NULL;
UPDATE drop_promos SET audit_trail = '[]'::jsonb WHERE audit_trail IS NULL;
