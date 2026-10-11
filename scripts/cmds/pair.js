// code from goatstore
// api: https://store.agi.bd
const axios = require("axios");
const Canvas = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
 config: {
 name: "pair",
 version: "1.0.0",
 author: "𝐌𝐚𝐑𝐮𝐅",
 role: 0,
 countDown: 5,
 shortDescription: "Luxury romantic pair system",
 category: "FUN & SOCIAL",
 guide: {
 en: "{pn}"
 }
 },

 onStart: async function ({ api, event, usersData }) {
 const {
 threadID,
 messageID,
 senderID,
 messageReply
 } = event;

 try {
 let targetID = senderID;
 let targetName = null;

 if (messageReply) {
 targetID = messageReply.senderID;

 try {
 const userData =
 await usersData.get(targetID);

 targetName =
 userData.name || "User";
 } catch {
 targetName = "User";
 }
 }

 const loading =
 await api.sendMessage(
 "💞 | Creating your perfect pair...",
 threadID
 );

 const [
 senderData,
 threadInfo
 ] = await Promise.all([
 usersData.get(targetID),
 api.getThreadInfo(threadID)
 ]);

 const senderName =
 targetName ||
 senderData.name ||
 "User";

 const senderGender =
 senderData.gender;

 const members =
 threadInfo.participantIDs.filter(
 uid => uid != targetID
 );

 if (!members.length) {
 if (loading?.messageID) {
 try {
 await api.unsendMessage(
 loading.messageID,
 threadID
 );
 } catch {}
 }

 return api.sendMessage(
 "❌ No other members found in this group.",
 threadID,
 messageID
 );
 }

 let targetGender;

 if (senderGender === 1) {
 targetGender = 2;
 } else if (senderGender === 2) {
 targetGender = 1;
 } else {
 targetGender =
 Math.random() > 0.5 ? 1 : 2;
 }

 let partnerList = [];

 const randomMembers =
 members.sort(
 () => 0.5 - Math.random()
 );

 for (const uid of randomMembers) {
 try {
 const data =
 await usersData.get(uid);

 if (
 data &&
 data.gender === targetGender
 ) {
 partnerList.push({
 id: uid,
 name:
 data.name || "Someone",
 gender: data.gender
 });
 }
 } catch {}
 }

 let partner;

 if (partnerList.length > 0) {
 partner =
 partnerList[
 Math.floor(
 Math.random() *
 partnerList.length
 )
 ];
 } else {
 let fallbackPartner = null;

 for (const uid of randomMembers) {
 try {
 const data =
 await usersData.get(uid);

 if (
 data &&
 data.gender !== senderGender &&
 data.gender !== undefined
 ) {
 fallbackPartner = {
 id: uid,
 name:
 data.name || "Someone",
 gender: data.gender
 };

 break;
 }
 } catch {}
 }

 if (fallbackPartner) {
 partner = fallbackPartner;
 } else {
 const fallbackID =
 randomMembers[
 Math.floor(
 Math.random() *
 randomMembers.length
 )
 ];

 partner = {
 id: fallbackID,
 name: "Someone Special",
 gender: targetGender
 };
 }
 }

 if (
 partner.gender === senderGender &&
 senderGender !== undefined
 ) {
 for (const uid of randomMembers) {
 try {
 const data =
 await usersData.get(uid);

 if (
 data &&
 data.gender !== senderGender &&
 data.gender !== undefined
 ) {
 partner = {
 id: uid,
 name:
 data.name || "Someone",
 gender: data.gender
 };

 break;
 }
 } catch {}
 }
 }

 const match =
 Math.floor(
 Math.random() * 31
 ) + 70;

 const canvas =
 Canvas.createCanvas(
 1500,
 900
 );

 const ctx =
 canvas.getContext("2d");

 const width =
 canvas.width;

 const height =
 canvas.height;

 const bg =
 ctx.createLinearGradient(
 0,
 0,
 width,
 height
 );

 bg.addColorStop(
 0,
 "#fff7fb"
 );

 bg.addColorStop(
 0.5,
 "#f9e8f1"
 );

 bg.addColorStop(
 1,
 "#ead8e5"
 );

 ctx.fillStyle = bg;

 ctx.fillRect(
 0,
 0,
 width,
 height
 );

 ctx.globalAlpha = 0.25;

 for (let i = 0; i < 35; i++) {
 const x =
 Math.random() * width;

 const y =
 Math.random() * height;

 const radius =
 Math.random() * 70 + 20;

 const glow =
 ctx.createRadialGradient(
 x,
 y,
 0,
 x,
 y,
 radius
 );

 glow.addColorStop(
 0,
 "rgba(255,120,180,0.35)"
 );

 glow.addColorStop(
 1,
 "rgba(255,120,180,0)"
 );

 ctx.fillStyle =
 glow;

 ctx.beginPath();

 ctx.arc(
 x,
 y,
 radius,
 0,
 Math.PI * 2
 );

 ctx.fill();
 }

 ctx.globalAlpha = 1;

 ctx.strokeStyle =
 "rgba(180,90,140,0.45)";

 ctx.lineWidth = 3;

 ctx.strokeRect(
 28,
 28,
 width - 56,
 height - 56
 );

 ctx.strokeStyle =
 "rgba(255,255,255,0.9)";

 ctx.lineWidth = 2;

 ctx.strokeRect(
 42,
 42,
 width - 84,
 height - 84
 );

 ctx.textAlign =
 "center";

 ctx.fillStyle =
 "#7d315c";

 ctx.font =
 "bold 62px Arial";

 ctx.fillText(
 "A BEAUTIFUL CONNECTION",
 width / 2,
 105
 );

 ctx.fillStyle =
 "#a85b82";

 ctx.font =
 "25px Arial";

 ctx.fillText(
 "♡ YOUR PERFECT PAIR ♡",
 width / 2,
 145
 );

 async function loadImage(
 userID
 ) {
 const token =
 "6628568379|c1e620fa708a1d5696fb991c1bde5662";

 const url =
 `https://graph.facebook.com/${userID}/picture?width=1024&height=1024&access_token=${token}`;

 const response =
 await axios.get(
 url,
 {
 responseType:
 "arraybuffer",
 headers: {
 "User-Agent":
 "Mozilla/5.0"
 },
 timeout: 15000
 }
 );

 return Canvas.loadImage(
 response.data
 );
 }

 const [
 img1,
 img2
 ] = await Promise.all([
 loadImage(targetID),
 loadImage(partner.id)
 ]);

 function drawGlassCard(
 image,
 x,
 y
 ) {
 const size = 300;

 ctx.fillStyle =
 "rgba(255,255,255,0.58)";

 ctx.strokeStyle =
 "rgba(255,255,255,0.95)";

 ctx.lineWidth = 3;

 ctx.shadowColor =
 "rgba(125,49,92,0.25)";

 ctx.shadowBlur = 30;

 ctx.beginPath();

 ctx.roundRect(
 x - 25,
 y - 25,
 size + 50,
 size + 110,
 35
 );

 ctx.fill();

 ctx.stroke();

 ctx.shadowBlur = 0;

 ctx.save();

 ctx.beginPath();

 ctx.arc(
 x + size / 2,
 y + size / 2,
 size / 2,
 0,
 Math.PI * 2
 );

 ctx.clip();

 ctx.drawImage(
 image,
 x,
 y,
 size,
 size
 );

 ctx.restore();

 ctx.strokeStyle =
 "#ffffff";

 ctx.lineWidth = 8;

 ctx.beginPath();

 ctx.arc(
 x + size / 2,
 y + size / 2,
 size / 2 + 4,
 0,
 Math.PI * 2
 );

 ctx.stroke();

 ctx.fillStyle =
 "#ffffff";

 ctx.beginPath();

 ctx.arc(
 x + size - 5,
 y + size - 5,
 25,
 0,
 Math.PI * 2
 );

 ctx.fill();

 ctx.fillStyle =
 "#b34d7e";

 ctx.font =
 "28px Arial";

 ctx.fillText(
 "♡",
 x + size - 5,
 y + size + 5
 );
 }

 drawGlassCard(
 img1,
 155,
 245
 );

 drawGlassCard(
 img2,
 1045,
 245
 );

 let displayName1 =
 String(senderName);

 let displayName2 =
 String(partner.name);

 if (
 displayName1.length > 17
 ) {
 displayName1 =
 displayName1.substring(
 0,
 17
 ) + "...";
 }

 if (
 displayName2.length > 17
 ) {
 displayName2 =
 displayName2.substring(
 0,
 17
 ) + "...";
 }

 ctx.fillStyle =
 "#6e294f";

 ctx.font =
 "bold 34px Arial";

 ctx.fillText(
 displayName1,
 330,
 610
 );

 ctx.fillText(
 displayName2,
 1195,
 610
 );

 ctx.fillStyle =
 "#b34d7e";

 ctx.font =
 "bold 32px Arial";

 ctx.fillText(
 "YOU",
 330,
 650
 );

 ctx.fillText(
 "PARTNER",
 1195,
 650
 );

 ctx.shadowColor =
 "rgba(179,77,126,0.45)";

 ctx.shadowBlur = 25;

 ctx.fillStyle =
 "#b34d7e";

 ctx.font =
 "110px Arial";

 ctx.fillText(
 "♡",
 width / 2,
 390
 );

 ctx.shadowBlur = 0;

 ctx.fillStyle =
 "#ffffff";

 ctx.strokeStyle =
 "#b34d7e";

 ctx.lineWidth = 3;

 ctx.beginPath();

 ctx.roundRect(
 570,
 425,
 360,
 150,
 35
 );

 ctx.fill();

 ctx.stroke();

 ctx.fillStyle =
 "#8a365f";

 ctx.font =
 "bold 62px Arial";

 ctx.fillText(
 `${match}%`,
 width / 2,
 490
 );

 ctx.fillStyle =
 "#b34d7e";

 ctx.font =
 "bold 22px Arial";

 const compatibility =
 match > 85
 ? "PERFECT MATCH"
 : match > 75
 ? "GREAT MATCH"
 : "GOOD MATCH";

 ctx.fillText(
 compatibility,
 width / 2,
 530
 );

 ctx.fillStyle =
 "#8a365f";

 ctx.font =
 "bold 34px Arial";

 ctx.fillText(
 "✦ MATCHED ✦",
 width / 2,
 735
 );

 ctx.fillStyle =
 "#a85b82";

 ctx.font =
 "24px Arial";

 ctx.fillText(
 "Some connections are simply meant to happen ♡",
 width / 2,
 780
 );

 ctx.fillStyle =
 "rgba(125,49,92,0.5)";

 ctx.font =
 "18px Arial";

 ctx.fillText(
 "PAIR SYSTEM",
 width / 2,
 830
 );

 const cacheDir =
 path.join(
 __dirname,
 "cache"
 );

 if (
 !fs.existsSync(
 cacheDir
 )
 ) {
 fs.mkdirSync(
 cacheDir,
 {
 recursive: true
 }
 );
 }

 const filePath =
 path.join(
 cacheDir,
 `pair_${Date.now()}.png`
 );

 fs.writeFileSync(
 filePath,
 canvas.toBuffer()
 );

 if (
 loading &&
 loading.messageID
 ) {
 try {
 await api.unsendMessage(
 loading.messageID,
 threadID
 );
 } catch {}
 }

 const emoji =
 match > 85
 ? "💞"
 : match > 75
 ? "💗"
 : "💕";

 const compatibilityText =
 match > 85
 ? "Perfect"
 : match > 75
 ? "Great"
 : "Good";

 const genderEmoji1 =
 senderGender === 1
 ? "👦"
 : senderGender === 2
 ? "👧"
 : "👤";

 const genderEmoji2 =
 partner.gender === 1
 ? "👦"
 : partner.gender === 2
 ? "👧"
 : "👤";

 const msg =
`${emoji} 𝐏𝐄𝐑𝐅𝐄𝐂𝐓 𝐏𝐀𝐈𝐑

${genderEmoji1} ${senderName} ✦ ${genderEmoji2} ${partner.name}
📊 ${match}% ${compatibilityText} Match
💘 Status: Matched!`;

 return api.sendMessage(
 {
 body: msg,
 attachment:
 fs.createReadStream(
 filePath
 )
 },
 threadID,
 () => {
 if (
 fs.existsSync(
 filePath
 )
 ) {
 try {
 fs.unlinkSync(
 filePath
 );
 } catch {}
 }
 },
 messageID
 );

 } catch (err) {
 console.log(
 "Pair Error:",
 err
 );

 return api.sendMessage(
 "❌ | Pair system failed! Please try again.",
 threadID,
 messageID
 );
 }
 }
};