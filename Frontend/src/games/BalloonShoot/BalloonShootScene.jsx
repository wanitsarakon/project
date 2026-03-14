import Phaser from "phaser";

/**
 * BalloonShootScene.jsx
 * แปลงจาก project-ballonshoot-game-update/frontend/game.js
 * เข้าโปรเจค Thai Festival โดยใช้ DOM overlay บน Phaser canvas
 *
 * Assets path: /assets/balloonshoot/image/ และ /assets/balloonshoot/audio/
 *
 * รับ props ผ่าน init(data):
 *   - onGameEnd({ score })  ← callback เมื่อเกมจบ
 *   - roomCode, player, roundId
 */
export default class BalloonShootScene extends Phaser.Scene {

  constructor() {
    super({ key: "BalloonShootScene" });
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
    // โหลด assets ผ่าน Phaser เฉพาะ background ไว้รองรับ fallback
    const img = "/assets/balloonshoot/image/";
    if (!this.textures.exists("bs_bg"))
      this.load.image("bs_bg", `${img}bg.png`);
  }

  /* ─────────────── CREATE ─────────────── */
  create() {
    const { width, height } = this.scale;

    // วาง bg ผ่าน Phaser (canvas layer)
    if (this.textures.exists("bs_bg")) {
      this.add.image(width / 2, height / 2, "bs_bg").setDisplaySize(width, height);
    } else {
      this.add.rectangle(width / 2, height / 2, width, height, 0x0d0d1a);
    }

    // สร้าง overlay ครอบทุกอย่าง
    this._buildOverlay();

    this.events.once("shutdown", () => this._destroyUI());
    this.events.once("destroy",  () => this._destroyUI());
  }

  /* ─────────────── DOM OVERLAY ─────────────── */
  _buildOverlay() {
    const overlay = this._el("div", {
      id: "bs-overlay",
      style: `
        position: fixed; inset: 0; z-index: 200;
        font-family: 'Kanit', sans-serif;
        overflow: hidden; user-select: none;
      `
    });

    // inject CSS
    const style = this._el("style");
    style.textContent = this._getCSS();
    overlay.appendChild(style);

    // canvas เกม
    const canvas = this._el("canvas", { id: "bs-canvas" });
    overlay.appendChild(canvas);

    // UI Layer (คะแนน/เวลา/ลม)
    overlay.appendChild(this._buildUILayer());

    // Power Bar
    overlay.appendChild(this._buildPowerBar());

    // Instruction
    const inst = this._el("div", {
      id: "bs-instruction",
      class: "bs-ui-hidden",
      style: "position:absolute;bottom:30px;width:100%;text-align:center;color:rgba(255,255,255,0.9);font-weight:300;text-shadow:0 2px 10px rgba(0,0,0,0.5);pointer-events:none;"
    });
    inst.innerHTML = "กด <strong>Spacebar</strong> ค้างเพื่อชาร์จ | ปล่อยเพื่อยิง";
    overlay.appendChild(inst);

    // Countdown Overlay
    const countdownOv = this._el("div", { id: "bs-countdown-overlay" });
    const countdownTxt = this._el("div", { id: "bs-countdown-text" });
    countdownTxt.textContent = "3";
    countdownOv.appendChild(countdownTxt);
    overlay.appendChild(countdownOv);

    // Start Screen
    overlay.appendChild(this._buildStartScreen());

    // Score Screen
    overlay.appendChild(this._buildScoreScreen());

    document.body.appendChild(overlay);
    this._ui.push(overlay);

    // init game engine
    this._initGame(canvas);
  }

  /* ─────────────── UI BUILDERS ─────────────── */
  _buildUILayer() {
    const layer = this._el("div", { id: "bs-ui-layer", class: "bs-ui-hidden" });
    layer.style.cssText = `
      position:absolute; top:15px; left:20px; right:20px;
      display:flex; flex-direction:row; justify-content:space-between;
      align-items:flex-start; pointer-events:none; z-index:10;
    `;

    const scoreBox = this._statBox(`คะแนน: <span id="bs-score" style="color:#ffd700;font-size:1.3rem;">0 (x0)</span>`);
    const timeBox  = this._statBox(`<span id="bs-wind-info">เวลา: 60s | ลม: 0.0</span>`);
    layer.appendChild(scoreBox);
    layer.appendChild(timeBox);
    return layer;
  }

  _statBox(innerHTML) {
    const box = this._el("div");
    box.style.cssText = `
      background:rgba(0,0,0,0.6); border:2px solid #ffd700; border-radius:10px;
      padding:8px 16px; color:#fff; font-weight:600; font-size:1.1rem;
      text-shadow:2px 2px 4px rgba(0,0,0,0.8); white-space:nowrap;
    `;
    box.innerHTML = innerHTML;
    return box;
  }

