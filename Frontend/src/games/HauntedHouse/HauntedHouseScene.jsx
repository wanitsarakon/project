import Phaser from "phaser";

const ASSET_BASE = "/assets/hauntedgame";
const ROOM_TIME = 30;

const ROOMS = [
  {
    id: "living",
    name: "ห้องนั่งเล่นต้องสาป",
    sign: `${ASSET_BASE}/images/living_sign.png`,
    background: `${ASSET_BASE}/images/living.png`,
    items: [
      { id: "gun", label: "ปืน", x: 44, y: 69, w: 8, h: 9 },
      { id: "key", label: "กุญแจ", x: 3, y: 77, w: 7, h: 15 },
      { id: "scissors", label: "กรรไกร", x: 90, y: 75, w: 6, h: 9 },
    ],
  },
  {
    id: "bedroom",
    name: "ห้องนอนเงา",
    sign: `${ASSET_BASE}/images/bedroom_sign.png`,
    background: `${ASSET_BASE}/images/bedroom.png`,
    items: [
      { id: "blade", label: "มีดโกน", x: 15, y: 31, w: 7, h: 12 },
      { id: "med", label: "ยา", x: 83, y: 73, w: 6, h: 8 },
    ],
  },
  {
    id: "bathroom",
    name: "ห้องน้ำสะท้อนวิญญาณ",
    sign: `${ASSET_BASE}/images/bathroom_sign.png`,
    background: `${ASSET_BASE}/images/bathroom.png`,
    items: [
      { id: "coin", label: "เหรียญ", x: 13, y: 88, w: 5, h: 6 },
      { id: "lighter", label: "ไฟแช็ก", x: 95, y: 57, w: 4, h: 10 },
    ],
  },
  {
    id: "kid",
    name: "ห้องเด็กหลอน",
    sign: `${ASSET_BASE}/images/kid_sign.png`,
    background: `${ASSET_BASE}/images/kid.png`,
    items: [{ id: "toy", label: "ของเล่น", x: 91, y: 83, w: 7, h: 10 }],
  },
];

const GHOSTS = [
  {
    id: "woman",
    name: "แม่บ้านผู้เฝ้ากุญแจ",
    image: `${ASSET_BASE}/images/woman.png`,
    voice: `${ASSET_BASE}/sounds/woman_voice.mp3`,
    needs: ["key", "scissors"],
    story:
      "ลูกฉันถูกขังอยู่ในความมืด ฉันตามหากุญแจกับกรรไกรที่หายไป ช่วยส่งมันกลับมาให้ที...",
    accent: "#f1d4aa",
  },
  {
    id: "girl",
    name: "เด็กหญิงในฝันร้าย",
    image: `${ASSET_BASE}/images/girl.png`,
    voice: `${ASSET_BASE}/sounds/girl_voice.mp3`,
    needs: ["toy", "lighter"],
    story:
      "ฉันกลัวความมืดเหลือเกิน ของเล่นชิ้นโปรดกับแสงเล็กๆ จะทำให้ฉันสงบลงอีกครั้ง...",
    accent: "#ffd0d0",
  },
  {
    id: "man",
    name: "ชายผู้ติดค้าง",
    image: `${ASSET_BASE}/images/man.png`,
    voice: `${ASSET_BASE}/sounds/man_voice.mp3`,
    needs: ["blade", "med"],
    story:
      "ฉันจากไปพร้อมบาดแผลและความเจ็บปวด ถ้าได้ยาและมีดโกนคืนมา บางทีวิญญาณนี้คงไปต่อได้...",
    accent: "#d4e2ff",
  },
  {
    id: "maid",
    name: "สาวใช้ผู้เงียบงัน",
    image: `${ASSET_BASE}/images/maid.png`,
    voice: `${ASSET_BASE}/sounds/maid_voice.mp3`,
    needs: ["gun", "coin"],
    story:
      "ฉันถูกทิ้งให้เฝ้าคฤหาสน์นี้เพียงลำพัง ปืนกับเหรียญสุดท้ายคือสิ่งที่ฉันอยากเก็บไว้...",
    accent: "#e2d4ff",
  },
];

