import { Telegraf } from 'telegraf';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { setupCommands } from './routes/index.js';

// Initialize bot
const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);

// Register commands
setupCommands(bot);

// Error handling
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

// Export default for start-bot.js
export default bot;
