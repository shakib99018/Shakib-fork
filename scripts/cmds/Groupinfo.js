module.exports = {
  config: {
    name: "group",
    aliases: ["gc", "groupinfo", "gcinfo", "boxinfo"],
    version: "2.0",
    author: "Sakib",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Group info stylish"
    },
    longDescription: {
      en: "Show stylish group information"
    },
    category: "group",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event, args }) {
    try {
      const info = await api.getThreadInfo(event.threadID);
      
      const msg = `━━━━━━━━━━━━━━━━━━━━━
 𓆩 𝘍𝘐𝘓𝘌 𝘊𝘖𝘋𝘌 𝘝𝘐𝘌𝘞 𓆪
📂 𝘍𝘪𝘭𝘦: group.js
👤 𝘈𝘶𝘵𝘩𝘰𝘳: Sakib
━━━━━━━━━━━━━━━━━━━━━
💫___GROUP INFO___💫
━━━━━━━━━━━━━━━━━━━━━
👑 Name: ${info.threadName || "Unnamed Group"}
🆔 TID: ${event.threadID}
👥 Members: ${info.participantIDs.length}
🛡️ Admins: ${info.adminIDs.length}
🔒 Approval: ${info.approvalMode ? "On ✅" : "Off ❌"}
💬 Emoji: ${info.emoji || "None"}
💌 Message Count: ${info.messageCount || "0"}
━━━━━━━━━━━━━━━━━━━━━
✨ Made With Love By Sakib ✨
━━━━━━━━━━━━━━━━━━━━━`;

      return api.sendMessage(msg, event.threadID, event.messageID);
    } catch (e) {
      console.log(e);
      return api.sendMessage("❌ Group info load failed\n👤 Author: Sakib", event.threadID, event.messageID);
    }
  }
};
