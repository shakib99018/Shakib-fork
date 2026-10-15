const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: { name: "welcome", version: "3.0", category: "events" },
  onStart: async ({ threadsData, message, event, api }) => {
    if (event.logMessageType!== "log:subscribe") return;
    const threadID = event.threadID;
    const added = event.logMessageData.addedParticipants;
    const inviterID = event.author;
    const templatePath = path.join(__dirname, "template.jpg");

    async function getImage(url) {
      try {
        const res = await axios.get(url, { responseType: "arraybuffer", timeout: 20000, headers: { "User-Agent": "Mozilla/5.0" } });
        return await loadImage(Buffer.from(res.data));
      } catch { return null; }
    }
    async function getProfile(id) {
      try {
        const info = await api.getUserInfo([id]);
        const url = info[id]?.thumbSrc;
        if (url) return await getImage(url);
      } catch {}
      return null;
    }
    function drawAvatar(ctx, img, x, y, r) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.clip();
      if (img) ctx.drawImage(img, x - r, y - r, r*2, r*2);
      ctx.restore();
    }

    for (const user of added) {
      if (user.userFbId == api.getCurrentUserID()) continue;
      const template = await loadImage(templatePath);
      const W = template.width, H = template.height;
      const canvas = createCanvas(W, H);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(template, 0, 0, W, H);

      const userImg = await getProfile(user.userFbId);
      const inviterImg = await getProfile(inviterID);

      const leftX = W * 0.381, rightX = W * 0.619, centerY = H * 0.555, radius = W * 0.075;

      drawAvatar(ctx, userImg, leftX, centerY, radius);
      drawAvatar(ctx, inviterImg, rightX, centerY, radius);

      const tmp = path.join(__dirname, `welcome_${user.userFbId}.png`);
      fs.writeFileSync(tmp, canvas.toBuffer("image/png"));
      message.send({ body: `Welcome ${user.fullName} ✨`, attachment: fs.createReadStream(tmp) }, () => fs.unlinkSync(tmp));
    }
  }
};
