<<<<<<< Updated upstream
=======
import Phaser from "phaser";

const HUD_SIGN_IMAGE = "/assets/เเผ่นป้ายเวลากับคะเเนน.png";

/**
 * CookingGameScene.jsx
 * Thai dessert mixing mini-game built with a DOM overlay on top of Phaser.
 * Players drag ingredients into the bowl in order, stir at the right moments,
 * then receive a final score.
 */
export default class CookingGameScene extends Phaser.Scene {
  constructor() {
    super({ key: "CookingGameScene" });
    this._ui = [];
  }

  /* ─────────────── INIT ─────────────── */
  init(data = {}) {
    this.onGameEnd = data.onGameEnd ?? null;
    this.roomCode  = data.roomCode  ?? null;
    this.player    = data.player    ?? null;
    this.roundId   = data.roundId   ?? null;
    this._audioCtx = null;
  }

  preload() {}

  /* ─────────────── CREATE ─────────────── */
  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a00);
    this._buildOverlay();
    this.events.once("shutdown", () => this._destroyUI());
    this.events.once("destroy",  () => this._destroyUI());
  }

 /* ─────────────── DOM OVERLAY ─────────────── */
  _buildOverlay() {
    const BASE = "/cooking/";
    const I    = BASE + "images/";

    const overlay = this._el("div", {
      id: "ck-overlay",
      style: `
        position: fixed; inset: 0; z-index: 200;
        font-family: 'Sarabun', sans-serif;
        background-image: url('${I}bg.png');
        background-size: cover; background-position: center;
        overflow: hidden; user-select: none;
      `
    });

    const style = this._el("style");
    style.textContent = this._getCSS(I);
    overlay.appendChild(style);

    // ─── Start Screen ───
    overlay.appendChild(this._buildStartScreen(I));

    // ─── Countdown ───
    const cdOv  = this._el("div", { id: "ck-countdown-overlay" });
    const cdTxt = this._el("div", { id: "ck-countdown-text" });
    cdOv.appendChild(cdTxt);
    overlay.appendChild(cdOv);

    // ─── Result Screen ───
    overlay.appendChild(this._buildResultScreen(I));

    // ─── Timer ───
    const timer = this._el("div", { id: "game-timer", class: "ck-hidden" });
    timer.textContent = "เวลา: 45"; 
    overlay.appendChild(timer);

    // ─── NPC Area ───
    const npcArea = this._el("div", { id: "ck-npc-area", class: "ck-npc-area" });
    const bubble  = this._el("div", { class: "ck-speech-bubble" });
    const npcTxt  = this._el("p",   { id: "ck-npc-text" });
    npcTxt.textContent = "รอก่อนนะหลาน...";
    bubble.appendChild(npcTxt);
    const grandmaImg = this._el("img");
    grandmaImg.src = `${I}ยาย.png`;
    grandmaImg.className = "ck-grandma";
    grandmaImg.onerror = () => { grandmaImg.style.display = "none"; };
    npcArea.appendChild(bubble);
    npcArea.appendChild(grandmaImg);
    overlay.appendChild(npcArea);

    // ─── Table Area ───
    const tableDecor = this._el("img", { id: "ck-table-decor", class: "ck-table-decor" });
    tableDecor.src = `${I}table.png`;
    tableDecor.onerror = () => { tableDecor.style.display = "none"; };
    overlay.appendChild(tableDecor);

    const tableArea = this._el("div", { class: "ck-table-area", id: "ck-table-area" });
    overlay.appendChild(tableArea);

    // ─── Bowl Container ───
    const bowl = this._el("div", { id: "ck-bowl", class: "ck-bowl-container" });

    const bowlBack = this._el("img", { class: "ck-bowl-back" });
    bowlBack.src = `${I}ถ้วย copy.png`; 
    bowl.appendChild(bowlBack);

    const fillWrapper = this._el("div", { class: "ck-fill-wrapper", id: "ck-visual-wrapper" });
    bowl.appendChild(fillWrapper);

    const spatula = this._el("img", { id: "ck-spatula", class: "ck-spatula ck-hidden" });
    spatula.src = `${I}ช้อน.png`;
    bowl.appendChild(spatula);

    const bowlFront = this._el("img", { class: "ck-bowl-front" });
    bowlFront.src = `${I}ถ้วย copy.png`; 
    bowl.appendChild(bowlFront);

    // 5. ระบบ Stir Progress (หลอดพลัง) - ย้ายมาไว้ตรงนี้และประกาศครั้งเดียว
    const stirBar = this._el("div", { id: "ck-stir-bar", class: "ck-stir-bar" });
    const stirProgress = this._el("div", { id: "ck-stir-progress", class: "ck-stir-progress" });
    stirBar.appendChild(stirProgress);
    overlay.appendChild(stirBar);

    // 6. ระบบ Stir Hint (คำใบ้ลูกศรขยับได้)
    const stirHint = this._el("div", { 
      id: "ck-stir-hint", 
      class: "stir-hint-wrapper ck-hidden" 
    });
    stirHint.innerHTML = `
      <div class="stir-visual-container">
        <div class="arrow-green arrow-left-dir"></div>
        <div class="mouse-icon-center">🖱️</div>
        <div class="arrow-green arrow-right-dir"></div>
      </div>
      <div class="stir-message-box">เลื่อนซ้าย-ขวา เพื่อคนให้เข้ากัน</div>
    `;
    overlay.appendChild(stirHint);

    // 7. Bowl Hint
    const bowlHint = this._el("p", { class: "ck-bowl-hint", id: "ck-bowl-hint" });
    bowlHint.textContent = "ลากวัตถุดิบมาที่นี่";
    bowl.appendChild(bowlHint);

    overlay.appendChild(bowl);

    // ปิดท้ายการสร้าง UI
    document.body.appendChild(overlay);
    this._ui.push(overlay);

    // init engine
    this._initGame(I, BASE);
  }
  /* ─────────────── UI BUILDERS ─────────────── */
  _buildStartScreen(I) {
    const screen = this._el("div", { id: "ck-start-screen" });
    screen.style.cssText = `
      position: absolute; inset: 0; display: flex;
      justify-content: center; align-items: center; z-index: 300;
      background: linear-gradient(180deg, rgba(13,8,6,0.18), rgba(13,8,6,0.52));
      backdrop-filter: blur(4px);
    `;
    const wrapper = this._el("div", { class: "ck-banner-wrapper" });
    const bannerImg = this._el("img");
    bannerImg.src = `${I}\u0e1b\u0e49\u0e32\u0e22\u0e14\u0e48\u0e32\u0e19.png`; bannerImg.className = "ck-stage-banner";
    bannerImg.onerror = () => { bannerImg.style.display="none"; };
    wrapper.appendChild(bannerImg);

    const inner = this._el("div", { class: "ck-banner-inner" });
    const btn = this._el("button", { id: "ck-btn-start" });
    btn.textContent = "\u0e40\u0e23\u0e34\u0e48\u0e21\u0e40\u0e01\u0e21";
    btn.onclick = () => this._startGame();
    inner.appendChild(btn);
    wrapper.appendChild(inner);
    screen.appendChild(wrapper);
    return screen;
  }

  _buildResultScreen(I) {
    const screen = this._el("div", { id: "ck-result-screen", class: "ck-hidden" });
    screen.style.cssText = `
      position: absolute; inset: 0; display: none;
      justify-content: center; align-items: center; z-index: 400;
      background: linear-gradient(180deg, rgba(13,8,6,0.34), rgba(13,8,6,0.66));
      backdrop-filter: blur(4px);
    `;

    const wrapper = this._el("div", { class: "ck-banner-wrapper" });
    
    // รูปป้ายพื้นหลัง
    const bannerImg = this._el("img");
    bannerImg.src = `${I}ป้ายด่าน2.png`; 
    bannerImg.className = "ck-result-banner";
    bannerImg.onerror = () => { bannerImg.style.display = "none"; };
    wrapper.appendChild(bannerImg);

    const inner = this._el("div", { class: "ck-banner-inner" });
    
    // 1. ส่วนแสดงคะแนน (เหลือแค่ตัวเลข)
    const scoreEl = this._el("span", { id: "ck-total-score" });
    scoreEl.textContent = "0";
    // ปรับ style ให้คะแนนดูเด่นขึ้นถ้าต้องการ
    scoreEl.style.fontSize = "64px"; 
    inner.appendChild(scoreEl);

    // 2. ปุ่มกลับไปแผนที่ (ลบส่วน noteEl ออกไปแล้ว)
    const backBtn = this._el("button", { id: "ck-back-btn" });
    backBtn.textContent = "กลับไปแผนที่";
    backBtn.onclick = () => {
      const score = this._gs?.score ?? 0;
      this._destroyUI();
      this.onGameEnd?.({ score });
    };
    
    inner.appendChild(backBtn);
    wrapper.appendChild(inner);
    screen.appendChild(wrapper);
    
    return screen;
  }

  /* ─────────────── GAME ENGINE ─────────────── */
  _initGame(I, BASE) {
    const S = BASE + "sounds/";

    // recipe & data
    const recipe = ["bean", "sugar", "coconut", "agar", "color", "water", "salt"];
    const recipeLabels = {
      bean: "ถั่วเหลือง",
      sugar: "น้ำตาลทรายขาว",
      coconut: "กะทิ",
      agar: "ผงวุ้น",
      color: "สีผสมอาหาร",
      water: "น้ำเปล่า",
      salt: "เกลือ",
    };
    const ingredientVisualMap = {
      bean: "ck-fill-bean",
      sugar: "ck-fill-sugar",
      coconut: "ck-fill-coconut",
      agar: "ck-fill-agar",
      color: "ck-fill-color",
      water: "ck-fill-water",
      salt: "ck-fill-salt",
    };

const INGREDIENTS = [
      // วัตถุดิบจริง
      { name: "bean",    cls: "ck-green-bean", file: "ถั่วเหลือง.png",    w: "150px", l: "2%",  b: "57%" },
      { name: "sugar",   cls: "ck-sugar",      file: "น้ำตาลทรายขาว.png", w: "350px", l: "18%", b: "53%" },
      { name: "coconut", cls: "ck-coconut",    file: "กะทิ.png",         w: "100px", l: "43%", b: "48%" },
      { name: "agar",    cls: "ck-agar",       file: "ผงวุ้น.png",        w: "230px", l: "56%", b: "60%" },
      { name: "color",   cls: "ck-color",      file: "สีผสมอาหาร.png",    w: "110px", l: "70%", b: "45%" },
      { name: "water",   cls: "ck-water",      file: "น้ำเปล่า.png",       w: "110px", l: "90%", b: "65%" },
      { name: "salt",    cls: "ck-salt",       file: "เกลือ.png",         w: "140px", l: "59%", b: "40%", tf: "translateX(-50%)" },

      // วัตถุดิบหลอก
      { name: "palm_sugar", cls: "decoy-1", file: "palm_sugar.png", w: "350px", l: "8%",  b: "40%", op: 0.9, isDecoy: true },
      { name: "ไข่ไก่",      cls: "decoy-2", file: "ไข่ไก่.png",      w: "200px", l: "27%", b: "40%", op: 0.9, isDecoy: true },
      { name: "น้ำเชื่อม",    cls: "decoy-3", file: "น้ำเชื่อม.png",    w: "110px", l: "70%", b: "64%", op: 0.9, isDecoy: true },
      { name: "กลิ่นผลไม้",  cls: "decoy-4", file: "กลิ่นผลไม้.png",   w: "120px", l: "80%", b: "50%", op: 0.9, isDecoy: true },
    ];

    // sounds
    const sfxCount = new Audio(`${S}count.mp3`);
    const sfxGo    = new Audio(`${S}start_game.mp3`);
    const bgm      = new Audio(`${S}bgm.mp3`);
    bgm.loop = true;
    this._bgm = bgm;

    const playClean = (a) => { try { a.pause(); a.currentTime=0; a.play(); } catch(_){} };
    const playTone = (kind) => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!this._audioCtx) this._audioCtx = new AudioCtx();
        const ctx = this._audioCtx;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        const cfg = {
          drop: { type: "triangle", start: 420, end: 620, dur: 0.09, vol: 0.03 },
          stir: { type: "sine", start: 560, end: 740, dur: 0.08, vol: 0.025 },
          phase: { type: "triangle", start: 680, end: 920, dur: 0.16, vol: 0.04 },
          success: { type: "sine", start: 760, end: 1120, dur: 0.24, vol: 0.05 },
          fail: { type: "sawtooth", start: 260, end: 180, dur: 0.2, vol: 0.04 },
        }[kind];
        if (!cfg) return;
        osc.type = cfg.type;
        osc.frequency.setValueAtTime(cfg.start, now);
        osc.frequency.exponentialRampToValueAtTime(cfg.end, now + cfg.dur);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(cfg.vol, now + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + cfg.dur);
        osc.start(now);
        osc.stop(now + cfg.dur + 0.02);
      } catch {}
    };

    // game state
    const gs = {
      steps: [], isGameActive: false, gameTimeLeft: 45,
      gameInterval: null, isFinishing: false,
      currentY: 180, stirProgress: 0, lastAngle: null, isStirringEnabled: false,
      score: 0,
    };
    this._gs = gs;

    // DOM refs
    const bowl       = document.getElementById("ck-bowl");
    const npcText    = document.getElementById("ck-npc-text");
    const npcBubble  = npcText?.parentElement;
    const tableArea  = document.getElementById("ck-table-area");
    const getGameTimer = () => document.getElementById("game-timer");

    // ─── Typewriter ───
    function typeEffect(el, text, speed = 50) {
      return new Promise(resolve => {
        if (!el) { resolve(); return; }
        el.innerText = "";
        let i = 0;
        const tick = () => {
          if (i < text.length) { el.innerText += text[i++]; setTimeout(tick, speed); }
          else resolve();
        };
        tick();
      });
    }

    const speak = (text, dur) => new Promise(r => {
      if (npcBubble) npcBubble.classList.remove("ck-hidden");
      typeEffect(npcText, text, 40).then(() => setTimeout(r, dur));
    });

    // ─── Build ingredient images ───