  _buildPowerBar() {
    const wrap = this._el("div", { id: "bs-power-bar", class: "bs-ui-hidden" });
    wrap.style.cssText = `
      position:absolute; left:40px; bottom:120px; width:24px; height:250px;
      background:rgba(0,0,0,0.3); border:3px solid #ffd700;
      box-shadow:0 0 10px rgba(212,175,55,0.6); border-radius:30px; z-index:10;
      overflow:visible;
    `;
    const fill = this._el("div", { id: "bs-power-fill" });
    fill.style.cssText = `
      position:absolute; bottom:0; width:100%; height:0%;
      background:linear-gradient(to top,#00ff88,#fbff00,#ff0055);
      box-shadow:0 0 15px rgba(255,0,85,0.5); transition:height 0.05s linear;
      border-radius:0 0 25px 25px;
    `;
    const label = this._el("div");
    label.style.cssText = `
      position:absolute; bottom:-45px; left:50%; transform:translateX(-50%);
      width:100px; text-align:center; font-size:14px; font-weight:bold;
      letter-spacing:1.5px; color:#ffd700; text-shadow:2px 2px 4px rgba(0,0,0,0.9);
    `;
    label.textContent = "หลอดพลัง";
    wrap.appendChild(fill);
    wrap.appendChild(label);
    return wrap;
  }

  _buildStartScreen() {
    const screen = this._el("div", { id: "bs-start-screen" });
    screen.style.cssText = `
      position:absolute; inset:0; background:rgba(0,0,0,0.85);
      display:flex; justify-content:center; align-items:center; z-index:100;
    `;

    const inner = this._el("div");
    inner.style.cssText = "text-align:center;";

    const title = this._el("div");
    title.style.cssText = `
      font-size:3rem; font-weight:900; color:#f1c40f;
      text-shadow:4px 4px 0 #c0392b,6px 6px 0 #333;
      -webkit-text-stroke:2px #333; margin-bottom:24px;
    `;
    title.textContent = "🎈 ยิงลูกโป่ง";

    const btn = this._el("button");
    btn.style.cssText = `
      padding:15px 40px; font-size:1.6rem; font-family:'Kanit',sans-serif; font-weight:bold;
      color:#fff; background:linear-gradient(180deg,#ffcc00,#ff8800 50%,#ff4400);
      border:4px solid #fff; border-radius:50px; cursor:pointer;
      box-shadow:0 8px 0 #992200,0 15px 20px rgba(0,0,0,0.5);
      text-shadow:2px 2px 4px rgba(0,0,0,0.5); outline:none;
    `;
    btn.textContent = "เริ่มเกม";
    btn.onclick = () => this._startGame();

    inner.appendChild(title);
    inner.appendChild(btn);
    screen.appendChild(inner);
    return screen;
  }

  _buildScoreScreen() {
    const screen = this._el("div", { id: "bs-score-screen" });
    screen.style.cssText = `
      position:absolute; inset:0; background:rgba(0,0,0,0.7);
      display:none; justify-content:center; align-items:center;
      flex-direction:column; z-index:110;
    `;

    const trophy = this._el("div");
    trophy.style.cssText = "font-size:5rem; margin-bottom:8px;";
    trophy.textContent = "🎈";

    const label = this._el("div");
    label.style.cssText = "font-size:1.5rem; color:#ffd700; margin-bottom:8px;";
    label.textContent = "คะแนนของคุณ";

    const score = this._el("div", { id: "bs-total-score" });
    score.style.cssText = `
      font-size:5rem; font-weight:900;
      background:linear-gradient(180deg,#fff 30%,#ffd700 60%,#ff8c00);
      -webkit-background-clip:text; -webkit-text-fill-color:transparent;
      filter:drop-shadow(4px 4px 0 #632b00);
      animation: bs-score-pop 0.5s ease-out forwards;
    `;
    score.textContent = "0";

    const backBtn = this._el("button");
    backBtn.style.cssText = `
      margin-top:32px; padding:12px 32px; font-size:1.2rem;
      font-family:'Kanit',sans-serif; font-weight:bold; color:#fff;
      background:linear-gradient(180deg,#ffcc00,#ff8800); border:3px solid #fff;
      border-radius:40px; cursor:pointer; outline:none;
      box-shadow:0 6px 0 #992200;
    `;
    backBtn.textContent = "กลับแผนที่";
    backBtn.onclick = () => {
      const finalScore = this._gameState?.totalScore ?? 0;
      this._destroyUI();
      this.onGameEnd?.({ score: finalScore });
    };

    screen.appendChild(trophy);
    screen.appendChild(label);
    screen.appendChild(score);
    screen.appendChild(backBtn);
    return screen;
  }

  /* ─────────────── GAME ENGINE ─────────────── */
  _initGame(canvas) {
    const self = this;

    // resize canvas
    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      if (gs) {
        gs.actualBalloonWidth  = (window.innerWidth  * 0.73 - window.innerWidth  * 0.29) / 10;
        gs.actualBalloonHeight = (window.innerHeight * 0.58 - window.innerHeight * 0.25) / 4;
      }
    }
    window.addEventListener("resize", resize);
    this._offResize = () => window.removeEventListener("resize", resize);

    const BASE = "/assets/balloonshoot/";
    const I    = BASE + "image/";
    const A    = BASE + "audio/";

    // preload images
    const loadImg = (src) => { const img = new Image(); img.src = src; return img; };
    const imgs = {
      bg:               loadImg(I + "bg.png"),
      auntie:           loadImg(I + "auntie.png"),
      auntieBalloon:    loadImg(I + "auntie_balloon.png"),
      auntieMad:        loadImg(I + "auntie_mad.png"),
      auntieBalloonMad: loadImg(I + "auntie_balloon_mad.png"),
      dart:             loadImg(I + "dart.png"),
      hand:             loadImg(I + "hand.png"),
      RED:              loadImg(I + "red_balloon.png"),
      YELLOW:           loadImg(I + "yellow_balloon.png"),
      BLUE:             loadImg(I + "blue_balloon.png"),
      PURPLE:           loadImg(I + "purple_balloon.png"),
      GREEN:            loadImg(I + "green_balloon.png"),
      GOLD:             loadImg(I + "gold_balloon.png"),
      RAINBOW:          loadImg(I + "rainbow_balloon.png"),
      TRAP:             loadImg(I + "black_balloon.png"),
      FREEZE:           loadImg(I + "frozen_balloon.png"),
    };

