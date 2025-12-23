# Affiliate Redirect System & Updates

This document describes the critical updates made to the GambleCodez system.

## 1. AUTH UPDATE

### Changes Made

- **Environment Variable**: Changed from `ADMIN_PASSWORD` to `ADMIN_PASSWORD_HASH`
- **Authentication**: Now uses bcrypt to verify password hashes instead of plain text comparison
- **Files Updated**:
  - `server.js`: Updated login endpoint to use bcrypt verification
  - `env_nginx/.env.example`: Updated to use `ADMIN_PASSWORD_HASH`

### Important Notes

⚠️ **Hash Format**: The system now expects a **bcrypt hash** (starts with `$2a$`, `$2b$`, or `$2y$`).

If you have an existing hash that starts with `$6$` (SHA-512 crypt format), you'll need to:
1. Generate a new bcrypt hash using the provided script
2. Update your `.env` file with the new hash

### Generating a Bcrypt Hash

Use the provided script to generate a bcrypt hash:

```bash
node scripts/generate_password_hash.js "YourPasswordHere"
```

This will output a hash like:
```
$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUV
```

Add this to your `.env` file:
```
ADMIN_PASSWORD_HASH=$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUV
```

### Current .env Value

The current value in `.env.example`:
```
ADMIN_PASSWORD_HASH=$6$tbYOaFpZFQjEhJdG$35pcET1BrzhGt.rASI1VqV4aWQclhFfE3nVTSqzDcqPFr4QIgwnD1SE2mNgz2NDiyrL9SpsLhLnVizQKfJYsD/
```

**⚠️ This is SHA-512 crypt format, not bcrypt. You need to generate a new bcrypt hash.**

## 2. AFFILIATE REDIRECT SYSTEM

### Overview

Every affiliate now automatically gets a redirect endpoint:
- `https://gamblecodez.com/r/<slug>`
- `https://gamblecodez.com/redirect/<slug>`

Where `<slug>` is automatically generated from the affiliate's handle or name.

### Features

- ✅ Automatic slug generation for all affiliates
- ✅ Blacklisted affiliates return 403 (not active)
- ✅ JSON API support (add `Accept: application/json` header)
- ✅ Structured logging for all redirect hits
- ✅ Fast lookup with indexed slug column

### Database Migration

Run the migration to add required fields:

```bash
psql $DATABASE_URL -f 004_add_redirect_fields.sql
```

Or manually:
```sql
ALTER TABLE affiliates ADD COLUMN slug VARCHAR(190);
ALTER TABLE affiliates ADD COLUMN final_redirect_url VARCHAR(500);
ALTER TABLE affiliates ADD COLUMN icon_url VARCHAR(500);
CREATE UNIQUE INDEX idx_affiliates_slug ON affiliates(slug);
```

### Redirect Endpoints

#### Browser Redirect (302)
```
GET /r/ace-casino
GET /redirect/ace-casino
```

Returns a 302 redirect to the affiliate's final URL.

#### JSON API
```
GET /r/ace-casino
Accept: application/json
```

Returns:
```json
{
  "success": true,
  "slug": "ace-casino",
  "final_url": "https://ace.casino/r/ACE001",
  "icon_url": "https://www.google.com/s2/favicons?domain=ace.casino&sz=64",
  "affiliate": {
    "id": 1,
    "name": "Ace",
    "handle": "ace-casino",
    "category": "casino",
    "level": 3,
    "description": "...",
    "tags": "casino",
    "status": "active",
    "region": "usa",
    "is_top_pick": true,
    "instant_redemption": false,
    "kyc_required": true
  }
}
```

### Logging

All redirect hits are logged with:
- Timestamp
- Slug
- Status (success, not_found, blacklisted, error)
- User IP
- Target URL
- Blacklist status

Example log:
```
[REDIRECT] 2025-12-22T16:22:37.123Z | slug=ace-casino | status=success | ip=192.168.1.1 | target=https://ace.casino/r/ACE001 | blacklisted=false
```

