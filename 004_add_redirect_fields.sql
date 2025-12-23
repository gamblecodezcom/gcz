-- Migration: Add redirect and icon fields to affiliates table
-- Run this migration to add slug, final_redirect_url, and icon_url fields
-- PostgreSQL version

-- Add slug column (unique, for redirect URLs)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='affiliates' AND column_name='slug') THEN
    ALTER TABLE affiliates ADD COLUMN slug VARCHAR(190);
    CREATE UNIQUE INDEX idx_affiliates_slug ON affiliates(slug);
  END IF;
END $$;

-- Add final_redirect_url column (canonical URL for redirects)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='affiliates' AND column_name='final_redirect_url') THEN
    ALTER TABLE affiliates ADD COLUMN final_redirect_url VARCHAR(500);
  END IF;
END $$;

-- Add icon_url column (for favicon/icon display)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='affiliates' AND column_name='icon_url') THEN
    ALTER TABLE affiliates ADD COLUMN icon_url VARCHAR(500);
  END IF;
END $$;

-- Create index on slug for fast lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_affiliates_slug ON affiliates(slug);

-- Generate slugs for existing affiliates based on handle or name
-- This is a one-time update for existing data
UPDATE affiliates 
SET slug = LOWER(REGEXP_REPLACE(
  COALESCE(handle, name),
  '[^a-z0-9]+', '-', 'g'
))
WHERE slug IS NULL OR slug = '';

-- Set final_redirect_url to referral_url for existing affiliates if not set
UPDATE affiliates 
SET final_redirect_url = referral_url 
WHERE final_redirect_url IS NULL AND referral_url IS NOT NULL;

-- Note: Icon URL generation is handled by the Node.js script (scripts/generate_icon_urls.js)
-- Run that script after this migration to populate icon_urls for existing affiliates
