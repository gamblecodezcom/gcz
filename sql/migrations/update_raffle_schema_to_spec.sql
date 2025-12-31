-- ============================================================
-- UPDATE RAFFLE SCHEMA TO MATCH EXACT SPEC
-- This migration updates the raffle tables to match the exact specification
-- All changes are idempotent using IF NOT EXISTS / IF EXISTS checks
-- ============================================================

-- 1. Update raffle_entries table
-- Change entry_source to source, remove UNIQUE constraint, add created_at

-- First, drop the unique constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'raffle_entries_raffle_id_user_id_key'
  ) THEN
    ALTER TABLE raffle_entries DROP CONSTRAINT raffle_entries_raffle_id_user_id_key;
  END IF;
END $$;

-- Rename entry_source to source if it exists and source doesn't
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'raffle_entries' AND column_name = 'entry_source'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'raffle_entries' AND column_name = 'source'
  ) THEN
    ALTER TABLE raffle_entries RENAME COLUMN entry_source TO source;
  END IF;
END $$;

-- Rename entry_time to created_at if it exists and created_at doesn't
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'raffle_entries' AND column_name = 'entry_time'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'raffle_entries' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE raffle_entries RENAME COLUMN entry_time TO created_at;
  END IF;
END $$;

-- Add created_at if it doesn't exist
ALTER TABLE raffle_entries 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update created_at default for existing rows if needed
UPDATE raffle_entries 
SET created_at = COALESCE(created_at, CURRENT_TIMESTAMP) 
WHERE created_at IS NULL;

-- 2. Update raffle_winners table
-- Change winner to user_id, add prize_type, cwallet_claim_url, change won_at to assigned_at

-- Rename winner to user_id if it exists and user_id doesn't
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'raffle_winners' AND column_name = 'winner'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'raffle_winners' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE raffle_winners RENAME COLUMN winner TO user_id;
  END IF;
END $$;

-- Rename won_at to assigned_at if it exists and assigned_at doesn't
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'raffle_winners' AND column_name = 'won_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'raffle_winners' AND column_name = 'assigned_at'
  ) THEN
    ALTER TABLE raffle_winners RENAME COLUMN won_at TO assigned_at;
  END IF;
END $$;

-- Add prize_type if it doesn't exist
ALTER TABLE raffle_winners 
  ADD COLUMN IF NOT EXISTS prize_type TEXT;

-- Add cwallet_claim_url if it doesn't exist
ALTER TABLE raffle_winners 
  ADD COLUMN IF NOT EXISTS cwallet_claim_url TEXT;

-- Add assigned_at if it doesn't exist
ALTER TABLE raffle_winners 
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update assigned_at default for existing rows if needed
UPDATE raffle_winners 
SET assigned_at = COALESCE(assigned_at, CURRENT_TIMESTAMP) 
WHERE assigned_at IS NULL;

-- Migrate prize data: if prize column exists and prize_type is NULL, try to extract from prize
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'raffle_winners' AND column_name = 'prize'
  ) THEN
    -- Try to set prize_type from prize value if it looks like a type
    UPDATE raffle_winners 
    SET prize_type = CASE 
      WHEN prize ILIKE '%crypto%' OR prize ILIKE '%box%' THEN 'crypto_box'
      WHEN prize ILIKE '%tip%' THEN 'manual_tip'
      ELSE 'custom'
    END
    WHERE prize_type IS NULL AND prize IS NOT NULL;
  END IF;
END $$;

-- 3. Create raffle_prize_urls table
CREATE TABLE IF NOT EXISTS raffle_prize_urls (
  id SERIAL PRIMARY KEY,
  raffle_id INTEGER NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  assigned_to_user_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for raffle_prize_urls
CREATE INDEX IF NOT EXISTS idx_raffle_prize_urls_raffle_id ON raffle_prize_urls(raffle_id);
CREATE INDEX IF NOT EXISTS idx_raffle_prize_urls_used ON raffle_prize_urls(used);
CREATE INDEX IF NOT EXISTS idx_raffle_prize_urls_assigned_to ON raffle_prize_urls(assigned_to_user_id);

-- 4. Ensure raffle_type default is 'manual' (per spec)
ALTER TABLE raffles 
  ALTER COLUMN raffle_type SET DEFAULT 'manual';

-- 5. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_raffle_entries_raffle_id ON raffle_entries(raffle_id);
CREATE INDEX IF NOT EXISTS idx_raffle_entries_user_id ON raffle_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_raffle_entries_source ON raffle_entries(source);
CREATE INDEX IF NOT EXISTS idx_raffle_entries_created_at ON raffle_entries(created_at);

CREATE INDEX IF NOT EXISTS idx_raffle_winners_raffle_id ON raffle_winners(raffle_id);
CREATE INDEX IF NOT EXISTS idx_raffle_winners_user_id ON raffle_winners(user_id);

-- 6. Update entry_sources default to match spec exactly
ALTER TABLE raffles 
  ALTER COLUMN entry_sources SET DEFAULT '["daily_checkin", "wheel", "secret_code", "manual"]'::jsonb;

-- 7. Update entries_per_source default to match spec exactly
ALTER TABLE raffles 
  ALTER COLUMN entries_per_source SET DEFAULT '{"wheel": 5, "manual": 0, "secret_code": 10, "daily_checkin": 1}'::jsonb;

-- Verify the changes
DO $$
BEGIN
  RAISE NOTICE 'Migration completed. Verifying schema...';
  
  -- Check raffle_entries
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'raffle_entries' AND column_name = 'source'
  ) THEN
    RAISE NOTICE '✓ raffle_entries.source exists';
  ELSE
    RAISE WARNING '✗ raffle_entries.source missing';
  END IF;
  
  -- Check raffle_winners
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'raffle_winners' AND column_name = 'user_id'
  ) THEN
    RAISE NOTICE '✓ raffle_winners.user_id exists';
  ELSE
    RAISE WARNING '✗ raffle_winners.user_id missing';
  END IF;
  
  -- Check raffle_prize_urls
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'raffle_prize_urls'
  ) THEN
    RAISE NOTICE '✓ raffle_prize_urls table exists';
  ELSE
    RAISE WARNING '✗ raffle_prize_urls table missing';
  END IF;
END $$;
