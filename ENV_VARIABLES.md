# GambleCodez Environment Variables Documentation

This document describes all environment variables used by the GambleCodez system, including the new Discord intake pipeline.

## Quick Setup

1. Copy `.env.schema` to `.env`:
   ```bash
   cp .env.schema .env
   ```

2. Fill in your actual values in `.env`

3. Update PM2 with new environment variables:
   ```bash
   pm2 restart all --update-env
   ```

## Environment Variable Categories

### Core Environment
- `NODE_ENV` - Environment mode: `production` or `development`
- `PORT` - Backend API server port (default: 3000)
- `DOMAIN` - Primary domain (e.g., `https://gamblecodez.com`)
- `API_BASE_URL` - Base URL for API endpoints
- `BACKEND_API_URL` - Backend API URL (usually same as API_BASE_URL)
- `WEBAPP_BASE_URL` - Frontend webapp URL
- `SESSION_SECRET` - Secret for session management
- `CRON_TIMEZONE` - Timezone for cron jobs (e.g., `America/New_York`)
- `SYSTEM_NAME` - System name (default: `GambleCodez`)

### Database Configuration

#### Local PostgreSQL
- `DATABASE_URL` - PostgreSQL connection string
  - Format: `postgresql://username:password@localhost:5432/dbname`
- `PGPASSWORD` - PostgreSQL password (for CLI tools)

#### Neon SQL (AI / Analytics)
- `AI_AGENT_NEON_DB_URL` - Neon database connection string
- `AI_AGENT_NEON_PROJECT_ID` - Neon project ID
- `AI_AGENT_NEON_API_KEY` - Neon API key

### Telegram Bot

#### Core Bot Configuration
- `TELEGRAM_BOT_TOKEN` - **REQUIRED** - Bot token from @BotFather
- `TELEGRAM_BOT_USERNAME` - Bot username (e.g., `@GambleCodezCasinoDrops_bot`)
- `TELEGRAM_BOT_ID` - Bot ID (optional, for reference)

#### Webhook Configuration
- `TELEGRAM_WEBHOOK_URL` - Webhook URL (e.g., `https://gamblecodez.com/webhook`)
- `TELEGRAM_WEBHOOK_PORT` - Webhook port (default: 3001)

#### Channels & Groups
- `TELEGRAM_CHANNEL_ID` - Main channel ID for broadcasts
- `TELEGRAM_DAILIES_CHANNEL_ID` - Channel for daily promos (falls back to TELEGRAM_CHANNEL_ID)
- `TELEGRAM_CHANNEL_NAME` - Channel name (for display)
- `TELEGRAM_GROUP_ID` - Main group ID
- `TELEGRAM_GROUP_NAME` - Group name (for display)
- `TELEGRAM_ADMIN_GROUP_ID` - Admin group for notifications (optional)

#### Admin
- `TELEGRAM_ADMIN_ID` - Telegram user ID of admin

### Discord Bot (NEW)

#### Core Configuration
- `DISCORD_BOT_TOKEN` - **REQUIRED** - Discord bot token from Discord Developer Portal
- `DISCORD_GUILD_ID` - **REQUIRED** - Discord server (guild) ID

#### Channel Configuration
- `DISCORD_SC_LINKS_CHANNEL_ID` - **REQUIRED** - Channel ID for SC LINKS (must contain URLs)
- `DISCORD_SC_CODES_CHANNEL_ID` - **REQUIRED** - Channel ID for SC CODES (text-only codes)

#### Permissions (Optional)
- `DISCORD_ADMIN_ROLE_ID` - Admin role ID (for restricting admin commands, if needed)

### Promo Intake API

#### API Endpoints
- `PROMO_INTAKE_API_URL` - Base URL for promo intake (defaults to API_BASE_URL)
- `PROMO_REVIEW_API_URL` - Base URL for promo review (defaults to API_BASE_URL)
- `PROMO_APPROVED_FEED_URL` - Base URL for approved promos feed (defaults to API_BASE_URL)

**Note:** These are base URLs. The full endpoints are:
- `{PROMO_INTAKE_API_URL}/api/promos/intake`
- `{PROMO_REVIEW_API_URL}/api/promos/review`
- `{PROMO_APPROVED_FEED_URL}/api/promos/approved`

### Affiliate Configuration

#### File Paths
- `AFFILIATES_CSV_PATH` - Path to master affiliates CSV file
  - Default: `/var/www/html/gcz/master_affiliates.csv`

#### URL Configuration
- `REDIRECT_BASE_URL` - Base URL for affiliate redirects
- `AFFILIATE_BASE_URL` - Base URL for affiliate links (default: `https://gamblecodez.com`)
- `AFFILIATE_DEFAULT_REDIRECT` - Default redirect path (default: `/redirect`)

#### Database
- `AFFILIATE_LOOKUP_TABLE` - Database table name for affiliates (default: `affiliates_master`)

### AI Learning / Classification (Future)

- `PROMO_AI_LEARNING_ENABLED` - Enable AI learning from decisions (default: `true`)
- `PROMO_AI_MODEL` - AI model to use: `local`, `openai`, `anthropic`, etc. (default: `local`)
- `PROMO_AI_ACCEPTED_PATTERNS_FILE` - Path to accepted patterns JSON (default: `ai/accepted.json`)
- `PROMO_AI_REJECTED_PATTERNS_FILE` - Path to rejected patterns JSON (default: `ai/rejected.json`)