    // preload sounds
    const loadAudio = (src) => { const a = new Audio(src); return a; };
    const sounds = {
      pop:       loadAudio(A + "pop.mp3"),
      hitShield: loadAudio(A + "hit_shield.mp3"),
      lightning: loadAudio(A + "lightning.mp3"),
      bgm:       loadAudio(A + "bgm.mp3"),
      timeStop:  loadAudio(A + "timestop.mp3"),
      explosion: loadAudio(A + "explosion.mp3"),
      count:     loadAudio(A + "count.mp3"),
      start:     loadAudio(A + "start.mp3"),
      rain:      loadAudio(A + "rain.mp3"),
    };
    sounds.bgm.loop  = true; sounds.bgm.volume  = 0.4;
    sounds.rain.loop = true; sounds.rain.volume = 0.5;

    const playSfx = (audio) => {
      try { const s = audio.cloneNode(); s.volume = 0.6; s.play(); } catch(_) {}
    };

    const SCORE_VALUES = { RED:10,YELLOW:10,BLUE:10,GREEN:30,PURPLE:50,GOLD:150,RAINBOW:200,TRAP:0,FREEZE:20 };

    // game state
    const gs = {
      totalScore:0, timeLeft:60, gameActive:false,
      power:0, isCharging:false, powerDirection:1,
      comboCount:0, wind:0, darts:[],
      balloonOffset:0, balloonDirection:1, screenShake:0,
      rainParticles:[], popParticles:[], comboTexts:[],
      shieldRotation:0, flagWave:0,
      auntieStunTimer:0, auntieSpeech:"", doubleScoreTimer:0,
      stormWarningTimer:0, lightningStrike:null, lightningFlash:0,
      isCountingDown:false, difficultyMultiplier:1,
      handX:0, handAutoDir:1, handSpeed:3.5, handTilt:0,
      isReloading:false, balloons:[],
      actualBalloonWidth:0, actualBalloonHeight:0,
      mainTimerInterval: null,
    };
    this._gameState = gs;

    const auntie = {
      x:-500, y:0, baseHeight:550, width:0, height:0,
      direction:1, speed:2.5, walkCycle:0, isActive:false,
      appearanceCount:0, currentType:1,
    };

    const ctx  = canvas.getContext("2d");
    const groundLevel = () => window.innerHeight * 0.85;
    const getStartX   = () => window.innerWidth  / 2;
    const getStartY   = () => window.innerHeight - 80;

    resize();

    // ─── helpers ───
    function createFloatingText(x, y, text, color="#fff", isBonus=false) {
      gs.comboTexts.push({ x, y, text, color, opacity:1, scale: isBonus ? 1.5 : 1, isBonus });
    }

    function createPopParticles(x, y, color) {
      const map = { RED:"#ff4d4d",YELLOW:"#fffa65",BLUE:"#32ff7e",PURPLE:"#7158e2",
                    GREEN:"#32ff7e",GOLD:"#facd3b",RAINBOW:"#fff",TRAP:"#000",FREEZE:"#a0e9ff" };
      for (let i = 0; i < 20; i++) {
        const c = color === "RAINBOW" ? `hsl(${Math.random()*360},100%,70%)` : (map[color]||"#fff");
        gs.popParticles.push({ x, y, vx:(Math.random()-.5)*12, vy:(Math.random()-.5)*12,
          size:Math.random()*4+1, color:c, life:1, gravity:0.15, friction:0.96 });
      }
    }

    function triggerLightning() {
      const active = gs.balloons.filter(b => b.active);
      if (!active.length) return;
      const tb = active[Math.floor(Math.random() * active.length)];
      const ri = gs.balloons.indexOf(tb);
      const row = Math.floor(ri / 10);
      const tx = tb.freezeTimer > 0 ? tb.frozenX
               : tb.x + (row % 2 === 0 ? gs.balloonOffset : -gs.balloonDirection * gs.balloonOffset);
      const ty = tb.y;
      const segs = [];
      let cx = tx + (Math.random()-.5)*100, cy = 0;
      let safe = 0;
      while (cy < ty && safe++ < 50) {
        let ny = cy + Math.random()*30+15; if (ny > ty) ny = ty;
        let nx = cx + (Math.random()-.5)*50; if (ny === ty) nx = tx;
        segs.push({ x1:cx, y1:cy, x2:nx, y2:ny }); cx = nx; cy = ny;
      }
      playSfx(sounds.lightning);
      gs.lightningStrike = { segments:segs, timer:12 };
      gs.lightningFlash = 5; gs.screenShake = 12;
      tb.active = false;
      createPopParticles(tx, ty, tb.color);
      createFloatingText(tx, ty, "MISS!", "#9e9e9e");
    }

