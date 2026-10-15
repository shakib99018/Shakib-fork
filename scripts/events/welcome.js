"use strict";

const { drive } = global.utils;
const { nickNameBot } = global.GoatBot.config;
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "welcome",
    version: "9.2",
    author: "Sakib",
    category: "events"
  },

  langs: {
    en: {
      defaultWelcomeMessage:
        "🌌 Welcome {userName}! ✨\n\n💜 Welcome to {threadName}!\n👑 You are our {memberCount}th member.\n\n🌠 Enjoy your stay and make beautiful memories!",
      botAddedMessage:
        "╭━━━〔 🤖 BOT ONLINE 〕━━━╮\n\n💜 Thanks for adding me to your group!\n\n⚙️ Prefix: {prefix}\n📜 Type {prefix}help to see commands.\n\n╰━━━━━━ POWERED BY SAKIB ━━━━━━╯"
    }
  },

  onStart: async ({ threadsData, message, event, api, usersData, getLang }) => {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID } = event;
    const threadData = await threadsData.get(threadID);

    if (!threadData.settings.sendWelcomeMessage) return;

    const added = event.logMessageData.addedParticipants || [];
    const prefix = global.utils.getPrefix(threadID);
    const botID = api.getCurrentUserID();
    const threadName = threadData.threadName || "Our Group";

    for (const user of added) {
      const userID = user.userFbId;

      if (userID == botID) {
        if (nickNameBot) {
          try {
            await api.changeNickname(nickNameBot, threadID, botID);
          } catch (_) {}
        }

        return message.send(
          getLang("botAddedMessage").replace(/\{prefix\}/g, prefix)
        );
      }

      const userName = user.fullName || "New Member";
      const inviterID = event.author;
      let inviterName = "Someone";

      try {
        inviterName = await usersData.getName(inviterID) || "Someone";
      } catch (_) {}

      const memberCount = (event.participantIDs || []).length;

      let welcomeMessage =
        threadData.data?.welcomeMessage ||
        getLang("defaultWelcomeMessage");

      welcomeMessage = welcomeMessage
        .replace(/\{userName\}/g, userName)
        .replace(/\{userTag\}/g, userName)
        .replace(/\{threadName\}/g, threadName)
        .replace(/\{memberCount\}/g, memberCount)
        .replace(/\{inviterName\}/g, inviterName);

      let imagePath = null;

      try {
        imagePath = await createWelcomeCard({
          userID,
          inviterID,
          threadID,
          userName,
          inviterName,
          threadName,
          memberCount,
          api
        });
      } catch (err) {
        console.error("Welcome card error:", err.message);
      }

      const form = {
        body: welcomeMessage,
        mentions: [{
          tag: userName,
          id: userID
        }]
      };

      if (imagePath && await fs.pathExists(imagePath)) {
        form.attachment = fs.createReadStream(imagePath);
      } else if (threadData.data?.welcomeAttachment) {
        const results = await Promise.allSettled(
          threadData.data.welcomeAttachment.map(file =>
            drive.getFile(file, "stream")
          )
        );

        const attachments = results
          .filter(result => result.status === "fulfilled")
          .map(result => result.value);

        if (attachments.length) {
          form.attachment = attachments;
        }
      }

      try {
        await message.send(form);
      } catch (err) {
        console.error("Welcome message error:", err.message);
      } finally {
        if (imagePath) {
          setTimeout(() => {
            fs.remove(imagePath).catch(() => {});
          }, 10000);
        }
      }
    }
  }
};

async function getImage(url) {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 12000
    });

    return await loadImage(Buffer.from(response.data));
  } catch (_) {
    return null;
  }
}

async function getProfile(userID, api) {
  try {
    const info = await api.getUserInfo([userID]);
    const url = info[userID]?.thumbSrc;

    if (url) {
      const image = await getImage(url);
      if (image) return image;
    }
  } catch (_) {}

  return null;
}

