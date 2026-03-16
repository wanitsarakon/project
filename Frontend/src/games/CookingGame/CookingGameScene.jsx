import Phaser from "phaser";

/**
 * CookingGameScene.jsx
 * แปลงจาก project-cooking/frontend/ → Phaser Scene (DOM overlay)
 * เกมทำลูกชุบ: ลากวัตถุดิบใส่ชาม → คน → จบเกม
 *
 * Assets path: /cooking/images/ และ /cooking/sounds/
 *
 * รับ props ผ่าน init(data):
 *   - onGameEnd({ score })  ← callback เมื่อเกมจบ
 *   - roomCode, player, roundId
 *
 * ระบบคะแนน (คำนวณ client-side ไม่ต้องพึ่ง Go backend):
 *   - ใส่วัตถุดิบถูกลำดับ: +10 ต่อขั้นตอน
 *   - ใส่ถูกครบ 7 และยังมีเวลา: +30 bonus
 *   - คะแนนสูงสุด: 100
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
    const timer = this._el("div", { id: "ck-timer", class: "ck-hidden" });
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

    // ─── Bowl ───
    const bowl = this._el("div", { id: "ck-bowl", class: "ck-bowl-container" });

    // stir progress (hidden initially)
    const stirProg = this._el("div", { id: "ck-stir-progress", class: "ck-hidden" });
    stirProg.innerHTML = `<div id="ck-stir-bar-bg"><div id="ck-stir-bar"></div></div>`;
    bowl.appendChild(stirProg);

    // stir hint
    const stirHint = this._el("div", { id: "ck-stir-hint", class: "ck-hidden ck-stir-hint" });
    stirHint.innerHTML = `
      <div class="ck-stir-visual">
        <div class="ck-arrow ck-arrow-left">←</div>
        <div class="ck-mouse-icon">🖱️</div>
        <div class="ck-arrow ck-arrow-right">→</div>
      </div>
      <div class="ck-stir-msg">เลื่อนเมาส์ซ้าย-ขวาเพื่อผสม</div>
    `;
    bowl.appendChild(stirHint);

    // bowl back
    const bowlBack = this._el("img");
    bowlBack.src = `${I}ถ้วย copy.png`; bowlBack.className = "ck-bowl-back";
    bowlBack.onerror = () => { bowlBack.style.display = "none"; };
    bowl.appendChild(bowlBack);

    // filling assets (inside bowl visuals)
    const fillWrapper = this._el("div", { class: "ck-fill-wrapper" });
    const fillMap = {
      "fill-bean":    "ถั่วเหลือง_full.png",
      "fill-sugar":   "น้ำตาลทรายขาว.png",
      "fill-coconut": "กะทิ_pour.png",
      "fill-agar":    "ผงวุ้น_pour.png",
      "fill-color":   "สีผสมอาหาร_pour.png",
      "fill-water":   "น้ำเปล่า_pour.png",
      "fill-salt":    "เกลือ_pour.png",
    };
    Object.entries(fillMap).forEach(([id, file]) => {
      const img = this._el("img");
      img.src = `${I}${file}`; img.id = `ck-${id}`;
      img.className = "ck-filling-asset";
      img.onerror = () => { img.style.display = "none"; };
      fillWrapper.appendChild(img);
    });
    bowl.appendChild(fillWrapper);

    // spatula
    const spatula = this._el("img");
    spatula.src = `${I}ช้อน.png`; spatula.id = "ck-spatula";
    spatula.className = "ck-spatula ck-hidden";
    spatula.onerror = () => {
      spatula.src = `${I}spatula.png`;
      spatula.onerror = () => { spatula.style.display = "none"; };
    };
    bowl.appendChild(spatula);

    // bowl front
    const bowlFront = this._el("img");
    bowlFront.src = `${I}ถ้วย.png`; bowlFront.className = "ck-bowl-front";
    bowlFront.onerror = () => { bowlFront.style.display = "none"; };
    bowl.appendChild(bowlFront);

    // hint text
    const bowlHint = this._el("p", { class: "ck-bowl-hint", id: "ck-bowl-hint" });
    bowlHint.textContent = "ลากวัตถุดิบมาที่นี่";
    bowl.appendChild(bowlHint);

    overlay.appendChild(bowl);

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
    bannerImg.src = `${I}ป้ายด่าน.png`; bannerImg.className = "ck-stage-banner";
    bannerImg.onerror = () => { bannerImg.style.display="none"; };
    wrapper.appendChild(bannerImg);

    const inner = this._el("div", { class: "ck-banner-inner" });
    const btn = this._el("button", { id: "ck-btn-start" });
    btn.textContent = "เริ่มทำขนม";
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
    const bannerImg = this._el("img");
    bannerImg.src = `${I}ป้ายด่าน2.png`; bannerImg.className = "ck-result-banner";
    bannerImg.onerror = () => { bannerImg.style.display = "none"; };
    wrapper.appendChild(bannerImg);

    const inner = this._el("div", { class: "ck-banner-inner" });
    const scoreEl = this._el("span", { id: "ck-total-score" });
    scoreEl.textContent = "0";
    inner.appendChild(scoreEl);

    const noteEl = this._el("div", { id: "ck-result-note" });
    noteEl.textContent = "คุณยายจะชิมแล้วบอกผลให้นะ";
    noteEl.style.cssText = "margin-top:10px; max-width:320px; text-align:center; color:#5f2b00; font-weight:700; line-height:1.5;";
    inner.appendChild(noteEl);

    const backBtn = this._el("button", { id: "ck-back-btn" });
    backBtn.textContent = "กลับแผนที่";
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
    const recipe = ["ถั่วเหลือง","น้ำตาลทรายขาว","กะทิ","ผงวุ้น","สีผสมอาหาร","น้ำเปล่า","เกลือ"];
    const ingredientVisualMap = {
      "ถั่วเหลือง":    "ck-fill-bean",
      "น้ำตาลทรายขาว":"ck-fill-sugar",
      "กะทิ":         "ck-fill-coconut",
      "ผงวุ้น":       "ck-fill-agar",
      "สีผสมอาหาร":   "ck-fill-color",
      "น้ำเปล่า":     "ck-fill-water",
      "เกลือ":        "ck-fill-salt",
    };

    // วัตถุดิบ config [name, css-class, file]
    const INGREDIENTS = [
      { name:"ถั่วเหลือง",    cls:"ck-green-bean",  file:"ถั่วเหลือง.png" },
      { name:"น้ำตาลทรายขาว", cls:"ck-sugar",       file:"น้ำตาลทรายขาว.png" },
      { name:"กะทิ",          cls:"ck-coconut",     file:"กะทิ.png" },
      { name:"ผงวุ้น",        cls:"ck-agar",        file:"ผงวุ้น.png" },
      { name:"สีผสมอาหาร",   cls:"ck-color",       file:"สีผสมอาหาร.png" },
      { name:"น้ำเปล่า",      cls:"ck-water",       file:"น้ำเปล่า.png" },
      { name:"เกลือ",         cls:"ck-salt",        file:"เกลือ.png" },
      // decoys
      { name:"palm_sugar",   cls:"ck-decoy-1",     file:"palm_sugar.png" },
      { name:"ไข่ไก่",        cls:"ck-decoy-2",     file:"ไข่ไก่.png" },
      { name:"น้ำเชื่อม",     cls:"ck-decoy-3",     file:"น้ำเชื่อม.png" },
      { name:"กลิ่นผลไม้",   cls:"ck-decoy-4",     file:"กลิ่นผลไม้.png" },
    ];

    // sounds
    const sfxCount = new Audio(`${S}count.mp3`);
    const sfxGo    = new Audio(`${S}start_game.mp3`);
    const bgm      = new Audio(`${S}bgm.mp3`);
    bgm.loop = true;
    this._bgm = bgm;

    const playClean = (a) => { try { a.pause(); a.currentTime=0; a.play(); } catch(_){} };

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
        img.onerror = () => {
          // fallback placeholder
          img.style.display = "none";
          const ph = document.createElement("div");
          ph.className = `ck-ingredient ${ing.cls} ck-placeholder`;
          ph.dataset.name = ing.name;
          ph.textContent = ing.name;
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
      document.getElementById("ck-bowl-hint")?.classList.add("ck-hidden");
      srcEl.style.visibility = "hidden";

      // pour animation
      const srcRect  = srcEl.getBoundingClientRect();
      const bowlRect = bowl.getBoundingClientRect();
      const wrapper  = document.createElement("div");
      wrapper.className = "ck-pouring-wrapper";
      wrapper.style.cssText = `
        width:${srcRect.width}px; height:${srcRect.height}px;
        left:${bowlRect.left + bowlRect.width/2 - srcRect.width/2}px;
        top:${bowlRect.top - 130}px;
      `;
      document.body.appendChild(wrapper);

      const img = document.createElement("img");
      img.src = `${I}${name}.png`;
      img.className = "ck-item-pouring";
      img.onerror = () => { img.style.display = "none"; };
      wrapper.appendChild(img);

      const color = getStreamColor(name);
      let pourTimer;
      setTimeout(() => { pourTimer = startPourEffect(wrapper, name, color, 180); }, 400);
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
    const isLiquid = n => ["กะทิ","น้ำเปล่า","สีผสมอาหาร","น้ำเชื่อม","ไข่ไก่","กลิ่นผลไม้"].includes(n);

    function getStreamColor(n) {
      const m = { "ถั่วเหลือง":"#f3e18a","น้ำตาลทรายขาว":"#fff","กะทิ":"#fff",
        "ผงวุ้น":"rgba(255,255,255,0.7)","สีผสมอาหาร":"#ff4d4d",
        "น้ำเปล่า":"rgba(120,199,226,0.6)","เกลือ":"#eee",
        "palm_sugar":"#f2efed","ไข่ไก่":"#FFD700","น้ำเชื่อม":"#FFFACD","กลิ่นผลไม้":"#FF69B4" };
      return m[n] || "#fff";
    }

    function startPourEffect(parent, name, color, fallDist) {
      const container = document.createElement("div");
      container.className = isLiquid(name) ? "ck-liquid-stream" : "ck-powder-stream";
      container.style.cssText = `position:absolute; left:calc(50% - 30px); top:35%; z-index:5;`;
      parent.appendChild(container);
      const iv = setInterval(() => {
        if (isLiquid(name)) {
          const drop = document.createElement("div");
          drop.className = "ck-drop";
          drop.style.cssText = `background:${color}; --ty:${fallDist+25}px;`;
          container.appendChild(drop);
          setTimeout(() => drop.remove(), 1200);
        } else {
          for (let i = 0; i < 4; i++) {
            const grain = document.createElement("div");
            const tx = (Math.random()-.5)*60;
            const ty = fallDist + Math.random()*40;
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
    function updateFillVisual(name) {
      const id = ingredientVisualMap[name];
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      el.style.opacity = "1";
      gs.currentY -= 20;
      if (gs.currentY < 45) gs.currentY = 45;
      el.style.transform = `translateY(${gs.currentY}px)`;
    }

    // ─── Stir Phase ───
    function triggerStirPhase() {
      gs.isStirringEnabled = true;
      gs.stirProgress = 0;
      const bar = document.getElementById("ck-stir-bar");
      if (bar) bar.style.height = "0%";
      document.getElementById("ck-stir-progress")?.classList.remove("ck-hidden");
      document.getElementById("ck-spatula")?.classList.remove("ck-hidden");
      document.getElementById("ck-stir-hint")?.classList.remove("ck-hidden");

      const msg = gs.steps.length === 3
        ? "ใส่ครบสามอย่างแล้ว อย่าลืมคนผสมให้เข้ากันก่อนนะหลาน!"
        : "รอบสุดท้ายแล้ว คนให้เนื้อเนียนเลยนะจ๊ะ ขนมจะได้สวยๆ";
      if (npcBubble) npcBubble.classList.remove("ck-hidden");
      typeEffect(npcText, msg, 40);

      bowl.addEventListener("mousemove", handleStirring);
    }

    // ─── Stirring ───
    function handleStirring(e) {
      if (!gs.isStirringEnabled || !gs.isGameActive) return;
      const rect     = bowl.getBoundingClientRect();
      const centerX  = rect.left + rect.width / 2;
      const centerY  = rect.top  + rect.height / 2;
      const dx       = e.clientX - centerX;
      const dy       = e.clientY - centerY;
      const angle    = Math.atan2(dy, dx);
      const spatula  = document.getElementById("ck-spatula");

      if (spatula) {
        let mx = Math.max(60, Math.min(180, e.clientX - rect.left - 40));
        spatula.style.left   = mx + "px";
        spatula.style.bottom = (60 - Math.abs(130 - mx) * 0.25) + "px";
        spatula.style.transform = `rotate(${Math.max(-25, Math.min(25, dx/4))}deg)`;
      }

      if (gs.lastAngle !== null) {
        let delta = angle - gs.lastAngle;
        if (delta >  Math.PI) delta -= Math.PI * 2;
        if (delta < -Math.PI) delta += Math.PI * 2;
        gs.stirProgress += Math.abs(delta) * 2.5;
        const bar = document.getElementById("ck-stir-bar");
        if (bar) bar.style.height = Math.min(gs.stirProgress, 100) + "%";
        if (gs.stirProgress >= 100) finishStirring();
      }
      gs.lastAngle = angle;
    }

    function finishStirring() {
      gs.isStirringEnabled = false;
      gs.stirProgress = 0;
      gs.lastAngle = null;
      bowl.removeEventListener("mousemove", handleStirring);
      document.getElementById("ck-stir-progress")?.classList.add("ck-hidden");
      document.getElementById("ck-spatula")?.classList.add("ck-hidden");
      document.getElementById("ck-stir-hint")?.classList.add("ck-hidden");

      if (gs.steps.length === 3) {
        if (npcBubble) npcBubble.classList.remove("ck-hidden");
        typeEffect(npcText, "ดีมากหลาน! ผสมเข้ากันดีแล้ว ใส่ส่วนผสมที่เหลือต่อได้เลยจ่ะ", 40)
          .then(() => setTimeout(() => { if (npcBubble) npcBubble.classList.add("ck-hidden"); }, 2000));
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
      await speak("มาหลาน... ยายจะบอกสูตรลูกชุบให้ฟังนะ ตั้งใจฟังล่ะ", 2000);
      for (let i = 0; i < recipe.length; i++) {
        await speak(`ขั้นตอนที่ ${i + 1}: ใส่ "${recipe[i]}"`, 1000);
      }
      await speak("ใส่ส่วนผสมแล้ว อย่าลืมคนให้เข้ากันตามที่ยายบอกด้วยนะหลาน... เริ่มได้!", 2000);
      if (npcBubble) npcBubble.classList.add("ck-hidden");

      await startCountdown();
      startGameplay();
    };

    // ─── Countdown ───
    function startCountdown() {
      return new Promise(resolve => {
        const ov  = document.getElementById("ck-countdown-overlay");
        const txt = document.getElementById("ck-countdown-text");
        if (ov) ov.style.display = "flex";
        const counts = [3, 2, 1, "เริ่ม!"];
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
      const t = document.getElementById("ck-timer");
      if (t) { t.classList.remove("ck-hidden"); t.textContent = `เวลา: ${gs.gameTimeLeft}`; }
      gs.gameInterval = setInterval(() => {
        gs.gameTimeLeft--;
        if (t) t.textContent = `เวลา: ${gs.gameTimeLeft}`;
        if (gs.gameTimeLeft <= 0) finishGame(true);
      }, 1000);
    }

    // ─── Finish ───
    function finishGame(isTimeout) {
      if (gs.isFinishing) return;
      gs.isFinishing = true; gs.isGameActive = false;
      clearInterval(gs.gameInterval);
      bowl.removeEventListener("mousemove", handleStirring);

      document.getElementById("ck-timer")?.classList.add("ck-hidden");
      document.getElementById("ck-stir-progress")?.classList.add("ck-hidden");
      document.getElementById("ck-spatula")?.classList.add("ck-hidden");
      document.getElementById("ck-stir-hint")?.classList.add("ck-hidden");

      setTimeout(() => {
        if (npcBubble) npcBubble.classList.remove("ck-hidden");
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
        text = `โอ้โห! เก่งมากหลาน ทำถูกหมดทั้ง 7 ขั้นตอนเลย รับไป ${score} คะแนนเต็ม!`;
        grade = "ยอดเชฟลูกชุบ";
      } else if (correct >= 4) {
        text = `ทำเสร็จแล้วจ้ะหลาน ได้ไป ${score} คะแนน... มีบางขั้นตอนที่สลับกันนะ`;
        grade = "พ่อครัวฝึกหัด";
      } else {
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
        position: absolute; top: 10px; right: 20px; z-index: 10;
        background: rgba(0,0,0,0.6); color: #ffd700;
        font-size: 1.5rem; font-weight: 800; padding: 8px 20px; border-radius: 12px;
        border: 2px solid #ffd700;
      }

      /* ─── NPC ─── */
      .ck-npc-area {
        position: absolute; bottom: 0; left: 20px;
        display: flex; align-items: flex-end; gap: 10px; z-index: 5;
        pointer-events: none;
      }
      .ck-speech-bubble {
        background: white; border: 2px solid #555; border-radius: 14px;
        padding: 10px 16px; font-size: 1rem; font-weight: 700; color: #333;
        max-width: 260px; position: relative; margin-bottom: 60px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      }
      .ck-speech-bubble p { margin: 0; }
      .ck-grandma { width: 160px; height: auto; animation: ck-nudge 3s ease-in-out infinite; }
      @keyframes ck-nudge {
        0%,100% { transform: translateY(0); }
        50%      { transform: translateY(-10px); }
      }

      /* ─── Table Area ─── */
      .ck-table-area {
        position: absolute; bottom: 82px; left: 51%; transform: translateX(-50%);
        display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;
        max-width: 700px; z-index: 4; padding: 0 20px;
      }
      .ck-table-decor {
        position: absolute;
        bottom: 22px;
        left: 50%;
        transform: translateX(-50%);
        width: min(78vw, 800px);
        height: auto;
        z-index: 2;
        pointer-events: none;
        filter: drop-shadow(0 10px 20px rgba(0,0,0,0.35));
      }
      .ck-ingredient {
        width: 70px; height: 70px; object-fit: contain; cursor: grab;
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));
        transition: transform 0.15s;
      }
      .ck-ingredient:hover { transform: scale(1.1); }
      .ck-placeholder {
        width: 70px; height: 70px; background: rgba(200,150,50,0.8);
        border: 2px solid #ffd700; border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.65rem; font-weight: 800; color: #fff;
        text-align: center; cursor: grab; padding: 4px; box-sizing: border-box;
      }

      /* ─── Bowl ─── */
      .ck-bowl-container {
        position: absolute; top: 52%; left: 58%; transform: translate(-50%, -50%);
        width: 300px; height: 300px; z-index: 4;
      }
      .ck-bowl-back, .ck-bowl-front {
        position: absolute; width: 100%; bottom: 0; z-index: 2;
      }
      .ck-bowl-front { z-index: 6; }
      .ck-fill-wrapper {
        position: absolute; width: 100%; height: 100%;
        display: flex; align-items: flex-end; justify-content: center;
        z-index: 3; overflow: hidden; bottom: 0;
      }
      .ck-filling-asset {
        position: absolute; bottom: 0; width: 80%; opacity: 0;
        transition: opacity 0.5s, transform 0.5s;
      }
      .ck-spatula {
        position: absolute; bottom: 60px; left: 100px; width: 60px;
        z-index: 7; pointer-events: none;
        transition: left 0.1s, bottom 0.1s, transform 0.1s;
      }
      .ck-bowl-hint {
        position: absolute; bottom: 30px; width: 100%; text-align: center;
        color: rgba(255,255,255,0.8); font-size: 0.9rem; font-weight: 700;
        z-index: 8; pointer-events: none; text-shadow: 1px 1px 3px #000;
      }

      /* ─── Stir UI ─── */
      #ck-stir-progress {
        position: absolute; top: 10px; left: 50%; transform: translateX(-50%); z-index: 10;
      }
      #ck-stir-bar-bg {
        width: 20px; height: 120px; background: rgba(0,0,0,0.4);
        border: 2px solid #ffd700; border-radius: 20px; overflow: hidden;
      }
      #ck-stir-bar {
        position: absolute; bottom: 0; width: 100%; height: 0%;
        background: linear-gradient(to top, #00ff88, #ffff00, #ff0055);
        transition: height 0.05s; border-radius: 0 0 20px 20px;
      }
      .ck-stir-hint {
        position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
        background: rgba(0,0,0,0.7); border-radius: 10px; padding: 6px 12px;
        color: white; font-size: 0.8rem; text-align: center; z-index: 10;
        white-space: nowrap;
      }
      .ck-stir-visual { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
      .ck-arrow { font-size: 1.2rem; color: #00ff88; }
      .ck-mouse-icon { font-size: 1.3rem; }

      /* ─── Pour animation ─── */
      .ck-pouring-wrapper {
        position: fixed; z-index: 500; pointer-events: none;
      }
      .ck-item-pouring {
        width: 100%; height: 100%; object-fit: contain;
        animation: ck-pour-fall 0.4s ease-in forwards;
        animation-delay: 0s;
      }
      @keyframes ck-pour-fall {
        0%   { transform: translateY(-20px) rotate(-15deg); opacity: 1; }
        100% { transform: translateY(0px) rotate(0deg); opacity: 1; }
      }
      .ck-liquid-stream, .ck-powder-stream {
        position: absolute; width: 20px;
      }
      .ck-drop {
        position: absolute; width: 8px; border-radius: 50%;
        animation: ck-drop-fall 1.2s ease-in forwards;
        --ty: 200px;
        height: 12px;
      }
      @keyframes ck-drop-fall {
        0%   { transform: translateY(0); opacity: 1; height: 12px; }
        100% { transform: translateY(var(--ty)); opacity: 0.3; height: 30px; }
      }
      .ck-grain {
        position: absolute; width: 4px; height: 4px; border-radius: 50%;
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
        width: 700px; max-width: 90vw; height: auto;
        filter: drop-shadow(0 15px 40px rgba(0,0,0,0.7));
      }
      .ck-banner-inner {
        position: absolute; display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        top: 50%; left: 50%; transform: translate(-50%, -50%);
      }

      #ck-btn-start, #ck-back-btn {
        margin-top: 100px;
        padding: 15px 40px; font-size: 1.6rem; font-family: 'Sarabun', sans-serif;
        font-weight: 800; color: white;
        background: linear-gradient(180deg,#ffcc00,#ff8800 50%,#ff4400);
        border: 4px solid #fff; border-radius: 50px; cursor: pointer;
        box-shadow: 0 8px 0 #992200, 0 15px 20px rgba(0,0,0,0.5);
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5); outline: none;
      }
      #ck-back-btn { margin-top: 20px; font-size: 1.2rem; padding: 12px 32px; }

      #ck-total-score {
        font-size: 7rem; font-family: 'Sarabun', sans-serif; font-weight: 900;
        background: linear-gradient(180deg,#fff 30%,#ffd700 60%,#ff8c00 100%);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
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
          bottom: 34px;
        }
        .ck-table-area {
          bottom: 94px;
          max-width: 90vw;
          gap: 6px;
        }
        .ck-ingredient,
        .ck-placeholder {
          width: 58px;
          height: 58px;
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
