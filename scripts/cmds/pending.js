// code from goatstore
// api: https://store.agi.bd
"use strict";
module.exports = {
 config: {
 name: "pending",
 version: "1.3.1",
 author: "MaRuF",
 aliases: [],
 role: 2,
 shortDescription: "Manage bot's waiting groups",
 longDescription: "Approve or cancel pending groups",
 category: "owner",
 countDown: 5
 },

 _getText(key,...args) {
 const texts = {
 invaildNumber: "🥺 Oops! %1 is not a valid number",
 cancelSuccess: "🗑️ Deleted %1 group(s) successfully",
 approveSuccess: "🌸 Approved %1 group(s) successfully",
 cantGetPendingList: "💔 Can't get the pending list",
 returnListClean: "📭 No pending groups found"
 };
 const text = texts[key] || key;
 return args.length? text.replace("%1", args[0]) : text;
},

 onStart: async function ({ api, event }) {
 const { threadID, messageID, senderID } = event;
 let pendingList = [];
 try {
 const other = await api.getThreadList(100, null, ["OTHER"]);
 const pending = await api.getThreadList(100, null, ["PENDING"]);
 pendingList = [...other,...pending].filter(
 g => g.isGroup && g.isSubscribed // tomar original filter e rakhlam
 );
 } catch {
 return api.sendMessage(
 this._getText("cantGetPendingList"), threadID, messageID
 );
 }

 if (!pendingList.length)
 return api.sendMessage(
 this._getText("returnListClean"), threadID, messageID
 );

 const prefix = global.GoatBot?.config?.prefix || "!"; 
let msg = `✨ 𝐏𝐄𝐍𝐃𝐈𝐍𝐆 𝐆𝐑𝐎𝐔𝐏𝐒 : ${pendingList.length} ✨\n`;
msg += `━━━━━━━━━━━━━━\n`;

pendingList.forEach((g, i) => {
 msg += `🔹 ${i + 1}. 𝐍𝐚𝐦𝐞 : ${g.name || "𝐔𝐧𝐚𝐦𝐞𝐝"}\n`;
 msg += `🆔 𝐈𝐃 : ${g.threadID}\n`;
 msg += `──────────────\n`;
});

msg += `\n💌 𝐇𝐎𝐖 𝐓𝐎 𝐔𝐒𝐄 :\n`;
msg += `✅ 𝐀𝐩𝐫𝐨𝐯𝐞 : ${prefix}𝐩𝐞𝐧𝐝𝐢𝐧𝐠 1 2\n`;
msg += `❌ 𝐂𝐚𝐧𝐜𝐞𝐥 : ${prefix}𝐩𝐞𝐧𝐝𝐢𝐧𝐠 𝐜 1 2`;

 return api.sendMessage(msg, threadID, (err, info) => {
 global.GoatBot.onReply.set(info.messageID, {
 commandName: this.config.name,
 author: senderID,
 pending: pendingList
 });
 }, messageID);
 },

 onReply: async function ({ event, Reply, api }) {
 const { author, pending } = Reply;
 if (String(event.senderID)!== String(author)) return;

 const input = event.body.trim().toLowerCase().split(/\s+/);
 const botID = api.getCurrentUserID();
 const prefix = global.GoatBot?.config?.prefix || "!";
 let count = 0;

 if (input[0] === "c" || input[0] === "cancel") {
 for (let i = 1; i < input.length; i++) {
 const idx = parseInt(input[i]);
 if (isNaN(idx) || idx <= 0 || idx > pending.length)
 return api.sendMessage(
 this._getText("invaildNumber", input[i]), event.threadID
 );
 await api.removeUserFromGroup(botID, pending[idx - 1].threadID);
 count++;
 }
 return api.sendMessage(
 this._getText("cancelSuccess", count), event.threadID
 );
 }

 for (const v of input) {
 const idx = parseInt(v);
 if (isNaN(idx) || idx <= 0 || idx > pending.length)
 return api.sendMessage(
 this._getText("invaildNumber", v), event.threadID
 );

 const tID = pending[idx - 1].threadID;
 await api.sendMessage(
`✨ 𝐆𝐑𝐎𝐔𝐏 𝐀𝐂𝐓𝐈𝐕𝐀𝐓𝐄𝐃 ✨

💫 𝐇𝐞𝐥𝐨 𝐄𝐯𝐞𝐫𝐲𝐨𝐧𝐞 👋
🤖 𝐈'𝐦 𝐍𝐨𝐰 𝐎𝐧𝐥𝐢𝐧𝐞 ✅

⚙️ 𝐏𝐫𝐞𝐟𝐢𝐱 : ${prefix}
📜 𝐇𝐞𝐥𝐩 : ${prefix}𝐡𝐞𝐥𝐩

💎 𝐓𝐡𝐚𝐧𝐤𝐬 𝐅𝐨𝐫 𝐀𝐝𝐢𝐧𝐠 𝐌𝐞 💎`, tID);

 const nickNameBot = global.GoatBot?.config?.nickNameBot;
 if (nickNameBot) await api.changeNickname(nickNameBot, tID, botID);
 count++;
 }

 return api.sendMessage(
 this._getText("approveSuccess", count), event.threadID
 );
 }
};
