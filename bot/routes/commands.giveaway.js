import { logger } from '../utils/logger.js';
import { getActiveGiveaways, enterGiveaway, getUserGiveawayEntries } from '../services/giveawaysBackend.js';
import { getUserProfile } from '../utils/storage.js';

/**
 * Setup giveaway-related commands
 */
const SUPER_ADMIN_TELEGRAM_ID = 6668510825;

export function setupGiveawayCommands(bot) {
  // /giveaways command - list active giveaways
  bot.command('giveaways', async (ctx) => {
    // Only Super Admin Telegram ID (6668510825) can access giveaway commands
    if (ctx.from?.id !== SUPER_ADMIN_TELEGRAM_ID) {
      return ctx.reply('This command is restricted to Super Admin only.');
    }

    try {
      const giveaways = await getActiveGiveaways();

      if (giveaways.length === 0) {
        return ctx.reply(
          `📭 *No Active Giveaways*\n\n` +
          `Check back soon for new giveaways! 🎁`,
          { parse_mode: 'Markdown' }
        );
      }

      let message = `🎁 *Active Giveaways*\n\n`;

      giveaways.forEach((giveaway, index) => {
        message += `${index + 1}. *${giveaway.title}*\n`;
        message += `   Type: ${giveaway.type}\n`;
        message += `   Prize: ${giveaway.prize_value}\n`;
        message += `   Winners: ${giveaway.num_winners}\n`;
        if (giveaway.end_date) {
          const endDate = new Date(giveaway.end_date);
          message += `   Ends: ${endDate.toLocaleDateString()}\n`;
        }
        message += `   Enter: /enter_giveaway ${giveaway.id}\n\n`;
      });

      await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error('Giveaways command error:', error);
      ctx.reply('❌ Error fetching giveaways.');
    }
  });

  // /enter_giveaway <id> command
  bot.command('enter_giveaway', async (ctx) => {
    // Only Super Admin Telegram ID (6668510825) can access giveaway commands
    if (ctx.from?.id !== SUPER_ADMIN_TELEGRAM_ID) {
      return ctx.reply('This command is restricted to Super Admin only.');
    }

    try {
      const parts = ctx.message.text.split(' ');
      if (parts.length < 2) {
        return ctx.reply(
          `❌ Usage: \`/enter_giveaway <giveaway_id>\`\n\n` +
          `Use /giveaways to see active giveaways.`,
          { parse_mode: 'Markdown' }
        );
      }

      const giveawayId = parseInt(parts[1]);
      if (isNaN(giveawayId)) {
        return ctx.reply('❌ Invalid giveaway ID.');
      }

      const userId = ctx.from.id.toString();
      const profile = getUserProfile(userId);

      // Enter giveaway
      const result = await enterGiveaway(
        userId,
        ctx.from.id.toString(),
        ctx.from.username || ctx.from.first_name,
        giveawayId,
        {
          cwallet_id: profile.cwalletId,
          runewager_username: profile.runewager,
        }
      );

      if (result.success) {
        await ctx.reply(
          `✅ *Giveaway Entry Successful!*\n\n` +
          `${result.message}\n\n` +
          `Good luck! 🍀`,
          { parse_mode: 'Markdown' }
        );
      } else {
        await ctx.reply(
          `❌ *Entry Failed*\n\n` +
          `${result.message}`,
          { parse_mode: 'Markdown' }
        );
      }
    } catch (error) {
      logger.error('Enter giveaway command error:', error);
      ctx.reply('❌ Error entering giveaway.');
    }
  });

  // /my_giveaways command - show user's entries
  bot.command('my_giveaways', async (ctx) => {
    // Only Super Admin Telegram ID (6668510825) can access giveaway commands
    if (ctx.from?.id !== SUPER_ADMIN_TELEGRAM_ID) {
      return ctx.reply('This command is restricted to Super Admin only.');
    }

    try {
      const userId = ctx.from.id.toString();
      const entries = await getUserGiveawayEntries(userId);

      if (entries.length === 0) {
        return ctx.reply(
          `📭 *No Giveaway Entries*\n\n` +
          `You haven't entered any giveaways yet.\n` +
          `Use /giveaways to see active giveaways!`,
          { parse_mode: 'Markdown' }
        );
      }

      let message = `🎁 *Your Giveaway Entries*\n\n`;

      entries.forEach((entry, index) => {
        message += `${index + 1}. *${entry.title}*\n`;
        message += `   Type: ${entry.type}\n`;
        message += `   Prize: ${entry.prize_value}\n`;
        message += `   Status: ${entry.status}\n`;
        message += `   Entered: ${new Date(entry.created_at).toLocaleDateString()}\n\n`;
      });

      await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error('My giveaways command error:', error);
      ctx.reply('❌ Error fetching your giveaway entries.');
    }
  });
}
