const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "active",
    aliases: ["act", "activity"],
    version: "2.0",
    author: "Sakib",
    countDown: 5,
    role: 0,
    description: { en: "Show today's active members" },
    category: "group",
    guide: { en: "{pn}" }
  },

  onStart: async function ({ api, event, usersData, threadsData }) {
    const { threadID, messageID } = event;
    const threadData = await threadsData.get(threadID);
    const today = moment.tz("Asia/Dhaka").format("YYYY-MM-DD");

    // Get today's data
    const activeData = threadData.data?.activeToday || {};

    if (activeData.date!== today ||!activeData.users) {
      return api.sendMessage(`📊 আজকে এখনো কেউ active না\n\n❥ ${today} তারিখে এখন পর্যন্ত কোনো মেসেজ কাউন্ট হয়নি`, threadID, messageID);
    }

    const users = activeData.users;
    const sorted = Object.entries(users).sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) {
      return api.sendMessage("📊 আজকে এখনো কেউ active না", threadID, messageID);
    }

    let msg = `╭─❍ 📊 𝗧𝗢𝗗𝗔𝗬 𝗔𝗖𝗧𝗜𝗩𝗘 𝗟𝗜𝗦𝗧 ❍─╮\n`;
    msg += `│ 📅 Date: ${today}\n`;
    msg += `│ 👥 Total: ${sorted.length} জন\n`;
    msg += `│\n`;

    for (let i = 0; i < Math.min(sorted.length, 20); i++) {
      const [userID, count] = sorted[i];
      let name = "Unknown";
      try {
        name = await usersData.getName(userID);
      } catch {}
      const rank = i === 0? "🥇" : i === 1? "🥈" : i === 2? "🥉" : ` ${i+1}.`;
      msg += `│ ${rank} ${name}: ${count} টা মেসেজ\n`;
    }

    msg += `│\n╰─❍─❍─❍─❍─❍─❍─❍─❍─╯\n\n❥ সব থেকে বেশি active হলো ${await usersData.getName(sorted[0][0])} 🔥`;

    return api.sendMessage(msg, threadID, messageID);
  },

  onChat: async function ({ api, event, threadsData }) {
    const { threadID, senderID } = event;
    if (!threadID ||!senderID) return;

    // Bot message ignore
    if (senderID == api.getCurrentUserID()) return;

    const today = moment.tz("Asia/Dhaka").format("YYYY-MM-DD");

    try {
      const threadData = await threadsData.get(threadID);
      let activeData = threadData.data?.activeToday;

      if (!activeData || activeData.date!== today) {
        activeData = {
          date: today,
          users: {}
        };
      }

      activeData.users[senderID] = (activeData.users[senderID] || 0) + 1;

      await threadsData.set(threadID, {
        data: {
         ...threadData.data,
          activeToday: activeData
        }
      });

    } catch (e) {
      console.log("active error:", e.message);
    }
  }
};const
