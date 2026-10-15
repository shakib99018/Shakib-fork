// code from goatstore
// api: https://store.agi.bd
module.exports.config = {
name: "abal",
version: "1.6",
role: 2,
author: "ttly ariYa'n",
description: "Fast tag Banglish list (1-2 seconds gap)",
category: "nsfw",
guide: "{pn} @mention ba message-e reply din",
coolDown: 10
};

module.exports.onStart = async function({ api, event, args }) {
const { threadID, messageID, mentions, type, messageReply } = event;

let targetID, name;

if (type === "message_reply") {
    targetID = messageReply.senderID;
} 
else if (Object.keys(mentions).length > 0) {
    targetID = Object.keys(mentions)[0];
}

if (!targetID) {
    return api.sendMessage("Madam, jake roast diben take mention din ba tar message-e reply din! 😈", threadID, messageID);
}

const userInfo = await api.getUserInfo(targetID);
name = userInfo[targetID].name;

const arraytag = [{ id: targetID, tag: name }];
const a = (msg) => api.sendMessage(msg, threadID);

a("Madam roast mode shuru hoilo... ready thako! 😈");

setTimeout(() => { a({ body: "O madam, tor attitude dekhe mone hoy puro elakar queen! 👑 " + name, mentions: arraytag }) }, 1000);
setTimeout(() => { a({ body: "Nijer vab ta ektu komao, personality ekhono loading-e! 😂 " + name, mentions: arraytag }) }, 2200);
setTimeout(() => { a({ body: "Tor drama dekhe serial-er director-o lojja pabe! 🎭 " + name, mentions: arraytag }) }, 3500);
setTimeout(() => { a({ body: "Attitude full charge, kintu logic low battery! 🔋 " + name, mentions: arraytag }) }, 4800);
setTimeout(() => { a({ body: "Nijeke queen vabis, kintu rajotto shudhu kolponay! 😏 " + name, mentions: arraytag }) }, 6000);
setTimeout(() => { a({ body: "Tor kotha shune Google-o bole, eta amar jana nai! 🤣 " + name, mentions: arraytag }) }, 7200);
setTimeout(() => { a({ body: "Tor overacting dekhe cinema hall-o refund chaibe! 🎬 " + name, mentions: arraytag }) }, 8500);
setTimeout(() => { a({ body: "Tui roast dite ashish, sheshe nijei roast hoye jash! 🔥 " + name, mentions: arraytag }) }, 9800);
setTimeout(() => { a({ body: "Tor ego eto boro, akash-o jayga dite parbe na! 😂 " + name, mentions: arraytag }) }, 11000);
setTimeout(() => { a({ body: "Tor attitude-er dokan ache, kintu talent-er stock shesh! 😆 " + name, mentions: arraytag }) }, 12500);
setTimeout(() => { a({ body: "Tui nijeke VIP vabis, kintu tor logic guest pass-o pay na! 😎 " + name, mentions: arraytag }) }, 14000);
setTimeout(() => { a({ body: "Tor dialogue onek, kintu sense-er battery dead! 🤣 " + name, mentions: arraytag }) }, 15500);
setTimeout(() => { a({ body: "Tui jekhane comment koris, sekhane shanti logout kore! 😈 " + name, mentions: arraytag }) }, 17000);
setTimeout(() => { a({ body: "Tor confidence dekhe vul-o nijeke thik mone kore! 😂 " + name, mentions: arraytag }) }, 18500);
setTimeout(() => { a({ body: "Madam, attitude komao, nahole nijer dialogue-e nijei atke jaba! 😏 " + name, mentions: arraytag }) }, 20000);
setTimeout(() => { a({ body: "Tor fashion sense dekhe aynao confused hoye jay! 🤭 " + name, mentions: arraytag }) }, 21500);
setTimeout(() => { a({ body: "Tui ekta walking notification, shob shomoy attention chai! 📢 " + name, mentions: arraytag }) }, 23000);
setTimeout(() => { a({ body: "Tor logic-er cheye amar phone-er airplane mode beshi useful! 😂 " + name, mentions: arraytag }) }, 24500);
setTimeout(() => { a({ body: "Nijer character update de, purono version-e onek bug! 🤣 " + name, mentions: arraytag }) }, 26000);
setTimeout(() => { a({ body: "Tor drama dekhe Oscar-o application cancel korbe! 🏆 " + name, mentions: arraytag }) }, 27500);
setTimeout(() => { a({ body: "Tor vab dekhe mone hoy duniya tor fan, bastobe shobai busy! 😭 " + name, mentions: arraytag }) }, 29000);
setTimeout(() => { a({ body: "Tui nijeke masterpiece vabis, kintu tutorial ekhono incomplete! 😂 " + name, mentions: arraytag }) }, 30500);
setTimeout(() => { a({ body: "Tor roast-er level dekhe cha-o thanda hoye jay! ☕ " + name, mentions: arraytag }) }, 32000);
setTimeout(() => { a({ body: "Madam-er attitude international, kintu common sense local-o na! 😆 " + name, mentions: arraytag }) }, 33500);
setTimeout(() => { a({ body: "Bas madam, ajker attitude show ekhanei shesh! Bye bye! 👋 " + name, mentions: arraytag }) }, 35000);

setTimeout(() => { a("~ Roast session complete! 😎 — ttly ariYa'n") }, 36500);

};