    function generateBalloons() {
      gs.balloons = [];
      resize();
      const wallTop  = window.innerHeight * 0.25;
      const wallLeft = window.innerWidth  * 0.29;
      let pool = [];
      pool.push({ color:"RAINBOW", isTrap:false, forcedHP:3 });
      for (let i=0;i<4;i++) pool.push({ color:"GOLD",  isTrap:false, forcedHP:2 });
      for (let i=0;i<2;i++) pool.push({ color:"FREEZE",isTrap:false, forcedHP:1 });
      const traps = Math.floor(Math.random()*3)+4;
      for (let i=0;i<traps;i++) pool.push({ color:"TRAP",isTrap:true,forcedHP:1 });
      const base = ["RED","YELLOW","BLUE","GREEN","PURPLE"];
      while (pool.length < 40) {
        const hp = Math.random() < 0.15 ? 2 : 1;
        pool.push({ color:base[Math.floor(Math.random()*base.length)],isTrap:false,forcedHP:hp });
      }
      for (let i=pool.length-1;i>0;i--) {
        const j=Math.floor(Math.random()*(i+1));
        [pool[i],pool[j]] = [pool[j],pool[i]];
      }
      let idx = 0;
      for (let row=0;row<4;row++) for (let col=0;col<10;col++) {
        const it = pool[idx++];
        gs.balloons.push({
          x: wallLeft + col*gs.actualBalloonWidth  + gs.actualBalloonWidth/2,
          y: wallTop  + row*gs.actualBalloonHeight + gs.actualBalloonHeight/2,
          color:it.color, originalColor:it.color,
          radius:gs.actualBalloonWidth/2, active:true,
          hp:it.forcedHP, gapSize:0.6, isTrap:it.isTrap,
          freezeTimer:0, frozenX:0,
        });
      }
    }

    function roundRect(c,x,y,w,h,r) {
      c.beginPath(); c.moveTo(x+r,y); c.lineTo(x+w-r,y);
      c.quadraticCurveTo(x+w,y,x+w,y+r); c.lineTo(x+w,y+h-r);
      c.quadraticCurveTo(x+w,y+h,x+w-r,y+h); c.lineTo(x+r,y+h);
      c.quadraticCurveTo(x,y+h,x,y+h-r); c.lineTo(x,y+r);
      c.quadraticCurveTo(x,y,x+r,y); c.closePath();
    }

    function drawSpeechBubble(c,x,y,text,pos="top") {
      if (!text) return;
      c.font = "bold 20px Kanit";
      const pad=15, m=c.measureText(text), bw=m.width+pad*2, bh=20+pad*2;
      let bx, by;
      if (pos==="side") { bx=x+auntie.width/2+50; by=y+auntie.height/4; }
      else              { bx=x+auntie.width/2-bw/2; by=y-bh-10; }
      c.save(); c.shadowBlur=8; c.fillStyle="white"; c.strokeStyle="black"; c.lineWidth=2;
      roundRect(c,bx,by,bw,bh,15); c.fill(); c.stroke();
      c.beginPath();
      if (pos==="side") { c.moveTo(bx,by+15); c.lineTo(bx-20,by+bh/2); c.lineTo(bx,by+bh-15); }
      else              { c.moveTo(bx+bw/2-12,by+bh); c.lineTo(bx+bw/2,by+bh+15); c.lineTo(bx+bw/2+12,by+bh); }
      c.closePath(); c.fill(); c.stroke();
      c.fillStyle="#ff4444"; c.textAlign="center";
      c.fillText(text,bx+bw/2,by+pad+18); c.restore();
    }

