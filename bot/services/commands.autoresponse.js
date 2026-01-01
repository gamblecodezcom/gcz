import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { getUserProfile, setCwalletId, setRunewagerUsername, touchUser } from '../utils/storage.js';
import {
  startReplySetup,
  handleSetupAction,
  handleButtonInput,
  handleAutoResponse
} from '../services/autoresponses.js';

const ADMIN_ID = config.TELEGRAM_ADMIN_ID?.toString();

/**
 * Register auto-response and user-setup related commands
 */
export function setupAutoResponseCommands(bot) {
  // /start – mark user as known
  bot.start((ctx) => {
    touchUser(ctx.from);
    ctx.reply(
      '👋 Welcome to GambleCodez.\n\n' +
      'You can set up:\n' +
      '- Cwallet ID: /setcwallet <id>\n' +
      '- Runewager username: /setrunewager <username>'
    );
  });

  // /setcwallet <id>
  bot.command('setcwallet', (ctx) => {
    const parts = ctx.message.text.split(' ');
    if (parts.length < 2) {
      return ctx.reply('Usage: /setcwallet <your_cwallet_id>');
    }
    const id = parts[1].trim();
    const userId = ctx.from.id.toString();

    setCwalletId(userId, id, ctx.from);
    ctx.reply(`✅ Cwallet ID saved: ${id}`);
  });

  // /setrunewager <username>
  bot.command('setrunewager', (ctx) => {
    const parts = ctx.message.text.split(' ');
    if (parts.length < 2) {
      return ctx.reply('Usage: /setrunewager <your_runewager_username>');
    }
    const username = parts[1].trim();
    const userId = ctx.from.id.toString();

    setRunewagerUsername(userId, username, ctx.from);
    ctx.reply(`✅ Runewager username saved: ${username}`);
  });

  // /reply <keyword> – admin only, must reply to a message
  bot.command('reply', (ctx) => {
    if (ctx.from.id.toString() !== ADMIN_ID) {
      return ctx.reply('❌ Admin only.');
    }

    const parts = ctx.message.text.split(' ');
    if (parts.length < 2) {
      return ctx.reply('Usage: reply to a message with /reply <keyword>');
    }

    const keyword = parts.slice(1).join(' ').trim();
    if (!keyword) {
      return ctx.reply('❌ Keyword cannot be empty.');
    }

    try {
      startReplySetup(ctx, keyword);
    } catch (err) {
      logger.error('Failed to start auto-response setup:', err);
      ctx.reply('❌ Failed to start auto-response setup.');
    }
  });

  // Callback queries for autoresponse setup
  bot.on('callback_query', async (ctx, next) => {
    const data = ctx.callbackQuery?.data || '';
    if (data.startsWith('ar_')) {
      try {
        await handleSetupAction(bot, ctx);
      } catch (err) {
        logger.error('Auto-response setup callback error:', err);
        ctx.answerCbQuery('Error handling action.');
      }
    } else {
      return next();
    }
  });

  // Text messages from admin for button input during setup
  bot.on('text', async (ctx, next) => {
    // Handle button input if part of setup
    try {
      await handleButtonInput(ctx);
    } catch (err) {
      logger.error('Button input handling error:', err);
    }

    // Handle auto-responses for everyone
    try {
      await handleAutoResponse(bot, ctx);
    } catch (err) {
      logger.error('Auto-response execution error:', err);
    }

    return next();
  });
}