export default function startCommands(bot) {
  bot.start((ctx) => {
    const msg =
`👑 *WELCOME, DEGEN.*  
I am *The GambleCodez Bot* — your official plug, your digital wingman, the one the squad calls when it’s time to spin, win, redeem, flex, and run it up.

If you're here, you're one of us now.

🔥 *What I do for my degens:*  
• Track your spins, entries, wins, missions, badges, VIP  
• Auto‑enter raffles + giveaways  
• Drop secret codes + daily picks  
• Show you promos, drops, hot sites  
• Sync your GCZ profile across bot + website  
• Deliver alerts, inbox messages, and win notifications  
• Keep your degen streak alive

🌐 *Build your Degen Profile:*  
https://gamblecodez.com  
Create your account, join the newsletter, and link your casino/sweeps accounts so the bot can track your entries, spins, rewards, and VIP progress across the entire GCZ ecosystem.

📣 *Join the Movement:*  
Follow the channel for drops, join the community for giveaways, and stay plugged in.

⚠️ *BETA WARNING:*  
We’re still polishing the edges.  
Found a bug? Report it here:  
https://gamblecodez.com/bug-reports  

Welcome to the squad.  
*Redeem today, flex tomorrow.*`;

    ctx.reply(msg, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "📢 Drops Channel", url: "https://t.me/GambleCodezDrops" },
            { text: "💬 PrizeHub Group", url: "https://t.me/GambleCodezPrizeHub" }
          ],
          [
            { text: "🌐 Visit GambleCodez.com", url: "https://gamblecodez.com" }
          ],
          [
            { text: "📲 Install App", url: "https://gamblecodez.com" }
          ]
        ]
      }
    });
  });
}