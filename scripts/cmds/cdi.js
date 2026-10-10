"use strict";

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "cdi",
    aliases: ["cdiframe"],
    version: "1.0.0",
    author: "Sakib",
    countDown: 5,
    role: 0,
    shortDescription: "Create a CDI frame",
    longDescription: "Create a CDI frame using Sakib CDI API",
    category: "image",
    guide: "{pn}cdi [name]"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    const API_URL =
      "https://shakib-cdi-api-production.up.railway.app/api/frame";

    const cacheDir = path.join(__dirname, "cache");
    const imagePath = path.join(
      cacheDir,
      `cdi_${Date.now()}.png`
    );

    try {
      await fs.ensureDir(cacheDir);

      const name = args.join(" ").trim() || "Sakib";

      api.setMessageReaction(
        "⏳",
        messageID,
        () => {},
        true
      );

      const response = await axios.get(API_URL, {
        params: {
          type: "cdi",
          name: name,
          senderName: "Sakib"
        },
        timeout: 60000
      });

      const data = response.data;

      if (!data || !data.success || !data.image) {
        throw new Error(
          data?.error || "API থেকে ছবি পাওয়া যায়নি"
        );
      }

      const imageBuffer = Buffer.from(
        data.image,
        "base64"
      );

      await fs.writeFile(imagePath, imageBuffer);

      await new Promise((resolve, reject) => {
        api.sendMessage(
          {
            body:
              `✨ CDI FRAME\n` +
              `👤 Name: ${name}\n` +
              `💖 Created by Sakib`,
            attachment: fs.createReadStream(imagePath)
          },
          threadID,
          (err) => {
            if (err) reject(err);
            else resolve();
          },
          messageID
        );
      });

      api.setMessageReaction(
        "✅",
        messageID,
        () => {},
        true
      );

    } catch (error) {
      console.error("[CDI ERROR]", error);

      api.sendMessage(
        `❌ CDI Frame তৈরি করা যায়নি।\n` +
        `কারণ: ${error.message}`,
        threadID,
        messageID
      );

      api.setMessageReaction(
        "❌",
        messageID,
        () => {},
        true
      );

    } finally {
      setTimeout(() => {
        fs.remove(imagePath).catch(() => {});
      }, 10000);
    }
  }
};
