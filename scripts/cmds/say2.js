const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  config: {
    name: "say2",
    version: "1.0.5",
    author: "RS.RIFAT",
    countDown: 5,
    role: 0,
    shortDescription: "Text to Google Voice",
    longDescription: "Convert text to speech via Google Translate API",
    category: "utility",
    guide: {
      en: "[text] or reply to a message"
    }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, messageReply, type } = event;
    
    try {
      let content = args.join(" ");
      if (type == "message_reply") {
        content = messageReply.body;
      }

      if (!content) {
        return api.sendMessage("Kisu likhen ba message reply den!", threadID, messageID);
      }

      // Language fix (Bengali default)
      let languageToSay = "bn"; 
      let textToSay = content;
      if (content.includes(" -")) {
        const parts = content.split(" -");
        textToSay = parts[0];
        languageToSay = parts[1].trim();
      }

      // File path setup
      const filePath = path.join(__dirname, `say_${Date.now()}.mp3`);

      // Get Audio from Google
      const response = await axios.get(`https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(textToSay)}&tl=${languageToSay}&client=tw-ob`, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });

      // Save file
      fs.writeFileSync(filePath, Buffer.from(response.data, 'utf-8'));

      // Send Audio
      if (fs.existsSync(filePath)) {
        return api.sendMessage({
          body: "",
          attachment: fs.createReadStream(filePath)
        }, threadID, (err) => {
          if (err) console.error(err);
          // Delete after sending
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }, messageID);
      } else {
        api.sendMessage("Audio file generate hote paroni.", threadID, messageID);
      }

    } catch (error) {
      console.error(error);
      api.sendMessage("Google API theke response pawa jacche na. Abar try koren.", threadID, messageID);
    }
  }
};
