const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
 config: {
 name: "push",
 version: "2.3",
 author: "𝐌𝐚𝐑𝐮𝐅",
 role: 3,
 category: "owner"
 },
 onStart: async function ({ message, args }) {
 // Token ekhon variable theke nibe
 const TOKEN = process.env.GITHUB_TOKEN;
 const USER = "shakib99018";
 const REPO = "Shakib-fork";
 const BRANCH = "main";

 if (!TOKEN) return message.reply("❌ token missing\n.env file e GITHUB_TOKEN set koro");
 if (!args[0]) return message.reply("use: push <fileName>");

 const headers = { Authorization: `Bearer ${TOKEN}` };
 const dir = path.join(process.cwd(), "scripts/cmds");
 const files = [...new Set(args.map(a => a.replace(".js","")))];

 if (files.length === 1) {
 const name = files[0];
 const filePath = path.join(dir, `${name}.js`);
 if (!await fs.pathExists(filePath)) return message.reply(`❌ File Not Found: ${name}.js`);
 const content = await fs.readFile(filePath, "utf8");
 const url = `https://api.github.com/repos/${USER}/${REPO}/contents/scripts/cmds/${name}.js`;
 let sha;
 try {
 const res = await axios.get(url, { headers, params: { ref: BRANCH } });
 sha = res.data.sha;
 } catch {}
 await axios.put(url, { message: `${sha? "Update" : "Add"} ${name}`, content: Buffer.from(content).toString("base64"), branch: BRANCH,...(sha && { sha }) }, { headers });
 if (sha) {
 return message.reply(`🔄 Command Rewrite Successful\n\nFile: ${name}.js\nStatus: Updated on GitHub`);
 } else {
 return message.reply(`✅ Command Upload Successful\n\nFile: ${name}.js\nStatus: Pushed to GitHub`);
 }
 }

 let uploaded = 0, rewritten = 0, failed = 0;
 let logs = [];
 for (const name of files) {
 try {
 const filePath = path.join(dir, `${name}.js`);
 if (!await fs.pathExists(filePath)) {
 failed++;
 logs.push(`❌ ${name} - not found`);
 continue;
 }
 const content = await fs.readFile(filePath, "utf8");
 const url = `https://api.github.com/repos/${USER}/${REPO}/contents/scripts/cmds/${name}.js`;
 let sha;
 try {
 const res = await axios.get(url, { headers, params: { ref: BRANCH } });
 sha = res.data.sha;
 } catch {}
 await axios.put(url, { message: `${sha? "Update" : "Add"} ${name}`, content: Buffer.from(content).toString("base64"), branch: BRANCH,...(sha && { sha }) }, { headers });
 if (sha) {
 rewritten++;
 logs.push(`🔄 ${name} - rewritten`);
 } else {
 uploaded++;
 logs.push(`✅ ${name} - uploaded`);
 }
 } catch {
 failed++;
 logs.push(`❌ ${name} - failed`);
 }
 }
 return message.reply(
 `📦 Push Complete\n\n✅ Uploaded: ${uploaded}\n🔄 Rewritten: ${rewritten}\n❌ Failed: ${failed}\n\n${logs.join("\n")}`
 );
 }
};