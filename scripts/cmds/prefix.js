const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const VIDEO_URL = "https://files.catbox.moe/vnulw5.dat";
const CACHE_DIR = path.join(__dirname, "cache");
const VIDEO_PATH = path.join(CACHE_DIR, "prefix.mp4");

module.exports = {
  config: {
    name: "prefix",
    version: "1.1",
    author: "Shakib",
    countDown: 5,
    role: 0,
    description: "Show bot prefix with video",
    category: "config"
  },

  onStart: async function ({ message, event, threadsData }) {
    const prefix = global.GoatBot.config.prefix;
    let groupPrefix = prefix;
    let groupName = "Unknown Group";
    let attachment;

    try {
      groupPrefix = global.utils.getPrefix(event.threadID);
      const info = await threadsData.get(event.threadID);
      groupName = info?.threadName || groupName;
    } catch (e) {}

    try {
      await fs.ensureDir(CACHE_DIR);
      if (
        !(await fs.pathExists(VIDEO_PATH)) ||
        (await fs.stat(VIDEO_PATH)).size < 1000
      ) {
        const response = await axios.get(VIDEO_URL, {
          responseType: "arraybuffer",
          timeout: 60000
        });
        await fs.writeFile(VIDEO_PATH, response.data);
      }
      attachment = fs.createReadStream(VIDEO_PATH);
    } catch (error) {
      console.error("PREFIX VIDEO ERROR:", error.message);
    }

    const reply = {
      body:
        "╭━━〔 🤖 PREFIX 〕━━╮\n" +
        "🏷️ Group: " + groupName + "\n" +
        "🔰 System: " + prefix + "\n" +
        "💬 Group: " + groupPrefix + "\n" +
        "👑 Owner: Shakib\n" +
        "⚡ Status: ONLINE\n" +
        "╰━━〔 ✨ Shakib 〕━━╯"
    };

    if (attachment) reply.attachment = attachment;
    return message.reply(reply);
  }
};
