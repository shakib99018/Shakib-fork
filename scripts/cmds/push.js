const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
 config: {
 name: "push",
 version: "3.0.0",
 author: "—͞𝐏ʀɪᴍᴇ́",
 countDown: 5,
 role: 2,
 description: {
 en: "Push commands to GitHub."
 },
 category: "owner",
 guide: {
 en: "{pn} <fileName> [fileName2]..."
 }
 },

 onStart: async function ({ message, args }) {
 const TOKEN = process.env.GITHUB_TOKEN;
 const USER = "shakib99018";
 const REPO = "Shakib-fork";
 const BRANCH = "main";

 if (!TOKEN) {
 return message.reply(
 "━━━━━━━━━━━━━━━━━━━━━\n" +
 "𓆩 𝘗𝘜𝘚𝘏 𝘌𝘙𝘙𝘖𝘙 𓆪\n\n" +
 "💠 𝘎𝘐𝘛𝘏𝘜𝘉_𝘛𝘖𝘒𝘌𝘕 𝘮𝘪𝘴𝘴𝘪𝘯𝘨!\n" +
 "━━━━━━━━━━━━━━━━━━━━━"
 );
 }

 if (!args[0]) {
 return message.reply(
 "━━━━━━━━━━━━━━━━━━━━━\n" +
 "𓆩 𝘗𝘜𝘚𝘏 𝘏𝘌𝘓𝘗 𓆪\n\n" +
 "🪶 𝘜𝘴𝘢𝘨𝘦: 𝘱𝘶𝘴𝘩 <𝘧𝘪𝘭𝘦>\n" +
 "📂 𝘌𝘹: 𝘱𝘶𝘴𝘩 𝘳𝘶𝘯𝘵𝘪𝘮𝘦 𝘧𝘪𝘭𝘦𝘤𝘮𝘥\n" +
 "━━━━━━━━━━━━━━━━━━━━━"
 );
 }

 const headers = { Authorization: `Bearer ${TOKEN}` };
 const dir = path.join(process.cwd(), "scripts/cmds");
 const files = [...new Set(args.map(a => a.replace(".js", "")))];

 try {
 const refRes = await axios.get(`https://api.github.com/repos/${USER}/${REPO}/git/ref/heads/${BRANCH}`, { headers });
 const latestCommitSha = refRes.data.object.sha;

 const commitRes = await axios.get(`https://api.github.com/repos/${USER}/${REPO}/git/commits/${latestCommitSha}`, { headers });
 const baseTreeSha = commitRes.data.tree.sha;

 let blobs = [];
 let validFiles = [];
 let logs = [];

 for (const name of files) {
 const filePath = path.join(dir, `${name}.js`);
 if (!await fs.pathExists(filePath)) {
 logs.push(`❀ ${name} — 𝘯𝘰𝘵 𝘧𝘰𝘶𝘯𝘥`);
 continue;
 }
 const content = await fs.readFile(filePath, "utf8");
 const blobRes = await axios.post(`https://api.github.com/repos/${USER}/${REPO}/git/blobs`, {
 content: Buffer.from(content).toString("base64"),
 encoding: "base64"
 }, { headers });

 blobs.push({
 path: `scripts/cmds/${name}.js`,
 mode: "100644",
 type: "blob",
 sha: blobRes.data.sha
 });
 validFiles.push(name);
 logs.push(`📜 ${name}.js`);
 }

 if (blobs.length === 0) {
 return message.reply(
 "━━━━━━━━━━━━━━━━━━━━━\n" +
 "𓆩 𝘗𝘜𝘚𝘏 𝘍𝘈𝘐𝘓𝘌𝘋 𓆪\n\n" +
 `${logs.join("\n")}\n` +
 "━━━━━━━━━━━━━━━━━━━━━"
 );
 }

 const treeRes = await axios.post(`https://api.github.com/repos/${USER}/${REPO}/git/trees`, {
 base_tree: baseTreeSha,
 tree: blobs
 }, { headers });

 const commitMessage = validFiles.length === 1? `Update ${validFiles[0]} —͞𝐏ʀɪᴍᴇ́` : `Push ${validFiles.length} cmds —͞𝐏ʀɪᴍᴇ́`;

 const newCommitRes = await axios.post(`https://api.github.com/repos/${USER}/${REPO}/git/commits`, {
 message: commitMessage,
 tree: treeRes.data.sha,
 parents: [latestCommitSha]
 }, { headers });

 await axios.patch(`https://api.github.com/repos/${USER}/${REPO}/git/refs/heads/${BRANCH}`, {
 sha: newCommitRes.data.sha
 }, { headers });

 return message.reply(
 "━━━━━━━━━━━━━━━━━━━━━\n" +
 "𓆩 𝘗𝘜𝘚𝘏 𝘚𝘜𝘊𝘊𝘌𝘚 𓆪\n\n" +
 `📦 𝘗𝘶𝘴𝘩𝘦𝘥: ${validFiles.length} 𝐟𝐢𝐥𝐞𝐬\n` +
 `${logs.join("\n")}\n` +
 "━━━━━━━━━━━━━━━━━━━━━"
 );

 } catch (err) {
 console.error(err.response?.data || err);
 return message.reply(
 "━━━━━━━━━━━━━━━━━━━━━\n" +
 "𓆩 𝘗𝘜𝘚𝘏 𝘌𝘙𝘙𝘖𝘙 𓆪\n\n" +
 `❀ ${err.response?.data?.message || err.message}\n` +
 "━━━━━━━━━━━━━━━━━━━━━"
 );
 }
 }
};
