const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

let videoQueue = [];

module.exports = {
  config: {
    name: "heppi",
    version: "2.0",
    author: "Sakib",
    countDown: 3,
    role: 0,
    shortDescription: "heppi video",
    longDescription: "Send heppi videos without repeating until the cycle ends.",
    category: "fun",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event }) {
    const cacheDir = path.join(__dirname, "cache");

    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const links = [
      "https://files.catbox.moe/ba8wa5.mp4",
      "https://files.catbox.moe/ohup25.mp4",
      "https://files.catbox.moe/k290b8.mp4",
      "https://files.catbox.moe/5y0031.mp4",
      "https://files.catbox.moe/farczb.mp4",
      "https://files.catbox.moe/ptr1bv.mp4",
      "https://files.catbox.moe/ake7bo.mp4",
      "https://h.uguu.se/mlqZGLxJ.mp4",
      "https://files.catbox.moe/otiko5.mp4",
      "https://files.catbox.moe/o3bnxy.mp4"
    ];

    function shuffle(array) {
      const result = [...array];

      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }

      return result;
    }

    if (videoQueue.length === 0) {
      videoQueue = shuffle(links);
    }

    let response = null;
    let videoUrl = null;
    let checked = 0;

    while (videoQueue.length > 0 && checked < links.length) {
      videoUrl = videoQueue.shift();
      checked++;

      try {
        response = await axios.get(videoUrl, {
          responseType: "arraybuffer",
          timeout: 120000,
          maxRedirects: 5,
          validateStatus: function (status) {
            return status >= 200 && status < 300;
          }
        });

        break;
      } catch (error) {
        response = null;

        console.log(
          "[HEPPI] Skipped:",
          videoUrl,
          error.response
            ? error.response.status
            : error.message
        );
      }
    }

    if (!response) {
      videoQueue = [];
      return api.sendMessage(
        "❌ কোনো কাজ করা ভিডিও লিংক পাওয়া যায়নি।",
        event.threadID,
        event.messageID
      );
    }

    const filePath = path.join(
      cacheDir,
      "heppi_" + Date.now() + ".mp4"
    );

    try {
      fs.writeFileSync(filePath, Buffer.from(response.data));

      await api.sendMessage(
        {
          body: "এই নে আমার কাশ কে দেখ 😁",
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        function (err) {
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
            } catch (e) {
              console.log("[HEPPI] Delete error:", e.message);
            }
          }

          if (err) {
            console.log("[HEPPI] Send error:", err.message);
          }
        },
        event.messageID
      );
    } catch (error) {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {}
      }

      return api.sendMessage(
        "❌ ভিডিও পাঠাতে সমস্যা হয়েছে।",
        event.threadID,
        event.messageID
      );
    }
  }
};
