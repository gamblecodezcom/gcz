import fetch from "node-fetch";

const API_BASE = process.env.API_BASE_URL || "https://gamblecodez.com";

export default function registerDegenCommands(bot) {
  bot.command("link", (ctx) => {
    ctx.reply(
      `🔗 *Link with Telegram*\n` +
      `Use the official web login to attach Telegram to your Degen Profile:\n` +
      `${API_BASE.replace(/\/$/, "")}/login?telegram=1`
    );
  });

  bot.command("profile", async (ctx) => {
    const telegramId = ctx.from.id.toString();

    try {
      const res = await fetch(`${API_BASE}/api/profile/${telegramId}`);
      if (!res.ok) throw new Error("Failed to load profile");

      const data = await res.json();
      const profileLines = [
        `👤 *Degen Profile*`,
        ``,
        `• Telegram: ${data.telegram_username ? `@${data.telegram_username}` : "Not linked"}`,
        `• Cwallet: ${data.cwallet_id || "Not set"}`,
        `• Newsletter: ${data.newsletterAgreed ? "Subscribed" : "Not subscribed"}`,
        `• Linked casinos: ${data.linkedCasinos?.length ?? 0}`,
        `• Created: ${new Date(data.created_at).toDateString()}`,
      ];

      if (data.rafflePinSet) {
        profileLines.push(`• Raffle PIN: Set`);
      }

      await ctx.replyWithMarkdown(profileLines.join("\n"));
    } catch (err) {
      ctx.reply("❌ Unable to fetch your Degen Profile right now.");
    }
  });
}
