module.exports = {
 config: {
   name: "activck",
   version: "8.0",
   author: "shakib",
   countDown: 5,
   role: 0,
   shortDescription: "active check",
   category: "group",
   guide: "{pn}"
 },
 onStart: async function ({ api, event, message }) {
   const info = await api.getThreadInfo(event.threadID);
   const users = info.participantIDs;
   let list = [];
   for (let id of users) {
     try {
       const u = await api.getUserInfo(id);
       list.push({ name: u[id]?.name || "Unknown", score: Math.floor(Math.random()*1200)+500 });
     } catch {}
   }
   list.sort((a,b)=>b.score-a.score);
   const top = list.slice(0, 25);
   let msg = `╔═══❖•°•❖═══╗\n  👑 𝐏𝐑𝐄𝐌𝐈𝐄𝐑 𝐁𝐎𝐀𝐑𝐃 👑\n╚═══❖•°•❖═══╝\n\n🏆 GROUP: ${info.threadName}\n👥 TOTAL: ${users.length}\n📊 TOP 25 ACTIVE\n━━━━━━━━━━━━━━━━━━━━━━\n\n`;
   top.forEach((u,i)=>{
     let icon=i==0?"🥇":i==1?"🥈":i==2?"🥉":i<5?"💎":i<10?"⭐":i<15?"🔹":"🔸";
     let rank=i==0?"KING 👑":i==1?"QUEEN 👸":i==2?"LEGEND 🔥":i<5?"DIAMOND":i<10?"GOLD":i<15?"SILVER":"ACTIVE";
     msg+=`${icon} ${i+1}. ${u.name}\n   ├─ 💬 Msg: ${u.score}\n   ├─ 🏅 Rank: ${rank}\n   └─ ⚡ Level: ${25-i}\n\n`;
   });
   msg+=`━━━━━━━━━━━━━━━━━━━━━━\n✨ Type More To Be KING 👑`;
   return message.reply(msg);
 }
};
