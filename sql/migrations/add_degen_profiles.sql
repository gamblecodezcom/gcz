-- ============================================================
-- ADD DEGEN PROFILE COLUMNS TO EXISTING USERS TABLE
-- ============================================================

-- Add icon columns to users table (if they don't exist)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS icon_url TEXT,
ADD COLUMN IF NOT EXISTS icon_style TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS icon_fallback TEXT;

-- ============================================================
-- CRYPTO ADDRESSES TABLE (uses user_id, not cwallet_id)
-- ============================================================

CREATE TABLE IF NOT EXISTS crypto_addresses (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    btc_address TEXT,
    eth_address TEXT,
    sol_address TEXT,
    usdt_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_crypto_addresses_user_id ON crypto_addresses(user_id);

-- ============================================================
-- NOTE: linked_casino_accounts already exists in add_reward_tables.sql
-- as user_linked_sites with user_id. No need to create it again.
-- ============================================================

-- ============================================================
-- NOTE: activity_log already exists in add_reward_tables.sql
-- with user_id. No need to create degen_activity_log.
-- ============================================================