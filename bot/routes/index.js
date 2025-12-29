import { setupRaffleCommands } from './commands.raffle.js';
import { setupAutoResponseCommands } from './commands.autoresponse.js';
// import { setupAdminCommands } from './commands.admin.js';
// import { setupUserCommands } from './commands.user.js';
// import { setupHelpCommands } from './commands.help.js';

export function setupCommands(bot) {
  // Core user-facing flows
  if (typeof setupRaffleCommands === 'function') {
    setupRaffleCommands(bot);
  }

  // Auto-responses, user setup, admin reply flow
  setupAutoResponseCommands(bot);

  // Plug others back in as you finalize them:
  // if (typeof setupAdminCommands === 'function') setupAdminCommands(bot);
  // if (typeof setupUserCommands === 'function') setupUserCommands(bot);
  // if (typeof setupHelpCommands === 'function') setupHelpCommands(bot);
}
