import dotenv from 'dotenv';
dotenv.config();

export const config = {
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  DISCORD_SERVER_ID: process.env.DISCORD_SERVER_ID || process.env.DISCORD_GUILD_ID,
  DISCORD_SC_LINKS_CHANNEL_ID: process.env.DISCORD_SC_LINKS_CHANNEL_ID,
  DISCORD_SC_CODES_CHANNEL_ID: process.env.DISCORD_SC_CODES_CHANNEL_ID,
  DISCORD_ADMIN_ROLE_ID: process.env.DISCORD_ADMIN_ROLE_ID,
  PROMO_INTAKE_API_URL: process.env.PROMO_INTAKE_API_URL || process.env.API_BASE_URL || 'https://gamblecodez.com',
  NODE_ENV: process.env.NODE_ENV || 'production',
};
