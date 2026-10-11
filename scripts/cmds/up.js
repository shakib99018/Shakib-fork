const os = require("os");
const { createCanvas } = require("canvas");
const fs = require("fs-extra");
const path = require("path");

let si = null;

try {
  si = require("systeminformation");
} catch (e) {
  si = null;
}

const C = {
  bg: "#05020d",
  bg2: "#0b0518",
  violet: "#9b5cff",
  purple: "#c45cff",
  pink: "#ff3ec8",
  aqua: "#35f5ff",
  blue: "#6575ff",
  green: "#48ffb5",
  white: "#f8f5ff",
  text: "#d7d0ec",
  dim: "#776b91",
  dark: "#120b22",
  line: "#291941",
};

const statsPath = path.join(
  __dirname,
  "cache",
  "command_stats.json"
);

function readCommandStats() {
  try {
    return fs.readJsonSync(statsPath);
  } catch (e) {
    return {};
  }
}

function writeCommandStats(data) {
  try {
    fs.ensureDirSync(path.dirname(statsPath));
    fs.writeJsonSync(statsPath, data);
  } catch (e) {}
}

module.exports = {
  config: {
    name: "up",
    version: "6.0.0",
    author: "Siam Ahmed Saan",
    countDown: 5,
    role: 0,
    description: "Futuristic holographic system dashboard",
    category: "system"
  },

  onChat: async function ({ event }) {
    const body = (event.body || "").trim();

    if (!body) return;

    const match = body.match(
      /^[^a-zA-Z0-9]*([a-zA-Z0-9_]+)/
    );

    if (!match) return;

    const cmd = match[1].toLowerCase();
    const data = readCommandStats();

    data[cmd] = (data[cmd] || 0) + 1;

    writeCommandStats(data);
  },

  onStart: async function ({ api, event }) {
    const {
      threadID,
      messageID,
      timestamp
    } = event;

    const cacheDir = path.join(
      __dirname,
      "cache"
    );

    fs.ensureDirSync(cacheDir);

    const imagePath = path.join(
      cacheDir,
      `nexus_${Date.now()}.png`
    );

    try {
      const image = await generateHUD({
        timestamp
      });

      fs.writeFileSync(
        imagePath,
        image
      );

      return api.sendMessage(
        {
          attachment:
            fs.createReadStream(imagePath)
        },
        threadID,
        () => {
          try {
            fs.unlinkSync(imagePath);
          } catch (e) {}
        },
        messageID
      );
    } catch (error) {
      return api.sendMessage(
        `Error: ${error.message}`,
        threadID
      );
    }
  }
};

async function generateHUD({ timestamp }) {
  const W = 3600;
  const H = 2100;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  const cpuCount =
    os.cpus().length || 1;

  const load =
    os.loadavg()[0] || 0;

  const cpuPct = Math.min(
    100,
    (load / cpuCount) * 100
  );

  const ramPct =
    (usedMem / totalMem) * 100;

  const ping =
    Date.now() - timestamp;

  const cpuHistory = [];

  for (let i = 0; i < 50; i++) {
    const wave =
      Math.sin(i * 0.65) * 8;

    const noise =
      Math.random() * 8 - 4;

    cpuHistory.push(
      Math.max(
        2,
        Math.min(
          100,
          cpuPct + wave + noise
        )
      )
    );
  }

  let storage = [];
  let processes = [];

  if (si) {
    const [fsData, processData] =
      await Promise.all([
        si.fsSize().catch(() => []),
        si.processes().catch(() => null)
      ]);

    storage = fsData
      .slice(0, 4)
      .map(item => ({
        name: item.mount,
        used: item.used,
        size: item.size,
        pct: item.use
      }));

    if (
      processData &&
      processData.list
    ) {
      processes =
        processData.list
          .sort(
            (a, b) =>
              b.cpu - a.cpu
          )
          .slice(0, 6)
          .map(item => ({
            name: item.name,
            cpu:
              Number(
                item.cpu || 0
              ).toFixed(1) + "%",
            mem:
              (
                Number(
                  item.memRss || 0
                ) / 1024
              ).toFixed(1) + " MB"
          }));
    }
  }

  const stats =
    readCommandStats();

  const topCommands =
    Object.entries(stats)
      .sort(
        (a, b) => b[1] - a[1]
      )
      .slice(0, 6)
      .map(([name, count]) => ({
        name,
        count
      }));

  const maxCommand =
    topCommands.length
      ? topCommands[0].count
      : 1;

  drawBackground(
    ctx,
    W,
    H
  );

  drawHeader(
    ctx,
    W
  );

  drawHero(
    ctx,
    100,
    250,
    3400,
    540,
    {
      cpuPct,
      ramPct,
      ping,
      uptime:
        formatUptime(
          process.uptime()
        ),
      cpuHistory
    }
  );

  drawSystemCards(
    ctx,
    100,
    830,
    3400,
    460,
    {
      cpuPct,
      ramPct,
      usedMem,
      totalMem,
      ping
    }
  );

  drawLowerArea(
    ctx,
    100,
    1330,
    3400,
    560,
    {
      storage,
      processes,
      topCommands,
      maxCommand
    }
  );

  drawFooter(
    ctx,
    W,
    H,
    stats
  );

  return canvas.toBuffer(
    "image/png"
  );
}

