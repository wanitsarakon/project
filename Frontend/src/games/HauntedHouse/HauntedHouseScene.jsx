import Phaser from "phaser";

const ASSET_BASE = "/assets/hauntedgame";
const ROOM_TIME = 30;
const MAX_SCORE = 160;
const INTRO_TYPING_SPEED = 90;
const PUZZLE_TYPING_SPEED = 90;
const PICKUP_SOURCES = [
  `${ASSET_BASE}/sounds/pickup.mp3`,
  "/tugofwar/sounds/pick.mp3",
];

const INTRO_MESSAGE = "ยินดีต้อนรับสู่บ้านหลังนี้... ภารกิจของเจ้าคือรวบรวมไอเท็มทั้งหมดเพื่อปลดปล่อยพวกเรา ระวังให้ดีล่ะ หากเจ้าให้ของผิดคน... วิญญาณจะไม่ได้รับการปลดปล่อย";
const INTRO_TITLE = "ด่านเกมบ้านผีสิง";
const INTRO_SUBTITLE = "จงรวบรวมความกล้าเพื่อปลดปล่อยวิญญาณ...";
const PUZZLE_HINT = "นี่คือสิ่งของที่ท่านหามาได้ (ลากไอเท็มไปวางที่ผีเพื่อปลดปล่อย)";
const INITIAL_DIALOG = "คลิกที่ผีเพื่อฟังเรื่องราวของพวกเขา...";

const ITEMS = {
  key: { label: "กุญแจ", image: `${ASSET_BASE}/images/key.png` },
  scissors: { label: "กรรไกร", image: `${ASSET_BASE}/images/scissors.png` },
  blade: { label: "ใบมีด", image: `${ASSET_BASE}/images/blade.png` },
  med: { label: "ขวดยา", image: `${ASSET_BASE}/images/med.png` },
  gun: { label: "ปืน", image: `${ASSET_BASE}/images/gun.png` },
  coin: { label: "เหรียญ", image: `${ASSET_BASE}/images/coin.png` },
  toy: { label: "ของเล่น", image: `${ASSET_BASE}/images/toy.png` },
  lighter: { label: "ไฟแช็ก", image: `${ASSET_BASE}/images/lighter.png` },
};

const ROOMS = [
  { id: "living", items: [{ id: "key", x: 42, y: 63, w: 6, h: 5 }, { id: "scissors", x: 90, y: 67, w: 6, h: 7 }] },
  { id: "bathroom", items: [{ id: "blade", x: 21, y: 90, w: 5, h: 3 }, { id: "med", x: 92, y: 8, w: 4, h: 8 }] },
  { id: "bedroom", items: [{ id: "gun", x: 15, y: 65, w: 8, h: 12 }, { id: "coin", x: 85, y: 88, w: 6, h: 6 }] },
  { id: "kid", items: [{ id: "toy", x: 89, y: 88, w: 8, h: 10 }, { id: "lighter", x: 46, y: 28, w: 6, h: 5 }] },
];

const GHOSTS = [
  { id: "woman", image: `${ASSET_BASE}/images/woman.png`, voice: `${ASSET_BASE}/sounds/woman_voice.mp3`, req: ["key", "scissors"], story: "เสียงฝีเท้าใกล้เข้ามา... ฉันพยายามไขประตูแต่มันไม่ขยับ ฉันแค่หยิบสิ่งนี้มาป้องกันตัว แต่ก็ไม่ทันเสียแล้ว" },
  { id: "girl", image: `${ASSET_BASE}/images/girl.png`, voice: `${ASSET_BASE}/sounds/girl_voice.mp3`, req: ["toy", "lighter"], story: "แม่บอกว่าอย่าจุดไฟเล่น... แต่แสงมันสวย ฉันกอดตุ๊กตาแน่นมาก แล้วทุกอย่างก็... มืดไปเลย" },
  { id: "man", image: `${ASSET_BASE}/images/man.png`, voice: `${ASSET_BASE}/sounds/man_voice.mp3`, req: ["blade", "med"], story: "ผมไม่ได้อยากตาย... แค่อยากให้ความเจ็บปวดนี้จบลง มือหนึ่งถือขวด อีกมือคว้าของคมกริบ... แล้วสติก็หลุดลอยไป" },
  { id: "maid", image: `${ASSET_BASE}/images/maid.png`, voice: `${ASSET_BASE}/sounds/maid_voice.mp3`, req: ["gun", "coin"], story: "ดิฉันแค่จะเก็บเศษเงินคืนนายท่าน... แต่กระบอกเหล็กเย็นเฉียบกลับจ่อที่หลัง เสียงดังสนั่นนั่นทำให้ทุกอย่างดับวูบ" },
];

