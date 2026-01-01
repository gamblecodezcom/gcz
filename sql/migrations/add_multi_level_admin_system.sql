-- ============================
-- MULTI-LEVEL ADMIN SYSTEM
-- ============================
-- This migration creates a comprehensive permission-based admin system
-- with roles, permissions, and user management

-- ============================
-- 1. ADMIN USERS TABLE
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
  created_by INTEGER REFERENCES admin_users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(active);

-- ============================
-- 2. ADMIN ROLES TABLE
-- ============================
CREATE TABLE IF NOT EXISTS admin_roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================
-- 3. ADMIN PERMISSIONS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS admin_permissions (
  id SERIAL PRIMARY KEY,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  UNIQUE(resource, action)
);

CREATE INDEX IF NOT EXISTS idx_admin_permissions_resource ON admin_permissions(resource);

-- ============================
-- 4. ADMIN ROLE PERMISSIONS (Junction Table)
-- ============================
CREATE TABLE IF NOT EXISTS admin_role_permissions (
  role_id INTEGER NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES admin_permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_role_permissions_role ON admin_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_admin_role_permissions_permission ON admin_role_permissions(permission_id);

-- ============================
-- 5. ADMIN USER ROLES (Junction Table)
-- ============================
CREATE TABLE IF NOT EXISTS admin_user_roles (
  user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
  assigned_by INTEGER REFERENCES admin_users(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_user_roles_user ON admin_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_roles_role ON admin_user_roles(role_id);

-- ============================
-- 6. ADMIN SESSIONS TABLE
-- ============================
CREATE TABLE IF NOT EXISTS admin_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);

-- ============================
-- 7. INSERT DEFAULT ROLES
-- ============================
INSERT INTO admin_roles (name, display_name, description, is_system_role) VALUES
  ('super_admin', 'Super Administrator', 'Full system access with all permissions', true),
  ('admin', 'Administrator', 'Full access to most features except user management', true),
  ('moderator', 'Moderator', 'Can moderate content, approve drops, manage raffles', true),
  ('editor', 'Editor', 'Can create and edit content, but cannot delete or approve', true),
  ('viewer', 'Viewer', 'Read-only access to admin panel', true)
ON CONFLICT (name) DO NOTHING;

-- ============================
-- 8. INSERT PERMISSIONS
-- ============================
INSERT INTO admin_permissions (resource, action, display_name, description) VALUES
  -- Users
  ('users', 'view', 'View Users', 'View user list and details'),
  ('users', 'create', 'Create Users', 'Create new user accounts'),
  ('users', 'update', 'Update Users', 'Update user information'),
  ('users', 'delete', 'Delete Users', 'Delete user accounts'),
  ('users', 'lock', 'Lock Users', 'Lock/unlock user accounts'),
  ('users', 'reset_pin', 'Reset PIN', 'Reset user PIN codes'),
  
  -- Raffles
  ('raffles', 'view', 'View Raffles', 'View raffle list and details'),
  ('raffles', 'create', 'Create Raffles', 'Create new raffles'),
  ('raffles', 'update', 'Update Raffles', 'Update raffle information'),
  ('raffles', 'delete', 'Delete Raffles', 'Delete raffles'),
  ('raffles', 'pick_winner', 'Pick Winners', 'Select raffle winners'),
  ('raffles', 'notify_winner', 'Notify Winners', 'Send winner notifications'),
  
  -- Affiliates
  ('affiliates', 'view', 'View Affiliates', 'View affiliate list and details'),
  ('affiliates', 'create', 'Create Affiliates', 'Create new affiliates'),
  ('affiliates', 'update', 'Update Affiliates', 'Update affiliate information'),
  ('affiliates', 'delete', 'Delete Affiliates', 'Delete affiliates'),
  
  -- Ads
  ('ads', 'view', 'View Ads', 'View ad list and details'),
  ('ads', 'create', 'Create Ads', 'Create new ads'),
  ('ads', 'update', 'Update Ads', 'Update ad information'),
  ('ads', 'delete', 'Delete Ads', 'Delete ads'),
  
  -- Drops
  ('drops', 'view', 'View Drops', 'View drops list and details'),
  ('drops', 'create', 'Create Drops', 'Create new drops'),
  ('drops', 'update', 'Update Drops', 'Update drop information'),
  ('drops', 'delete', 'Delete Drops', 'Delete drops'),
  ('drops', 'approve', 'Approve Drops', 'Approve pending drops'),
  ('drops', 'feature', 'Feature Drops', 'Feature/unfeature drops'),
  
  -- Settings
  ('settings', 'view', 'View Settings', 'View system settings'),
  ('settings', 'update', 'Update Settings', 'Update system settings'),
  
  -- Blacklist
  ('blacklist', 'view', 'View Blacklist', 'View blacklisted users'),
  ('blacklist', 'create', 'Add to Blacklist', 'Add users to blacklist'),
  ('blacklist', 'delete', 'Remove from Blacklist', 'Remove users from blacklist'),
  
  -- Live Banner
  ('live_banner', 'view', 'View Live Banner', 'View live banner settings'),
  ('live_banner', 'create', 'Create Live Banner', 'Create new live banners'),
  ('live_banner', 'update', 'Update Live Banner', 'Update live banner'),
  ('live_banner', 'delete', 'Delete Live Banner', 'Delete live banners'),
  
  -- Redirects
  ('redirects', 'view', 'View Redirects', 'View redirect list'),
  ('redirects', 'create', 'Create Redirects', 'Create new redirects'),
  ('redirects', 'update', 'Update Redirects', 'Update redirect information'),
  ('redirects', 'delete', 'Delete Redirects', 'Delete redirects'),
  
  -- Daily Drops
  ('daily_drops', 'view', 'View Daily Drops', 'View daily drops'),
  ('daily_drops', 'create', 'Create Daily Drops', 'Create new daily drops'),
  ('daily_drops', 'update', 'Update Daily Drops', 'Update daily drops'),
  ('daily_drops', 'delete', 'Delete Daily Drops', 'Delete daily drops'),
  
  -- Push Notifications
  ('push', 'view', 'View Push Notifications', 'View push notification history'),
  ('push', 'send', 'Send Push Notifications', 'Send push notifications'),
  
  -- Wheel
  ('wheel', 'view', 'View Wheel', 'View wheel configuration'),
  ('wheel', 'update', 'Update Wheel', 'Update wheel configuration'),
  
  -- Newsletter
  ('newsletter', 'view', 'View Newsletter', 'View newsletter campaigns'),
  ('newsletter', 'create', 'Create Newsletter', 'Create newsletter campaigns'),
  ('newsletter', 'update', 'Update Newsletter', 'Update newsletter campaigns'),
  ('newsletter', 'delete', 'Delete Newsletter', 'Delete newsletter campaigns'),
  ('newsletter', 'send', 'Send Newsletter', 'Send newsletter campaigns'),
  
  -- Telegram Bot
  ('telegram_bot', 'view', 'View Telegram Bot', 'View telegram bot settings'),
  ('telegram_bot', 'update', 'Update Telegram Bot', 'Update telegram bot settings'),
  
  -- Giveaways
  ('giveaways', 'view', 'View Giveaways', 'View giveaway list'),
  ('giveaways', 'create', 'Create Giveaways', 'Create new giveaways'),
  ('giveaways', 'update', 'Update Giveaways', 'Update giveaway information'),
  ('giveaways', 'delete', 'Delete Giveaways', 'Delete giveaways'),
  
  -- Analytics
  ('analytics', 'view', 'View Analytics', 'View analytics and reports'),
  
  -- Admin Users (meta permission)
  ('admin_users', 'view', 'View Admin Users', 'View admin user list'),
  ('admin_users', 'create', 'Create Admin Users', 'Create new admin users'),
  ('admin_users', 'update', 'Update Admin Users', 'Update admin user information'),
  ('admin_users', 'delete', 'Delete Admin Users', 'Delete admin users'),
  ('admin_users', 'manage_roles', 'Manage Roles', 'Assign roles to admin users'),
  
  -- Audit Logs
  ('audit_logs', 'view', 'View Audit Logs', 'View admin audit logs')
ON CONFLICT (resource, action) DO NOTHING;

-- ============================
-- 9. ASSIGN PERMISSIONS TO ROLES
-- ============================

-- Super Admin: All permissions
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM admin_roles WHERE name = 'super_admin'),
  id
FROM admin_permissions
ON CONFLICT DO NOTHING;

-- Admin: Most permissions except admin user management
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM admin_roles WHERE name = 'admin'),
  id
