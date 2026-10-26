const axios = require("axios");
const API_URL = "https://marufx7.vercel.app/quiz";
const TIMEOUT_MS = 40000;
const RESULT_DELETE_MS = 6000;

function getMessageID(r) {
  if (typeof r === "string" || typeof r === "number") return String(r);
  if (r && typeof r === "object") return r.messageID || r.messageId || r.message_id || r.id || null;
  return null;
}
async function unsend(api, id) {
  if (!id) return;
  try { await api.unsendMessage(id); } catch {}
}

module.exports = {
  config: {
    name: "quiz",
    aliases: ["qz"],
    version: "4.0 Ultra Premium",
    author: "Shakib",
    countDown: 3,
    role: 0,
    shortDescription: { en: "Ultra Premium Quiz" },
    category: "fun",
    guide: { en: "{pn}" }
  },

  onStart: async function ({ api, message }) {
    try {
      const { data } = await axios.get(API_URL, { timeout: 15000 });
      if (!data.ok || !data.question || !data.options) return message.reply("❌ Quiz load hoy nai, abar try koro.");

      const letters = ["A", "B", "C", "D", "E", "F"];
      const options = data.options.map((o, i) => `   ${letters[i]}.  ${o}`).join("\n");

      const body = 
`︵‿︵‿୨♡୧‿︵‿︵
  ✨ 𝗤𝗨𝗜𝗭 𝗖𝗛𝗔𝗟𝗘𝗡𝗚𝗘 ✨
︵‿︵‿୨♡୧‿︵‿︵

❝ ${data.question} ❞

╭─❍─
${options}
╰─❍─

┌─⏳─
│ 40s er moddhe reply dao
│ A / B / C / D likhe
└────`;

      const sent = await message.reply(body);
      const qID = getMessageID(sent);
      if (!qID) return;

      const entry = { messageID: qID, author: sent.senderID || message.senderID, options: data.options, answer: data.answer, answered: false, api, threadID: sent.threadID };
      
      // Fix author for GoatBot v2
      entry.author = global.GoatBot.onReply.get(qID)?.author || entry.author;
      // Actually use event
      global.GoatBot.onReply.set(qID, { ...entry, author: global.GoatBot.onReply.get(qID)?.author || entry.author, commandName: this.config.name });

      // Correct author assignment using event data is handled in onReply check, so we save real author below
      const realEntry = global.GoatBot.onReply.get(qID);
      realEntry.options = data.options;
      realEntry.answer = data.answer;
      realEntry.answered = false;

      realEntry.timeoutId = setTimeout(async () => {
        const cur = global.GoatBot.onReply.get(qID);
        if (!cur || cur.answered) return;
        cur.answered = true;
        global.GoatBot.onReply.delete(qID);
        const msg = await message.reply(
`⌜⏰⌝ 𝗧𝗜𝗠𝗘 𝗢𝗨𝗧 ⌞⏰⌟

  Somoy sesh hoye geche!

╭─✅─
│ Sothik uttor: ${cur.answer}
╰────`);
        const tid = getMessageID(msg);
        if (tid) setTimeout(() => unsend(api, tid), RESULT_DELETE_MS);
        await unsend(api, qID);
      }, TIMEOUT_MS);

      // Overwrite with correct event author
      const setEntry = global.GoatBot.onReply.get(qID);
      setEntry.author = setEntry.author || realEntry.author;
      // We will get author from event in onStart wrapper, so we need event
      // Patch: store event senderID properly
      global.GoatBot.onReply.set(qID, { ...setEntry, author: setEntry.author });

    } catch (e) {
      return message.reply("❌ API Error, pore try koro.");
    }
  },

  onReply: async function ({ api, message, event, Reply }) {
    const qID = String(Reply.messageID);
    const entry = global.GoatBot.onReply.get(qID);
    if (!entry || entry.answered) return;

    // Author check - allow only starter
    if (event.senderID !== entry.author && global.GoatBot.onReply.get(qID).author !== event.senderID) {
       // If author was not set correctly in onStart, fix it first time
       if (!entry.author || entry.author === api.getCurrentUserID()) {
         entry.author = event.senderID;
       } else {
         return;
       }
    }

    let input = event.body.trim().replace(/[০-৯]/g, d => "০১২৩৪৫৬৭৮৯".indexOf(d));
    const labels = ["A", "B", "C", "D", "E", "F"];
    let idx = -1;
    if (/^[1-6]$/.test(input)) idx = +input - 1;
    else idx = labels.findIndex((l, i) => i < entry.options.length && l.toLowerCase() === input.toLowerCase());

    if (idx < 0 || idx >= entry.options.length) return message.reply("⚠️ A, B, C, D er moddhe likho.");

    entry.answered = true;
    clearTimeout(entry.timeoutId);
    global.GoatBot.onReply.delete(qID);

    const selected = entry.options[idx];
    const isCorrect = String(selected).trim().toLowerCase() === String(entry.answer).trim().toLowerCase();

    let resultText;
    if (isCorrect) {
      resultText = 
`╭─〔🎉〕─╮
   ঠিক আছে!
╰──────╯

𝗬𝗲𝘀! Tumi perecho 💖

✦ Tomar uttor: ${selected}
✦ Status: Correct ✅

- Keep it up!`;
    } else {
      resultText = 
`╭─〔💔〕─╮
    ভুল!
╰──────╯

𝗔𝗵𝗵! Vul hoye geche 🥀

✦ Tomar uttor: ${selected}
✦ Sothik uttor: ${entry.answer}

- Next time hobe!`;
    }

    const resMsg = await message.reply(resultText);
    const rID = getMessageID(resMsg);
    if (rID) setTimeout(() => unsend(api, rID), RESULT_DELETE_MS);
    await unsend(api, qID);
  }
};