    // ─── update ───
    function update() {
      if (!gs.gameActive && !gs.isCountingDown) return;
      if (gs.isCountingDown) return;

      const isFrozen = gs.balloons.some(b => b.freezeTimer > 0);

      if (gs.isCharging) {
        gs.power += gs.powerDirection === 1 ? 2 : -2;
        if (gs.power >= 100) { gs.power=100; gs.powerDirection=-1; }
        if (gs.power <= 0)   { gs.power=0;   gs.powerDirection=1; }
      } else if (gs.power > 0) {
        gs.power = Math.max(0, gs.power - 1.5);
      }

      if (gs.screenShake > 0) gs.screenShake *= 0.9;
      if (gs.lightningFlash > 0) gs.lightningFlash--;
      if (gs.doubleScoreTimer > 0) gs.doubleScoreTimer = Math.max(0, gs.doubleScoreTimer - 1/60);

      if (gs.timeLeft < 30 && !isFrozen && Math.random() < 0.003) triggerLightning();

      // hand
      const curHandSpeed = gs.handSpeed * (1 + (gs.totalScore/2000)*0.1);
      gs.handX += curHandSpeed * gs.handAutoDir;
      gs.handTilt += (gs.handAutoDir * 0.25 - gs.handTilt) * 0.05;
      if (Math.abs(gs.handX) > window.innerWidth * 0.28) gs.handAutoDir *= -1;

      // darts
      gs.darts.forEach(dart => {
        if (!dart.active) return;
        dart.vx *= 0.995; dart.vx += gs.wind * 0.04; dart.vy += 0.15;
        dart.x += dart.vx; dart.y += dart.vy;

        // hit auntie
        if (auntie.isActive && gs.auntieStunTimer <= 0) {
          const hp = auntie.width * 0.2;
          if (dart.x > auntie.x+hp && dart.x < auntie.x+auntie.width-hp &&
              dart.y > auntie.y    && dart.y < auntie.y+auntie.height) {
            dart.active = false; gs.comboCount = 0; gs.auntieStunTimer = 45;
            gs.auntieSpeech = auntie.currentType === 1 ? "หยุดเดี๋ยวนี้นะ!" : "ลูกโป่งยายหายหมด!";
          }
        }

        // hit balloons
        gs.balloons.forEach((b, idx) => {
          if (!b.active || !dart.active) return;
          const row = Math.floor(idx/10);
          const bx = b.freezeTimer > 0 ? b.frozenX
                   : b.x + (row%2===0 ? gs.balloonOffset : -gs.balloonDirection*gs.balloonOffset);
          const dist = Math.hypot(dart.x-bx, dart.y-b.y);
          if (dist >= b.radius*1.3) return;

          const hitAngle = (Math.atan2(dart.y-b.y, dart.x-bx) + Math.PI*2) % (Math.PI*2);
          const gapStart = gs.shieldRotation % (Math.PI*2);
          const gapEnd   = (gapStart + b.gapSize) % (Math.PI*2);
          const hitGap   = gapStart < gapEnd
            ? (hitAngle > gapStart && hitAngle < gapEnd)
            : (hitAngle > gapStart || hitAngle < gapEnd);

          if (b.hp > 1 && !hitGap) {
            playSfx(sounds.hitShield); b.hp--; dart.active=false; gs.screenShake=7; gs.comboCount=0; return;
          }
          playSfx(b.isTrap ? sounds.explosion : sounds.pop);
          b.active = false; dart.active = false;
          createPopParticles(bx, b.y, b.color);

          if (b.color === "FREEZE" && !isFrozen) {
            playSfx(sounds.timeStop); gs.screenShake=10;
            createFloatingText(bx, b.y, "TIME STOP!", "#a0e9ff", true);
            const frozen_bx_offset = gs.balloonOffset;
            gs.balloons.forEach(ob => {
              if (!ob.active) return;
              ob.freezeTimer = 180; ob.color = "FREEZE";
              const or = Math.floor(gs.balloons.indexOf(ob)/10);
              ob.frozenX = ob.x + (or%2===0 ? frozen_bx_offset : -gs.balloonDirection*frozen_bx_offset);
            });
            return;
          }

          if (b.isTrap) {
            gs.screenShake=20; gs.comboCount=0;
            createFloatingText(bx, b.y, "BOOM!", "#000", true);
            gs.balloons.forEach(o => { if (o.active && Math.hypot(o.x-bx,o.y-b.y)<80) o.active=false; });
            return;
          }

          gs.comboCount++;
          const baseVal = SCORE_VALUES[b.color] || 10;
          const mult    = gs.comboCount >= 5 ? gs.comboCount : 1;
          const doubled = gs.doubleScoreTimer > 0 ? 2 : 1;
          const finalScore = baseVal * mult * doubled;
          gs.totalScore += finalScore;
          createFloatingText(bx, b.y, `+${finalScore}`, gs.doubleScoreTimer>0 ? "#FFD700" : "#fff");
          if (b.color === "RAINBOW") {
            gs.doubleScoreTimer = 10;
            createFloatingText(bx, b.y-40, "DOUBLE SCORE!", "#FFD700", true);
          }
        });

        if (dart.y > canvas.height || dart.x > canvas.width || dart.x < 0) {
          dart.active = false; gs.comboCount = 0;
        }
      });

      if (!isFrozen) {
        gs.difficultyMultiplier = Math.min(2.2, 1 + (gs.totalScore/1500)*0.05 + gs.comboCount*0.015);
        gs.flagWave += 0.1;
        gs.shieldRotation += (gs.timeLeft<=30 ? 0.08 : 0.04) * gs.difficultyMultiplier;
        gs.balloonOffset   += (gs.timeLeft<=30 ? 6.5 : 4.0) * gs.difficultyMultiplier * gs.balloonDirection;
        if (Math.abs(gs.balloonOffset) > 85) gs.balloonDirection *= -1;

        if (gs.timeLeft <= 30) {
          try { if (sounds.rain.paused) sounds.rain.play(); } catch(_) {}
          for (let i=0;i<2;i++) {
            gs.rainParticles.push({
              x:Math.random()*canvas.width, y:-20,
              speed:15+Math.random()*10, len:15+Math.random()*20,
              opacity:0.1+Math.random()*0.3
            });
          }
        } else {
          try { if (!sounds.rain.paused) { sounds.rain.pause(); sounds.rain.currentTime=0; } } catch(_) {}
        }

        // auntie appear
        if (!auntie.isActive && (gs.timeLeft===50 || gs.timeLeft===25)) {
          auntie.isActive = true; auntie.appearanceCount++;
          auntie.currentType = gs.timeLeft===25 ? 2 : (auntie.appearanceCount%2===1 ? 1 : 2);
          auntie.direction = Math.random()>.5 ? 1 : -1;
          auntie.x = auntie.direction===1 ? -400 : window.innerWidth+400;
          auntie.walkCycle = 0; auntie.speed = 2.5;
        }

        if (auntie.isActive) {
          if (gs.auntieStunTimer <= 0) {
            auntie.x += auntie.speed * gs.difficultyMultiplier * auntie.direction;
            auntie.walkCycle += auntie.currentType===1 ? 0.15 : 0;
          }
          auntie.y = groundLevel() - auntie.baseHeight*0.8 - (auntie.currentType===2 ? 70 : 0);
          auntie.height = auntie.baseHeight * (auntie.currentType===1 ? 1.13 : 1.3);
          const ref = auntie.currentType===1 ? imgs.auntie : imgs.auntieBalloon;
          auntie.width = auntie.height * ((ref.naturalWidth||1)/(ref.naturalHeight||1));
          if ((auntie.direction===1 && auntie.x>window.innerWidth+auntie.width) ||
              (auntie.direction===-1 && auntie.x<-auntie.width)) {
            auntie.isActive = false;
          }
        }
      }

      if (gs.lightningStrike) { gs.lightningStrike.timer--; if (gs.lightningStrike.timer<=0) gs.lightningStrike=null; }
      if (gs.auntieStunTimer > 0) gs.auntieStunTimer--;
      if (gs.stormWarningTimer > 0) gs.stormWarningTimer--;
      if (gs.timeLeft===33 && gs.stormWarningTimer<=0) gs.stormWarningTimer=180;

      gs.popParticles.forEach((p,i) => {
        p.vx*=p.friction; p.vy*=p.friction; p.x+=p.vx; p.y+=p.vy; p.vy+=p.gravity; p.life-=0.02;
        if (p.life<=0) gs.popParticles.splice(i,1);
      });
      gs.rainParticles.forEach((r,i) => {
        r.y+=r.speed; r.x+=gs.wind*2; if (r.y>canvas.height) gs.rainParticles.splice(i,1);
      });
      gs.comboTexts.forEach((t,i) => {
        t.y-=1.5; t.opacity-=0.02; if (t.opacity<=0) gs.comboTexts.splice(i,1);
      });
      gs.balloons.forEach(b => {
        if (b.freezeTimer>0) { b.freezeTimer--; if (b.freezeTimer<=0) b.color=b.originalColor; }
      });
    }

