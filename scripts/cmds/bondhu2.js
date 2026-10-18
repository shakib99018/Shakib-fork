const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const { loadImage, createCanvas } = require("canvas");

const TEMPLATE_URL = "https://i.ibb.co/20WJfxgX/21e3e67cae3a.jpg";
const OUTPUT_WIDTH = 1400;
const OUTPUT_HEIGHT = 1400;
const BOTTOM_SLOT = { x: 10, y: 700, w: 680, h: 680 };
const BLOCKED_UIDS = ["UID_1", "UID_2", "UID_3"];
const FB_ACCESS_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

module.exports = {
  config: {
    name: "bondhu2",
    aliases: [],
    version: "1.0.0",
    author: "shakib",
    countDown: 5,
    role: 0,
    description: {
      en: "Funny meme with a mentioned or replied user's avatar",
      bn: "Mention/reply kora user er avatar diye funny meme"
    },
    category: "fun",
    guide: {
      en: "{pn} @mention or reply to a message"
    }
  },
  langs: {
    en: {
      noMention: "❌ | Mention someone or reply to a message!",
      blocked: "❌ | This command cannot be used for this user.",
      avatarError: "❌ | Failed to get user's profile picture.",
      templateError: "❌ | Failed to load the template image.",
      error: "❌ | Failed to generate. Try again."
    },
    bn: {
      noMention: "❌ | কাউকে mention করুন বা reply করুন!",
      blocked: "❌ | এই user-এর জন্য command টি কাজ করবে না।",
      avatarError: "❌ | User-এর profile picture নেওয়া যায়নি।",
      templateError: "❌ | Template image load করা যায়নি।",
      error: "❌ | তৈরি করতে সমস্যা হয়েছে।"
    }
  },
  onStart: async function ({ event, message, getLang, args }) {
    let avtPath = null;
    let outputPath = null;
    try {
      const targetID = Object.keys(event.mentions || {})[0] ||
        (event.messageReply && event.messageReply.senderID) ||
        (args[0] && /^\d+$/.test(args[0]) ? args[0] : null);

      if (!targetID) {
        return message.reply(getLang("noMention"));
      }
      const target = String(targetID);
      if (BLOCKED_UIDS.includes(target)) {
        return message.reply(getLang("blocked"));
      }
      const timestamp = Date.now();
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      avtPath = path.join(cacheDir, `bondhu2_avt_${timestamp}.jpg`);
      outputPath = path.join(cacheDir, `bondhu2_out_${timestamp}.png`);

      const avatarURL = `https://graph.facebook.com/${target}/picture?height=720&width=720&access_token=${FB_ACCESS_TOKEN}`;

      let avatarResponse;
      let templateResponse;
      try {
        [avatarResponse, templateResponse] = await Promise.all([
          axios.get(avatarURL, { responseType: "arraybuffer", timeout: 20000 }),
          axios.get(TEMPLATE_URL, { responseType: "arraybuffer", timeout: 20000 })
        ]);
      } catch (error) {
        console.error("Bondhu2 Download Error:", error.message);
        return message.reply(getLang("error"));
      }

      await fs.writeFile(avtPath, Buffer.from(avatarResponse.data));
      const avatar = await loadImage(avtPath);
      const template = await loadImage(Buffer.from(templateResponse.data));

      const canvas = createCanvas(OUTPUT_WIDTH, OUTPUT_HEIGHT);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(template, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

      ctx.save();
      ctx.beginPath();
      ctx.rect(BOTTOM_SLOT.x, BOTTOM_SLOT.y, BOTTOM_SLOT.w, BOTTOM_SLOT.h);
      ctx.clip();
      drawFullImage(ctx, avatar, BOTTOM_SLOT.x, BOTTOM_SLOT.y, BOTTOM_SLOT.w, BOTTOM_SLOT.h);
      ctx.restore();

      await fs.writeFile(outputPath, canvas.toBuffer("image/png"));
      await message.reply({
        attachment: fs.createReadStream(outputPath)
      });

    } catch (error) {
      console.error("Bondhu2 Error:", error);
      return message.reply(getLang("error"));
    } finally {
      if (avtPath) {
        try { await fs.remove(avtPath); } catch (_) {}
      }
      if (outputPath) {
        try { await fs.remove(outputPath); } catch (_) {}
      }
    }
  }
};

function drawFullImage(ctx, img, x, y, w, h) {
  const scale = Math.min(w / img.width, h / img.height);
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  const drawX = x + (w - drawWidth) / 2;
  const drawY = y + (h - drawHeight) / 2;
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
}