### Database / Storage

- `PROMO_DB_TABLE` - Database table name for promos (default: `promos`)
- `PROMO_DB_CONNECTION` - Database connection string (defaults to `AI_AGENT_NEON_DB_URL`)

### Admin Panel

- `ADMIN_PANEL_PROMO_REVIEW_ENABLED` - Enable promo review in admin panel (default: `true`)
- `ADMIN_PANEL_AFFILIATE_DROPDOWN` - Show affiliate dropdown in admin panel (default: `true`)
- `ADMIN_USERNAME` - Admin username for authentication
- `ADMIN_PASSWORD_HASH` - Bcrypt hash of admin password
- `ADMIN_TOKEN` - Admin authentication token

### System Paths

- `GCZ_ROOT` - Root directory of GambleCodez project (default: `/var/www/html/gcz`)
- `GCZ_FRONTEND_PATH` - Frontend directory path
- `GCZ_BACKEND_PATH` - Backend directory path
- `GCZ_ADMIN_PATH` - Admin panel directory path
- `GCZ_REDIRECT_PATH` - Python redirect service path

### Logging

- `LOG_LEVEL` - Logging level: `error`, `warn`, `info`, `debug` (default: `info`)
- `LOG_DIR` - Directory for log files (default: `/var/log/gamblecodez`)
- `BACKUP_DIR` - Directory for backups (default: `/var/www/html/gcz/backups`)

### Feature Flags

Enable/disable features:
- `FEATURE_AUTORESPONSES` - Auto-responses feature
- `FEATURE_CAMPAIGNS` - Campaigns feature
- `FEATURE_PAYOUTS` - Payouts feature
- `FEATURE_ANALYTICS` - Analytics feature
- `FEATURE_RAFFLES` - Raffles feature
- `FEATURE_BLACKLIST` - Blacklist feature
- `FEATURE_DAILY_CHECKINS` - Daily check-ins feature
- `FEATURE_REDIRECT_WARMUP` - Redirect warmup feature
- `FEATURE_DEGENDAILYSPIN` - Degen daily spin feature
- `FEATURE_SCHEDULER` - Scheduler feature
- `FEATURE_GIVEAWAYS` - Giveaways feature

### Optional Services

#### OpenAI
- `OPENAI_API_KEY` - OpenAI API key (for AI features, optional)

#### GitHub
- `GITHUB_USERNAME` - GitHub username
- `GITHUB_EMAIL` - GitHub email
- `GITHUB_REPO` - Repository name
- `GITHUB_REPO_URL` - Repository URL

## Environment Variable Loading

### Backend (Node.js)
The backend uses `dotenv` to load environment variables from `.env` file:
```javascript
import dotenv from 'dotenv';
dotenv.config();
```

### PM2 Configuration
PM2 can load environment variables from:
1. `env_file` in `ecosystem.config.cjs` (recommended)
2. `env` object in `ecosystem.config.cjs`
3. System environment variables

**Important:** After updating `.env`, restart PM2 processes:
```bash
pm2 restart all --update-env
```

### Python Services
Python services (like `redirect.py`) should read from system environment or a `.env` file using `python-dotenv`.

## Validation

### Required Variables
The following variables are **required** for the system to function:

**Backend:**
- `DATABASE_URL`
- `TELEGRAM_BOT_TOKEN`

**Discord Bot:**
- `DISCORD_BOT_TOKEN`
- `DISCORD_GUILD_ID`
- `DISCORD_SC_LINKS_CHANNEL_ID`
- `DISCORD_SC_CODES_CHANNEL_ID`

**Telegram Distribution:**
- `TELEGRAM_DAILIES_CHANNEL_ID` or `TELEGRAM_CHANNEL_ID`

### Optional Variables
All other variables have defaults or are optional features.

## Security Notes

1. **Never commit `.env` to git** - It contains secrets
2. **Use `.env.schema`** for documentation and templates
3. **Rotate secrets regularly** - Especially bot tokens and API keys
4. **Use environment-specific files** - `.env.production`, `.env.development`
5. **Restrict file permissions** - `chmod 600 .env`

## Troubleshooting

### Bot Not Starting
- Check that `TELEGRAM_BOT_TOKEN` or `DISCORD_BOT_TOKEN` is set
- Verify token is valid (not expired, not revoked)
- Check PM2 logs: `pm2 logs gcz-bot` or `pm2 logs gcz-discord`

### Database Connection Errors
- Verify `DATABASE_URL` format is correct
- Check PostgreSQL is running: `systemctl status postgresql`
- Test connection: `psql $DATABASE_URL`

### API Endpoints Not Working
- Verify `API_BASE_URL` matches your domain
- Check CORS settings if accessing from frontend
- Verify PM2 process is running: `pm2 status`

### Discord Bot Not Receiving Messages
- Verify bot has "Message Content Intent" enabled in Discord Developer Portal
- Check bot has permission to read messages in the channels
- Verify channel IDs are correct (use Discord's Developer Mode)

## Example .env File

See `.env.schema` for a complete template with all variables documented.