function drawBackground(
  ctx,
  W,
  H
) {
  const bg =
    ctx.createLinearGradient(
      0,
      0,
      W,
      H
    );

  bg.addColorStop(
    0,
    "#05020d"
  );

  bg.addColorStop(
    0.45,
    "#10051d"
  );

  bg.addColorStop(
    1,
    "#020108"
  );

  ctx.fillStyle = bg;
  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  const glow1 =
    ctx.createRadialGradient(
      700,
      400,
      10,
      700,
      400,
      900
    );

  glow1.addColorStop(
    0,
    "rgba(155,92,255,0.16)"
  );

  glow1.addColorStop(
    1,
    "rgba(155,92,255,0)"
  );

  ctx.fillStyle = glow1;
  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  const glow2 =
    ctx.createRadialGradient(
      3000,
      1500,
      20,
      3000,
      1500,
      900
    );

  glow2.addColorStop(
    0,
    "rgba(255,62,200,0.12)"
  );

  glow2.addColorStop(
    1,
    "rgba(255,62,200,0)"
  );

  ctx.fillStyle = glow2;
  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  ctx.strokeStyle =
    "rgba(155,92,255,0.08)";

  ctx.lineWidth = 1;

  for (
    let x = 0;
    x < W;
    x += 75
  ) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  for (
    let y = 0;
    y < H;
    y += 75
  ) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  for (
    let i = 0;
    i < 40;
    i++
  ) {
    const x =
      Math.random() * W;

    const y =
      Math.random() * H;

    ctx.fillStyle =
      i % 2
        ? "rgba(196,92,255,0.5)"
        : "rgba(53,245,255,0.4)";

    ctx.beginPath();

    ctx.arc(
      x,
      y,
      Math.random() * 2 + 1,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  ctx.fillStyle =
    "rgba(255,255,255,0.018)";

  for (
    let y = 0;
    y < H;
    y += 12
  ) {
    ctx.fillRect(
      0,
      y,
      W,
      1
    );
  }
}

function drawHeader(
  ctx,
  W
) {
  ctx.fillStyle =
    C.violet;

  ctx.font =
    "bold 82px Sans";

  ctx.fillText(
    "ACTIVE",
    110,
    125
  );

  ctx.fillStyle =
    C.white;

  ctx.fillText(
    "NOW",
    390,
    125
  );

  ctx.fillStyle =
    C.dim;

  ctx.font =
    "24px monospace";

  ctx.fillText(
    "HOLOGRAPHIC SYSTEM TELEMETRY",
    115,
    170
  );

  ctx.textAlign =
    "right";

  ctx.fillStyle =
    C.green;

  ctx.font =
    "bold 28px monospace";

  ctx.fillText(
    "● ONLINE",
    W - 110,
    75
  );

  const now =
    new Date();

  ctx.fillStyle =
    C.white;

  ctx.font =
    "bold 36px monospace";

  ctx.fillText(
    now.toLocaleTimeString(
      "en-GB"
    ),
    W - 110,
    120
  );

  ctx.fillStyle =
    C.dim;

  ctx.font =
    "23px monospace";

  ctx.fillText(
    now.toDateString(),
    W - 110,
    158
  );

  ctx.textAlign =
    "left";

  ctx.strokeStyle =
    "rgba(196,92,255,0.4)";

  ctx.lineWidth = 2;

  ctx.beginPath();

  ctx.moveTo(
    110,
    210
  );

  ctx.lineTo(
    W - 110,
    210
  );

  ctx.stroke();

  ctx.strokeStyle =
    C.pink;

  ctx.lineWidth = 5;

  ctx.beginPath();

  ctx.moveTo(
    110,
    210
  );

  ctx.lineTo(
    850,
    210
  );

  ctx.stroke();
}

function drawHero(
  ctx,
  x,
  y,
  w,
  h,
  data
) {
  hologramPanel(
    ctx,
    x,
    y,
    w,
    h
  );

  ctx.fillStyle =
    C.dim;

  ctx.font =
    "bold 25px monospace";

  ctx.fillText(
    "SYSTEM STATUS",
    x + 55,
    y + 60
  );

  ctx.fillStyle =
    C.white;

  ctx.font =
    "bold 64px Sans";

  ctx.fillText(
    "OPERATIONAL",
    x + 55,
    y + 135
  );

  ctx.fillStyle =
    C.green;

  ctx.font =
    "bold 24px monospace";

  ctx.fillText(
    "● ALL CORE SYSTEMS NOMINAL",
    x + 60,
    y + 180
  );

  drawOrbitalMeter(
    ctx,
    x + 700,
    y + 285,
    185,
    data.cpuPct,
    C.violet,
    "CPU"
  );

  drawOrbitalMeter(
    ctx,
    x + 1160,
    y + 285,
    185,
    data.ramPct,
    C.pink,
    "RAM"
  );

  drawWaveform(
    ctx,
    x + 1500,
    y + 110,
    1800,
    280,
    data.cpuHistory
  );

  ctx.fillStyle =
    C.dim;

  ctx.font =
    "22px monospace";

  ctx.fillText(
    "LIVE SIGNAL",
    x + 1500,
    y + 430
  );

  ctx.fillStyle =
    C.cyan;

  ctx.font =
    "bold 26px monospace";

  ctx.fillText(
    "UPTIME",
    x + 60,
    y + 265
  );

  ctx.fillStyle =
    C.white;

  ctx.font =
    "bold 32px monospace";

  ctx.fillText(
    data.uptime,
    x + 60,
    y + 310
  );

  ctx.fillStyle =
    C.dim;

  ctx.font =
    "22px monospace";

  ctx.fillText(
    "LATENCY",
    x + 60,
    y + 365
  );

  ctx.fillStyle =
    C.aqua;

  ctx.font =
    "bold 30px monospace";

  ctx.fillText(
    data.ping + " ms",
    x + 60,
    y + 410
  );

  drawSignalBars(
    ctx,
    x + 60,
    y + 455,
    600,
    25
  );
}

function drawSystemCards(
  ctx,
  x,
  y,
  w,
  h,
  data
) {
  hologramPanel(
    ctx,
    x,
    y,
    w,
    h
  );

  const cards = [
    [
      "CPU LOAD",
      data.cpuPct,
      C.violet
    ],
    [
      "MEMORY",
      data.ramPct,
      C.pink
    ],
    [
      "RESPONSE",
      Math.min(
        data.ping,
        100
      ),
      C.aqua
    ],
    [
      "THREADS",
      100,
      C.blue
    ]
  ];

  const gap = 30;
  const cw =
    (w - 110 - gap * 3) /
    4;

  cards.forEach(
    (item, i) => {
      const cx =
        x +
        35 +
        i * (cw + gap);

      drawEnergyCard(
        ctx,
        cx,
        y + 35,
        cw,
        h - 70,
        item[0],
        item[1],
        item[2],
        i === 3
          ? String(
              os.cpus().length
            )
          : null
      );
    }
  );
}

function drawEnergyCard(
  ctx,
  x,
  y,
  w,
  h,
  label,
  pct,
  color,
  customValue
) {
  roundRect(
    ctx,
    x,
    y,
    w,
    h,
    25
  );

  ctx.fillStyle =
    "rgba(12,5,25,0.75)";

  ctx.fill();

  ctx.strokeStyle =
    color + "55";

  ctx.lineWidth = 2;

  ctx.stroke();

  ctx.fillStyle =
    C.dim;

  ctx.font =
    "bold 21px monospace";

  ctx.fillText(
    label,
    x + 30,
    y + 45
  );

  ctx.fillStyle =
    C.white;

  ctx.font =
    "bold 48px monospace";

  ctx.fillText(
    customValue ||
      pct.toFixed(1) + "%",
    x + 30,
    y + 110
  );

  const barY =
    y + 155;

  for (
    let i = 0;
    i < 24;
    i++
  ) {
    const active =
      i <
      Math.ceil(
        (pct / 100) * 24
      );

    ctx.fillStyle =
      active
        ? color
        : "#21172f";

    ctx.fillRect(
      x + 30 + i * 18,
      barY,
      12,
      55
    );
  }

  ctx.fillStyle =
    color;

  ctx.shadowColor =
    color;

  ctx.shadowBlur = 15;

  ctx.fillRect(
    x + 30,
    y + h - 35,
    w - 60,
    4
  );

  ctx.shadowBlur = 0;
}

function drawLowerArea(
  ctx,
  x,
  y,
  w,
  h,
  data
) {
  const gap = 35;

  const pw =
    (w - gap * 2) /
    3;

  drawStorage(
    ctx,
    x,
    y,
    pw,
    h,
    data.storage
  );

  drawCommands(
    ctx,
    x + pw + gap,
    y,
    pw,
    h,
    data.topCommands,
    data.maxCommand
  );

  drawProcesses(
    ctx,
    x + (pw + gap) * 2,
    y,
    pw,
    h,
    data.processes
  );
}

function drawStorage(
  ctx,
  x,
  y,
  w,
  h,
  storage
) {
  hologramPanel(
    ctx,
    x,
    y,
    w,
    h
  );

  sectionTitle(
    ctx,
    x,
    y,
    "STORAGE MATRIX"
  );

  const list =
    storage.length
      ? storage
      : [
          {
            name: "/",
            used: 0,
            size: 1,
            pct: 0
          }
        ];

  let py =
    y + 125;

  list
    .slice(0, 4)
    .forEach(
      (item, i) => {
        ctx.fillStyle =
          i % 2
            ? C.pink
            : C.aqua;

        ctx.font =
          "bold 24px monospace";

        ctx.fillText(
          item.name,
          x + 40,
          py
        );

        ctx.textAlign =
          "right";

        ctx.fillStyle =
          C.white;

        ctx.fillText(
          item.pct.toFixed(0) +
            "%",
          x + w - 40,
          py
        );

        ctx.textAlign =
          "left";

        drawBar(
          ctx,
          x + 40,
          py + 22,
          w - 80,
          13,
          item.pct,
          i % 2
            ? C.pink
            : C.aqua
        );

        ctx.fillStyle =
          C.dim;

        ctx.font =
          "18px monospace";

        ctx.fillText(
          `${formatBytes(
            item.used
          )} / ${formatBytes(
            item.size
          )}`,
          x + 40,
          py + 60
        );

        py += 100;
      }
    );
}

function drawCommands(
  ctx,
  x,
  y,
  w,
  h,
  commands,
  maxCommand
) {
  hologramPanel(
    ctx,
    x,
    y,
    w,
    h
  );

  sectionTitle(
    ctx,
    x,
    y,
    "COMMAND MATRIX"
  );

  const list =
    commands.length
      ? commands
      : [
          {
            name: "N/A",
            count: 0
          }
        ];

  const colors = [
    C.violet,
    C.pink,
    C.aqua,
    C.blue,
    C.green,
    C.purple
  ];

  let py =
    y + 120;

  list
    .slice(0, 6)
    .forEach(
      (item, i) => {
        ctx.fillStyle =
          colors[i];

        ctx.font =
          "bold 21px monospace";

        ctx.fillText(
          "#" +
            String(
              i + 1
            ).padStart(
              2,
              "0"
            ),
          x + 35,
          py
        );

        ctx.fillStyle =
          C.white;

        ctx.font =
          "bold 22px monospace";

        ctx.fillText(
          item.name,
          x + 105,
          py
        );

        ctx.textAlign =
          "right";

        ctx.fillStyle =
          C.dim;

        ctx.fillText(
          item.count + "x",
          x + w - 35,
          py
        );

        ctx.textAlign =
          "left";

        drawBar(
          ctx,
          x + 105,
          py + 18,
          w - 175,
          9,
          (item.count /
            maxCommand) *
            100,
          colors[i]
        );

        py += 65;
      }
    );
}

function drawProcesses(
  ctx,
  x,
  y,
  w,
  h,
  processes
) {
  hologramPanel(
    ctx,
    x,
    y,
    w,
    h
  );

  sectionTitle(
    ctx,
    x,
    y,
    "PROCESS STREAM"
  );

  ctx.fillStyle =
    C.dim;

  ctx.font =
    "18px monospace";

  ctx.fillText(
    "PROCESS",
    x + 40,
    y + 105
  );

  ctx.fillText(
    "CPU",
    x + w - 210,
    y + 105
  );

  ctx.fillText(
    "MEM",
    x + w - 105,
    y + 105
  );

  const list =
    processes.length
      ? processes
      : [
          {
            name: "node",
            cpu: "—",
            mem: "—"
          }
        ];

  let py =
    y + 145;

  list
    .slice(0, 6)
    .forEach(
      (item, i) => {
        if (i % 2 === 0) {
          ctx.fillStyle =
            "rgba(196,92,255,0.035)";

          ctx.fillRect(
            x + 20,
            py - 25,
            w - 40,
            42
          );
        }

        ctx.fillStyle =
          i < 2
            ? C.green
            : C.violet;

        ctx.beginPath();

        ctx.arc(
          x + 42,
          py - 8,
          5,
          0,
          Math.PI * 2
        );

        ctx.fill();

        ctx.fillStyle =
          C.white;

        ctx.font =
          "19px monospace";

        ctx.fillText(
          String(
            item.name
          ).slice(0, 22),
          x + 65,
          py
        );

        ctx.fillStyle =
          C.aqua;

        ctx.fillText(
          item.cpu,
          x + w - 210,
          py
        );

        ctx.fillStyle =
          C.dim;

        ctx.fillText(
          item.mem,
          x + w - 105,
          py
        );

        py += 55;
      }
    );
}

function sectionTitle(
  ctx,
  x,
  y,
  title
) {
  ctx.fillStyle =
    C.pink;

  ctx.font =
    "bold 27px monospace";

  ctx.fillText(
    "◆",
    x + 35,
    y + 58
  );

  ctx.fillStyle =
    C.white;

  ctx.fillText(
    title,
    x + 75,
    y + 58
  );

  ctx.strokeStyle =
    "rgba(255,62,200,0.25)";

  ctx.lineWidth = 1;

  ctx.beginPath();

  ctx.moveTo(
    x + 35,
    y + 82
  );

  ctx.lineTo(
    x + 300,
    y + 82
  );

  ctx.stroke();
}

function hologramPanel(
  ctx,
  x,
  y,
  w,
  h
) {
  ctx.save();

  roundRect(
    ctx,
    x,
    y,
    w,
    h,
    32
  );

  ctx.fillStyle =
    "rgba(11,4,23,0.78)";

  ctx.shadowColor =
    "rgba(155,92,255,0.28)";

  ctx.shadowBlur = 35;

  ctx.fill();

  ctx.shadowBlur = 0;

  ctx.strokeStyle =
    "rgba(196,92,255,0.35)";

  ctx.lineWidth = 2;

  ctx.stroke();

  ctx.strokeStyle =
    "rgba(53,245,255,0.15)";

  ctx.lineWidth = 1;

  ctx.beginPath();

  ctx.moveTo(
    x + 30,
    y + 2
  );

  ctx.lineTo(
    x + w - 30,
    y + 2
  );

  ctx.stroke();

  drawCorner(
    ctx,
    x,
    y,
    1,
    1
  );

  drawCorner(
    ctx,
    x + w,
    y,
    -1,
    1
  );

  drawCorner(
    ctx,
    x,
    y + h,
    1,
    -1
  );

  drawCorner(
    ctx,
    x + w,
    y + h,
    -1,
    -1
  );

  ctx.restore();
}

function drawCorner(
  ctx,
  x,
  y,
  dx,
  dy
) {
  ctx.strokeStyle =
    C.aqua;

  ctx.lineWidth = 4;

  ctx.beginPath();

  ctx.moveTo(
    x,
    y + dy * 45
  );

  ctx.lineTo(
    x,
    y
  );

  ctx.lineTo(
    x + dx * 45,
    y
  );

  ctx.stroke();
}

function drawOrbitalMeter(
  ctx,
  cx,
  cy,
  r,
  pct,
  color,
  label
) {
  ctx.save();

  ctx.strokeStyle =
    "rgba(255,255,255,0.06)";

  ctx.lineWidth = 2;

  for (
    let i = 0;
    i < 3;
    i++
  ) {
    ctx.beginPath();

    ctx.arc(
      cx,
      cy,
      r - i * 25,
      0,
      Math.PI * 2
    );

    ctx.stroke();
  }

  ctx.setLineDash([
    8,
    12
  ]);

  ctx.strokeStyle =
    color + "55";

  ctx.beginPath();

  ctx.arc(
    cx,
    cy,
    r + 20,
    0,
    Math.PI * 2
  );

  ctx.stroke();

  ctx.setLineDash([]);

  const start =
    -Math.PI / 2;

  const end =
    start +
    Math.PI * 2 *
      Math.min(
        pct,
        100
      ) /
      100;

  ctx.beginPath();

  ctx.arc(
    cx,
    cy,
    r,
    start,
    end
  );

  ctx.strokeStyle =
    color;

  ctx.lineWidth = 14;

  ctx.lineCap =
    "round";

  ctx.shadowColor =
    color;

  ctx.shadowBlur = 25;

  ctx.stroke();

  ctx.shadowBlur = 0;

  ctx.fillStyle =
    C.white;

  ctx.font =
    "bold 45px Sans";

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  ctx.fillText(
    pct.toFixed(1) + "%",
    cx,
    cy
  );

  ctx.textBaseline =
    "alphabetic";

  ctx.fillStyle =
    C.dim;

  ctx.font =
    "bold 20px monospace";

  ctx.fillText(
    label,
    cx,
    cy + 55
  );

  ctx.textAlign =
    "left";

  ctx.restore();
}

function drawWaveform(
  ctx,
  x,
  y,
  w,
  h,
  data
) {
  ctx.save();

  ctx.strokeStyle =
    "rgba(53,245,255,0.08)";

  ctx.lineWidth = 1;

  for (
    let i = 0;
    i < 5;
    i++
  ) {
    const gy =
      y +
      (h / 4) * i;

    ctx.beginPath();

    ctx.moveTo(
      x,
      gy
    );

    ctx.lineTo(
      x + w,
      gy
    );

    ctx.stroke();
  }

  const step =
    w /
    (data.length - 1);

  ctx.beginPath();

  data.forEach(
    (value, i) => {
      const px =
        x + i * step;

      const py =
        y +
        h -
        (value / 100) *
          h;

      if (i === 0) {
        ctx.moveTo(
          px,
          py
        );
      } else {
        ctx.lineTo(
          px,
          py
        );
      }
    }
  );

  ctx.strokeStyle =
    C.aqua;

  ctx.lineWidth = 5;

  ctx.shadowColor =
    C.aqua;

  ctx.shadowBlur = 20;

  ctx.stroke();

  ctx.shadowBlur = 0;

  ctx.lineTo(
    x + w,
    y + h
  );

  ctx.lineTo(
    x,
    y + h
  );

  ctx.closePath();

  const gradient =
    ctx.createLinearGradient(
      0,
      y,
      0,
      y + h
    );

  gradient.addColorStop(
    0,
    "rgba(53,245,255,0.22)"
  );

  gradient.addColorStop(
    1,
    "rgba(53,245,255,0)"
  );

  ctx.fillStyle =
    gradient;

  ctx.fill();

  ctx.restore();
}

function drawSignalBars(
  ctx,
  x,
  y,
  w,
  h
) {
  const count = 18;
  const gap = 9;
  const bw =
    (w -
      gap *
        (count - 1)) /
    count;

  for (
    let i = 0;
    i < count;
    i++
  ) {
    const active =
      i <
      15 +
        Math.floor(
          Math.random() * 3
        );

    ctx.fillStyle =
      active
        ? i % 3 === 0
          ? C.pink
          : C.aqua
        : "#251936";

    ctx.fillRect(
      x +
        i *
          (bw + gap),
      y,
      bw,
      h
    );
  }
}

function drawBar(
  ctx,
  x,
  y,
  w,
  h,
  pct,
  color
) {
  pct = Math.max(
    0,
    Math.min(
      100,
      Number(pct) || 0
    )
  );

  roundRect(
    ctx,
    x,
    y,
    w,
    h,
    h / 2
  );

  ctx.fillStyle =
    "#1b1029";

  ctx.fill();

  const fillW =
    Math.max(
      h,
      (w * pct) / 100
    );

  roundRect(
    ctx,
    x,
    y,
    fillW,
    h,
    h / 2
  );

  ctx.fillStyle =
    color;

  ctx.shadowColor =
    color;

  ctx.shadowBlur = 15;

  ctx.fill();

  ctx.shadowBlur = 0;
}

function drawFooter(
  ctx,
  W,
  H,
  stats
) {
  const y =
    H - 75;

  ctx.strokeStyle =
    "rgba(196,92,255,0.25)";

  ctx.lineWidth = 1;

  ctx.beginPath();

  ctx.moveTo(
    100,
    y - 30
  );

  ctx.lineTo(
    W - 100,
    y - 30
  );

  ctx.stroke();

  ctx.fillStyle =
    C.green;

  ctx.font =
    "bold 20px monospace";

  ctx.fillText(
    "● SECURE",
    100,
    y
  );

  ctx.fillStyle =
    C.dim;

  ctx.fillText(
    "𝐌𝐚𝐑𝐮𝐅",
    330,
    y
  );

  ctx.fillStyle =
    C.white;

  ctx.fillText(
    `${os.cpus().length} THREADS`,
    530,
    y
  );

  ctx.fillStyle =
    C.dim;

  ctx.fillText(
    "COMMANDS",
    820,
    y
  );

  ctx.fillStyle =
    C.white;

  ctx.fillText(
    String(
      Object.keys(stats).length
    ),
    990,
    y
  );

  ctx.textAlign =
    "right";

  ctx.fillStyle =
    C.pink;

  ctx.fillText(
    "Created by 𝐌𝐚𝐑𝐮𝐅 // V 3.0.0",
    W - 100,
    y
  );

  ctx.textAlign =
    "left";
}

function roundRect(
  ctx,
  x,
  y,
  w,
  h,
  r
) {
  ctx.beginPath();

  ctx.moveTo(
    x + r,
    y
  );

  ctx.arcTo(
    x + w,
    y,
    x + w,
    y + h,
    r
  );

  ctx.arcTo(
    x + w,
    y + h,
    x,
    y + h,
    r
  );

  ctx.arcTo(
    x,
    y + h,
    x,
    y,
    r
  );

  ctx.arcTo(
    x,
    y,
    x + w,
    y,
    r
  );

  ctx.closePath();
}

function formatBytes(
  bytes
) {
  if (!bytes) {
    return "0.00 GB";
  }

  return (
    bytes /
    1024 /
    1024 /
    1024
  ).toFixed(2) +
    " GB";
}

function formatUptime(
  seconds
) {
  const d =
    Math.floor(
      seconds / 86400
    );

  const h =
    Math.floor(
      (seconds % 86400) /
        3600
    );

  const m =
    Math.floor(
      (seconds % 3600) /
        60
    );

  const s =
    Math.floor(seconds % 60);

  return `${d}d ${h}h ${m}m ${s}s`;
}