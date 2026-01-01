-- ============================
-- 1. CORE TABLES
-- ============================

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  pin_hash TEXT,
  locked BOOLEAN DEFAULT false,
  telegram_id TEXT,
  telegram_username TEXT,
  cwallet_id TEXT,
  email TEXT,
  username TEXT,
  jurisdiction TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_cwallet_id ON users(cwallet_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- SETTINGS TABLE
CREATE TABLE IF NOT EXISTS settings (
  "key" TEXT PRIMARY KEY,
  "value" TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ADMIN AUDIT LOG
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id SERIAL PRIMARY KEY,
  admin_user TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at 
  ON admin_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_resource 
  ON admin_audit_log(resource_type, resource_id);
-- ============================
-- 2. AFFILIATES + DROPS + ADS
-- ============================

-- AFFILIATES MASTER (must exist before FKs)
CREATE TABLE IF NOT EXISTS affiliates_master (
  id SERIAL PRIMARY KEY,
  name TEXT,
  url TEXT,
  logo TEXT,
  top_pick BOOLEAN DEFAULT false,
  jurisdiction TEXT,
  sc_allowed BOOLEAN DEFAULT false,
  crypto_allowed BOOLEAN DEFAULT false,
  cwallet_allowed BOOLEAN DEFAULT false,
  lootbox_allowed BOOLEAN DEFAULT false,
  show_in_profile BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  slug TEXT,
  description TEXT,
  resolved_domain TEXT,
  redemption_speed TEXT,
  redemption_minimum NUMERIC,
  redemption_type TEXT,
  created_by TEXT,
  source TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DAILY DROPS
CREATE TABLE IF NOT EXISTS daily_drops (
  id SERIAL PRIMARY KEY,
  promo_code TEXT,
  bonus_link TEXT,
  affiliate_id INTEGER REFERENCES affiliates_master(id),
  jurisdiction TEXT,
  category TEXT,
  active BOOLEAN DEFAULT true,
  drop_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_drops_drop_date ON daily_drops(drop_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_drops_active ON daily_drops(active);

-- REDIRECTS
CREATE TABLE IF NOT EXISTS redirects (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  weight INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_redirects_slug ON redirects(slug);

-- ADS TABLE
CREATE TABLE IF NOT EXISTS ads (
  id SERIAL PRIMARY KEY,
  logo_url TEXT NOT NULL,
  site_description TEXT NOT NULL,
  bonus_code_description TEXT,
  fine_print TEXT,
  weight INTEGER DEFAULT 1,
  button_url TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BLACKLIST
CREATE TABLE IF NOT EXISTS blacklist (
  id SERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_blacklist_user_id ON blacklist(user_id);

-- LIVE BANNER
CREATE TABLE IF NOT EXISTS live_banner (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  link_url TEXT,
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- ============================
-- 3. RAFFLES ENGINE
-- ============================

CREATE TABLE IF NOT EXISTS raffles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  secret BOOLEAN DEFAULT false,
  hidden BOOLEAN DEFAULT false,
  prize_type TEXT,
  prize_value TEXT,
  raffle_type TEXT DEFAULT 'timed' CHECK (raffle_type IN ('timed', 'manual', 'daily')),
  num_winners INTEGER DEFAULT 1,
  secret_code TEXT,
  entry_sources JSONB DEFAULT '["daily_checkin", "wheel", "secret_code", "manual"]'::jsonb,
  entries_per_source JSONB DEFAULT '{"daily_checkin":1,"wheel":5,"secret_code":10,"manual":0}'::jsonb,
  winner_selection_method TEXT DEFAULT 'random' CHECK (winner_selection_method IN ('random','weighted')),
  allow_repeat_winners BOOLEAN DEFAULT false,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  prize_site_id INTEGER REFERENCES affiliates_master(id),
  sponsor_site TEXT,
  sponsor_campaign_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- ============================
-- 4. RAFFLE ENTRIES + WINNERS
-- ============================

CREATE TABLE IF NOT EXISTS raffle_entries (
  id SERIAL PRIMARY KEY,
  raffle_id INTEGER NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  entry_source TEXT CHECK (entry_source IN ('daily_checkin','wheel','secret_code','manual','wheel_spin')),
  UNIQUE(raffle_id, user_id)
);

CREATE TABLE IF NOT EXISTS raffle_winners (
  id SERIAL PRIMARY KEY,
  raffle_id INTEGER NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
  "winner" TEXT NOT NULL,
  prize TEXT,
  won_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- ============================
-- 5. WHEEL ENGINE
-- ============================

CREATE TABLE IF NOT EXISTS wheel_config (
  id SERIAL PRIMARY KEY,
  spins_per_day INTEGER DEFAULT 1,
  target_raffle_id INTEGER REFERENCES raffles(id),
  auto_draw_enabled BOOLEAN DEFAULT false,
  auto_draw_frequency TEXT DEFAULT 'daily' CHECK (auto_draw_frequency IN ('daily','weekly','manual')),
  auto_draw_time TIME,
  prize_slots JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO wheel_config (id, spins_per_day, auto_draw_enabled)
SELECT 1, 1, false
WHERE NOT EXISTS (SELECT 1 FROM wheel_config WHERE id = 1);

CREATE TABLE IF NOT EXISTS wheel_prize_slots (
  id SERIAL PRIMARY KEY,
  wheel_config_id INTEGER NOT NULL REFERENCES wheel_config(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  entry_multiplier INTEGER DEFAULT 1,
  chance_weight INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_wheel_prize_slots_config 
  ON wheel_prize_slots(wheel_config_id);

CREATE TABLE IF NOT EXISTS spin_logs (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  reward TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
-- ============================
-- 6. PROMOS ENGINE
-- ============================

CREATE TABLE IF NOT EXISTS promos (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'discord',
  channel TEXT NOT NULL CHECK (channel IN ('links','codes')),
  content TEXT NOT NULL,
  clean_text TEXT,
  submitted_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied')),
  affiliate_id INTEGER REFERENCES affiliates_master(id) ON DELETE SET NULL,
  deny_reason TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promos_status ON promos(status);
CREATE INDEX IF NOT EXISTS idx_promos_channel ON promos(channel);
CREATE INDEX IF NOT EXISTS idx_promos_created_at ON promos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_promos_affiliate_id ON promos(affiliate_id);

CREATE TABLE IF NOT EXISTS promo_decisions (
  id SERIAL PRIMARY KEY,
  promo_id INTEGER NOT NULL REFERENCES promos(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('approved','denied')),
  affiliate_id INTEGER REFERENCES affiliates_master(id) ON DELETE SET NULL,
  deny_reason TEXT,
  reviewed_by TEXT NOT NULL,
  reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promo_decisions_promo_id ON promo_decisions(promo_id);
CREATE INDEX IF NOT EXISTS idx_promo_decisions_decision ON promo_decisions(decision);
-- ============================
-- 7. NEWSLETTER ENGINE
-- ============================

CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  preheader TEXT,
  segment TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  sent_count INTEGER DEFAULT 0,
  open_rate TEXT DEFAULT '0%',
  click_rate TEXT DEFAULT '0%',
  scheduled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status ON newsletter_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_segment ON newsletter_campaigns(segment);

CREATE TABLE IF NOT EXISTS newsletter_segments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  rules JSONB,
  approx_count INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS newsletter_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  email TEXT,
  unsubscribed BOOLEAN DEFAULT false,
  last_opened TIMESTAMP,
  last_clicked TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
-- ============================
-- 8. ADS ENGINE
-- ============================

CREATE TABLE IF NOT EXISTS ad_placements (
  id SERIAL PRIMARY KEY,
  placement_id TEXT UNIQUE NOT NULL,
  location TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  current_campaign_id INTEGER,
  rotation_mode TEXT DEFAULT 'single',
  frequency_capping INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ad_placements_placement_id ON ad_placements(placement_id);

CREATE TABLE IF NOT EXISTS ad_campaigns (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  linked_site TEXT,
  image_url TEXT NOT NULL,
  headline TEXT NOT NULL,
  subtext TEXT,
  cta_text TEXT NOT NULL,
  target_url TEXT NOT NULL,
  placement_ids INTEGER[],
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_type ON ad_campaigns(type);

CREATE TABLE IF NOT EXISTS ad_impressions (
  id SERIAL PRIMARY KEY,
  placement_id INTEGER REFERENCES ad_placements(id),
  campaign_id INTEGER REFERENCES ad_campaigns(id),
  user_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ad_impressions_placement ON ad_impressions(placement_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_campaign ON ad_impressions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_user ON ad_impressions(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_created ON ad_impressions(created_at);

CREATE TABLE IF NOT EXISTS ad_clicks (
  id SERIAL PRIMARY KEY,
  placement_id INTEGER REFERENCES ad_placements(id),
  campaign_id INTEGER REFERENCES ad_campaigns(id),
  user_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ad_clicks_placement ON ad_clicks(placement_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_campaign ON ad_clicks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_user ON ad_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_created ON ad_clicks(created_at);