    // ─── draw ───
    function draw() {
      ctx.save();
      if (gs.screenShake > 0.1)
        ctx.translate(Math.random()*gs.screenShake-gs.screenShake/2, Math.random()*gs.screenShake-gs.screenShake/2);
      ctx.clearRect(0,0,canvas.width,canvas.height);

      if (imgs.bg.complete) {
        if (gs.timeLeft<=30 && !gs.isCountingDown) ctx.filter="brightness(45%) contrast(1.1)";
        ctx.drawImage(imgs.bg,0,0,canvas.width,canvas.height);
        ctx.filter="none";
      }

      // balloons
      gs.balloons.forEach((b,idx) => {
        if (!b.active) return;
        const row  = Math.floor(idx/10);
        const curX = b.freezeTimer>0 ? b.frozenX : b.x+(row%2===0 ? gs.balloonOffset : -gs.balloonOffset);
        ctx.save();
        if (imgs[b.color]?.complete) {
          if (b.hp > 1) {
            ctx.beginPath();
            ctx.arc(curX, b.y, b.radius*1.35, gs.shieldRotation+b.gapSize, gs.shieldRotation, false);
            ctx.strokeStyle = b.hp===3 ? "white" : "Cyan"; ctx.lineWidth=8; ctx.lineCap="round"; ctx.stroke();
          }
          ctx.drawImage(imgs[b.color], curX-gs.actualBalloonWidth/2, b.y-gs.actualBalloonHeight/2, gs.actualBalloonWidth, gs.actualBalloonHeight);
        }
        ctx.restore();
      });

      // combo text
      if (gs.gameActive && gs.comboCount >= 5) {
        ctx.save(); ctx.textAlign="center";
        const sz = 40 + Math.min(gs.comboCount,20)*2;
        ctx.font=`bold ${sz}px Kanit`; ctx.shadowBlur=15; ctx.shadowColor="#ff4444";
        const grad = ctx.createLinearGradient(0,40,0,100);
        grad.addColorStop(0,"#ff0000"); grad.addColorStop(1,"#ffaa00");
        ctx.fillStyle=grad; ctx.strokeStyle="white"; ctx.lineWidth=2;
        const shake = Math.sin(Date.now()/50)*3;
        ctx.strokeText(`${gs.comboCount} COMBO!`, canvas.width/2+shake, 180);
        ctx.fillText(`${gs.comboCount} COMBO!`,   canvas.width/2+shake, 180);
        ctx.restore();
      }

      // storm warning
      if (gs.stormWarningTimer > 0) {
        ctx.save(); ctx.textAlign="center";
        ctx.fillStyle="rgba(0,0,0,0.6)"; ctx.fillRect(0,canvas.height/2-80,canvas.width,160);
        ctx.font="bold 80px Kanit";
        const pulse = Math.sin(Date.now()/150)*10;
        ctx.shadowBlur=20+pulse; ctx.shadowColor="red";
        const grad = ctx.createLinearGradient(0,canvas.height/2-40,0,canvas.height/2+40);
        grad.addColorStop(0,"#FF0000"); grad.addColorStop(1,"#FFFF00");
        ctx.fillStyle=grad;
        ctx.fillText("⚠️ พายุกำลังเข้าระวัง!!!!! ⚠️", canvas.width/2, canvas.height/2+20);
        ctx.restore();
      }

      // double score
      if (gs.doubleScoreTimer > 0) {
        ctx.save(); ctx.textAlign="center"; ctx.font="bold 40px Kanit";
        const pulse = Math.sin(Date.now()/100)*5;
        ctx.shadowBlur=15+pulse; ctx.shadowColor="gold";
        const grad = ctx.createLinearGradient(0,80,0,130);
        grad.addColorStop(0,"#FFF700"); grad.addColorStop(1,"#FFA200");
        ctx.fillStyle=grad;
        ctx.fillText(`✨ GOLDEN TIME: ${Math.ceil(gs.doubleScoreTimer)}s (x2 SCORE) ✨`, canvas.width/2, 110);
        ctx.restore();
      }

      // lightning
      if (gs.lightningStrike) {
        ctx.save(); ctx.strokeStyle="rgba(255,255,255,0.9)"; ctx.lineWidth=4;
        ctx.shadowBlur=20; ctx.shadowColor="cyan"; ctx.beginPath();
        gs.lightningStrike.segments.forEach(s => { ctx.moveTo(s.x1,s.y1); ctx.lineTo(s.x2,s.y2); });
        ctx.stroke(); ctx.restore();
      }
      if (gs.lightningFlash > 0) {
        ctx.save(); ctx.fillStyle=`rgba(255,255,255,${gs.lightningFlash*0.15})`; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.restore();
      }

      // rain
      ctx.save(); ctx.lineWidth=1.5;
      gs.rainParticles.forEach(r => {
        ctx.strokeStyle=`rgba(180,200,240,${r.opacity})`; ctx.beginPath();
        ctx.moveTo(r.x,r.y); ctx.lineTo(r.x+gs.wind*4,r.y+r.len); ctx.stroke();
      });
      ctx.restore();

      // pop particles
      gs.popParticles.forEach(p => {
        ctx.save(); ctx.globalAlpha=p.life; ctx.fillStyle=p.color;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); ctx.restore();
      });

