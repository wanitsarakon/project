import Phaser from "phaser";

const ASSET_BASE = "/assets/hauntedgame";
const ROOM_TIME = 30;
const MAX_SCORE = 160;

const ITEMS = {
  key: { label: "กุญแจ", image: `${ASSET_BASE}/images/key.png` },
  scissors: { label: "กรรไกร", image: `${ASSET_BASE}/images/scissors.png` },
  toy: { label: "ของเล่น", image: `${ASSET_BASE}/images/toy.png` },
  lighter: { label: "ไฟแช็ก", image: `${ASSET_BASE}/images/lighter.png` },
  blade: { label: "มีดโกน", image: `${ASSET_BASE}/images/blade.png` },
  med: { label: "ยา", image: `${ASSET_BASE}/images/med.png` },
  gun: { label: "ปืน", image: `${ASSET_BASE}/images/gun.png` },
  coin: { label: "เหรียญ", image: `${ASSET_BASE}/images/coin.png` },
};

const ROOMS = [
  {
    id: "living",
    title: "ห้องนั่งเล่นต้องสาป",
    sign: `${ASSET_BASE}/images/living_sign.png`,
    background: `${ASSET_BASE}/images/living.png`,
    items: [
      { id: "gun", x: 44, y: 68.6, w: 8.5, h: 9.5 },
      { id: "key", x: 3.8, y: 77, w: 7, h: 16 },
      { id: "scissors", x: 92.4, y: 75.4, w: 7, h: 10 },
    ],
  },
  {
    id: "bedroom",
    title: "ห้องนอนเงา",
    sign: `${ASSET_BASE}/images/bedroom_sign.png`,
    background: `${ASSET_BASE}/images/bedroom.png`,
    items: [
      { id: "blade", x: 15, y: 31, w: 8.5, h: 12 },
      { id: "med", x: 83, y: 72.5, w: 7, h: 9 },
    ],
  },
  {
    id: "bathroom",
    title: "ห้องน้ำสะท้อนวิญญาณ",
    sign: `${ASSET_BASE}/images/bathroom_sign.png`,
    background: `${ASSET_BASE}/images/bathroom.png`,
    items: [
      { id: "coin", x: 13.4, y: 87.8, w: 6.4, h: 6.8 },
      { id: "lighter", x: 95.2, y: 56.8, w: 4.8, h: 10.4 },
    ],
  },
  {
    id: "kid",
    title: "ห้องเด็กหลอน",
    sign: `${ASSET_BASE}/images/kid_sign.png`,
    background: `${ASSET_BASE}/images/kid.png`,
    items: [{ id: "toy", x: 91.6, y: 83.5, w: 7.8, h: 10.5 }],
  },
];

const GHOSTS = [
  {
    id: "woman",
    name: "หญิงผู้เฝ้ากุญแจ",
    image: `${ASSET_BASE}/images/woman.png`,
    voice: `${ASSET_BASE}/sounds/woman_voice.mp3`,
    story: "ลูกของฉันถูกขังอยู่ในความมืด ช่วยนำกุญแจและกรรไกรคืนมาให้ที...",
    needs: ["key", "scissors"],
    accent: "#f4d3aa",
  },
  {
    id: "girl",
    name: "เด็กหญิงในฝันร้าย",
    image: `${ASSET_BASE}/images/girl.png`,
    voice: `${ASSET_BASE}/sounds/girl_voice.mp3`,
    story: "ฉันกลัวความมืดเหลือเกิน ของเล่นชิ้นโปรดกับแสงเล็ก ๆ จะทำให้ฉันสงบลงอีกครั้ง...",
    needs: ["toy", "lighter"],
    accent: "#ffd2dd",
  },
  {
    id: "man",
    name: "ชายผู้ติดค้าง",
    image: `${ASSET_BASE}/images/man.png`,
    voice: `${ASSET_BASE}/sounds/man_voice.mp3`,
    story: "บาดแผลและความเจ็บปวดของฉันยังไม่จบ ถ้าได้ยาและมีดโกนคืนมา บางทีฉันคงไปต่อได้...",
    needs: ["blade", "med"],
    accent: "#d7e3ff",
  },
  {
    id: "maid",
    name: "สาวใช้ผู้เงียบงัน",
    image: `${ASSET_BASE}/images/maid.png`,
    voice: `${ASSET_BASE}/sounds/maid_voice.mp3`,
    story: "ฉันถูกทิ้งให้เฝ้าคฤหาสน์นี้เพียงลำพัง ปืนและเหรียญสุดท้ายคือสิ่งที่ฉันอยากเก็บไว้...",
    needs: ["gun", "coin"],
    accent: "#e4d7ff",
  },
];