const roomSign = (roomId) => `${ASSET_BASE}/images/${roomId}_sign.png`;
const roomBg = (roomId) => `${ASSET_BASE}/images/${roomId}.png`;
const createGhostMap = () => Object.fromEntries(GHOSTS.map((ghost) => [ghost.id, []]));
const createUnlockMap = () => Object.fromEntries(GHOSTS.map((ghost) => [ghost.id, false]));

export default class HauntedHouseScene extends Phaser.Scene {
  constructor() {
    super({ key: "HauntedHouseScene" });
    this.onGameEnd = null;
    this.root = null;
    this.state = null;
    this.roomTimer = null;
    this.typeTimer = null;
    this.voiceAudio = null;
    this.bgm = null;
    this.isCleaningUp = false;
    this.pendingTimeouts = new Set();
    this.transitioning = false;
    this.finished = false;
  }

  init(data = {}) {
    this.onGameEnd = data?.onGameEnd ?? null;
  }

  create() {
    this.isCleaningUp = false;
    this.finished = false;
    this.transitioning = false;
    this.pendingTimeouts.clear();
    this.state = {
      phase: "intro",
      currentRoom: 0,
      timeLeft: ROOM_TIME,
      inventory: [],
      roomFound: {},
      ghostReceivedItems: createGhostMap(),
      ghostUnlocked: createUnlockMap(),
      activeGhostId: null,
      dialogText: INITIAL_DIALOG,
      score: 0,
      misses: 0,
    };
    this.mount();
    this.render();
    this.scheduleTimeout(() => this.startIntroSequence(), 500);
    this.events.once("shutdown", () => this.cleanup());
    this.events.once("destroy", () => this.cleanup());
  }

