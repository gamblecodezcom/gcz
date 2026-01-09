import fetch from "node-fetch";

export function setupUserCommands(bot) {
  bot.command("me", async (ctx) => {
    const userId = ctx.from.id.toString();

    try {
      const res = await fetch(`https://gamblecodez.com/api/profile/${userId}`);
      const data = await res.json();

      ctx.reply(
        `👤 *Your Profile*\n\n` +
        `Telegram: ${ctx.from.username || ctx.from.first_name}\n` +
        `CWallet: ${data.cwallet || "Not linked"}\n` +
        `RuneWager: ${data.runewager || "Not linked"}\n` +
        `Winna: ${data.winna || "Not linked"}\n`
      );
    } catch (err) {
      ctx.reply("❌ Failed to load profile.");
    }
  });

  bot.command("link_profile", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1);
    if (args.length < 3) {
      return ctx.reply("Usage: /link_profile <cwallet> <runewager> <winna>");
    }

    const [cwallet, runewager, winna] = args;
    const userId = ctx.from.id.toString();

    try {
      const res = await fetch("https://gamblecodez.com/api/profile/link", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({ cwallet, runewager, winna })
      });

      const data = await res.json();
      ctx.reply(data.message || "✅ Profile linked successfully.");
    } catch (err) {
      ctx.reply("❌ Failed to link profile.");
    }
  });
}
