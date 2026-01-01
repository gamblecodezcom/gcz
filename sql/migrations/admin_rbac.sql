-- ===========================
-- ADMIN RBAC MIGRATION (0–5)
-- ===========================

-- ---------------------------
-- ROLES TABLE
-- ---------------------------
CREATE TABLE IF NOT EXISTS admin_roles (
    id SMALLINT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    level SMALLINT NOT NULL DEFAULT 1 CHECK (level BETWEEN 0 AND 5)
);

-- ---------------------------
-- ADD role_level TO admin_users
-- ---------------------------
ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS role_level SMALLINT NOT NULL DEFAULT 1 CHECK (role_level BETWEEN 0 AND 5);

-- ---------------------------
-- INSERT ROLES 0–5
-- ---------------------------
INSERT INTO admin_roles (id, name, display_name, description, level) VALUES
(0,'none','No Access','No admin access',0),
(1,'viewer','Viewer','Read-only admin access',1),
(2,'operator','Operator','Can run ops, no config',2),
(3,'manager','Manager','Manage content and users',3),
(4,'admin','Admin','Full admin except system/owners',4),
(5,'super_admin','Super Admin','Root level, full system control',5)
ON CONFLICT (id) DO NOTHING;

-- ===========================
-- PERMISSIONS
-- ===========================

CREATE TABLE IF NOT EXISTS admin_permissions (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT
);

INSERT INTO admin_permissions (name, description) VALUES
('drops:view','View drops'),
('drops:approve','Approve drops'),
('daily_drops:view','View daily drops'),
('wheel:view','View wheel logs'),
('raffles:view','View raffles'),
('affiliates:view','View affiliates'),
('users:view','View users'),
('admin_users:view','View admin users'),
('redirects:view','View redirects'),
('ads:view','View ads'),
('blacklist:view','View blacklist'),
('live_banner:view','View live banner'),
('push:view','Send push notifications'),
('settings:view','View settings'),
('audit_logs:view','View audit logs'),
('newsletter:view','View newsletter'),
('telegram_bot:view','View Telegram bot')
ON CONFLICT (name) DO NOTHING;

-- ===========================
-- ROLE → PERMISSION MAPPING
-- ===========================

