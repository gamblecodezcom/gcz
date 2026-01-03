import { logger } from '../utils/logger.js';
import { config } from '../config.js';
import { getUserProfile } from '../utils/storage.js';

// In-memory active giveaway state
let activeGiveaway = null;
let countdownInterval = null;

/**
 * Start a new giveaway (admin only)
 * Format: /giveaway start <type> <winners> <value> <minutes>
 */
export function startGiveaway(bot, {
  type,            // 'cwallet' or 'runewager'
  winnersCount,    // number of winners
  prizeValue,      // value each winner gets
  durationMinutes, // countdown duration
  adminId          // admin Telegram ID
}) {
  if (activeGiveaway) {
    return { success: false, message: '❌ A giveaway is already running.' };
  }

  if (type !== 'cwallet' && type !== 'runewager') {
    return { success: false, message: '❌ Invalid type. Use "cwallet" or "runewager".' };
  }

  if (winnersCount < 1 || winnersCount > 100) {
    return { success: false, message: '❌ Winners count must be between 1 and 100.' };
  }

  if (durationMinutes < 1 || durationMinutes > 1440) {
    return { success: false, message: '❌ Duration must be between 1 and 1440 minutes.' };
  }

  activeGiveaway = {
    type,
    winnersCount,
    prizeValue,
    durationMinutes,
    adminId,
    participants: new Map(), // userId → { username, cwalletId, runewager }
    startedAt: Date.now(),
    endsAt: Date.now() + durationMinutes * 60000
  };

  const typeLabel = type === 'cwallet' 
    ? '💸 Cwallet USDc Giveaway' 
    : '🎰 Runewager SC Giveaway';

  const announcement = `🎉 *GIVEAWAY STARTED!*

${typeLabel}
🎯 Winners: *${winnersCount}*
💰 Prize Each: *${prizeValue}*
⏳ Duration: *${durationMinutes} minutes*

Use /join to enter!`;

  bot.telegram.sendMessage(
    config.TELEGRAM_GROUP_ID,
    announcement,
    { parse_mode: 'Markdown' }
  ).catch(err => {
    logger.error('Failed to send giveaway announcement:', err);
  });

  scheduleCountdown(bot);

  return { success: true };
}

/**
 * User joins giveaway
 */
export async function joinGiveaway(ctx, bot) {
  if (!activeGiveaway) {
    return ctx.reply('❌ No active giveaway right now.');
  }

  const userId = ctx.from.id.toString();
  const profile = getUserProfile(userId);

  // Check if user has started bot
  if (!profile.has_started) {
    return ctx.reply('❌ You must use /start first before joining giveaways.');
  }

  // Check setup requirements
  if (activeGiveaway.type === 'cwallet' && !profile.cwalletId) {
    return ctx.reply('❌ You must set your Cwallet ID first using /setcwallet <id>');
  }

  if (activeGiveaway.type === 'runewager' && !profile.runewager) {
    return ctx.reply('❌ You must set your Runewager username first using /setrunewager <username>');
  }

  if (activeGiveaway.participants.has(userId)) {
    return ctx.reply('⚠️ You already joined this giveaway.');
  }

  activeGiveaway.participants.set(userId, {
    username: ctx.from.username || ctx.from.first_name || 'Unknown',
    cwalletId: profile.cwalletId,
    runewager: profile.runewager
  });

  await ctx.reply('✅ You are entered! Good luck! 🍀');
}

/**
 * Cancel active giveaway
 */
export function cancelGiveaway(bot) {
  if (!activeGiveaway) {
    return { success: false, message: '❌ No active giveaway to cancel.' };
  }

  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  bot.telegram.sendMessage(
    config.TELEGRAM_GROUP_ID,
    '❌ *Giveaway Cancelled*\n\nThe giveaway has been cancelled by an admin.',
    { parse_mode: 'Markdown' }
  ).catch(err => {
    logger.error('Failed to send cancellation message:', err);
  });

  activeGiveaway = null;
  return { success: true };
}

