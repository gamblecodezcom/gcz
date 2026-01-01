-- ============================================
-- FULL DROPS ENGINE SCHEMA (FINAL)
-- Safe, idempotent, production-ready
-- ============================================

-- RAW INGESTION TABLE
CREATE TABLE IF NOT EXISTS raw_drops (
    id BIGSERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    source TEXT,
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_raw_drops_created
    ON raw_drops (created_at DESC);


-- AI CLASSIFICATION SNAPSHOTS
CREATE TABLE IF NOT EXISTS ai_classification_snapshots (
    id BIGSERIAL PRIMARY KEY,
    raw_id BIGINT NOT NULL,
    category TEXT,
    confidence NUMERIC(5,2),
    model_version TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_classification_snapshots
    ADD CONSTRAINT ai_snapshots_raw_fk
    FOREIGN KEY (raw_id)
    REFERENCES raw_drops(id)
    ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_ai_snapshots_raw
    ON ai_classification_snapshots (raw_id);


-- PENDING DROPS (ADMIN REVIEW QUEUE)
CREATE TABLE IF NOT EXISTS drops_pending (
    id BIGSERIAL PRIMARY KEY,
    raw_id BIGINT,
    text TEXT NOT NULL,
    source TEXT,
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE drops_pending
    ADD CONSTRAINT drops_pending_raw_fk
    FOREIGN KEY (raw_id)
    REFERENCES raw_drops(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_drops_pending_created
    ON drops_pending (created_at DESC);


-- FINAL APPROVED DROPS
CREATE TABLE IF NOT EXISTS drops (
    id BIGSERIAL PRIMARY KEY,
    raw_id BIGINT,
    text TEXT NOT NULL,
    category TEXT,
    confidence NUMERIC(5,2),
    source TEXT,
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (text)
);

ALTER TABLE drops
    ADD CONSTRAINT drops_raw_fk
    FOREIGN KEY (raw_id)
    REFERENCES raw_drops(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_drops_text
    ON drops USING gin (to_tsvector('english', text));

CREATE INDEX IF NOT EXISTS idx_drops_category
    ON drops (category);

CREATE INDEX IF NOT EXISTS idx_drops_created
    ON drops (created_at DESC);


-- ADMIN ACTION LOG
CREATE TABLE IF NOT EXISTS drop_admin_actions (
    id BIGSERIAL PRIMARY KEY,
    raw_id BIGINT,
    admin_id BIGINT,
    action TEXT NOT NULL, -- approve | reject | override
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE drop_admin_actions
    ADD CONSTRAINT drop_admin_actions_raw_fk
    FOREIGN KEY (raw_id)
    REFERENCES raw_drops(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_drop_admin_actions_raw
    ON drop_admin_actions (raw_id);


-- ERROR LOGGING
CREATE TABLE IF NOT EXISTS drops_errors (
    id BIGSERIAL PRIMARY KEY,
    raw_id BIGINT,
    stage TEXT NOT NULL, -- validation | classify | persist | notify
    error TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE drops_errors
    ADD CONSTRAINT drops_errors_raw_fk
    FOREIGN KEY (raw_id)
    REFERENCES raw_drops(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_drops_errors_created
    ON drops_errors (created_at DESC);
