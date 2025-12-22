# GambleCodez Admin Portal + Telegram Bot

Complete admin panel and Telegram bot system for managing GambleCodez affiliate network.

## Features

- 🔐 Secure admin authentication
- 👥 Affiliate management (CRUD)
- 📢 Telegram bot with full command suite
- 💰 Campaign & payout management
- 🤖 Auto-response system
- 📊 Real-time analytics
- ⚙️ Feature flags & system controls

## Installation

### 1. Clone & Install

```bash
cd /root/upload/sites/gamblecodez
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
nano .env  # Edit with your credentials
```

### 3. Setup Database

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE gamblecodez CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Create user
mysql -u root -p -e "CREATE USER 'gcadmin'@'localhost' IDENTIFIED BY 'your_password';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON gamblecodez.* TO 'gcadmin'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"

# Run migrations
npm run migrate
```

### 4. Configure Nginx

```bash
# Copy nginx config
cp nginx.conf /etc/nginx/sites-available/gamble-codez.com
ln -s /etc/nginx/sites-available/gamble-codez.com /etc/nginx/sites-enabled/

# Test and reload
nginx -t
systemctl reload nginx
```

### 5. Set Telegram Webhook

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -d "url=https://gamble-codez.com/webhook" \
  -d "max_connections=100"
```

### 6. Start Services

```bash
# Development
npm run dev

# Production with PM2
npm run pm2:start
```

## Project Structure

```
gamblecodez/
├── admin/              # Admin panel (static)
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── api/                # REST API
│   ├── routes/
│   │   ├── affiliates.js
│   │   ├── campaigns.js
│   │   ├── broadcasts.js
│   │   ├── autoresponses.js
│   │   └── settings.js
│   ├── middleware/
│   │   └── auth.js
│   └── db.js
├── bot/                # Telegram bot
│   ├── bot.js
│   └── helpers.js
├── sql/                # Database migrations
│   ├── 001_init.sql
│   ├── 002_indexes.sql
│   └── 003_seed.sql
├── scripts/
│   └── migrate.js
├── server.js           # Main server
├── pm2.config.cjs      # PM2 config
├── .env.example
├── package.json
└── README.md
```

## Admin Panel

Access: https://gamble-codez.com/admin

**Default Credentials:**
- Username: `admin`
- Password: `Dope!1988`

## Telegram Bot Commands

### User Commands
- `/start` - Welcome & onboarding
- `/menu` - Browse categories
- `/help` - Command help
- `/faucet` - Faucet casinos
- `/crypto` - Crypto casinos
- `/sweeps` - US Sweeps
- `/instant` - Instant redemption
- `/lootbox` - Lootbox sites
- `/recent` - Recently added
- `/subscribe` - Newsletter opt-in
- `/region` - Switch US/Non-US
- `/link` - Get referral links

### Admin Commands
- `/admin on|off` - Toggle admin mode
- `/broadcast` - Send broadcast
- `/responses` - Manage auto-responses
- `/affiliates` - Manage affiliates
- `/stats` - View statistics
- `/featureflags` - Toggle features
- `/reload` - Reload services

## API Endpoints

### Authentication
- `POST /api/login` - Admin login
- `POST /api/logout` - Logout
- `GET /api/session` - Check session

### Affiliates
- `GET /api/affiliates` - List all
- `GET /api/affiliates/:id` - Get one
- `POST /api/affiliates` - Create
- `PUT /api/affiliates/:id` - Update
- `DELETE /api/affiliates/:id` - Delete
- `PATCH /api/affiliates/:id/status` - Toggle status

### Campaigns
- `GET /api/campaigns` - List all
- `POST /api/campaigns` - Create
- `PUT /api/campaigns/:id` - Update
- `DELETE /api/campaigns/:id` - Delete

### Broadcasts
- `GET /api/broadcasts` - List all
- `POST /api/broadcasts` - Create
- `POST /api/broadcasts/:id/send` - Send now
- `POST /api/broadcasts/:id/schedule` - Schedule

### Settings
- `GET /api/settings` - Get all
- `PUT /api/settings` - Update
- `GET /api/settings/features` - Feature flags
- `PUT /api/settings/features` - Update flags

## Maintenance

### View Logs
```bash
# PM2 logs
pm2 logs gamblecodez

# System logs
tail -f /var/log/gamblecodez/app.log
```

### Restart Services
```bash
# Restart all
pm2 restart gamblecodez

# Restart specific process
pm2 restart gamblecodez-api
pm2 restart gamblecodez-bot
```

### Database Backup
```bash
mysqldump -u gcadmin -p gamblecodez > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Support

For issues or questions, contact the development team.
