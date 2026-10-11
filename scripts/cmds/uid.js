/**
 * uid.js — Animated GIF UID card (canvas) for GoatBot V2
 * Author: Zihad
 *
 * No API key needed.
 * Needs (usually already in GoatBot): axios, fs-extra, moment-timezone, canvas
 * Needs for GIF:  npm i gif-encoder-2   (or gifencoder)
 */

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

let Canvas = null;
try { Canvas = require("canvas"); }
catch (e) {
	try { Canvas = require("@napi-rs/canvas"); }
	catch (e2) { Canvas = null; }
}

// cache finished GIFs for a few minutes → repeat requests are instant
const GIF_CACHE = new Map();
const CACHE_MS = 5 * 60 * 1000;

const W = 720;
const H = 360;
const FRAMES = 20;
const DELAY = 90;
const TAU = Math.PI * 2;

/* ------------------------------ helpers ------------------------------ */

function makeEncoder(w, h) {
	try {
		const GIFEncoder = require("gif-encoder-2");
		return new GIFEncoder(w, h, "neuquant", false);
	}
	catch (e) { /* try next */ }
	try {
		const GIFEncoder = require("gifencoder");
		return new GIFEncoder(w, h);
	}
	catch (e) { /* none */ }
	return null;
}

function rr(ctx, x, y, w, h, r) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.quadraticCurveTo(x + w, y, x + w, y + r);
	ctx.lineTo(x + w, y + h - r);
	ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
	ctx.lineTo(x + r, y + h);
	ctx.quadraticCurveTo(x, y + h, x, y + h - r);
	ctx.lineTo(x, y + r);
	ctx.quadraticCurveTo(x, y, x + r, y);
	ctx.closePath();
}

