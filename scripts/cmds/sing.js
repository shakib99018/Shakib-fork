// code from goatstore
// api: https://store.agi.bd
const axios = require("axios");

const mahmud = async () => {
 const base = await axios.get(
 "https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json"
 );

 return base.data.mahmud;
};

module.exports = {
 config: {
 name: "sing",
 aliases: ["song", "music"],
 version: "1.7",
 author: "Shakib",
 countDown: 10,
 role: 0,

 description: {
 bn: "যেকোনো গান সার্চ করে অডিও ফাইল হিসেবে শুনুন",
 en: "Search and play any song as an audio file",
 vi: "Tìm kiếm và phát bất kỳ bài hát nào dưới dạng tệp âm thanh"
 },

 category: "music",

 guide: {
 bn: "{pn} <গানের নাম>",
 en: "{pn} <song name>",
 vi: "{pn} <tên bài hát>"
 }
 },

 langs: {
 bn: {
 noInput:
 "× বেবি, গানের নাম তো দাও! 🎵\nউদাহরণ: {pn} mood",

 success:
 "✅ | এই নাও তোমার পছন্দের গান বেবি 😘\n• 𝐒𝐨𝐧𝐠: %1",

 error:
 "× সমস্যা হয়েছে: %1"
 },

 en: {
 noInput:
 "× Baby, please provide a song name! 🎵\nExample: {pn} mood",

 success:
 "✅ | Here's your requested song baby 😘\n• 𝐒𝐨𝐧𝐠: %1",

 error:
 "× API error: %1"
 },

 vi: {
 noInput:
 "× Cưng ơi, vui lòng cung cấp tên bài hát! 🎵",

 success:
 "✅ | Bài hát của cưng đây 😘\n• 𝐁𝐚̀𝐢 𝐡𝐚́𝐭: %1",

 error:
 "× Lỗi: %1"
 }
 },

 onStart: async function ({
 api,
 event,
 args,
 message,
 getLang
 }) {

 const authorName = "Shakib";

 if (this.config.author !== authorName) {
 return api.sendMessage(
 "You are not authorized to change the author name.",
 event.threadID,
 event.messageID
 );
 }

 const query = args.join(" ").trim();

 if (!query) {
 api.setMessageReaction(
 "❌",
 event.messageID,
 () => {},
 true
 );

 return message.reply(
 getLang("noInput")
 );
 }

 try {
 api.setMessageReaction(
 "⏳",
 event.messageID,
 () => {},
 true
 );

 const baseUrl = await mahmud();

 const apiUrl =
 `${baseUrl}/api/play?mahmud=` +
 encodeURIComponent(query);

 const response = await axios({
 method: "GET",
 url: apiUrl,
 responseType: "stream",
 timeout: 120000,
 headers: {
 author: authorName
 }
 });

 return message.reply(
 {
 body: getLang(
 "success",
 query
 ),
 attachment: response.data
 },
 () => {
 api.setMessageReaction(
 "🪽",
 event.messageID,
 () => {},
 true
 );
 }
 );

 } catch (err) {
 console.error(
 "Sing Error:",
 err.response?.status || err.message
 );

 api.setMessageReaction(
 "🥹",
 event.messageID,
 () => {},
 true
 );

 return message.reply(
 getLang(
 "error",
 err.response?.status
 ? `Request failed with status code ${err.response.status}`
 : err.message
 )
 );
 }
 }
};