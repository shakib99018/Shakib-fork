const axios = require('axios');

async function sb(api, event, args, message) {
 try {
   const prompt = args.join(" ").trim();
   if (!prompt) {
     return message.reply("❌ Please provide a prompt.\n\nEx: sb hello\nEx: sb kemon acho?");
   }
   const response = await getSbResponse(prompt);
   if (response && response.answer) {
     message.reply(response.answer, (r, s) => {
       global.GoatBot.onReply.set(s.messageID, {
         commandName: module.exports.config.name,
         uid: event.senderID
       });
     });
   } else {
     message.reply("No response from SB.");
   }
 } catch (error) {
   console.error("Error:", error);
   message.reply("An error occurred while processing your request.");
 }
}

async function getSbResponse(prompt) {
 try {
   const url = `https://liner-ai.vercel.app/kshitiz?prompt=${encodeURIComponent(prompt)}`;
   const response = await axios.get(url);
   return response.data;
 } catch (error) {
   console.error("Error from SB API:", error.message);
   throw error;
 }
}

module.exports = {
 config: {
   name: "sb",
   version: "1.0",
   author: "shakib",
   role: 0,
   longDescription: "SB AI assistant.",
   category: "ai",
   guide: {
     en: "{p}sb [prompt]"
   }
 },
 handleCommand: sb,
 onStart: function ({ api, message, event, args }) {
   return sb(api, event, args, message);
 },
 onReply: function ({ api, message, event, args }) {
   return sb(api, event, args, message);
 }
};