      // floating texts
      gs.comboTexts.forEach(t => {
        ctx.save(); ctx.globalAlpha=t.opacity; ctx.translate(t.x,t.y);
        if (t.isBonus) { ctx.font="bold 45px Kanit"; ctx.shadowBlur=15; ctx.shadowColor="gold"; ctx.scale(1.2,1.2); }
        else           { ctx.font="bold 32px Kanit"; ctx.shadowBlur=5; ctx.shadowColor="black"; }
        ctx.textAlign="center"; ctx.fillStyle=t.color; ctx.fillText(t.text,0,0); ctx.restore();
      });

      // auntie
      if (auntie.isActive) {
        ctx.save(); ctx.translate(auntie.x+auntie.width/2, auntie.y+auntie.height);
        const img = (gs.auntieStunTimer>0)
          ? (auntie.currentType===1 ? imgs.auntieMad : imgs.auntieBalloonMad)
          : (auntie.currentType===1 ? imgs.auntie    : imgs.auntieBalloon);
        if (img.complete) {
          if (auntie.direction===1) ctx.scale(-1,1);
          if (gs.auntieStunTimer<=0 && auntie.currentType===1)
            ctx.rotate(Math.sin(auntie.walkCycle)*0.05);
          ctx.drawImage(img,-auntie.width/2,-auntie.height,auntie.width,auntie.height);
        }
        ctx.restore();
        if (gs.auntieStunTimer > 0) {
          const bx = auntie.x + (auntie.currentType===2 ? 250 : 0);
          drawSpeechBubble(ctx, bx, auntie.y, gs.auntieSpeech, auntie.currentType===2 ? "side" : "top");
        }
      }

      // flag
      const sx=canvas.width-100, sy=150;
      ctx.strokeStyle="#5d4037"; ctx.lineWidth=4;
      ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(sx,sy+80); ctx.stroke();
      ctx.fillStyle=Math.abs(gs.wind)>1.5 ? "#ff4444" : "#ffcc00";
      ctx.beginPath();
      ctx.moveTo(sx,sy); ctx.quadraticCurveTo(sx+gs.wind*20,sy+15+Math.sin(gs.flagWave)*10,sx+gs.wind*20,sy+30);
      ctx.lineTo(sx,sy+40); ctx.fill();

      // darts
      gs.darts.forEach(dart => {
        if (!dart.active) return;
        ctx.save(); ctx.translate(dart.x,dart.y); ctx.rotate(Math.atan2(dart.vy,dart.vx)+Math.PI/2);
        if (imgs.dart.complete) {
          const r=imgs.dart.width/imgs.dart.height;
          ctx.drawImage(imgs.dart,-30*r,-30,60*r,60);
        }
        ctx.restore();
      });

      // hand
      if (gs.gameActive || gs.isCountingDown) {
        const hx=getStartX()+gs.handX, hy=getStartY();
        ctx.save(); ctx.translate(hx,hy); ctx.rotate(gs.handTilt);
        if (imgs.hand.complete) {
          const r=imgs.hand.width/imgs.hand.height;
          if (gs.isReloading) ctx.globalAlpha=0.4;
          ctx.drawImage(imgs.hand,-125*r,-125,250*r,250);
        }
        ctx.restore();
      }

