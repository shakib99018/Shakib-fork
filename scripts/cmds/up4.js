const pidusage = require("pidusage");
const si = require("systeminformation");

module.exports = {
  config: {
    name: "up4",
    version: "1.3",
    author: "RS RIFAT",
    countDown: 5,
    role: 0,
    shortDescription: "system uptime",
    longDescription: "Fast boot → dashboard with CPU, owner, and GC count",
    category: "system"
  },

  onStart: async function ({ api, event, threadsData, message }) {
    const frames = [
      "[ █🗂️░░░░░░░░░░░░░░ ] 10%",
      "[ █████🗂️░░░░░░░░░ ] 30%",
      "[ █████████🗂️░░░░ ] 60%",
      "[ █████████████✅ ] 80%",
      "[ ███████████████ ] 100%"
    ];

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // ১ম মেসেজ পাঠানো (Initial loading message)
    let sentInfo = null;
    const initialText = `⏳ Loading System Info...\n${frames[0]}`;

    if (message && typeof message.reply === "function") {
      sentInfo = await message.reply(initialText);
    } else if (api && typeof api.sendMessage === "function") {
      sentInfo = await new Promise((resolve) => {
        api.sendMessage(initialText, event.threadID, (err, info) => {
          if (err) resolve(null);
          else resolve(info);
        }, event.messageID);
      });
    }

    // মেসেজ এডিটের হেলপার ফাংশন
    const editMsg = async (text) => {
      if (!sentInfo) return;
      const messageID = sentInfo.messageID || sentInfo.message_id;
      
      if (message && typeof message.edit === "function") {
        await message.edit(text, messageID);
      } else if (api && typeof api.editMessage === "function") {
        await api.editMessage(text, messageID);
      }
    };

    // অ্যানিমেশন ফ্রেম আপডেট করা (Frame by frame edit)
    for (let i = 1; i < frames.length; i++) {
      await sleep(300);
      await editMsg(`⏳ Loading System Info...\n${frames[i]}`);
    }

    // ড্যাশবোর্ড তৈরি করার ফাংশন
    const buildPanel = async () => {
      const uptime = process.uptime();
      const d = Math.floor(uptime / 86400);
      const h = Math.floor((uptime % 86400) / 3600);
      const m = Math.floor((uptime % 3600) / 60);
      const s = Math.floor(uptime % 60);

      const [mem, load, cpu] = await Promise.all([
        si.mem(),
        pidusage(process.pid),
        si.cpu()
      ]);

      let gcCount = 0;
      const botID = String(api?.getCurrentUserID?.() || "");

      try {
        let liveThreads = [];
        if (api && typeof api.getThreadList === "function") {
          try {
            const fetched = await api.getThreadList(100, null, ["INBOX"]);
            if (Array.isArray(fetched)) {
              liveThreads = fetched.filter(t => t && t.isGroup && !t.threadID?.includes("@msgr"));
            }
          } catch (e) {
            console.error(e);
          }
        }

        if (liveThreads.length > 0) {
          gcCount = liveThreads.length;
        } else {
          let dbThreads = [];
          if (threadsData && typeof threadsData.getAll === "function") {
            dbThreads = await threadsData.getAll();
          } else if (global.db && Array.isArray(global.db.allThreadData)) {
            dbThreads = global.db.allThreadData;
          }

          if (Array.isArray(dbThreads)) {
            gcCount = dbThreads.filter(t => {
              if (!t || !t.isGroup || t.threadID?.includes("@msgr")) return false;
              return Array.isArray(t.members)
                ? t.members.some(m => String(m.userID) === botID && m.inGroup !== false)
                : true;
            }).length;
          }
        }
      } catch (err) {
        console.error("Group chat counting error:", err);
      }

      const now = new Date();
      const date = now.toLocaleDateString("en-US");
      const time = now.toLocaleTimeString("en-US", { hour12: false });

      return `
╔═════════════════════╗
║        ⚡ RS. BOT SYSTEM ⚡
╠═════════════════════╣
║ ⏳ Uptime   : ${d}d ${h}h ${m}m ${s}s
║ 📅 Date     : ${date}
║ 🕒 Time     : ${time}
║
║ 🔥 CPU Load : ${load.cpu.toFixed(1)}%
║ 🧩 CPU Cores: ${cpu.cores}
║ 🧵 Threads  : ${cpu.threads || cpu.processors}
║ 💾 RAM Used : ${(mem.used / 1024 ** 3).toFixed(2)} GB
║ 💾 RAM Total: ${(mem.total / 1024 ** 3).toFixed(2)} GB
║ 👥 Group Chats : ${gcCount}
║
║ ⚙️ PID      : ${process.pid}
║ 🛠 Node.js  : ${process.version}
║ 🧘‍♂️ Owner   : EWR RIFAT
╠═════════════════════╣
║        ✅ SYSTEM RUNNING
╚═════════════════════╝
`.trim();
    };

    // ফাইনাল প্যানেল তৈরি করে মেসেজ আপডেট করে দেওয়া
    const finalPanel = await buildPanel();
    await editMsg(finalPanel);
  }
};
