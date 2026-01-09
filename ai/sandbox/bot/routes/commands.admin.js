import { ROLES } from "../services/telegramRoles.js";
import { requireRole } from "../utils/permissions.js";
import { log } from "../utils/logger.js";
import fetch from "node-fetch";
import { exec } from "child_process";

export default function adminCommands(bot) {
  // Who am I
  bot.command("whoami", (ctx) => {
    ctx.reply(`Your role: *${ROLES[requireRole(ctx, ROLES.USER)]}*`, {
      parse_mode: "Markdown"
    });
  });

  // Broadcast to channel
  bot.command("broadcast", async (ctx) => {
    if (!requireRole(ctx, ROLES.ADMIN)) return ctx.reply("❌ No permission.");

    const msg = ctx.message.text.split(" ").slice(1).join(" ");
    if (!msg) return ctx.reply("Usage: /broadcast message");

    await ctx.telegram.sendMessage(config.TELEGRAM_CHANNEL_ID, msg, {
      parse_mode: "Markdown"
    });

    ctx.reply("📢 Broadcast sent.");
  });

  // Announcement (inline formatting)
  bot.command("announce", async (ctx) => {
    if (!requireRole(ctx, ROLES.ADMIN)) return ctx.reply("❌ No permission.");

    const msg = ctx.message.text.split(" ").slice(1).join(" ");
    if (!msg) return ctx.reply("Usage: /announce message");

    const formatted =
      `🔥 *GambleCodez Announcement* 🔥\n\n${msg}\n\n🎰 Redeem today, flex tomorrow`;

    await ctx.telegram.sendMessage(config.TELEGRAM_CHANNEL_ID, formatted, {
      parse_mode: "Markdown"
    });

    ctx.reply("📣 Announcement sent.");
  });

  // Reload bot
  bot.command("reload", async (ctx) => {
    if (!requireRole(ctx, ROLES.SUPER_ADMIN)) return ctx.reply("❌ No permission.");

    ctx.reply("♻️ Reloading bot...");
    exec("pm2 reload gcz-bot");
  });

  // Restart all services
  bot.command("restart", async (ctx) => {
    if (!requireRole(ctx, ROLES.SUPER_ADMIN)) return ctx.reply("❌ No permission.");

    ctx.reply("🔄 Restarting all GCZ services...");
    exec("pm2 restart all");
  });

  // Service health check
  bot.command("services", async (ctx) => {
    const services = [
      { name: "API", url: "http://127.0.0.1:8000/health" },
      { name: "Redirect", url: "http://127.0.0.1:8001/health" },
      { name: "Drops", url: "http://127.0.0.1:8002/api/drops/health" },
      { name: "Bot", url: "http://127.0.0.1:3000/health" }
    ];

    let msg = "🩺 *Service Health*\n\n";

    for (const svc of services) {
      try {
        const res = await fetch(svc.url);
        msg += `• ${svc.name}: ${res.ok ? "🟢 OK" : "🔴 DOWN"}\n`;
      } catch {
        msg += `• ${svc.name}: 🔴 DOWN\n`;
      }
    }

    ctx.reply(msg, { parse_mode: "Markdown" });
  });
}