function buildIngredients() {
      if (!tableArea) return;
      tableArea.innerHTML = "";
      INGREDIENTS.forEach(ing => {
        const img = document.createElement("img");
        img.src = `${I}${ing.file}`;
        img.className = `ck-ingredient ${ing.cls}`;
        img.dataset.name = ing.name;
        img.draggable = true;

        // ✨ ใส่สไตล์ตามที่คุณกำหนดมาแยกแต่ละชิ้น
        img.style.position = "absolute";
        img.style.width    = ing.w;
        img.style.left     = ing.l;
        img.style.bottom   = ing.b;
        if (ing.tf) img.style.transform = ing.tf;
        if (ing.op) img.style.opacity   = ing.op;

        img.onerror = () => {
          img.style.display = "none";
          const ph = document.createElement("div");
          ph.className = `ck-ingredient ${ing.cls} ck-placeholder`;
          ph.dataset.name = ing.name;
          ph.textContent = recipeLabels[ing.name] || ing.name;
          
          // ใส่สไตล์ให้ Placeholder ด้วยเผื่อรูปไม่มา
          ph.style.position = "absolute";
          ph.style.width    = ing.w;
          ph.style.left     = ing.l;
          ph.style.bottom   = ing.b;
          if (ing.tf) ph.style.transform = ing.tf;

          ph.draggable = true;
          ph.addEventListener("dragstart", onDragStart);
          tableArea.appendChild(ph);
        };

        img.addEventListener("dragstart", onDragStart);
        tableArea.appendChild(img);
      });
    }
    // ─── Drag ───
    function onDragStart(e) {
      if (!gs.isGameActive || gs.isStirringEnabled) { e.preventDefault(); return; }
      e.dataTransfer.setData("text/plain", e.target.dataset.name);
      e.dataTransfer.setData("srcId", e.target.id || "");
      window._ckDragSrc = e.target;
    }

   bowl.addEventListener("dragover", e => e.preventDefault());
    bowl.addEventListener("drop", e => {
      e.preventDefault();
      if (!gs.isGameActive || gs.isStirringEnabled) return;
      const name = e.dataTransfer.getData("text/plain");
      const srcEl = window._ckDragSrc;
      if (!name || !srcEl) return;

      gs.steps.push(name);
      playTone("drop");
      document.getElementById("ck-bowl-hint")?.classList.add("ck-hidden");
      srcEl.style.visibility = "hidden";

      // --- ส่วนที่แก้ไข: ปรับความสูงเจาะจงรายชิ้น ---
      let offsetTop = 150; // ความสูงปกติสำหรับวัตถุดิบอื่น
      let pourStreamOffset = 60; // ระยะริ่มของสายธารปกติ

      if (name === "palm_sugar" || name === "sugar") {
        offsetTop = 230;        // ปรับให้ลอยสูงขึ้น (เปลี่ยนเลขนี้ได้ตามต้องการ)
        pourStreamOffset = 140; // ปรับจุดปล่อยสายธารให้ลงมาต่ำกว่าขวด/ถุงที่ยกสูงขึ้น
      }
      else if (name === "coconut") {
        // ปรับค่าเฉพาะของกะทิที่นี่
        offsetTop = 100;        // เช่น ให้ลอยต่ำกว่าน้ำตาลนิดหน่อยแต่สูงกว่าค่าปกติ
        pourStreamOffset = 30; // ปรับจุดเริ่มเทให้ตรงปากภาชนะกะทิ
      }
else if (name === "water") {
        // ปรับค่าเฉพาะของกะทิที่นี่
        offsetTop = 100;        // เช่น ให้ลอยต่ำกว่าน้ำตาลนิดหน่อยแต่สูงกว่าค่าปกติ
        pourStreamOffset = 30; // ปรับจุดเริ่มเทให้ตรงปากภาชนะกะทิ
      }


      // ---------------------------------------

    const srcRect  = srcEl.getBoundingClientRect();
      const bowlRect = bowl.getBoundingClientRect();
      const wrapper  = document.createElement("div");
      wrapper.className = "ck-pouring-wrapper";
      
      // 1. wrapper ให้วางตำแหน่งเดิม (กึ่งกลางถ้วย) เพื่อให้เอฟเฟกต์การเทลงกลางถ้วยพอดี
      wrapper.style.cssText = `
        width:${srcRect.width}px; height:${srcRect.height}px;
        left:${bowlRect.left + bowlRect.width/2 - srcRect.width/2}px;
        top:${bowlRect.top - offsetTop}px;
      `;
      document.body.appendChild(wrapper);

      const img = document.createElement("img");
      img.src = `${I}${recipeLabels[name] || name}.png`;
      img.className = "ck-item-pouring";
      
      // 2. ขยับเฉพาะตัวรูปภาพไปทางขวา (สมมติว่าขยับไป 40px)
      // การขยับตรงนี้จะไม่กระทบต่อตำแหน่งของสายธารที่พ่นออกมาจาก wrapper
      img.style.marginLeft = "40px"; 
      if (name === "กลิ่นผลไม้") {
        // ใช้ค่าติดลบเพื่อเลื่อนไปทางซ้าย (ลองปรับ -20px ถึง -40px ตามความเหมาะสม)
        img.style.marginLeft = "0px"; 
      }
      
      // หรือจะใช้ img.style.transform = "translateX(40px)"; ก็ได้ 
      // แต่ต้องระวังถ้าใน CSS .ck-item-pouring มีการใช้ transform (เช่นการเอียงรูป) อยู่แล้ว

      img.onerror = () => { img.style.display = "none"; };
      wrapper.appendChild(img);

      const color = getStreamColor(name);
      let pourTimer;
      
      // เริ่มเอฟเฟกต์การเทหนึ่งครั้งหลังภาพภาชนะตกถึงตำแหน่งเดิม
      setTimeout(() => {
        pourTimer = startPourEffect(wrapper, name, color, pourStreamOffset);
      }, 400);

      setTimeout(() => {
        if (pourTimer) clearInterval(pourTimer);
        updateFillVisual(name);
      }, 1400);

      setTimeout(() => {
        wrapper.remove();
        if (gs.steps.length === 3 || gs.steps.length === 7) triggerStirPhase();
      }, 2500);
    });
    // ─── Pour Effect ───
    const isLiquid = (n) => ["coconut", "water", "color"].includes(n);

    function getStreamColor(n) {
      const m = {
        bean: "#f3e18a",
        sugar: "#fff",
        coconut: "#fff",
        agar: "rgba(255,255,255,0.7)",
        color: "#ff4d4d",
        water: "rgba(120,199,226,0.6)",
        salt: "#eee",
      };
      return m[n] || "#fff";
    }

