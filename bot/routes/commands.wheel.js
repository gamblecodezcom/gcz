import fetch from "node-fetch";

export function setupWheelCommands(bot) {
  bot.command("spin", async (ctx) => {
    const userId = ctx.from.id.toString();

    try {
      const res = await fetch("https://gamblecodez.com/api/wheel/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId }
      });

      const data = await res.json();

      if (data.cooldown) {
        return ctx.reply(`⏳ You can spin again in ${data.cooldown} minutes.`);
      }

      ctx.reply(`🎡 You spun the wheel and won: *${data.reward}*`);
    } catch (err) {
      ctx.reply("❌ Wheel spin failed.");
    }
  });

  bot.command("wheel_status", async (ctx) => {
    const userId = ctx.from.id.toString();

    try {
      const res = await fetch(`https://gamblecodez.com/api/wheel/status/${userId}`);
      const data = await res.json();

      ctx.reply(
        `🎡 *Wheel Status*\n\n` +
        `Next Spin: ${data.nextSpin}\n` +
        `Last Reward: ${data.lastReward || "None"}`
      );
    } catch (err) {
      ctx.reply("❌ Failed to load wheel status.");
    }
  });
}
