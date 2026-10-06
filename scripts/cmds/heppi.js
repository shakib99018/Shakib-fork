const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "heppi",
    version: "1.3",
    author: "SHAKIB",
    countDown: 3,
    role: 0,
    shortDescription: { en: "heppi video" },
    category: "fun",
    guide: { en: "{pn}" }
  },
  onStart: async function ({ api, event }) {
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const links = [
      "https://files.catbox.moe/ba8wa5.mp4",
      "https://files.catbox.moe/ohup25.mp4",
      "https://files.catbox.moe/k290b8.mp4",
      "https://files.catbox.moe/5y0031.mp4",
      "https://files.catbox.moe/farczb.mp4",
      "https://files.catbox.moe/ptr1bv.mp4",
      "https://files.catbox.moe/ake7bo.mp4",
      "https://h.uguu.se/mlqZGLxJ.mp4"
    ];

    const filePath = path.join(cacheDir, `heppi_${Date.now()}.mp4`);
    const videoUrl = links[Math.floor(Math.random() * links.length)];

    try {
      const res = await axios({
        method: "GET",
        url: videoUrl,
        responseType: "arraybuffer",
        timeout: 120000
      });
      fs.writeFileSync(filePath, Buffer.from(res.data));
      await api.sendMessage({
        body: "এই নে আমার কাশ কে দেখ 😁",
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, event.messageID);
    } catch (e) {
      return api.sendMessage(`❌ Error: ${e.message}`, event.threadID, event.messageID);
    }
  }
};