function startPourEffect(parent, name, color, startTop) { // เปลี่ยนชื่อพารามิเตอร์ให้ไม่งง
  const container = document.createElement("div");
  container.className = isLiquid(name) ? "ck-liquid-stream" : "ck-powder-stream";
  
  // แก้ไขตรงนี้: จาก top:35% เป็นการใช้ค่า startTop ที่ส่งมา
  container.style.cssText = `
    position: absolute; 
    left: calc(50% - 15px); 
    top: ${startTop}px; 
    z-index: 5;
  `;
  
  parent.appendChild(container);
  
  const iv = setInterval(() => {
    if (isLiquid(name)) {
      const drop = document.createElement("div");
      drop.className = "ck-drop";
      // ปรับระยะตก (--ty) ให้พอดีกับถ้วย (เช่น 200px)
      drop.style.cssText = `background:${color}; --ty:200px;`; 
      container.appendChild(drop);
      setTimeout(() => drop.remove(), 1200);
    } else {
      for (let i = 0; i < 4; i++) {
        const grain = document.createElement("div");
        const tx = (Math.random() - .5) * 60;
        const ty = 200 + Math.random() * 40; // ระยะตกของผง
        grain.className = "ck-grain";
        grain.style.cssText = `background:${color}; --tx:${tx}px; --ty:${ty}px;`;
        container.appendChild(grain);
        setTimeout(() => grain.remove(), 1000);
      }
    }
  }, 15);
  return iv;
}
    // ─── Fill visual inside bowl ───
   function updateFillVisual(itemKey) {
      const el = document.getElementById(`ck-fill-${itemKey}`);
      if (!el) return;

      // 1. แสดงวัตถุดิบขึ้นมาตอนเทเสร็จ
      el.style.opacity = "1";
      el.style.transform = "translateY(0)"; // เลื่อนลงมาที่ตำแหน่งในถ้วย
      el.style.transition = "opacity 0.5s ease-in, transform 0.5s ease-out";

      // 2. ✨ เพิ่มส่วนนี้: สั่งให้หายไปหลังจากโชว์ตัวไปแล้ว 1.5 วินาที
      setTimeout(() => {
        // ค่อยๆ จางหายไป
        el.style.transition = "opacity 0.8s ease-out"; 
        el.style.opacity = "0";

        // หลังจากจางหายสนิท ให้รีเซ็ตตำแหน่งเผื่อไว้ (เลือกใส่หรือไม่ก็ได้)
        setTimeout(() => {
          el.style.transform = "translateY(180px)";
        }, 800);
      }, 1500); // 1.5 วินาที คือเวลาที่วัตถุดิบจะแช่อยู่ในถ้วยก่อนหายไป
    }
    // ─── Stir Phase ───
