import { setupRaffleCommands } from './commands.raffle.js';
import { setupAutoResponseCommands } from './commands.autoresponse.js';
import { setupUserCommands } from './commands.user.js';
import { setupWheelCommands } from './commands.wheel.js';
import { setupGiveawayCommands } from './commands.giveaway.js';
import { setupStatsCommands } from './commands.stats.js';
import { setupDropsCommands } from './commands.drops.js';
// import { setupAdminCommands } from './commands.admin.js';
// import { setupHelpCommands } from './commands.help.js';

export function setupCommands(bot) {
  // Core user-facing flows
  if (typeof setupRaffleCommands === 'function') {
    setupRaffleCommands(bot);
  }

  // Auto-responses, user setup, admin reply flow
  setupAutoResponseCommands(bot);

  // User commands (profile, settings)
  if (typeof setupUserCommands === 'function') {
    setupUserCommands(bot);
  }

  // Wheel commands
  if (typeof setupWheelCommands === 'function') {
    setupWheelCommands(bot);
  }

  // Giveaway commands
  if (typeof setupGiveawayCommands === 'function') {
    setupGiveawayCommands(bot);
  }

  // Stats commands
  if (typeof setupStatsCommands === 'function') {
    setupStatsCommands(bot);
  }

  // Drops commands
  if (typeof setupDropsCommands === 'function') {
    setupDropsCommands(bot);
  }

  // Plug others back in as you finalize them:
  // if (typeof setupAdminCommands === 'function') setupAdminCommands(bot);
  // if (typeof setupHelpCommands === 'function') setupHelpCommands(bot);
}