CREATE TABLE IF NOT EXISTS admin_role_permissions (
    role_id SMALLINT REFERENCES admin_roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES admin_permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Super Admin (5) gets ALL permissions
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT 5, id FROM admin_permissions
ON CONFLICT DO NOTHING;

-- Admin (4) gets all except admin_users:view
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT 4, id FROM admin_permissions
WHERE name NOT IN ('admin_users:view')
ON CONFLICT DO NOTHING;

-- Manager (3)
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT 3, id FROM admin_permissions
WHERE name IN (
    'drops:view','drops:approve','daily_drops:view','raffles:view',
    'affiliates:view','users:view','redirects:view','ads:view',
    'blacklist:view','live_banner:view','push:view','newsletter:view'
)
ON CONFLICT DO NOTHING;

-- Operator (2)
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT 2, id FROM admin_permissions
WHERE name IN (
    'drops:view','daily_drops:view','raffles:view','affiliates:view','users:view'
)
ON CONFLICT DO NOTHING;

-- Viewer (1)
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT 1, id FROM admin_permissions
WHERE name IN (
    'drops:view','daily_drops:view','raffles:view','affiliates:view'
)
ON CONFLICT DO NOTHING;

-- ===========================
-- USER → ROLE MAPPING
-- ===========================

CREATE TABLE IF NOT EXISTS admin_user_roles (
    user_id BIGINT REFERENCES admin_users(id) ON DELETE CASCADE,
    role_id SMALLINT REFERENCES admin_roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Bootstrap super admin (user_id = 1)
INSERT INTO admin_user_roles (user_id, role_id)
VALUES (1, 5)
ON CONFLICT DO NOTHING;

UPDATE admin_users SET role_level = 5 WHERE id = 1;

-- ===========================
-- TELEGRAM ROLES
-- ===========================

CREATE TABLE IF NOT EXISTS telegram_roles (
    id SMALLINT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    level SMALLINT NOT NULL CHECK (level BETWEEN 0 AND 5)
);

INSERT INTO telegram_roles (id, name, description, level) VALUES
(0,'none','No Telegram privileges',0),
(1,'member','Standard Telegram user',1),
(2,'trusted','Trusted user with helper commands',2),
(3,'moderator','Telegram group moderator',3),
(4,'admin','Telegram bot admin',4),
(5,'super_admin','Root Telegram admin',5)
ON CONFLICT (id) DO NOTHING;

-- ===========================
-- TELEGRAM USER → ROLE MAPPING
-- ===========================

CREATE TABLE IF NOT EXISTS telegram_user_roles (
    telegram_id BIGINT PRIMARY KEY,
    role_id SMALLINT REFERENCES telegram_roles(id) ON DELETE CASCADE
);

-- Bootstrap your Telegram super admin
INSERT INTO telegram_user_roles (telegram_id, role_id)
VALUES (6668510825, 5)
ON CONFLICT (telegram_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS telegram_role_permissions (
    role_id SMALLINT REFERENCES telegram_roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES admin_permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Super Admin gets ALL permissions
INSERT INTO telegram_role_permissions (role_id, permission_id)
SELECT 5, id FROM admin_permissions
ON CONFLICT DO NOTHING;

-- Admin (4)
INSERT INTO telegram_role_permissions (role_id, permission_id)
SELECT 4, id FROM admin_permissions WHERE name NOT IN ('admin_users:view')
ON CONFLICT DO NOTHING;

-- Moderator (3)
INSERT INTO telegram_role_permissions (role_id, permission_id)
SELECT 3, id FROM admin_permissions WHERE name IN (
    'drops:view','drops:approve','daily_drops:view','raffles:view',
    'affiliates:view','users:view','redirects:view','ads:view',
    'blacklist:view','live_banner:view','push:view','newsletter:view'
)
ON CONFLICT DO NOTHING;

-- Trusted (2)
INSERT INTO telegram_role_permissions (role_id, permission_id)
SELECT 2, id FROM admin_permissions WHERE name IN (
    'drops:view','daily_drops:view','raffles:view','affiliates:view','users:view'
)
ON CONFLICT DO NOTHING;

-- Member (1)
INSERT INTO telegram_role_permissions (role_id, permission_id)
SELECT 1, id FROM admin_permissions WHERE name IN (
    'drops:view','daily_drops:view','raffles:view','affiliates:view'
)
ON CONFLICT DO NOTHING;

SELECT EXISTS (
    SELECT 1
    FROM telegram_user_roles tur
    JOIN telegram_role_permissions trp ON trp.role_id = tur.role_id
    JOIN admin_permissions p ON p.id = trp.permission_id
    WHERE tur.telegram_id = $1
    AND p.name = $2
);

CREATE OR REPLACE FUNCTION sync_admin_to_telegram()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE telegram_user_roles
    SET role_id = NEW.role_level
    WHERE telegram_id = NEW.telegram_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_admin_role
AFTER UPDATE OF role_level ON admin_users
FOR EACH ROW
WHEN (NEW.telegram_id IS NOT NULL)
EXECUTE FUNCTION sync_admin_to_telegram();

CREATE TABLE IF NOT EXISTS site_admin_roles (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT
);

INSERT INTO site_admin_roles (name, description) VALUES
('viewer','Can view site stats'),
('editor','Can edit site info'),
('manager','Full control of site'),
('owner','Owns the site entry')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS site_admin_users (
    site_id INTEGER NOT NULL,
    user_id BIGINT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES site_admin_roles(id),
    PRIMARY KEY (site_id, user_id)
);
-- ===========================
-- END OF MIGRATION
-- ===========================