function triggerStirPhase() {
      gs.isStirringEnabled = true;
      gs.stirProgress = 0;
      playTone("phase");
      
      // แสดงหลอดพลังกลับมาใหม่
      const barContainer = document.getElementById("ck-stir-bar");
      if (barContainer) barContainer.style.display = "block"; 

      // รีเซ็ตแถบสีข้างในให้เริ่มจาก 0
      const progress = document.getElementById("ck-stir-progress");
      if (progress) {
        progress.style.height = "0%";
      }

      // แสดงพายและคำใบ้
      document.getElementById("ck-spatula")?.classList.remove("ck-hidden");
      document.getElementById("ck-stir-hint")?.classList.remove("ck-hidden");
      const msg = gs.steps.length === 3
        ? "ใส่ครบสามอย่างแล้ว อย่าลืมคนผสมให้เข้ากันก่อนนะหลาน!"
        : "รอบสุดท้ายแล้ว คนให้เนื้อเนียนเลยนะจ๊ะ ขนมจะได้สวยๆ";
      if (npcBubble) npcBubble.classList.remove("ck-hidden");
      typeEffect(npcText, msg, 40);

      bowl.addEventListener("mousemove", handleStirring);
    }

function handleStirring(e) {
  if (!gs.isStirringEnabled || !gs.isGameActive) return;

  const rect = bowl.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  // dy ไม่ถูกใช้ในการคำนวณการเอียงของช้อนแนวตั้ง
  const dx = e.clientX - centerX;
  const spatula = document.getElementById("ck-spatula");

  if (spatula) {
    // 1. ตำแหน่ง X: คงเดิม (ปรับให้เมาส์อยู่กึ่งกลางด้ามช้อน)
    let moveX = (e.clientX - rect.left) - 170; 
    
    // จำกัดพื้นที่ไม่ให้ช้อนทะลุขอบถ้วย (Clamping) - คงเดิม
    moveX = Math.max(-60, Math.min(35, moveX)); 
    spatula.style.left = moveX + "px";

    // 2. ตำแหน่ง Y (Bottom): คงเดิม (ทำให้จมลงไปในถ้วย)
    const centerPoint = -12; 
    const curveOffset = Math.abs(centerPoint - moveX) * 0.25; 
    // ใช้ค่า 10px เพื่อให้จมลงไปหลัง ck-bowl-front
    spatula.style.bottom = (10 - curveOffset) + "px"; 

    // --- 3. จุดสำคัญที่ปรับให้ช้อนตั้งตรงมากขึ้น ---
    // ปรับลดองศาการเอียงสูงสุด (Tilt) จากเดิม +/-12 องศา เหลือ +/-5 องศา
    // และปรับตัวหารให้มากขึ้น (จาก 12 เป็น 25) เพื่อให้การเอียงนุ่มนวลและช้าลง
    const tilt = Math.max(-2, Math.min(1, dx / 25)); 
    spatula.style.transform = `rotate(${tilt}deg)`;
  }

  // ... ส่วนการคำนวณ Progress คงเดิม ...
  const centerY = rect.top + rect.height / 2;
  const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);

  if (gs.lastAngle !== null) {
    let delta = currentAngle - gs.lastAngle;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    
    gs.stirProgress += Math.abs(delta) * 2.5; 
    
    if (Math.floor(gs.stirProgress) % 18 === 0) playTone("stir");

    const progressEl = document.getElementById("ck-stir-progress");
    if (progressEl) {
      progressEl.style.height = Math.min(gs.stirProgress, 100) + "%";
    }

    if (gs.stirProgress >= 100) finishStirring();
  }
  gs.lastAngle = currentAngle;
}
function finishStirring() {
      gs.isStirringEnabled = false;
      gs.stirProgress = 0;
      gs.lastAngle = null;
      playTone("phase");
      bowl.removeEventListener("mousemove", handleStirring);

      // --- เพิ่มส่วนนี้: สั่งให้หลอดพลัง (ตัวโครงหลัก) หายไป ---
      const bar = document.getElementById("ck-stir-bar");
      if (bar) bar.style.display = "none";
      // --------------------------------------------------

      // ซ่อนส่วนประกอบอื่นๆ
      document.getElementById("ck-spatula")?.classList.add("ck-hidden");
      document.getElementById("ck-stir-hint")?.classList.add("ck-hidden");

      if (gs.steps.length === 3) {
        if (npcBubble) npcBubble.classList.remove("ck-hidden");
        typeEffect(npcText, "เก่งมากหลาน! เนื้อเริ่มเนียนแล้ว ใส่ส่วนผสมที่เหลือต่อเลยจ่ะ", 40)
          .then(() => {
            setTimeout(() => { 
              if (!gs.isFinishing) npcBubble.classList.add("ck-hidden"); 
            }, 2500);
          });
      } else if (gs.steps.length === 7) {
        finishGame(false);
      }
    }