      // DOM UI update
      const scoreEl = document.getElementById("bs-score");
      const windEl  = document.getElementById("bs-wind-info");
      const fillEl  = document.getElementById("bs-power-fill");
      if (scoreEl) scoreEl.textContent = `${gs.totalScore} (x${gs.comboCount})`;
      if (windEl)  windEl.textContent  = `เวลา: ${gs.timeLeft}s | ลม: ${gs.wind.toFixed(1)}`;
      if (fillEl)  fillEl.style.height = gs.power + "%";

      ctx.restore();
    }

    // ─── game loop ───
    let rafId;
    function loop() { update(); draw(); rafId = requestAnimationFrame(loop); }
    this._stopLoop = () => cancelAnimationFrame(rafId);

    // ─── countdown ───
    function initCountdown() {
      if (gs.isCountingDown) return;
      gs.isCountingDown = true;
      generateBalloons();
      let val = 3;
      const overlay = document.getElementById("bs-countdown-overlay");
      const txt     = document.getElementById("bs-countdown-text");
      if (overlay) overlay.style.display="flex";
      if (txt)     txt.textContent = "3";

      const playClean = (audio) => {
        if (!audio) return;
        audio.pause(); audio.currentTime=0;
        audio.play().catch(()=>{});
      };
      playClean(sounds.count);

      const iv = setInterval(() => {
        val--;
        if (val > 0) {
          if (txt) txt.textContent = val;
          playClean(sounds.count);
        } else if (val === 0) {
          if (txt) txt.textContent = "เริ่ม!";
          playClean(sounds.start);
        } else {
          clearInterval(iv);
          if (overlay) overlay.style.display="none";
          gs.isCountingDown = false;
          gs.gameActive     = true;
          try { sounds.bgm.currentTime=0; sounds.bgm.play(); } catch(_){}

          // show UI
          ["bs-ui-layer","bs-power-bar","bs-instruction"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove("bs-ui-hidden");
          });

          // main timer
          gs.mainTimerInterval = setInterval(() => {
            if (!gs.gameActive) return;
            gs.timeLeft--;
            if (gs.timeLeft <= 0) {
              gs.gameActive = false;
              clearInterval(gs.mainTimerInterval);
              try { sounds.bgm.pause(); sounds.bgm.currentTime=0; } catch(_){}
              try { sounds.rain.pause(); sounds.rain.currentTime=0; } catch(_){}
              showScoreScreen();
            }
          }, 1000);
        }
      }, 1000);
    }

    function showScoreScreen() {
      ["bs-ui-layer","bs-power-bar","bs-instruction"].forEach(id => {
        document.getElementById(id)?.classList.add("bs-ui-hidden");
      });
      const ss = document.getElementById("bs-score-screen");
      const sc = document.getElementById("bs-total-score");
      if (ss) ss.style.display="flex";
      if (sc) sc.textContent = gs.totalScore.toLocaleString();
    }

    // ─── keyboard ───
    const onKeyDown = (e) => {
      if (e.code==="Space" && gs.gameActive && !gs.isReloading) {
        gs.isCharging=true; e.preventDefault();
      }
    };
    const onKeyUp = (e) => {
      if (e.code==="Space" && gs.gameActive && gs.isCharging) {
        const hx=getStartX()+gs.handX, hy=getStartY()-130;
        const angle = -Math.PI/2 + gs.handTilt;
        const speed = gs.power*0.25 + 2.5;
        gs.darts.push({ x:hx, y:hy, vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed, active:true });
        gs.isReloading=true; gs.isCharging=false;
        gs.wind = Math.random()*5-2.5;
        setTimeout(()=>{ gs.isReloading=false; }, 450);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup",   onKeyUp);
    this._offKeys = () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup",   onKeyUp);
    };

    // store startGame fn
    this._startGame = () => {
      const ss = document.getElementById("bs-start-screen");
      if (ss) ss.style.display="none";
      initCountdown();
    };

    loop();
  }

  /* ─────────────── CSS ─────────────── */
  _getCSS() {
    return `
      #bs-canvas { display:block; width:100vw; height:100vh; }
      .bs-ui-hidden { display:none !important; }
      #bs-countdown-overlay {
        position:fixed; inset:0; background:rgba(0,0,0,0.8);
        display:none; justify-content:center; align-items:center; z-index:9999;
      }
      #bs-countdown-text {
        font-family:'Kanit',sans-serif; font-size:250px; font-weight:900;
        color:#f1c40f; text-shadow:10px 10px 0 #000; position:relative;
        margin:0; padding:0; line-height:1; pointer-events:none;
        animation: bs-count-bounce 0.5s ease-out forwards;
      }
      @keyframes bs-count-bounce {
        0%   { transform:scale(1.5); opacity:0; }
        100% { transform:scale(1);   opacity:1; }
      }
      @keyframes bs-score-pop {
        0%   { transform:scale(0.5) translateY(50px); opacity:0; }
        80%  { transform:scale(1.1) translateY(50px); }
        100% { transform:scale(1)   translateY(50px); opacity:1; }
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
    if (this._stopLoop)  { this._stopLoop();  this._stopLoop  = null; }
    if (this._offKeys)   { this._offKeys();   this._offKeys   = null; }
    if (this._offResize) { this._offResize(); this._offResize = null; }
    if (this._gameState?.mainTimerInterval) {
      clearInterval(this._gameState.mainTimerInterval);
    }
    this._ui.forEach(el => { try { el.remove(); } catch(_){} });
    this._ui = [];
  }
}