FROM admin_permissions
WHERE resource != 'admin_users'
ON CONFLICT DO NOTHING;

-- Moderator: View, approve, moderate content
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM admin_roles WHERE name = 'moderator'),
  id
FROM admin_permissions
WHERE (resource IN ('drops', 'raffles', 'users', 'blacklist') AND action IN ('view', 'approve', 'pick_winner', 'notify_winner', 'lock', 'create'))
   OR (resource = 'analytics' AND action = 'view')
   OR (resource = 'audit_logs' AND action = 'view')
ON CONFLICT DO NOTHING;

-- Editor: Create and update content, but not delete or approve
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM admin_roles WHERE name = 'editor'),
  id
FROM admin_permissions
WHERE action IN ('view', 'create', 'update')
  AND resource NOT IN ('admin_users', 'settings')
ON CONFLICT DO NOTHING;

-- Viewer: Read-only access
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM admin_roles WHERE name = 'viewer'),
  id
FROM admin_permissions
WHERE action = 'view'
ON CONFLICT DO NOTHING;

-- ============================
-- 10. CREATE DEFAULT SUPER ADMIN
-- ============================
-- Password: 'admin123' (should be changed immediately)
-- Hash: SHA-256 of 'admin123'
DO $$
DECLARE
  default_password_hash TEXT := '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
  super_admin_id INTEGER;
  super_admin_role_id INTEGER;