// ─── Start game flow ───
this._startGame = async () => {
  document.getElementById("ck-start-screen").style.display = "none";

  gs.steps = []; gs.isFinishing = false; gs.gameTimeLeft = 45;
  gs.currentY = 180; gs.stirProgress = 0;
  bgm.pause(); bgm.currentTime = 0;

  document.getElementById("ck-stir-hint")?.classList.add("ck-hidden");
  document.querySelectorAll(".ck-filling-asset").forEach(el => {
    el.style.opacity = "0"; el.style.transform = "translateY(180px)";
  });
  document.querySelectorAll(".ck-ingredient").forEach(el => { el.style.visibility = "visible"; });
  document.getElementById("ck-bowl-hint")?.classList.remove("ck-hidden");

  buildIngredients();

  if (npcBubble) npcBubble.classList.remove("ck-hidden");
  
  // 1. ยายบอกเกริ่นนำ
  await speak("มาหลาน... ยายจะบอกสูตรลูกชุบให้ฟังนะ ตั้งใจฟังล่ะ", 2000);

// 2. ลูปแสดงขั้นตอนทีละข้อ
  for (let i = 0; i < recipe.length; i++) {
    const ingredientName = recipeLabels[recipe[i]]; 
    await speak(`ขั้นตอนที่ ${i + 1} : ใส่${ingredientName}`, 1200);
  }

  // --- เพิ่มส่วนนี้เข้าไป ---
  await speak("ตั้งใจทำนะหลาน...เริ่มได้!", 2500);
  // -----------------------

  // ✨ บรรทัดนี้จะทำให้กล่องข้อความหายไปหลังจากพูดประโยคข้างบนจบ
  if (npcBubble) npcBubble.classList.add("ck-hidden");

  // 3. เริ่มนับถอยหลังและเข้าสู่เกม
  await startCountdown();
  startGameplay();
}

    // ─── Countdown ───
    function startCountdown() {
      return new Promise(resolve => {
        const ov  = document.getElementById("ck-countdown-overlay");
        const txt = document.getElementById("ck-countdown-text");
        if (ov) ov.style.display = "flex";
        const counts = [3, 2, 1, "\u0e40\u0e23\u0e34\u0e48\u0e21!"];
        let idx = 0;
        const iv = setInterval(() => {
          if (idx < counts.length) {
            if (txt) {
              txt.innerText = counts[idx];
              txt.style.animation = "none"; void txt.offsetWidth;
              txt.style.animation = "ck-count-bounce 0.5s ease-out forwards";
            }
            if (typeof counts[idx] === "number") playClean(sfxCount);
            else playClean(sfxGo);
            idx++;
          } else {
            clearInterval(iv);
            if (ov) ov.style.display = "none";
            try { bgm.play().catch(() => {}); } catch(_){}
            resolve();
          }
        }, 1000);
      });
    }

    // ─── Gameplay timer ───
