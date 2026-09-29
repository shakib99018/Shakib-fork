<img src="https://i.ibb.co/RQ28H2p/banner.png" alt="banner">
<h1 align="center"><img src="./dashboard/images/logo-non-bg.png" width="22px"> Goat Bot V2 — Enhanced Edition</h1>

<p align="center">
	<em>A feature-rich Facebook Messenger bot framework with a web dashboard, built on an unofficial Messenger API.</em>
</p>

<p align="center">
	<a href="https://nodejs.org/dist/v22.0.0">
		<img src="https://img.shields.io/badge/Node.js-22.x-brightgreen.svg?style=flat-square" alt="Node.js 22.x">
	</a>
	<img alt="code-version" src="https://img.shields.io/badge/dynamic/json?color=brightgreen&label=version&prefix=v&query=%24.version&url=https%3A%2F%2Fraw.githubusercontent.com%2Fntkhang03%2FGoat-Bot-V2%2Fmain%2Fpackage.json&style=flat-square">
	<img alt="license" src="https://img.shields.io/badge/license-MIT-green?style=flat-square">
	<img alt="platform" src="https://img.shields.io/badge/platform-Node.js%20%7C%20Docker-informational?style=flat-square">
</p>

<p align="center">
	<sub>
		Maintained fork of <a href="https://github.com/ntkhang03/Goat-Bot-V2">Goat-Bot-V2</a> by <b>NTKhang</b>.<br>
		<b>Modified and enhanced by <a href="https://github.com/lazyneoaz">Neoaz</a> (<a href="https://github.com/lazyneoaz">@lazyneoaz</a>) 🐊</b>
	</sub>
</p>

---

## 📖 **Overview**

**Goat Bot V2 — Enhanced Edition** is a self-hosted Messenger chat-bot framework. It connects through an unofficial Messenger API, exposes a full command/event system, and ships with a MongoDB/SQLite-backed dashboard for managing threads, users and runtime configuration.

This fork focuses on **production readiness**: a modern dependency stack, a hardened login flow, safer database handling, and a set of new quality-of-life features.

