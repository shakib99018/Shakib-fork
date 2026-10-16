"use strict";

const { drive } = global.utils;
const { nickNameBot } = global.GoatBot.config;
const { createCanvas, loadImage } = require("canvas");
const GIFEncoder = require("gifencoder");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const WIDTH = 900;
const HEIGHT = 506;
const FRAMES = 36;
const FRAME_DELAY = 85;

const COLORS = {
    purple: "#a66bff",
    pink: "#ff63cf",
    cyan: "#69eaff",
    white: "#ffffff",
    background: "#080615"
};

module.exports = {
    config: {
        name: "welcome",
        version: "1.0.0",
        author: "𝐌𝐚𝐑𝐮𝐅",
        category: "events"
    },

    langs: {
        en: {
            defaultWelcomeMessage:
                "╭━━━〔 👑 VIP WELCOME 〕━━━╮\n\n" +
                "✨ Welcome, {userName}!\n" +
                "💜 Group: {threadName}\n" +
                "👑 Member: #{memberCount}\n" +
                "💌 Invited by: {inviterName}\n\n" +
                "🌌 Enjoy your stay!\n\n" +
                "╰━━━━━━ 𝐌𝐚𝐑𝐮𝐅 ━━━━━━╯",

            botAddedMessage:
                "╭━━━〔 🤖 VIP BOT ONLINE 〕━━━╮\n\n" +
                "💜 Thanks for adding me!\n\n" +
                "⚙️ Prefix: {prefix}\n" +
                "📜 Help: {prefix}help\n\n" +
                "╰━━━━━━ 𝐌𝐚𝐑𝐮𝐅 ━━━━━━╯"
        }
    },

    onStart: async ({
        threadsData,
        message,
        event,
        api,
        usersData,
        getLang
    }) => {
        if (event.logMessageType !== "log:subscribe") return;

        const threadID = event.threadID;
        const threadData = await threadsData.get(threadID);

        if (!threadData.settings.sendWelcomeMessage) return;

        const added =
            event.logMessageData.addedParticipants || [];

        const botID = api.getCurrentUserID();
        const prefix = global.utils.getPrefix(threadID);
        const threadName =
            threadData.threadName || "Our Group";

        for (const user of added) {
            const userID = user.userFbId;

            if (String(userID) === String(botID)) {
                if (nickNameBot) {
                    try {
                        await api.changeNickname(
                            nickNameBot,
                            threadID,
                            botID
                        );
                    } catch (error) {
                        console.error(
                            "[VIP-WELCOME] Nickname:",
                            error.message
                        );
                    }
                }

                try {
                    await message.send(
                        getLang("botAddedMessage")
                            .replace(/\{prefix\}/g, prefix)
                    );
                } catch (error) {
                    console.error(
                        "[VIP-WELCOME] Bot message:",
                        error.message
                    );
                }

                continue;
            }

            const userName = user.fullName || "New Member";
            const inviterID = event.author;
            let inviterName = "Someone";

            try {
                if (inviterID) {
                    inviterName =
                        await usersData.getName(inviterID) ||
                        "Someone";
                }
            } catch (_) {}

            const memberCount =
                (event.participantIDs || []).length;

            let welcomeMessage =
                threadData.data?.welcomeMessage ||
                getLang("defaultWelcomeMessage");

            welcomeMessage = welcomeMessage
                .replace(/\{userName\}/g, userName)
                .replace(/\{userTag\}/g, userName)
                .replace(/\{threadName\}/g, threadName)
                .replace(/\{memberCount\}/g, String(memberCount))
                .replace(/\{inviterName\}/g, inviterName)
                .replace(/\{prefix\}/g, prefix);

            let imagePath = null;

            try {
                imagePath = await createVIPWelcome({
                    userID,
                    inviterID,
                    threadID,
                    userName,
                    inviterName,
                    threadName,
                    memberCount,
                    api
                });
            } catch (error) {
                console.error(
                    "[VIP-WELCOME] Animation:",
                    error.stack || error.message
                );
            }

            const form = {
                body: welcomeMessage,
                mentions: [{
                    tag: userName,
                    id: userID
                }]
            };

            if (imagePath && await fs.pathExists(imagePath)) {
                form.attachment = fs.createReadStream(imagePath);
            } else if (threadData.data?.welcomeAttachment) {
                try {
                    const results = await Promise.allSettled(
                        threadData.data.welcomeAttachment.map(file =>
                            drive.getFile(file, "stream")
                        )
                    );

                    const attachments = results
                        .filter(result => result.status === "fulfilled")
                        .map(result => result.value);

                    if (attachments.length) {
                        form.attachment = attachments;
                    }
                } catch (error) {
                    console.error(
                        "[VIP-WELCOME] Attachment:",
                        error.message
                    );
                }
            }

            try {
                await message.send(form);
            } catch (error) {
                console.error(
                    "[VIP-WELCOME] Send:",
                    error.stack || error.message
                );
            } finally {
                if (imagePath) {
                    setTimeout(() => {
                        fs.remove(imagePath).catch(() => {});
                    }, 30000);
                }
            }
        }
    }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// IMAGE HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function getImage(url) {
    if (!url) return null;

    try {
        const response = await axios.get(url, {
            responseType: "arraybuffer",
            timeout: 15000,
            maxRedirects: 5,
            maxContentLength: 8 * 1024 * 1024
        });

        return await loadImage(Buffer.from(response.data));
    } catch (_) {
        return null;
    }
}

