import { getVipStatus } from "../services/vip.js";
import { bold } from "../utils/formatters.js";

export default function vipCommands(bot) {
  bot.command("vip", async (ctx) => {
    const telegramId = ctx.from.id;
    const vip = await getVipStatus(telegramId);

    if (!vip) {
      return ctx.reply("❌ Unable to load VIP status.");
    }

    const msg =
      `👑 *VIP Status*\n\n` +
      `${bold("Level")}: ${vip.vip_level}\n` +
      `${bold("VIP Points")}: ${vip.vip_points}\n\n` +
      `Keep playing, entering raffles, and completing missions to level up.`;

    ctx.reply(msg, { parse_mode: "Markdown" });
  });
}