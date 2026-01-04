-- ============================================================
--  GCZ START GIVEAWAY MIGRATION
--  Minimal, additive-only, Neon-safe
--  Extends raffle_winners to support:
--    - Cwallet tip
--    - Cwallet claim URL (unique per winner)
--    - Crypto payouts
--    - Status tracking
--    - Admin notes
-- ============================================================

-- Add user_id (TEXT) to link winner to your external user system
ALTER TABLE raffle_winners
    ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Add asset type (USDT, BTC, SOL, SC, etc.)
ALTER TABLE raffle_winners
    ADD COLUMN IF NOT EXISTS asset TEXT;

-- Add amount of the prize
ALTER TABLE raffle_winners
    ADD COLUMN IF NOT EXISTS amount NUMERIC;

-- Delivery method:
--   'cwallet_tip'  → admin sends tip manually
--   'cwallet_url'  → admin provides unique claim URL per winner
--   'on_chain'     → admin sends crypto manually
ALTER TABLE raffle_winners
    ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'cwallet_tip';

-- Status tracking:
--   'logged'     → winner selected
--   'pending'    → admin preparing payout
--   'completed'  → payout done
ALTER TABLE raffle_winners
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'logged';

-- Optional transaction hash or payout reference
ALTER TABLE raffle_winners
    ADD COLUMN IF NOT EXISTS tx_hash TEXT;

-- Admin notes (optional)
ALTER TABLE raffle_winners
    ADD COLUMN IF NOT EXISTS note TEXT;

-- Winner's Cwallet ID (if applicable)
ALTER TABLE raffle_winners
    ADD COLUMN IF NOT EXISTS cwallet_id TEXT;

-- Unique claim URL (already exists, but ensure it's present)
ALTER TABLE raffle_winners
    ADD COLUMN IF NOT EXISTS cwallet_claim_url TEXT;

-- Timestamp for updates
ALTER TABLE raffle_winners
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_raffle_winners_user_id
    ON raffle_winners (user_id);

CREATE INDEX IF NOT EXISTS idx_raffle_winners_status
    ON raffle_winners (status);

CREATE INDEX IF NOT EXISTS idx_raffle_winners_cwallet_id
    ON raffle_winners (cwallet_id);

CREATE INDEX IF NOT EXISTS idx_raffle_winners_asset
    ON raffle_winners (asset);

-- Status constraint (optional, safe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'raffle_winners_status_check'
    ) THEN
        ALTER TABLE raffle_winners
            ADD CONSTRAINT raffle_winners_status_check
            CHECK (status = ANY (ARRAY['logged', 'pending', 'completed']));
    END IF;
END $$;