function startGameplay() {
  gs.isGameActive = true;
  const t = getGameTimer();
  
  if (t) { 
    t.classList.remove("ck-hidden"); 
    // ใส่คำว่า เวลา: ตอนเริ่ม
    t.textContent = `\u0e40\u0e27\u0e25\u0e32: ${gs.gameTimeLeft}`; 
  }

  gs.gameInterval = setInterval(() => {
    gs.gameTimeLeft--;
    // อัปเดตตัวเลขพร้อมคำว่า เวลา: ในทุกๆ วินาที
    if (t) t.textContent = `\u0e40\u0e27\u0e25\u0e32: ${gs.gameTimeLeft}`; 
    
    if (gs.gameTimeLeft <= 0) finishGame(true);
  }, 1000);
}

    // ─── Finish ───
    function finishGame(isTimeout) {
      if (gs.isFinishing) return;
      gs.isFinishing = true; gs.isGameActive = false;
      clearInterval(gs.gameInterval);
      bowl.removeEventListener("mousemove", handleStirring);

      getGameTimer()?.classList.add("ck-hidden");
      document.getElementById("ck-stir-progress")?.classList.add("ck-hidden");
      document.getElementById("ck-spatula")?.classList.add("ck-hidden");
      document.getElementById("ck-stir-hint")?.classList.add("ck-hidden");

      setTimeout(() => {
        if (npcBubble) npcBubble.classList.remove("ck-hidden");
        playTone(isTimeout ? "fail" : "success");
        const msg = isTimeout
          ? "หมดเวลาแล้วจ๊ะ! มัวแต่คนเพลินหรือเปล่านี่เรา"
          : "ทำเสร็จแล้วรึ? ไหนยายดูซิว่าคนจนเนียนดีหรือยัง...";
        typeEffect(npcText, msg, 40).then(() => setTimeout(calcScore, 1000));
      }, isTimeout ? 0 : 1000);
    }

    // ─── Score (client-side, ไม่ต้องพึ่ง Go backend) ───
    function calcScore() {
      let score = 0;
      let correct = 0;
      for (let i = 0; i < recipe.length; i++) {
        if (i < gs.steps.length && gs.steps[i] === recipe[i]) { score += 10; correct++; }
      }
      if (correct === recipe.length && gs.gameTimeLeft > 0) score += 30;
      gs.score = score;

      let text, grade;
      if (correct === recipe.length) {
        playTone("success");
        text = `โอ้โห! เก่งมากหลาน ทำถูกหมดทั้ง 7 ขั้นตอนเลย รับไป ${score} คะแนนเต็ม!`;
        grade = "ยอดเชฟลูกชุบ";
      } else if (correct >= 4) {
        playTone("phase");
        text = `ทำเสร็จแล้วจ้ะหลาน ได้ไป ${score} คะแนน... มีบางขั้นตอนที่สลับกันนะ`;
        grade = "พ่อครัวฝึกหัด";
      } else {
        playTone("fail");
        text = `ยายชิมแล้วรสชาติแปลกๆ นะหลาน... ได้ไป ${score} คะแนนจ้ะ`;
        grade = "ต้องพยายามอีกนิด";
      }

      typeEffect(npcText, text, 40).then(() => setTimeout(() => showResult(score, grade, text), 1500));
    }

    function showResult(score, grade, text) {
      bgm.pause(); bgm.currentTime = 0;
      const rs = document.getElementById("ck-result-screen");
      const sc = document.getElementById("ck-total-score");
      const rn = document.getElementById("ck-result-note");
      if (npcBubble) npcBubble.classList.remove("ck-hidden");
      if (sc)  sc.textContent = score;
      if (rn) rn.textContent = grade ? `${grade} • ${text}` : "คุณยายบอกผลการทำขนมให้แล้ว";
      if (rs)  { rs.classList.remove("ck-hidden"); rs.style.display = "flex"; }
    }
  }

  /* ─────────────── CSS ─────────────── */
  _getCSS(I) {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700;800&display=swap');

      .ck-hidden { display: none !important; }

      /* ─── Countdown ─── */
      #ck-countdown-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.5);
        display: none; justify-content: center; align-items: center; z-index: 600;
      }
      #ck-countdown-text {
        color: #f1c40f; font-size: 200px; font-weight: 900;
        font-family: 'Sarabun', sans-serif; text-shadow: 8px 8px 0 #000;
        pointer-events: none;
        animation: ck-count-bounce 0.5s ease-out forwards;
      }
      @keyframes ck-count-bounce {
        0%   { transform: scale(0.5); opacity: 0; }
        50%  { transform: scale(1.2); opacity: 1; }
        100% { transform: scale(1);   opacity: 1; }
      }

      /* ─── Timer ─── */
      #ck-timer {
        position: absolute; top: 16px; right: 18px; z-index: 10;
        min-width: 236px; min-height: 86px; box-sizing: border-box;
        background: url('${HUD_SIGN_IMAGE}') center/100% 100% no-repeat;
        color: #ffe4a8;
        font-size: 1.5rem; font-weight: 800; padding: 22px 26px 12px;
        box-shadow: 0 10px 18px rgba(0,0,0,0.28);
        display: flex; align-items: center; justify-content: center;
      }

      /* ─── NPC ─── */
    .ck-npc-area { position: absolute; right: 150px; bottom: 70px; z-index: 2; }
.ck-grandma { width: 315px; }
.ck-speech-bubble {
    position: absolute; bottom: 530px; right: 240px;
    background: #ffffff; border-radius: 15px; padding: 20px 30px;
    text-align: center; color: #4a4a4a; font-size: 1.5rem;
    font-weight: bold; min-width: 280px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    z-index: 200;
}
.ck-speech-bubble:after {
    content: ''; position: absolute; right: -20px; top: 50%;
    transform: translateY(-50%);
    border-width: 15px 0 15px 20px; border-style: solid;
    border-color: transparent transparent transparent #ffffff;
}/* ─── Table Area ─── */
      .ck-table-area {
        position: absolute; 
        bottom: 0px; /* ปรับเป็น 0 เพื่อให้พิกัด bottom ของวัตถุดิบอ้างอิงจากล่างสุดของจอ */
        left: 50%; 
        transform: translateX(-50%);
        /* ยกเลิก Flexbox เพราะเราจะใช้ Absolute แทน */
        display: block; 
        width: 100vw; 
        height: 500px; /* กำหนดความสูงพื้นที่วางของให้ครอบคลุมจุดที่วาง */
        z-index: 4; 
        pointer-events: none; /* เพื่อให้คลิกทะลุช่องว่างได้ */
      }

      .ck-table-decor {
        position: absolute;
        bottom: 0px;
        left: 50%;
        transform: translateX(-50%);
        width: min(100vw, 3900px);
        height: auto;
        z-index: 2;
        pointer-events: none;
        filter: drop-shadow(0 10px 20px rgba(0,0,0,0.35));
      }

      .ck-ingredient {
        /* ใช้ absolute เพื่อให้อ้างอิง left/bottom จาก .ck-table-area */
        position: absolute; 
        object-fit: contain; 
        cursor: grab;
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));
        transition: transform 0.15s;
        pointer-events: auto; /* ให้ตัววัตถุดิบกลับมาคลิกได้ */
      }

      .ck-ingredient:hover { 
        transform: scale(1.05); /* ลด scale ลงนิดหน่อยเพราะบางชิ้นใหญ่มาก */
        z-index: 50; /* ให้ชิ้นที่ชี้อยู่ลอยขึ้นมาข้างบน */
      }

      .ck-placeholder {
        position: absolute;
        background: rgba(200,150,50,0.8);
        border: 2px solid #ffd700; border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.65rem; font-weight: 800; color: #fff;
        text-align: center; cursor: grab; padding: 4px; box-sizing: border-box;
        pointer-events: auto;
      }