const ITEM_IMAGES = {
  key: `${ASSET_BASE}/images/key.png`,
  scissors: `${ASSET_BASE}/images/scissors.png`,
  toy: `${ASSET_BASE}/images/toy.png`,
  lighter: `${ASSET_BASE}/images/lighter.png`,
  blade: `${ASSET_BASE}/images/blade.png`,
  med: `${ASSET_BASE}/images/med.png`,
  gun: `${ASSET_BASE}/images/gun.png`,
  coin: `${ASSET_BASE}/images/coin.png`,
};

export default class HauntedHouseScene extends Phaser.Scene {
  constructor() {
    super({ key: "HauntedHouseScene" });
    this.onGameEnd = null;
    this.root = null;
    this.state = null;
    this.roomTimer = null;
    this.activeAudio = null;
    this.bgmAudio = null;
    this.typeTimer = null;
  }

  init(data = {}) {
    this.onGameEnd = data?.onGameEnd ?? null;
  }

  create() {
    this.state = {
      phase: "intro",
      roomIndex: 0,
      timeLeft: ROOM_TIME,
      inventory: [],
      selectedItem: null,
      unlockedGhostId: null,
      dialogText:
        "ที่นี่ไม่ใช่สถานที่ของคนเป็น เก็บของที่ตกค้างให้ครบ แล้วช่วยพวกเขาไปสู่ความสงบ...",
      ghostReceivedItems: Object.fromEntries(GHOSTS.map((ghost) => [ghost.id, []])),
      foundItems: {},
      score: 0,
      transitioning: false,
    };

    this.buildDom();
    this.render();

    this.events.once("shutdown", () => this.cleanup());
    this.events.once("destroy", () => this.cleanup());
  }

