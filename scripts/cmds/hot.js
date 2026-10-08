const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "hot",
    aliases: ["shakib", "othorevideo", "heppi"],
    version: "1.0.0",
    author: "SHAKIB",
    countDown: 5,
    role: 0,
    description: { en: "hot video" },
    category: "fun",
    guide: { en: "{pn} hot" }
  },
  onStart: async function ({ api, event, message }) {
    const { messageID, threadID } = event;
    const CACHE_DIR = path.join(__dirname, "cache");

    const links = [
      "https://n.uguu.se/WFnXenfp.mp4",
      "https://files.catbox.moe/0b2tux.mp4",
      "https://files.catbox.moe/84iwf4.mp4",
      "https://files.catbox.moe/18ib1h.mp4",
      "https://files.catbox.moe/581295.mp4",
      "https://files.catbox.moe/gq471j.mp4",
      "https://files.catbox.moe/hmxwkf.mp4",
      "https://files.catbox.moe/gu9542.mp4",
      "https://files.catbox.moe/g32gwj.mp4",
      "https://files.catbox.moe/leakzl.mp4"
    ];

    api.setMessageReaction("⏰", messageID, () => {}, true);

    try {
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }

      const videoUrl = links[Math.floor(Math.random() * links.length)];
      const filePath = path.join(CACHE_DIR, `hot_${Date.now()}.mp4`);

      const response = await axios({
        method: "GET",
        url: videoUrl,
        responseType: "stream",
        timeout: 120000,
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      api.setMessageReaction("✅", messageID, () => {}, true);

      await api.sendMessage(
        {
          body: "এই নে এবার মজা কর 😁🥵",
          attachment: fs.createReadStream(filePath)
        },
        threadID,
        () => {
          try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } catch {}
        }
      );

    } catch (e) {
      console.log("hot error:", e.message);
      api.setMessageReaction("❌", messageID, () => {}, true);
      return message.reply("❌ ভিডিও পাঠানো যায়নি।");
    }
  }
};
