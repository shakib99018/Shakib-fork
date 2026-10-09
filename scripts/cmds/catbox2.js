const axios = require("axios");
const FormData = require("form-data");
const path = require("path");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36";

const MIME_EXT = {
  "image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif", "image/webp": ".webp",
  "video/mp4": ".mp4", "video/webm": ".webm", "video/quicktime": ".mov",
  "audio/mpeg": ".mp3", "audio/mp4": ".m4a", "audio/ogg": ".ogg", "audio/wav": ".wav",
  "application/pdf": ".pdf", "application/zip": ".zip"
};

const post = (url, form) =>
  axios.post(url, form, {
    headers: { ...form.getHeaders(), "User-Agent": UA },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    timeout: 120000
  });

const host = {
  async catbox(buf, filename, type) {
    const f = new FormData();
    f.append("reqtype", "fileupload");
    f.append("fileToUpload", buf, { filename, contentType: type });
    const { data } = await post("https://catbox.moe/user/api.php", f);
    if (typeof data === "string" && data.startsWith("http")) return data.trim();
    throw new Error(String(data).slice(0, 80));
  },

  async uguu(buf, filename, type) {
    const f = new FormData();
    f.append("files[]", buf, { filename, contentType: type });
    const { data } = await post("https://uguu.se/upload", f);
    const link = data?.files?.[0]?.url;
    if (!link) throw new Error("no url returned");
    return link;
  },

  async tmpfiles(buf, filename, type) {
    const f = new FormData();
    f.append("file", buf, { filename, contentType: type });
    const { data } = await post("https://tmpfiles.org/api/v1/upload", f);
    const link = data?.data?.url;
    if (!link) throw new Error("no url returned");
    return link.replace("tmpfiles.org/", "tmpfiles.org/dl/"); // direct link
  }
};

async function download(url) {
  try {
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 60000,
      maxContentLength: 200 * 1024 * 1024,
      headers: { "User-Agent": UA }
    });
    const type = (res.headers["content-type"] || "application/octet-stream").split(";")[0].trim();
    let ext = path.extname(new URL(url).pathname);
    if (!ext || ext.length > 6) ext = MIME_EXT[type] || ".bin";
    return { buf: Buffer.from(res.data), type, filename: `file_${Date.now()}${ext}` };
  } catch (e) {
    throw new Error(`Download failed: ${e.response?.status || e.message}`);
  }
}

async function uploadWithFallback(url) {
  const { buf, type, filename } = await download(url);
  const errors = [];
  for (const name of ["catbox", "uguu", "tmpfiles"]) {
    try {
      const link = await host[name](buf, filename, type);
      return { link, via: name };
    } catch (e) {
      errors.push(`${name}: ${e.response?.status || e.message}`);
    }
  }
  throw new Error(errors.join(" | "));
}

module.exports = {
  config: {
    name: "catbox2",
    aliases: ["upload2", "cb2"],
    version: "1.2",
    author: "Zihad",
    countDown: 5,
    role: 0,
    description: { en: "Upload replied file/image/video and get a link (catbox, with fallbacks)" },
    category: "utility",
    guide: { en: "Reply to an attachment with {pn}\nOr: {pn} <direct file url>" }
  },

  onStart: async function ({ message, event, args }) {
    const attachments = event.messageReply?.attachments || [];
    let urls = attachments.map(a => a.url);
    if (!urls.length && args[0] && /^https?:\/\//i.test(args[0])) urls = [args[0]];

    if (!urls.length)
      return message.reply("❌ কোনো ছবি/ভিডিও/ফাইলে reply দাও, অথবা একটি direct URL দাও।");

    message.reaction("⏳", event.messageID);

    const lines = [];
    let ok = false;
    for (const [i, url] of urls.entries()) {
      try {
        const { link, via } = await uploadWithFallback(url);
        lines.push(`${i + 1}. ${link}\n   (via ${via})`);
        ok = true;
      } catch (e) {
        lines.push(`${i + 1}. ❌ ${e.message}`);
      }
    }

    message.reaction(ok ? "✅" : "❌", event.messageID);
    return message.reply(`📦 Upload (${urls.length})\n━━━━━━━━━━━━\n${lines.join("\n")}`);
  }
};
