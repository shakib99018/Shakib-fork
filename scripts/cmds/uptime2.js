const os = require("os"), fs = require("fs"), path = require("path");
const W = 800, H = 450, N = 40, TAU = 6.2832;
const K = { a: "#a855f7", b: "#7c3aed", c: "#c084fc", pk: "#e879f9", gd: "#fbbf24", gr: "#4ade80", t: "#ffffff", d: "#9f8bb8" };

module.exports = {
	config: {
		name: "uptime2", version: "2.0", author: "Zihad",
		countDown: 10, cooldowns: 10, role: 0, hasPermssion: 0, usePrefix: true,
		category: "system", commandCategory: "system",
		description: "Live animated uptime dashboard GIF",
		shortDescription: { en: "Live animated uptime dashboard" },
		longDescription: { en: "Uptime, CPU, RAM, ping and system info in an animated neon dashboard GIF" },
		guide: { en: "{pn}" }
	},

	onStart: async function ({ api, event, message }) {
		const send = message ? (m => message.reply(m)) : (m => new Promise(r =>
			api.sendMessage(m, event.threadID, (e, i) => r(i || {}), event.messageID)));
		let createCanvas, GIFEncoder;
		try {
			createCanvas = need("canvas").createCanvas;
			GIFEncoder = need("gifencoder");
		} catch (e) {
			return send("❌ Module install hoyni. Terminal e chalao:\nnpm i canvas gifencoder\n\n" + e.message);
		}
		const t0 = Date.now();
		const wait = await send("⏳ Generating dashboard...").catch(() => ({}));
		const ping = Math.max(1, Date.now() - t0);
		const cpu = await cpuUsage();
		const tm = os.totalmem(), fm = os.freemem(), mu = process.memoryUsage();
		const d = {
			up: process.uptime(), host: os.uptime(), ping, cpu,
			ram: (tm - fm) / tm * 100, heap: mu.heapUsed / mu.heapTotal * 100, rss: Math.min(100, mu.rss / tm * 100),
			used: (tm - fm) / 1073741824, total: tm / 1073741824, rssMB: mu.rss / 1048576, heapMB: mu.heapUsed / 1048576,
			model: (os.cpus()[0] || {}).model || "Unknown", cores: os.cpus().length,
			plat: `${os.type()} ${os.arch()}`, node: process.version, base: Date.now()
		};
		const file = path.join(os.tmpdir(), `uptime2_${Date.now()}.gif`);
		try {
			await new Promise((res, rej) => {
				const enc = new GIFEncoder(W, H), out = fs.createWriteStream(file);
				enc.createReadStream().pipe(out);
				out.on("finish", res); out.on("error", rej);
				enc.start(); enc.setRepeat(0); enc.setDelay(250); enc.setQuality(20);
				const c = createCanvas(W, H).getContext("2d");
				for (let f = 0; f < N; f++) { frame(c, d, f); enc.addFrame(c); }
				enc.finish();
			});
			await send({ body: "", attachment: fs.createReadStream(file) });
		} catch (e) {
			console.error(e);
			await send("❌ GIF error: " + e.message);
		} finally {
			try { fs.unlinkSync(file); } catch (e) { }
			try { if (wait && wait.messageID) api.unsendMessage(wait.messageID); } catch (e) { }
		}
	}
};
module.exports.run = module.exports.onStart;

function need(m) { return require(m); } // no literal require => installer wont try auto-install
async function cpuUsage() {
	const s = () => os.cpus().reduce((a, c) => (a.i += c.times.idle, a.t += Object.values(c.times).reduce((x, y) => x + y, 0), a), { i: 0, t: 0 });
	const a = s(); await new Promise(r => setTimeout(r, 400)); const b = s();
	return b.t > a.t ? Math.min(100, Math.max(0, (1 - (b.i - a.i) / (b.t - a.t)) * 100)) : 0;
}
function fmt(s) {
	s = Math.floor(s);
	return `${Math.floor(s / 86400)}d ${Math.floor(s % 86400 / 3600)}h ${Math.floor(s % 3600 / 60)}m ${s % 60}s`;
}

/* ---------- drawing ---------- */
const R = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
const T = (c, s, x, y, z, col, al = "left", b = false) => { c.font = `${b ? "bold " : ""}${z}px sans-serif`; c.fillStyle = col; c.textAlign = al; c.fillText(String(s), x, y); };
const arc = (c, x, y, r, a, b, w, s) => { c.beginPath(); c.arc(x, y, r, a, b); c.lineWidth = w; c.strokeStyle = s; c.lineCap = "round"; c.stroke(); };
const dot = (c, x, y, r, f) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = f; c.fill(); };
const lg = (c, x0, y0, x1, y1, a, b) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
const card = (c, x, y, w, h, t) => {
	R(c, x, y, w, h, 16); c.fillStyle = "rgba(40,20,70,0.55)"; c.fill();
	c.strokeStyle = "rgba(168,85,247,0.25)"; c.lineWidth = 1; c.stroke();
	dot(c, x + 22, y + 24, 4, K.a); T(c, t, x + 34, y + 29, 14, K.t, "left", true);
};