  buildDom() {
    const container = this.game.canvas?.parentElement;
    if (!container) return;

    this.root = document.createElement("div");
    this.root.innerHTML = `
      <style>
        .haunt-root{position:absolute;inset:0;overflow:hidden;background:#050505;color:#f6ead4;font-family:Kanit,sans-serif}
        .haunt-screen{position:absolute;inset:0;display:flex;flex-direction:column}
        .haunt-hidden{display:none!important}
        .haunt-bg{position:absolute;inset:0;background-size:cover;background-position:center;filter:brightness(.88)}
        .haunt-overlay{position:absolute;inset:0;background:radial-gradient(circle at center,rgba(0,0,0,.05),rgba(0,0,0,.68)),linear-gradient(180deg,rgba(11,5,5,.5),rgba(7,3,3,.86))}
        .haunt-topbar{position:relative;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:18px 22px;gap:16px}
        .haunt-sign{height:58px;max-width:min(45vw,360px);object-fit:contain;filter:drop-shadow(0 6px 18px rgba(0,0,0,.55))}
        .haunt-timer,.haunt-chip{background:rgba(18,7,6,.82);border:1px solid rgba(255,211,152,.24);border-radius:999px;padding:8px 16px;box-shadow:0 8px 18px rgba(0,0,0,.25);font-weight:700}
        .haunt-room{position:relative;flex:1}
        .haunt-hitbox{position:absolute;transform:translate(-50%,-50%);border:none;border-radius:999px;cursor:pointer;background:radial-gradient(circle,rgba(255,214,111,.22),rgba(255,214,111,0));box-shadow:0 0 18px rgba(255,214,111,.22)}
        .haunt-hitbox:hover{box-shadow:0 0 22px rgba(255,225,150,.45)}
        .haunt-miss-layer{position:absolute;inset:0;cursor:crosshair}
        .haunt-hintbar,.haunt-inventory{position:relative;z-index:2;padding:14px 16px 18px;background:linear-gradient(180deg,rgba(13,5,5,0),rgba(7,3,3,.92) 30%)}
        .haunt-inventory{border-top:1px solid rgba(255,224,186,.1);background:linear-gradient(180deg,rgba(7,3,3,.15),rgba(7,3,3,.92))}
        .haunt-hinttext,.haunt-inventory-title{text-align:center;font-size:15px;color:#ffd89b}
        .haunt-items,.haunt-inventory-items{display:flex;justify-content:center;flex-wrap:wrap;gap:12px;margin-top:10px}
        .haunt-item,.haunt-inventory-button img{width:68px;height:68px;object-fit:contain}
        .haunt-item{padding:8px;border-radius:16px;background:rgba(255,255,255,.05);border:1px solid rgba(255,224,186,.08)}
        .haunt-item.missing{filter:grayscale(1) brightness(1.7);opacity:.2}
        .haunt-item.found{box-shadow:0 0 18px rgba(255,214,111,.45);background:rgba(255,238,184,.12)}
        .haunt-intro,.haunt-result{align-items:center;justify-content:center;padding:24px;background:radial-gradient(circle at top,rgba(91,19,19,.45),rgba(0,0,0,.88))}
        .haunt-grid{width:min(94vw,1120px);display:grid;grid-template-columns:minmax(180px,320px) minmax(280px,1fr);gap:28px;align-items:center}
        .haunt-npc{width:min(30vw,280px);justify-self:center;filter:drop-shadow(0 0 24px rgba(255,255,255,.16));animation:haunt-float 3s ease-in-out infinite}
        .haunt-card{background:url('${ASSET_BASE}/images/signboard_bg.png') center/100% 100% no-repeat;min-height:min(68vw,520px);padding:clamp(42px,5vw,78px) clamp(28px,6vw,76px);color:#2e0f08;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
        .haunt-title{margin:0;font-size:clamp(30px,5vw,54px);line-height:1.05;color:#9d1f1f}
        .haunt-copy{max-width:620px;margin-top:18px;font-size:clamp(16px,2vw,22px);line-height:1.6;color:#f7eee1;text-shadow:0 2px 6px rgba(0,0,0,.45)}
        .haunt-button{margin-top:24px;border:none;border-radius:999px;padding:13px 28px;background:linear-gradient(180deg,#7f1717,#3c0606);color:#fff3df;font:inherit;font-weight:700;cursor:pointer;box-shadow:0 12px 22px rgba(0,0,0,.32)}
        .haunt-puzzle{background:linear-gradient(180deg,rgba(0,0,0,.46),rgba(0,0,0,.78)),url('${ASSET_BASE}/images/puzzlepage.png') center/cover no-repeat}
        .haunt-dialog{position:relative;z-index:2;margin:22px auto 0;width:min(88vw,920px);background:rgba(23,9,7,.88);border:2px solid rgba(224,192,151,.45);border-radius:22px;padding:18px 26px;font-size:20px;line-height:1.55;min-height:95px}
        .haunt-ghosts{position:relative;z-index:2;flex:1;display:flex;align-items:flex-end;justify-content:center;gap:min(2vw,22px);padding:28px 18px 160px;flex-wrap:wrap}
        .haunt-ghost{width:min(20vw,180px);min-width:120px;display:flex;flex-direction:column;align-items:center;gap:10px}
        .haunt-ghost button{border:none;background:none;cursor:pointer;padding:0}
        .haunt-ghost img{width:100%;max-height:min(34vw,340px);object-fit:contain;transition:220ms ease;filter:brightness(.72)}
        .haunt-ghost button:hover img,.haunt-ghost.active img{transform:translateY(-4px) scale(1.03);filter:brightness(1.02) drop-shadow(0 0 18px rgba(255,214,111,.32))}
        .haunt-ghost.partial img{opacity:.56}
        .haunt-ghost.saved img{opacity:.08;transform:translateY(-26px) scale(.82);filter:brightness(1.8) blur(3px);pointer-events:none}
        .haunt-ghost-label{text-align:center;font-size:15px}
        .haunt-ghost-slots{display:flex;gap:8px}
        .haunt-slot{width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.08);border:1px dashed rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;overflow:hidden}
        .haunt-slot img{width:100%;height:100%;object-fit:contain;filter:none}
        .haunt-inventory-button{border:1px solid rgba(255,224,186,.12);border-radius:14px;background:rgba(255,255,255,.05);padding:8px;cursor:pointer;transition:160ms ease}
        .haunt-inventory-button.selected{background:rgba(255,215,128,.16);box-shadow:0 0 0 2px rgba(255,215,128,.32);transform:translateY(-2px)}
        .haunt-summary{margin-top:22px;display:grid;gap:10px;width:min(100%,560px)}
        .haunt-summary-row{display:flex;justify-content:space-between;gap:12px;padding:10px 14px;border-radius:14px;background:rgba(255,255,255,.08);color:#f7eee1;font-size:16px}
        .haunt-result-score{margin-top:16px;font-size:clamp(40px,7vw,72px);font-weight:800;color:#ffd89b}
        .haunt-flash{animation:haunt-flash 240ms ease}
        .haunt-transition{position:absolute;inset:0;z-index:8;background:radial-gradient(circle,rgba(82,13,13,.25),rgba(0,0,0,.95));opacity:0;pointer-events:none;transition:opacity 360ms ease}
        .haunt-transition.active{opacity:1}
        @keyframes haunt-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}
        @keyframes haunt-flash{0%{box-shadow:inset 0 0 0 rgba(190,0,0,0)}50%{box-shadow:inset 0 0 180px rgba(190,0,0,.45)}100%{box-shadow:inset 0 0 0 rgba(190,0,0,0)}}
        @media (max-width:860px){.haunt-grid{grid-template-columns:1fr}.haunt-npc{width:min(48vw,220px)}.haunt-card{min-height:420px}.haunt-dialog{font-size:17px;min-height:120px}.haunt-ghosts{padding-bottom:190px}.haunt-ghost{width:min(36vw,150px)}}
      </style>
      <div class="haunt-root">
        <div id="haunt-intro" class="haunt-screen haunt-intro">
          <div class="haunt-grid">
            <img class="haunt-npc" src="${ASSET_BASE}/images/npc.png" alt="npc" />
            <div class="haunt-card">
              <h1 class="haunt-title">บ้านผีสิง</h1>
              <div class="haunt-copy">สำรวจ 4 ห้องให้ทันเวลา เก็บของที่ซ่อนอยู่ และนำสิ่งของเหล่านั้นไปปลดปล่อยวิญญาณที่ยังติดค้างอยู่ในคฤหาสน์แห่งนี้</div>
              <button id="haunt-start-btn" class="haunt-button">เริ่มล่าดวงวิญญาณ</button>
            </div>
          </div>
        </div>
        <div id="haunt-room-screen" class="haunt-screen haunt-hidden">
          <div id="haunt-room-bg" class="haunt-bg"></div>
          <div class="haunt-overlay"></div>
          <div class="haunt-topbar">
            <img id="haunt-room-sign" class="haunt-sign" alt="room sign" />
            <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end">
              <div id="haunt-room-label" class="haunt-chip"></div>
              <div class="haunt-timer">เวลา <span id="haunt-time">30</span></div>
            </div>
          </div>
          <div id="haunt-room" class="haunt-room"><div id="haunt-miss-layer" class="haunt-miss-layer"></div></div>
          <div class="haunt-hintbar">
            <div class="haunt-hinttext">หาไอเท็มที่ผีทิ้งไว้ในห้องนี้ให้ครบก่อนเวลาหมด</div>
            <div id="haunt-room-items" class="haunt-items"></div>
          </div>
        </div>
        <div id="haunt-puzzle" class="haunt-screen haunt-puzzle haunt-hidden">
          <div id="haunt-dialog" class="haunt-dialog"></div>
          <div id="haunt-ghosts" class="haunt-ghosts"></div>
          <div class="haunt-inventory">
            <div class="haunt-inventory-title">เลือกไอเท็ม แล้วคลิกผีที่คุณเพิ่งคุยด้วยเพื่อมอบของ</div>
            <div id="haunt-inventory-items" class="haunt-inventory-items"></div>
            <div style="display:flex;justify-content:center"><button id="haunt-result-btn" class="haunt-button" style="margin-top:16px">ดูผลลัพธ์</button></div>
          </div>
        </div>
        <div id="haunt-result" class="haunt-screen haunt-result haunt-hidden">
          <div class="haunt-grid">
            <img class="haunt-npc" src="${ASSET_BASE}/images/npc1.png" alt="npc" />
            <div class="haunt-card">
              <h2 class="haunt-title">บทสรุปดวงวิญญาณ</h2>
              <div class="haunt-copy">วิญญาณแต่ละตนจะสงบลงมากขึ้นเมื่อได้รับของที่ต้องการครบ คุณยังได้คะแนนจากของที่เก็บกลับมาเหลืออยู่ด้วย</div>
              <div id="haunt-result-score" class="haunt-result-score">0 / 160</div>
              <div id="haunt-summary" class="haunt-summary"></div>
              <button id="haunt-finish-btn" class="haunt-button">กลับไปแผนที่</button>
            </div>
          </div>
        </div>
        <div id="haunt-transition" class="haunt-transition"></div>
      </div>
    `;

    container.appendChild(this.root);

    this.introEl = this.root.querySelector("#haunt-intro");
    this.roomScreenEl = this.root.querySelector("#haunt-room-screen");
    this.roomBgEl = this.root.querySelector("#haunt-room-bg");
    this.roomEl = this.root.querySelector("#haunt-room");
    this.roomSignEl = this.root.querySelector("#haunt-room-sign");
    this.roomLabelEl = this.root.querySelector("#haunt-room-label");
    this.timeEl = this.root.querySelector("#haunt-time");
    this.roomItemsEl = this.root.querySelector("#haunt-room-items");
    this.missLayerEl = this.root.querySelector("#haunt-miss-layer");
    this.puzzleEl = this.root.querySelector("#haunt-puzzle");
    this.dialogEl = this.root.querySelector("#haunt-dialog");
    this.ghostsEl = this.root.querySelector("#haunt-ghosts");
    this.inventoryEl = this.root.querySelector("#haunt-inventory-items");
    this.resultEl = this.root.querySelector("#haunt-result");
    this.resultScoreEl = this.root.querySelector("#haunt-result-score");
    this.summaryEl = this.root.querySelector("#haunt-summary");
    this.transitionEl = this.root.querySelector("#haunt-transition");

    this.root.querySelector("#haunt-start-btn")?.addEventListener("click", () => this.startGame());
    this.root.querySelector("#haunt-result-btn")?.addEventListener("click", () => this.finishPuzzle());
    this.root.querySelector("#haunt-finish-btn")?.addEventListener("click", () => {
      this.onGameEnd?.({
        score: this.state?.score ?? 0,
        game: "HauntedHouse",
        meta: {
          remainingItems: [...(this.state?.inventory ?? [])],
          ghostReceivedItems: this.state?.ghostReceivedItems ?? {},
        },
      });
    });
    this.missLayerEl?.addEventListener("click", (event) => {
      if (event.target === this.missLayerEl) this.handleMissClick();
    });
  }

