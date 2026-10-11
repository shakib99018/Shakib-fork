const { commands } = global.GoatBot;

module.exports = {
 config: {
 name: "help",
 version: "3.1.0",
 author: "—͞𝐏ʀɪᴍᴇ́",
 countDown: 3,
 role: 0,
 description: { en: "See all commands." },
 category: "system",
 guide: { en: "{pn} [cmd]" }
 },

 onStart: async function ({ api, event, message, args, role }) {
 api.setMessageReaction("🔥", event.messageID, () => {}, true);

 const botName = global.GoatBot.config.nickNameBot || "—͞𝐌ꫝʀᴜꜰ 🫠🌸";
 const prefix = global.GoatBot?.config?.prefix || "!";

 // 🔧 Command not found message
 const COMMAND_NOT_FOUND = (cmdName, pfx) =>
 `🔍 𝐂𝐨𝐦𝐦𝐚𝐧𝐝 𝐍𝐨𝐭 𝐅𝐨𝐮𝐧𝐝\n└─ 𝐂𝐨𝐦𝐦𝐚𝐧𝐝: "${cmdName}"\n└─ 𝐔𝐬𝐞: ${pfx}𝐡𝐞𝐥𝐩`;

 function getTextSafe(v) {
 if (!v) return "";
 if (typeof v === "string") return v;
 if (typeof v === "object" && typeof v.en === "string") return v.en;
 return String(v);
 }

 function formatCategory(v) {
 let raw = getTextSafe(v) || "Uncategorized";
 raw = raw.trim().toLowerCase();
 return raw.replace(/[a-z]+/g, w => w.charAt(0).toUpperCase() + w.slice(1));
 }

 function findCommand(s) {
 const name = String(s || "").toLowerCase();
 for (const [, cmd] of commands) {
 if (!cmd?.config) continue;
 if (String(cmd.config.name).toLowerCase() === name) return cmd;
 const aliases = Array.isArray(cmd.config.aliases)
 ? cmd.config.aliases
 : cmd.config.aliases ? [cmd.config.aliases] : [];
 if (aliases.some(a => String(a).toLowerCase() === name)) return cmd;
 }
 return null;
 }

 function canUse(c) {
 if (!c?.config) return false;
 const need = typeof c.config.role === "number" ? c.config.role : 0;
 return role >= need;
 }

 // ── Commands font: Bold ──
 function cmdFont(text) {
 const map = { a:"𝐚",b:"𝐛",c:"𝐜",d:"𝐝",e:"𝐞",f:"𝐟",g:"𝐠",h:"𝐡",i:"𝐢",j:"𝐣",k:"𝐤",l:"𝐥",m:"𝐦",n:"𝐧",o:"𝐨",p:"𝐩",q:"𝐪",r:"𝐫",s:"𝐬",t:"𝐭",u:"𝐮",v:"𝐯",w:"𝐰",x:"𝐱",y:"𝐲",z:"𝐳",A:"𝐀",B:"𝐁",C:"𝐂",D:"𝐃",E:"𝐄",F:"𝐅",G:"𝐆",H:"𝐇",I:"𝐈",J:"𝐉",K:"𝐊",L:"𝐋",M:"𝐌",N:"𝐍",O:"𝐎",P:"𝐏",Q:"𝐐",R:"𝐑",S:"𝐒",T:"𝐓",U:"𝐔",V:"𝐕",W:"𝐖",X:"𝐗",Y:"𝐘",Z:"𝐙",0:"𝟎",1:"𝟏",2:"𝟐",3:"𝟑",4:"𝟒",5:"𝟓",6:"𝟔",7:"𝟕",8:"𝟖",9:"𝟗" };
 return text.split("").map(ch => map[ch] || ch).join("");
 }

 // ── Category font: Bold Italic Sans ──
 function catFont(text) {
 const map = { a:"𝙖",b:"𝙗",c:"𝙘",d:"𝙙",e:"𝙚",f:"𝙛",g:"𝙜",h:"𝙝",i:"𝙞",j:"𝙟",k:"𝙠",l:"𝙡",m:"𝙢",n:"𝙣",o:"𝙤",p:"𝙥",q:"𝙦",r:"𝙧",s:"𝙨",t:"𝙩",u:"𝙪",v:"𝙫",w:"𝙬",x:"𝙭",y:"𝙮",z:"𝙯",A:"𝘼",B:"𝘽",C:"𝘾",D:"𝘿",E:"𝙀",F:"𝙁",G:"𝙂",H:"𝙃",I:"𝙄",J:"𝙅",K:"𝙆",L:"𝙇",M:"𝙈",N:"𝙉",O:"𝙊",P:"𝙋",Q:"𝙌",R:"𝙍",S:"𝙎",T:"𝙏",U:"𝙐",V:"𝙑",W:"𝙒",X:"𝙓",Y:"𝙔",Z:"𝙕" };
 return text.split("").map(c => map[c] || c).join("");
 }

 // ══════════════ DETAIL VIEW ══════════════
 if (args.length > 0) {
 const command = findCommand(args[0]);

 if (!command || !canUse(command)) {
 return message.reply(COMMAND_NOT_FOUND(args[0], prefix));
 }

 const c = command.config;
 return message.reply(
 "╭━━━━━━━━━━━━━━━━━━━╮\n" +
 `▸ 𝗡𝗮𝗺𝗲 : ${cmdFont(c.name)}\n` +
 `▸ 𝗔𝘂𝘁𝗵𝗼𝗿 : ${c.author}\n` +
 `▸ 𝗩𝗲𝗿𝘀𝗶𝗼𝗻 : ${c.version}\n` +
 `▸ 𝗖𝗮𝘁𝗲𝗴𝗼𝗿𝘆 : ${catFont(formatCategory(c.category))}\n` +
 `▸ 𝗥𝗼𝗹𝗲 : ${c.role ?? 0}\n` +
 `▸ 𝗗𝗲𝘀𝗰 : ${getTextSafe(c.description)}\n` +
 `▸ 𝗚𝘂𝗶𝗱𝗲 : ${getTextSafe(c.guide)?.replace(/{pn}/g, prefix + c.name) || "N/A"}\n` +
 ` 💎 ${prefix}help — Menu\n` +
 "╰━━━━━━━━━━━━━━━━━━━╯"
 );
 }

 // ══════════════ MENU VIEW ══════════════
 const categories = {};
 const allCommands = new Set();

 for (const [, command] of commands) {
 if (!command?.config) continue;
 if (!canUse(command)) continue;
 const name = String(command.config.name || "").trim();
 if (!name) continue;
 const catRaw = getTextSafe(command.config.category) || "Uncategorized";
 const catKey = catRaw.trim().toLowerCase();
 if (!categories[catKey]) categories[catKey] = [];
 if (!categories[catKey].includes(name)) categories[catKey].push(name);
 allCommands.add(name);
 }

 const catKeys = Object.keys(categories).sort((a, b) => a.localeCompare(b));

 // ── Header ──
 let menu =
 "╭━━━━━━━━━━━━━━━━━━━╮\n" +
 `▸ 𝗕𝗼𝘁 : ${botName}\n` +
 `▸ 𝗧𝗼𝘁𝗮𝗹 : ${allCommands.size} Commands\n` +
 `▸ 𝗣𝗿𝗲𝗳𝗶𝘅 : ${prefix}\n` +
 "╭━━━━━━━━━━━━━━━╮\n";

 // ── Categories ──
 for (const key of catKeys) {
 const list = [...new Set(categories[key])].sort((a, b) => a.localeCompare(b));
 const catName = catFont(formatCategory(key));
 menu += `┃ ⟨ ${catName} ⟩\n`;
 for (let i = 0; i < list.length; i += 2) {
 const first = cmdFont(list[i]);
 const second = list[i + 1] ? cmdFont(list[i + 1]) : null;
 if (second) menu += `┃ ▸ ${first} ▸ ${second}\n`;
 else menu += `┃ ▸ ${first}\n`;
 }
 menu += "┃┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n";
 }

 // ── Footer ──
 menu +=
 ` 💎 ${prefix}help <cmd> — details\n` +
 "╰━━━━━━━━━━━━━━━━━━━╯";

 return message.reply(menu);
 }
};