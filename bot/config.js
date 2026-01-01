import dotenv from 'dotenv';
dotenv.config();

// --- Super Admin (Hard‑coded fallback for safety) ---
const SUPER_ADMIN_ID = '6668510825'; // Tyler's master admin ID

export const config = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_ADMIN_ID: process.env.TELEGRAM_ADMIN_ID || SUPER_ADMIN_ID,
  TELEGRAM_CHANNEL_ID: process.env.TELEGRAM_CHANNEL_ID,
  TELEGRAM_GROUP_ID: process.env.TELEGRAM_GROUP_ID,

  // API + Backend
  API_BASE_URL:
    process.env.API_BASE_URL ||
    process.env.BACKEND_API_URL ||
    'https://gamblecodez.com',

  // Environment
  NODE_ENV: process.env.NODE_ENV || 'production',

  // Optional future‑proof fields
  DROPS_REVIEW_WEBHOOK: process.env.DROPS_REVIEW_WEBHOOK || null,
  AI_PROMO_VALIDATION: process.env.AI_PROMO_VALIDATION || 'disabled',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

// --- Required Vars Validation ---
if (!config.TELEGRAM_BOT_TOKEN) {
  throw new Error('❌ TELEGRAM_BOT_TOKEN is required in environment variables');
}

// Optional warnings (non‑fatal)
if (!process.env.TELEGRAM_ADMIN_ID) {
  console.warn(
    `⚠️ TELEGRAM_ADMIN_ID not set — using SUPER_ADMIN_ID (${SUPER_ADMIN_ID})`
  );
}

if (!config.TELEGRAM_CHANNEL_ID) {
  console.warn('⚠️ TELEGRAM_CHANNEL_ID not set');
}

if (!config.TELEGRAM_GROUP_ID) {
  console.warn('⚠️ TELEGRAM_GROUP_ID not set');
}
