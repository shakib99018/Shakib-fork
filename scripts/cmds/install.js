```js
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "install",
    version: "2.0",
    author: "SHAKIB",
    countDown: 5,
    role: 2,
    shortDescription: { en: "Install command" },
    category: "owner"
  },
  onStart: async function ({ api, event, args, message }) {
    let fileName = args[0];
    if (!fileName) return message.reply("Use: install <filename.js>");
    if (!fileName.endsWith(".js")) fileName += ".js";
    const filePath = path.join(__dirname, fileName);
    let code;

    try {
      if (event.type == "message_reply") {
        code = event.messageReply.body;
        if (code.includes("http")) {
           const url = code.match(/(https?:\/\/[^\s]+)/)[0];
           const res = await axios.get(url);
           code = res.data;
        }
      } else {
        const url = event.body.match(/(https?:\/\/[^\s]+)/);
        if (!url) return message.reply("Reply to code or give link");
        const res = await axios.get(url[0]);
        code = res.data;
      }

      await fs.writeFile(filePath, code, "utf-8");

      // Auto Reload - Fixed for new bot
      if (global.GoatBot) global.GoatBot.loadScripts();
      else {
         const utils = require("../../utils");
         if (utils.loadScripts) utils.loadScripts();
      }

      return message.reply(`✅ Done! ${fileName} installed.`);
    } catch (e) {
      return message.reply(`❌ Failed: ${e.message}`);
    }
  }
};
