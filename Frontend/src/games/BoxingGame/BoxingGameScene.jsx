import Phaser from "phaser";

/**
 * BoxingGameScene.jsx
 * แปลงจาก game-boxing/frontend/ → Phaser Scene (DOM overlay)
 * เกมจำท่ามวยไทย: จำรูปท่า → ลาก Drag & Drop ชื่อท่าไปที่เงา
 *
 * Assets path: /assets/boxing/images/ และ /assets/boxing/sounds/
 *
 * รับ props ผ่าน init(data):
 *   - onGameEnd({ score })  ← callback เมื่อเกมจบ
 *   - roomCode, player, roundId
 */
export default class BoxingGameScene extends Phaser.Scene {
  constructor() {
    super({ key: "BoxingGameScene" });
    this._ui = [];
  }

  /* ─────────────── INIT ─────────────── */
  init(data = {}) {
    this.onGameEnd = data.onGameEnd ?? null;
    this.roomCode  = data.roomCode  ?? null;
    this.player    = data.player    ?? null;
    this.roundId   = data.roundId   ?? null;
  }

  /* ─────────────── PRELOAD ─────────────── */
  preload() {
    // ไม่ต้องโหลด asset ผ่าน Phaser เพราะใช้ DOM ทั้งหมด
  }

  /* ─────────────── CREATE ─────────────── */
  create() {
    const { width, height } = this.scale;
    // พื้นหลัง fallback สีน้ำตาลเข้มถ้าไม่มี bg
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a0a00);
    this._buildOverlay();
    this.events.once("shutdown", () => this._destroyUI());
    this.events.once("destroy",  () => this._destroyUI());
  }

  /* ─────────────── DOM OVERLAY ─────────────── */
  _buildOverlay() {
    const overlay = this._el("div", {
      id: "bg-overlay",
      style: `
        position: fixed; inset: 0; z-index: 200;
        font-family: 'Sarabun', sans-serif;
        background-image: url('/assets/boxing/images/bg.png');
        background-size: cover; background-position: center;
        overflow: hidden; user-select: none;
      `
    });

    const style = this._el("style");
    style.textContent = this._getCSS();
    overlay.appendChild(style);

    // ─── Start Screen ───
    overlay.appendChild(this._buildStartScreen());

    // ─── Countdown Overlay ───
    const cdOv = this._el("div", { id: "bg-countdown-overlay" });
    const cdTxt = this._el("div", { id: "bg-countdown-text" });
    cdOv.appendChild(cdTxt);
    overlay.appendChild(cdOv);

    // ─── Result Modal ───
    overlay.appendChild(this._buildResultModal());

    // ─── Main Game Container ───
    const main = this._el("div", { id: "bg-main", class: "bg-hidden" });
    main.style.cssText = `
      width: 100%; max-width: 1400px; margin: 0 auto; padding: 10px 20px;
      box-sizing: border-box; height: 100vh;
      display: flex; flex-direction: column; align-items: center;
      padding-bottom: 140px;
    `;

    // HUD (เวลา + คะแนน)
    const hud = this._el("div");
    hud.style.cssText = `
      display: flex; justify-content: space-between; width: 100%;
      max-width: 1100px; padding: 20px 50px; box-sizing: border-box;
      pointer-events: none; margin-top: -30px;
    `;
    hud.appendChild(this._hudBox(`<span id="bg-timer" style="color:#d32f2f;">เวลา:20</span>`));
    hud.appendChild(this._hudBox(`<span id="bg-score" style="color:#2e7d32;">คะแนน:0</span>`));
    main.appendChild(hud);

    // Progress Bar
    const prog = this._el("div");
    prog.style.cssText = `
      width: 100%; max-width: 700px; position: relative;
      margin-top: -20px; margin-bottom: 15px; text-align: center; z-index: 5;
    `;
    prog.innerHTML = `
      <div style="width:100%;height:22px;background:#4e342e;border:2px solid #ffca28;border-radius:12px;overflow:hidden;">
        <div id="bg-progress-fill" style="height:100%;width:0%;background:linear-gradient(180deg,rgba(255,255,255,0.4) 0%,#4caf50 20%,#2e7d32 80%,#1b5e20 100%);transition:width 0.4s;border-radius:12px 0 0 12px;"></div>
      </div>
      <div style="position:absolute;top:-30px;left:0;width:100%;text-align:center;font-size:1.3rem;font-weight:700;color:#ffd700;text-shadow:2px 2px 0 #3e2723,-1px -1px 0 #3e2723;">
        จำได้แล้ว <span id="bg-placed-count" style="color:#ffca28;font-size:1.5rem;">0</span> / 5
      </div>
    `;
    main.appendChild(prog);

    // Instruction
    const inst = this._el("div", { id: "bg-instruction" });
    inst.style.cssText = `
      font-size: 1.5rem; font-weight: 800; color: #ffd700;
      text-shadow: 2px 2px 0 #3e2723; letter-spacing: 1px; margin-bottom: 25px; text-align: center;
    `;
    inst.textContent = "ช่วงจดจำ: จำรูปท่าและชื่อให้แม่น!";
    main.appendChild(inst);

    // Board
    const board = this._el("div", { id: "bg-board" });
    board.style.cssText = `
      display: flex; justify-content: center; gap: 20px; width: 100%;
    `;
    main.appendChild(board);

    overlay.appendChild(main);

    // Deck (ตัวเลือกการ์ดด้านล่าง)
    const deck = this._el("div", { id: "bg-deck" });
    deck.style.cssText = `
      width: 100%; height: 110px;
      background: linear-gradient(to top, rgba(62,39,35,0.95), rgba(62,39,35,0.7));
      border-top: 3px solid #ffca28;
      display: none; justify-content: center; align-items: center;
      gap: 12px; position: fixed; bottom: 0; left: 0;
      z-index: 210; padding: 10px 15px; box-sizing: border-box;
      box-shadow: 0 -5px 15px rgba(0,0,0,0.5);
    `;
    overlay.appendChild(deck);

    document.body.appendChild(overlay);
    this._ui.push(overlay);

    // init game
    this._initGame();
  }

  /* ─────────────── UI BUILDERS ─────────────── */
  _hudBox(innerHTML) {
    const box = this._el("div");
    box.style.cssText = `
      background-image: url('/assets/boxing/images/counttime.png');
      background-size: 100% 100%; width: 250px; height: 180px;
      display: flex; justify-content: center; align-items: center;
      filter: drop-shadow(0 8px 15px rgba(0,0,0,0.4));
    `;
    const val = this._el("div");
    val.style.cssText = `
      font-size: 1.5rem; font-weight: 600; margin-top: -15px;
      background: linear-gradient(180deg,#fff 0%,#ffd700 50%,#f39c12 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      filter: drop-shadow(2px 2px 0 #3e2723) drop-shadow(-1px -1px 0 #3e2723);
      letter-spacing: 1px;
    `;
    val.innerHTML = innerHTML;
    box.appendChild(val);
    return box;
  }

  _buildStartScreen() {
    const screen = this._el("div", { id: "bg-start-screen" });
    screen.style.cssText = `
      position: absolute; inset: 0; display: flex;
      justify-content: center; align-items: center; z-index: 300;
      background: rgba(0,0,0,0.7);
    `;
    const board = this._el("div");
    board.style.cssText = `
      background-image: url('/assets/boxing/images/start.png');
      background-size: 100% 100%; width: 700px; height: 450px;
      max-width: 90vw; display: flex; flex-direction: column;
      justify-content: center; align-items: center; padding-top: 60px;
      filter: drop-shadow(0 15px 30px rgba(0,0,0,0.6));
      position: relative;
    `;

    // NPC พูด
    const npcWrap = this._el("div");
    npcWrap.style.cssText = `
      position: absolute; left: calc(50% + 60px); bottom: -20px; z-index: 5;
    `;
    const npcImg = this._el("img");
    npcImg.src = "/assets/boxing/images/npc.png";
    npcImg.style.cssText = "width: 220px; height: auto; filter: drop-shadow(10px 10px 15px rgba(0,0,0,0.5)); animation: bg-nudge 3s ease-in-out infinite;";
    npcImg.onerror = () => { npcImg.style.display = "none"; };
    npcWrap.appendChild(npcImg);
    board.appendChild(npcWrap);

    // Speech bubble
    const speech = this._el("div", { id: "bg-npc-speech" });
    speech.style.cssText = `
      position: absolute; top: 30px; left: 50%; transform: translateX(-50%);
      background: white; border: 2px solid #333; border-radius: 12px;
      padding: 10px 16px; font-size: 0.95rem; font-weight: 700;
      color: #c0392b; max-width: 300px; text-align: center; z-index: 6;
    `;
    speech.textContent = "";
    board.appendChild(speech);

    const btn = this._el("button");
    btn.style.cssText = `
      padding: 15px 40px; font-size: 1.6rem; font-family: 'Sarabun', sans-serif;
      font-weight: 800; color: white; margin-top: 110px;
      background: linear-gradient(180deg,#ffcc00,#ff8800 50%,#ff4400);
      border: 4px solid #fff; border-radius: 50px; cursor: pointer;
      box-shadow: 0 8px 0 #992200, 0 15px 20px rgba(0,0,0,0.5);
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5); outline: none; z-index: 7; position: relative;
    `;
    btn.textContent = "เริ่มเล่นเกม";
    btn.onclick = () => this._startGame();

    const wrapper = this._el("div");
    wrapper.style.cssText = "display:flex;flex-direction:column;align-items:center;";
    wrapper.appendChild(btn);
    board.appendChild(wrapper);
    screen.appendChild(board);
    return screen;
  }

  _buildResultModal() {
    const modal = this._el("div", { id: "bg-result-modal" });
    modal.style.cssText = `
      position: absolute; inset: 0; display: none;
      justify-content: center; align-items: center;
      background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); z-index: 400;
    `;
    const board = this._el("div");
    board.style.cssText = `
      background-image: url('/assets/boxing/images/start2.png');
      background-size: 100% 100%; background-repeat: no-repeat;
      width: 700px; height: 450px; max-width: 90vw;
      display: flex; justify-content: center; align-items: center;
      filter: drop-shadow(0 15px 40px rgba(0,0,0,0.7)); position: relative;
    `;
    const scoreEl = this._el("div", { id: "bg-final-score" });
    scoreEl.style.cssText = `
      font-size: 7rem; font-family: 'Sarabun', sans-serif; font-weight: 900;
      background: linear-gradient(180deg,#fff 30%,#ffd700 60%,#ff8c00 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      filter: drop-shadow(6px 6px 0 #632b00);
      transform: translateY(40px);
      animation: bg-score-pop 0.6s cubic-bezier(0.175,0.885,0.32,1.275) forwards;
    `;
    scoreEl.textContent = "0";
    board.appendChild(scoreEl);

    const backBtn = this._el("button");
    backBtn.style.cssText = `
      position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);
      padding: 12px 32px; font-size: 1.1rem; font-family: 'Sarabun', sans-serif;
      font-weight: 800; color: white;
      background: linear-gradient(180deg,#ffcc00,#ff8800); border: 3px solid #fff;
      border-radius: 40px; cursor: pointer; outline: none;
      box-shadow: 0 6px 0 #992200;
    `;
    backBtn.textContent = "กลับแผนที่";
    backBtn.onclick = () => {
      const score = this._gs?.score ?? 0;
      this._destroyUI();
      this.onGameEnd?.({ score });
    };
    board.appendChild(backBtn);
    modal.appendChild(board);
    return modal;
  }

  /* ─────────────── GAME ENGINE ─────────────── */
  _initGame() {
    const BASE = "/assets/boxing/";
    const I    = BASE + "images/";
    const S    = BASE + "sounds/";

    const moves = [
      { id: 1, imgColor: `${I}ท่ามวยสี1.png`,  imgShadow: `${I}ท่ามวยเงา1.png`,  imgName: `${I}ป้าย11.png` },
      { id: 2, imgColor: `${I}ท่ามวยสี2.png`,  imgShadow: `${I}ท่ามวยเงา2.png`,  imgName: `${I}ป้าย2.png` },
      { id: 3, imgColor: `${I}ท่ามวยสี3.png`,  imgShadow: `${I}ท่ามวยเงา3.png`,  imgName: `${I}ป้าย3.png` },
      { id: 4, imgColor: `${I}ท่ามวยสี4.png`,  imgShadow: `${I}ท่ามวยเงา4.png`,  imgName: `${I}ป้าย4.png` },
      { id: 5, imgColor: `${I}ท่ามวยสี5.png`,  imgShadow: `${I}ท่ามวยเงา5.png`,  imgName: `${I}ป้าย6.png` },
    ];
    const decoys = [
      { id: 99,  imgName: `${I}ป้ายหลอก1.png` },
      { id: 100, imgName: `${I}ป้ายหลอก2.png` },
    ];

    const gs = { score: 0, timeLeft: 20, playTime: 15, isPlaying: false, timerInterval: null, hasShuffledMidGame: false };
    this._gs = gs;

    // ─── Audio ───
    const npcAudio       = new Audio(`${S}npc_voice.mp3`);
    const countdownAudio = new Audio(`${S}321.mp3`);
    const startGoAudio   = new Audio(`${S}start_go.mp3`);
    const bgMusic        = new Audio(`${S}bg_music.mp3`);
    bgMusic.loop = true; bgMusic.volume = 0.4;
    this._bgMusic = bgMusic;

    const playBGM  = () => { try { bgMusic.currentTime=0; bgMusic.play(); } catch(_){} };
    const stopBGM  = () => { try { bgMusic.pause(); bgMusic.currentTime=0; } catch(_){} };
    const playClean = (a) => { if (!a) return; try { a.pause(); a.currentTime=0; a.play(); } catch(_){} };

    // ─── Typewriter ───
    const introText = "สวัสดีขอรับ! จำท่ามวยและชื่อให้แม่นภายใน 20 วินาที แล้วลากชื่อวางที่เงาให้ถูกนะ!";
    function typeWriter(text, el, speed, playSound = false) {
      if (!el) return;
      el.textContent = "";
      if (playSound) playClean(npcAudio);
      let i = 0;
      const tick = () => { if (i < text.length) { el.textContent += text[i++]; setTimeout(tick, speed); } };
      tick();
    }

    // ─── Helpers ───
    const getBoard = () => document.getElementById("bg-board");
    const getDeck  = () => document.getElementById("bg-deck");
    const getInst  = () => document.getElementById("bg-instruction");

    function createNameCard(move) {
      const card = document.createElement("img");
      card.src = move.imgName;
      card.className = "bg-name-card";
      card.id = `bg-card-${move.id}`;
      card.dataset.id = move.id;
      card.draggable = false;
      card.onerror = () => {
        // fallback: ถ้ารูปไม่มีให้สร้างป้ายข้อความแทน
        const txt = document.createElement("div");
        txt.className = "bg-name-card bg-name-card-text";
        txt.id = `bg-card-${move.id}`;
        txt.dataset.id = move.id;
        txt.textContent = `ท่าที่ ${move.id}`;
        card.replaceWith(txt);
      };
      card.addEventListener("dragstart", (ev) => ev.dataTransfer.setData("text", ev.target.id));
      return card;
    }

    function allowDrop(ev) { ev.preventDefault(); }
    function drop(ev) {
      ev.preventDefault();
      if (!gs.isPlaying) return;
      const id = ev.dataTransfer.getData("text");
      const dragged = document.getElementById(id);
      if (!dragged) return;
      const target = ev.target.closest(".bg-drop-zone") || ev.target.closest("#bg-deck");
      if (!target) return;
      if (target.id === "bg-deck") {
        target.appendChild(dragged);
      } else if (target.children.length === 0) {
        target.appendChild(dragged);
      }
      updateProgress();
    }

    function updateProgress() {
      let count = 0;
      document.querySelectorAll(".bg-drop-zone").forEach(z => { if (z.children.length > 0) count++; });
      const el = document.getElementById("bg-placed-count");
      const fill = document.getElementById("bg-progress-fill");
      if (el)   el.textContent = count;
      if (fill) fill.style.width = `${(count/5)*100}%`;
      if (count === 5 && gs.isPlaying) setTimeout(() => checkAnswer(false), 500);
    }

    // ─── Init Board ───
    function initBoard() {
      const board = getBoard();
      if (!board) return;
      board.innerHTML = "";
      moves.forEach(move => {
        const container = document.createElement("div");
        container.className = "bg-card-container";
        container.dataset.slotId = move.id;

        const imgBox = document.createElement("div");
        imgBox.className = "bg-image-box";
        const img = document.createElement("img");
        img.src = move.imgShadow;
        img.id = `bg-img-display-${move.id}`;
        img.className = "bg-real-img";
        imgBox.appendChild(img);

        const dropZone = document.createElement("div");
        dropZone.className = "bg-drop-zone";
        dropZone.addEventListener("drop", drop);
        dropZone.addEventListener("dragover", allowDrop);

        container.appendChild(imgBox);
        container.appendChild(dropZone);
        board.appendChild(container);
      });

      const deck = getDeck();
      if (deck) { deck.innerHTML = ""; deck.style.display = "none"; deck.addEventListener("drop", drop); deck.addEventListener("dragover", allowDrop); }

      typeWriter(introText, document.getElementById("bg-npc-speech"), 80, true);
    }

    // ─── Start Game ───
    this._startGame = () => {
      const ss = document.getElementById("bg-start-screen");
      if (ss) ss.style.display = "none";
      try { npcAudio.pause(); npcAudio.currentTime = 0; } catch(_){}
      startCountdown();
    };

    // ─── Countdown ───
    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    async function startCountdown() {
      const ov  = document.getElementById("bg-countdown-overlay");
      const txt = document.getElementById("bg-countdown-text");
      if (ov)  ov.style.display = "flex";
      playClean(countdownAudio);

      for (let i = 3; i > 0; i--) {
        if (txt) { txt.textContent = i; txt.style.animation = "none"; void txt.offsetWidth; txt.style.animation = "bg-count-bounce 0.5s ease-out forwards"; }
        await wait(1000);
      }
      if (txt) { txt.textContent = "เริ่ม!"; txt.style.animation = "none"; void txt.offsetWidth; txt.style.animation = "bg-count-bounce 0.5s ease-out forwards"; }
      playClean(startGoAudio);
      await wait(800);
      if (ov) ov.style.display = "none";

      // แสดง main
      const main = document.getElementById("bg-main");
      if (main) main.classList.remove("bg-hidden");
      playBGM();
      actualStartGame();
    }

    function actualStartGame() {
      moves.forEach(move => {
        const img = document.getElementById(`bg-img-display-${move.id}`);
        if (img) img.src = move.imgColor;
        const container = document.querySelector(`[data-slot-id="${move.id}"]`);
        if (!container) return;
        const dropZone = container.querySelector(".bg-drop-zone");
        dropZone.innerHTML = "";
        const card = createNameCard(move);
        dropZone.appendChild(card);
      });
      startMemorizeTimer();
    }

    function startMemorizeTimer() {
      gs.timeLeft = 20;
      const t = document.getElementById("bg-timer");
      if (t) t.textContent = `เวลา:${gs.timeLeft}`;
      const inst = getInst();
      if (inst) { inst.textContent = "ช่วงจดจำ: จำรูปท่าและชื่อให้แม่น!"; inst.style.color = "#ffd700"; }
      if (gs.timerInterval) clearInterval(gs.timerInterval);
      gs.timerInterval = setInterval(() => {
        gs.timeLeft--;
        const t = document.getElementById("bg-timer");
        if (t) t.textContent = `เวลา:${gs.timeLeft}`;
        if (gs.timeLeft <= 0) { clearInterval(gs.timerInterval); animateShuffle(); }
      }, 1000);
    }

    // ─── Mid-game shuffle ───
    async function triggerMidGameShuffle() {
      const inst = getInst();
      if (inst) { inst.textContent = "⚠️ ระวัง! ท่ามวยสลับตำแหน่ง!"; inst.style.filter = "drop-shadow(0 0 10px #ff0000)"; }
      const board = getBoard();
      if (!board) return;
      const containers = Array.from(board.querySelectorAll(".bg-card-container"));
      board.style.animation = "bg-shake 0.5s";
      await wait(500);
      board.style.animation = "";
      containers.sort(() => Math.random() - 0.5);
      containers.forEach(c => board.appendChild(c));
      board.style.backgroundColor = "rgba(255,255,255,0.3)";
      await wait(100);
      board.style.backgroundColor = "transparent";
      if (inst) inst.style.filter = "";
    }

    // ─── Animate Shuffle ───
    async function animateShuffle() {
      const inst = getInst();
      if (inst) inst.textContent = "กำลังสลับไพ่...";
      const board = getBoard();
      if (!board) return;
      const containers = Array.from(board.querySelectorAll(".bg-card-container"));
      containers.forEach(c => { const dz = c.querySelector(".bg-drop-zone"); dz.style.opacity = "0"; dz.innerHTML = ""; });

      const boardRect = board.getBoundingClientRect();
      const bcX = boardRect.left + boardRect.width / 2;
      const bcY = boardRect.top + boardRect.height / 2;

      containers.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const mx = bcX - (r.left + r.width/2);
        const my = bcY - (r.top + r.height/2);
        const rot = (Math.random()*10)-5;
        c.style.transition = "transform 0.5s cubic-bezier(0.25,1,0.5,1)";
        c.style.zIndex = i + 10;
        setTimeout(() => { c.style.transform = `translate(${mx}px,${my}px) rotate(${rot}deg)`; }, i*150);
      });

      await wait(500 + containers.length*150);
      moves.forEach(move => { const img = document.getElementById(`bg-img-display-${move.id}`); if (img) img.src = move.imgShadow; });
      containers.forEach(c => { c.style.transition = "none"; c.style.transform = ""; c.style.zIndex = ""; });
      containers.sort(() => Math.random() - 0.5);
      containers.forEach(c => board.appendChild(c));
      containers.forEach(c => {
        const r = c.getBoundingClientRect();
        const sx = bcX - (r.left + r.width/2);
        const sy = bcY - (r.top + r.height/2);
        c.style.transform = `translate(${sx}px,${sy}px)`;
      });
      document.body.offsetHeight;
      containers.forEach((c, i) => {
        c.style.transition = "transform 0.6s cubic-bezier(0.25,1,0.5,1)";
        c.querySelector(".bg-drop-zone").style.opacity = "1";
        setTimeout(() => { c.style.transform = ""; }, i*150);
      });
      await wait(600 + containers.length*150);
      containers.forEach(c => { c.style.transition = ""; c.style.transform = ""; });
      startGameplay();
    }

    // ─── Gameplay Phase ───
    function startGameplay() {
      gs.isPlaying = true;
      gs.playTime  = 15;
      const inst = getInst();
      if (inst) { inst.textContent = "ระวังป้ายหลอก! ลากป้ายที่ถูกต้องวางที่รูปเงา!"; inst.style.color = ""; }
      const deck = getDeck();
      if (!deck) return;
      deck.style.display = "flex"; deck.innerHTML = "";
      const all = [...moves, ...decoys];
      all.sort(() => Math.random() - 0.5);
      all.forEach(move => {
        const card = createNameCard(move);
        card.draggable = true;
        deck.appendChild(card);
      });
      updateProgress();
      startPlayTimer();
    }

    function startPlayTimer() {
      if (gs.timerInterval) clearInterval(gs.timerInterval);
      gs.hasShuffledMidGame = false;
      const t = document.getElementById("bg-timer");
      if (t) t.textContent = `เวลา:${gs.playTime}`;
      gs.timerInterval = setInterval(() => {
        gs.playTime--;
        const t = document.getElementById("bg-timer");
        if (t) t.textContent = `เวลา:${gs.playTime}`;
        if (gs.playTime === 5 && !gs.hasShuffledMidGame) { triggerMidGameShuffle(); gs.hasShuffledMidGame = true; }
        if (gs.playTime <= 0) { clearInterval(gs.timerInterval); checkAnswer(true); }
      }, 1000);
    }

    // ─── Check Answer ───
    async function checkAnswer(isTimeUp = false) {
      clearInterval(gs.timerInterval);
      gs.isPlaying = false;
      stopBGM();

      document.querySelectorAll(".bg-name-card").forEach(c => c.draggable = false);
      const containers = document.querySelectorAll(".bg-card-container");
      let score = 0;

      containers.forEach(container => {
        const correctId = parseInt(container.dataset.slotId);
        const dropZone  = container.querySelector(".bg-drop-zone");
        let isCorrect   = false;
        if (dropZone.children.length > 0) {
          const answerId = parseInt(dropZone.children[0].dataset.id);
          if (answerId === correctId) { score += 10; isCorrect = true; }
        }
        container.classList.remove("bg-correct-box", "bg-wrong-box");
        container.classList.add(isCorrect ? "bg-correct-box" : "bg-wrong-box");
        const img      = container.querySelector(".bg-real-img");
        const moveData = moves.find(m => m.id === correctId);
        if (img && moveData) img.src = moveData.imgColor;
      });

      gs.score = score;
      const sc = document.getElementById("bg-score");
      if (sc) sc.textContent = `คะแนน:${score}`;

      getDeck()?.style && (getDeck().style.display = "none");

      setTimeout(() => {
        const modal = document.getElementById("bg-result-modal");
        const fs    = document.getElementById("bg-final-score");
        if (modal) modal.style.display = "flex";
        if (fs)    fs.textContent = score;
      }, 800);
    }

    // init
    initBoard();
  }

  /* ─────────────── CSS ─────────────── */
  _getCSS() {
    return `
      @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700;800&display=swap');

      .bg-hidden { display: none !important; }

      #bg-countdown-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.4);
        display: none; justify-content: center; align-items: center; z-index: 500;
      }
      #bg-countdown-text {
        color: #f1c40f; font-size: 180px; font-weight: 900;
        font-family: 'Sarabun', sans-serif; text-shadow: 8px 8px 0 #000;
        pointer-events: none;
        animation: bg-count-bounce 0.5s ease-out forwards;
      }
      @keyframes bg-count-bounce {
        0%   { transform: scale(0.5); opacity: 0; }
        50%  { transform: scale(1.2); opacity: 1; }
        100% { transform: scale(1);   opacity: 1; }
      }
      @keyframes bg-score-pop {
        0%   { transform: scale(0) translateY(40px); opacity: 0; }
        80%  { transform: scale(1.1) translateY(40px); }
        100% { transform: scale(1) translateY(40px); opacity: 1; }
      }
      @keyframes bg-nudge {
        0%,100% { transform: translateY(0) rotate(0deg); }
        50%     { transform: translateY(-12px) rotate(2deg); }
      }
      @keyframes bg-shake {
        0%   { transform: translate(1px,1px) rotate(0deg); }
        20%  { transform: translate(-3px,0) rotate(1deg); }
        40%  { transform: translate(1px,-1px) rotate(1deg); }
        60%  { transform: translate(-3px,1px) rotate(0deg); }
        80%  { transform: translate(-1px,-1px) rotate(1deg); }
        100% { transform: translate(1px,-2px) rotate(-1deg); }
      }

      .bg-card-container {
        display: flex; flex-direction: column; align-items: center;
        flex: 1; max-width: 160px; margin: 0 auto;
        transition: all 0.5s cubic-bezier(0.68,-0.55,0.27,1.55);
      }
      .bg-image-box {
        background-color: #350901;
        border: 2px solid rgba(70,50,5,0.9);
        box-shadow: 0 6px 12px rgba(0,0,0,0.6);
        border-radius: 12px; overflow: hidden;
        display: flex; justify-content: center; align-items: center;
        width: 140px; height: 240px;
      }
      .bg-real-img { display: block; width: 100%; height: 100%; object-fit: cover; }
      .bg-drop-zone {
        width: 100%; height: 70px; min-height: 70px;
        background: rgba(255,236,179,0.3);
        border: 3px solid #b8860b; border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 8px rgba(0,0,0,0.4);
        transition: opacity 0.3s; margin-top: 30px;
      }
      .bg-drop-zone.drag-over { background: rgba(255,200,0,0.4); }
      .bg-name-card {
        cursor: grab; filter: drop-shadow(0 3px 4px rgba(0,0,0,0.5));
        transition: transform 0.1s; height: 70px !important; width: auto;
      }
      .bg-name-card-text {
        cursor: grab; background: #8b4513; color: #ffd700;
        border: 2px solid #ffd700; border-radius: 8px;
        padding: 8px 12px; font-size: 1rem; font-weight: 800;
        text-shadow: 1px 1px 0 #333; white-space: nowrap;
        filter: drop-shadow(0 3px 4px rgba(0,0,0,0.5));
      }
      .bg-correct-box .bg-image-box { border-color: #4caf50 !important; box-shadow: 0 0 20px #4caf50; }
      .bg-wrong-box  .bg-image-box  { border-color: #f44336 !important; box-shadow: 0 0 20px #f44336; }
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
    if (this._bgMusic) { try { this._bgMusic.pause(); } catch(_){} this._bgMusic = null; }
    if (this._gs?.timerInterval) clearInterval(this._gs.timerInterval);
    this._ui.forEach(el => { try { el.remove(); } catch(_){} });
    this._ui = [];
  }
}