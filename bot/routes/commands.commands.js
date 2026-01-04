import { ROLES } from "../services/telegramRoles.js";
import { getUserRole } from "../utils/permissions.js";
import { bold, code } from "../utils/formatters.js";

export default function commandsIndex(bot) {
  bot.command("commands", async (ctx) => {
    const telegramId = ctx.from.id;
    const role = await getUserRole(telegramId);

    const lines = [];

    lines.push("📚 *Command Index*");
    lines.push("");

    // ============================
    // USER COMMANDS
    // ============================
    lines.push(bold("🎰 Player Commands"));
    lines.push(`${code("/start")} — Welcome message`);
    lines.push(`${code("/help")} — Interactive help booklet`);
    lines.push(`${code("/stats")} — Your GCZ stats`);
    lines.push(`${code("/wheel")} — Spin the wheel`);
    lines.push(`${code("/raffles")} — Active raffles`);
    lines.push(`${code("/giveaways")} — Active giveaways`);
    lines.push(`${code("/drops")} — Latest drops`);
    lines.push(`${code("/promos")} — Active promos`);
    lines.push(`${code("/missions")} — Daily missions`);
    lines.push(`${code("/points")} — GCZ points`);
    lines.push(`${code("/vip")} — VIP status`);
    lines.push(`${code("/badges")} — Earned badges`);
    lines.push(`${code("/leaderboard")} — Leaderboard`);
    lines.push(`${code("/code <CODE>")} — Redeem secret code`);
    lines.push(`${code("/inbox")} — Your GCZ inbox`);
    lines.push("");

    // ============================
    // MOD COMMANDS
    // ============================
    if (role >= ROLES.MOD) {
      lines.push(bold("🛠 Moderator Tools"));
      lines.push(`${code("/warn <id>")} — Warn user`);
      lines.push(`${code("/mute <id>")} — Mute user`);
      lines.push(`${code("/clean")} — Clean spam`);
      lines.push(`${code("/whois <id>")} — User info`);
      lines.push("");
    }

    // ============================
    // ADMIN COMMANDS
    // ============================
    if (role >= ROLES.ADMIN) {
      lines.push(bold("👑 Admin Commands"));
      lines.push(`${code("/broadcast <msg>")} — Channel broadcast`);
      lines.push(`${code("/announce <msg>")} — Styled announcement`);
      lines.push(`${code("/services")} — Service health`);
      lines.push(`${code("/reload")} — Reload bot`);
      lines.push(`${code("/restart")} — Restart all services`);
      lines.push("");

      lines.push(bold("📦 Admin Tools"));
      lines.push(`${code("/ar <keyword>")} — Create autoresponse`);
      lines.push(`${code("/arlist")} — List autoresponses`);
      lines.push(`${code("/ardel <keyword>")} — Delete autoresponse`);
      lines.push("");
    }

    // ============================
    // SUPER ADMIN COMMANDS
    // ============================
    if (role >= ROLES.SUPER_ADMIN) {
      lines.push(bold("⚡ Super Admin"));
      lines.push(`${code("/sudo <cmd>")} — Execute privileged command`);
      lines.push(`${code("/adminlog")} — View admin logs`);
      lines.push(`${code("/flushcache")} — Clear system cache`);
      lines.push("");
    }

    // ============================
    // SEND MESSAGE
    // ============================
    ctx.reply(lines.join("\n"), { parse_mode: "Markdown" });
  });
}