import { logger } from '../utils/logger.js';
import { config } from '../config.js';
import {
  getUserProfile,
  markUserStarted,
  setCwalletId,
  setRunewagerUsername,
  touchUser
} from '../utils/storage.js';

/**
 * Setup user-facing commands
 */
export function setupUserCommands(bot) {
  // /start command with welcome message and buttons
  bot.start(async (ctx) => {
    try {
      const user = ctx.from;
      touchUser(user);
      markUserStarted(user.id);

      const welcomeMessage = `👋 Welcome to GambleCodez!

🎰 Redeem today, flex tomorrow.
🔥 Track bonuses, join giveaways, and unlock exclusive drops.

Use the buttons below to join our community.`;

      const inlineKeyboard = {
        inline_keyboard: [
          [
            { text: '📢 Join Channel', url: 'https://gamblecodez.com/Channel' },
            { text: '👥 Join Community Group', url: 'https://gamblecodez.com/Group' }
          ],
          [
            { text: '🌐 Open Web App', url: 'https://t.me/GambleCodezCasinoDrops_bot/GambleCodez' }
          ]
        ]
      };

      await ctx.reply(welcomeMessage, {
        reply_markup: inlineKeyboard
      });
    } catch (error) {
      logger.error('Start command error:', error);
      ctx.reply('❌ An error occurred. Please try again.');
    }
  });

  // /profile command
  bot.command('profile', async (ctx) => {
    try {
      const userId = ctx.from.id.toString();
      const profile = getUserProfile(userId);

      let message = `👤 *Your Profile*\n\n`;
      message += `🆔 Telegram ID: \`${profile.id}\`\n`;
      message += `👤 Username: ${profile.username ? `@${profile.username}` : 'Not set'}\n`;
      message += `📝 Name: ${profile.first_name || ''} ${profile.last_name || ''}\n\n`;
      message += `💸 Cwallet ID: ${profile.cwalletId || '❌ Not set'}\n`;
      message += `🎰 Runewager: ${profile.runewager || '❌ Not set'}\n\n`;
      message += `📅 First seen: ${new Date(profile.created_at).toLocaleDateString()}\n`;
      message += `🔄 Last updated: ${new Date(profile.updated_at).toLocaleDateString()}`;

      await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error('Profile command error:', error);
      ctx.reply('❌ Error fetching profile.');
    }
  });

  // /setcwallet <id>
  bot.command('setcwallet', async (ctx) => {
    try {
      const parts = ctx.message.text.split(' ');
      if (parts.length < 2) {
        return ctx.reply('❌ Usage: `/setcwallet <your_cwallet_id>`', { parse_mode: 'Markdown' });
      }

      const cwalletId = parts.slice(1).join(' ').trim();
      if (!cwalletId) {
        return ctx.reply('❌ Cwallet ID cannot be empty.');
      }

      setCwalletId(ctx.from.id, cwalletId, ctx.from);
      await ctx.reply(`✅ Cwallet ID saved: \`${cwalletId}\``, { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error('Setcwallet command error:', error);
      ctx.reply('❌ Error saving Cwallet ID.');
    }
  });

  // /setrunewager <username>
  bot.command('setrunewager', async (ctx) => {
    try {
      const parts = ctx.message.text.split(' ');
      if (parts.length < 2) {
        return ctx.reply('❌ Usage: `/setrunewager <your_runewager_username>`', { parse_mode: 'Markdown' });
      }

      const runewager = parts.slice(1).join(' ').trim();
      if (!runewager) {
        return ctx.reply('❌ Runewager username cannot be empty.');
      }

      setRunewagerUsername(ctx.from.id, runewager, ctx.from);
      await ctx.reply(`✅ Runewager username saved: \`${runewager}\``, { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error('Setrunewager command error:', error);
      ctx.reply('❌ Error saving Runewager username.');
    }
  });

  // /join command for giveaways
  bot.command('join', async (ctx) => {
    try {
      // This will be handled by the giveaway service
      // Just acknowledge here if no active giveaway
      await ctx.reply('⏳ Checking for active giveaways...');
    } catch (error) {
      logger.error('Join command error:', error);
      ctx.reply('❌ Error processing join request.');
    }
  });
}
