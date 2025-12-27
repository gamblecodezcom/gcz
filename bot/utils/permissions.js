export function isAdmin(ctx, adminIds = []) {
  return adminIds.includes(ctx.from?.id);
}
export function isGroup(ctx) {
  return ctx.chat?.type === "group" || ctx.chat?.type === "supergroup";
}
export function isChannel(ctx) {
  return ctx.chat?.type === "channel";
}