/* --- Bowl Container --- */
      .ck-bowl-container {
        position: absolute; 
        top: 43%; 
        left: 50%; 
        transform: translate(-50%, -50%);
        width: 270px; 
        height: 228px; 
        z-index: 4;
      }

      /* ถ้วยใบหลัง (อยู่หลังช้อน) */
      .ck-bowl-back { 
        position: absolute; 
        width: 100%; 
        bottom: 0; 
        left: 0;
        z-index: 2; 
      }

      /* ไม้พาย (อยู่ระหว่างถ้วยใบหลังและใบหน้า) */
      .ck-spatula {
        z-index: 4; /* มากกว่า back แต่น้อยกว่า front */
        position: absolute;
        width: 270px; 
        /* ปรับค่านี้ให้จมลงไปในถ้วย (เลขยิ่งน้อยยิ่งจมลึก) */
        bottom: 10px; 
        transform-origin: bottom center;
        pointer-events: none;
        transition: transform 0.1s ease-out;
      }

      /* ถ้วยใบหน้า (ทำหน้าที่บังโคนช้อน) */
      .ck-bowl-front { 
        position: absolute; 
        width: 100%; 
        bottom: 0; 
        left: 0;
        z-index: 6; 
        pointer-events: none;
        /* clip-path ปรับให้เป็นรูปตัว U หรือส่วนล่างของถ้วยเพื่อบังส่วนล่างของช้อน */
        clip-path: inset(45% 0 0 0); /* วิธีที่ง่ายที่สุดคือบังครึ่งบนของรูปถ้วยใบหน้าไว้ */
      }

      /* พื้นที่สำหรับใส่ส่วนผสม (อยู่ระหว่างถ้วยหน้า-หลัง) */
      .ck-fill-wrapper {
        position: absolute; 
        width: 100%; 
        height: 100%;
        z-index: 3; 
        overflow: hidden; 
        bottom: 0;
        display: flex; 
        align-items: flex-end; 
        justify-content: center;
        /* ตัดขอบส่วนผสมไม่ให้ทะลุออกนอกก้นถ้วย */
        clip-path: path('M 0,35 Q 135,145 270,35 L 270,270 L 0,270 Z');
      }

      .ck-bowl-hint {
        position: absolute; 
        bottom: 80px; 
        width: 100%; 
        text-align: center;
        color: rgba(255,255,255,0.8); 
        font-size: 0.9rem; 
        font-weight: 700;
        z-index: 8; 
        pointer-events: none; 
        text-shadow: 1px 1px 3px #000;
      }

      /* ─── Stir UI (หลอดพลังและการแจ้งเตือน) ─── */
    /* หลอดพลังหลัก (Container) */