  mount() {
    const host = this.game.canvas?.parentElement;
    if (!host) return;
    if (window.getComputedStyle(host).position === "static") host.style.position = "relative";

    this.root = document.createElement("div");
    this.root.innerHTML = `
<style>
.hhx-root{position:absolute;inset:0;overflow:hidden;background:#000;color:#fff;font-family:Kanit,"Courier New",monospace}.hhx-screen{position:absolute;inset:0}.hhx-hidden{display:none!important}.hhx-full-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 65%;z-index:1}.hhx-intro-screen,.hhx-result-screen{background:rgba(0,0,0,.95);display:flex;justify-content:center;align-items:center}.hhx-intro-container{position:relative;z-index:2;display:flex;align-items:center;justify-content:center;gap:40px;width:90%;max-width:1200px}.hhx-ghost-npc{height:500px;width:auto;filter:drop-shadow(0 0 15px rgba(255,255,255,.3));animation:hhx-float 3s ease-in-out infinite}.hhx-content-side{display:flex;flex-direction:column;align-items:center;gap:20px}.hhx-speech-bubble{position:relative;background:rgba(255,255,255,.95);border:4px solid #4a2c1a;border-radius:20px;padding:20px 30px;width:450px;color:#2c3e50;box-shadow:0 10px 25px rgba(0,0,0,.5)}.hhx-speech-bubble::after{content:"";position:absolute;left:-24px;top:50%;transform:translateY(-50%);border-width:12px 24px 12px 0;border-style:solid;border-color:transparent rgba(255,255,255,.95) transparent transparent}.hhx-bubble-text{font-size:1.2rem;line-height:1.4;font-weight:700;min-height:60px}.hhx-signboard{width:600px;min-height:400px;background:url('${ASSET_BASE}/images/signboard_bg.png') center/contain no-repeat;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:20px;box-sizing:border-box;text-align:center}.hhx-sign-title{color:#9d1f1f;font-size:3rem;font-weight:700;text-shadow:3px 3px 5px #000;margin-top:20px}.hhx-sign-subtitle{color:#f3ebe1;font-size:1.15rem;font-weight:700;max-width:420px;text-shadow:1px 1px 4px #000;margin-top:8px}.hhx-start-btn{padding:15px 70px;font-size:22px;font-weight:700;color:#fff;background:linear-gradient(to bottom,#8b0000,#4a0000);border:2px solid #ff4444;border-radius:5px;cursor:pointer;transition:all .2s;margin-top:20px;font-family:inherit}.hhx-start-btn:hover{transform:scale(1.06);background:#c62222}.hhx-main-menu-container{position:relative;width:100%;height:100%;background:#000;display:flex;justify-content:center;align-items:center;overflow:hidden}.hhx-main-logo-header{position:absolute;top:10px;left:50%;transform:translateX(-50%);z-index:10;pointer-events:none}.hhx-main-logo{width:60vw;max-width:500px;height:auto}.hhx-sign-wrapper{position:absolute;cursor:pointer;z-index:10}.hhx-pos-living{top:40%;left:25%}.hhx-pos-bathroom{top:40%;left:75%}.hhx-pos-bedroom{top:85%;left:25%}.hhx-pos-kid{top:85%;left:75%}.hhx-menu-sign{width:22vw;max-width:280px;transform:translateY(60px);transition:all .3s ease;filter:drop-shadow(0 0 8px rgba(0,0,0,.8))}.hhx-menu-sign:hover{transform:translateY(60px) scale(1.05);filter:drop-shadow(0 0 15px gold)}.hhx-menu-sign.hhx-locked{filter:grayscale(1) brightness(.7);opacity:.7;cursor:default}.hhx-sign-active{animation:hhx-impact .6s ease-out forwards}.hhx-room-container{position:relative;width:100%;height:100%;overflow:hidden}.hhx-room-header{position:absolute;top:15px;left:50%;transform:translateX(-50%);z-index:10}.hhx-room-sign{max-height:45px}.hhx-timer{position:absolute;top:15px;right:20px;z-index:10;background:rgba(139,0,0,.7);padding:5px 15px;border-radius:15px;font-size:1.2rem;border:1px solid #600;font-weight:700}.hhx-room-canvas{position:absolute;inset:0;background:center/100% 100% no-repeat;z-index:1;cursor:crosshair}.hhx-hit-target{position:absolute;border:none;background:transparent;cursor:pointer;z-index:3}.hhx-hint-bar{position:absolute;bottom:25px;left:50%;transform:translateX(-50%);z-index:10;background:rgba(0,0,0,.6);padding:15px 35px;border-radius:20px;border:1px solid rgba(255,255,255,.1);backdrop-filter:blur(5px);display:flex;flex-direction:column;align-items:center}.hhx-hint-text{color:#ffd700;font-size:.85rem;font-weight:700;margin-bottom:6px;text-shadow:1px 1px 2px #000;opacity:.9}.hhx-item-hints{display:flex;justify-content:center;gap:12px}.hhx-room-page .hhx-item-icon{width:65px;height:65px;object-fit:contain;transition:all .3s ease;border:none;background:none;box-shadow:none;padding:0}.hhx-room-page .hhx-item-icon.hhx-missing{filter:brightness(0) invert(1);opacity:.2}.hhx-room-page .hhx-item-icon.hhx-found{filter:brightness(1) drop-shadow(0 0 8px gold);opacity:1;transform:scale(1.1)}.hhx-puzzle-page{background-image:linear-gradient(rgba(0,0,0,.6),rgba(0,0,0,.6)),url('${ASSET_BASE}/images/puzzlepage.png');background-size:cover;background-position:center;background-repeat:no-repeat}.hhx-dialog-box{position:absolute;top:30px;left:50%;transform:translateX(-50%);width:85%;max-width:900px;z-index:100;background:rgba(20,10,5,.9);color:#e0c097;border:3px solid #8b4513;border-image:linear-gradient(to bottom,#d4af37,#8b4513) 1;box-shadow:0 0 25px rgba(0,0,0,.9);padding:25px 45px;font-size:24px;font-weight:700;text-shadow:2px 2px 4px #000;border-radius:10px;box-sizing:border-box}.hhx-dialog-box::before{content:"“";font-size:60px;position:absolute;left:15px;top:-10px;color:#d4af37;opacity:.5}.hhx-ghost-container{display:flex;justify-content:center;align-items:flex-end;gap:30px;height:50vh;margin-top:210px;position:relative;z-index:5}.hhx-ghost-wrapper{display:flex;align-items:flex-end;justify-content:center;min-width:120px}.hhx-ghost-img{height:350px;width:auto;cursor:pointer;transition:transform .3s,filter 2s,opacity 1s}.hhx-ghost-img.hhx-ghost-girl{height:250px;align-self:flex-end}.hhx-ghost-img:hover{transform:scale(1.05);filter:drop-shadow(0 0 20px rgba(243,237,237,.824))}.hhx-ghost-img.hhx-active{filter:brightness(1.2) drop-shadow(0 0 10px gold)}.hhx-ghost-img.hhx-dimmed{filter:brightness(.7)}.hhx-ghost-half-faded{opacity:.5;filter:grayscale(50%)}.hhx-fade-out{opacity:0;filter:brightness(3) blur(5px);transform:translateY(-50px) scale(.8);pointer-events:none;transition:all 1.5s ease}.hhx-puzzle-page .hhx-hint-bar{bottom:0;left:0;width:100%;transform:none;background:linear-gradient(to top,rgba(10,5,0,.95),rgba(40,10,5,.8));padding:15px 0;border-top:3px solid #8b4513;box-shadow:0 -5px 15px rgba(0,0,0,.8);border-radius:0}.hhx-hint-title{margin:0 0 10px;font-size:1.1rem;color:#e0c097;text-shadow:1px 1px 3px #000;text-align:center}.hhx-puzzle-page .hhx-item-hints{gap:20px}.hhx-puzzle-page .hhx-item-icon{width:70px;height:70px;object-fit:contain;background:rgba(255,255,255,.05);border:1px solid rgba(212,175,55,.3);border-radius:10px;padding:8px;transition:transform .2s,box-shadow .2s;cursor:grab;box-sizing:border-box}.hhx-puzzle-page .hhx-item-icon:hover{transform:scale(1.1);box-shadow:0 0 15px rgba(212,175,55,.5);background:rgba(255,255,255,.1)}.hhx-result-screen .hhx-full-bg{z-index:0;filter:brightness(.3)}.hhx-result-board{width:720px!important;min-height:520px!important;padding:70px 60px!important;background-size:100% 100%!important}.hhx-total-score{color:#9d1f1f;font-size:3rem;font-weight:700;text-shadow:3px 3px 5px #000;margin:20px 0 8px}.hhx-score-decoration{color:#eae4e0d5;font-size:1rem;font-weight:700;max-width:460px}.hhx-return-btn{width:80%}.hhx-transition{position:absolute;inset:0;background:radial-gradient(circle,#4a0000 0%,#000 80%);opacity:0;pointer-events:none;z-index:9999;transition:opacity .8s ease-in-out}.hhx-error-flash{animation:hhx-flash-red .3s}.hhx-shake-effect{animation:hhx-shake .5s infinite}@keyframes hhx-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}@keyframes hhx-impact{0%{transform:translateY(60px) scale(1) rotate(0deg);filter:drop-shadow(0 0 10px gold)}20%{transform:translateY(60px) scale(1.2) rotate(5deg);filter:drop-shadow(0 0 30px gold)}40%{transform:translateY(60px) scale(1.2) rotate(-5deg);filter:drop-shadow(0 0 40px red)}60%{transform:translateY(60px) scale(1.15) rotate(3deg);filter:drop-shadow(0 0 20px gold)}100%{transform:translateY(60px) scale(1.1) rotate(0deg);filter:drop-shadow(0 0 20px gold)}}@keyframes hhx-shake{0%{transform:translate(1px,1px) rotate(0deg)}20%{transform:translate(-3px,0) rotate(1deg)}50%{transform:translate(-1px,2px) rotate(-1deg)}100%{transform:translate(1px,-2px) rotate(-1deg)}}@keyframes hhx-flash-red{0%{box-shadow:inset 0 0 0 rgba(255,0,0,0)}50%{box-shadow:inset 0 0 150px rgba(200,0,0,.8)}100%{box-shadow:inset 0 0 0 rgba(255,0,0,0)}}
</style>
<div class="hhx-root">
<div id="hhxIntro" class="hhx-screen hhx-intro-screen"><img src="${ASSET_BASE}/images/result.png" class="hhx-full-bg" alt="" /><div class="hhx-intro-container"><div><img src="${ASSET_BASE}/images/npc1.png" class="hhx-ghost-npc" alt="NPC" /></div><div class="hhx-content-side"><div class="hhx-speech-bubble"><div id="hhxIntroText" class="hhx-bubble-text"></div></div><div class="hhx-signboard"><div class="hhx-sign-title">${INTRO_TITLE}</div><div class="hhx-sign-subtitle">${INTRO_SUBTITLE}</div><button id="hhxIntroStart" class="hhx-start-btn">เริ่มเกม</button></div></div></div></div>
<div id="hhxMenu" class="hhx-screen hhx-hidden"><div class="hhx-main-menu-container"><img src="${ASSET_BASE}/images/main_menu.png" class="hhx-full-bg" alt="" /><div class="hhx-main-logo-header"><img src="${ASSET_BASE}/images/game_logo.png" alt="บ้านผีสิง" class="hhx-main-logo" /></div><div class="hhx-sign-wrapper hhx-pos-living" data-room-index="0"><img src="${ASSET_BASE}/images/living_sign.png" id="hhx-sign-0" class="hhx-menu-sign" alt="Living Room" /></div><div class="hhx-sign-wrapper hhx-pos-bathroom" data-room-index="1"><img src="${ASSET_BASE}/images/bathroom_sign.png" id="hhx-sign-1" class="hhx-menu-sign" alt="Bathroom" /></div><div class="hhx-sign-wrapper hhx-pos-bedroom" data-room-index="2"><img src="${ASSET_BASE}/images/bedroom_sign.png" id="hhx-sign-2" class="hhx-menu-sign" alt="Bedroom" /></div><div class="hhx-sign-wrapper hhx-pos-kid" data-room-index="3"><img src="${ASSET_BASE}/images/kid_sign.png" id="hhx-sign-3" class="hhx-menu-sign" alt="Kid Room" /></div></div></div>
<div id="hhxRoom" class="hhx-screen hhx-room-page hhx-hidden"><div id="hhxGameContainer" class="hhx-room-container"><div class="hhx-room-header"><img id="hhxRoomSign" src="" alt="Room Sign" class="hhx-room-sign" /></div><div id="hhxTimer" class="hhx-timer">⏱️ ${ROOM_TIME}</div><div id="hhxRoomCanvas" class="hhx-room-canvas"></div><div class="hhx-hint-bar"><div class="hhx-hint-text">หาสิ่งของตามนี้เพื่อช่วยผี</div><div id="hhxRoomItems" class="hhx-item-hints"></div></div></div></div>
<div id="hhxPuzzle" class="hhx-screen hhx-puzzle-page hhx-hidden"><div id="hhxDialogBox" class="hhx-dialog-box">${INITIAL_DIALOG}</div><div id="hhxGhostContainer" class="hhx-ghost-container"></div><div class="hhx-hint-bar"><h3 class="hhx-hint-title">${PUZZLE_HINT}</h3><div id="hhxInventorySlots" class="hhx-item-hints"></div></div></div>
<div id="hhxResult" class="hhx-screen hhx-result-screen hhx-hidden"><img src="${ASSET_BASE}/images/result_bg.png" class="hhx-full-bg" alt="" /><div class="hhx-intro-container"><div><img src="${ASSET_BASE}/images/npc.png" class="hhx-ghost-npc" alt="NPC" /></div><div class="hhx-content-side"><div class="hhx-signboard hhx-result-board"><div class="hhx-sign-title">🕯️บทสรุปดวงวิญญาณ🕯️</div><div><h2 id="hhxTotalScore" class="hhx-total-score">0 / ${MAX_SCORE}</h2><div class="hhx-score-decoration">นี่คือความสามารถของท่าน....ขอบคุณที่ปลดปล่อยพวกเรา</div></div><button id="hhxFinish" class="hhx-start-btn hhx-return-btn">กลับไปแผนที่</button></div></div></div></div>
<div id="hhxTransition" class="hhx-transition"></div></div>`;
    host.appendChild(this.root);
    this.introEl = this.root.querySelector("#hhxIntro");
    this.menuEl = this.root.querySelector("#hhxMenu");
    this.roomEl = this.root.querySelector("#hhxRoom");
    this.puzzleEl = this.root.querySelector("#hhxPuzzle");
    this.resultEl = this.root.querySelector("#hhxResult");
    this.introTextEl = this.root.querySelector("#hhxIntroText");
    this.roomCanvasEl = this.root.querySelector("#hhxRoomCanvas");
    this.roomItemsEl = this.root.querySelector("#hhxRoomItems");
    this.roomSignEl = this.root.querySelector("#hhxRoomSign");
    this.timerEl = this.root.querySelector("#hhxTimer");
    this.gameContainerEl = this.root.querySelector("#hhxGameContainer");
    this.dialogBoxEl = this.root.querySelector("#hhxDialogBox");
    this.ghostContainerEl = this.root.querySelector("#hhxGhostContainer");
    this.inventorySlotsEl = this.root.querySelector("#hhxInventorySlots");
    this.totalScoreEl = this.root.querySelector("#hhxTotalScore");
    this.transitionEl = this.root.querySelector("#hhxTransition");
    this.root.querySelector("#hhxIntroStart")?.addEventListener("click", () => this.showMainMenu());
    this.root.querySelector("#hhxFinish")?.addEventListener("click", () => this.finishScene());
  }

