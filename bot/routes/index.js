import { setupRaffleCommands } from './commands.raffle.js';
import { setupAutoResponseCommands } from './commands.autoresponse.js';
import { setupUserCommands } from './commands.user.js';
import { setupWheelCommands } from './commands.wheel.js';
import { setupGiveawayCommands } from './commands.giveaway.js';
import { setupStatsCommands } from './commands.stats.js';
import { setupDropsCommands } from './commands.drops.js';
import { setupAdminCommands } from './commands.admin.js';
import { setupHelpCommands } from './commands.help.js';

export function setupCommands(bot) {
  // Raffles
  if (typeof setupRaffleCommands === 'function') {
    setupRaffleCommands(bot);
  }

  // Auto-response engine
  if (typeof setupAutoResponseCommands === 'function') {
    setupAutoResponseCommands(bot);
  }

  // User commands
  if (typeof setupUserCommands === 'function') {
    setupUserCommands(bot);
  }

  // Wheel
  if (typeof setupWheelCommands === 'function') {
    setupWheelCommands(bot);
  }

  // Giveaways
  if (typeof setupGiveawayCommands === 'function') {
    setupGiveawayCommands(bot);
  }

  // Stats
  if (typeof setupStatsCommands === 'function') {
    setupStatsCommands(bot);
  }

  // Drops engine
  if (typeof setupDropsCommands === 'function') {
    setupDropsCommands(bot);
  }

  // Admin commands
  if (typeof setupAdminCommands === 'function') {
    setupAdminCommands(bot);
  }

  // Help menu
  if (typeof setupHelpCommands === 'function') {
    setupHelpCommands(bot);
  }
}
