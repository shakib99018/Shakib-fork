module.exports = {
 config: {
 name: "runtime",
 aliases: ["rtm", "uptime"],
 version: "2.2.0",
 author: "𝐌𝐚𝐑𝐮𝐅",
 countDown: 0,
 role: 0,

 description: {
 en: "Show bot runtime."
 },

 category: "system",

 guide: {
 en: "{pn}"
 }
 },

 onStart: async function ({ message }) {
 const uptime = process.uptime();

 const days = Math.floor(uptime / 86400);
 const hours = Math.floor((uptime % 86400) / 3600);
 const minutes = Math.floor((uptime % 3600) / 60);
 const seconds = Math.floor(uptime % 60);

 let runtime = "";

 if (days > 0) {
 runtime += `${days}𝐝 `;
 }

 if (hours > 0) {
 runtime += `${hours}𝐡 `;
 }

 if (minutes > 0) {
 runtime += `${minutes}𝐦 `;
 }

 runtime += `${seconds}𝐬`;

 const botName = global.GoatBot.config.nickNameBot || "GoatBot";

 const msg =
 "━━━━━━━━━━━━━━━━━━━━━\n"
 + "🪷 𝘙𝘜𝘕𝘛𝘐𝘔𝘌 𝘐𝘕𝘍𝘖\n\n"
 + `🫧 𝘉𝘰𝘵: ${botName}\n`
 + `⏳ 𝘜𝘱𝘵𝘪𝘮𝘦: ${runtime}\n`
 + "⚡ 𝘚𝘵𝘢𝘵𝘶𝘴: 𝘖𝘯𝘭𝘪𝘯𝘦 ✅\n"
 + "━━━━━━━━━━━━━━━━━━━━━";

 return message.reply(msg);
 }
};