-- ==========================================================
-- GambleCodez Canonical Base Schema
-- Single source of truth for a fresh Neon Postgres database.
-- ==========================================================

-- ============================
-- 1. CORE USERS + SETTINGS
-- ============================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  pin_hash TEXT,
  locked BOOLEAN DEFAULT false,
  admin_level INTEGER DEFAULT 0,
  telegram_id TEXT,
  telegram_username TEXT,
  cwallet_id TEXT,
  email TEXT,
  username TEXT,
  full_name TEXT,
  jurisdiction TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_cwallet_id ON users(cwallet_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS settings (
  "key" TEXT PRIMARY KEY,
  "value" TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 2. ADMIN AUTH + RBAC
-- ============================

CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  last_login_ip TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

CREATE TABLE IF NOT EXISTS admin_roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT,
  description TEXT,
  level INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_permissions (
  id SERIAL PRIMARY KEY,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(resource, action)
);

CREATE TABLE IF NOT EXISTS admin_role_permissions (
  role_id INTEGER NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES admin_permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS admin_user_roles (
  user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role_id)
);

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

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_resource ON admin_audit_log(resource_type, resource_id);

-- ============================
-- 3. TELEGRAM RBAC + EVENTS
-- ============================

CREATE TABLE IF NOT EXISTS telegram_roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  level INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS telegramuserroles (
  telegram_id BIGINT PRIMARY KEY,
  roleid INTEGER NOT NULL REFERENCES telegram_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS telegram_role_permissions (
  role_id INTEGER NOT NULL REFERENCES telegram_roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES admin_permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS telegram_triggers (
  id SERIAL PRIMARY KEY,
  event TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  template TEXT NOT NULL,
  target TEXT NOT NULL,
  segment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS telegram_logs (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  command TEXT,
  message TEXT,
  "user" TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS telegram_broadcasts (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  delivered INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS telegram_notifications (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  telegram_id TEXT,
  telegram_username TEXT,
  type TEXT NOT NULL,
  title TEXT,
  body TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_telegram_notifications_user_id ON telegram_notifications(user_id);

-- ============================
-- 4. AFFILIATES + ANALYTICS
-- ============================

CREATE TABLE IF NOT EXISTS affiliates_master (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  affiliate_url TEXT,
  url TEXT,
  logo TEXT,
  icon_url TEXT,
  description TEXT,
  slug TEXT,
  category TEXT,
  status TEXT DEFAULT 'active',
  level INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 0,
  date_added DATE,
  bonus_code TEXT,
  bonus_description TEXT,
  resolved_domain TEXT,
  redemption_speed TEXT,
  redemption_minimum NUMERIC,
  redemption_type TEXT,
  top_pick BOOLEAN DEFAULT false,
  jurisdiction TEXT,
  sc_allowed BOOLEAN DEFAULT false,
  crypto_allowed BOOLEAN DEFAULT false,
  cwallet_allowed BOOLEAN DEFAULT false,
  lootbox_allowed BOOLEAN DEFAULT false,
  show_in_profile BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_by TEXT,
  source TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_affiliates_master_slug ON affiliates_master(slug);
CREATE INDEX IF NOT EXISTS idx_affiliates_master_category ON affiliates_master(category);
CREATE INDEX IF NOT EXISTS idx_affiliates_master_status ON affiliates_master(status);
CREATE INDEX IF NOT EXISTS idx_affiliates_master_jurisdiction ON affiliates_master(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_affiliates_master_resolved_domain ON affiliates_master(resolved_domain);

CREATE TABLE IF NOT EXISTS affiliate_category_mapping (
  id SERIAL PRIMARY KEY,
  affiliate_id INTEGER NOT NULL REFERENCES affiliates_master(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(affiliate_id, category)
);

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id SERIAL PRIMARY KEY,
  affiliate_id INTEGER NOT NULL REFERENCES affiliates_master(id) ON DELETE CASCADE,
  user_id TEXT,
  slug TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate_id ON affiliate_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_user_id ON affiliate_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_clicked_at ON affiliate_clicks(clicked_at);

CREATE TABLE IF NOT EXISTS affiliate_conversions (
  id SERIAL PRIMARY KEY,
  affiliate_id INTEGER NOT NULL REFERENCES affiliates_master(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  conversion_type TEXT NOT NULL,
  conversion_value NUMERIC,
  conversion_data JSONB,
  converted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_affiliate_id ON affiliate_conversions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_user_id ON affiliate_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_conversions_converted_at ON affiliate_conversions(converted_at);

CREATE TABLE IF NOT EXISTS domain_resolution_log (
  id SERIAL PRIMARY KEY,
  affiliate_id INTEGER NOT NULL REFERENCES affiliates_master(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  resolved_domain TEXT,
  resolution_status TEXT,
  error_message TEXT,
  resolved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_domain_resolution_log_affiliate_id ON domain_resolution_log(affiliate_id);

-- Legacy/unused: legacy affiliates table from older migrations.
CREATE TABLE IF NOT EXISTS affiliates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  default_affiliate_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 5. DROPS + PROMO AI PIPELINE
-- ============================

CREATE TABLE IF NOT EXISTS raw_drops (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'unknown',
  source_channel_id TEXT,
  source_user_id TEXT,
  source_username TEXT,
  raw_text TEXT NOT NULL,
  metadata JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_raw_drops_status ON raw_drops(status);
CREATE INDEX IF NOT EXISTS idx_raw_drops_created_at ON raw_drops(created_at DESC);

CREATE TABLE IF NOT EXISTS ai_classification_snapshots (
  id SERIAL PRIMARY KEY,
  raw_drop_id INTEGER NOT NULL REFERENCES raw_drops(id) ON DELETE CASCADE,
  is_promo BOOLEAN,
  confidence_score NUMERIC,
  extracted_codes TEXT[],
  extracted_urls TEXT[],
  resolved_domains TEXT[],
  guessed_casino TEXT,
  guessed_jurisdiction TEXT,
  proposed_headline TEXT,
  proposed_description TEXT,
  validity_score NUMERIC,
  is_spam BOOLEAN,
  is_duplicate BOOLEAN,
  duplicate_of_raw_drop_id INTEGER,
  model_name TEXT,
  model_version TEXT,
  label TEXT,
  score NUMERIC,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_snapshots_raw_drop_id ON ai_classification_snapshots(raw_drop_id);

CREATE TABLE IF NOT EXISTS promo_candidates (
  id SERIAL PRIMARY KEY,
  raw_drop_id INTEGER NOT NULL REFERENCES raw_drops(id) ON DELETE CASCADE,
  ai_snapshot_id INTEGER REFERENCES ai_classification_snapshots(id) ON DELETE SET NULL,
  headline TEXT,
  description TEXT,
  promo_type TEXT,
  bonus_code TEXT,
  promo_url TEXT,
  resolved_domain TEXT,
  mapped_casino_id INTEGER REFERENCES affiliates_master(id) ON DELETE SET NULL,
  jurisdiction_tags TEXT[],
  validity_score NUMERIC,
  is_spam BOOLEAN,
  is_duplicate BOOLEAN,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promo_candidates_status ON promo_candidates(status);
CREATE INDEX IF NOT EXISTS idx_promo_candidates_mapped_casino_id ON promo_candidates(mapped_casino_id);

CREATE TABLE IF NOT EXISTS drop_promos (
  id SERIAL PRIMARY KEY,
  headline TEXT,
  description TEXT,
  bonus_code TEXT,
  promo_url TEXT,
  resolved_domain TEXT,
  mapped_casino_id INTEGER REFERENCES affiliates_master(id) ON DELETE SET NULL,
  jurisdiction_tags TEXT[],
  quick_signup_url TEXT,
  status TEXT DEFAULT 'active',
  source_candidate_id INTEGER REFERENCES promo_candidates(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_drop_promos_status ON drop_promos(status);
CREATE INDEX IF NOT EXISTS idx_drop_promos_created_at ON drop_promos(created_at DESC);

CREATE TABLE IF NOT EXISTS drop_notifications_sent (
  id SERIAL PRIMARY KEY,
  drop_promo_id INTEGER NOT NULL REFERENCES drop_promos(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  meta JSONB,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_drop_notifications_sent_user_id ON drop_notifications_sent(user_id);
CREATE INDEX IF NOT EXISTS idx_drop_notifications_sent_drop_promo_id ON drop_notifications_sent(drop_promo_id);

-- ============================
-- 6. PROMOS + DECISIONS
-- ============================

CREATE TABLE IF NOT EXISTS promos (
  id SERIAL PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'discord',
  channel TEXT NOT NULL,
  content TEXT NOT NULL,
  clean_text TEXT,
  submitted_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  affiliate_id INTEGER REFERENCES affiliates_master(id) ON DELETE SET NULL,
  deny_reason TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMP,
  approved_by TEXT,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Legacy/AI moderation fields
  raw_text TEXT,
  cleaned_text TEXT,
  ai_type TEXT,
  ai_confidence NUMERIC(5,2),
  ai_decision TEXT,
  created_by_admin_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  created_by_telegram_id BIGINT,
  created_by_discord_id TEXT,
  site_user_id BIGINT
);

CREATE INDEX IF NOT EXISTS idx_promos_status ON promos(status);
CREATE INDEX IF NOT EXISTS idx_promos_channel ON promos(channel);
CREATE INDEX IF NOT EXISTS idx_promos_created_at ON promos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_promos_affiliate_id ON promos(affiliate_id);

CREATE TABLE IF NOT EXISTS promo_decisions (
  id SERIAL PRIMARY KEY,
  promo_id INTEGER NOT NULL REFERENCES promos(id) ON DELETE CASCADE,
  decision TEXT NOT NULL,
  affiliate_id INTEGER REFERENCES affiliates_master(id) ON DELETE SET NULL,
  deny_reason TEXT,
  reviewed_by TEXT NOT NULL,
  reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promo_decisions_promo_id ON promo_decisions(promo_id);
CREATE INDEX IF NOT EXISTS idx_promo_decisions_decision ON promo_decisions(decision);

CREATE TABLE IF NOT EXISTS promo_ai_log (
  id SERIAL PRIMARY KEY,
  promo_id INTEGER NOT NULL REFERENCES promos(id) ON DELETE CASCADE,
  ai_model TEXT NOT NULL DEFAULT 'sonar-pro',
  ai_label TEXT,
  ai_confidence NUMERIC(5,2),
  ai_raw_response TEXT,
  admin_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  admin_action TEXT,
  admin_reason TEXT,
  admin_corrected_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promo_ai_log_promo_id ON promo_ai_log(promo_id);
CREATE INDEX IF NOT EXISTS idx_promo_ai_log_admin_id ON promo_ai_log(admin_id);

CREATE TABLE IF NOT EXISTS discord_messages (
  id SERIAL PRIMARY KEY,
  discord_message_id TEXT UNIQUE NOT NULL,
  discord_channel_id TEXT NOT NULL,
  discord_user_id TEXT NOT NULL,
  promo_id INTEGER REFERENCES promos(id) ON DELETE SET NULL,
  raw_content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discord_messages_promo_id ON discord_messages(promo_id);

CREATE TABLE IF NOT EXISTS telegram_promo_links (
  id SERIAL PRIMARY KEY,
  promo_id INTEGER NOT NULL REFERENCES promos(id) ON DELETE CASCADE,
  chat_id BIGINT NOT NULL,
  message_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_telegram_promo_links_chat_msg
  ON telegram_promo_links(chat_id, message_id);

CREATE TABLE IF NOT EXISTS promo_codes (
  id TEXT PRIMARY KEY,
  site TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  verified BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS promo_links (
  id TEXT PRIMARY KEY,
  site TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verified BOOLEAN DEFAULT true
);

-- ============================
-- 7. NEWSLETTER + CONTACT
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
  email TEXT UNIQUE NOT NULL,
  unsubscribed BOOLEAN DEFAULT false,
  last_opened TIMESTAMP,
  last_clicked TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);

CREATE TABLE IF NOT EXISTS contact_submissions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 8. USER NOTIFICATIONS + ACTIVITY
-- ============================

CREATE TABLE IF NOT EXISTS user_notification_settings (
  user_id TEXT PRIMARY KEY,
  email_newsletter BOOLEAN DEFAULT false,
  telegram_raffle_alerts BOOLEAN DEFAULT true,
  telegram_giveaway_alerts BOOLEAN DEFAULT true,
  telegram_secret_code_hints BOOLEAN DEFAULT false,
  telegram_drops_alerts BOOLEAN DEFAULT true,
  email_drops_alerts BOOLEAN DEFAULT false,
  push_drops_alerts BOOLEAN DEFAULT true,
  drops_enabled BOOLEAN DEFAULT true,
  drops_telegram BOOLEAN DEFAULT true,
  drops_email BOOLEAN DEFAULT false,
  drops_push BOOLEAN DEFAULT true,
  drops_frequency TEXT DEFAULT 'instant',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  title TEXT,
  description TEXT,
  link_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

CREATE TABLE IF NOT EXISTS push_notifications (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link_url TEXT,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_push_notifications_user_id ON push_notifications(user_id);

-- ============================
-- 9. USER LINKED SITES + ROLES
-- ============================

CREATE TABLE IF NOT EXISTS user_linked_sites (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  site_id TEXT NOT NULL,
  identifier_type TEXT NOT NULL,
  identifier_value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, site_id)
);

CREATE INDEX IF NOT EXISTS idx_user_linked_sites_user_id ON user_linked_sites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_linked_sites_site_id ON user_linked_sites(site_id);

-- Compatibility view for legacy queries expecting integer users.id
CREATE OR REPLACE VIEW user_site_links AS
SELECT
  u.id AS user_id,
  uls.site_id,
  uls.identifier_type,
  uls.identifier_value,
  uls.created_at,
  uls.updated_at
FROM user_linked_sites uls
JOIN users u ON u.user_id = uls.user_id;

CREATE TABLE IF NOT EXISTS site_admin_roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_admin_users (
  site_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL REFERENCES site_admin_roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(site_id, user_id)
);

-- ============================
-- 10. RAFFLES + WHEEL
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
  prize_site_id INTEGER REFERENCES affiliates_master(id) ON DELETE SET NULL,
  sponsor_site TEXT,
  sponsor_campaign_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_raffles_active ON raffles(active);
CREATE INDEX IF NOT EXISTS idx_raffles_hidden ON raffles(hidden);
CREATE INDEX IF NOT EXISTS idx_raffles_end_date ON raffles(end_date);

CREATE TABLE IF NOT EXISTS raffle_entries (
  id SERIAL PRIMARY KEY,
  raffle_id INTEGER NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_raffle_entries_raffle_id ON raffle_entries(raffle_id);
CREATE INDEX IF NOT EXISTS idx_raffle_entries_user_id ON raffle_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_raffle_entries_created_at ON raffle_entries(created_at DESC);

CREATE TABLE IF NOT EXISTS raffle_winners (
  id SERIAL PRIMARY KEY,
  raffle_id INTEGER NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  prize_type TEXT,
  cwallet_claim_url TEXT,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_raffle_winners_raffle_id ON raffle_winners(raffle_id);

CREATE TABLE IF NOT EXISTS raffle_prize_urls (
  id SERIAL PRIMARY KEY,
  raffle_id INTEGER NOT NULL REFERENCES raffles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  used BOOLEAN DEFAULT false,
  assigned_to_user_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_raffle_prize_urls_raffle_id ON raffle_prize_urls(raffle_id);
CREATE INDEX IF NOT EXISTS idx_raffle_prize_urls_used ON raffle_prize_urls(used);

CREATE TABLE IF NOT EXISTS wheel_config (
  id SERIAL PRIMARY KEY,
  spins_per_day INTEGER DEFAULT 1,
  target_raffle_id INTEGER REFERENCES raffles(id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS idx_wheel_prize_slots_config ON wheel_prize_slots(wheel_config_id);

CREATE TABLE IF NOT EXISTS spin_logs (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  reward TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_spin_logs_user_id ON spin_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_spin_logs_created_at ON spin_logs(created_at DESC);

-- ============================
-- 11. GIVEAWAYS
-- ============================

CREATE TABLE IF NOT EXISTS giveaways (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  prize_value TEXT NOT NULL,
  prize_asset TEXT,
  num_winners INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft',
  entry_method TEXT DEFAULT 'both',
  auto_select_winners BOOLEAN DEFAULT true,
  allow_repeat_winners BOOLEAN DEFAULT false,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  winner_selection_method TEXT DEFAULT 'random',
  telegram_chat_id TEXT,
  telegram_message_id TEXT,
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_giveaways_status ON giveaways(status);

CREATE TABLE IF NOT EXISTS giveaway_entries (
  id SERIAL PRIMARY KEY,
  giveaway_id INTEGER NOT NULL REFERENCES giveaways(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  telegram_id TEXT,
  telegram_username TEXT,
  entry_method TEXT NOT NULL,
  entry_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(giveaway_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_giveaway_entries_giveaway_id ON giveaway_entries(giveaway_id);
CREATE INDEX IF NOT EXISTS idx_giveaway_entries_user_id ON giveaway_entries(user_id);

CREATE TABLE IF NOT EXISTS giveaway_winners (
  id SERIAL PRIMARY KEY,
  giveaway_id INTEGER NOT NULL REFERENCES giveaways(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  telegram_id TEXT,
  telegram_username TEXT,
  prize_value TEXT NOT NULL,
  reward_status TEXT DEFAULT 'pending',
  reward_data JSONB,
  notified_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_giveaway_winners_giveaway_id ON giveaway_winners(giveaway_id);

-- ============================
-- 12. DAILY DROPS + BANNERS + REDIRECTS
-- ============================

CREATE TABLE IF NOT EXISTS daily_drops (
  id SERIAL PRIMARY KEY,
  promo_code TEXT,
  bonus_link TEXT,
  affiliate_id INTEGER REFERENCES affiliates_master(id) ON DELETE SET NULL,
  jurisdiction TEXT,
  category TEXT,
  active BOOLEAN DEFAULT true,
  drop_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_drops_drop_date ON daily_drops(drop_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_drops_active ON daily_drops(active);

CREATE TABLE IF NOT EXISTS redirects (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  weight INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_redirects_slug ON redirects(slug);

CREATE TABLE IF NOT EXISTS live_banner (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  link_url TEXT,
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blacklist (
  id SERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_blacklist_user_id ON blacklist(user_id);

-- ============================
-- 13. ADS
-- ============================

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
  placement_id INTEGER,
  campaign_id INTEGER,
  user_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ad_impressions_placement ON ad_impressions(placement_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_campaign ON ad_impressions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_user ON ad_impressions(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_created ON ad_impressions(created_at);

CREATE TABLE IF NOT EXISTS ad_clicks (
  id SERIAL PRIMARY KEY,
  placement_id INTEGER,
  campaign_id INTEGER,
  user_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ad_clicks_placement ON ad_clicks(placement_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_campaign ON ad_clicks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_user ON ad_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_clicks_created ON ad_clicks(created_at);

-- ============================
-- 14. GAMIFICATION
-- ============================

CREATE TABLE IF NOT EXISTS user_xp (
  user_id TEXT PRIMARY KEY,
  total_xp INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  xp_to_next_level INTEGER DEFAULT 100,
  total_spins INTEGER DEFAULT 0,
  total_raffle_entries INTEGER DEFAULT 0,
  total_giveaways_entered INTEGER DEFAULT 0,
  total_sites_linked INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS xp_transactions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  xp_amount INTEGER NOT NULL,
  source TEXT NOT NULL,
  source_id TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON xp_transactions(user_id);

CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  xp_reward INTEGER DEFAULT 0,
  category TEXT,
  rarity TEXT,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS missions (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  mission_type TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  xp_reward INTEGER DEFAULT 0,
  bonus_xp INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_missions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  mission_id INTEGER NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, mission_id)
);

CREATE TABLE IF NOT EXISTS user_streaks (
  user_id TEXT PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 15. REWARDS + WALLETS
-- ============================

CREATE TABLE IF NOT EXISTS runewager_tips (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  username TEXT,
  email TEXT,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'logged',
  note TEXT,
  admin_name TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crypto_tips (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  asset TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  delivery_method TEXT,
  status TEXT DEFAULT 'pending',
  tx_hash TEXT,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lootbox_rewards (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  site TEXT,
  prize_type TEXT,
  claim_url TEXT,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crypto_addresses (
  user_id TEXT PRIMARY KEY,
  btc_address TEXT,
  eth_address TEXT,
  sol_address TEXT,
  usdt_address TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 16. BUG REPORTING
-- ============================

CREATE TABLE IF NOT EXISTS bug_reports (
  id SERIAL PRIMARY KEY,
  user_id TEXT,
  role TEXT,
  surface TEXT,
  issue_type TEXT,
  severity TEXT,
  description TEXT NOT NULL,
  metadata JSONB,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bug_report_actions (
  id SERIAL PRIMARY KEY,
  bug_id INTEGER NOT NULL REFERENCES bug_reports(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