  render() {
    if (!this.root) return;

    const { phase } = this.state;
    this.introEl?.classList.toggle("haunt-hidden", phase !== "intro");
    this.roomScreenEl?.classList.toggle("haunt-hidden", phase !== "room");
    this.puzzleEl?.classList.toggle("haunt-hidden", phase !== "puzzle");
    this.resultEl?.classList.toggle("haunt-hidden", phase !== "result");

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
    if (!room) return;

    if (this.roomBgEl) this.roomBgEl.style.backgroundImage = `url('${room.background}')`;
    if (this.roomSignEl) this.roomSignEl.src = room.sign;
    if (this.roomLabelEl) this.roomLabelEl.textContent = room.name;
    if (this.timeEl) this.timeEl.textContent = String(this.state.timeLeft);

    if (this.roomItemsEl) {
      this.roomItemsEl.innerHTML = room.items
        .map((item) => {
          const found = Boolean(this.state.foundItems[item.id]);
          return `<img class="haunt-item ${found ? "found" : "missing"}" src="${ITEM_IMAGES[item.id]}" alt="${item.label}" title="${item.label}" />`;
        })
        .join("");
    }

    this.roomEl?.querySelectorAll(".haunt-hitbox").forEach((node) => node.remove());
    room.items.forEach((item) => {
      if (this.state.foundItems[item.id]) return;

      const button = document.createElement("button");
      button.className = "haunt-hitbox";
      button.style.left = `${item.x}%`;
      button.style.top = `${item.y}%`;
      button.style.width = `${item.w}%`;
      button.style.height = `${item.h}%`;
      button.title = item.label;
      button.setAttribute("aria-label", item.label);
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        this.collectItem(item.id);
      });
      this.roomEl?.appendChild(button);
    });
  }

  collectItem(itemId) {
    if (this.state.phase !== "room" || this.state.foundItems[itemId]) return;

    this.state.foundItems[itemId] = true;
    if (!this.state.inventory.includes(itemId)) {
      this.state.inventory.push(itemId);
    }

    this.renderRoom();

    const room = ROOMS[this.state.roomIndex];
    if (room.items.every((item) => this.state.foundItems[item.id])) {
      window.setTimeout(() => this.moveToNextRoom(), 280);
    }
  }

  startRoomTimer() {
    window.clearInterval(this.roomTimer);
    this.roomTimer = window.setInterval(() => {
      if (this.state.phase !== "room") return;
      this.state.timeLeft -= 1;
      if (this.timeEl) this.timeEl.textContent = String(Math.max(0, this.state.timeLeft));

      if (this.state.timeLeft > 0 && this.state.timeLeft <= 5) {
        this.playAudio(`${ASSET_BASE}/sounds/heartbeat.mp3`, {
          interrupt: false,
          volume: 0.25,
        });
      }

      if (this.state.timeLeft <= 0) {
        this.moveToNextRoom();
      }
    }, 1000);
  }

  moveToNextRoom() {
    if (this.state.transitioning) return;
    this.state.transitioning = true;
    this.playAudio(`${ASSET_BASE}/sounds/ghost_laugh.mp3`, { interrupt: false, volume: 0.45 });
    this.transitionEl?.classList.add("active");

    window.setTimeout(() => {
      this.state.roomIndex += 1;
      this.state.timeLeft = ROOM_TIME;
      this.state.transitioning = false;

      if (this.state.roomIndex >= ROOMS.length) {
        window.clearInterval(this.roomTimer);
        this.state.phase = "puzzle";
        this.state.dialogText =
          "คลิกผีเพื่อฟังเรื่องราวของพวกเขา จากนั้นเลือกไอเท็มด้านล่างแล้วคลิกผีคนนั้นอีกครั้งเพื่อมอบของ";
        this.render();
      } else {
        this.renderRoom();
      }

      this.transitionEl?.classList.remove("active");
    }, 850);
  }

  renderPuzzle() {
    if (this.dialogEl) {
      this.dialogEl.innerHTML = this.state.dialogText;
    }

    if (this.ghostsEl) {
      this.ghostsEl.innerHTML = GHOSTS.map((ghost) => {
        const received = this.state.ghostReceivedItems[ghost.id] ?? [];
        const isSaved = received.length >= 2;
        const classes = [
          "haunt-ghost",
          this.state.unlockedGhostId === ghost.id ? "active" : "",
          received.length === 1 ? "partial" : "",
          isSaved ? "saved" : "",
        ]
          .filter(Boolean)
          .join(" ");

        const slotMarkup = [0, 1]
          .map((index) => {
            const itemId = received[index];
            return `<div class="haunt-slot">${itemId ? `<img src="${ITEM_IMAGES[itemId]}" alt="${itemId}" />` : ""}</div>`;
          })
          .join("");

        return `
          <div class="${classes}">
            <button data-ghost-id="${ghost.id}" aria-label="${ghost.name}">
              <img src="${ghost.image}" alt="${ghost.name}" />
            </button>
            <div class="haunt-ghost-label" style="color:${ghost.accent};">${ghost.name}</div>
            <div class="haunt-ghost-slots">${slotMarkup}</div>
          </div>
        `;
      }).join("");

      this.ghostsEl.querySelectorAll("button[data-ghost-id]").forEach((button) => {
        button.addEventListener("click", () => {
          const ghostId = button.getAttribute("data-ghost-id");
          if (ghostId) this.handleGhostClick(ghostId);
        });
      });
    }

    if (this.inventoryEl) {
      this.inventoryEl.innerHTML = this.state.inventory.length
        ? this.state.inventory
            .map((itemId) => {
              const selected = this.state.selectedItem === itemId ? "selected" : "";
              return `
                <button class="haunt-inventory-button ${selected}" data-item-id="${itemId}" aria-label="${itemId}">
                  <img src="${ITEM_IMAGES[itemId]}" alt="${itemId}" />
                </button>
              `;
            })
            .join("")
        : `<div class="haunt-chip">ของในมือหมดแล้ว กดดูผลลัพธ์ได้เลย</div>`;

      this.inventoryEl.querySelectorAll("button[data-item-id]").forEach((button) => {
        button.addEventListener("click", () => {
          const itemId = button.getAttribute("data-item-id");
          if (!itemId) return;
          this.state.selectedItem = this.state.selectedItem === itemId ? null : itemId;
          this.renderPuzzle();
        });
      });
    }
  }

  handleGhostClick(ghostId) {
    const ghost = GHOSTS.find((entry) => entry.id === ghostId);
    if (!ghost) return;

    const received = this.state.ghostReceivedItems[ghost.id] ?? [];
    if (this.state.selectedItem) {
      this.giveItemToGhost(ghost, this.state.selectedItem);
      return;
    }

    this.state.unlockedGhostId = ghostId;
    this.playAudio(ghost.voice, { interrupt: true, volume: 0.42 });
    this.typeDialog(`<strong>${ghost.name}</strong>: ${ghost.story}`);
    this.renderPuzzle();

    if (received.length >= 2) {
      this.state.dialogText = `<strong>${ghost.name}</strong>: ข้าได้รับสิ่งที่ต้องการครบแล้ว วิญญาณของข้ากำลังเลือนหาย...`;
      this.renderPuzzle();
    }
  }

  giveItemToGhost(ghost, itemId) {
    const received = this.state.ghostReceivedItems[ghost.id] ?? [];

    if (this.state.unlockedGhostId !== ghost.id) {
      this.typeDialog(`<strong>${ghost.name}</strong>: เจ้าต้องคุยกับข้าก่อน ข้าจึงจะรับของจากเจ้าได้...`);
      return;
    }

    if (received.length >= 2) {
      this.typeDialog(`<strong>${ghost.name}</strong>: ข้าไม่อาจรับสิ่งใดเพิ่มได้อีกแล้ว...`);
      return;
    }

    this.state.ghostReceivedItems[ghost.id] = [...received, itemId];
    this.state.inventory = this.state.inventory.filter((entry) => entry !== itemId);
    this.state.selectedItem = null;

    const correctCount = this.state.ghostReceivedItems[ghost.id].filter((entry) =>
      ghost.needs.includes(entry)
    ).length;

    if (this.state.ghostReceivedItems[ghost.id].length === 1) {
      this.typeDialog(
        `<strong>${ghost.name}</strong>: ฉันรับของชิ้นแรกแล้ว... ${correctCount > 0 ? "มันใกล้เคียงกับสิ่งที่ฉันรออยู่" : "แต่มันยังไม่ใช่ทั้งหมด"}`
      );
    } else {
      this.typeDialog(
        `<strong>${ghost.name}</strong>: ความปรารถนาของฉัน${correctCount === 2 ? "สมบูรณ์แล้ว" : "คลี่คลายลงบางส่วน"}... ขอบคุณที่มาที่นี่`
      );
    }

    this.renderPuzzle();

    if (this.state.inventory.length === 0) {
      window.setTimeout(() => this.finishPuzzle(), 1500);
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
      const received = this.state.ghostReceivedItems[ghost.id] ?? [];
      const correctCount = received.filter((itemId) => ghost.needs.includes(itemId)).length;
      const isSaved = received.length === ghost.needs.length && correctCount === ghost.needs.length;

      if (isSaved) total += 40;
      else total += correctCount * 10;
    });

    total += this.state.inventory.length * 10;
    return total;
  }

  renderResult() {
    const score = this.state.score ?? this.calculateScore();
    if (this.resultScoreEl) {
      this.resultScoreEl.textContent = `${score} / 160`;
    }

    if (this.summaryEl) {
      this.summaryEl.innerHTML =
        GHOSTS.map((ghost) => {
          const received = this.state.ghostReceivedItems[ghost.id] ?? [];
          const correctCount = received.filter((itemId) => ghost.needs.includes(itemId)).length;
          const isSaved = received.length === ghost.needs.length && correctCount === ghost.needs.length;
          const summary = isSaved
            ? "ปลดปล่อยสำเร็จ 40 คะแนน"
            : `มอบถูก ${correctCount}/2 ชิ้น ได้ ${correctCount * 10} คะแนน`;

          return `
            <div class="haunt-summary-row">
              <span>${ghost.name}</span>
              <span>${summary}</span>
            </div>
          `;
        }).join("") +
        `
          <div class="haunt-summary-row">
            <span>ของที่ถือกลับมา</span>
            <span>${this.state.inventory.length} ชิ้น ได้ ${this.state.inventory.length * 10} คะแนน</span>
          </div>
        `;
    }
  }

  handleMissClick() {
    if (this.state.phase !== "room") return;
    this.root?.classList.add("haunt-flash");
    window.setTimeout(() => this.root?.classList.remove("haunt-flash"), 260);
    this.playAudio(`${ASSET_BASE}/sounds/ghost_scream.mp3`, { interrupt: false, volume: 0.4 });
  }

  typeDialog(html) {
    this.state.dialogText = "";
    if (!this.dialogEl) return;

    window.clearTimeout(this.typeTimer);
    const plainText = html.replace(/<[^>]+>/g, "");
    const titleMatch = html.match(/^<strong>(.*?)<\/strong>:\s*/);
    const body = plainText.replace(/^.*?:\s*/, "");
    let index = 0;

    const renderNext = () => {
      const title = titleMatch ? `<strong>${titleMatch[1]}</strong>: ` : "";
      this.state.dialogText = title + body.slice(0, index);
      if (this.dialogEl) this.dialogEl.innerHTML = this.state.dialogText;

      if (index < body.length) {
        index += 1;
        this.typeTimer = window.setTimeout(renderNext, 24);
      }
    };

    renderNext();
  }

  playAudio(src, { interrupt = true, volume = 0.5 } = {}) {
    if (interrupt && this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.currentTime = 0;
    }

    const audio = new Audio(src);
    audio.volume = volume;
    audio.play().catch(() => {});

    if (interrupt) this.activeAudio = audio;
    return audio;
  }

  startBgm() {
    if (this.bgmAudio) return;
    this.bgmAudio = new Audio(`${ASSET_BASE}/sounds/room_bgm.mp3`);
    this.bgmAudio.loop = true;
    this.bgmAudio.volume = 0.26;
    this.bgmAudio.play().catch(() => {});
  }

  stopBgm() {
    if (!this.bgmAudio) return;
    this.bgmAudio.pause();
    this.bgmAudio.currentTime = 0;
    this.bgmAudio = null;
  }

  cleanup() {
    window.clearInterval(this.roomTimer);
    window.clearTimeout(this.typeTimer);

    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio = null;
    }

    this.stopBgm();

    if (this.root?.parentNode) {
      this.root.parentNode.removeChild(this.root);
    }

    this.root = null;
  }
}