async function getProfile(userID, api) {
    if (!userID) return null;

    try {
        const info = await api.getUserInfo([userID]);
        const profile = info?.[userID];

        return await getImage(
            profile?.thumbSrc ||
            profile?.profilePic ||
            profile?.photoUrl
        );
    } catch (_) {
        return null;
    }
}

async function getGroupImage(threadID, api) {
    try {
        const info = await api.getThreadInfo(threadID);
        return await getImage(info?.imageSrc);
    } catch (_) {
        return null;
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DRAWING HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function roundedRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(
        x + w, y + h, x + w - r, y + h
    );
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function panel(ctx, x, y, w, h, r, fill, stroke) {
    roundedRect(ctx, x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();

    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}

function glow(ctx, x, y, radius, color) {
    const gradient = ctx.createRadialGradient(
        x, y, 0, x, y, radius
    );

    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(
        x - radius,
        y - radius,
        radius * 2,
        radius * 2
    );
}

function star(ctx, x, y, r, inner = r * 0.4) {
    ctx.beginPath();

    for (let i = 0; i < 8; i++) {
        const radius = i % 2 === 0 ? r : inner;
        const angle = Math.PI * i / 4 - Math.PI / 2;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }

    ctx.closePath();
    ctx.fill();
}

function fitText(ctx, value, maxWidth, startSize, minSize = 12) {
    const original = String(value || "");
    let text = original;
    let size = startSize;

    while (size > minSize) {
        ctx.font = `bold ${size}px Arial`;

        if (ctx.measureText(text).width <= maxWidth) break;
        size--;
    }

    ctx.font = `bold ${size}px Arial`;

    while (
        text.length > 2 &&
        ctx.measureText(text + "...").width > maxWidth
    ) {
        text = text.slice(0, -1);
    }

    if (text !== original) text += "...";

    return { text, size };
}

function drawAvatar(ctx, img, x, y, r, fallback) {
    ctx.save();

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();

    if (img) {
        ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
    } else {
        const gradient = ctx.createLinearGradient(
            x - r, y - r, x + r, y + r
        );

        gradient.addColorStop(0, "#763cff");
        gradient.addColorStop(1, "#f04fbf");

        ctx.fillStyle = gradient;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 42px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(fallback, x, y);
    }

    ctx.restore();
}

function drawAvatarRings(ctx, x, y, r, time, color) {
    ctx.save();

    ctx.shadowColor = color;
    ctx.shadowBlur = 22;

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, r + 7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.65;

    // Rotating arc
    ctx.beginPath();
    ctx.arc(
        x,
        y,
        r + 15,
        time * 2,
        time * 2 + Math.PI * 1.15
    );
    ctx.stroke();

    ctx.strokeStyle = COLORS.cyan;
    ctx.beginPath();
    ctx.arc(
        x,
        y,
        r + 15,
        time * 2 + Math.PI,
        time * 2 + Math.PI * 1.65
    );
    ctx.stroke();

    // Orbital dots
    for (let i = 0; i < 3; i++) {
        const angle = time * 2 + i * Math.PI * 2 / 3;

        ctx.globalAlpha = 1;
        ctx.fillStyle = i % 2 ? COLORS.pink : COLORS.cyan;

        ctx.beginPath();
        ctx.arc(
            x + Math.cos(angle) * (r + 15),
            y + Math.sin(angle) * (r + 15),
            3.5,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    ctx.restore();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PREMIUM ANIMATED FRAME
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function drawFrame(ctx, data, assets, frame) {
    const W = WIDTH;
    const H = HEIGHT;
    const time = frame / FRAMES * Math.PI * 2;

    ctx.clearRect(0, 0, W, H);

    // Animated midnight background
    const bg = ctx.createLinearGradient(
        Math.sin(time) * 200,
        0,
        W,
        H
    );

    bg.addColorStop(0, "#080515");
    bg.addColorStop(0.45, "#21103f");
    bg.addColorStop(0.75, "#102341");
    bg.addColorStop(1, "#080817");

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Moving neon atmosphere
    glow(
        ctx,
        130 + Math.sin(time) * 65,
        110,
        230,
        "rgba(151,65,255,0.34)"
    );

    glow(
        ctx,
        760 + Math.cos(time) * 50,
        170,
        250,
        "rgba(30,200,255,0.25)"
    );

    glow(
        ctx,
        450,
        490 + Math.sin(time * 2) * 15,
        200,
        "rgba(255,49,177,0.18)"
    );

    // Floating particles
    for (let i = 0; i < 65; i++) {
        const x = (
            i * 137.5 + frame * (0.7 + i % 3)
        ) % W;

        const y = (
            i * 73.7 +
            Math.sin(time + i) * 16 +
            frame * (i % 2 ? 0.3 : -0.2) +
            H
        ) % H;

        const radius = 0.7 + i % 3 * 0.45;

        ctx.globalAlpha = 0.35 + (i % 4) * 0.15;
        ctx.fillStyle = i % 2 ? COLORS.pink : COLORS.cyan;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.globalAlpha = 1;

    // Glass panel with depth shadow
    ctx.save();
    ctx.shadowColor = "rgba(132,76,255,0.4)";
    ctx.shadowBlur = 28;

    panel(
        ctx,
        18, 18,
        W - 36, H - 36,
        27,
        "rgba(8,8,27,0.87)",
        "rgba(177,148,255,0.8)"
    );

    ctx.restore();

    // Animated border gradient
    const border = ctx.createLinearGradient(
        frame * 14, 0,
        W - frame * 8, H
    );

    border.addColorStop(0, COLORS.purple);
    border.addColorStop(0.5, COLORS.cyan);
    border.addColorStop(1, COLORS.pink);

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = border;

    roundedRect(ctx, 18, 18, W - 36, H - 36, 27);
    ctx.stroke();

    // Top VIP badge
    panel(
        ctx,
        320, 37,
        260, 33,
        16,
        "rgba(128,75,255,0.2)",
        "rgba(190,154,255,0.8)"
    );

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.font = "bold 13px Arial";
    ctx.fillStyle = "#f2e7ff";

    ctx.fillText("✦  VIP MEMBER ARRIVAL  ✦", 450, 58);

    // 3D title: offset shadows + main gradient
    const titleY = 116 + Math.sin(time) * 2;

    ctx.font = "bold 43px Arial";

    ctx.fillStyle = "rgba(105,52,220,0.9)";
    ctx.fillText("WELCOME ABOARD", 452, titleY + 5);

    ctx.fillStyle = "rgba(255,67,194,0.55)";
    ctx.fillText("WELCOME ABOARD", 448, titleY + 2);

    const title = ctx.createLinearGradient(240, 0, 660, 0);
    title.addColorStop(0, "#d7b1ff");
    title.addColorStop(0.5, "#ffffff");
    title.addColorStop(1, "#78edff");

    ctx.fillStyle = title;
    ctx.fillText("WELCOME ABOARD", 450, titleY);

    ctx.font = "12px Arial";
    ctx.fillStyle = "#c7c1e9";
    ctx.fillText("YOUR NEXT CHAPTER STARTS HERE", 450, 139);

    // Profile cards
    const userX = 255;
    const inviterX = 645;
    const avatarY = 224;
    const radius = 57;

    // Depth shadow behind avatars
    for (const x of [userX, inviterX]) {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.shadowColor = "rgba(153,88,255,0.8)";
        ctx.shadowBlur = 20;

        ctx.beginPath();
        ctx.arc(x, avatarY + 5, radius + 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Orbiting rings
    drawAvatarRings(
        ctx, userX, avatarY, radius, time, COLORS.purple
    );

    drawAvatarRings(
        ctx, inviterX, avatarY, radius, -time, COLORS.pink
    );

    // Actual profile photos
    drawAvatar(
        ctx, assets.userImg,
        userX, avatarY, radius,
        String(data.userName || "U").charAt(0).toUpperCase()
    );

    drawAvatar(
        ctx, assets.inviterImg,
        inviterX, avatarY, radius,
        String(data.inviterName || "I").charAt(0).toUpperCase()
    );

    // Connection beam
    const beam = ctx.createLinearGradient(userX, 0, inviterX, 0);

    beam.addColorStop(0, COLORS.purple);
    beam.addColorStop(0.5, COLORS.cyan);
    beam.addColorStop(1, COLORS.pink);

    ctx.save();
    ctx.globalAlpha = 0.5 + Math.sin(time * 2) * 0.25;
    ctx.strokeStyle = beam;
    ctx.lineWidth = 2;
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(userX + radius + 18, avatarY);
    ctx.lineTo(inviterX - radius - 18, avatarY);
    ctx.stroke();

    ctx.restore();

    // Central 3D diamond
    ctx.save();
    ctx.translate(450, avatarY);
    ctx.rotate(time);

    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 15;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(11, 0);
    ctx.lineTo(0, 11);
    ctx.lineTo(-11, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Names
    const user = fitText(ctx, data.userName, 250, 21);
    const inviter = fitText(ctx, data.inviterName, 250, 21);

    ctx.textAlign = "center";
    ctx.font = `bold ${user.size}px Arial`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(user.text, userX, 315);

    ctx.font = "bold 11px Arial";
    ctx.fillStyle = "#c8aaff";
    ctx.fillText("✦ NEW MEMBER ✦", userX, 337);

    ctx.font = `bold ${inviter.size}px Arial`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(inviter.text, inviterX, 315);

    ctx.font = "bold 11px Arial";
    ctx.fillStyle = "#7cecff";
    ctx.fillText("✦ INVITED BY ✦", inviterX, 337);

    // Member badge with animated glow
    ctx.save();
    ctx.shadowColor = COLORS.purple;
    ctx.shadowBlur = 12 + Math.sin(time * 2) * 5;

    panel(
        ctx,
        332, 354,
        236, 38,
        19,
        "rgba(119,75,255,0.2)",
        "rgba(184,159,255,0.9)"
    );

    ctx.restore();

    ctx.font = "bold 16px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(
        `♛  MEMBER #${data.memberCount}  ♛`,
        450,
        378
    );

    // Group information panel
    panel(
        ctx,
        62, 408,
        776, 65,
        16,
        "rgba(255,255,255,0.055)",
        "rgba(126,174,255,0.35)"
    );

    // Group icon
    ctx.save();

    roundedRect(ctx, 76, 417, 48, 48, 12);
    ctx.clip();

    if (assets.groupImg) {
        ctx.drawImage(assets.groupImg, 76, 417, 48, 48);
    } else {
        const groupGradient = ctx.createLinearGradient(76, 417, 124, 465);

        groupGradient.addColorStop(0, "#7938d8");
        groupGradient.addColorStop(1, "#ec4cae");

        ctx.fillStyle = groupGradient;
        ctx.fillRect(76, 417, 48, 48);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.fillText("G", 100, 449);
    }

    ctx.restore();

    ctx.textAlign = "left";
    ctx.font = "bold 10px Arial";
    ctx.fillStyle = COLORS.cyan;
    ctx.fillText("WELCOME TO", 139, 434);

    const group = fitText(ctx, data.threadName, 500, 19);

    ctx.font = `bold ${group.size}px Arial`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(group.text, 139, 457);

    // Footer
    ctx.textAlign = "right";
    ctx.font = "bold 10px Arial";
    ctx.fillStyle = "#c7b9ff";

    ctx.fillText(
        "POWERED BY 𝐌𝐚𝐑𝐮𝐅  ✦",
        821,
        489
    );

    // Corner sparkles
    ctx.fillStyle = COLORS.pink;
    star(ctx, 52, 88 + Math.sin(time) * 6, 7);
    star(ctx, 844, 95 + Math.cos(time) * 6, 6);

    ctx.fillStyle = COLORS.cyan;
    star(ctx, 840, 370 + Math.sin(time + 1) * 6, 6);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GIF + PNG GENERATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function writeGIF(canvas, ctx, data, assets, outputPath) {
    return new Promise((resolve, reject) => {
        const encoder = new GIFEncoder(WIDTH, HEIGHT);
        const output = fs.createWriteStream(outputPath);

        let settled = false;

        const fail = error => {
            if (settled) return;
            settled = true;
            output.destroy();
            reject(error);
        };

        output.on("error", fail);
        encoder.on("error", fail);

        output.on("finish", () => {
            if (settled) return;
            settled = true;
            resolve(outputPath);
        });

        encoder.createReadStream().pipe(output);

        try {
            encoder.start();
            encoder.setRepeat(0);
            encoder.setDelay(FRAME_DELAY);
            encoder.setQuality(12);

            for (let frame = 0; frame < FRAMES; frame++) {
                drawFrame(ctx, data, assets, frame);
                encoder.addFrame(ctx);
            }

            encoder.finish();
        } catch (error) {
            fail(error);
        }
    });
}

async function createVIPWelcome(data) {
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");

    const [userImg, inviterImg, groupImg] = await Promise.all([
        getProfile(data.userID, data.api),
        getProfile(data.inviterID, data.api),
        getGroupImage(data.threadID, data.api)
    ]);

    const assets = {
        userImg,
        inviterImg,
        groupImg
    };

    const basePath = path.join(
        __dirname,
        `vip_welcome_${Date.now()}_${Math.floor(Math.random() * 100000)}`
    );

    const gifPath = basePath + ".gif";
    const pngPath = basePath + ".png";

    try {
        await writeGIF(
            canvas,
            ctx,
            data,
            assets,
            gifPath
        );

        return gifPath;
    } catch (error) {
        console.error(
            "[VIP-WELCOME] GIF encoding failed:",
            error.message
        );

        await fs.remove(gifPath).catch(() => {});

        // Static PNG fallback
        try {
            drawFrame(ctx, data, assets, 0);

            await fs.writeFile(
                pngPath,
                canvas.toBuffer("image/png")
            );

            return pngPath;
        } catch (pngError) {
            await fs.remove(pngPath).catch(() => {});
            throw pngError;
        }
    }
              }
