const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

let videoQueue = [];
let usedVideos = [];
let isSending = false;

const links = [
  "https://drive.google.com/uc?id=1gI265E7VL9cdyk6TuuFav2uA1HifQs5Y",
  "https://drive.google.com/uc?id=1gMAKxgOmW8KHCGZHHgdy9oVbAQlwju1R",
  "https://drive.google.com/uc?id=1gSBzIdm6lys5uU25xLfO2eJ2T9j5USqB",
  "https://drive.google.com/uc?id=1gT7IaIa7OGZ6DqFaIkZ9wDInscdPM19i",
  "https://drive.google.com/uc?id=1gZ_yXg7-nhugrDFRu3eod7WkqdRx7__z",
  "https://drive.google.com/uc?id=1g_W88siZAAa9t0dfoh4MN_yS1EZi6LES",
  "https://drive.google.com/uc?id=1gagkI-OzhhFp96lgu92zFUe7eRfI-HYB",
  "https://drive.google.com/uc?id=1gaz8T8mZ5I9wjnEkalM_YWe0RKjSjHon",
  "https://drive.google.com/uc?id=1ghSYY81_y75d13dCNVBgsN-KknWFqZPe",
  "https://drive.google.com/uc?id=1grPs_ZOxRLJjeckE_18ufIuXmO4JiqX8",
  "https://drive.google.com/uc?id=1h2LUncQ1EY-qPpvu3jBoIwYpzkcCT3-f",
  "https://drive.google.com/uc?id=1h7wXAn7UCoGjki__OC3KCe7P5YtkSL5",
  "https://drive.google.com/uc?id=1i67IloPzLl4sm1M_-pYF27fmO7ietqwF",
  "https://drive.google.com/uc?id=1oRSrxjBy3TpoJuqvLlr2G-rarEXmpfqb",
  "https://drive.google.com/uc?id=1o_52X4nBwE-ZhNBoELquEpJVNt8s4Nlw",
  "https://drive.google.com/uc?id=1oZYPzoa-nrv86wcHLYJCKDgxyB0WoBlB",
  "https://drive.google.com/uc?id=1oTXBxT0Wgk4fn92lZQww34aPyIOw4JsL",
  "https://drive.google.com/uc?id=1oUECTBiTT4oOV-fIeRCIngN0RDgHYynY",
  "https://drive.google.com/uc?id=1oZDfbjwKAZ8qzy1oOp9bwN6LZfNrWhR9",
  "https://drive.google.com/uc?id=1oJzK17HPM4kWbz4PCmTCZ0Js3dZRoTVI"
];

function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

module.exports = {
  config: {
    name: "animevideo",
    aliases: ["anime", "avideo"],
    version: "3.0",
    author: "Sakib",
    countDown: 3,
    role: 0,
    shortDescription: "Anime video",
    longDescription: "Send anime videos without repeating until all videos are used.",
    category: "media",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event }) {
    const threadID = event.threadID;
    const messageID = event.messageID;
    const cacheDir = path.join(__dirname, "cache");

    if (isSending) {
      return api.sendMessage(
        "⏳ আগের ভিডিওটি পাঠানো হচ্ছে। একটু অপেক্ষা করো!",
        threadID,
        messageID
      );
    }

    isSending = true;
    let filePath = null;

    try {
      await fs.ensureDir(cacheDir);

      if (videoQueue.length === 0) {
        if (usedVideos.length >= links.length) {
          usedVideos = [];
        }

        const remaining = links.filter(
          function (url) {
            return !usedVideos.includes(url);
          }
        );

        videoQueue = shuffle(remaining);
      }

      let response = null;
      let videoUrl = null;

      while (videoQueue.length > 0) {
        const candidate = videoQueue.shift();

        try {
          const result = await axios.get(candidate, {
            responseType: "arraybuffer",
            timeout: 120000,
            maxRedirects: 5,
            validateStatus: function (status) {
              return status >= 200 && status < 300;
            }
          });

          const contentType =
            result.headers["content-type"] || "";

          if (
            contentType.includes("text/html") ||
            contentType.includes("application/json") ||
            !result.data ||
            result.data.length === 0
          ) {
            usedVideos.push(candidate);
            console.log("[ANIMEVIDEO] Invalid video:", candidate);
            continue;
          }

          response = result;
          videoUrl = candidate;
          break;
        } catch (error) {
          usedVideos.push(candidate);

          console.log(
            "[ANIMEVIDEO] Skipped:",
            candidate,
            error.message
          );
        }
      }

      if (!response) {
        videoQueue = [];

        return api.sendMessage(
          "❌ এখন কোনো কাজ করা ভিডিও লিংক পাওয়া যায়নি।",
          threadID,
          messageID
        );
      }

      usedVideos.push(videoUrl);

      const videoNumber = usedVideos.length;
      filePath = path.join(
        cacheDir,
        "animevideo_" + Date.now() + ".mp4"
      );

      await fs.writeFile(filePath, Buffer.from(response.data));

      await new Promise(function (resolve, reject) {
        api.sendMessage(
          {
            body:
              "🎬 ANIME VIDEO\n" +
              "📽️ Cycle: " + videoNumber + "/" + links.length + "\n" +
              "🔰 Author: Sakib",
            attachment: fs.createReadStream(filePath)
          },
          threadID,
          function (err) {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          },
          messageID
        );
      });
    } catch (error) {
      console.log("[ANIMEVIDEO] Error:", error.message);

      return api.sendMessage(
        "❌ ভিডিও পাঠাতে সমস্যা হয়েছে। পরে আবার চেষ্টা করো।",
        threadID,
        messageID
      );
    } finally {
      if (filePath) {
        await fs.remove(filePath).catch(function () {});
      }

      isSending = false;
    }
  }
};
