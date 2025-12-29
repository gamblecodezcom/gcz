import { logger } from '../utils/logger.js';
import { isAdmin } from '../utils/permissions.js';
import { config } from '../config.js';
import {
  startGiveaway,
  cancelGiveaway,
  getGiveawayStatus,
  joinGiveaway
} from '../services/giveaways.js';
import { getAllUsers, getUserProfile } from '../utils/storage.js';

const ADMIN_ID = config.TELEGRAM_ADMIN_ID ? parseInt(config.TELEGRAM_ADMIN_ID) : null;

/**
 * Setup admin-only commands
 */
export function setupAdminCommands(bot) {
  // /giveaway start <type> <winners> <value> <minutes>
  bot.command('giveaway', async (ctx) => {
    if (!isAdmin(ctx, [ADMIN_ID])) {
      return ctx.reply('❌ Admin access required.');
    }

    const parts = ctx.message.text.split(' ').filter(p => p);
    const subcommand = parts[1]?.toLowerCase();

    if (subcommand === 'start') {
      if (parts.length < 6) {
        return ctx.reply(
          '❌ Usage: `/giveaway start <type> <winners> <value> <minutes>`\n\n' +
          'Example: `/giveaway start cwallet 3 5 10`',
          { parse_mode: 'Markdown' }
        );
      }

      const type = parts[2]?.toLowerCase();
      const winnersCount = parseInt(parts[3]);
      const prizeValue = parts[4];
      const durationMinutes = parseInt(parts[5]);

      if (!type || (type !== 'cwallet' && type !== 'runewager')) {
        return ctx.reply('❌ Type must be "cwallet" or "runewager".');
      }

      if (isNaN(winnersCount) || winnersCount < 1) {
        return ctx.reply('❌ Winners count must be a positive number.');
      }

      if (isNaN(durationMinutes) || durationMinutes < 1) {
        return ctx.reply('❌ Duration must be a positive number (minutes).');
      }

      const result = startGiveaway(bot, {
        type,
        winnersCount,
        prizeValue,
        durationMinutes,
        adminId: ctx.from.id
      });

      if (result.success) {
        await ctx.reply('✅ Giveaway started!');
      } else {
        await ctx.reply(result.message);
      }
      return;
    }

    if (subcommand === 'cancel') {
      const result = cancelGiveaway(bot);
      if (result.success) {
        await ctx.reply('✅ Giveaway cancelled.');
      } else {
        await ctx.reply(result.message);
      }
      return;
    }

    if (subcommand === 'status') {
      const status = getGiveawayStatus();
      if (!status.active) {
        return ctx.reply('📭 No active giveaway.');
      }

      const typeLabel = status.type === 'cwallet' 
        ? '💸 Cwallet USDc' 
        : '🎰 Runewager SC';

      let message = `📊 *Giveaway Status*\n\n`;
      message += `Type: ${typeLabel}\n`;
      message += `Winners: ${status.winnersCount}\n`;
      message += `Prize Each: ${status.prizeValue}\n`;
      message += `Participants: ${status.participants}\n`;
      message += `Time Remaining: ${status.timeRemaining}`;

      await ctx.reply(message, { parse_mode: 'Markdown' });
      return;
    }

    ctx.reply(
      '❌ Usage:\n' +
      '`/giveaway start <type> <winners> <value> <minutes>`\n' +
      '`/giveaway cancel`\n' +
      '`/giveaway status`',
      { parse_mode: 'Markdown' }
    );
  });

  // /join command (handled here to check for giveaways)
  bot.command('join', async (ctx) => {
    await joinGiveaway(ctx, bot);
  });

  // /whois command
  bot.command('whois', async (ctx) => {
    if (!isAdmin(ctx, [ADMIN_ID])) {
      return ctx.reply('❌ Admin access required.');
    }

    if (!ctx.message.reply_to_message) {
      return ctx.reply('❌ Reply to a user\'s message to view their info.');
    }

    const targetUser = ctx.message.reply_to_message.from;
    if (!targetUser) {
      return ctx.reply('❌ Could not identify user.');
    }

    const profile = getUserProfile(targetUser.id);

    let message = `👤 *User Information*\n\n`;
    message += `🆔 Telegram ID: \`${profile.id}\`\n`;
    message += `👤 Username: ${profile.username ? `@${profile.username}` : 'Not set'}\n`;
    message += `📝 Name: ${profile.first_name || ''} ${profile.last_name || ''}\n\n`;
    message += `💸 Cwallet ID: ${profile.cwalletId || 'Not set'}\n`;
    message += `🎰 Runewager: ${profile.runewager || 'Not set'}\n\n`;
    message += `✅ Has Started: ${profile.has_started ? 'Yes' : 'No'}\n`;
    message += `📅 First Seen: ${new Date(profile.created_at).toLocaleString()}\n`;
    message += `🔄 Last Seen: ${new Date(profile.updated_at).toLocaleString()}`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  });

  // /broadcast command
  bot.command('broadcast', async (ctx) => {
    if (!isAdmin(ctx, [ADMIN_ID])) {
      return ctx.reply('❌ Admin access required.');
    }

    // Store broadcast session
    ctx.session = ctx.session || {};
    ctx.session.broadcastMode = true;
    ctx.session.broadcastMessage = null;

    await ctx.reply(
      '📢 *Broadcast Setup*\n\n' +
      'Please send the message you want to broadcast.\n' +
      'You can include text, photos, or documents.\n\n' +
      'Type /cancel to abort.',
      { parse_mode: 'Markdown' }
    );
  });

  // Handle broadcast message input
  bot.on('message', async (ctx, next) => {
    if (ctx.session?.broadcastMode && !ctx.message.text?.startsWith('/')) {
      const message = ctx.message;
      ctx.session.broadcastMessage = message;
      ctx.session.broadcastMode = false;
      ctx.session.broadcastTarget = null;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '📢 Channel', callback_data: 'broadcast_channel' },
            { text: '👥 Group', callback_data: 'broadcast_group' }
          ],
          [
            { text: '📢👥 Both', callback_data: 'broadcast_both' },
            { text: '❌ Cancel', callback_data: 'broadcast_cancel' }
          ]
        ]
      };

      await ctx.reply('📍 Where should this be posted?', { reply_markup: keyboard });
      return;
    }
    return next();
  });

  // Handle broadcast callback queries
  bot.on('callback_query', async (ctx, next) => {
    if (ctx.callbackQuery.data?.startsWith('broadcast_')) {
      if (!isAdmin(ctx, [ADMIN_ID])) {
        return ctx.answerCbQuery('Admin only.');
      }

      const action = ctx.callbackQuery.data;
      const message = ctx.session?.broadcastMessage;

      if (!message) {
        return ctx.answerCbQuery('No message to broadcast.');
      }

      if (action === 'broadcast_cancel') {
        ctx.session = {};
        await ctx.editMessageText('❌ Broadcast cancelled.');
        return ctx.answerCbQuery();
      }

      try {
        const targets = [];
        if (action === 'broadcast_channel' || action === 'broadcast_both') {
          if (config.TELEGRAM_CHANNEL_ID) targets.push(config.TELEGRAM_CHANNEL_ID);
        }
        if (action === 'broadcast_group' || action === 'broadcast_both') {
          if (config.TELEGRAM_GROUP_ID) targets.push(config.TELEGRAM_GROUP_ID);
        }

        if (targets.length === 0) {
          return ctx.answerCbQuery('No target configured.');
        }

        for (const targetId of targets) {
          if (message.photo) {
            await bot.telegram.sendPhoto(targetId, message.photo[message.photo.length - 1].file_id, {
              caption: message.caption,
              parse_mode: message.caption_entities ? 'HTML' : undefined
            });
          } else if (message.document) {
            await bot.telegram.sendDocument(targetId, message.document.file_id, {
              caption: message.caption,
              parse_mode: message.caption_entities ? 'HTML' : undefined
            });
          } else if (message.text) {
            await bot.telegram.sendMessage(targetId, message.text, {
              parse_mode: message.entities ? 'HTML' : undefined
            });
          }
        }

        ctx.session = {};
        await ctx.editMessageText(`✅ Broadcast sent to ${targets.length} location(s).`);
        await ctx.answerCbQuery('Broadcast sent!');
      } catch (err) {
        logger.error('Broadcast error:', err);
        await ctx.answerCbQuery('Error sending broadcast.');
      }
      return;
    }
    return next();
  });

  // /postpromo command (simplified version)
  bot.command('postpromo', async (ctx) => {
    if (!isAdmin(ctx, [ADMIN_ID])) {
      return ctx.reply('❌ Admin access required.');
    }

    await ctx.reply(
      '📝 *Promo Posting*\n\n' +
      'Reply to a message with this command to post it as a promo.\n' +
      'Or send a new message with text, images, and buttons.\n\n' +
      'Supports HTML formatting and inline buttons.',
      { parse_mode: 'Markdown' }
    );
  });
}