BEGIN
  -- Create super admin user if doesn't exist
  INSERT INTO admin_users (username, email, password_hash, full_name, active)
  VALUES ('admin', 'admin@gamblecodez.com', default_password_hash, 'System Administrator', true)
  ON CONFLICT (username) DO NOTHING
  RETURNING id INTO super_admin_id;
  
  -- Get super admin user ID if it already exists
  IF super_admin_id IS NULL THEN
    SELECT id INTO super_admin_id FROM admin_users WHERE username = 'admin';
  END IF;
  
  -- Get super admin role ID
  SELECT id INTO super_admin_role_id FROM admin_roles WHERE name = 'super_admin';
  
  -- Assign super admin role
  IF super_admin_id IS NOT NULL AND super_admin_role_id IS NOT NULL THEN
    INSERT INTO admin_user_roles (user_id, role_id)
    VALUES (super_admin_id, super_admin_role_id)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================
-- 11. UPDATE ADMIN AUDIT LOG
-- ============================
-- Add admin_user_id foreign key if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_audit_log' AND column_name = 'admin_user_id'
  ) THEN
    ALTER TABLE admin_audit_log 
    ADD COLUMN admin_user_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_admin_audit_log_user_id 
      ON admin_audit_log(admin_user_id);
  END IF;
END $$;

-- ============================
-- 12. CLEANUP EXPIRED SESSIONS FUNCTION
-- ============================
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM admin_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================
-- MIGRATION COMPLETE
-- ============================
-- Default super admin credentials:
-- Username: admin
-- Password: admin123
-- 
-- IMPORTANT: Change the default password immediately after migration!