function glow(ctx, x, y, r, rgb, a) {
	const g = ctx.createRadialGradient(x, y, 0, x, y, r);
	g.addColorStop(0, `rgba(${rgb},${a})`);
	g.addColorStop(1, `rgba(${rgb},0)`);
	ctx.fillStyle = g;
	ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function fit(ctx, text, maxW) {
	text = String(text);
	if (ctx.measureText(text).width <= maxW) return text;
	while (text.length > 1 && ctx.measureText(text + "…").width > maxW)
		text = text.slice(0, -1);
	return text + "…";
}

function mulberry32(a) {
	return function () {
		a |= 0; a = a + 0x6D2B79F5 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}

// matrix-rain columns (fixed, so every frame is consistent)
const rand = mulberry32(777001);
const COL_STEP = 22;
const RAIN = Array.from({ length: Math.ceil(W / COL_STEP) }, (_, i) => ({
	x: i * COL_STEP + 4,
	y0: rand() * H,
	k: 1 + Math.floor(rand() * 2),   // integer speed → seamless loop
	len: 6 + Math.floor(rand() * 8),
	seed: Math.floor(rand() * 1000)
}));

function digitAt(seed, row, frame) {
	const v = Math.abs(Math.sin(seed * 12.9898 + row * 78.233 + frame * 3.7) * 43758.5453);
	return String(Math.floor((v % 1) * 10));
}

/* ------------------------------ drawing ------------------------------ */

function drawFrame(ctx, t, frame, d) {
	/* ---- background ---- */
	const bg = ctx.createLinearGradient(0, 0, W, H);
	bg.addColorStop(0, "#03110f");
	bg.addColorStop(0.5, "#06201d");
	bg.addColorStop(1, "#0a0f2a");
	ctx.fillStyle = bg;
	ctx.fillRect(0, 0, W, H);

	glow(ctx, W * 0.2 + Math.cos(t * TAU) * 30, H * 0.5 + Math.sin(t * TAU) * 25, 230, "16,185,129", 0.30);
	glow(ctx, W * 0.85 + Math.sin(t * TAU) * 40, H * 0.15, 220, "56,189,248", 0.20);
	glow(ctx, W * 0.6, H + Math.sin(t * TAU) * 20, 200, "168,85,247", 0.18);

	/* ---- matrix rain ---- */
	ctx.font = "13px monospace";
	ctx.textAlign = "left";
	const step = 16;
	for (const c of RAIN) {
		const total = H + c.len * step;
		const head = (((c.y0 + t * total * c.k) % total) + total) % total;
		for (let j = 0; j < c.len; j++) {
			const y = head - j * step;
			if (y < -step || y > H + step) continue;
			const a = (j === 0 ? 0.55 : 0.28 * (1 - j / c.len));
			ctx.fillStyle = j === 0
				? `rgba(167,243,208,${a.toFixed(3)})`
				: `rgba(16,185,129,${a.toFixed(3)})`;
			ctx.fillText(digitAt(c.seed, Math.floor(y / step) + 50, frame), c.x, y);
		}
	}

	/* ---- scanner line ---- */
	const sy = t * H;
	const sg = ctx.createLinearGradient(0, sy - 44, 0, sy + 2);
	sg.addColorStop(0, "rgba(52,211,153,0)");
	sg.addColorStop(1, "rgba(52,211,153,0.13)");
	ctx.fillStyle = sg;
	ctx.fillRect(0, sy - 44, W, 46);

	/* ---- avatar ---- */
	const cx = 140, cy = 180, R = 66;

	for (let i = 0; i < 40; i++) {
		const ang = (i / 40) * TAU;
		const sweep = 1 - (((i / 40 - t) % 1) + 1) % 1;
		const a = 0.12 + 0.75 * Math.pow(sweep, 3);
		ctx.strokeStyle = `rgba(52,211,153,${a.toFixed(3)})`;
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(cx + Math.cos(ang) * (R + 36), cy + Math.sin(ang) * (R + 36));
		ctx.lineTo(cx + Math.cos(ang) * (R + 43), cy + Math.sin(ang) * (R + 43));
		ctx.stroke();
	}

	ctx.save();
	ctx.translate(cx, cy);
	ctx.rotate(t * TAU);
	ctx.setLineDash([12, 9]);
	ctx.strokeStyle = "rgba(56,189,248,0.7)";
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.arc(0, 0, R + 24, 0, TAU);
	ctx.stroke();
	ctx.restore();
	ctx.setLineDash([]);

	ctx.save();
	ctx.translate(cx, cy);
	ctx.rotate(-t * TAU * 2);
	const arcCols = ["#34d399", "#38bdf8", "#a78bfa"];
	for (let i = 0; i < 3; i++) {
		ctx.strokeStyle = arcCols[i];
		ctx.shadowColor = arcCols[i];
		ctx.shadowBlur = 14;
		ctx.lineWidth = 4;
		ctx.lineCap = "round";
		ctx.beginPath();
		ctx.arc(0, 0, R + 13, i * (TAU / 3), i * (TAU / 3) + 1.05);
		ctx.stroke();
	}
	ctx.restore();
	ctx.shadowBlur = 0;
	ctx.lineCap = "butt";

	const ring = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
	ring.addColorStop(0, "#10b981");
	ring.addColorStop(0.5, "#38bdf8");
	ring.addColorStop(1, "#a78bfa");
	ctx.save();
	ctx.shadowColor = "#10b981";
	ctx.shadowBlur = 14 + 10 * Math.sin(t * TAU);
	ctx.strokeStyle = ring;
	ctx.lineWidth = 5;
	ctx.beginPath();
	ctx.arc(cx, cy, R + 4, 0, TAU);
	ctx.stroke();
	ctx.restore();
	ctx.shadowBlur = 0;

	ctx.save();
	ctx.beginPath();
	ctx.arc(cx, cy, R, 0, TAU);
	ctx.clip();
	if (d.avatar) {
		const s = R * 2 * (1 + 0.025 * Math.sin(t * TAU));
		ctx.drawImage(d.avatar, cx - s / 2, cy - s / 2, s, s);
	}
	else {
		const ph = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
		ph.addColorStop(0, "#065f46");
		ph.addColorStop(1, "#0e7490");
		ctx.fillStyle = ph;
		ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
		ctx.fillStyle = "#fff";
		ctx.font = "bold 60px sans-serif";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(String(d.name || "?").trim().charAt(0).toUpperCase(), cx, cy + 3);
		ctx.textBaseline = "alphabetic";
	}
	const shx = cx - R - 50 + t * (R * 2 + 100);
	const sh = ctx.createLinearGradient(shx - 26, 0, shx + 26, 0);
	sh.addColorStop(0, "rgba(255,255,255,0)");
	sh.addColorStop(0.5, "rgba(255,255,255,0.18)");
	sh.addColorStop(1, "rgba(255,255,255,0)");
	ctx.fillStyle = sh;
	ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
	ctx.restore();

	/* ---- main panel ---- */
	const px = 262, py = 34, pw = 424, ph2 = 292;

	rr(ctx, px, py, pw, ph2, 22);
	ctx.fillStyle = "rgba(255,255,255,0.055)";
	ctx.fill();
	ctx.lineWidth = 1.5;
	ctx.strokeStyle = "rgba(255,255,255,0.13)";
	ctx.stroke();

	const bx = px + (t * 2 - 1) * pw;
	const bg2 = ctx.createLinearGradient(bx, 0, bx + pw, 0);
	bg2.addColorStop(0, "rgba(52,211,153,0)");
	bg2.addColorStop(0.35, "rgba(52,211,153,0.95)");
	bg2.addColorStop(0.65, "rgba(56,189,248,0.95)");
	bg2.addColorStop(1, "rgba(167,139,250,0)");
	ctx.save();
	ctx.shadowColor = "#34d399";
	ctx.shadowBlur = 10;
	rr(ctx, px, py, pw, ph2, 22);
	ctx.strokeStyle = bg2;
	ctx.lineWidth = 2.5;
	ctx.stroke();
	ctx.restore();
	ctx.shadowBlur = 0;

	// title
	ctx.textAlign = "left";
	rr(ctx, px + 22, py + 22, 5, 34, 3);
	const tb = ctx.createLinearGradient(0, py + 22, 0, py + 56);
	tb.addColorStop(0, "#34d399");
	tb.addColorStop(1, "#38bdf8");
	ctx.fillStyle = tb;
	ctx.fill();
	ctx.font = "bold 20px sans-serif";
	ctx.fillStyle = "#ffffff";
	ctx.fillText("USER ID", px + 38, py + 40);
	ctx.font = "11px sans-serif";
	ctx.fillStyle = "#6ee7b7";
	ctx.fillText("FACEBOOK IDENTIFIER  •  LIVE SCAN", px + 38, py + 55);

	/* ---- big UID with travelling wave ---- */
	const uid = String(d.uid);
	const maxW = pw - 48;
	let fs0 = 40;
	ctx.font = `bold ${fs0}px monospace`;
	let tw = ctx.measureText(uid).width;
	if (tw > maxW) {
		fs0 = Math.floor(fs0 * maxW / tw);
		ctx.font = `bold ${fs0}px monospace`;
		tw = ctx.measureText(uid).width;
	}
	const chW = tw / uid.length;
	const ux0 = px + (pw - tw) / 2;
	const uBase = py + 124;

	rr(ctx, px + 20, py + 72, pw - 40, 72, 14);
	ctx.fillStyle = "rgba(0,0,0,0.30)";
	ctx.fill();
	ctx.strokeStyle = "rgba(52,211,153,0.35)";
	ctx.lineWidth = 1.2;
	ctx.stroke();

	ctx.textAlign = "left";
	for (let i = 0; i < uid.length; i++) {
		const sweep = 1 - (((i / uid.length - t) % 1) + 1) % 1;
		const k = Math.pow(sweep, 4);
		const yOff = Math.sin(t * TAU + i * 0.55) * 3;
		ctx.save();
		ctx.shadowColor = "#34d399";
		ctx.shadowBlur = 4 + 18 * k;
		const r = Math.round(150 + 105 * k);
		ctx.fillStyle = `rgb(${r},${Math.round(235 + 20 * k)},${Math.round(215 + 40 * k)})`;
		ctx.fillText(uid.charAt(i), ux0 + i * chW, uBase + yOff);
		ctx.restore();
	}
	ctx.shadowBlur = 0;

	// shimmering divider
	const dx = px + 22, dw = pw - 44, dy = py + 160;
	ctx.fillStyle = "rgba(255,255,255,0.1)";
	ctx.fillRect(dx, dy, dw, 2);
	const sx = dx + t * (dw + 120) - 120;
	const dg = ctx.createLinearGradient(sx, 0, sx + 120, 0);
	dg.addColorStop(0, "rgba(56,189,248,0)");
	dg.addColorStop(0.5, "rgba(56,189,248,1)");
	dg.addColorStop(1, "rgba(56,189,248,0)");
	ctx.save();
	ctx.beginPath();
	ctx.rect(dx, dy - 2, dw, 6);
	ctx.clip();
	ctx.fillStyle = dg;
	ctx.fillRect(sx, dy - 1, 120, 4);
	ctx.restore();

	/* ---- info rows ---- */
	const rows = [
		{ label: "NAME", value: d.name, col: "#34d399" },
		{ label: "PROFILE", value: d.profile, col: "#38bdf8" },
		{ label: "CHECKED", value: d.time, col: "#a78bfa" }
	];
	const rowH = 38, rowY0 = py + 176;
	const phase = t * rows.length;
	const active = Math.floor(phase) % rows.length;
	const frac = phase - Math.floor(phase);

	rows.forEach((r, i) => {
		const y = rowY0 + i * rowH;
		rr(ctx, px + 16, y, pw - 32, rowH - 6, 10);
		ctx.fillStyle = "rgba(255,255,255,0.045)";
		ctx.fill();

		if (i === active) {
			rr(ctx, px + 16, y, pw - 32, rowH - 6, 10);
			ctx.fillStyle = `rgba(16,185,129,${(0.26 * (1 - frac)).toFixed(3)})`;
			ctx.fill();
			ctx.strokeStyle = `rgba(52,211,153,${(0.8 * (1 - frac)).toFixed(3)})`;
			ctx.lineWidth = 1.5;
			ctx.stroke();
		}

		ctx.save();
		ctx.shadowColor = r.col;
		ctx.shadowBlur = i === active ? 12 * (1 - frac) + 4 : 4;
		ctx.fillStyle = r.col;
		ctx.beginPath();
		ctx.arc(px + 34, y + (rowH - 6) / 2, 5, 0, TAU);
		ctx.fill();
		ctx.restore();
		ctx.shadowBlur = 0;

		ctx.textAlign = "left";
		ctx.font = "bold 11px sans-serif";
		ctx.fillStyle = "rgba(167,243,208,0.85)";
		ctx.fillText(r.label, px + 48, y + 21);

		ctx.font = "bold 14px sans-serif";
		ctx.fillStyle = "#ffffff";
		ctx.fillText(fit(ctx, r.value, pw - 32 - 104 - 14), px + 130, y + 21);
	});

	/* ---- HUD corners ---- */
	const ca = 0.45 + 0.35 * Math.sin(t * TAU);
	ctx.strokeStyle = `rgba(52,211,153,${ca.toFixed(3)})`;
	ctx.lineWidth = 3;
	const L = 20, m = 9;
	ctx.beginPath();
	ctx.moveTo(m, m + L); ctx.lineTo(m, m); ctx.lineTo(m + L, m);
	ctx.moveTo(W - m - L, m); ctx.lineTo(W - m, m); ctx.lineTo(W - m, m + L);
	ctx.moveTo(m, H - m - L); ctx.lineTo(m, H - m); ctx.lineTo(m + L, H - m);
	ctx.moveTo(W - m - L, H - m); ctx.lineTo(W - m, H - m); ctx.lineTo(W - m, H - m - L);
	ctx.stroke();

	/* ---- name under avatar + footer ---- */
	ctx.textAlign = "center";
	ctx.font = "bold 18px sans-serif";
	ctx.save();
	ctx.shadowColor = "rgba(16,185,129,0.9)";
	ctx.shadowBlur = 10;
	ctx.fillStyle = "#ffffff";
	ctx.fillText(fit(ctx, d.name, 220), cx, cy + R + 64);
	ctx.restore();

	ctx.font = "11px sans-serif";
	ctx.fillStyle = "rgba(167,243,208,0.7)";
	ctx.fillText("GOATBOT  •  UID CARD", W / 2, H - 8);
	ctx.textAlign = "left";
}

/* ------------------------------ GIF maker ------------------------------ */

async function buildGif(data, avatarBuffer) {
	if (!Canvas) throw new Error("NO_CANVAS");
	const encoder = makeEncoder(W, H);
	if (!encoder) throw new Error("NO_ENCODER");

	const { createCanvas, loadImage } = Canvas;
	const canvas = createCanvas(W, H);
	const ctx = canvas.getContext("2d");

	let avatar = null;
	if (avatarBuffer) {
		try { avatar = await loadImage(avatarBuffer); }
		catch (e) { avatar = null; }
	}
	data.avatar = avatar;

	encoder.start();
	encoder.setRepeat(0);
	encoder.setDelay(DELAY);
	encoder.setQuality(30);

	for (let i = 0; i < FRAMES; i++) {
		drawFrame(ctx, i / FRAMES, i, data);
		encoder.addFrame(ctx);
		await new Promise(r => setImmediate(r));
	}
	encoder.finish();
	return encoder.out.getData();
}

/* ------------------------------ command ------------------------------ */

module.exports = {
	config: {
		name: "uid",
		aliases: ["id", "getuid"],
		version: "1.2",
		author: "Zihad",
		countDown: 8,
		role: 0,
		description: {
			en: "Animated GIF card showing a user's Facebook UID"
		},
		category: "info",
		guide: {
			en: "{pn} → your UID"
				+ "\n{pn} @tag → tagged user's UID"
				+ "\n{pn} <profile link> → UID from a Facebook profile link"
				+ "\n(reply to a message) {pn} → replied user's UID"
		}
	},

	langs: {
		en: {
			notFound: "❌ Could not find a UID for that link/user.",
			error: "❌ Something went wrong while getting the UID.",
			unknown: "Unknown"
		}
	},

	onStart: async function ({ api, event, args, message, usersData, getLang }) {
		let tmpFile = null;
		try {
			// target uid: reply > mention > profile link / uid arg > sender
			let uid;
			if (event.type === "message_reply") {
				uid = event.messageReply.senderID;
			}
			else if (Object.keys(event.mentions || {}).length > 0) {
				uid = Object.keys(event.mentions)[0];
			}
			else if (args[0] && /^\d{5,}$/.test(args[0])) {
				uid = args[0];
			}
			else if (args[0] && /facebook\.com|fb\.com|fb\.me/i.test(args[0])) {
				try {
					uid = await global.utils.findUid(args[0]);
				}
				catch (e) {
					uid = null;
				}
				if (!uid) return message.reply(getLang("notFound"));
			}
			else {
				uid = event.senderID;
			}
			uid = String(uid);

			// instant feedback: reaction shows right away while the card is prepared
			api.setMessageReaction("⏳", event.messageID, () => { }, true);

			const hit = GIF_CACHE.get(uid);
			if (hit && Date.now() - hit.at < CACHE_MS) {
				const dir0 = path.join(__dirname, "cache");
				fs.ensureDirSync(dir0);
				tmpFile = path.join(dir0, `uid_${uid}_${Date.now()}.gif`);
				fs.writeFileSync(tmpFile, hit.gif);
				api.setMessageReaction("✅", event.messageID, () => { }, true);
				return message.reply({
					body: hit.caption,
					attachment: fs.createReadStream(tmpFile)
				}, () => { try { fs.unlinkSync(tmpFile); } catch (e) { } });
			}

			// fetch name + avatar at the same time (parallel = faster)
			const getName = async () => {
				let n = null;
				try {
					const ui = await api.getUserInfo(uid);
					n = ui && ui[uid] && ui[uid].name;
				}
				catch (e) { /* ignore */ }
				if (!n) {
					try { n = await usersData.getName(uid); }
					catch (e) { /* ignore */ }
				}
				return n;
			};
			const getAvatar = async () => {
				try {
					const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
					const res = await axios.get(url, { responseType: "arraybuffer", timeout: 10000 });
					return Buffer.from(res.data);
				}
				catch (e) { return null; }
			};
			const [fetchedName, avatarBuffer] = await Promise.all([getName(), getAvatar()]);
			const name = fetchedName || getLang("unknown");

			const data = {
				name,
				uid,
				profile: `facebook.com/profile.php?id=${uid}`,
				time: moment.tz("Asia/Dhaka").format("DD/MM/YYYY hh:mm A")
			};

			// one message: UID + name + GIF card (no profile link line)
			const caption = `🆔 UID: ${uid}\n👤 ${name}`;

			try {
				const gif = await buildGif(data, avatarBuffer);
				GIF_CACHE.set(uid, { gif, caption, at: Date.now() });
				if (GIF_CACHE.size > 30) GIF_CACHE.delete(GIF_CACHE.keys().next().value);
				const dir = path.join(__dirname, "cache");
				fs.ensureDirSync(dir);
				tmpFile = path.join(dir, `uid_${uid}_${Date.now()}.gif`);
				fs.writeFileSync(tmpFile, gif);

				api.setMessageReaction("✅", event.messageID, () => { }, true);
				return message.reply({
					body: caption,
					attachment: fs.createReadStream(tmpFile)
				}, () => { try { fs.unlinkSync(tmpFile); } catch (e) { } });
			}
			catch (e) {
				console.error("[uid] gif error:", e && e.message ? e.message : e);
				api.setMessageReaction("✅", event.messageID, () => { }, true);
				return message.reply(
					caption
					+ (e && (e.message === "NO_ENCODER" || e.message === "NO_CANVAS")
						? "\n\n⚠️ GIF card needs: npm i canvas gif-encoder-2"
						: "")
				);
			}
		}
		catch (err) {
			console.error("[uid]", err);
			try { api.setMessageReaction("❌", event.messageID, () => { }, true); } catch (e) { }
			if (tmpFile) { try { fs.unlinkSync(tmpFile); } catch (e) { } }
			return message.reply(getLang("error"));
		}
	}
};
