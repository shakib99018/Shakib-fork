"use strict";

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const GIF_URL = "https://i.imgur.com/pTHPhb7.gif";
const CACHE_DIR = path.join(__dirname, "cache");
const GIF_PATH = path.join(CACHE_DIR, "prefix.gif");

async function sendPrefix(message, event, threadsData) {
  try {
    let prefix = global.GoatBot.config.prefix;
    let groupName = "Unknown Group";

    try {
      prefix = global.utils.getPrefix(event.threadID);
      const info = await threadsData.get(event.threadID);
      groupName = info?.threadName || groupName;
    } catch (e) {}

    await fs.ensureDir(CACHE_DIR);

    if (
      !(await fs.pathExists(GIF_PATH)) ||
      (await fs.stat(GIF_PATH)).size < 1000
    ) {
      const response = await axios.get(GIF_URL, {
        responseType: "arraybuffer",
        timeout: 60000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      await fs.writeFile(GIF_PATH, response.data);
    }

    return message.reply({
      body:
        "╭━━『 🤖 PREFIX 』━━╮\n" +
        "🏷️ Group: " + groupName + "\n" +
        "🔰 System Prefix: " + global.GoatBot.config.prefix + "\n" +
        "💬 Group Prefix: " + prefix + "\n" +
        "👑 Owner: Shakib\n" +
        "⚡ Status: ONLINE\n" +
        "╰━━『 ✨ Shakib 』━━╯",
      attachment: fs.createReadStream(GIF_PATH)
    });
  } catch (error) {
    console.error("PREFIX ERROR:", error.message);
    return message.reply("❌ GIF পাঠানো যায়নি!");
  }
}

module.exports = {
  config: {
    name: "prefix",
    version: "3.2",
    author: "Shakib",
    countDown: 3,
    role: 0,
    shortDescription: {
      en: "Show prefix with GIF"
    },
    description: {
      en: "Show prefix with GIF by typing prefix"
    },
    category: "config",
    guide: {
      en: "Type prefix"
    }
  },

  onStart: async function ({ message, event, threadsData }) {
    return sendPrefix(message, event, threadsData);
  },

  onChat: async function ({ message, event, threadsData }) {
    if (!event.body || event.body.trim().toLowerCase() !== "prefix")
      return;

    return sendPrefix(message, event, threadsData);
  }
};
