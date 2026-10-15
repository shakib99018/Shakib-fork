const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
	config: {
		name: "pastebin",
		aliases: ["bin"],
		version: "1.0.1",
		author: "—͞𝐏ʀɪᴍᴇ́",
		role: 2,
		category: "tool",
		guide: "{pn} <fileName>"
	},

	onStart: async function ({ api, event, args }) {
		const { threadID, messageID } = event;
		const name = args[0];

		if (!name) {
			return api.sendMessage(
				"🌸💫 𝑶𝒑𝒔! 𝑭𝒊𝒍𝒆 𝑵𝒂𝒎𝒆 𝑵𝒆𝒆𝒅𝒆𝒅 💫🌸\n" +
				"📁 𝑼𝒔𝒆 : pastebin <fileName>",
				threadID,
				messageID
			);
		}

		const filePath = path.join(__dirname, `${name}.js`);

		if (!fs.existsSync(filePath)) {
			return api.sendMessage(
				"❌ 𝑭𝒊𝒍𝒆 𝑵𝒐𝒕 𝑭𝒐𝒖𝒏𝒅\n" +
				`📁 𝑭𝒊𝒍𝒆 : ${name}.js`,
				threadID,
				messageID
			);
		}

		try {
			const code = fs.readFileSync(filePath, "utf8");

			const response = await axios.post(
				"https://api.pastes.dev/post",
				code,
				{
					headers: {
						"Content-Type": "text/javascript",
						"User-Agent": "GoatBot-Pastebin-Command"
					},
					maxBodyLength: Infinity,
					maxContentLength: Infinity,
					validateStatus: status =>
						status >= 200 && status < 300
				}
			);

			let pasteKey;

			if (typeof response.data === "string") {
				try {
					const json = JSON.parse(response.data);
					pasteKey = json?.key;
				}
				catch {
					pasteKey = response.data.trim();
				}
			}
			else {
				pasteKey = response.data?.key;
			}

			if (!pasteKey) {
				const location =
					response.headers?.location ||
					response.headers?.Location;

				if (location) {
					pasteKey = location.split("/").pop();
				}
			}

			if (!pasteKey) {
				return api.sendMessage(
					"❌ 𝑼𝒑𝒍𝒐𝒂𝒅 𝑭𝒂𝒊𝒍𝒆𝒅!",
					threadID,
					messageID
				);
			}

			const rawURL =
				`https://api.pastes.dev/${pasteKey}`;

			const msg =
				"╭━━━〔 💎 𝑷𝑨𝑺𝑻𝑬 𝑩𝑰𝑵 💎 〕━━━╮\n" +
				"┃\n" +
				`┃ 📁 𝑭𝒊𝒍𝒆 : ${name}.js\n` +
				"┃ ✨ 𝑺𝒕𝒂𝒕𝒖𝒔 : 𝑼𝒑𝒍𝒐𝒂𝒅𝒆𝒅\n" +
				"┃\n" +
				`┃ 🔗 𝑹𝒂𝒘 : ${rawURL}\n` +
				"┃\n" +
				"╰━━━━━━━━━━━━━━━━━━━━━━╯";

			return api.sendMessage(
				msg,
				threadID,
				messageID
			);
		}
		catch (error) {
			const status = error?.response?.status;

			return api.sendMessage(
				status
					? `❌ 𝑼𝒑𝒍𝒐𝒂𝒅 𝑭𝒂𝒊𝒍𝒆𝒅!\n⚠️ 𝑯𝑻𝑻𝑷 : ${status}`
					: "❌ 𝑷𝒂𝒔𝒕𝒆 𝑨𝑷𝑰 𝑬𝒓𝒓𝒐𝒓!",
				threadID,
				messageID
			);
		}
	}
};
