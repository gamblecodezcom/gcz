import { Telegraf, Markup } from 'telegraf';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { setupCommands } from './routes/index.js';

// Initialize bot
const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);

// --- Welcome Message Handler ---
bot.start(async (ctx) => {
  try {
    const name = ctx.from.first_name || 'friend';

    await ctx.reply(
      `🔥 Welcome to GambleCodez Drops, ${name}!\n\n` +
      `Here’s what you can do:\n` +
      `• Submit promo links/codes\n` +
      `• Check drops (when live)\n` +
      `• Get alerts & updates\n\n` +
      `The system is in **BETA**, so things may be empty while we add admins and train the AI.\n\n` +
      `Send any sweeps promo link or code here — it becomes a review ticket for the Drops feed.`,
      Markup.inlineKeyboard([
        [
          Markup.button.url('📢 Follow Channel', 'https://t.me/GambleCodezDrops'),
        ],
        [
          Markup.button.url('💬 Join Group', 'https://t.me/GambleCodezPrizeHub'),
        ],
        [
          Markup.button.url('🌐 Visit Website', 'https://gamblecodez.com'),
        ]
      ])
    );

    logger.info(`User started bot: ${ctx.from.id} (${name})`);
  } catch (err) {
    logger.error('Start command error:', err);
  }
});

// Register additional commands
setupCommands(bot);

// Global error handler
bot.catch((err, ctx) => {
  logger.error('Bot error:', err);
  try {
    ctx.reply('An error occurred. Please try again later.');
  } catch (_) {}
});

// Startup logic
async function startBot() {
  try {
    await bot.telegram.getMe();
    logger.info('Bot identity verified');

    const isProd = config.NODE_ENV === 'production';
    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;

    if (isProd && webhookUrl) {
      const port = process.env.TELEGRAM_WEBHOOK_PORT || 3001;

      await bot.launch({
        webhook: {
          domain: webhookUrl.replace('https://', ''),
          port,
        },
      });

      logger.info(`[INFO] Bot webhook active on ${webhookUrl}`);
    } else {
      await bot.launch();
      logger.info('[INFO] Bot polling active');
    }
  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

// Start bot
startBot();

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

export default bot;
