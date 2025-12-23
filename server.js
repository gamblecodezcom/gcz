require('dotenv').config();
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const { Telegraf } = require('telegraf');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== ENV VALIDATION ==========
const REQUIRED_ENV = ['SESSION_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD_HASH', 'WEBAPP_BASE_URL', 'TELEGRAM_BOT_TOKEN'];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`❌ Missing environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

// ========== MIDDLEWARE ==========
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.WEBAPP_BASE_URL,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 86400000 // 24h
  }
}));

// ========== STATIC ADMIN PANEL ==========
app.use(express.static(path.join(__dirname, 'admin')));

// ========== STATIC FRONTEND ==========
app.use(express.static(path.join(__dirname, 'frontend')));

// Serve top-pick page
app.get('/top-pick', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'top-pick.html'));
});

// ========== HEALTH CHECK ==========
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ========== REDIRECT SYSTEM ==========
// Helper function to check if affiliate is current Top Pick
async function isCurrentTopPick(affiliateId) {
  const db = require('./db');
  const config = await db.queryOne(
    'SELECT affiliate_id FROM top_pick_config WHERE is_active = true AND affiliate_id = $1 ORDER BY updated_at DESC LIMIT 1',
    [affiliateId]
  );
  return !!config;
}

// Redirect endpoint: GET /r/:slug or GET /redirect/:slug
app.get(['/r/:slug', '/redirect/:slug'], async (req, res) => {
  const db = require('./db');
  const slug = req.params.slug;
  const userIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
  const timestamp = new Date().toISOString();
  const isJSONRequest = req.headers.accept && req.headers.accept.includes('application/json');

  try {
    const affiliate = await db.queryOne(
      'SELECT * FROM affiliates WHERE slug = $1',
      [slug]
    );

    if (!affiliate) {
      // Log not found
      console.log(`[REDIRECT] ${timestamp} | slug=${slug} | status=not_found | ip=${userIP}`);
      if (isJSONRequest) {
        return res.status(404).json({
          success: false,
          slug,
          status: 'not_found',
          message: 'Affiliate not found'
        });
      }
      return res.status(404).send('Affiliate not found');
    }

    // Check if blacklisted/banned
    if (affiliate.status === 'banned' || affiliate.status === 'paused') {
      // Log blacklisted
      console.log(`[REDIRECT] ${timestamp} | slug=${slug} | status=blacklisted | ip=${userIP} | target=${affiliate.final_redirect_url || affiliate.referral_url}`);
      if (isJSONRequest) {
        return res.status(403).json({
          success: false,
          slug,
          status: 'blacklisted',
          message: 'This affiliate is not active'
        });
      }
      return res.status(403).send('This affiliate is not active');
    }

    const finalUrl = affiliate.final_redirect_url || affiliate.referral_url;
    
    // Check if this is the current Top Pick
    const isCurrentTop = await isCurrentTopPick(affiliate.id);
    
    // Log successful redirect
    console.log(`[REDIRECT] ${timestamp} | slug=${slug} | status=success | ip=${userIP} | target=${finalUrl} | blacklisted=false`);

    // For JSON requests, return metadata
    if (isJSONRequest) {
      return res.json({
        success: true,
        slug,
        final_url: finalUrl,
        icon_url: affiliate.icon_url,
        affiliate: {
          id: affiliate.id,
          name: affiliate.name,
          handle: affiliate.handle,
          category: affiliate.tags,
          level: affiliate.level,
          description: affiliate.description,
          tags: affiliate.tags,
          status: affiliate.status,
          region: affiliate.region,
          is_top_pick: affiliate.is_top_pick,
          is_current_top_pick: isCurrentTop,
          instant_redemption: affiliate.instant_redemption,
          kyc_required: affiliate.kyc_required
        }
      });
    }

    // For normal requests, perform 302 redirect
    res.redirect(302, finalUrl);
  } catch (error) {
    console.error(`[REDIRECT] ${timestamp} | slug=${slug} | status=error | ip=${userIP} | error=${error.message}`);
    if (isJSONRequest) {
      return res.status(500).json({
        success: false,
        slug,
        status: 'error',
        message: 'Internal server error'
      });
    }
    res.status(500).send('Internal server error');
  }
});

// ========== AUTH ROUTES ==========
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  
  if (!adminUsername || !adminPasswordHash) {
    return res.status(500).json({ success: false, message: 'Server configuration error' });
  }
  
  if (username === adminUsername) {
    // Verify password against hash
    try {
      const isValid = await bcrypt.compare(password, adminPasswordHash);
      if (isValid) {
        req.session.authenticated = true;
        req.session.username = username;
        return res.json({ success: true, message: 'Login successful' });
      }
    } catch (error) {
      console.error('Password verification error:', error);
    }
  }
  res.status(401).json({ success: false, message: 'Invalid credentials' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: 'Logged out' });
  });
});

app.get('/api/session', (req, res) => {
  res.json({
    authenticated: !!req.session.authenticated,
    username: req.session.username || null
  });
});

// ========== API ROUTES ==========
app.use('/api/affiliates', require('./routes/affiliates'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/conversions', require('./routes/conversions'));
app.use('/api/payouts', require('./routes/payouts'));
app.use('/api/broadcasts', require('./routes/broadcasts'));
app.use('/api/autoresponses', require('./routes/autoresponses'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/top-pick', require('./routes/top-pick'));
app.use('/api/ads', require('./routes/ads'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/data-ripper', require('./routes/data-ripper'));
app.use('/api/raffles', require('./routes/raffles'));

// ========== TELEGRAM BOT ==========
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
require('./bot/bot')(bot);

// Telegram Webhook
app.post('/webhook', (req, res) => {
  bot.handleUpdate(req.body, res);
});

// ========== ERROR HANDLING ==========
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`🚀 GambleCodez Admin API running on port ${PORT}`);
  console.log(`📊 Admin Panel: ${process.env.WEBAPP_BASE_URL}/admin`);
  console.log(`🤖 Telegram Webhook: ${process.env.WEBAPP_BASE_URL}/webhook`);
});

module.exports = app;
