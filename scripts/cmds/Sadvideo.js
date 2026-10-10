const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

let videoQueue = [];
let lastVideo = null;

module.exports = {
  config: {
    name: "sadvideo",
    aliases: ["sad", "sadvid"],
    version: "2.1",
    author: "Sakib",
    countDown: 3,
    role: 0,
    shortDescription: "Sad video",
    longDescription: "Send sad videos without repeating.",
    category: "fun",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event }) {
    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    const links = [
      "https://drive.google.com/uc?id=16KeE4J7L2Pd8cCKIBvlwEPP07A92b-eb",
      "https://drive.google.com/uc?id=16MhNPi_H0-tEe5PQrrqkx_l7SrC_l0kd",
      "https://drive.google.com/uc?id=15w4cvYmKrCW2Hul2AcvPEk5S4b-CH3EE",
      "https://drive.google.com/uc?id=16Xa6thSHdEGCiypaetbAEqVCwEAzFnKX",
      "https://drive.google.com/uc?id=16BnRPvKQd7gd3YLR_rB9QNZymotMqHu7",
      "https://drive.google.com/uc?id=15fDe2735O50z-3G4yQ5tDT9J873x5izm",
      "https://drive.google.com/uc?id=16HgiGU7_Cdh8NtpsKi92dTJmALJCV8jD",
      "https://drive.google.com/uc?id=16KTSrInqvioGnT7RrAskjHYqz8R6RgNY",
      "https://drive.google.com/uc?id=162yWrNRRTeN4tFEjQEtsR4p-4gWbTFaS",
      "https://drive.google.com/uc?id=16-q768c6nXstZEjQhWa1pZUPL2Xpjwo9",
      "https://drive.google.com/uc?id=15bfkP01mTzXutgP_0Z1iyud7SXqq-jOt",
      "https://drive.google.com/uc?id=15WnvdFOQIhKQ1nlZgsABXaf6Q2nQexGW",
      "https://drive.google.com/uc?id=16GTgYVSIDduUs4VTxadIzPPyp9KA_102",
      "https://drive.google.com/uc?id=15Y2GnA-Kcox8Mw6jioxHc1G1yP4pihnC",
      "https://drive.google.com/uc?id=16-qsG6oldtJiGq11Q3bFxKzuZJRFnoPT",
      "https://drive.google.com/uc?id=15W8ETDBXrn_JvealPwPFQ2CjvZp437-g",
      "https://drive.google.com/uc?id=15StZMKfsTdAhhECdKjS6FUFwG_OIHa7W",
      "https://drive.google.com/uc?id=16lOXxs-Z9u-mxttFnwWzdUHvrP55aHnZ",
      "https://drive.google.com/uc?id=162Qn-pcnc9iijg5dv59S9DTTQOofL4Fy",
      "https://drive.google.com/uc?id=1680rf1wQ2TrRuSLHtTwFC7GYctJAnHaX",
      "https://drive.google.com/uc?id=16-XtMXpa4r1iFJTBS2N68ARMuDH2IWpG",
      "https://drive.google.com/uc?id=15bO3lguAxsMZPvKkcvlsM6ObXOfJMz79"
    ];

    function shuffle(array) {
      const result = [...array];

      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = result[i];
        result[i] = result[j];
        result[j] = temp;
      }

      return result;
    }

    if (videoQueue.length === 0) {
      videoQueue = shuffle(links);

      if (videoQueue.length > 1 && videoQueue[0] === lastVideo) {
        const temp = videoQueue[0];
        videoQueue[0] = videoQueue[1];
        videoQueue[1] = temp;
      }
    }

    let response = null;
    let selectedUrl = null;

    while (videoQueue.length > 0) {
      const url = videoQueue.shift();

      try {
        const result = await axios.get(url, {
          responseType: "arraybuffer",
          timeout: 120000,
          maxRedirects: 5
        });

        const buffer = Buffer.from(result.data);
        const type = result.headers["content-type"] || "";

        if (
          buffer.length < 1000 ||
          type.includes("text/html")
        ) {
          continue;
        }

        response = result;
        selectedUrl = url;
        break;
      } catch (error) {
        console.log("[SADVIDEO] Skipped:", url, error.message);
      }
    }

    if (!response) {
      videoQueue = [];

      return api.sendMessage(
        "❌ কোনো কাজ করা ভিডিও পাওয়া যায়নি।",
        event.threadID,
        event.messageID
      );
    }

    const filePath = path.join(
      cacheDir,
      "sad_" + Date.now() + ".mp4"
    );

    try {
      await fs.writeFile(filePath, Buffer.from(response.data));

      await api.sendMessage(
        {
          body: "হাসি মুখে লুকিয়ে রাখি,\nচোখের জলে লিখে যাই গল্প…! 😅💔",
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        function (err) {
          if (err) {
            console.log("[SADVIDEO] Send error:", err.message);
          }

          fs.remove(filePath).catch(function () {});
        },
        event.messageID
      );

      lastVideo = selectedUrl;
    } catch (error) {
      await fs.remove(filePath).catch(function () {});

      return api.sendMessage(
        "❌ ভিডিও পাঠাতে সমস্যা হয়েছে।",
        event.threadID,
        event.messageID
      );
    }
  }
};