function frame(c, d, f) {
	const p = f / N, e = 1, pu = (Math.sin(p * TAU) + 1) / 2;
	const tk = Math.floor(f / 4), upf = d.up + f / 4, upi = Math.floor(d.up) + tk; // 4 frames = 1 real second
	c.fillStyle = lg(c, 0, 0, W, H, "#0b0516", "#1d0c33"); c.fillRect(0, 0, W, H);
	const gx = 400 + Math.cos(p * TAU) * 300, g = c.createRadialGradient(gx, 40, 0, gx, 40, 260);
	g.addColorStop(0, "rgba(168,85,247,0.35)"); g.addColorStop(1, "rgba(168,85,247,0)"); c.fillStyle = g; c.fillRect(0, 0, W, H);

	// header
	R(c, 20, 16, 32, 32, 10); c.fillStyle = lg(c, 20, 16, 52, 48, K.pk, K.b); c.fill();
	T(c, "U", 36, 39, 20, K.t, "center", true); T(c, "UPTIME", 62, 40, 22, K.t, "left", true);
	["Dashboard", "System", "Memory", "Network"].forEach((n, i) => {
		const x = 250 + i * 98;
		if (!i) { R(c, x, 20, 90, 28, 14); c.fillStyle = "rgba(168,85,247,0.25)"; c.fill(); }
		T(c, n, x + 45, 39, 12, i ? K.d : K.t, "center");
	});
	dot(c, W - 170, 34, 5, `rgba(74,222,128,${f % 4 < 2 ? 1 : 0.25})`); T(c, "LIVE", W - 160, 38, 10, K.gr, "left", true);
	T(c, new Date(d.base + tk * 1000).toLocaleTimeString("en-GB"), W - 24, 39, 14, K.c, "right", true);

	// card 1: live uptime ring (ticks every real second)
	card(c, 20, 70, 250, 200, "Bot Uptime");
	const cx = 145, cy = 172, r = 52, sc = upf % 60, p2 = n => String(n).padStart(2, "0");
	c.save(); c.setLineDash([4, 8]); c.lineDashOffset = -p * 48; arc(c, cx, cy, r + 14, 0, TAU, 2, "rgba(192,132,252,0.45)"); c.restore();
	arc(c, cx, cy, r, 0, TAU, 10, "rgba(255,255,255,0.08)");
	const a1 = -1.5708 + Math.max(0.02, sc / 60) * TAU;
	c.shadowColor = K.a; c.shadowBlur = 10 + pu * 8; arc(c, cx, cy, r, -1.5708, a1, 10, lg(c, cx - r, cy - r, cx + r, cy + r, K.pk, K.b)); c.shadowBlur = 0;
	dot(c, cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, 6, K.t);
	const dd = Math.floor(upi / 86400), hh = Math.floor(upi % 86400 / 3600), mm = Math.floor(upi % 3600 / 60), ss = upi % 60;
	T(c, `${dd} DAYS`, cx, cy - 12, 10, K.d, "center", true);
	T(c, `${p2(hh)}:${p2(mm)}:${p2(ss)}`, cx, cy + 9, 17, K.t, "center", true);
	T(c, "ONLINE", cx, cy + 26, 10, K.gr, "center", true);
	[[`${d.ping}ms`, "Ping"], [d.cores, "Cores"], [d.node, "Node"]].forEach((v, i) => {
		T(c, v[0], 65 + i * 80, 243, 13, K.t, "center", true); T(c, v[1], 65 + i * 80, 258, 10, K.d, "center");
	});

	// card 2: RAM gauge
	card(c, 285, 70, 250, 200, "Resource Goals");
	const A = 2.356, S = 4.712, gx2 = 410, gy2 = 188, gr = 62;
	for (let i = 0; i <= 10; i++) {
		const a = A + S * i / 10; c.beginPath(); c.lineWidth = 1.5; c.strokeStyle = "rgba(255,255,255,0.18)";
		c.moveTo(gx2 + Math.cos(a) * (gr + 12), gy2 + Math.sin(a) * (gr + 12)); c.lineTo(gx2 + Math.cos(a) * (gr + 18), gy2 + Math.sin(a) * (gr + 18)); c.stroke();
	}
	arc(c, gx2, gy2, gr, A, A + S, 14, "rgba(255,255,255,0.07)");
	const ae = A + S * Math.max(0.02, d.ram / 100 * e);
	c.shadowColor = K.a; c.shadowBlur = 14; arc(c, gx2, gy2, gr, A, ae, 14, lg(c, 348, 0, 472, 0, K.b, K.pk)); c.shadowBlur = 0;
	for (let i = 0; i < 4; i++) dot(c, gx2 + Math.cos(A + S * (0.1 + i * 0.07) * e) * (gr - 22), gy2 + Math.sin(A + S * (0.1 + i * 0.07) * e) * (gr - 22), 4 - i * 0.6, K.c);
	dot(c, gx2 + Math.cos(ae) * gr, gy2 + Math.sin(ae) * gr, 7, K.t);
	T(c, `${Math.round(d.ram * e)}%`, gx2, gy2 + 6, 26, K.t, "center", true); T(c, "RAM USED", gx2, gy2 + 22, 10, K.d, "center");
	dot(c, 325, 252, 4, K.a); T(c, `${Math.round(d.cpu * e)}% CPU`, 336, 256, 13, K.t, "left", true);
	dot(c, 430, 252, 4, K.gd); T(c, `${d.used.toFixed(1)}/${d.total.toFixed(1)} GB`, 441, 256, 12, K.t, "left", true);

	// card 3: ping chart
	card(c, 550, 70, 230, 200, "Ping Monitor");
	const x0 = 566, y0 = 122, w0 = 198, h0 = 100, pts = [];
	c.strokeStyle = "rgba(255,255,255,0.06)"; c.lineWidth = 1;
	for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(x0, y0 + h0 * i / 4); c.lineTo(x0 + w0, y0 + h0 * i / 4); c.stroke(); }
	for (let i = 0; i < 24; i++) {
		const x = i * 0.6, v = 0.5 + (Math.sin(x * 0.9 + p * TAU) * 0.35 + Math.sin(x * 2.1 + 1 - p * TAU * 2) * 0.2 + Math.sin(x * 0.37 + p * TAU) * 0.25) * 0.5;
		pts.push([x0 + w0 * i / 23, y0 + h0 - (v * 0.8 + 0.1) * h0 * e]);
	}
	c.beginPath(); c.moveTo(x0, y0 + h0); pts.forEach(q => c.lineTo(q[0], q[1])); c.lineTo(x0 + w0, y0 + h0); c.closePath();
	c.fillStyle = lg(c, 0, y0, 0, y0 + h0, "rgba(168,85,247,0.45)", "rgba(168,85,247,0)"); c.fill();
	c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]));
	c.strokeStyle = K.pk; c.lineWidth = 2.5; c.lineJoin = "round"; c.shadowColor = K.a; c.shadowBlur = 8; c.stroke(); c.shadowBlur = 0;
	const si = Math.min(23, Math.floor(p * 23)); dot(c, pts[si][0], pts[si][1], 5, K.t);
	T(c, `${d.ping} ms`, 568, 252, 16, K.t, "left", true);
	T(c, d.ping < 150 ? "Excellent" : d.ping < 400 ? "Good" : "Slow", 762, 252, 12, d.ping < 400 ? K.gr : K.gd, "right", true);

	// card 4: memory bars
	card(c, 20, 285, 380, 145, "Memory Statistic");
	[["Heap", d.heap, K.a, d.heapMB.toFixed(0) + " MB"], ["RSS", d.rss, K.gd, d.rssMB.toFixed(0) + " MB"], ["System", d.ram, K.pk, d.used.toFixed(1) + " GB"]].forEach((r2, i) => {
		const y = 341 + i * 28, bx = 100, bw = 190, fw = Math.max(8, bw * Math.min(100, r2[1]) / 100 * e);
		T(c, r2[0], 40, y + 10, 12, K.d);
		R(c, bx, y, bw, 12, 6); c.fillStyle = "rgba(255,255,255,0.07)"; c.fill();
		R(c, bx, y, fw, 12, 6); c.fillStyle = lg(c, bx, 0, bx + fw, 0, K.b, r2[2]); c.fill();
		c.save(); R(c, bx, y, fw, 12, 6); c.clip();
		const sx = bx + (p * 1.6 % 1) * (fw + 40) - 20;
		c.fillStyle = lg(c, sx - 15, 0, sx + 15, 0, "rgba(255,255,255,0)", "rgba(255,255,255,0.45)"); c.fillRect(sx - 15, y, 30, 12); c.restore();
		T(c, `${Math.round(r2[1] * e)}%`, bx + bw + 12, y + 10, 12, K.t, "left", true); T(c, r2[3], 384, y + 10, 11, K.d, "right");
	});

	// card 5: system info
	card(c, 415, 285, 365, 145, "System Info");
	[["Platform", d.plat], ["CPU", d.model], ["Host Up", fmt(d.host + tk)]].forEach((r2, i) => {
		const y = 331 + i * 31;
		R(c, 427, y, 341, 26, 10); c.fillStyle = "rgba(255,255,255,0.05)"; c.fill();
		dot(c, 443, y + 13, 4, `rgba(168,85,247,${i ? 1 : 0.5 + 0.5 * pu})`);
		T(c, r2[0], 455, y + 17, 11, K.t, "left", true);
		c.font = "11px sans-serif"; let v = r2[1];
		while (v.length > 3 && c.measureText(v).width > 205) v = v.slice(0, -1);
		T(c, v, 756, y + 17, 11, K.d, "right");
	});
                            }
                                                          