/**
 * Get giveaway status
 */
export function getGiveawayStatus() {
  if (!activeGiveaway) {
    return { active: false, message: 'No active giveaway.' };
  }

  const remaining = activeGiveaway.endsAt - Date.now();
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const participants = activeGiveaway.participants.size;

  return {
    active: true,
    type: activeGiveaway.type,
    winnersCount: activeGiveaway.winnersCount,
    prizeValue: activeGiveaway.prizeValue,
    participants,
    timeRemaining: `${minutes}m ${seconds}s`
  };
}

/**
 * Countdown scheduler
 */
function scheduleCountdown(bot) {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  countdownInterval = setInterval(() => {
    if (!activeGiveaway) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      return;
    }

    const remaining = activeGiveaway.endsAt - Date.now();

    if (remaining <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      finishGiveaway(bot);
      return;
    }

    const seconds = Math.floor(remaining / 1000);

    if ([60, 39, 15].includes(seconds)) {
      bot.telegram.sendMessage(
        config.TELEGRAM_GROUP_ID,
        `⏳ *${seconds}s left!* Join now with /join`,
        { parse_mode: 'Markdown' }
      ).catch(err => {
        logger.error('Failed to send countdown warning:', err);
      });
    }
  }, 1000);
}

/**
 * Finish giveaway and pick winners
 */
async function finishGiveaway(bot) {
  if (!activeGiveaway) return;

  const { type, winnersCount, prizeValue, participants, adminId } = activeGiveaway;

  const entries = Array.from(participants.entries());
  const total = entries.length;

  if (total === 0) {
    await bot.telegram.sendMessage(
      config.TELEGRAM_GROUP_ID,
      '📭 Giveaway ended — no participants.'
    ).catch(() => {});
    activeGiveaway = null;
    return;
  }

  // Pick winners randomly
  const shuffled = entries.sort(() => Math.random() - 0.5);
  const winners = shuffled.slice(0, Math.min(winnersCount, total));

  // Public announcement
  let message = `🎉 *GIVEAWAY WINNERS!*\n\n`;

  winners.forEach(([userId, data], i) => {
    message += `🏆 *Winner ${i + 1}:* @${data.username}\n`;
  });

  message += `\n💰 Prize Each: *${prizeValue}*\n`;
  message += `\n🎰 Redeem today, flex tomorrow!`;

  await bot.telegram.sendMessage(
    config.TELEGRAM_GROUP_ID,
    message,
    { parse_mode: 'Markdown' }
  ).catch(err => {
    logger.error('Failed to send winner announcement:', err);
  });

  // Admin-only detailed report
  let adminReport = `🎯 *GIVEAWAY REPORT*\n\n`;
  adminReport += `Type: ${type === 'cwallet' ? 'Cwallet USDc' : 'Runewager SC'}\n`;
  adminReport += `Prize: ${prizeValue}\n`;
  adminReport += `Total Participants: ${total}\n\n`;
  adminReport += `*WINNERS:*\n\n`;

  winners.forEach(([userId, data], i) => {
    adminReport += `*Winner ${i + 1}:*\n`;
    adminReport += `• Telegram: @${data.username}\n`;
    adminReport += `• Telegram ID: \`${userId}\`\n`;
    if (type === 'cwallet') {
      adminReport += `• Cwallet ID: \`${data.cwalletId}\`\n`;
    }
    if (type === 'runewager') {
      adminReport += `• Runewager: \`${data.runewager}\`\n`;
    }
    adminReport += `\n`;
  });

  await bot.telegram.sendMessage(
    adminId,
    adminReport,
    { parse_mode: 'Markdown' }
  ).catch(err => {
    logger.error('Failed to send admin report:', err);
  });

  activeGiveaway = null;
}

export function getActiveGiveaway() {
  return activeGiveaway;
}