> **Table of contents**
> - [✨ Enhanced features in this fork](#-enhanced-features-in-this-fork)
> - [🚧 Requirements](#-requirements)
> - [📦 Installation](#-installation)
> - [⚙️ Configuration](#️-configuration)
> - [🚀 Running the bot](#-running-the-bot)
> - [💡 How it works](#-how-it-works)
> - [🛠️ Creating new commands](#️-creating-new-commands)
> - [🌐 Supported languages](#-supported-languages)
> - [📌 Common problems](#-common-problems)
> - [❌ Do not use unofficial copies](#-do-not-use-unofficial-copies)
> - [📸 Screenshots](#-screenshots)
> - [👥 Credits](#-credits)
> - [📜 License](#-license)

---

## ✨ **Enhanced features in this fork**

### New bot behaviours
- **Powered by `xtreme-fca`** — the API layer is [`xtreme-fca`](https://www.npmjs.com/package/xtreme-fca) by [@lazyneoaz](https://github.com/lazyneoaz), a hardened fork of the unofficial Messenger API with built-in auto-reconnect and MQTT recovery.
- **Music search** — looks up a song by title or artist through the Messenger music catalog and sends the track into the chat, using `searchMusic` from the API layer.
- **Reaction unsend** — react with a configured emoji (default 😡 / 😠) to delete the bot's own message. Admin-gated by default.
- **Reaction mirror** — the bot mirrors any (or a configured set of) emoji that an admin reacts to on another user's message.
- **Command suggestions** — a typo such as `-holp` returns *“Did you mean `-help`?”* using transposition-aware fuzzy matching.
- **NoPrefix mode** — optionally let commands run without the prefix (`help` == `-help`), with an ignore list and admin-only mode.
- **User-agent pool** — 11 user agents shipped in config; `randomUserAgent` picks one per login to reduce detection.

### Modernised foundation
- Uses the [`xtreme-fca`](https://www.npmjs.com/package/xtreme-fca) API layer ([source](https://github.com/lazyneoaz/xtreme-fca)).
- Updated dependencies to current stable releases; removed unused packages.
- Uses the native [`canvas`](https://www.npmjs.com/package/canvas) package (v3) for image rendering.
- Hardened the login flow: non-fatal cookie liveness pre-check, optional Google credentials, and `.dev.*` files used only when `NODE_ENV=development`.
- Reliable SQLite path override via `GOAT_DB_PATH`, with busy-timeout to avoid lock errors on network filesystems.
- `npm start` / `npm run dev` / `npm run prod` scripts and a `postinstall` rebuild for native modules.

---

## 🚧 **Requirements**

- **Node.js** 22.x ([download](https://nodejs.org/en/download/releases/))
- **Git**
- Optional: **MongoDB** (otherwise the bot uses SQLite)
- Basic familiarity with JavaScript / Node.js and the [unofficial Messenger API](https://github.com/ntkhang03/fb-chat-api/blob/master/DOCS.md)

---

## 📦 **Installation**

```bash
# 1. Clone the repository
git clone https://github.com/lazyneoaz/Goat-Bot-V2.git
cd Goat-Bot-V2

# 2. Install dependencies
npm install

# 3. Start the bot
npm start
```

On first run the bot prompts for an account. You can supply one of the following in `account.txt`:
- a cookie string / Netscape cookie file,
- a JSON app-state / cookie array,
- an `EAAAA…` access token,
- or an `email`, `password` pair (in `config.json`) for password login.

A step-by-step guide is available in [`STEP_INSTALL.md`](./STEP_INSTALL.md).

---

## ⚙️ **Configuration**

All settings live in **`config.json`** at the project root. Commonly edited keys:

| Key | Purpose |
| --- | --- |
| `prefix` | Command prefix (default `-`). |
| `language` | Bot language (`en` or `vi`). |
| `nickNameBot` | Display name used in some replies. |
| `adminBot` | Array of bot-admin user IDs (`role 2`). |
| `dashBoard` | Enable/disable the web dashboard, set its port, and (optionally) `sessionSecret`. |
| `dashBoard.sessionSecret` | Optional fixed secret for dashboard login sessions. Set a long random string to keep logins valid across restarts; leave empty to auto-generate per start. |
| `serverUptime.socket.verifyToken` | Password clients send to connect to the socket.io uptime server. Set a long random string; when empty a temporary token is generated at startup. |
| `commandSuggestion` | `{ enable: true }` — suggest the closest command on typos. |
| `noPrefix` | `{ enable, onlyAdminBot, ignoreCommands }` — prefix-free commands. |
| `reactUnsend` | `{ enable, emojis, onlyAdmin }` — delete bot messages via reaction. |
| `reactMirror` | `{ enable, mirrorAllEmojis, emojis, onlyAdmin }` — mirror reactions. |
| `facebookAccount.userAgents` | Pool of user agents. |
| `optionsFca.randomUserAgent` | Pick a random user agent per login. |
| `optionsFca.autoReconnect` | Reconnect MQTT automatically when the connection drops. Keep `true`. |

New keys are merged with safe defaults on startup, so upgrading an old `config.json` will not break the bot.

---

## 🚀 **Running the bot**

```bash
npm start          # production-style run
npm run dev        # development run (uses .dev.* files)
npm run prod       # explicit production run
```

Environment variables:

| Variable | Effect |
| --- | --- |
| `NODE_ENV` | `development` enables the `.dev.*` config files. |
| `GOAT_DB_PATH` | Overrides the SQLite database path (useful on network filesystems). |

When `dashBoard.enable` is `true`, the web dashboard is served on the configured port (default `3001`).

Dashboard login sessions are stored on disk under `database/data/sessions/` (a lightweight file-backed store), so the process no longer uses the in-memory session store that leaks memory and logs a production warning. Session files respect the 7-day cookie lifetime and are cleaned up automatically.

---

## 💡 **How it works**

The bot uses the unofficial Messenger API to send and receive messages. On every new event (message, reaction, join/leave, admin change, …) an event is dispatched to `handlerEvents`, which resolves the command and runs it.

- **`onStart`** — a user invoked a command:
  - check whether a command was actually called (prefix or no-prefix mode),
  - check bans / admin-only mode,
  - check the user's permission role,
  - check the command cooldown,
  - execute and log.

- **`onChat`** — runs on any message; executes a returned `function`/`async function` after the same ban/permission checks.

- **`onFirstChat`** — runs the first time a thread is seen since startup, otherwise behaves like `onChat`.

- **`onReaction`** — runs when a user reacts to a message registered in `GoatBot.onReaction`:
	```javascript
	global.GoatBot.onReaction.set(msg.messageID, {
		messageID: msg.messageID,
		commandName,
		// ...
	});
	```
  A `delete` method is added automatically to remove the entry.

- **`onReply`** — runs when a user replies to a message registered in `GoatBot.onReply` (same pattern as `onReaction`).

- **`onEvent`** — runs for system events (join, leave, admin change, …) registered in `GoatBot.onEvent`.

- **`handlerEvent`** — runs event commands placed in `scripts/events/`, looping over every registered `eventCommands` entry.

---

## 🛠️ **Creating new commands**

Commands live in `scripts/cmds/` and are loaded automatically. A minimal command:

```javascript
module.exports = {
	config: {
		name: "hello",
		version: "1.0",
		author: "Your Name",
		countDown: 5,
		role: 0,
		description: { en: "say hello" },
		category: "fun",
		guide: { en: "{pn} <name>" }
	},
	langs: {
		en: { reply: "Hello, %1!" }
	},
	onStart: async function ({ args, message, getLang }) {
		return message.reply(getLang("reply", args[0] || "world"));
	}
};
```

- `category` is required; `author` should be kept accurate.
- Use `role: 0` (everyone), `1` (group admins) or `2` (bot admins).
- Add localised strings under `langs`.
- Full reference: [`DOCS.md`](./DOCS.md).

---

## 🌐 **Supported languages**

- [x] `en` — English
- [x] `vi` — Vietnamese

Set the language in `config.json`, and customise strings under `languages/`, `languages/cmds/` and `languages/events/`.

---

## 📌 **Common problems**

<details>
	<summary>📌 Error 400: redirect_uri_mismatch</summary>
	<p><img src="https://i.ibb.co/6Fbjd4r/image.png" width="250px"></p>
	<p>1. Enable the Google Drive API: <a href="https://youtu.be/nTIT8OQeRnY?t=347">Tutorial</a></p>
	<p>2. Add <a href="https://developers.google.com/oauthplayground">https://developers.google.com/oauthplayground</a> (no trailing slash) to <b>Authorized redirect URIs</b> in the <b>OAuth consent screen</b>: <a href="https://youtu.be/nTIT8OQeRnY?t=491">Tutorial</a></p>
	<p>3. Choose <b>https://www.googleapis.com/auth/drive</b> and <b>https://mail.google.com/</b> in the <b>OAuth 2.0 Playground</b>: <a href="https://youtu.be/nTIT8OQeRnY?t=600">Tutorial</a></p>
</details>

<details>
	<summary>📌 Error for site owners: Invalid domain for site key</summary>
	<p><img src="https://i.ibb.co/2gZttY7/image.png" width="250px"></p>
	<p>1. Go to <a href="https://www.google.com/recaptcha/admin">https://www.google.com/recaptcha/admin</a></p>
	<p>2. Add the domain <b>repl.co</b> (not <b>repl.com</b>) to <b>Domains</b> in <b>reCAPTCHA v2</b>: <a href="https://youtu.be/nTIT8OQeRnY?t=698">Tutorial</a></p>
</details>

<details>
	<summary>📌 GaxiosError: invalid_grant, unauthorized_client</summary>
	<p><img src="https://i.ibb.co/n7w9TkH/image.png" width="250px"></p>
	<p><img src="https://i.ibb.co/XFKKY9c/image.png" width="250px"></p>
	<p><img src="https://i.ibb.co/f4mc5Dp/image.png" width="250px"></p>
	<p>- If the project is not published in the Google console, the refresh token expires after one week and must be regenerated: <a href="https://youtu.be/nTIT8OQeRnY?t=445">Tutorial</a></p>
</details>

<details>
	<summary>📌 GaxiosError: invalid_client</summary>
	<p><img src="https://i.ibb.co/st3W6v4/Pics-Art-01-01-09-10-49.jpg" width="250px"></p>
	<p>- Check that the Google project <code>client_id</code> was entered correctly: <a href="https://youtu.be/nTIT8OQeRnY?t=509">Tutorial</a></p>
</details>

<details>
	<summary>📌 Error 403: access_denied</summary>
	<p><img src="https://i.ibb.co/dtrw5x3/image.png" width="250px"></p>
	<p>- If the project is not published in the Google console, only approved accounts added to the project can use it: <a href="https://youtu.be/nTIT8OQeRnY?t=438">Tutorial</a></p>
</details>

---

## ❌ **Do not use unofficial copies**

- Using unknown source code can expose your device and accounts to malware.
- The upstream project is published only at <https://github.com/ntkhang03/Goat-Bot-V2>; this enhanced fork lives at <https://github.com/lazyneoaz/Goat-Bot-V2>.
- Copies hosted elsewhere, or re-uploads that remove author credits, are unsupported and violate the license.

---

## 📸 **Screenshots**

### Bot

<details>
	<summary>Rank system</summary>
	<p><img src="https://i.ibb.co/d0JDJxF/rank.png" width="399px"></p>
	<p><img src="https://i.ibb.co/WgZzthH/rankup.png" width="399px"></p>
	<p><img src="https://i.ibb.co/hLTThLW/customrankcard.png" width="399px"></p>
</details>

<details>
	<summary>Weather</summary>
	<p><img src="https://i.ibb.co/2FwWVLv/weather.png" width="399px"></p>
</details>

<details>
	<summary>Join / leave notifications</summary>
	<p><img src="https://i.ibb.co/Jsb5Jxf/wcgb.png" width="399px"></p>
</details>

<details>
	<summary>Openjourney</summary>
	<p><img src="https://i.ibb.co/XJfwj1X/Screenshot-2023-05-09-22-43-58-630-com-facebook-orca.jpg" width="399px"></p>
</details>

<details>
	<summary>GPT</summary>
	<p><img src="https://i.ibb.co/D4wRbM3/Screenshot-2023-05-09-22-47-48-037-com-facebook-orca.jpg" width="399px"></p>
	<p><img src="https://i.ibb.co/z8HqPkH/Screenshot-2023-05-09-22-47-53-737-com-facebook-orca.jpg" width="399px"></p>
	<p><img src="https://i.ibb.co/19mZQpR/Screenshot-2023-05-09-22-48-02-516-com-facebook-orca.jpg" width="399px"></p>
</details>

### Dashboard

<details>
	<summary>Home</summary>
	<p><img src="https://i.postimg.cc/GtwP4Cqm/Screenshot-2023-12-23-105357.png" width="399px"></p>
	<p><img src="https://i.postimg.cc/MTjbZT0L/Screenshot-2023-12-23-105554.png" width="399px"></p>
</details>

<details>
	<summary>Stats</summary>
	<p><img src="https://i.postimg.cc/QtXt98B7/image.png" width="399px"></p>
</details>

<details>
	<summary>Login / Register</summary>
	<p><img src="https://i.postimg.cc/Jh05gKsM/Screenshot-2023-12-23-105743.png" width="399px"></p>
	<p><img src="https://i.postimg.cc/j5nM9K8m/Screenshot-2023-12-23-105748.png" width="399px"></p>
</details>

<details>
	<summary>Thread management</summary>
	<p><img src="https://i.postimg.cc/RF237v1Z/Screenshot-2023-12-23-105913.png" width="399px"></p>
</details>

<details>
	<summary>Custom on/off</summary>
	<p><img src="https://i.ibb.co/McDRhmX/image.png" width="399px"></p>
</details>

<details>
	<summary>Custom welcome / leave messages</summary>
	<p><img src="https://i.ibb.co/6ZrQqc1/image.png" width="399px"></p>
	<p><img src="https://i.ibb.co/G53JsXm/image.png" width="399px"></p>
</details>

---

## 👥 **Credits**

- **Original author:** [NTKhang (ntkhang03)](https://github.com/ntkhang03) — creator of [Goat-Bot-V2](https://github.com/ntkhang03/Goat-Bot-V2).
- **Modified and enhanced by:** [Neoaz (@lazyneoaz)](https://github.com/lazyneoaz) 🐊 — modernised dependency stack, hardened login, and new features.
- **Messenger API layer:** [`xtreme-fca`](https://www.npmjs.com/package/xtreme-fca) by [@lazyneoaz](https://github.com/lazyneoaz) ([source](https://github.com/lazyneoaz/xtreme-fca)).
- **Bot name:** `Neoaz 🐊`.

## 📜 **License**

**VIETNAMESE**

- ***Nếu bạn vi phạm bất kỳ quy tắc nào, bạn sẽ bị cấm sử dụng dự án của tôi***
- Không bán mã nguồn của tôi
- Không tự xưng là chủ sở hữu của mã nguồn của tôi
- Không kiếm tiền từ mã nguồn của tôi (chẳng hạn như: mua bán lệnh, mua bán/cho thuê bot, kêu gọi quyên góp, v.v.)
- Không xóa/sửa đổi credit (tên tác giả) trong mã nguồn của tôi

**ENGLISH**

- ***If you violate any rules, you will be banned from using my project***
- Don't sell my source code
- Don't claim my source code as your own
- Do not monetize my source code (such as: buy and sell commands, buy and sell bots, call for donations, etc.)
- Don't remove/edit my credits (author name) in my source code
