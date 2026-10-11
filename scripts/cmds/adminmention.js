 module.exports = {
  config: {
    name: "adminmention",
    version: "1.3.2",
    author: "SHAKIB",
    countDown: 0,
    role: 0,
    shortDescription: "Replies angrily when someone tags admins",
    longDescription: "If anyone mentions an admin, bot will angrily reply with random messages.",
    category: "system"
  },

  onStart: async function () {},

  onChat: async function ({ event, message }) {
    const adminIDs = ["100065350440147", "100065350440147", "100065350440147"].map(String);

    // Skip if sender is admin
    if (adminIDs.includes(String(event.senderID))) return;

    const mentionedIDs = event.mentions ? Object.keys(event.mentions).map(String) : [];
    const isMentioningAdmin = adminIDs.some(id => mentionedIDs.includes(id));

    if (!isMentioningAdmin) return;

    const REPLIES = [
      "ওরে মেনশন দিস না বউ নিয়া চিপায় গেছে 😩🐸",
      "বস এক আবাল তুমারে ডাকতেছে 😂😏",
      "বুকাচুদা তুই মেনশন দিবি না আমার বস রে 🥹",
      "মেনশন দিছস আর বেচে যাবি? দারা বলতাছি 😠",
      "Boss এখন বিজি আছে 😌🥱"
    ];

    const randomReply = REPLIES[Math.floor(Math.random() * REPLIES.length)];
    return message.reply(randomReply);
  }
}
