module.exports = {
 config: {
   name: "gcpp",
   version: "2.0",
   author: "shakib",
   countDown: 5,
   role: 0,
   shortDescription: "group pp premium",
   category: "group",
   guide: "{pn}"
 },
 onStart: async function ({ api, event, message }) {
   try {
     const info = await api.getThreadInfo(event.threadID);
     const name = info.threadName || "Unknown Group";
     const image = info.imageSrc;

     if (!image) {
       return message.reply(`╔═══❖•°•❖═══╗\n  👑 GROUP INFO 👑\n╚═══❖•°•❖═══╝\n\n❌ No Profile Picture Found!\n\n🏆 Name: ${name}\n👥 Members: ${info.participantIDs.length}\n\n✨ Add a DP to see magic!`);
     }

     let msg = `╔═══❖•°•❖═══╗\n`;
     msg += `  👑 𝐏𝐑𝐄𝐌𝐈𝐄𝐑 𝐆𝐂 👑\n`;
     msg += `╚═══❖•°•❖═══╝\n\n`;
     msg += `🖼️ 𝗚𝗥𝗢𝗨𝗣 𝗣𝗥𝗢𝗙𝗜𝗟𝗘\n`;
     msg += `━━━━━━━━━━━━━━━━━━━━\n`;
     msg += `🏷️ 𝗡𝗮𝗺𝗲: ${name}\n`;
     msg += `👥 𝗠𝗲𝗺𝗯𝗲𝗿𝘀: ${info.participantIDs.length}\n`;
     msg += `🆔 𝗧𝗜𝗗: ${event.threadID}\n`;
     msg += `━━━━━━━━━━━━━━━━━━━━\n`;
     msg += `💎 𝐏𝐫𝐞𝐦𝐢𝐮𝐦 𝐆𝐂 𝐃𝐏 💎`;

     return message.reply({
       body: msg,
       attachment: await global.utils.getStreamFromURL(image)
     });

   } catch (e) {
     return message.reply("Error: " + e.message);
   }
 }
};