async function getGroupImage(threadID, api) {
  try {
    const info = await api.getThreadInfo(threadID);

    if (info.imageSrc) {
      return await getImage(info.imageSrc);
    }
  } catch (_) {}

  return null;
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawAvatar(ctx, img, x, y, r) {
  ctx.save();

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();

  if (img) {
    ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
  } else {
    ctx.fillStyle = "#25234b";
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 42px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", x, y);
  }

  ctx.restore();
}

function fitText(ctx, text, maxWidth, startSize) {
  let size = startSize;
  text = String(text || "");

  while (size > 15) {
    ctx.font = `bold ${size}px Arial`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size--;
  }

  ctx.font = `bold ${size}px Arial`;

  if (ctx.measureText(text).width > maxWidth) {
    while (text.length > 0 && ctx.measureText(text + "...").width > maxWidth) {
      text = text.slice(0, -1);
    }
    text += "...";
  }

  return { text, size };
}

async function createWelcomeCard({
  userID,
  inviterID,
  threadID,
  userName,
  inviterName,
  threadName,
  memberCount,
  api
}) {
  const W = 1200;
  const H = 675;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Load custom background image along with avatars and group icon
  const [bgImg, userImg, inviterImg, groupImg] = await Promise.all([
    loadImage(path.join(__dirname, "1000094934.png")).catch(() => null),[span_1](start_span)[span_1](end_span)
    getProfile(userID, api),
    getProfile(inviterID, api),
    getGroupImage(threadID, api)
  ]);

  // Draw custom background image or fallback gradient if not found
  if (bgImg) {
    ctx.drawImage(bgImg, 0, 0, W, H);
  } else {
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#080817");
    bg.addColorStop(1, "#09091b");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
  }

  // Main glass card
  ctx.save();
  ctx.shadowColor = "rgba(180,50,255,0.4)";
  ctx.shadowBlur = 35;

  roundedRect(ctx, 24, 24, W - 48, H - 48, 30);

  ctx.fillStyle = "rgba(12, 10, 30, 0.75)";
  ctx.fill();

  ctx.restore();

  ctx.strokeStyle = "rgba(200, 100, 255, 0.5)";
  ctx.lineWidth = 2;
  roundedRect(ctx, 24, 24, W - 48, H - 48, 30);
  ctx.stroke();

  // Top label
  ctx.textAlign = "center";
  ctx.font = "bold 18px Arial";
  ctx.fillStyle = "#e878ff";
  ctx.fillText("✦  A NEW STAR HAS ARRIVED  ✦", W / 2, 70);

  // Main welcome title
  ctx.font = "bold 54px Arial";

  const titleGradient = ctx.createLinearGradient(200, 0, 1000, 0);
  titleGradient.addColorStop(0, "#d3b7ff");
  titleGradient.addColorStop(0.5, "#ffffff");
  titleGradient.addColorStop(1, "#e879ff");

  ctx.fillStyle = titleGradient;
  ctx.fillText("WELCOME TO THE COSMOS", W / 2, 132);

  // Avatar positions
  const avatarY = 265;
  const avatarR = 86;
  const userX = 325;
  const inviterX = 875;

  // Avatar rings
  for (const x of [userX, inviterX]) {
    ctx.save();
    ctx.shadowColor = "#d472ff";
    ctx.shadowBlur = 24;
    ctx.strokeStyle = "#e88cff";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x, avatarY, avatarR + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawAvatar(ctx, userImg, userX, avatarY, avatarR);
  drawAvatar(ctx, inviterImg, inviterX, avatarY, avatarR);

  // Connecting line
  const line = ctx.createLinearGradient(userX, 0, inviterX, 0);
  line.addColorStop(0, "#d07bff");
  line.addColorStop(0.5, "#e870ff");
  line.addColorStop(1, "#ff8bdd");

  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(userX + avatarR + 18, avatarY);
  ctx.lineTo(inviterX - avatarR - 18, avatarY);
  ctx.stroke();

  // Center star
  ctx.font = "bold 34px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("✦", W / 2, avatarY + 12);

  // Member name
  ctx.textAlign = "center";

  const member = fitText(ctx, userName, 400, 32);
  ctx.font = `bold ${member.size}px Arial`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(member.text, userX, 390);

  ctx.font = "bold 15px Arial";
  ctx.fillStyle = "#e7a0ff";
  ctx.fillText("NEW MEMBER", userX, 420);

  // Inviter name
  const inviter = fitText(ctx, inviterName, 400, 30);
  ctx.font = `bold ${inviter.size}px Arial`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(inviter.text, inviterX, 390);

  ctx.font = "bold 15px Arial";
  ctx.fillStyle = "#e879ff";
  ctx.fillText("INVITED BY", inviterX, 420);

  // Member badge
  const badgeText = `MEMBER #${memberCount}`;
  ctx.font = "bold 20px Arial";

  const badgeWidth = 260;
  const badgeX = (W - badgeWidth) / 2;
  const badgeY = 448;

  roundedRect(ctx, badgeX, badgeY, badgeWidth, 48, 24);
  ctx.fillStyle = "rgba(185,110,255,0.20)";
  ctx.fill();

  ctx.strokeStyle = "#d491ff";
  ctx.lineWidth = 2;
  roundedRect(ctx, badgeX, badgeY, badgeWidth, 48, 24);
  ctx.stroke();

  ctx.fillStyle = "#f5e6ff";
  ctx.fillText(badgeText, W / 2, badgeY + 31);

  // Group panel
  const panelX = 100;
  const panelY = 520;
  const panelW = 1000;
  const panelH = 90;

  roundedRect(ctx, panelX, panelY, panelW, panelH, 20);
  ctx.fillStyle = "rgba(255,255,255,0.055)";
  ctx.fill();

  ctx.strokeStyle = "rgba(200,160,255,0.35)";
  ctx.lineWidth = 1.5;
  roundedRect(ctx, panelX, panelY, panelW, panelH, 20);
  ctx.stroke();

  // Group avatar
  if (groupImg) {
    ctx.save();
    roundedRect(ctx, 120, 533, 64, 64, 14);
    ctx.clip();
    ctx.drawImage(groupImg, 120, 533, 64, 64);
    ctx.restore();
  } else {
    ctx.fillStyle = "#38254c";
    roundedRect(ctx, 120, 533, 64, 64, 14);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px Arial";
    ctx.fillText("G", 152, 574);
  }

  // Group name
  ctx.textAlign = "left";
  ctx.font = "bold 14px Arial";
  ctx.fillStyle = "#e87eff";
  ctx.fillText("GROUP DESTINATION", 205, 550);

  const group = fitText(ctx, threadName, 580, 26);
  ctx.font = `bold ${group.size}px Arial`;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(group.text, 205, 583);

  // Footer branding
  ctx.textAlign = "right";
  ctx.font = "bold 15px Arial";
  ctx.fillStyle = "#e3b3ff";
  ctx.fillText("POWERED BY SAKIB", 1070, 642);

  const filePath = path.join(
    __dirname,
    `welcome_${Date.now()}_${Math.floor(Math.random() * 10000)}.png`
  );

  await fs.writeFile(filePath, canvas.toBuffer("image/png"));

  return filePath;
}