### Testing Redirects

Test all affiliate redirects:

```bash
npm run test:redirects
```

Or:
```bash
node scripts/test_redirects.js
```

This will:
- Test all non-blacklisted affiliates
- Check HTTP status codes
- Verify redirect chains
- Flag broken or unsafe domains
- Generate a summary report

## 3. ICON URL AUTOMATION

### Overview

Icon URLs are automatically generated for all affiliates using Google's favicon API:
```
https://www.google.com/s2/favicons?domain=example.com&sz=64
```

### Features

- ✅ Auto-generated for new affiliates
- ✅ Auto-generated when `final_redirect_url` changes
- ✅ Regeneratable on demand via API
- ✅ Overridable manually via admin panel

### API Endpoints

#### Regenerate Icon for Affiliate
```
POST /api/affiliates/:id/regenerate-icon
Authorization: (admin session)
```

### Scripts

#### Generate Icons for All Affiliates
```bash
npm run generate:icons
```

Or:
```bash
node scripts/generate_icon_urls.js
```

Options:
- `--force`: Regenerate all icon URLs (even if they exist)
- `--id=123`: Generate icon for specific affiliate ID

### How It Works

1. Extract domain from `final_redirect_url` or `referral_url`
2. Generate Google favicon API URL
3. Store in `icon_url` column
4. Use in redirect JSON responses and admin panel

### Manual Override

You can manually set `icon_url` via the admin panel or API. The system will not auto-regenerate if manually set (unless you use the regenerate endpoint).

## Implementation Details

### New Files Created

- `routes/affiliates.js` - Complete CRUD API for affiliates
- `004_add_redirect_fields.sql` - Database migration
- `scripts/test_redirects.js` - Redirect testing script
- `scripts/generate_icon_urls.js` - Icon URL generation script
- `scripts/generate_password_hash.js` - Bcrypt hash generator

### Files Modified

- `server.js` - Added redirect endpoints, updated auth
- `package.json` - Added new npm scripts
- `env_nginx/.env.example` - Updated to use `ADMIN_PASSWORD_HASH`

### Database Schema Changes

New columns in `affiliates` table:
- `slug` VARCHAR(190) UNIQUE - For redirect URLs
- `final_redirect_url` VARCHAR(500) - Canonical redirect URL
- `icon_url` VARCHAR(500) - Favicon/icon URL

## Next Steps

1. **Generate Bcrypt Hash**: Run `node scripts/generate_password_hash.js "YourPassword"` and update `.env`
2. **Run Migration**: Execute `004_add_redirect_fields.sql` on your database
3. **Generate Icons**: Run `npm run generate:icons` to populate icon URLs for existing affiliates
4. **Test Redirects**: Run `npm run test:redirects` to verify all redirects work
5. **Update Environment**: Ensure `ADMIN_PASSWORD_HASH` is set in your production `.env` file

## Verification

### Test Admin Login
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"GambleCodez","password":"YourPassword"}'
```

### Test Redirect
```bash
# Browser redirect
curl -L http://localhost:3000/r/ace-casino

# JSON response
curl -H "Accept: application/json" http://localhost:3000/r/ace-casino
```

### Test Icon Generation
```bash
npm run generate:icons
```

## Troubleshooting

### Admin Login Fails
- Verify `ADMIN_PASSWORD_HASH` is set in `.env`
- Ensure hash is bcrypt format (starts with `$2a$`, `$2b$`, or `$2y$`)
- Generate new hash if needed: `node scripts/generate_password_hash.js "password"`

### Redirect Returns 404
- Check that affiliate has a `slug` value
- Verify affiliate status is not 'banned' or 'paused'
- Run migration if `slug` column doesn't exist

### Icon URLs Not Generated
- Run `npm run generate:icons`
- Check that `referral_url` or `final_redirect_url` is set
- Verify domain extraction is working
