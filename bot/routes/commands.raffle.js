import { logger } from '../utils/logger.js';
import { getRaffles, enterRaffle } from '../utils/apiClient.js';

const SUPER_ADMIN_TELEGRAM_ID = 6668510825;

export function setupRaffleCommands(bot) {
  bot.command('raffles', async (ctx) => {
    // Only Super Admin Telegram ID (6668510825) can access raffle commands
    if (ctx.from?.id !== SUPER_ADMIN_TELEGRAM_ID) {
      return ctx.reply('This command is restricted to Super Admin only.');
    }

    try {
      const raffles = await getRaffles();
      if (raffles.length === 0) {
        return ctx.reply('📭 No active raffles at the moment.');
      }
      const list = raffles.map(r => `🎁 ${r.title} (ID: ${r.id})`).join('\n');
      ctx.reply(`🎰 Active Raffles:\n\n${list}\n\nUse /enter <raffle_id> to enter.`);
    } catch (error) {
      logger.error('Raffles command error:', error);
      ctx.reply('❌ Error fetching raffles.');
    }
  });

  bot.command('enter', async (ctx) => {
    // Only Super Admin Telegram ID (6668510825) can access raffle commands
    if (ctx.from?.id !== SUPER_ADMIN_TELEGRAM_ID) {
      return ctx.reply('This command is restricted to Super Admin only.');
    }

    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
      return ctx.reply('Usage: /enter <raffle_id>');
    }
    const raffleId = parseInt(args[1]);
    if (isNaN(raffleId)) {
      return ctx.reply('❌ Invalid raffle ID.');
    }
    
    const userId = ctx.from.id.toString();
    
    try {
      await enterRaffle(userId, raffleId);
      ctx.reply(`✅ Successfully entered raffle #${raffleId}!`);
    } catch (error) {
      logger.error('Enter raffle error:', error);
      const errorMessage = error.message || 'Unknown error';
      
      // Handle specific error cases
      if (errorMessage.includes('Already entered') || errorMessage.includes('409')) {
        ctx.reply('❌ You have already entered this raffle.');
      } else if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        ctx.reply('❌ Raffle not found or inactive.');
      } else {
        ctx.reply(`❌ Error entering raffle: ${errorMessage}`);
      }
    }
  });
}
