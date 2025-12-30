import { logger } from '../utils/logger.js';
import { getUserStats, getUserActivity } from '../services/stats.js';
import { getUserProfile } from '../utils/storage.js';

/**
 * Setup stats-related commands
 */
export function setupStatsCommands(bot) {
  // /stats command - show user statistics
  bot.command('stats', async (ctx) => {
    try {
      const userId = ctx.from.id.toString();
      const profile = getUserProfile(userId);
      const stats = await getUserStats(userId);
      const recentActivity = await getUserActivity(userId, 5);

      let message = `📊 *Your Stats*\n\n`;
      message += `🎰 *Raffle Entries:* ${stats.raffleEntries}\n`;
      message += `🎡 *Wheel Spins:* ${stats.wheelSpins}\n`;
      message += `🎁 *Giveaways Entered:* ${stats.giveawaysEntered}\n`;
      message += `🔗 *Linked Casinos:* ${stats.linkedCasinos}\n\n`;

      if (profile.cwalletId) {
        message += `💸 Cwallet ID: \`${profile.cwalletId}\`\n`;
      }
      if (profile.runewager) {
        message += `🎰 Runewager: \`${profile.runewager}\`\n`;
      }

      if (recentActivity.length > 0) {
        message += `\n📝 *Recent Activity:*\n`;
        recentActivity.forEach((activity, index) => {
          const date = new Date(activity.timestamp).toLocaleDateString();
          message += `${index + 1}. ${activity.title} - ${date}\n`;
        });
      }

      message += `\n🎰 Redeem today, flex tomorrow!`;

      await ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error('Stats command error:', error);
      ctx.reply('❌ Error fetching stats.');
    }
  });
}
