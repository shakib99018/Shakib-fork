const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

module.exports = {
  config: {
    name: "catbox",
    version: "4.0.0",
    author: "Zihad",
    role: 0,
    shortDescription: "Universal file uploader",
    longDescription: "Upload replied files with automatic fallback.",
    category: "media",
    guide: "{pn} - Reply to a file",
    cooldowns: 5
  },

  onStart: async function ({ api, event }) {
    const tid = event.threadID;
    const mid = event.messageID;
    const reply = event.messageReply;

    if (!reply || !reply.attachments || !reply.attachments.length) {
      return api.sendMessage(
        "❌ | Reply to an image, video, audio or file.",
        tid,
        mid
      );
    }

    const attachment = reply.attachments[0];
    const fileURL = attachment.url;

    if (!fileURL) {
      return api.sendMessage(
        "❌ | Attachment URL not found.",
        tid,
        mid
      );
    }

    const cacheDir = path.join(__dirname, "cache");

    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const originalName =
      attachment.filename ||
      "facebook_" + Date.now() + ".tmp";

    const ext = path.extname(originalName) || ".tmp";

    const filePath = path.join(
      cacheDir,
      "upload_" + Date.now() + ext
    );

    try {
      await api.sendMessage(
        "⏳ | Downloading attachment...",
        tid,
        mid
      );

      const download = await axios.get(fileURL, {
        responseType: "stream",
        timeout: 120000,
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const writer = fs.createWriteStream(filePath);

      download.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      if (!fs.existsSync(filePath)) {
        throw new Error("File download failed.");
      }

      /*
       * =====================================================
       * UPLOADER 1 - UGUU
       * =====================================================
       */

      try {
        await api.sendMessage(
          "⏳ | Uploading... [1/3]",
          tid,
          mid
        );

        const form = new FormData();

        form.append(
          "files[]",
          fs.createReadStream(filePath),
          {
            filename: originalName
          }
        );

        const response = await axios.post(
          "https://uguu.se/upload.php",
          form,
          {
            headers: {
              ...form.getHeaders(),
              "User-Agent": "Mozilla/5.0"
            },
            timeout: 180000,
            maxBodyLength: Infinity,
            maxContentLength: Infinity
          }
        );

        const data = response.data;

        let url = null;

        if (data && data.files && data.files[0]) {
          url =
            data.files[0].url ||
            data.files[0].url_short ||
            null;
        }

        if (
          !url &&
          typeof data === "string" &&
          data.startsWith("http")
        ) {
          url = data.trim();
        }

        if (url) {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }

          return api.sendMessage(
            "✅ | Upload Successful\n\n" +
            "📁 File: " + originalName + "\n" +
            "🌐 Host: Uguu\n\n" +
            "🔗 " + url,
            tid,
            mid
          );
        }

      } catch (e) {
        console.log(
          "Uguu failed:",
          e.response
            ? e.response.status
            : e.message
        );
      }

      /*
       * =====================================================
       * UPLOADER 2 - 0X0.ST
       * =====================================================
       */

      try {
        await api.sendMessage(
          "⏳ | Trying backup uploader... [2/3]",
          tid,
          mid
        );

        const form = new FormData();

        form.append(
          "file",
          fs.createReadStream(filePath),
          {
            filename: originalName
          }
        );

        const response = await axios.post(
          "https://0x0.st",
          form,
          {
            headers: {
              ...form.getHeaders(),
              "User-Agent": "Mozilla/5.0"
            },
            timeout: 180000,
            maxBodyLength: Infinity,
            maxContentLength: Infinity
          }
        );

        const url = String(
          response.data || ""
        ).trim();

        if (url.startsWith("http")) {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }

          return api.sendMessage(
            "✅ | Upload Successful\n\n" +
            "📁 File: " + originalName + "\n" +
            "🌐 Host: 0x0.st\n\n" +
            "🔗 " + url,
            tid,
            mid
          );
        }

      } catch (e) {
        console.log(
          "0x0.st failed:",
          e.response
            ? e.response.status
            : e.message
        );
      }

      /*
       * =====================================================
       * UPLOADER 3 - BEACON
       * =====================================================
       */

      try {
        await api.sendMessage(
          "⏳ | Trying final uploader... [3/3]",
          tid,
          mid
        );

        const form = new FormData();

        form.append(
          "file",
          fs.createReadStream(filePath),
          {
            filename: originalName
          }
        );

        const response = await axios.post(
          "https://beacon.host/v1/upload",
          form,
          {
            headers: {
              ...form.getHeaders(),
              "User-Agent": "Mozilla/5.0"
            },
            timeout: 180000,
            maxBodyLength: Infinity,
            maxContentLength: Infinity
          }
        );

        let url = null;

        if (response.data) {
          if (typeof response.data === "string") {
            url = response.data.trim();
          } else {
            url =
              response.data.url ||
              response.data.download_url ||
              null;
          }
        }

        if (url && url.startsWith("http")) {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }

          return api.sendMessage(
            "✅ | Upload Successful\n\n" +
            "📁 File: " + originalName + "\n" +
            "🌐 Host: Beacon\n\n" +
            "🔗 " + url,
            tid,
            mid
          );
        }

      } catch (e) {
        console.log(
          "Beacon failed:",
          e.response
            ? e.response.status
            : e.message
        );
      }

      /*
       * =====================================================
       * ALL FAILED
       * =====================================================
       */

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return api.sendMessage(
        "❌ | All Upload Servers Failed\n\n" +
        "› Uguu ❌\n" +
        "› 0x0.st ❌\n" +
        "› Beacon ❌\n\n" +
        "⚠️ The upload services may be temporarily unavailable.",
        tid,
        mid
      );

    } catch (error) {
      console.error("Uploader Error:", error);

      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {}
      }

      return api.sendMessage(
        "❌ | Upload Failed\n\n" +
        "› " +
        (error.message || "Unknown error"),
        tid,
        mid
      );
    }
  }
};