  render() {
    if (!this.root) return;
    const { phase } = this.state;
    this.introEl?.classList.toggle("hhx-hidden", phase !== "intro");
    this.menuEl?.classList.toggle("hhx-hidden", phase !== "menu");
    this.roomEl?.classList.toggle("hhx-hidden", phase !== "room");
    this.puzzleEl?.classList.toggle("hhx-hidden", phase !== "puzzle");
    this.resultEl?.classList.toggle("hhx-hidden", phase !== "result");
    if (phase === "menu") this.renderMenu();
    if (phase === "room") this.renderRoom();
    if (phase === "puzzle") this.renderPuzzle();
    if (phase === "result") this.renderResult();
  }

  startIntroSequence() {
    if (this.state.phase !== "intro") return;
    this.playVoice(`${ASSET_BASE}/sounds/npc_voice.mp3`, 0.7);
    this.typeIntoElement(this.introTextEl, INTRO_MESSAGE, INTRO_TYPING_SPEED);
  }

  showMainMenu() {
    this.stopVoice();
    this.clearTypeTimer();
    this.state.phase = "menu";
    this.render();
  }

  renderMenu() {
    this.menuEl?.querySelectorAll("[data-room-index]").forEach((wrapper) => {
      const index = Number(wrapper.getAttribute("data-room-index"));
      const sign = wrapper.querySelector(".hhx-menu-sign");
      const locked = index !== 0;
      sign?.classList.toggle("hhx-locked", locked);
      wrapper.onclick = locked ? null : () => this.selectRoom(index);
    });
  }

