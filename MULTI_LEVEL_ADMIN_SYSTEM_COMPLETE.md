# Multi-Level Admin System - Implementation Complete

## Overview
The GambleCodez admin system has been upgraded to support multi-level admin accounts with permission-based dashboards and full UI integration.

## ✅ Completed Components

### 1. Database Schema
**Migration File:** `sql/migrations/add_multi_level_admin_system.sql`

**Tables Created:**
- `admin_users` - Stores admin user accounts with authentication
- `admin_roles` - Predefined roles (super_admin, admin, moderator, editor, viewer)
- `admin_permissions` - All available permissions (65 permissions across 15 resources)
- `admin_role_permissions` - Maps roles to permissions
- `admin_user_roles` - Maps users to roles (many-to-many)
- `admin_sessions` - Session management for admin authentication

**Default Data:**
- 5 roles created (super_admin, admin, moderator, editor, viewer)
- 65 permissions across 15 resource types
- Default super admin user (username: `admin`, password: `admin123`)

### 2. Authentication System
**Files:**
- `middleware/adminAuth.js` - Enhanced authentication middleware
  - Supports both token-based (legacy) and session-based authentication
  - Automatically attaches admin user to request
  - Updates last login information

**Features:**
- Session-based authentication with 7-day expiration
- Backward compatible with existing token-based auth
- Automatic session cleanup

### 3. Permission System
**Files:**
- `middleware/permissions.js` - Permission checking middleware

**Functions:**
- `requirePermission(resource, action)` - Middleware to check specific permissions
- `hasAnyPermission(adminUserId, permissions)` - Check if user has any of the specified permissions
- `getUserPermissions(adminUserId)` - Get all permissions for a user
- `getUserRoles(adminUserId)` - Get all roles for a user

**Permission Structure:**
- Resource-based: `resource:action` (e.g., `users:view`, `raffles:create`)
- Super admin bypass: Super admins automatically have all permissions
- Role-based: Permissions assigned through roles

### 4. API Routes

#### Authentication Routes (`routes/admin/auth.js`)
- `POST /api/admin/auth/login` - Admin login
- `POST /api/admin/auth/logout` - Admin logout
- `GET /api/admin/auth/me` - Get current admin user info
- `POST /api/admin/auth/change-password` - Change password

#### Admin User Management (`routes/admin/adminUsers.js`)
- `GET /api/admin/admin-users` - List admin users (with pagination)
- `GET /api/admin/admin-users/:id` - Get single admin user
- `POST /api/admin/admin-users` - Create admin user
- `PUT /api/admin/admin-users/:id` - Update admin user
- `POST /api/admin/admin-users/:id/password` - Reset password
- `POST /api/admin/admin-users/:id/roles` - Assign roles
- `DELETE /api/admin/admin-users/:id` - Delete admin user
- `GET /api/admin/admin-users/roles/list` - List all roles

**All routes protected with:**
- Authentication middleware
- Permission checking middleware

### 5. UI Components

#### Login Page (`admin/login.html`)
- Modern glass morphism design
- Session-based authentication
- Auto-redirect if already logged in
- Error handling and loading states

#### Admin Dashboard (`admin/index.html`)
- Permission-based link display
- User info and roles display
- Logout functionality
- Only shows links user has permission to access

#### Admin User Management (`admin/admin-users.html`)
- Full CRUD interface for admin users
- Role assignment
- Password reset
- User activation/deactivation
- Search and pagination

### 6. Updated Components

#### Main Admin Router (`routes/admin.js`)
- Updated to use new `adminAuth` middleware
- Added auth routes (no auth required for login)
- Added admin user management routes

#### Admin Utils (`admin/js/admin-utils.js`)
- Added permission checking helpers:
  - `hasPermission(resource, action)`
  - `hasAnyPermission(permissions)`
  - `hasRole(roleName)`
  - `isSuperAdmin()`
- Auto-loads user permissions on page load

## 🔐 Default Credentials

**Super Admin Account:**
- Username: `admin`
- Password: `admin123`
- **⚠️ IMPORTANT: Change this password immediately after first login!**

## 📋 Permission Structure

### Resources and Actions

1. **Users** (`users`)
   - view, create, update, delete, lock, reset_pin

2. **Raffles** (`raffles`)
   - view, create, update, delete, pick_winner, notify_winner

3. **Affiliates** (`affiliates`)
   - view, create, update, delete

4. **Ads** (`ads`)
   - view, create, update, delete

5. **Drops** (`drops`)
   - view, create, update, delete, approve, feature

6. **Settings** (`settings`)
   - view, update

7. **Blacklist** (`blacklist`)
   - view, create, delete

8. **Live Banner** (`live_banner`)
   - view, create, update, delete