const BLESSING_LINES = [
  "คลิกผีเพื่อฟังเรื่องราวก่อน แล้วค่อยเลือกของไปมอบให้",
  "ผีแต่ละตนรับของได้สูงสุด 2 ชิ้น",
  "มอบถูกทั้ง 2 ชิ้น ได้ 40 คะแนนเต็ม",
];

export default class HauntedHouseScene extends Phaser.Scene {
  constructor() {
    super({ key: "HauntedHouseScene" });
    this.onGameEnd = null;
    this.root = null;
    this.state = null;
    this.roomTimer = null;
    this.typeTimer = null;
    this.activeVoice = null;
    this.bgm = null;
    this.isCleaningUp = false;
    this.pendingTimeouts = new Set();
  }

  init(data = {}) {
    this.onGameEnd = data?.onGameEnd ?? null;
  }

  create() {
    this.isCleaningUp = false;
    this.pendingTimeouts.clear();
    this.state = {
      phase: "intro",
      roomIndex: 0,
      timeLeft: ROOM_TIME,
      inventory: [],
      selectedItem: null,
      dialogHtml: "ที่นี่ไม่ใช่สถานที่ของคนเป็น เก็บสิ่งของที่ตกค้าง แล้วช่วยปลดปล่อยวิญญาณให้สงบลง...",
      unlockedGhostId: null,
      roomFound: {},
      ghostGiven: Object.fromEntries(GHOSTS.map((ghost) => [ghost.id, []])),
      score: 0,
      transitioning: false,
      misses: 0,
    };
    this.mount();
    this.render();
    this.events.once("shutdown", () => this.cleanup());
    this.events.once("destroy", () => this.cleanup());
  }

