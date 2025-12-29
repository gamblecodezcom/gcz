import dotenv from 'dotenv';
dotenv.config();

export const config = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_ADMIN_ID: process.env.TELEGRAM_ADMIN_ID,
  TELEGRAM_CHANNEL_ID: process.env.TELEGRAM_CHANNEL_ID,
  TELEGRAM_GROUP_ID: process.env.TELEGRAM_GROUP_ID,
  API_BASE_URL: process.env.API_BASE_URL || process.env.BACKEND_API_URL || 'https://gamblecodez.com',
  NODE_ENV: process.env.NODE_ENV || 'production',
};

if (!config.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required in environment variables');
}
