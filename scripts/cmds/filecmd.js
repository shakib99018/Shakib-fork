// code from goatstore
// api: https://store.agi.bd
const fs = require("fs");
const path = require("path");

module.exports = {
 config: {
 name: "filecmd",
 aliases: ["file"],
 version: "1.0.0",
 author: "—͞𝐏ʀɪᴍᴇ́",
 countDown: 5,
 role: 2,
 description: {
 en: "View code of a command."
 },
 category: "system",
 guide: {
 en: "{pn} <commandName>"
 }
 },

 onStart: async function ({ args, message }) {
 const cmdName = args[0];

 if (!cmdName) {
 return message.reply(
 "━━━━━━━━━━━━━━━━━━━━━\n" +
 "𓆩 𝘍𝘐𝘓𝘌𝘊𝘔𝘋 𝘏𝘌𝘓𝘗 𓆪\n\n" +
 "💠 𝘗𝘭𝘦𝘢𝘴𝘦 𝘱𝘳𝘰𝘷𝘪𝘥𝘦 𝘤𝘰𝘮𝘮𝘢𝘯𝘥 𝘯𝘢𝘮𝘦!\n" +
 "📃 𝘌𝘹𝘢𝘮𝘱𝘭𝘦: 𝘧𝘪𝘭𝘦𝘤𝘮𝘥 𝘧𝘭𝘶𝘹𝘴𝘯𝘦𝘭\n" +
 "━━━━━━━━━━━━━━━━━━━━━"
 );
 }

 const cmdPath = path.join(__dirname, `${cmdName}.js`);

 if (!fs.existsSync(cmdPath)) {
 return message.reply(
 "━━━━━━━━━━━━━━━━━━━━━\n" +
 "𓆩 𝘍𝘐𝘓𝘌𝘊𝘔𝘋 𝘌𝘙𝘖𝘙 𓆪\n\n" +
 `🪶 𝘊𝘰𝘮𝘮𝘢𝘯𝘥 "${cmdName}" 𝘯𝘰𝘵 𝘧𝘰𝘶𝘯𝘥!\n` +
 "🌙 𝘊𝘩𝘦𝘤𝘬 𝘵𝘩𝘦 𝘯𝘢𝘮𝘦 & 𝘵𝘳𝘺 𝘢𝘨𝘢𝘪𝘯\n" +
 "━━━━━━━━━━━━━━━━━━━━━"
 );
 }

 try {
 const code = fs.readFileSync(cmdPath, "utf8");

 if (code.length > 19000) {
 return message.reply(
 "━━━━━━━━━━━━━━━━━━━━━\n" +
 "𓆩 𝘍𝘐𝘓𝘌 𝘛𝘖 𝘓𝘈𝘙𝘎𝘌 𓆪\n\n" +
 "💿 𝘛𝘩𝘪𝘴 𝘧𝘪𝘭𝘦 𝘪𝘴 𝘵𝘰𝘰 𝘭𝘢𝘳𝘨𝘦 𝘵𝘰 𝘥𝘪𝘴𝘱𝘭𝘢𝘺.\n" +
 "━━━━━━━━━━━━━━━━━━━━━"
 );
 }

 const msg =
 "━━━━━━━━━━━━━━━━━━━━━\n" +
 "𓆩 𝘍𝘐𝘓𝘌 𝘊𝘖𝘋𝘌 𝘝𝘐𝘌𝘞 𓆪\n\n" +
 `📂 𝘍𝘪𝘭𝘦: ${cmdName}.js\n` +
 `📏 𝘚𝘪𝘻𝘦: ${code.length}𝐛\n` +
 "━━━━━━━━━━━━━━━━━━━━━\n\n" +
 code;

 return message.reply({ body: msg });

 } catch (err) {
 console.error(err);
 return message.reply(
 "━━━━━━━━━━━━━━━━━━━━━\n" +
 "𓆩 𝘍𝘐𝘓𝘌𝘊𝘔𝘋 𝘌𝘙𝘙𝘖𝘙 𓆪\n\n" +
 "❀ 𝘌𝘳𝘳𝘰𝘳 𝘳𝘦𝘢𝘥𝘪𝘯𝘨 𝘵𝘩𝘦 𝘧𝘪𝘭𝘦.\n" +
 "━━━━━━━━━━━━━━━━━━━━━"
 );
 }
 }
};