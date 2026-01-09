-- ==========================================================
-- Migration: Add Display Fields to Promos Table
-- Date: 2026-01-09
-- Purpose: Add fields required for Drops Live Dashboard
-- ==========================================================

-- Add canonical display fields for promos
-- These fields are used by drops_intake.py and live_dashboard.py

-- Casino/Site information
ALTER TABLE promos
  ADD COLUMN IF NOT EXISTS casino_name TEXT,
  ADD COLUMN IF NOT EXISTS site TEXT;

-- Affiliate URL (direct link, not just ID)
ALTER TABLE promos
  ADD COLUMN IF NOT EXISTS affiliate_url TEXT;

-- Title and description
ALTER TABLE promos
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Expiry date
ALTER TABLE promos
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS expiry TEXT;

-- Tags for categorization
ALTER TABLE promos
  ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Metadata JSON for flexible extension
ALTER TABLE promos
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Promo-specific fields (code and URL)
ALTER TABLE promos
  ADD COLUMN IF NOT EXISTS bonus_code TEXT,
  ADD COLUMN IF NOT EXISTS code TEXT,
  ADD COLUMN IF NOT EXISTS promo_url TEXT,
  ADD COLUMN IF NOT EXISTS url TEXT;

-- Source channel metadata
ALTER TABLE promos
  ADD COLUMN IF NOT EXISTS source_channel_id TEXT,
  ADD COLUMN IF NOT EXISTS source_user_id TEXT,
  ADD COLUMN IF NOT EXISTS source_username TEXT;

-- Type field (for legacy compatibility)
ALTER TABLE promos
  ADD COLUMN IF NOT EXISTS type TEXT;

-- Active flag (for legacy compatibility with promos_service.py)
ALTER TABLE promos
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_promos_casino_name ON promos(casino_name);
CREATE INDEX IF NOT EXISTS idx_promos_expires_at ON promos(expires_at);
CREATE INDEX IF NOT EXISTS idx_promos_type ON promos(type);
CREATE INDEX IF NOT EXISTS idx_promos_active ON promos(active);
CREATE INDEX IF NOT EXISTS idx_promos_tags ON promos USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_promos_metadata ON promos USING gin(metadata);

-- Update channel constraint to be more flexible
ALTER TABLE promos DROP CONSTRAINT IF EXISTS promos_channel_check;
ALTER TABLE promos
  ADD CONSTRAINT promos_channel_check
  CHECK (channel IN ('links', 'link', 'codes', 'code', 'url'));

-- Update status constraint to include archived
ALTER TABLE promos DROP CONSTRAINT IF EXISTS promos_status_check;
ALTER TABLE promos
  ADD CONSTRAINT promos_status_check
  CHECK (status IN ('pending', 'approved', 'denied', 'archived'));

-- Comments for documentation
COMMENT ON COLUMN promos.casino_name IS 'Casino/site name for display';
COMMENT ON COLUMN promos.affiliate_url IS 'Direct affiliate URL (not just ID)';
COMMENT ON COLUMN promos.title IS 'Promo title/headline for display';
COMMENT ON COLUMN promos.description IS 'Full promo description';
COMMENT ON COLUMN promos.expires_at IS 'Expiry timestamp (structured)';
COMMENT ON COLUMN promos.expiry IS 'Expiry date (text/flexible format)';
COMMENT ON COLUMN promos.tags IS 'Array of tags for categorization';
COMMENT ON COLUMN promos.metadata IS 'Flexible JSONB metadata';
COMMENT ON COLUMN promos.bonus_code IS 'Bonus code if type=code';
COMMENT ON COLUMN promos.promo_url IS 'Promo URL if type=url/link';
COMMENT ON COLUMN promos.active IS 'Whether promo is active (legacy field)';
