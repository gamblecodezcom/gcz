import { logger } from '../utils/logger.js';
import { checkWheelEligibility, spinWheel, getWheelHistory } from '../services/wheel.js';
import { getUserProfile } from '../utils/storage.js';

/**
 * Setup wheel-related commands
 */
export function setupWheelCommands(bot) {
  // /wheel command - check eligibility and spin
  bot.command('wheel', async (ctx) => {
    try {
      const userId = ctx.from.id.toString();
      const profile = getUserProfile(userId);

      // Check eligibility
      const eligibility = await checkWheelEligibility(userId);

      if (!eligibility.eligible) {
        const hours = Math.ceil(eligibility.hoursUntilNext || 0);
        const minutes = Math.ceil((eligibility.hoursUntilNext || 0) * 60 % 60);
        return ctx.reply(
          `⏳ *Daily Spin Not Available*\n\n` +
          `You've already spun today!\n` +
          `Next spin available in: *${hours}h ${minutes}m*\n\n` +
          `🎰 Redeem today, flex tomorrow!`,
          { parse_mode: 'Markdown' }
        );
      }

      // Show spin button
      const inlineKeyboard = {
        inline_keyboard: [
          [
            { text: '🎰 Spin the Wheel!', callback_data: 'spin_wheel' }
          ],
          [
            { text: '📊 View History', callback_data: 'wheel_history' }
          ]
        ]
      };

      await ctx.reply(
        `🎰 *Degen Wheel*\n\n` +
        `You have a spin available!\n` +
        `Click the button below to spin and win raffle entries or the JACKPOT! 🎉`,
        {
          parse_mode: 'Markdown',
          reply_markup: inlineKeyboard
        }
      );
    } catch (error) {
      logger.error('Wheel command error:', error);
      ctx.reply('❌ Error checking wheel eligibility.');
    }
  });

  // Handle spin button callback
  bot.action('spin_wheel', async (ctx) => {
    try {
      await ctx.answerCbQuery('Spinning the wheel...');

      const userId = ctx.from.id.toString();
      
      // Perform spin
      const result = await spinWheel(userId, ctx.from.id.toString(), 'telegram-bot');

      let message = `🎰 *Wheel Spin Result*\n\n`;

      if (result.jackpot) {
        message += `🎉 *JACKPOT!* 🎉\n\n`;
        message += `You won the JACKPOT! 🏆\n`;
        message += `Check your dashboard for reward details.\n\n`;
      } else {
        message += `🎁 *Reward: ${result.reward}*\n\n`;
        if (result.entriesAdded) {
          message += `✅ Added ${result.entriesAdded} raffle entries!\n\n`;
        }
      }

      message += `🎰 Redeem today, flex tomorrow!`;

      await ctx.editMessageText(message, { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error('Spin wheel action error:', error);
      const errorMessage = error.message || 'Unknown error';
      
      if (errorMessage.includes('already used')) {
        await ctx.answerCbQuery('Daily spin already used', { show_alert: true });
      } else {
        await ctx.answerCbQuery('Error spinning wheel', { show_alert: true });
      }
    }
  });

  // Handle history button callback
  bot.action('wheel_history', async (ctx) => {
    try {
      await ctx.answerCbQuery('Loading history...');

      const userId = ctx.from.id.toString();
      const history = await getWheelHistory(userId, 10);

      if (history.length === 0) {
        return ctx.editMessageText(
          `📊 *Wheel History*\n\n` +
          `No spins recorded yet.\n` +
          `Spin the wheel to start earning rewards!`,
          { parse_mode: 'Markdown' }
        );
      }

      let message = `📊 *Recent Wheel Spins*\n\n`;
      history.forEach((spin, index) => {
        const date = new Date(spin.timestamp).toLocaleDateString();
        message += `${index + 1}. ${spin.reward} - ${date}\n`;
      });

      await ctx.editMessageText(message, { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error('Wheel history action error:', error);
      await ctx.answerCbQuery('Error loading history', { show_alert: true });
    }
  });
}
