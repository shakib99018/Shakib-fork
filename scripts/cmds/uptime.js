module.exports.config = {
  name: "uptime",
  version: "2.0.0",
  author: "Sakib",
  aliases: ["up", "upt"],
  role: 0,
  category: "system"
};

const { createCanvas } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");

module.exports.onStart = async function ({ api, event }) {
  const started = Date.now();

  try {
    const formatUptime = (seconds) => {
      seconds = Math.floor(seconds);

      const days = Math.floor(seconds / 86400);
      seconds %= 86400;

      const hours = Math.floor(seconds / 3600);
      seconds %= 3600;

      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;

      const parts = [];

      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      parts.push(`${secs}s`);

      return parts.join(" ");
    };

    const formatBytes = (bytes) => {
      if (!bytes || bytes <= 0) return "0 MB";

      const units = ["B", "KB", "MB", "GB", "TB"];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));

      return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
    };

    const getCPU = () => {
      try {
        const cpus = os.cpus();

        if (!cpus.length) return 0;

        let idle = 0;
        let total = 0;

        for (const cpu of cpus) {
          idle += cpu.times.idle;

          total +=
            cpu.times.user +
            cpu.times.nice +
            cpu.times.sys +
            cpu.times.idle +
            cpu.times.irq;
        }

        const usage = 100 - (idle / total) * 100;

        return Math.max(0, Math.min(100, usage));
      } catch (_) {
        return 0;
      }
    };

    const roundRect = (ctx, x, y, w, h, r) => {
      ctx.beginPath();

      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);

      ctx.quadraticCurveTo(
        x + w,
        y,
        x + w,
        y + r
      );

      ctx.lineTo(x + w, y + h - r);

      ctx.quadraticCurveTo(
        x + w,
        y + h,
        x + w - r,
        y + h
      );

      ctx.lineTo(x + r, y + h);

      ctx.quadraticCurveTo(
        x,
        y + h,
        x,
        y + h - r
      );

      ctx.lineTo(x, y + r);

      ctx.quadraticCurveTo(
        x,
        y,
        x + r,
        y
      );

      ctx.closePath();
    };

    const bubble = (ctx, x, y, r, color, alpha = 1) => {
      ctx.save();

      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const sparkle = (ctx, x, y, size, color) => {
      ctx.save();

      ctx.fillStyle = color;

      ctx.beginPath();

      ctx.moveTo(x, y - size);
      ctx.lineTo(x + size * 0.25, y - size * 0.25);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x + size * 0.25, y + size * 0.25);
      ctx.lineTo(x, y + size);
      ctx.lineTo(x - size * 0.25, y + size * 0.25);
      ctx.lineTo(x - size, y);
      ctx.lineTo(x - size * 0.25, y - size * 0.25);

      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    const width = 1280;
    const height = 760;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Background
    const background = ctx.createLinearGradient(
      0,
      0,
      width,
      height
    );

    background.addColorStop(0, "#E8F7FF");
    background.addColorStop(0.5, "#F2EDFF");
    background.addColorStop(1, "#FFEFF6");

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    // Decorations
    bubble(ctx, 100, 120, 70, "#A9DFFF", 0.22);
    bubble(ctx, 1160, 170, 90, "#D2B8FF", 0.22);
    bubble(ctx, 1120, 610, 85, "#FFBBD4", 0.2);
    bubble(ctx, 130, 610, 55, "#C8C1FF", 0.2);

    sparkle(ctx, 180, 190, 10, "#9D8BEA");
    sparkle(ctx, 1080, 110, 12, "#8DCBEA");
    sparkle(ctx, 1140, 350, 8, "#E4A5C1");

    // Main panel shadow
    ctx.save();

    ctx.shadowColor = "rgba(80, 70, 120, 0.18)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 15;

    roundRect(ctx, 60, 50, 1160, 660, 45);

    const panelGradient = ctx.createLinearGradient(
      60,
      50,
      1220,
      710
    );

    panelGradient.addColorStop(0, "rgba(255,255,255,0.95)");
    panelGradient.addColorStop(1, "rgba(248,246,255,0.92)");

    ctx.fillStyle = panelGradient;
    ctx.fill();

    ctx.restore();

    // Header
    ctx.fillStyle = "#26233A";
    ctx.font = "bold 58px Sans";

    ctx.fillText("BOT UPTIME", 115, 135);

    ctx.fillStyle = "#817B98";
    ctx.font = "28px Sans";

    ctx.fillText(
      "System status & performance",
      118,
      175
    );

    // Status indicator
    ctx.beginPath();
    ctx.arc(1110, 120, 13, 0, Math.PI * 2);

    ctx.fillStyle = "#35C978";
    ctx.fill();

    ctx.fillStyle = "#35A968";
    ctx.font = "bold 24px Sans";

    ctx.fillText("ONLINE", 1140, 128);

    // Uptime box
    ctx.save();

    ctx.shadowColor = "rgba(120, 100, 180, 0.12)";
    ctx.shadowBlur = 20;

    roundRect(ctx, 110, 215, 1060, 125, 28);

    const uptimeGradient = ctx.createLinearGradient(
      110,
      215,
      1170,
      340
    );

    uptimeGradient.addColorStop(0, "#EEF4FF");
    uptimeGradient.addColorStop(1, "#F7EEFF");

    ctx.fillStyle = uptimeGradient;
    ctx.fill();

    ctx.restore();

    ctx.fillStyle = "#807995";
    ctx.font = "bold 22px Sans";

    ctx.fillText("UPTIME", 145, 255);

    ctx.fillStyle = "#302B46";
    ctx.font = "bold 42px Sans";

    ctx.fillText(
      formatUptime(process.uptime()),
      145,
      305
    );

    // Stats
    const cpu = getCPU();

    const memoryTotal = os.totalmem();
    const memoryFree = os.freemem();
    const memoryUsed = memoryTotal - memoryFree;
    const memoryPercent =
      (memoryUsed / memoryTotal) * 100;

    const stats = [
      {
        title: "CPU",
        value: `${cpu.toFixed(1)}%`,
        x: 110
      },
      {
        title: "RAM",
        value: `${memoryPercent.toFixed(1)}%`,
        x: 380
      },
      {
        title: "MEMORY",
        value: formatBytes(memoryUsed),
        x: 650
      },
      {
        title: "PLATFORM",
        value: os.platform(),
        x: 920
      }
    ];

    for (const stat of stats) {
      ctx.save();

      ctx.shadowColor = "rgba(100, 90, 130, 0.10)";
      ctx.shadowBlur = 18;

      roundRect(
        ctx,
        stat.x,
        375,
        240,
        120,
        25
      );

      ctx.fillStyle = "#FFFFFF";
      ctx.fill();

      ctx.restore();

      ctx.fillStyle = "#8A839D";
      ctx.font = "bold 18px Sans";

      ctx.fillText(
        stat.title,
        stat.x + 22,
        410
      );

      ctx.fillStyle = "#332E49";
      ctx.font = "bold 29px Sans";

      ctx.fillText(
        String(stat.value),
        stat.x + 22,
        457
      );
    }

    // System information
    ctx.fillStyle = "#777087";
    ctx.font = "22px Sans";

    ctx.fillText(
      `Node.js ${process.version}`,
      115,
      555
    );

    ctx.fillText(
      `${os.cpus().length} CPU Core(s)`,
      115,
      595
    );

    ctx.fillText(
      `Host: ${os.hostname()}`,
      115,
      635
    );

    // Response time
    const ping = Date.now() - started;

    ctx.fillStyle = "#332E49";
    ctx.font = "bold 25px Sans";

    ctx.fillText(
      `Response: ${ping}ms`,
      900,
      625
    );

    // Footer
    ctx.fillStyle = "#A19AAC";
    ctx.font = "20px Sans";

    ctx.fillText(
      "System is running normally",
      900,
      660
    );

    // Save image
    const cacheDir = path.join(__dirname, "cache");

    await fs.ensureDir(cacheDir);

    const filePath = path.join(
      cacheDir,
      `uptime_${Date.now()}.png`
    );

    const buffer = canvas.toBuffer("image/png");

    await fs.writeFile(filePath, buffer);

    // Send
    await api.sendMessage(
      {
        body:
          `╭───〔 ⚡ UPTIME 〕───╮\n` +
          `│ 🟢 Status: Online\n` +
          `│ ⏱️ Uptime: ${formatUptime(process.uptime())}\n` +
          `│ 🧠 CPU: ${cpu.toFixed(1)}%\n` +
          `│ 💾 RAM: ${memoryPercent.toFixed(1)}%\n` +
          `│ ⚡ Response: ${ping}ms\n` +
          `╰────────────────────╯`,
        attachment: fs.createReadStream(filePath)
      },
      event.threadID,
      event.messageID
    );

    // Delete temporary file
    setTimeout(async () => {
      try {
        await fs.remove(filePath);
      } catch (_) {}
    }, 10000);

  } catch (error) {
    console.error("Uptime Error:", error);

    return api.sendMessage(
      `❌ Uptime command error!\n\n${error.message}`,
      event.threadID,
      event.messageID
    );
  }
};
