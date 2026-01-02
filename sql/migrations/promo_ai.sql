-- PROMO & AI MODERATION MIGRATION
-- Patch on top of existing RBAC + telegram/admin schema

-- ---------------------------
-- Ensure composite uniqueness for permissions
-- ---------------------------
CREATE UNIQUE INDEX IF NOT EXISTS admin_permissions_resource_action_key
ON admin_permissions(resource, action);

-- =====================================================
-- AFFILIATES
-- =====================================================

CREATE TABLE IF NOT EXISTS affiliates (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT UNIQUE NOT NULL,
    default_affiliate_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- PROMOS CORE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS promos (
    id SERIAL PRIMARY KEY,

    -- Raw promo text exactly as ingested
    raw_text TEXT NOT NULL,

    -- Clean / edited promo text used in production
    cleaned_text TEXT,

    -- Source of the promo
    -- 'discord', 'telegram', 'site', 'manual'
    source TEXT NOT NULL DEFAULT 'discord',

    -- Link to affiliate/site
    affiliate_id INTEGER REFERENCES affiliates(id) ON DELETE SET NULL,

    -- Who created/ingested it (optional)
    created_by_admin_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
    created_by_telegram_id BIGINT,
    created_by_discord_id TEXT,
    site_user_id BIGINT,

    -- Status of the promo: 'pending','approved','denied','archived'
    status TEXT NOT NULL DEFAULT 'pending',

    -- Optional denial reason
    deny_reason TEXT,

    -- AI snapshot
    ai_type TEXT,                -- 'url','code','mixed','unknown'
    ai_confidence NUMERIC(5,2),
    ai_decision TEXT,            -- 'likely_valid','likely_spam','uncertain'

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promos_status ON promos(status);
CREATE INDEX IF NOT EXISTS idx_promos_source ON promos(source);
CREATE INDEX IF NOT EXISTS idx_promos_affiliate_id ON promos(affiliate_id);

-- =====================================================
-- PROMO AI LOG (LEARNING LOOP)
-- =====================================================

CREATE TABLE IF NOT EXISTS promo_ai_log (
    id SERIAL PRIMARY KEY,
    promo_id INTEGER NOT NULL REFERENCES promos(id) ON DELETE CASCADE,

    -- AI decision snapshot
    ai_model TEXT NOT NULL DEFAULT 'sonar-pro',
    ai_label TEXT,
    ai_confidence NUMERIC(5,2),
    ai_raw_response TEXT,

    -- Admin feedback
    admin_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
    admin_action TEXT,
    admin_reason TEXT,
    admin_corrected_text TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_ai_log_promo_id ON promo_ai_log(promo_id);
CREATE INDEX IF NOT EXISTS idx_promo_ai_log_admin_id ON promo_ai_log(admin_id);

-- =====================================================
-- DISCORD MESSAGE METADATA
-- =====================================================

CREATE TABLE IF NOT EXISTS discord_messages (
    id SERIAL PRIMARY KEY,
    discord_message_id TEXT UNIQUE NOT NULL,
    discord_channel_id TEXT NOT NULL,
    discord_user_id TEXT NOT NULL,

    promo_id INTEGER REFERENCES promos(id) ON DELETE SET NULL,

    raw_content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discord_messages_promo_id
ON discord_messages(promo_id);

-- =====================================================
-- TELEGRAM ↔ PROMO LINKING
-- =====================================================

CREATE TABLE IF NOT EXISTS telegram_promo_links (
    id SERIAL PRIMARY KEY,

    promo_id INTEGER NOT NULL REFERENCES promos(id) ON DELETE CASCADE,

    chat_id BIGINT NOT NULL,
    message_id BIGINT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_telegram_promo_links_chat_msg
ON telegram_promo_links(chat_id, message_id);

-- =====================================================
-- NEW PERMISSIONS (resource/action MODEL)
-- =====================================================

-- Promo moderation permissions
INSERT INTO admin_permissions (resource, action) VALUES
    ('promos','view'),
    ('promos','approve'),
    ('promos','edit'),
    ('promos','deny'),
    ('promos','ai_review')
ON CONFLICT (resource, action) DO NOTHING;

-- AI tool permissions
INSERT INTO admin_permissions (resource, action) VALUES
    ('ai','classify'),
    ('ai','rewrite'),
    ('ai','review')
ON CONFLICT (resource, action) DO NOTHING;

-- =====================================================
-- ROLE → PERMISSION MAPPING (ADMIN ROLES)
-- =====================================================

INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT ar.id, ap.id
FROM admin_roles ar
JOIN admin_permissions ap
  ON (ap.resource, ap.action) IN (
      ('promos','view'),
      ('promos','approve'),
      ('promos','edit'),
      ('promos','deny'),
      ('promos','ai_review'),
      ('ai','classify'),
      ('ai','rewrite'),
      ('ai','review')
  )
WHERE ar.name = 'super_admin'
ON CONFLICT DO NOTHING;

INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT ar.id, ap.id
FROM admin_roles ar
JOIN admin_permissions ap
  ON (ap.resource, ap.action) IN (
      ('promos','view'),
      ('promos','approve'),
      ('promos','edit'),
      ('promos','deny'),
      ('promos','ai_review'),
      ('ai','classify'),
      ('ai','rewrite'),
      ('ai','review')
  )
WHERE ar.name = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT ar.id, ap.id
FROM admin_roles ar
JOIN admin_permissions ap
  ON (ap.resource, ap.action) IN (
      ('promos','view'),
      ('promos','approve'),
      ('ai','classify')
  )
WHERE ar.name = 'manager'
ON CONFLICT DO NOTHING;

INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT ar.id, ap.id
FROM admin_roles ar
JOIN admin_permissions ap
  ON (ap.resource, ap.action) IN (
      ('promos','view')
  )
WHERE ar.name = 'operator'
ON CONFLICT DO NOTHING;

INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT ar.id, ap.id
FROM admin_roles ar
JOIN admin_permissions ap
  ON (ap.resource, ap.action) IN (
      ('promos','view')
  )
WHERE ar.name = 'viewer'
ON CONFLICT DO NOTHING;

-- =====================================================
-- ROLE → PERMISSION MAPPING (TELEGRAM ROLES)
-- =====================================================

INSERT INTO telegram_role_permissions (role_id, permission_id)
SELECT tr.id, ap.id
FROM telegram_roles tr
JOIN admin_permissions ap
  ON (ap.resource, ap.action) IN (
      ('promos','view'),
      ('promos','approve'),
      ('promos','edit'),
      ('promos','deny'),
      ('promos','ai_review'),
      ('ai','classify'),
      ('ai','rewrite'),
      ('ai','review')
  )
WHERE tr.name = 'super_admin'
ON CONFLICT DO NOTHING;

INSERT INTO telegram_role_permissions (role_id, permission_id)
SELECT tr.id, ap.id
FROM telegram_roles tr
JOIN admin_permissions ap
  ON (ap.resource, ap.action) IN (
      ('promos','view'),
      ('promos','approve'),
      ('promos','edit'),
      ('promos','deny'),
      ('promos','ai_review'),
      ('ai','classify'),
      ('ai','rewrite'),
      ('ai','review')
  )
WHERE tr.name = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO telegram_role_permissions (role_id, permission_id)
SELECT tr.id, ap.id
FROM telegram_roles tr
JOIN admin_permissions ap
  ON (ap.resource, ap.action) IN (
      ('promos','view'),
      ('promos','approve')
  )
WHERE tr.name = 'moderator'
ON CONFLICT DO NOTHING;

INSERT INTO telegram_role_permissions (role_id, permission_id)
SELECT tr.id, ap.id
FROM telegram_roles tr
JOIN admin_permissions ap
  ON (ap.resource, ap.action) IN (
      ('promos','view')
  )
WHERE tr.name = 'trusted'
ON CONFLICT DO NOTHING;

-- =====================================================
-- END GCZ PROMO + AI + AFFILIATE PATCH
-- =====================================================