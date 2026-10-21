"use strict";

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

const API_BASE = "https://marix.esite.top".replace(/\/+$/, "");
const API_KEY = "mimg_098a4674f12cb96e99f71c085b4fb2a3418f42eb";
const MARIX_TOKEN = "";

const CACHE_DIR = path.join(__dirname, "cache");
const MAX_BYTES = 15 * 1024 * 1024;
const CACHE_TTL = 60 * 1000;

const USAGES =
  "mirax                      -> model list\n" +
  "mirax -m <query>           -> search models\n" +
  "mirax --<model> -t         -> that model's templates\n" +
  "mirax --<model> -p         -> that model's presets\n" +
  "mirax --<model> -c <text>  -> custom prompt\n" +
  "mirax <template>           -> reply a photo\n" +
  "mirax -c                   -> credits left";

// prefix is set per call in onStart
let currentPrefix = "!";
const prefix = () => currentPrefix;

const SMALL_CAPS = {
  a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ", i: "ɪ", j: "ᴊ",
  k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ", q: "ǫ", r: "ʀ", s: "s", t: "ᴛ",
  u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x", y: "ʏ", z: "ᴢ",
};

function B(str) {
  return String(str).replace(/[a-z]/g, (c) => SMALL_CAPS[c]);
}

const TG_LINE = `📩 ${B("Telegram")} : @miraxAi_bot`;

const FLAGS = {
  "-t": "templates", "--templates": "templates", "-templates": "templates",
  "-p": "presets", "--presets": "presets", "-l": "presets", "--list": "presets",
  "-c": "custom", "--custom": "custom",
  "-m": "models", "--models": "models",
  "-h": "help", "--help": "help",
};

const cache = new Map();

async function cached(key, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.value;
  const value = await fn();
  cache.set(key, { at: Date.now(), value });
  return value;
}

function authHeaders() {
  return API_KEY ? { "x-api-key": API_KEY } : {};
}

// ---------------------------------------------------------------- API calls

async function fetchModels() {
  return cached("models", async () => {
    const { data } = await axios.get(`${API_BASE}/generators`, { timeout: 30000 });
    if (!data || !data.success) throw new Error((data && data.error) || "could not load models");
    const list = (data.generators || []).map((g) => ({
      slug: g.slug,
      name: g.name || g.slug,
      group: g.group || "",
      widget: g.widget || "",
      custom: !!g.custom,
      multi: !!g.multi,
      templateCount: g.templateCount != null ? g.templateCount : (g.templates || []).length,
    }));
    list.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
    return list;
  });
}

async function fetchTemplates(generator) {
  return cached(`tpl:${generator || "*"}`, async () => {
    const url = generator
      ? `${API_BASE}/templates?generator=${encodeURIComponent(generator)}`
      : `${API_BASE}/templates`;
    const { data } = await axios.get(url, { timeout: 30000, headers: authHeaders() });
    if (!data || !data.success) throw new Error((data && data.error) || "could not load templates");
    return data.templates || [];
  });
}

async function fetchAxes(generator) {
  return cached(`axes:${generator}`, async () => {
    try {
      const { data } = await axios.get(
        `${API_BASE}/custom-options?generator=${encodeURIComponent(generator)}`,
        { timeout: 30000 }
      );
      const options = (data && data.options) || {};
      return Object.keys(options).filter((k) => k !== "__promptTemplate");
    } catch (e) {
      return [];
    }
  });
}

async function getQuota() {
  const { data } = await axios.get(`${API_BASE}/api/quota`, { timeout: 30000, headers: authHeaders() });
  if (!data || !data.success) throw new Error((data && data.error) || "could not load credits");
  return data.quota || null;
}

async function generate(image, { template, style, generator }) {
  const form = new FormData();
  form.append("image", image.buffer, { filename: image.filename });
  if (template) form.append("template", template);
  if (style) form.append("style", style);
  if (generator) form.append("generator", generator);
  if (MARIX_TOKEN) form.append("token", MARIX_TOKEN);

  const { data } = await axios.post(`${API_BASE}/api/myimg`, form, {
    timeout: 300000,
    maxBodyLength: MAX_BYTES * 2,
    headers: { ...form.getHeaders(), ...authHeaders() },
  });

  if (!data || !data.success) throw new Error((data && data.error) || "generation failed");
  return { ...data.result, quota: data.quota || null };
}

// ------------------------------------------------------------- model lookup

