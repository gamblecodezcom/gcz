export function setupHelpCommands(bot) {
  bot.command('help', (ctx) => {
    ctx.reply(
      '🎰 GambleCodez Bot Help\n\n' +
      'User Commands:\n' +
      '/start - Start the bot\n' +
      '/spin - Daily spin\n' +
      '/raffles - List active raffles\n' +
      '/enter <id> - Enter a raffle\n' +
      '/help - Show this help\n\n' +
      'Admin Commands:\n' +
      '/admin - Admin panel\n' +
      '/stats - System statistics'
    );
  });
}