  mount() {
    const host = this.game.canvas?.parentElement;
    if (!host) return;
    this.root = document.createElement("div");
    this.root.innerHTML = `
      <style>
        .hh-root{position:absolute;inset:0;overflow:hidden;background:#050505;color:#f6ead4;font-family:Kanit,sans-serif}.hh-screen{position:absolute;inset:0;display:flex;flex-direction:column}.hh-hidden{display:none!important}.hh-bg{position:absolute;inset:0;background:center/cover no-repeat;filter:brightness(.88)}.hh-dim{position:absolute;inset:0;background:radial-gradient(circle at center,rgba(0,0,0,.08),rgba(0,0,0,.72)),linear-gradient(180deg,rgba(12,5,5,.44),rgba(7,3,3,.84))}.hh-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px}.hh-intro{background:linear-gradient(180deg,rgba(0,0,0,.18),rgba(0,0,0,.62)),url('${ASSET_BASE}/images/main_menu.png') center/cover no-repeat}.hh-card{width:min(92vw,1080px);display:grid;grid-template-columns:minmax(190px,280px) 1fr;gap:28px;align-items:center}.hh-npc{width:min(28vw,260px);justify-self:center;filter:drop-shadow(0 0 24px rgba(255,255,255,.15));animation:hhFloat 3s ease-in-out infinite}.hh-board{background:url('${ASSET_BASE}/images/signboard_bg.png') center/100% 100% no-repeat;padding:clamp(42px,5vw,80px) clamp(26px,6vw,72px);min-height:min(64vw,520px);display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center}.hh-logo{width:min(60vw,380px);max-height:120px;object-fit:contain;filter:drop-shadow(0 8px 20px rgba(0,0,0,.35))}.hh-title{margin:0;color:#991d1d;font-size:clamp(30px,5vw,54px)}.hh-copy{margin-top:16px;max-width:620px;color:#fff5e8;font-size:clamp(16px,2vw,21px);line-height:1.6;text-shadow:0 2px 6px rgba(0,0,0,.45)}.hh-copy.muted{font-size:clamp(14px,1.8vw,18px);color:#ffe3b3}.hh-btn{border:none;border-radius:999px;padding:13px 26px;background:linear-gradient(180deg,#8d1111,#420606);color:#fff6e1;font:inherit;font-weight:700;cursor:pointer;box-shadow:0 12px 20px rgba(0,0,0,.32)}.hh-top{position:relative;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:18px 20px;gap:12px}.hh-chip{background:rgba(18,7,6,.82);border:1px solid rgba(255,211,152,.24);border-radius:999px;padding:8px 16px;font-weight:700}.hh-sign{height:56px;max-width:min(42vw,360px);object-fit:contain;filter:drop-shadow(0 6px 18px rgba(0,0,0,.55))}.hh-room{position:relative;flex:1}.hh-hit{position:absolute;transform:translate(-50%,-50%);border:none;border-radius:999px;background:radial-gradient(circle,rgba(255,214,111,.24),rgba(255,214,111,0));box-shadow:0 0 18px rgba(255,214,111,.22);cursor:pointer}.hh-miss{position:absolute;inset:0;cursor:crosshair}.hh-hit:hover{box-shadow:0 0 22px rgba(255,225,150,.42)}.hh-bottom{position:relative;z-index:2;padding:14px 16px 20px;background:linear-gradient(180deg,rgba(12,4,4,0),rgba(7,3,3,.92) 28%)}.hh-hint{color:#ffd89b;text-align:center;font-size:15px}.hh-items,.hh-inventory,.hh-ghosts{display:flex;justify-content:center;flex-wrap:wrap;gap:12px}.hh-items,.hh-inventory{margin-top:10px}.hh-item,.hh-itembtn img{width:66px;height:66px;object-fit:contain}.hh-item{padding:8px;border-radius:16px;background:rgba(255,255,255,.05);border:1px solid rgba(255,224,186,.08)}.hh-item.missing{filter:grayscale(1) brightness(1.7);opacity:.18}.hh-item.found{background:rgba(255,238,184,.12);box-shadow:0 0 18px rgba(255,214,111,.45)}.hh-puzzle{background:linear-gradient(180deg,rgba(0,0,0,.48),rgba(0,0,0,.78)),url('${ASSET_BASE}/images/puzzlepage.png') center/cover no-repeat}.hh-dialog{position:relative;z-index:2;margin:20px auto 0;width:min(90vw,940px);min-height:122px;padding:26px 34px;background:url('${ASSET_BASE}/images/speech_bubble_frame.png') center/100% 100% no-repeat;color:#fff8ec;font-size:20px;line-height:1.55;text-shadow:0 2px 6px rgba(0,0,0,.55)}.hh-dialog strong{color:#ffd89b}.hh-ghosts{position:relative;z-index:2;flex:1;align-items:flex-end;gap:min(2vw,22px);padding:28px 18px 160px}.hh-ghost{width:min(20vw,180px);min-width:122px;display:flex;flex-direction:column;align-items:center;gap:10px}.hh-ghost button{border:none;background:none;padding:0;cursor:pointer}.hh-ghost img{width:100%;max-height:min(34vw,340px);object-fit:contain;filter:brightness(.72);transition:220ms ease}.hh-ghost.active img,.hh-ghost button:hover img{transform:translateY(-4px) scale(1.03);filter:brightness(1.02) drop-shadow(0 0 18px rgba(255,214,111,.32))}.hh-ghost.partial img{opacity:.52}.hh-ghost.saved img{opacity:.08;transform:translateY(-26px) scale(.82);filter:brightness(1.8) blur(3px)}.hh-ghostlabel{text-align:center;font-size:15px}.hh-slots{display:flex;gap:8px}.hh-slot{width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.08);border:1px dashed rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center}.hh-slot img{width:100%;height:100%;object-fit:contain}.hh-invwrap{position:relative;z-index:2;padding:14px 16px 18px;background:url('${ASSET_BASE}/images/frame_bg.png') center/100% 100% no-repeat;border-top:none}.hh-note{text-align:center;color:#ffd89b;font-size:15px}.hh-itembtn{border:1px solid rgba(255,224,186,.12);border-radius:14px;background:rgba(255,255,255,.05);padding:8px;cursor:pointer}.hh-itembtn.sel{background:rgba(255,215,128,.16);box-shadow:0 0 0 2px rgba(255,215,128,.32);transform:translateY(-2px)}.hh-result{background:linear-gradient(180deg,rgba(0,0,0,.58),rgba(0,0,0,.85)),url('${ASSET_BASE}/images/result_bg.png') center/cover no-repeat}.hh-result-board{background:url('${ASSET_BASE}/images/result.png') center/contain no-repeat;min-height:min(62vw,500px)}.hh-score{margin-top:14px;color:#ffd89b;font-size:clamp(42px,7vw,74px);font-weight:800}.hh-summary{margin-top:20px;display:grid;gap:10px;width:min(100%,560px)}.hh-row{display:flex;justify-content:space-between;gap:12px;padding:10px 14px;border-radius:14px;background:rgba(255,255,255,.08);color:#fff7eb;font-size:16px}.hh-trans{position:absolute;inset:0;z-index:10;background:radial-gradient(circle,rgba(82,13,13,.25),rgba(0,0,0,.96));opacity:0;pointer-events:none;transition:opacity .4s ease}.hh-trans.on{opacity:1}.hh-shake{animation:hhFlash .24s ease}@keyframes hhFlash{0%{box-shadow:inset 0 0 0 rgba(190,0,0,0)}50%{box-shadow:inset 0 0 180px rgba(190,0,0,.45)}100%{box-shadow:inset 0 0 0 rgba(190,0,0,0)}}@keyframes hhFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}.hh-roommap{margin-top:20px;width:min(82vw,720px);display:grid;grid-template-columns:repeat(2,minmax(200px,1fr));gap:14px}.hh-roomtile{position:relative;aspect-ratio:4/3;border-radius:22px;overflow:hidden;border:3px solid rgba(255,226,178,.68);box-shadow:0 14px 24px rgba(0,0,0,.28)}.hh-roomtile img{width:100%;height:100%;object-fit:cover;display:block;filter:brightness(.88)}.hh-roomlabel{position:absolute;left:10px;right:10px;bottom:10px;padding:10px 14px;border-radius:14px;background:rgba(238,210,163,.94);color:#4b1f06;font-size:20px;font-weight:900}.hh-intro-note{margin-top:14px;max-width:640px;color:#fff1d6;font-size:18px;line-height:1.55;text-shadow:0 2px 6px rgba(0,0,0,.45)}@media (max-width:860px){.hh-card{grid-template-columns:1fr}.hh-npc{display:none}.hh-board{min-height:420px;padding:40px 24px 44px}.hh-dialog{font-size:17px;min-height:120px}.hh-ghosts{padding-bottom:190px}.hh-ghost{width:min(36vw,150px)}.hh-roommap{grid-template-columns:1fr 1fr;gap:10px}.hh-roomlabel{font-size:16px}}
      </style>
      <div class="hh-root">
        <div id="intro" class="hh-screen hh-intro"><div class="hh-overlay"><div class="hh-card"><img class="hh-npc" src="${ASSET_BASE}/images/npc.png" alt="npc"/><div class="hh-board"><img class="hh-logo" src="${ASSET_BASE}/images/game_logo.png" alt="บ้านผีสิง"/><div class="hh-intro-note">สำรวจ 4 ห้องในคฤหาสน์ เก็บของที่ซ่อนอยู่ให้ครบ แล้วนำไปปลดปล่อยวิญญาณที่ยังติดค้างอยู่ให้สงบลง</div><div class="hh-roommap"><div class="hh-roomtile"><img src="${ASSET_BASE}/images/living.png" alt="ห้องรับแขก"/><div class="hh-roomlabel">ห้องรับแขก</div></div><div class="hh-roomtile"><img src="${ASSET_BASE}/images/bathroom.png" alt="ห้องน้ำ"/><div class="hh-roomlabel">ห้องน้ำ</div></div><div class="hh-roomtile"><img src="${ASSET_BASE}/images/bedroom.png" alt="ห้องนอน"/><div class="hh-roomlabel">ห้องนอน</div></div><div class="hh-roomtile"><img src="${ASSET_BASE}/images/kid.png" alt="ห้องเด็ก"/><div class="hh-roomlabel">ห้องเด็ก</div></div></div><div class="hh-copy muted" style="margin-top:12px">${BLESSING_LINES.join(" · ")}</div><button id="start" class="hh-btn" style="margin-top:24px">เริ่มสำรวจคฤหาสน์</button></div></div></div></div>
        <div id="room" class="hh-screen hh-hidden"><div id="roomBg" class="hh-bg"></div><div class="hh-dim"></div><div class="hh-top"><img id="roomSign" class="hh-sign" alt="room sign"/><div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end"><div id="roomTitle" class="hh-chip"></div><div class="hh-chip">เวลา <span id="time">30</span></div></div></div><div id="roomStage" class="hh-room"><div id="miss" class="hh-miss"></div></div><div class="hh-bottom"><div class="hh-hint">หาของที่ซ่อนอยู่ในห้องนี้ให้ครบก่อนเวลาหมด</div><div id="roomItems" class="hh-items"></div></div></div>
        <div id="puzzle" class="hh-screen hh-puzzle hh-hidden"><div id="dialog" class="hh-dialog"></div><div id="ghosts" class="hh-ghosts"></div><div class="hh-invwrap"><div class="hh-note">เลือกไอเท็มด้านล่าง แล้วคลิกผีตนเดิมอีกครั้งเพื่อมอบของ</div><div id="inventory" class="hh-inventory"></div><div style="display:flex;justify-content:center"><button id="resultBtn" class="hh-btn" style="margin-top:16px">ดูผลลัพธ์</button></div></div></div>
        <div id="result" class="hh-screen hh-result hh-hidden"><div class="hh-overlay"><div class="hh-card"><img class="hh-npc" src="${ASSET_BASE}/images/npc1.png" alt="npc"/><div class="hh-board hh-result-board"><h2 class="hh-title">บทสรุปคฤหาสน์ผีสิง</h2><div class="hh-copy">วิญญาณแต่ละตนจะสงบลงเมื่อได้รับของที่ต้องการครบ และคุณยังได้คะแนนจากของที่ถือกลับมาเหลืออยู่ด้วย</div><div id="score" class="hh-score">0 / ${MAX_SCORE}</div><div id="summary" class="hh-summary"></div><button id="finish" class="hh-btn" style="margin-top:22px">กลับไปแผนที่</button></div></div></div></div>
        <div id="transition" class="hh-trans"></div>
      </div>`;
    host.appendChild(this.root);
    this.introEl = this.root.querySelector("#intro");
    this.roomEl = this.root.querySelector("#room");
    this.puzzleEl = this.root.querySelector("#puzzle");
    this.resultEl = this.root.querySelector("#result");
    this.roomBgEl = this.root.querySelector("#roomBg");
    this.roomSignEl = this.root.querySelector("#roomSign");
    this.roomTitleEl = this.root.querySelector("#roomTitle");
    this.roomStageEl = this.root.querySelector("#roomStage");
    this.roomItemsEl = this.root.querySelector("#roomItems");
    this.timeEl = this.root.querySelector("#time");
    this.dialogEl = this.root.querySelector("#dialog");
    this.ghostsEl = this.root.querySelector("#ghosts");
    this.inventoryEl = this.root.querySelector("#inventory");
    this.scoreEl = this.root.querySelector("#score");
    this.summaryEl = this.root.querySelector("#summary");
    this.transitionEl = this.root.querySelector("#transition");
    this.root.querySelector("#start")?.addEventListener("click", () => this.startGame());
    this.root.querySelector("#resultBtn")?.addEventListener("click", () => this.finishPuzzle());
    this.root.querySelector("#finish")?.addEventListener("click", () => this.finishScene());
    this.root.querySelector("#miss")?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) this.handleMiss();
    });
  }

  render() {
    if (!this.root) return;
    const { phase } = this.state;
    this.introEl?.classList.toggle("hh-hidden", phase !== "intro");
    this.roomEl?.classList.toggle("hh-hidden", phase !== "room");
    this.puzzleEl?.classList.toggle("hh-hidden", phase !== "puzzle");
    this.resultEl?.classList.toggle("hh-hidden", phase !== "result");
    if (phase === "room") this.renderRoom();
    if (phase === "puzzle") this.renderPuzzle();
    if (phase === "result") this.renderResult();
  }

  startGame() {
    this.startBgm();
    this.state.phase = "room";
    this.state.roomIndex = 0;
    this.state.timeLeft = ROOM_TIME;
    this.render();
    this.startRoomTimer();
  }

  renderRoom() {
    const room = ROOMS[this.state.roomIndex];
    if (!room || !this.roomBgEl || !this.roomSignEl || !this.roomTitleEl || !this.timeEl || !this.roomItemsEl || !this.roomStageEl) return;
    this.roomBgEl.style.backgroundImage = `url('${room.background}')`;
    this.roomSignEl.src = room.sign;
    this.roomTitleEl.textContent = room.title;
    this.timeEl.textContent = `${this.state.timeLeft}`;
    this.roomItemsEl.innerHTML = room.items.map((item) => {
      const found = this.state.roomFound[item.id];
      return `<img class="hh-item ${found ? "found" : "missing"}" src="${ITEMS[item.id].image}" alt="${ITEMS[item.id].label}" title="${ITEMS[item.id].label}"/>`;
    }).join("");
    this.roomStageEl.querySelectorAll(".hh-hit").forEach((node) => node.remove());
    room.items.forEach((item) => {
      if (this.state.roomFound[item.id]) return;
      const btn = document.createElement("button");
      btn.className = "hh-hit";
      btn.style.left = `${item.x}%`;
      btn.style.top = `${item.y}%`;
      btn.style.width = `${item.w}%`;
      btn.style.height = `${item.h}%`;
      btn.title = ITEMS[item.id].label;
      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        this.collectItem(item.id);
      });
      this.roomStageEl.appendChild(btn);
    });
  }

  collectItem(itemId) {
    if (this.state.phase !== "room" || this.state.roomFound[itemId]) return;
    this.state.roomFound[itemId] = true;
    if (!this.state.inventory.includes(itemId)) this.state.inventory.push(itemId);
    this.renderRoom();
    const room = ROOMS[this.state.roomIndex];
    if (room.items.every((item) => this.state.roomFound[item.id])) {
      this.scheduleTimeout(() => {
        if (!this.isCleaningUp) this.nextRoom();
      }, 280);
    }
  }

  startRoomTimer() {
    window.clearInterval(this.roomTimer);
    this.roomTimer = window.setInterval(() => {
      if (this.isCleaningUp || !this.root || this.state.phase !== "room") return;
      this.state.timeLeft -= 1;
      if (this.timeEl) this.timeEl.textContent = `${Math.max(0, this.state.timeLeft)}`;
      if (this.state.timeLeft > 0 && this.state.timeLeft <= 5) this.playSfx(`${ASSET_BASE}/sounds/heartbeat.mp3`, 0.22);
      if (this.state.timeLeft <= 0) this.nextRoom();
    }, 1000);
  }

  nextRoom() {
    if (this.state.transitioning) return;
    this.state.transitioning = true;
    this.playSfx(`${ASSET_BASE}/sounds/ghost_laugh.mp3`, 0.38);
    this.transitionEl?.classList.add("on");
    this.scheduleTimeout(() => {
      if (this.isCleaningUp || !this.root) return;
      this.state.roomIndex += 1;
      this.state.timeLeft = ROOM_TIME;
      this.state.transitioning = false;
      if (this.state.roomIndex >= ROOMS.length) {
        window.clearInterval(this.roomTimer);
        this.state.phase = "puzzle";
        this.state.dialogHtml = "คลิกผีเพื่อฟังเรื่องราวของพวกเขา จากนั้นเลือกไอเท็มแล้วคลิกมอบของ";
        this.render();
      } else {
        this.renderRoom();
      }
      this.transitionEl?.classList.remove("on");
    }, 850);
  }

  renderPuzzle() {
    if (!this.dialogEl || !this.ghostsEl || !this.inventoryEl) return;
    this.dialogEl.innerHTML = this.state.dialogHtml;
    this.ghostsEl.innerHTML = GHOSTS.map((ghost) => {
      const given = this.state.ghostGiven[ghost.id] || [];
      const classes = ["hh-ghost", this.state.unlockedGhostId === ghost.id ? "active" : "", given.length === 1 ? "partial" : "", given.length >= 2 ? "saved" : ""].filter(Boolean).join(" ");
      const slots = [0, 1].map((index) => `<div class="hh-slot">${given[index] ? `<img src="${ITEMS[given[index]].image}" alt="${ITEMS[given[index]].label}"/>` : ""}</div>`).join("");
      return `<div class="${classes}"><button data-ghost="${ghost.id}" aria-label="${ghost.name}"><img src="${ghost.image}" alt="${ghost.name}"/></button><div class="hh-ghostlabel" style="color:${ghost.accent}">${ghost.name}</div><div class="hh-slots">${slots}</div></div>`;
    }).join("");
    this.inventoryEl.innerHTML = this.state.inventory.length ? this.state.inventory.map((itemId) => `<button class="hh-itembtn ${this.state.selectedItem === itemId ? "sel" : ""}" data-item="${itemId}" aria-label="${ITEMS[itemId].label}"><img src="${ITEMS[itemId].image}" alt="${ITEMS[itemId].label}"/></button>`).join("") : `<div class="hh-chip">ของในมือหมดแล้ว กดดูผลลัพธ์ได้เลย</div>`;
    this.ghostsEl.querySelectorAll("button[data-ghost]").forEach((button) => button.addEventListener("click", () => this.handleGhost(button.dataset.ghost)));
    this.inventoryEl.querySelectorAll("button[data-item]").forEach((button) => button.addEventListener("click", () => {
      const itemId = button.dataset.item;
      this.state.selectedItem = this.state.selectedItem === itemId ? null : itemId;
      this.renderPuzzle();
    }));
  }

  handleGhost(ghostId) {
    const ghost = GHOSTS.find((entry) => entry.id === ghostId);
    if (!ghost) return;
    if (this.state.selectedItem) return this.giveItem(ghost, this.state.selectedItem);
    this.state.unlockedGhostId = ghostId;
    this.playVoice(ghost.voice);
    this.typeDialog(`<strong>${ghost.name}</strong>: ${ghost.story}`);
    if ((this.state.ghostGiven[ghost.id] || []).length >= 2) {
      this.state.dialogHtml = `<strong>${ghost.name}</strong>: ข้าได้รับสิ่งที่ต้องการครบแล้ว วิญญาณของข้ากำลังเลือนหาย...`;
      this.renderPuzzle();
    }
  }

  giveItem(ghost, itemId) {
    const given = this.state.ghostGiven[ghost.id] || [];
    if (this.state.unlockedGhostId !== ghost.id) return this.typeDialog(`<strong>${ghost.name}</strong>: เจ้าต้องคุยกับข้าก่อน ข้าจึงจะรับของจากเจ้าได้...`);
    if (given.length >= 2) return this.typeDialog(`<strong>${ghost.name}</strong>: ข้าไม่อาจรับสิ่งใดเพิ่มได้อีกแล้ว...`);
    this.state.ghostGiven[ghost.id] = [...given, itemId];
    this.state.inventory = this.state.inventory.filter((entry) => entry !== itemId);
    this.state.selectedItem = null;
    const correctCount = this.state.ghostGiven[ghost.id].filter((entry) => ghost.needs.includes(entry)).length;
    const message = this.state.ghostGiven[ghost.id].length === 1
      ? `<strong>${ghost.name}</strong>: ฉันรับของชิ้นแรกแล้ว... ${correctCount > 0 ? "มันใกล้เคียงกับสิ่งที่ฉันเฝ้ารอ" : "แต่มันยังไม่ใช่ทั้งหมด"}`
      : `<strong>${ghost.name}</strong>: ความปรารถนาของฉัน${correctCount === 2 ? "สมบูรณ์แล้ว" : "คลี่คลายลงบางส่วน"}... ขอบคุณที่มาที่นี่`;
    this.typeDialog(message);
    this.renderPuzzle();
    if (this.state.inventory.length === 0) {
      this.scheduleTimeout(() => {
        if (!this.isCleaningUp) this.finishPuzzle();
      }, 1500);
    }
  }

  finishPuzzle() {
    this.state.score = this.calculateScore();
    this.state.phase = "result";
    this.stopBgm();
    this.render();
  }

  calculateScore() {
    let total = 0;
    GHOSTS.forEach((ghost) => {
      const given = this.state.ghostGiven[ghost.id] || [];
      const correct = given.filter((itemId) => ghost.needs.includes(itemId)).length;
      total += given.length === 2 && correct === 2 ? 40 : correct * 10;
    });
    total += this.state.inventory.length * 10;
    return total;
  }

  renderResult() {
    if (!this.scoreEl || !this.summaryEl) return;
    this.scoreEl.textContent = `${this.state.score} / ${MAX_SCORE}`;
    this.summaryEl.innerHTML = GHOSTS.map((ghost) => {
      const given = this.state.ghostGiven[ghost.id] || [];
      const correct = given.filter((itemId) => ghost.needs.includes(itemId)).length;
      const text = given.length === 2 && correct === 2 ? "ปลดปล่อยสำเร็จ 40 คะแนน" : `มอบถูก ${correct}/2 ชิ้น ได้ ${correct * 10} คะแนน`;
      return `<div class="hh-row"><span>${ghost.name}</span><span>${text}</span></div>`;
    }).join("") + `<div class="hh-row"><span>ของที่ถือกลับมา</span><span>${this.state.inventory.length} ชิ้น ได้ ${this.state.inventory.length * 10} คะแนน</span></div>`;
  }

  finishScene() {
    this.onGameEnd?.({
      score: this.state.score ?? 0,
      game: "HauntedHouse",
      meta: {
        misses: this.state.misses,
        remainingItems: [...this.state.inventory],
        ghostReceivedItems: this.state.ghostGiven,
      },
    });
  }

  handleMiss() {
    if (this.state.phase !== "room" || !this.root) return;
    this.state.misses += 1;
    this.root?.classList.add("hh-shake");
    this.scheduleTimeout(() => this.root?.classList.remove("hh-shake"), 240);
    this.playSfx(`${ASSET_BASE}/sounds/ghost_scream.mp3`, 0.32);
  }

  typeDialog(html) {
    window.clearTimeout(this.typeTimer);
    const text = html.replace(/<[^>]+>/g, "");
    const titleMatch = html.match(/^<strong>(.*?)<\/strong>:\s*/);
    const title = titleMatch ? `<strong>${titleMatch[1]}</strong>: ` : "";
    const body = text.replace(/^.*?:\s*/, "");
    let index = 0;
    const step = () => {
      if (this.isCleaningUp || !this.root) return;
      this.state.dialogHtml = title + body.slice(0, index);
      if (this.dialogEl) this.dialogEl.innerHTML = this.state.dialogHtml;
      if (index < body.length) {
        index += 1;
        this.typeTimer = window.setTimeout(step, 24);
      }
    };
    step();
  }

  scheduleTimeout(callback, delay) {
    const timeoutId = window.setTimeout(() => {
      this.pendingTimeouts.delete(timeoutId);
      if (!this.isCleaningUp) {
        callback();
      }
    }, delay);
    this.pendingTimeouts.add(timeoutId);
    return timeoutId;
  }

  playSfx(src, volume = 0.4) {
    const audio = new Audio(src);
    audio.volume = volume;
    audio.play().catch(() => {});
  }

  playVoice(src) {
    if (this.activeVoice) {
      this.activeVoice.pause();
      this.activeVoice.currentTime = 0;
    }
    this.activeVoice = new Audio(src);
    this.activeVoice.volume = 0.42;
    this.activeVoice.play().catch(() => {});
  }

  startBgm() {
    if (this.bgm) return;
    this.bgm = new Audio(`${ASSET_BASE}/sounds/room_bgm.mp3`);
    this.bgm.loop = true;
    this.bgm.volume = 0.22;
    this.bgm.play().catch(() => {});
  }

  stopBgm() {
    if (!this.bgm) return;
    this.bgm.pause();
    this.bgm.currentTime = 0;
    this.bgm = null;
  }

  cleanup() {
    this.isCleaningUp = true;
    window.clearInterval(this.roomTimer);
    window.clearTimeout(this.typeTimer);
    this.pendingTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    this.pendingTimeouts.clear();
    this.activeVoice?.pause();
    this.stopBgm();
    if (this.root?.parentNode) this.root.parentNode.removeChild(this.root);
    this.root = null;
    this.dialogEl = null;
    this.timeEl = null;
    this.roomStageEl = null;
  }
}