  selectRoom(index) {
    if (index !== 0 || this.state.phase !== "menu") return;
    this.menuEl?.querySelector(`#hhx-sign-${index}`)?.classList.add("hhx-sign-active");
    this.playPickupSfx();
    this.scheduleTimeout(() => !this.isCleaningUp && this.startRoom(index), 600);
  }

  startRoom(index) {
    this.state.phase = "room";
    this.state.currentRoom = index;
    this.state.timeLeft = ROOM_TIME;
    this.transitioning = false;
    this.startBgm();
    this.render();
    this.startRoomTimer();
  }

  renderRoom() {
    const room = ROOMS[this.state.currentRoom];
    if (!room || !this.roomCanvasEl || !this.roomItemsEl || !this.roomSignEl || !this.timerEl) return;
    this.roomSignEl.src = roomSign(room.id);
    this.roomCanvasEl.style.backgroundImage = `url("${roomBg(room.id)}")`;
    this.timerEl.textContent = `⏱️ ${this.state.timeLeft}`;
    this.roomItemsEl.innerHTML = room.items.map((item) => `<img src="${ITEMS[item.id].image}" alt="${ITEMS[item.id].label}" class="hhx-item-icon ${this.state.roomFound[item.id] ? "hhx-found" : "hhx-missing"}" />`).join("");
    this.roomCanvasEl.innerHTML = room.items.filter((item) => !this.state.roomFound[item.id]).map((item) => `<button type="button" class="hhx-hit-target" data-item-id="${item.id}" style="left:${item.x}%;top:${item.y}%;width:${item.w}%;height:${item.h}%;" aria-label="${ITEMS[item.id].label}" title="${ITEMS[item.id].label}"></button>`).join("");
    this.roomCanvasEl.onclick = (event) => { if (event.target === this.roomCanvasEl) this.handleMissClick(); };
    this.roomCanvasEl.querySelectorAll("[data-item-id]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const itemId = button.getAttribute("data-item-id");
        if (itemId) this.collectItem(itemId);
      });
    });
  }

  collectItem(itemId) {
    if (this.state.phase !== "room" || this.state.roomFound[itemId]) return;
    this.state.roomFound[itemId] = true;
    if (!this.state.inventory.includes(itemId)) this.state.inventory.push(itemId);
    this.playPickupSfx();
    this.renderRoom();
    const room = ROOMS[this.state.currentRoom];
    const foundCount = room.items.filter((item) => this.state.roomFound[item.id]).length;
    if (foundCount === room.items.length) {
      window.clearInterval(this.roomTimer);
      this.scheduleTimeout(() => !this.isCleaningUp && this.triggerTransition(), 300);
    }
  }

  startRoomTimer() {
    window.clearInterval(this.roomTimer);
    this.roomTimer = window.setInterval(() => {
      if (this.isCleaningUp || this.state.phase !== "room") return;
      this.state.timeLeft -= 1;
      if (this.timerEl) this.timerEl.textContent = `⏱️ ${Math.max(0, this.state.timeLeft)}`;
      if (this.state.timeLeft <= 5 && this.state.timeLeft > 0) this.playSfx(`${ASSET_BASE}/sounds/heartbeat.mp3`, 0.4);
      if (this.state.timeLeft <= 0) {
        window.clearInterval(this.roomTimer);
        this.triggerTransition();
      }
    }, 1000);
  }

  handleMissClick() {
    if (this.state.phase !== "room" || !this.gameContainerEl) return;
    this.state.misses += 1;
    this.playMissSfx();
    this.gameContainerEl.classList.add("hhx-shake-effect", "hhx-error-flash");
    this.scheduleTimeout(() => this.gameContainerEl?.classList.remove("hhx-shake-effect", "hhx-error-flash"), 300);
  }

  triggerTransition() {
    if (this.transitioning || this.state.phase !== "room") return;
    this.transitioning = true;
    window.clearInterval(this.roomTimer);
    this.playSfx(`${ASSET_BASE}/sounds/ghost_laugh.mp3`, 0.5);
    this.gameContainerEl?.classList.add("hhx-shake-effect");
    if (this.transitionEl) this.transitionEl.style.opacity = "1";
    this.scheduleTimeout(() => {
      this.gameContainerEl?.classList.remove("hhx-shake-effect");
      if (this.transitionEl) this.transitionEl.style.opacity = "0";
      const nextRoom = this.state.currentRoom + 1;
      this.transitioning = false;
      if (nextRoom < ROOMS.length) {
        this.state.currentRoom = nextRoom;
        this.state.timeLeft = ROOM_TIME;
        this.render();
        this.startRoomTimer();
        return;
      }
      this.stopBgm();
      this.enterPuzzle();
    }, 1000);
  }
  enterPuzzle() {
    this.state.phase = "puzzle";
    this.state.dialogText = INITIAL_DIALOG;
    this.state.activeGhostId = null;
    this.render();
  }

  renderPuzzle() {
    if (!this.dialogBoxEl || !this.ghostContainerEl || !this.inventorySlotsEl) return;
    this.dialogBoxEl.textContent = this.state.dialogText;
    this.ghostContainerEl.innerHTML = GHOSTS.map((ghost) => {
      const received = this.state.ghostReceivedItems[ghost.id] || [];
      const classes = [
        "hhx-ghost-img",
        ghost.id === "girl" ? "hhx-ghost-girl" : "",
        received.length >= 1 ? "hhx-ghost-half-faded" : "",
        received.length >= 2 ? "hhx-fade-out" : "",
        this.state.activeGhostId === ghost.id ? "hhx-active" : "",
        this.state.activeGhostId && this.state.activeGhostId !== ghost.id ? "hhx-dimmed" : "",
      ].filter(Boolean).join(" ");
      return `<div class="hhx-ghost-wrapper"><img src="${ghost.image}" class="${classes}" data-ghost-id="${ghost.id}" alt="${ghost.id}" draggable="false" /></div>`;
    }).join("");
    this.inventorySlotsEl.innerHTML = this.state.inventory.map((itemId) => `<img src="${ITEMS[itemId].image}" class="hhx-item-icon" data-item-id="${itemId}" alt="${ITEMS[itemId].label}" draggable="true" />`).join("");
    this.ghostContainerEl.querySelectorAll("[data-ghost-id]").forEach((ghostImg) => {
      const ghostId = ghostImg.getAttribute("data-ghost-id");
      if (!ghostId) return;
      ghostImg.addEventListener("click", () => this.talkToGhost(ghostId));
      ghostImg.addEventListener("dragover", (event) => event.preventDefault());
      ghostImg.addEventListener("drop", (event) => this.dropItemOnGhost(event, ghostId));
    });
    this.inventorySlotsEl.querySelectorAll("[data-item-id]").forEach((itemEl) => {
      itemEl.addEventListener("dragstart", (event) => {
        const itemId = itemEl.getAttribute("data-item-id");
        if (itemId) event.dataTransfer?.setData("text/plain", itemId);
      });
    });
  }

  talkToGhost(ghostId) {
    const ghost = GHOSTS.find((entry) => entry.id === ghostId);
    if (!ghost) return;
    this.state.ghostUnlocked[ghostId] = true;
    this.state.activeGhostId = ghostId;
    this.renderPuzzle();
    this.playVoice(ghost.voice, 1);
    this.typeDialog(ghost.story);
  }

  dropItemOnGhost(event, ghostId) {
    event.preventDefault();
    const itemId = event.dataTransfer?.getData("text/plain");
    if (!itemId) return;
    if (!this.state.ghostUnlocked[ghostId]) return this.setDialogText("คุณต้องคุยกับวิญญาณก่อนจะมอบของให้...");
    const received = this.state.ghostReceivedItems[ghostId] || [];
    if (received.length >= 2) return this.setDialogText("วิญญาณตนนี้ไม่สามารถรับอะไรได้เพิ่มอีกแล้ว...");
    this.state.ghostReceivedItems[ghostId] = [...received, itemId];
    this.state.inventory = this.state.inventory.filter((entry) => entry !== itemId);
    this.playPickupSfx();
    const nextCount = this.state.ghostReceivedItems[ghostId].length;
    if (nextCount >= 2 && this.state.activeGhostId === ghostId) this.stopVoice();
    this.setDialogText(nextCount === 1 ? "วิญญาณรับไอเท็มชิ้นแรกไปแล้ว... (1/2)" : "ความปรารถนาของฉันเติมเต็มแล้ว... ขอบคุณนะ (2/2)");
    this.renderPuzzle();
    if (this.state.inventory.length === 0) this.scheduleTimeout(() => !this.isCleaningUp && this.finishPuzzle(), 2000);
  }

  finishPuzzle() {
    this.clearTypeTimer();
    this.stopVoice();
    this.state.score = this.calculateScore();
    this.state.phase = "result";
    this.render();
  }

  calculateScore() {
    let total = 0;
    GHOSTS.forEach((ghost) => {
      const playerGave = this.state.ghostReceivedItems[ghost.id] || [];
      const correctCount = playerGave.filter((itemId) => ghost.req.includes(itemId)).length;
      total += playerGave.length === ghost.req.length && correctCount === ghost.req.length ? 40 : correctCount * 10;
    });
    return total + this.state.inventory.length * 10;
  }

  renderResult() {
    if (this.totalScoreEl) this.totalScoreEl.textContent = `${this.state.score} / ${MAX_SCORE}`;
  }

  finishScene() {
    if (this.finished) return;
    this.finished = true;
    this.onGameEnd?.({
      score: this.state.score ?? 0,
      game: "HauntedHouse",
      meta: {
        misses: this.state.misses,
        remainingItems: [...this.state.inventory],
        ghostReceivedItems: { ...this.state.ghostReceivedItems },
        roomFound: { ...this.state.roomFound },
      },
    });
  }

  typeDialog(text) {
    this.typeIntoElement(this.dialogBoxEl, text, PUZZLE_TYPING_SPEED, (nextText) => {
      this.state.dialogText = nextText;
    });
  }

  setDialogText(text) {
    this.clearTypeTimer();
    this.state.dialogText = text;
    if (this.dialogBoxEl) this.dialogBoxEl.textContent = text;
  }

  typeIntoElement(element, text, speed, onUpdate) {
    this.clearTypeTimer();
    if (!element) return;
    let index = 0;
    element.textContent = "";
    const step = () => {
      if (this.isCleaningUp || !element) return;
      const nextText = text.slice(0, index);
      element.textContent = nextText;
      onUpdate?.(nextText);
      if (index < text.length) {
        index += 1;
        this.typeTimer = window.setTimeout(step, speed);
      }
    };
    step();
  }

  clearTypeTimer() {
    window.clearTimeout(this.typeTimer);
    this.typeTimer = null;
  }

  playPickupSfx() {
    this.playSfx(PICKUP_SOURCES, 0.45);
  }

  playMissSfx() {
    const audio = new Audio(`${ASSET_BASE}/sounds/ghost_scream.mp3`);
    audio.volume = 0.55;
    audio.playbackRate = 1.5;
    audio.play().catch(() => {});
    this.scheduleTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, 400);
  }

  playSfx(sourceOrSources, volume = 0.4) {
    const sources = Array.isArray(sourceOrSources) ? sourceOrSources : [sourceOrSources];
    const tryPlay = (index) => {
      if (index >= sources.length) return;
      const audio = new Audio(sources[index]);
      audio.volume = volume;
      audio.addEventListener("error", () => tryPlay(index + 1), { once: true });
      audio.play().catch(() => tryPlay(index + 1));
    };
    tryPlay(0);
  }

  playVoice(src, volume = 0.7) {
    this.stopVoice();
    this.voiceAudio = new Audio(src);
    this.voiceAudio.volume = volume;
    this.voiceAudio.play().catch(() => {});
  }

  stopVoice() {
    if (!this.voiceAudio) return;
    this.voiceAudio.pause();
    this.voiceAudio.currentTime = 0;
    this.voiceAudio = null;
  }

  startBgm() {
    if (this.bgm) return;
    this.bgm = new Audio(`${ASSET_BASE}/sounds/room_bgm.mp3`);
    this.bgm.loop = true;
    this.bgm.volume = 0.3;
    this.bgm.play().catch(() => {});
  }

  stopBgm() {
    if (!this.bgm) return;
    this.bgm.pause();
    this.bgm.currentTime = 0;
    this.bgm = null;
  }

  scheduleTimeout(callback, delay) {
    const timeoutId = window.setTimeout(() => {
      this.pendingTimeouts.delete(timeoutId);
      if (!this.isCleaningUp) callback();
    }, delay);
    this.pendingTimeouts.add(timeoutId);
    return timeoutId;
  }

  shutdown() {
    this.cleanup();
  }

  cleanup() {
    if (this.isCleaningUp) return;
    this.isCleaningUp = true;
    window.clearInterval(this.roomTimer);
    this.clearTypeTimer();
    this.pendingTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    this.pendingTimeouts.clear();
    this.stopVoice();
    this.stopBgm();
    if (this.root?.parentNode) this.root.parentNode.removeChild(this.root);
    this.root = null;
  }
}
