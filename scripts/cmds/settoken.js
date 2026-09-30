module.exports = {
 config: {
 name: "settoken",
 version: "1.0.0",
 author: "—͞𝐏ʀɪᴍᴇ́",
 countDown: 3,
 role: 2,
 description: {
 en: "Set token on variables."
 },
 category: "system",
 guide: {
 en: "{pn} <KEY> <VALUE>"
 }
 },

 onStart: async function ({ args, message }) {
 const key = args[0];
 const value = args.slice(1).join(" ");

 if (!key ||!value) {
 return message.reply("❀ Provide key & value");
 }

 // set
 process.env[key] = value;

 // checking system
 if (process.env[key] === value) {
 return message.reply(
 "━━━━━━━━━━━━━━━━━━━━━\n" +
 "𓆩 𝘚𝘌𝘛𝘛𝘖𝘒𝘌𝘕 𓆪\n\n" +
 `📂 𝘒𝘦𝘺: ${key}\n` +
 "✅ 𝘛𝘰𝘬𝘦𝘯 𝘴𝘦𝘵 𝘴𝘶𝘤𝘦𝘴𝘴𝘧𝘶𝘭\n" +
 "━━━━━━━━━━━━━━━━━━━━━"
 );
 } else {
 return message.reply(
 "━━━━━━━━━━━━━━━━━━━━━\n" +
 "𓆩 𝘚𝘌𝘛𝘛𝘖𝘒𝘌𝘕 𓆪\n\n" +
 `📂 𝘒𝘦𝘺: ${key}\n` +
 "❌ 𝘍𝘢𝘪𝘭𝘦𝘥 𝘵𝘰 𝘴𝘦𝘵 𝘵𝘰𝘬𝘦𝘯\n" +
 "━━━━━━━━━━━━━━━━━━━━━"
 );
 }
 }
};