/* --- หลอดพลัง (ฝั่งซ้ายของถ้วย) --- */
      .ck-stir-bar {
        position: absolute;
        left: 50%;
        margin-left: -200px; /* ดันไปทางซ้ายของกึ่งกลางถ้วย */
        top: 30%;
        transform: translateY(-50%);
        width: 25px;
        height: 180px;
        background: rgba(0, 0, 0, 0.6);
        border: 3px solid #fff;
        border-radius: 15px;
        display: none; /* เปิดด้วย JS ใน triggerStirPhase */
        overflow: hidden;
        z-index: 1000;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
      }

      .ck-stir-progress {
        width: 100%;
        position: absolute;
        bottom: 0;
        left: 0;
        height: 0%;
        background: linear-gradient(to top, #ffeb3b, #f44336);
        transition: height 0.1s ease-out;
      }

      /* --- คำใบ้ลูกศร (อยู่ด้านบนถ้วย) --- */
      .stir-hint-wrapper {
        position: absolute;
        top: 43%; /* ขยับขึ้นไปเหนือถ้วยผสม */
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        z-index: 2000;
        pointer-events: none;
        width: 100%;
      }

      .stir-visual-container {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 12px;
      }

      .arrow-green {
        width: 65px;
        height: 35px;
        background: linear-gradient(180deg, #2ecc71 0%, #27ae60 100%);
        filter: drop-shadow(0 4px 2px rgba(0,0,0,0.3));
      }

      .arrow-left-dir {
        clip-path: polygon(40% 0%, 40% 25%, 100% 25%, 100% 75%, 40% 75%, 40% 100%, 0% 50%);
        animation: arrow-push-left 1s infinite ease-in-out;
      }

      .arrow-right-dir {
        clip-path: polygon(0% 25%, 60% 25%, 60% 0%, 100% 50%, 60% 100%, 60% 75%, 0% 75%);
        animation: arrow-push-right 1s infinite ease-in-out;
      }

      .mouse-icon-center {
        font-size: 2.8rem;
        filter: drop-shadow(0 0 10px rgba(255,255,255,0.8));
      }

      .stir-message-box {
        background: #3e2723;
        border: 3px solid #ffd700;
        border-radius: 50px;
        color: #ffffff;
        padding: 10px 40px;
        font-size: 22px;
        font-weight: bold;
        box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        white-space: nowrap;
      }

      /* Animations */
      @keyframes arrow-push-left {
        0%, 100% { transform: translateX(0); opacity: 0.6; }
        50% { transform: translateX(-15px); opacity: 1; }
      }

      @keyframes arrow-push-right {
        0%, 100% { transform: translateX(0); opacity: 0.6; }
        50% { transform: translateX(15px); opacity: 1; }
      }

      .ck-hidden { display: none !important; }
      /* ─── Pour Animation (เอฟเฟกต์การเท) ─── */
      .ck-pouring-wrapper {
        position: fixed; 
        z-index: 500; 
        pointer-events: none;
      }
      .ck-item-pouring {
        width: 100%; 
        height: 100%; 
        object-fit: contain;
        animation: ck-pour-fall 0.4s ease-in forwards;
      }
      @keyframes ck-pour-fall {
        0%   { transform: translateY(-25px) rotate(-60deg); opacity: 1; }
        100% { transform: translateY(0px) rotate(0deg); opacity: 1; }
      }
      .ck-liquid-stream, .ck-powder-stream {
        position: absolute; width: 20px;
      }
      .ck-drop {
        position: absolute; 
        width: 8px; 
        border-radius: 50%;
        animation: ck-drop-fall 1.2s ease-in forwards;
        --ty: 200px;
        height: 12px;
      }
      @keyframes ck-drop-fall {
        0%   { transform: translateY(0); opacity: 1; height: 12px; }
        100% { transform: translateY(var(--ty)); opacity: 0.3; height: 30px; }
      }
      .ck-grain {
        position: absolute; 
        width: 4px; 
        height: 4px; 
        border-radius: 50%;
        animation: ck-grain-fall 1s ease-in forwards;
        --tx: 0px; --ty: 100px;
      }
      @keyframes ck-grain-fall {
        0%   { transform: translate(0,0); opacity: 1; }
        100% { transform: translate(var(--tx), var(--ty)); opacity: 0; }
      }

      /* ─── Start/Result banner ─── */
      .ck-banner-wrapper {
        position: relative; display: flex; justify-content: center; align-items: center;
      }
      .ck-stage-banner {
        width: 700px; max-width: 90vw; height: auto;
        filter: drop-shadow(0 15px 30px rgba(0,0,0,0.6));
      }
      .ck-result-banner {
        width: 650px; max-width: 90vw; height: auto;
        filter: drop-shadow(0 15px 40px rgba(0,0,0,0.7));
      }
      .ck-banner-inner {
        position: absolute; 
        display: flex; 
        flex-direction: column;
        align-items: center; 
        justify-content: center;
        
        /* --- ปรับจาก 50% เป็น 60% หรือ 65% เพื่อเลื่อนลงมา --- */
        top: 62%; 
        
        left: 50%; 
        transform: translate(-50%, -50%);
        
        /* หรือจะใช้ gap เพื่อเพิ่มระยะห่างระหว่างคะแนนกับปุ่มก็ได้ */
        gap: 10px; 
      }
#game-timer {
        position: fixed; 
        top: 20px; 
        left: 20px; 
        font-size: 40px;
        font-weight: bold; 
        color: #fff; 
        background: rgba(0, 0, 0, 0.6);
        padding: 10px 20px; 
        border-radius: 10px; 
        border: 3px solid #FFD700; 
        z-index: 500;
        font-family: "Prompt", sans-serif;
    }
     #ck-btn-start {
        /* ปรับเลขให้น้อยลงเพื่อดันขึ้น (เช่น จาก 100px เหลือ 40px หรือ 20px) */
        margin-top: 30px; 
        
        padding: 15px 40px; font-size: 1.6rem; font-family: 'Sarabun', sans-serif;
        font-weight: 800; color: white;
        background: linear-gradient(180deg,#ffcc00,#ff8800 50%,#ff4400);
        border: 4px solid #fff; border-radius: 50px; cursor: pointer;
        box-shadow: 0 8px 0 #992200, 0 15px 20px rgba(0,0,0,0.5);
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5); outline: none;
      }
        #ck-back-btn { 
        /* ปรับแยกอิสระ ไม่กระทบกับปุ่มเริ่มเกม */
        margin-top: 20px; 
        
        font-size: 1.2rem; padding: 12px 32px;
        /* ... properties อื่นๆ เหมือนปุ่มเริ่มเกม ... */
        font-family: 'Sarabun', sans-serif;
        font-weight: 800; color: white;
        background: linear-gradient(180deg,#ffcc00,#ff8800 50%,#ff4400);
        border: 4px solid #fff; border-radius: 50px; cursor: pointer;
        box-shadow: 0 8px 0 #992200, 0 15px 20px rgba(0,0,0,0.5);
      }
      #ck-back-btn { margin-top: 20px; font-size: 1.2rem; padding: 12px 32px; }

     #ck-total-score {
        font-size: 7rem; 
        font-family: 'Sarabun', sans-serif; 
        font-weight: 900;
        
        /* --- เพิ่มบรรทัดนี้เพื่อดันคะแนนลงมา --- */
        margin-top: 40px; /* ยิ่งตัวเลขมาก คะแนนยิ่งลงมาต่ำ */
        
        background: linear-gradient(180deg,#fff 30%,#ffd700 60%,#ff8c00 100%);
        -webkit-background-clip: text; 
        -webkit-text-fill-color: transparent;
        filter: drop-shadow(6px 6px 0 #632b00);
        animation: ck-score-pop 0.6s cubic-bezier(0.175,0.885,0.32,1.275) forwards;
      }
      @keyframes ck-score-pop {
        0%   { transform: scale(0); opacity: 0; }
        80%  { transform: scale(1.1); }
        100% { transform: scale(1); opacity: 1; }
      }

      @media (max-width: 900px) {
        .ck-table-decor {
          width: min(90vw, 740px);
          bottom: 18px;
        }
        .ck-table-area {
          bottom: 98px;
          max-width: 90vw;
          gap: 6px;
          flex-wrap: wrap;
        }
        .ck-ingredient,
        .ck-placeholder {
          width: 58px;
          height: 58px;
        }
        .ck-npc-area {
          right: 14px;
          bottom: 118px;
        }
        .ck-speech-bubble {
          max-width: 190px;
          margin-bottom: 96px;
        }
        .ck-bowl-container {
          width: 248px;
          height: 220px;
          top: 38%;
        }
      }
    `;
  }

  /* ─────────────── HELPERS ─────────────── */
  _el(tag, attrs = {}) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "style") el.style.cssText = v;
      else el.setAttribute(k, v);
    });
    return el;
  }

  _destroyUI() {
    if (this._bgm) { try { this._bgm.pause(); } catch(_){} this._bgm = null; }
    if (this._gs?.gameInterval) clearInterval(this._gs.gameInterval);
    this._ui.forEach(el => { try { el.remove(); } catch(_){} });
    this._ui = [];
  }
}
>>>>>>> Stashed changes