const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function findModel(models, query) {
  const q = norm(query);
  if (!q) return null;

  const scored = [];
  for (const m of models) {
    const slug = norm(m.slug);
    const name = norm(m.name);
    let score = 0;
    if (slug === q || name === q) score = 100;
    else if (slug.startsWith(q) || name.startsWith(q)) score = 80;
    else if (slug.includes(q) || name.includes(q)) score = 60;
    else if (q.includes(slug)) score = 40;
    else {
      const toks = q.split("-").filter(Boolean);
      const hit = toks.filter((t) => slug.includes(t)).length;
      if (hit) score = 20 + (hit / toks.length) * 10;
    }
    if (score) scored.push({ m, score, len: m.slug.length });
  }
  if (!scored.length) return null;
  scored.sort((a, b) => b.score - a.score || a.len - b.len || a.m.slug.localeCompare(b.m.slug));
  return scored[0].m;
}

function searchModels(models, query) {
  const toks = norm(query).split("-").filter(Boolean);
  if (!toks.length) return models;
  return models.filter((m) => {
    const hay = `${norm(m.slug)} ${norm(m.name)} ${norm(m.group)}`;
    return toks.every((t) => hay.includes(t));
  });
}

// ----------------------------------------------------------------- rendering

function modelLine(m, i) {
  const bits = [];
  if (m.templateCount > 0) bits.push(`(${m.templateCount})`);
  if (m.custom) bits.push(B("custom"));
  if (m.widget === "t2i") bits.push(B("text2img"));
  return `${i + 1}. ${m.name}${bits.length ? " " + bits.join(" · ") : ""}`;
}

function modelList(models, title) {
  return (
    `🎀 𝗠𝗶𝗿𝗮𝗫 𝗔𝗶 · ${B(title)} (${models.length})\n\n` +
    models.map(modelLine).join("\n") +
    `\n\n${B("presets")}: ${prefix()}mirax --<model> -p` +
    `\n${B("custom")}: ${prefix()}mirax --<model> -c <prompt>`
  );
}

function numbered(list) {
  return list.map((t, i) => `[${i + 1}] ${t.name}`).join("\n");
}

function templateList(model, templates, title) {
  return (
    `🖼️ ${model.name.toUpperCase()} · ${B(title)} (${templates.length})\n\n` +
    numbered(templates) +
    `\n\n${B("use")}: ${prefix()}mirax --${model.slug} -p <name>`
  );
}

function presetList(model, presets, axes) {
  const bits = [];
  if (model.custom) bits.push(B("custom"));
  if (model.multi) bits.push(B("2 photos"));
  return (
    `🎨 ${model.name.toUpperCase()} · ${B("presets")} (${presets.length})\n` +
    (bits.length ? `${bits.join(" · ")}\n` : "") +
    `\n${numbered(presets)}` +
    (axes.length ? `\n\n⚙️ ${B("custom axes")}: ${axes.join(", ")}` : "") +
    `\n\n${B("use")}: ${prefix()}mirax --${model.slug} -p <name>` +
    `\n${B("or")}: ${prefix()}mirax --${model.slug} -c <prompt>`
  );
}

function modelHelp(model) {
  const bits = [];
  if (model.custom) bits.push(B("custom prompt"));
  if (model.multi) bits.push(B("needs 2 photos"));
  if (model.widget === "t2i") bits.push(B("text2img"));
  return (
    `🎀 𝗠𝗶𝗿𝗮𝗫 𝗔𝗶 · ${model.name}\n\n` +
    `${B("presets")}: ${prefix()}mirax --${model.slug} -p\n` +
    `${B("custom")}: ${prefix()}mirax --${model.slug} -c <prompt>` +
    (model.templateCount === 0 ? `\n\n${B("this model has no presets")}` : "") +
    (bits.length ? `\n${bits.join(" · ")}` : "")
  );
}

function helpText() {
  return `🎀 𝗠𝗶𝗿𝗮𝗫 𝗔𝗶\n\n${USAGES}`;
}

