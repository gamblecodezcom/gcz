export function isAdmin(ctx, adminIds = []) {
  return adminIds.includes(ctx.from?.id);
}
export function isGroup(ctx) {
  return ctx.chat?.type === "group" || ctx.chat?.type === "supergroup";
}
export function isChannel(ctx) {
  return ctx.chat?.type === "channel";
}

/**
 * Check if a Telegram user ID is the Super Admin (6668510825)
 * Used to restrict raffle and giveaway commands
 */
export function isSuperAdminTelegramId(telegramId) {
  const SUPER_ADMIN_TELEGRAM_ID = 6668510825;
  return telegramId === SUPER_ADMIN_TELEGRAM_ID;
}
