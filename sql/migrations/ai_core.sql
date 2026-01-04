-- ============================================================
--  AI CORE TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_memory (
  id SERIAL PRIMARY KEY,
  category TEXT,
  message TEXT,
  source TEXT,
  meta JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_health (
  id SERIAL PRIMARY KEY,
  service TEXT,
  status TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS anomalies (
  id SERIAL PRIMARY KEY,
  type TEXT,
  message TEXT,
  meta JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  PERPLEXITY AI TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_perplexity_logs (
  id SERIAL PRIMARY KEY,
  prompt TEXT,
  response TEXT,
  model TEXT,
  tokens_used INT,
  meta JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_perplexity_search (
  id SERIAL PRIMARY KEY,
  query TEXT,
  results JSONB,
  model TEXT,
  meta JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_perplexity_embeddings (
  id SERIAL PRIMARY KEY,
  input TEXT,
  embedding VECTOR(1536),
  model TEXT,
  meta JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  DISCORD INGESTION + AI CLASSIFICATION
-- ============================================================

CREATE TABLE IF NOT EXISTS discord_messages_raw (
  id SERIAL PRIMARY KEY,
  discord_id TEXT,
  username TEXT,
  channel TEXT,
  message TEXT,
  meta JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS discord_messages_clean (
  id SERIAL PRIMARY KEY,
  raw_id INT REFERENCES discord_messages_raw(id),
  clean_message TEXT,
  meta JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS discord_promos (
  id SERIAL PRIMARY KEY,
  clean_id INT REFERENCES discord_messages_clean(id),
  promo_code TEXT,
  promo_url TEXT,
  affiliate_id INT,
  classification TEXT,
  confidence NUMERIC,
  meta JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  DROP ENGINE AI CLASSIFICATION
-- ============================================================

CREATE TABLE IF NOT EXISTS drops_raw (
  id SERIAL PRIMARY KEY,
  source TEXT,
  message TEXT,
  meta JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drops_ai (
  id SERIAL PRIMARY KEY,
  raw_id INT REFERENCES drops_raw(id),
  drop_type TEXT,
  site TEXT,
  bonus TEXT,
  confidence NUMERIC,
  meta JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drops_gratification (
  id SERIAL PRIMARY KEY,
  raw_id INT REFERENCES drops_raw(id),
  reward TEXT,
  amount TEXT,
  confidence NUMERIC,
  meta JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  BTREE INDEXES (IDEMPOTENT)
-- ============================================================

DO $$
BEGIN
  -- AI Memory
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ai_memory_category'
  ) THEN
    CREATE INDEX idx_ai_memory_category ON ai_memory (category);
  END IF;

  -- Service Health
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_service_health_service'
  ) THEN
    CREATE INDEX idx_service_health_service ON service_health (service);
  END IF;

  -- Anomalies
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_anomalies_type'
  ) THEN
    CREATE INDEX idx_anomalies_type ON anomalies (type);
  END IF;

  -- Perplexity
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ai_perplexity_logs_model'
  ) THEN
    CREATE INDEX idx_ai_perplexity_logs_model ON ai_perplexity_logs (model);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ai_perplexity_search_query'
  ) THEN
    CREATE INDEX idx_ai_perplexity_search_query ON ai_perplexity_search (query);
  END IF;

  -- Discord
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_discord_promos_promo_code'
  ) THEN
    CREATE INDEX idx_discord_promos_promo_code ON discord_promos (promo_code);
  END IF;

  -- Drops
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_drops_ai_drop_type'
  ) THEN
    CREATE INDEX idx_drops_ai_drop_type ON drops_ai (drop_type);
  END IF;

END $$;

-- ============================================================
--  JSONB GIN INDEXES (IDEMPOTENT)
-- ============================================================

DO $$
BEGIN
  -- AI Memory
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ai_memory_meta_gin'
  ) THEN
    CREATE INDEX idx_ai_memory_meta_gin ON ai_memory USING GIN (meta);
  END IF;

  -- Service Health
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_service_health_details_gin'
  ) THEN
    CREATE INDEX idx_service_health_details_gin ON service_health USING GIN (details);
  END IF;

  -- Anomalies
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_anomalies_meta_gin'
  ) THEN
    CREATE INDEX idx_anomalies_meta_gin ON anomalies USING GIN (meta);
  END IF;

  -- Perplexity
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ai_perplexity_logs_meta_gin'
  ) THEN
    CREATE INDEX idx_ai_perplexity_logs_meta_gin ON ai_perplexity_logs USING GIN (meta);
  END IF;

  -- Discord
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_discord_messages_clean_meta_gin'
  ) THEN
    CREATE INDEX idx_discord_messages_clean_meta_gin ON discord_messages_clean USING GIN (meta);
  END IF;

  -- Drops
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_drops_ai_meta_gin'
  ) THEN
    CREATE INDEX idx_drops_ai_meta_gin ON drops_ai USING GIN (meta);
  END IF;

END $$;