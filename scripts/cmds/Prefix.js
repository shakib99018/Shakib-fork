const fs = require("fs-extra");
const path = require("path");
const request = require("request");

module.exports.config = {
  name: "prefix",
  version: "1.0.1", 
  hasPermssion: 0,
  credits: "🔰𝐑𝐀𝐇𝐀𝐓 𝐈𝐒𝐋𝐀𝐌🔰",
  description: "Display the bot's prefix and owner info with GIF",
  commandCategory: "Information",
  usages: "",
  cooldowns: 5
};

module.exports.handleEvent = async ({ event, api, Threads }) => {
  const { threadID, messageID, body } = event;
  if (!body) return;

  const dataThread = await Threads.getData(threadID);
  const data = dataThread.data || {};
  const threadSetting = global.data.threadData.get(String(threadID)) || {};
  const prefix = threadSetting.PREFIX || global.config.PREFIX;
  const groupName = dataThread.threadInfo?.threadName || "Unnamed Group";

  const triggerWords = [
    "prefix", "mprefix", "mpre", "bot prefix", "what is the prefix", "bot name",
    "how to use bot", "bot not working", "bot is offline", "prefx", "prfix",
    "perfix", "bot not talking", "where is bot", "bot dead", "bots dead",
    "dấu lệnh", "daulenh", "what prefix", "freefix", "what is bot", "what prefix bot",
    "how use bot", "where are the bots", "where prefix"
  ];

  const lowerBody = body.toLowerCase();
  if (triggerWords.includes(lowerBody)) {
    const gifs = (global.client.prefixGifs && global.client.prefixGifs.length) ? global.client.prefixGifs : [];
 const messageBody = 
`🌐 𝗦𝘆𝘀𝘁𝗲𝗺 𝗽𝗿𝗲𝗳𝗶𝘅:   ${global.config.PREFIX}  \n🛸 𝗬𝗼𝘂𝗿 𝗯𝗼𝘅 𝗰𝗵𝗮𝘁 𝗽𝗿𝗲𝗳𝗶𝘅:   ${prefix}
 `;
    if (gifs.length === 0) {
      return api.sendMessage(messageBody, threadID);
    }
    const gifUrl = gifs[Math.floor(Math.random() * gifs.length)];
    const gifPath = path.join(__dirname, 'prefix_info.gif');
    request(encodeURI(gifUrl))
      .pipe(fs.createWriteStream(gifPath))
      .on("close", () => {
        api.sendMessage(
          {
            body: messageBody,
            attachment: fs.createReadStream(gifPath)
          },
          threadID,
          () => fs.unlinkSync(gifPath)
        );
      })
      .on("error", () => {
        api.sendMessage(messageBody, threadID);
      });
  }
};
module.exports.run = async () => {
  return;
};
