module.exports = {
  config: {
    name: "tag",
    version: "2.0",
    author: "—͞𝐏ʀɪᴍᴇ́",
    role: 0,
    category: "group",
    guide: "{pn} <name> | {pn} all | {pn} all <text> | reply {pn} | reply {pn} <text>"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, type, messageReply } = event;
    const info = await api.getThreadInfo(threadID);
    const participants = info.participantIDs;
    const userInfo = info.userInfo || [];
    const nicknames = info.nicknames || {};
    const getName = (id) => nicknames[id] || userInfo.find(u => u.id == id)?.name || "user";

    if (type === "message_reply") {
      const id = messageReply.senderID;
      const name = getName(id);
      const text = args.join(" ");
      return api.sendMessage({
        body: text? `@${name}\n${text}` : `@${name}`,
        mentions: [{ tag: `@${name}`, id }]
      }, threadID, messageID);
    }

    if (!args[0]) {
      return api.sendMessage("⚠️ Use: tag <name> / tag all / tag all <text>", threadID, messageID);
    }

    const query = args[0].toLowerCase();
    const restText = args.slice(1).join(" ");

    if (query === "all") {
      const mentions = [];
      let body = "";
      for (let id of participants) {
        const name = getName(id);
        mentions.push({ tag: `@${name}`, id });
        body += `@${name} `;
      }
      if (restText) body += `\n${restText}`;
      return api.sendMessage({ body: body.trim(), mentions }, threadID, messageID);
    }

    const matched = participants.filter(id => getName(id).toLowerCase().includes(query));

    if (matched.length > 0) {
      const mentions = [];
      let body = "";
      for (let id of matched) {
        const name = getName(id);
        mentions.push({ tag: `@${name}`, id });
        body += `@${name} `;
      }
      if (restText) body += `\n${restText}`;
      return api.sendMessage({ body: body.trim(), mentions }, threadID, messageID);
    } else {
      return api.sendMessage(`❌ "${args[0]}" nam e kawke pelam na`, threadID, messageID);
    }
  }
};
