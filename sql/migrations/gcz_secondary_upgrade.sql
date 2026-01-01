-- ============================================================
-- DROPS ENGINE CORE TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS drops (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  site TEXT NOT NULL,
  drop_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drop_promos (
  id SERIAL PRIMARY KEY,
  drop_id INTEGER REFERENCES drops(id) ON DELETE CASCADE,
  affiliate_id INTEGER REFERENCES affiliates_master(id),
  mapped_casino INTEGER REFERENCES affiliates_master(id),
  promo_code TEXT,
  promo_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drop_ai_learning (
  id SERIAL PRIMARY KEY,
  drop_id INTEGER REFERENCES drops(id) ON DELETE CASCADE,
  affiliate_id INTEGER REFERENCES affiliates_master(id),
  feedback TEXT,
  label TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_drops_user_id ON drops(user_id);
CREATE INDEX IF NOT EXISTS idx_drop_promos_affiliate_id ON drop_promos(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_drop_ai_learning_affiliate_id ON drop_ai_learning(affiliate_id);
-- ============================================================
-- BUG REPORTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS bug_reports (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bug_reports_user_id ON bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_severity ON bug_reports(severity);
-- ============================================================
-- DEGEN PROFILES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS degen_profiles (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  nickname TEXT,
  avatar_url TEXT,
  bio TEXT,
  favorite_site TEXT,
  degen_score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_degen_profiles_user_id ON degen_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_degen_profiles_score ON degen_profiles(degen_score DESC);
-- ============================================================
-- MULTI-LEVEL ADMIN SYSTEM
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator', 'helper')),
  permissions JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
-- ============================================================
-- PROMOTIONAL ADS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS promotional_ads (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT,
  target_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired')),
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promotional_ads_status ON promotional_ads(status);
CREATE INDEX IF NOT EXISTS idx_promotional_ads_priority ON promotional_ads(priority DESC);

-- ============================================================
-- REPLACE ADS WITH RUNEWAGER OSE
-- ============================================================

-- Optional: mark old ads as expired
UPDATE promotional_ads
SET status = 'expired'
WHERE title ILIKE '%ad%' AND status != 'expired';

-- Insert Runewager OSE promo
INSERT INTO promotional_ads (
  title,
  image_url,
  target_url,
  status,
  priority
) VALUES (
  'Runewager OSE Promo',
  'https://cdn.gcz.sh/runewager_ose_banner.png',
  'https://runewager.com/ose',
  'active',
  100
)
ON CONFLICT DO NOTHING;