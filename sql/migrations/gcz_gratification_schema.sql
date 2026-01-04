-- ============================================================
--  GCZ Gratification Migration (Adaptive to Existing Schema)
--  - Does NOT drop or modify existing columns
--  - Only creates new tables and adds new columns where missing
-- ============================================================

-- ============================================================
--  1) SC BALANCE SYSTEM (per user)
--     Uses users.id as canonical PK, but keeps user_id TEXT for joins
-- ============================================================

CREATE TABLE IF NOT EXISTS user_balances (
    id          BIGSERIAL PRIMARY KEY,
    user_pk     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    user_id     TEXT,
    sc_balance  BIGINT NOT NULL DEFAULT 0,
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_balances_user_pk
    ON user_balances (user_pk);

CREATE INDEX IF NOT EXISTS idx_user_balances_user_id
    ON user_balances (user_id);

CREATE INDEX IF NOT EXISTS idx_user_balances_sc_balance
    ON user_balances (sc_balance);


CREATE TABLE IF NOT EXISTS balance_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_pk     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    user_id     TEXT,
    change_sc   BIGINT NOT NULL,
    reason      TEXT NOT NULL,      -- 'raffle_entry', 'admin_adjust', 'drop', etc.
    meta        JSONB,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_balance_logs_user_pk_created
    ON balance_logs (user_pk, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_balance_logs_user_id_created
    ON balance_logs (user_id, created_at DESC);


-- ============================================================
--  2) SC REWARDS + AUDIT
--     Unified history of where SC came from / went to
-- ============================================================

CREATE TABLE IF NOT EXISTS sc_rewards (
    id          BIGSERIAL PRIMARY KEY,
    user_pk     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    user_id     TEXT,
    source      TEXT NOT NULL,      -- 'runewager_tip', 'raffle_win', 'drop', etc.
    sc_amount   BIGINT NOT NULL,
    site        TEXT,               -- 'runewager', 'cwallet', 'winna', etc.
    reward_type TEXT NOT NULL DEFAULT 'SC',
    meta        JSONB,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_rewards_user_pk_created
    ON sc_rewards (user_pk, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sc_rewards_user_id_created
    ON sc_rewards (user_id, created_at DESC);


CREATE TABLE IF NOT EXISTS sc_audit (
    id             BIGSERIAL PRIMARY KEY,
    user_pk        INTEGER REFERENCES users(id) ON DELETE CASCADE,
    user_id        TEXT,
    direction      TEXT NOT NULL,   -- 'credit' or 'debit'
    sc_amount      BIGINT NOT NULL,
    source         TEXT NOT NULL,   -- 'raffle_entry', 'drop', 'tip', etc.
    reference_type TEXT,            -- 'raffle', 'drop', 'runewager_tip', etc.
    reference_id   BIGINT,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_audit_user_pk_created
    ON sc_audit (user_pk, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sc_audit_user_id_created
    ON sc_audit (user_id, created_at DESC);


-- ============================================================
--  3) GRATIFICATION DROPS (separate from existing AI `drops`)
--     Logs SC / sweeps / crypto / Cwallet rewards per user
-- ============================================================

CREATE TABLE IF NOT EXISTS sc_drops (
    id           BIGSERIAL PRIMARY KEY,
    user_pk      INTEGER REFERENCES users(id) ON DELETE CASCADE,
    user_id      TEXT,                  -- mirrors users.user_id
    site         TEXT NOT NULL,         -- 'runewager', 'cwallet', 'winna', etc.
    base_sc      BIGINT NOT NULL,       -- base SC before multipliers
    final_sc     BIGINT NOT NULL,       -- after multipliers
    reward_type  TEXT NOT NULL DEFAULT 'SC',  -- 'SC', 'SWEEPS', 'CRYPTO'
    tip_currency TEXT,                  -- 'SC', 'SWEEPS', 'USDT', etc.
    tip_network  TEXT,                  -- 'SOL', 'ETH', etc.
    tip_address  TEXT,                  -- on-chain address
    cwallet_id   TEXT,                  -- Cwallet handle if applicable
    reason       TEXT NOT NULL,         -- 'daily_promo', 'degen_drop', etc.
    admin_name   TEXT,                  -- friendly admin identifier
    meta         JSONB,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sc_drops_user_pk_created
    ON sc_drops (user_pk, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sc_drops_user_id_created
    ON sc_drops (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sc_drops_site_created
    ON sc_drops (site, created_at DESC);


-- ============================================================
--  4) EXTEND RAFFLE WINNERS FOR CRYPTO / CWALLET PAYOUTS
--     Uses your existing pattern: user_id TEXT, asset, delivery_method, etc.
-- ============================================================

-- Link winner to your external user_id (text identifier)
ALTER TABLE raffle_winners
    ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Cwallet / crypto asset info
ALTER TABLE raffle_winners
    ADD COLUMN IF NOT EXISTS asset           TEXT;          -- 'BTC', 'ETH', 'SOL', 'USDT', 'SC', etc.;
ALTER TABLE raffle_winners
    ADD COLUMN IF NOT EXISTS amount          NUMERIC;       -- raw amount in asset
ALTER TABLE raffle_winners
    ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'cwallet';  -- 'cwallet', 'on_chain', 'telegram';

-- Status + tx metadata similar to crypto_tips
ALTER TABLE raffle_winners
    ADD COLUMN IF NOT EXISTS status   TEXT DEFAULT 'logged';          -- 'logged', 'pending', 'completed'
ALTER TABLE raffle_winners
    ADD COLUMN IF NOT EXISTS tx_hash  TEXT;
ALTER TABLE raffle_winners
    ADD COLUMN IF NOT EXISTS note     TEXT;

-- Cwallet link + optional updated_at
ALTER TABLE raffle_winners
    ADD COLUMN IF NOT EXISTS cwallet_id TEXT;
ALTER TABLE raffle_winners
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Indexes for faster lookups by raffle + user + status
CREATE INDEX IF NOT EXISTS idx_raffle_winners_user_id
    ON raffle_winners (user_id);

CREATE INDEX IF NOT EXISTS idx_raffle_winners_status
    ON raffle_winners (status);

CREATE INDEX IF NOT EXISTS idx_raffle_winners_cwallet_id
    ON raffle_winners (cwallet_id);


-- Optional: basic status check constraint (mirrors crypto_tips)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_constraint
        WHERE  conname = 'raffle_winners_status_check'
    ) THEN
        ALTER TABLE raffle_winners
            ADD CONSTRAINT raffle_winners_status_check
            CHECK (status = ANY (ARRAY['logged', 'pending', 'completed']));
    END IF;
END $$;


-- ============================================================
--  5) OPTIONAL: HOOKS FOR MAPPING USERS TO PK (no data changes)
--     These are helper indexes; you can backfill user_pk later
-- ============================================================

-- Fast mapping from users.user_id (TEXT) to users.id (PK)
CREATE INDEX IF NOT EXISTS idx_users_user_id_to_pk
    ON users (user_id, id);