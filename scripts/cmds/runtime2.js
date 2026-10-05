module.exports = {
  config: {
    name: "runtime",
    aliases: ["rtm"],
    version: "3.0.0",
    author: "Sakib",
    countDown: 0,
    role: 0,

    description: {
      en: "Show the bot runtime."
    },

    category: "system",

    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ message }) {
    try {
      const uptime = process.uptime();

      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);

      let runtime = "";

      if (days > 0) runtime += `${days}d `;
      if (hours > 0) runtime += `${hours}h `;
      if (minutes > 0) runtime += `${minutes}m `;

      runtime += `${seconds}s`;

      const msg =
`╭──────────────╮
   ⏱️ 𝐑𝐔𝐍𝐓𝐈𝐌𝐄
╰──────────────╯

🚀 Running Time » ${runtime}
🤖 Status » Online
⚡ Bot is running smoothly!`;

      return message.reply(msg);

    } catch (error) {
      return message.reply(
        `❌ | Runtime দেখাতে সমস্যা হয়েছে!\n\n${error.message}`
      );
    }
  }
};
