import { Telegraf } from 'telegraf';
import { config } from './config.js';
import { logger } from './utils/logger.js';

// Create bot instance
const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);

// --- Promo Submission Handler ---
bot.on('text', async (ctx) => {
  try {
    const message = ctx.message.text.trim();
    const user = ctx.from;

    // Detect URLs or promo codes
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const codeRegex = /\b[A-Z0-9]{4,20}\b/gi;

    const hasUrl = urlRegex.test(message);
    const hasCode = codeRegex.test(message);

    // If user sends a promo link or code
    if (hasUrl || hasCode) {
      logger.info(`Promo submission from ${user.id}: ${message}`);

      await ctx.reply(
        `🔥 Promo received!\n\n` +
        `Your submission has been added to the review queue.\n` +
        `If approved, it will appear in the GambleCodez Drops feed.`
      );

      // TODO: Save to DB or queue for admin review
      return;
    }

    // If it's just a normal message
    await ctx.reply(
      `👋 Send me any sweeps promo link or code.\n` +
      `I’ll add it to the review queue for admins.`
    );

  } catch (err) {
    logger.error('Message handler error:', err);
  }
});

// --- Export bot instance for start-bot.js ---
export default bot;