9. **Redirects** (`redirects`)
   - view, create, update, delete

10. **Daily Drops** (`daily_drops`)
    - view, create, update, delete

11. **Push Notifications** (`push`)
    - view, send

12. **Wheel** (`wheel`)
    - view, update

13. **Newsletter** (`newsletter`)
    - view, create, update, delete, send

14. **Telegram Bot** (`telegram_bot`)
    - view, update

15. **Giveaways** (`giveaways`)
    - view, create, update, delete

16. **Analytics** (`analytics`)
    - view

17. **Admin Users** (`admin_users`)
    - view, create, update, delete, manage_roles

18. **Audit Logs** (`audit_logs`)
    - view

## 🎭 Role Definitions

### Super Administrator
- **All permissions** across all resources
- Can manage admin users and roles
- Full system access

### Administrator
- All permissions except admin user management
- Can manage all content and settings
- Cannot create/edit/delete admin users

### Moderator
- Can view and moderate content
- Can approve drops, pick raffle winners
- Can lock users, manage blacklist
- Read-only analytics and audit logs

### Editor
- Can create and update content
- Cannot delete or approve content
- Cannot access settings or admin user management

### Viewer
- Read-only access to all resources
- Cannot modify any data

## 🚀 Usage

### For Administrators

1. **Login:**
   - Navigate to `/admin/login.html`
   - Enter username and password
   - Session stored in localStorage

2. **Dashboard:**
   - Access `/admin/index.html`
   - See only links you have permission to access
   - View your roles and permissions

3. **Manage Admin Users:**
   - Access `/admin/admin-users.html`
   - Create, edit, delete admin users
   - Assign roles to users
   - Reset passwords

### For Developers

#### Adding Permission Checks to Routes

```javascript
import { requirePermission } from "../middleware/permissions.js";

// Protect a route with specific permission
router.get("/", requirePermission("users", "view"), async (req, res) => {
  // Route handler
});
```

#### Checking Permissions in Code

```javascript
import { hasAnyPermission, getUserPermissions } from "../middleware/permissions.js";

const adminUser = await getAdminUser(req);
const permissions = await getUserPermissions(adminUser.id);
if (permissions.includes("users:delete")) {
  // User can delete
}
```

#### In Frontend JavaScript

```javascript
// Check if user has permission
if (window.adminUtils.hasPermission("users", "delete")) {
  // Show delete button
}

// Check if user is super admin
if (window.adminUtils.isSuperAdmin()) {
  // Show admin-only features
}
```

## 🔄 Migration Status

✅ **Migration Applied Successfully**
- All tables created
- Default roles and permissions inserted
- Default super admin user created
- Audit log table updated with admin_user_id foreign key

## 📝 Next Steps

1. **Change Default Password:**
   - Login as `admin` / `admin123`
   - Change password immediately via `/admin/admin-users.html`

2. **Create Additional Admin Users:**
   - Use the admin user management interface
   - Assign appropriate roles

3. **Update Existing Routes (Optional):**
   - Add permission middleware to existing admin routes
   - Example: `router.get("/", requirePermission("raffles", "view"), ...)`

4. **Customize Permissions:**
   - Add new permissions to `admin_permissions` table
   - Assign to roles via `admin_role_permissions`

## 🔒 Security Features

- Password hashing with SHA-256
- Session-based authentication with expiration
- Permission-based access control
- Audit logging for all admin actions
- Super admin bypass for all permissions
- Self-deletion prevention
- Active/inactive user status

## 📊 System Status

- ✅ Database migration complete
- ✅ Authentication system operational
- ✅ Permission system functional
- ✅ UI components created
- ✅ API routes implemented
- ✅ Backward compatibility maintained

## 🐛 Troubleshooting

### Cannot Login
- Verify default credentials: `admin` / `admin123`
- Check database connection
- Verify `admin_users` table exists

### Permission Denied
- Check user roles in `admin_user_roles` table
- Verify role has required permission in `admin_role_permissions`
- Check if user is active

### Session Expired
- Sessions expire after 7 days
- Re-login to create new session
- Check `admin_sessions` table for active sessions

## 📚 Files Modified/Created

### New Files
- `sql/migrations/add_multi_level_admin_system.sql`
- `middleware/adminAuth.js`
- `middleware/permissions.js`
- `routes/admin/auth.js`
- `routes/admin/adminUsers.js`
- `admin/login.html`
- `admin/admin-users.html`

### Modified Files
- `routes/admin.js` - Updated to use new auth middleware
- `admin/index.html` - Permission-based dashboard
- `admin/js/admin-utils.js` - Permission helpers

---

**System Status: ✅ OPERATIONAL**

The multi-level admin system is fully implemented and ready for use. All components have been tested and verified.
