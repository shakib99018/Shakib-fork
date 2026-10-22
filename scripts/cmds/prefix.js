"use strict";

const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const GIF_URL = "https://i.imgur.com/pTHPhb7.gif";
const CACHE_DIR = path.join(__dirname, "cache");
const GIF_PATH = path.join(CACHE_DIR, "prefix.gif");

module.exports = {
  config: {
    name: "prefix",
    version: "2.3",
    author: "Shakib",
    countDown: 3,
    role: 0,
    description: "Show prefix with GIF",
    category: "config"
  },

  onStart: async function ({ message, event, threadsData }) {
    const prefix = global.GoatBot.config.prefix;
    let groupPrefix = prefix;
    let groupName = "Unknown Group";

    try {
      groupPrefix = global.utils.getPrefix(event.threadID);
      const info = await threadsData.get(event.threadID);
      groupName = info?.threadName || groupName;
    } catch (e) {
      console.log(e.message);
    }

    try {
      await fs.ensureDir(CACHE_DIR);

      if (
        !(await fs.pathExists(GIF_PATH)) ||
        (await fs.stat(GIF_PATH)).size < 1000
      ) {
        const response = await axios.get(GIF_URL, {
          responseType: "arraybuffer",
          timeout: 60000,
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        });

        await fs.writeFile(GIF_PATH, response.data);
      }

      const reply = {
        body:
          "╭━━〔 🤖 PREFIX 〕━━╮\n" +
          "🏷️ Group: " + groupName + "\n" +
          "🔰 System: " + prefix + "\n" +
          "💬 Group: " + groupPrefix + "\n" +
          "👑 Owner: Shakib\n" +
          "⚡ Status: ONLINE\n" +
          "╰━━〔 ✨ Shakib 〕━━╯",
        attachment: fs.createReadStream(GIF_PATH)
      };

      return message.reply(reply);
    } catch (error) {
      console.error("PREFIX GIF ERROR:", error.message);
      return message.reply(
        "❌ GIF পাঠানো যায়নি!\nError: " + error.message
      );
    }
  }
};