function fmtDuration(sec) {
  const s = Math.max(1, Math.round(Number(sec) || 0));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m`;
  return `${s}s`;
}

function quotaLines(q, verbose = false) {
  if (!q) return verbose ? [B("No limits on this key.")] : [];
  const lines = [];

  if (q.revoked) lines.push(`🚫 ${B(`Key revoked${q.revokedReason ? ` (${q.revokedReason})` : ""}`)}`);
  if (q.daysLeft != null) lines.push(`⏳ ${B(`Key expires in ${Math.max(0, q.daysLeft)}d`)}`);
  else if (verbose) lines.push(`⏳ ${B("Key never expires")}`);

  if (q.credits) {
    const c = q.credits;
    lines.push(`🎟️ ${B(`Credits: ${c.remaining}/${c.limit} left${c.oneTime ? " (one-time)" : ""}`)}`);
    if (c.remaining <= 0) lines.push(TG_LINE);
  } else if (verbose) lines.push(`🎟️ ${B("Credits: unlimited")}`);

  if (q.daily) {
    const d = q.daily;
    lines.push(`📅 ${B(`Daily: ${d.remaining}/${d.limit} left`)}`);
    lines.push(`🔄 ${B(`Refreshes in ${fmtDuration(d.resetsInSec)}`)}`);
  } else if (verbose) lines.push(`📅 ${B("Daily: no limit")}`);

  return lines;
}

function limitMessage(err) {
  const body = err && err.response && err.response.data;
  if (!body || typeof body !== "object" || Buffer.isBuffer(body)) return null;
  const q = body.quota || null;

  if (body.code === "daily_limit" && q && q.daily) {
    const out = [
      `⏳ ${B(`Daily limit reached (${q.daily.used}/${q.daily.limit})`)}`,
      `🔄 ${B(`Refreshes in ${fmtDuration(q.daily.resetsInSec)}`)}`,
    ];
    if (q.credits) out.push(`🎟️ ${B(`Credits: ${q.credits.remaining}/${q.credits.limit} left`)}`);
    return out.join("\n");
  }
  if (body.code === "key_revoked") {
    const reason =
      q && q.credits && q.revokedReason === "credits used up"
        ? `all ${q.credits.limit} credits are used up`
        : (q && q.revokedReason) || "no longer valid";
    return `🚫 ${B(`This key has been revoked — ${reason}.`)}\n\n${TG_LINE}`;
  }
  if (body.code === "limit_reached") {
    const c = q && q.credits;
    return (
      (c ? `🎟️ ${B(`No credits left (${c.remaining}/${c.limit}).`)}` : `🎟️ ${B("No credits left.")}`) +
      `\n\n${TG_LINE}`
    );
  }
  return null;
}

// ------------------------------------------------------------ arg handling

function parseArgs(args) {
  const tokens = (args || []).map((s) => String(s)).filter(Boolean);
  const out = { model: null, mode: null, arg: null };
  let i = 0;

  if (tokens[i] && /^--/.test(tokens[i])) {
    const head = tokens[i].slice(2);
    if (head && !FLAGS[`--${head.toLowerCase()}`] && !FLAGS[`-${head.toLowerCase()}`]) {
      const parts = [head];
      i++;
      while (i < tokens.length && !FLAGS[tokens[i].toLowerCase()]) parts.push(tokens[i++]);
      out.model = parts.join("-");
    }
  }

  const rest = [];
  for (; i < tokens.length; i++) {
    const low = tokens[i].toLowerCase();
    if (!out.mode && FLAGS[low]) {
      out.mode = FLAGS[low];
      continue;
    }
    rest.push(tokens[i]);
  }
  out.arg = rest.join(" ").trim() || null;
  return out;
}

function pickAttachment(event) {
  const rep = (event.messageReply && event.messageReply.attachments) || [];
  if (rep.length && rep[0] && rep[0].url) return rep[0];
  const own = Array.isArray(event.attachments) ? event.attachments : [];
  if (own.length && own[0] && own[0].url) return own[0];
  return rep[0] || own[0] || null;
}

function getUrl(attachment) {
  if (!attachment) return null;
  const candidates = [
    attachment.url,
    attachment.largePreviewUrl,
    attachment.previewUrl,
    attachment.thumbnailUrl,
    attachment.uri,
    attachment.src,
  ];
  for (const u of candidates) {
    if (typeof u === "string" && /^https?:\/\//i.test(u)) return u;
  }
  if (attachment.payload && typeof attachment.payload.url === "string" && /^https?:\/\//i.test(attachment.payload.url)) {
    return attachment.payload.url;
  }
  return null;
}

async function resolveAttachment(api, attachment) {
  if (!attachment) return null;
  if (
    attachment.isE2EE &&
    !(attachment.url && /^https?:\/\//.test(attachment.url)) &&
    typeof api.resolveE2EEAttachment === "function"
  ) {
    try {
      attachment = await api.resolveE2EEAttachment(attachment);
    } catch (e) {}
  }
  return attachment;
}

function extFromUrl(url) {
  try {
    const raw = path.extname(new URL(url).pathname || "");
    if (raw && raw.length <= 5) return raw;
  } catch (e) {}
  return ".jpg";
}

async function download(url) {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 90000,
    maxContentLength: MAX_BYTES,
    maxBodyLength: MAX_BYTES,
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  return { buffer: Buffer.from(res.data), filename: `mirax-src${extFromUrl(url)}` };
}

function readError(err) {
  const body = err && err.response && err.response.data;
  if (body && typeof body === "object" && !Buffer.isBuffer(body)) {
    if (typeof body.error === "string") return body.error;
    if (body.detail) return typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
  }
  if (Buffer.isBuffer(body)) {
    try {
      const j = JSON.parse(body.toString());
      if (j.error) return j.error;
    } catch (e) {}
  }
  return (err && err.message) || "unknown error";
}

// ------------------------------------------------------------------- GoatBot

module.exports = {
  config: {
    name: "mirax",
    aliases: ["marix", "img"],
    version: "2.0.0",
    author: "rX",
    countDown: 15,
    role: 0,
    description: {
      en: "MiraX AI — browse models, run a preset or write your own prompt",
    },
    category: "image",
    guide: {
      en:
        "   {pn}                      -> model list\n" +
        "   {pn} -m <query>           -> search models\n" +
        "   {pn} --<model> -t         -> that model's templates\n" +
        "   {pn} --<model> -p         -> that model's presets\n" +
        "   {pn} --<model> -c <text>  -> custom prompt\n" +
        "   {pn} <template>           -> reply a photo\n" +
        "   {pn} -c                   -> credits left",
    },
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID, messageID } = event;

    try {
      const gp = global.utils && typeof global.utils.getPrefix === "function" ? global.utils.getPrefix(threadID) : null;
      currentPrefix = gp || (global.GoatBot && global.GoatBot.config && global.GoatBot.config.prefix) || "!";
    } catch (e) {}

    const reply = (m) => message.reply(m);

    const text = (args || []).join(" ").trim();
    const urlMatch = text.match(/^https?:\/\/\S+/i);
    const urlInArgs = urlMatch ? urlMatch[0] : null;

    const { model: modelQuery, mode, arg } = parseArgs(args);

    let attachment = pickAttachment(event);
    attachment = await resolveAttachment(api, attachment);
    const photoUrl = getUrl(attachment) || urlInArgs;
    const hasPhoto = !!photoUrl;

    try {
      const models = await fetchModels();

      if (mode === "help") return reply(helpText());

      if (mode === "custom" && !modelQuery && !arg) {
        const quota = await getQuota();
        return reply(`🎟️ ${B("Mirax Credits")}\n\n${quotaLines(quota, true).join("\n")}`);
      }

      if (mode === "models") {
        const found = searchModels(models, arg || "");
        if (!found.length) return reply(`🔍 ${B(`no model matches "${arg}"`)}\n\n${prefix()}mirax -m`);
        return reply(modelList(found, arg ? `models · ${arg}` : "models"));
      }

      if (!mode && !modelQuery && !arg && !hasPhoto) return reply(modelList(models, "models"));

      if (mode === "templates") {
        if (!modelQuery) {
          const templates = await fetchTemplates(null);
          return reply(
            `🖼️ ${B("all templates")} (${templates.length})\n\n${numbered(templates)}\n\n` +
              `${B("per model")}: ${prefix()}mirax --<model> -t`
          );
        }
        const model = findModel(models, modelQuery);
        if (!model) return reply(`🔍 ${B(`no model matches "${modelQuery}"`)}\n\n${prefix()}mirax -m`);
        const templates = await fetchTemplates(model.slug);
        if (!templates.length) return reply(modelHelp(model));
        return reply(templateList(model, templates, "templates"));
      }

      if (mode === "presets" || mode === "custom") {
        const model = modelQuery ? findModel(models, modelQuery) : null;
        if (!model) {
          return reply(
            `🔍 ${B("pick a model first")}\n\n${prefix()}mirax -m\n\n` +
              `${B("e.g.")} ${prefix()}mirax --${models[0].slug} -${mode === "presets" ? "p" : "c"}`
          );
        }

        if (!hasPhoto) {
          if (mode === "custom") {
            return reply(
              `✍️ ${B("custom prompt")}: ${prefix()}mirax --${model.slug} -c <prompt>\n\n${modelHelp(model)}`
            );
          }
          const presets = await fetchTemplates(model.slug);
          if (!presets.length) return reply(modelHelp(model));
          const hits = arg
            ? presets.filter(
                (t) =>
                  t.name.toLowerCase().includes(arg.toLowerCase()) ||
                  String(t.id || "").toLowerCase().includes(arg.toLowerCase())
              )
            : presets;
          if (!hits.length) {
            return reply(
              `🔍 ${B(`no preset matches "${arg}" in ${model.name}`)}\n\n${prefix()}mirax --${model.slug} -p`
            );
          }
          const axes = await fetchAxes(model.slug);
          return reply(presetList(model, hits, axes));
        }

        if (mode === "presets" && !arg) {
          return reply(
            `🎨 ${B(`pick a preset for ${model.name}`)}\n\n${prefix()}mirax --${model.slug} -p\n\n` +
              `${B("or a prompt")}: ${prefix()}mirax --${model.slug} -c <text>`
          );
        }

        return await runGeneration({
          message, api, messageID, reply,
          photoUrl,
          template: mode === "presets" ? arg : null,
          style: mode === "custom" ? arg : null,
          generator: model.slug,
          label: arg,
        });
      }

      if (modelQuery && !arg) {
        const model = findModel(models, modelQuery);
        if (!model) return reply(`🔍 ${B(`no model matches "${modelQuery}"`)}\n\n${prefix()}mirax -m`);
        const templates = await fetchTemplates(model.slug);
        if (!templates.length) return reply(modelHelp(model));
        return reply(templateList(model, templates, "templates"));
      }

      if (arg) {
        if (hasPhoto) {
          return await runGeneration({
            message, api, messageID, reply,
            photoUrl, template: arg, style: null, generator: null, label: arg,
          });
        }
        const all = await fetchTemplates(null);
        const q = arg.toLowerCase();
        const hits = all.filter(
          (t) => t.name.toLowerCase().includes(q) || String(t.id || "").toLowerCase().includes(q)
        );
        if (!hits.length) return reply(`🔍 ${B(`no template matches "${arg}"`)}\n\n${prefix()}mirax -t`);
        return reply(
          `🖼️ ${B("templates matching")} "${arg}" (${hits.length})\n\n${numbered(hits)}\n\n` +
            `${B("reply a photo with")}: ${prefix()}mirax <template>`
        );
      }

      return reply(helpText());
    } catch (err) {
      return reply(limitMessage(err) || `❌ ${readError(err)}`).catch(() => {});
    }
  },
};

async function setReact(message, emoji, messageID) {
  try {
    await message.reaction(emoji, messageID);
  } catch (e) {}
}

async function runGeneration({ message, messageID, reply, photoUrl, template, style, generator, label }) {
  if (!photoUrl) {
    return reply(
      `📷 ${B("reply to a photo (or attach one / pass an image URL)")}\n\n` +
        `${B("usage")}: ${prefix()}mirax ${generator ? `--${generator} ` : ""}${style ? `-c ${label}` : label}`
    );
  }

  await setReact(message, "⏳", messageID);

  let tmpFile = null;
  let stream = null;
  try {
    const image = await download(photoUrl);
    if (!image.buffer.length) throw new Error("the photo is empty");
    if (image.buffer.length > MAX_BYTES) throw new Error(`photo is too large (${image.buffer.length} bytes)`);

    const result = await generate(image, { template, style, generator });
    if (!result || !result.resultUrl) throw new Error("no image returned by API");

    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    tmpFile = path.join(CACHE_DIR, `mirax-${result.actionId || Date.now()}${extFromUrl(result.resultUrl)}`);

    const imgRes = await axios.get(result.resultUrl, { responseType: "arraybuffer", timeout: 90000 });
    fs.writeFileSync(tmpFile, Buffer.from(imgRes.data));

    stream = fs.createReadStream(tmpFile);
    stream.on("error", () => {});

    const title = result.template || (style ? B("custom prompt") : label);
    const shownModel = generator || result.generator;

    await message.reply({
      body:
        `✅ ${title}\n` +
        (result.templateId ? `🖼️ ${B("template")}: ${result.templateId}\n` : "") +
        (shownModel ? `🧩 ${B("model")}: ${shownModel}\n` : "") +
        `⏱️ ${result.costTime != null ? result.costTime + "s" : "—"} · ` +
        `${result.consumedCredits != null ? result.consumedCredits + " credits" : "—"}`,
      attachment: stream,
    });

    await setReact(message, "✅", messageID);
  } catch (err) {
    await reply(limitMessage(err) || `❌ ${B("failed")}: ${readError(err)}`).catch(() => {});
    await setReact(message, "❌", messageID);
  } finally {
    if (stream) stream.destroy();
    if (tmpFile) setTimeout(() => fs.unlink(tmpFile, () => {}), 5000);
  }
}
