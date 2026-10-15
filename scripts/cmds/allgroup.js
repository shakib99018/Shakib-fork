module.exports = {
  config: {
    name: "allgroup",
    version: "2.0",
    author: "Sakib",
    role: 2,
    category: "admin",
    aliases: ["allgc", "gclist"],
    guide: "{pn} | reply {pn} leave/ban/unban/add <serial>"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    global.GoatBot.allgcCache = global.GoatBot.allgcCache || {};
    global.GoatBot.bannedGroups = global.GoatBot.bannedGroups || {};

    // ╔════════════════════╗
    // REPLY HANDLE - SAKIB
    // ╚════════════════════╝
    if (event.type == "message_reply") {
      const repliedID = event.messageReply.messageID;
      const cache = global.GoatBot.allgcCache[repliedID];
      if (!cache) return;

      const action = args[0]?.toLowerCase();
      const serials = args.slice(1).map(n => parseInt(n)).filter(n =>!isNaN(n));

      if (!action || serials.length === 0) {
        return api.sendMessage(
          `╭─❍━─❍─ 𝗜𝗡𝗩𝗔𝗟𝗜𝗗 ─❍━─❍─╮\n` +
          `│ ⚠️ Use: reply → leave 1\n` +
          `│ ⚠️ Use: reply → ban 1 2\n` +
          `│ ⚠️ Use: reply → unban 1\n` +
          `│ ⚠️ Use: reply → add 1\n` +
          `╰─❍━─❍─❍─❍─❍─╯\n` +
          `👤 𝗔𝘂𝘁𝗵𝗼𝗿: 𝗦𝗮𝗸𝗶𝗯`, threadID, messageID
        );
      }

      for (let num of serials) {
        const group = cache[num - 1];
        if (!group) {
          await api.sendMessage(`❌ | 𝗦𝗲𝗿𝗶𝗮𝗹 ${num} 𝗜𝗻𝘃𝗮𝗹𝗶𝗱\n👤 𝗦𝗮𝗸𝗶𝗯`, threadID);
          continue;
        }

        const gid = group.threadID;
        const gname = group.name || "Unnamed Group";

        if (action === "leave") {
          try {
            await api.removeUserFromGroup(api.getCurrentUserID(), gid);
            await api.sendMessage(
              `╭─❍━─❍ 𝗟𝗘𝗔𝗩𝗘 𝗗𝗢𝗡𝗘 ❍━─❍─╮\n` +
              `│ ✅ 𝗚𝗿𝗼𝘂𝗽: ${gname}\n` +
              `│ 🔢 𝗦𝗲𝗿𝗶𝗮𝗹: ${num}\n` +
              `│ 🆔 𝗜𝗗: ${gid}\n` +
              `╰─❍━─❍─❍─❍─❍─❍─❍─❍─╯\n` +
              `👤 𝗔𝘂𝘁𝗵𝗼𝗿: 𝗦𝗮𝗸𝗶𝗯`, threadID);
          } catch {
            await api.sendMessage(`❌ 𝗟𝗲𝗮𝘃𝗲 𝗙𝗮𝗶𝗹: ${num}. ${gname}\n👤 𝗦𝗮𝗸𝗶𝗯`, threadID);
          }
        }

        if (action === "ban") {
          if (!global.GoatBot.bannedGroups.includes(gid)) global.GoatBot.bannedGroups.push(gid);
          await api.sendMessage(
            `╭─❍━─❍ 𝗕𝗔𝗡𝗘𝗗 ❍━─❍─╮\n` +
            `│ 🚫 𝗚𝗿𝗼𝘂𝗽: ${gname}\n` +
            `│ 🔢 𝗦𝗲𝗿𝗶𝗮𝗹: ${num}\n` +
            `│ 🆔 𝗜𝗗: ${gid}\n` +
            `╰─❍━─❍─❍─❍─❍─❍─❍─╯\n` +
            `👤 𝗕𝘆: 𝗦𝗮𝗸𝗶𝗯`, threadID);
        }

        if (action === "unban") {
          global.GoatBot.bannedGroups = global.GoatBot.bannedGroups.filter(i => i!== gid);
          await api.sendMessage(
            `╭─❍━─❍ 𝗨𝗡𝗕𝗔𝗡𝗡𝗘𝗗 ❍━─❍─╮\n` +
            `│ ✅ 𝗚𝗿𝗼𝘂𝗽: ${gname}\n` +
            `│ 🔢 𝗦𝗲𝗿𝗶𝗮𝗹: ${num}\n` +
            `╰─❍━─❍─❍─❍─❍─❍─❍─╯\n` +
            `👤 𝗕𝘆: 𝗦𝗮𝗸𝗶𝗯`, threadID);
        }

        if (action === "add") {
          try {
            await api.addUserToGroup(senderID, gid);
            await api.sendMessage(
              `╭─❍━─❍ 𝗔𝗗𝗘𝗗 ❍━─❍─╮\n` +
              `│ ✅ 𝗬𝗼𝘂 𝗔𝗱𝗲𝗱 𝗧𝗼: ${gname}\n` +
              `│ 🔢 𝗦𝗲𝗿𝗶𝗮𝗹: ${num}\n` +
              `╰─❍━─❍─❍─❍─❍─❍─❍─╯\n` +
              `👤 𝗦𝗮𝗸𝗶𝗯`, threadID);
          } catch {
            await api.sendMessage(`❌ 𝗔𝗱𝗱 𝗙𝗮𝗶𝗹: ${gname} | 𝗕𝗼𝘁 𝗔𝗱𝗺𝗶𝗻 𝗡𝗮\n👤 𝗦𝗮𝗸𝗶𝗯`, threadID);
          }
        }
      }
      return;
    }

    // ╔════════════════════╗
    // ALL GROUP LIST
    // ╚════════════════════╝
    const threads = await api.getThreadList(100, null, ["INBOX"]);
    const groups = threads.filter(t => t.isGroup);

    if (groups.length === 0) {
      return api.sendMessage(
        `╭─❍━─❍ 𝗘𝗥𝗢𝗥 ❍━─❍─╮\n` +
        `│ ❌ 𝗕𝗼𝘁 𝗞𝗼𝗻𝗼 𝗚𝗿𝗼𝘂𝗽 𝗘 𝗡𝗮𝗶\n` +
        `╰─❍━─❍─❍─❍─❍─❍─╯\n` +
        `👤 𝗦𝗮𝗸𝗶𝗯`, threadID, messageID
      );
    }

    let msg = `╭─❍━─❍ 𝗔𝗟 𝗚𝗥𝗢𝗨𝗣 𝗟𝗜𝗦𝗧 ❍━─❍─╮\n`;
    msg += `│ 📜 𝗧𝗼𝘁𝗮𝗹 𝗚𝗿𝗼𝘂𝗽: ${groups.length}\n`;
    msg += `│ 👤 𝗔𝘂𝘁𝗵𝗼𝗿: 𝗦𝗮𝗸𝗶𝗯\n`;
    msg += `├─❍━─❍─❍─❍─❍─❍─❍─❍\n`;

    groups.forEach((g, i) => {
      msg += `│ ${i + 1}. ${g.name || "Unnamed"}\n`;
      msg += `│ 🆔 ${g.threadID}\n`;
      msg += `│ ─────────────\n`;
    });

    msg += `╰─❍━─❍─❍─❍─❍─❍─❍─❍─╯\n`;
    msg += `💬 𝗥𝗲𝗽𝗹𝘆 𝗞𝗼𝗿𝗲 𝗟𝗶𝗸𝗵𝗼:\n`;
    msg += `├ • 𝗹𝗲𝗮𝘃𝗲 <serial>\n`;
    msg += `├ • 𝗯𝗮𝗻 <serial>\n`;
    msg += `├ • 𝘂𝗻𝗯𝗮𝗻 <serial>\n`;
    msg += `╰ • 𝗮𝗱𝗱 <serial>\n\n`;
    msg += `✨ 𝗠𝗮𝗱𝗲 𝗪𝗶𝘁𝗵 𝗟𝗼𝘃𝗲 𝗕𝘆 𝗦𝗮𝗸𝗶𝗯 ✨`;

    api.sendMessage(msg, threadID, (err, info) => {
      global.GoatBot.allgcCache[info.messageID] = groups;
    });
  }
};
