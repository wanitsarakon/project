<<<<<<< Updated upstream
=======
import Phaser from "phaser";

export default class BalloonShootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BalloonShootScene" });
    this._ui = [];
    this._cleanupGame = null;
    this._offKeys = null;
    this._offResize = null;
    this._stopLoop = null;
    this._getFinalScore = null;
    this._gameState = null;
  }

  init(data = {}) {
    this.onGameEnd = data.onGameEnd ?? null;
    this.roomCode = data.roomCode ?? null;
    this.player = data.player ?? null;
    this.roundId = data.roundId ?? null;
  }

  preload() {
    const img = "/assets/balloonshoot/image/";
    if (!this.textures.exists("bs_bg")) {
      this.load.image("bs_bg", `${img}bg.png`);
    }
  }

  create() {
    const { width, height } = this.scale;

    if (this.textures.exists("bs_bg")) {
      this.add.image(width / 2, height / 2, "bs_bg").setDisplaySize(width, height);
    } else {
      this.add.rectangle(width / 2, height / 2, width, height, 0x0d0d1a);
    }

    this._buildOverlay();
    this.events.once("shutdown", () => this._destroyUI());
    this.events.once("destroy", () => this._destroyUI());
  }

  _buildOverlay() {
    const overlay = this._el("div", {
      id: "bs-overlay",
      style: `
        position: fixed;
        inset: 0;
        z-index: 200;
        overflow: hidden;
        user-select: none;
        font-family: 'Kanit', sans-serif;
        background: rgba(13, 13, 13, 0.76);
      `,
    });

    const style = this._el("style");
    style.textContent = this._getCSS();
    overlay.appendChild(style);

    const container = this._el("div", { class: "bs-game-container" });
    const topSign = this._el("div", { class: "bs-top-sign-container" });
    const topSignImg = this._el("img", {
      class: "bs-top-roof-sign",
      src: "/assets/balloonshoot/image/top_sign.png",
      alt: "ป้ายซุ้มเกม",
    });
    const canvas = this._el("canvas", { id: "bs-canvas" });

    topSign.appendChild(topSignImg);
    container.appendChild(topSign);
    container.appendChild(this._buildStartScreen());
    container.appendChild(this._buildScoreScreen());
    container.appendChild(this._buildUILayer());
    container.appendChild(this._buildCountdownOverlay());
    container.appendChild(canvas);
    container.appendChild(this._buildPowerBar());
    container.appendChild(this._buildInstruction());

    overlay.appendChild(container);
    document.body.appendChild(overlay);
    this._ui.push(overlay);

    this._initGame(canvas);
  }

  _buildUILayer() {
    const layer = this._el("div", { id: "bs-ui-layer", class: "bs-ui-hidden" });

    const makeBox = (alt, labelNode) => {
      const box = this._el("div", { class: "bs-stat-box" });
      const bg = this._el("img", {
        class: "bs-stat-bg",
        src: "/assets/balloonshoot/image/label_tag.png",
        alt,
      });

      box.appendChild(bg);
      box.appendChild(labelNode);
      return box;
    };

    const scoreLabel = this._el("div", { class: "bs-stat-label" });
    scoreLabel.innerHTML = `คะแนน: <span id="bs-score">0 (x0)</span>`;

    const windLabel = this._el("div", { class: "bs-stat-label", id: "bs-wind-info" });
    windLabel.textContent = "เวลา: 60s | ลม: 0.0";

    layer.appendChild(makeBox("ป้ายคะแนน", scoreLabel));
    layer.appendChild(makeBox("ป้ายเวลา", windLabel));
    return layer;
  }

  _buildPowerBar() {
    const wrap = this._el("div", { id: "bs-power-bar", class: "bs-ui-hidden" });
    const fill = this._el("div", { id: "bs-power-fill" });
    const label = this._el("div", { class: "bs-power-label" });

    label.textContent = "หลอดพลัง";
    wrap.appendChild(fill);
    wrap.appendChild(label);
    return wrap;
  }

  _buildInstruction() {
    const instruction = this._el("div", { id: "bs-instruction", class: "bs-ui-hidden" });
    instruction.innerHTML = `กด <strong>Spacebar</strong> ค้างเพื่อชาร์จ | ปล่อยเพื่อยิง`;
    return instruction;
  }

  _buildCountdownOverlay() {
    const overlay = this._el("div", { id: "bs-countdown-overlay" });
    const text = this._el("div", { id: "bs-countdown-text" });
    text.textContent = "3";
    overlay.appendChild(text);
    return overlay;
  }

  _buildStartScreen() {
    const screen = this._el("div", { id: "bs-start-screen" });
    const wrapper = this._el("div", { class: "bs-sign-wrapper" });
    const board = this._el("img", {
      class: "bs-start-sign",
      src: "/assets/balloonshoot/image/start_sign.png",
      alt: "ป้ายเริ่มเกม",
    });
    const content = this._el("div", { class: "bs-sign-content" });
    const title = this._el("div", { class: "bs-sign-title" });
    const button = this._el("button", { class: "bs-start-btn" });

    button.textContent = "เริ่มเกม";
    button.onclick = () => this._startGame?.();

    content.appendChild(title);
    content.appendChild(button);
    wrapper.appendChild(board);
    wrapper.appendChild(content);
    screen.appendChild(wrapper);
    return screen;
  }

  _buildScoreScreen() {
    const screen = this._el("div", { id: "bs-score-screen", class: "bs-ui-hidden" });
    const wrapper = this._el("div", { class: "bs-sign-wrapper" });
    const board = this._el("img", {
      class: "bs-start-sign",
      src: "/assets/balloonshoot/image/result_sign.png",
      alt: "ป้ายสรุปคะแนน",
    });
    const content = this._el("div", { class: "bs-sign-content" });
    const title = this._el("div", { class: "bs-sign-title" });
    const score = this._el("div", { id: "bs-total-score" });
    const backBtn = this._el("button", { class: "bs-start-btn bs-return-btn" });

    score.textContent = "0";
    backBtn.textContent = "กลับไปแผนที่";
    backBtn.onclick = () => {
      const finalScore = this._getFinalScore?.() ?? this._gameState?.totalScore ?? 0;
      this._destroyUI();
      this.onGameEnd?.({ score: finalScore });
    };

    content.appendChild(title);
    content.appendChild(score);
    wrapper.appendChild(board);
    wrapper.appendChild(content);
    screen.appendChild(wrapper);
    screen.appendChild(backBtn);
    return screen;
  }

  _initGame(canvas) {
    const BASE = "/assets/balloonshoot/";
    const I = `${BASE}image/`;
    const A = `${BASE}audio/`;
    const ctx = canvas.getContext("2d");
    let rafId = 0;
    let mainTimerInterval = null;
    let totalScore = 0, timeLeft = 60, gameActive = false;
    let power = 0, isCharging = false, powerDirection = 1, comboCount = 0, wind = 0, darts = [];
    let balloonOffset = 0, balloonDirection = 1, screenShake = 0;
    let rainParticles = [], popParticles = [], comboTexts = [];
    let shieldRotation = 0, flagWave = 0, auntieStunTimer = 0, auntieSpeech = "", doubleScoreTimer = 0;
    let stormWarningTimer = 0, lightningStrike = null, lightningFlash = 0;
    let countdownValue = 3, isCountingDown = false, difficultyMultiplier = 1;
    let handX = 0, handAutoDir = 1, handSpeed = 3.5, handTilt = 0;
    let isReloading = false, balloons = [], actualBalloonWidth = 0, actualBalloonHeight = 0;
    const MAX_DIFFICULTY = 2.2;
    //เพิ่มค่าคงที่ของระบบออร่า
    const AURA_BALLOON_COUNT = 3; 
    const AURA_HIT_SHAKE_FRAMES = 18;
    const SCORE_VALUES = { RED: 10, YELLOW: 10, BLUE: 10, GREEN: 30, PURPLE: 50, GOLD: 150, RAINBOW: 200, TRAP: 0, FREEZE: 20 };
    const groundLevel = window.innerHeight * 0.85;
    const loadImg = (src) => { const img = new Image(); img.src = src; return img; };
    const loadAudio = (src) => new Audio(src);
    const bgImg = loadImg(`${I}bg.png`);
    const auntieImg = loadImg(`${I}auntie.png`);
    const auntieBalloonImg = loadImg(`${I}auntie_balloon.png`);
    const auntieMadImg = loadImg(`${I}auntie_mad.png`);
    const auntieBalloonMadImg = loadImg(`${I}auntie_balloon_mad.png`);
    const dartImg = loadImg(`${I}dart.png`);
    const handImg = loadImg(`${I}hand.png`);
    const sounds = {
      pop: loadAudio(`${A}pop.mp3`),
      shoot: null,
      hitShield: loadAudio(`${A}hit_shield.mp3`),
      stun: null,
      lightning: loadAudio(`${A}lightning.mp3`),
      bgm: loadAudio(`${A}bgm.mp3`),
      timeStop: loadAudio(`${A}timestop.mp3`),
      explosion: loadAudio(`${A}explosion.mp3`),
      count: loadAudio(`${A}count.mp3`),
      start: loadAudio(`${A}start.mp3`),
      rain: loadAudio(`${A}rain.mp3`),
    };
    sounds.bgm.loop = true;
    sounds.bgm.volume = 0.4;
    sounds.rain.loop = true;
    sounds.rain.volume = 0.5;
    const playSfx = (audio) => {
      if (!audio) return;
      try {
        const s = audio.cloneNode();
        s.volume = 0.6;
        s.play().catch(() => {});
      } catch (_) {}
    };
    const images = {
      RED: loadImg(`${I}red_balloon.png`),
      YELLOW: loadImg(`${I}yellow_balloon.png`),
      BLUE: loadImg(`${I}blue_balloon.png`),
      PURPLE: loadImg(`${I}purple_balloon.png`),
      GREEN: loadImg(`${I}green_balloon.png`),
      GOLD: loadImg(`${I}gold_balloon.png`),
      RAINBOW: loadImg(`${I}rainbow_balloon.png`),
      TRAP: loadImg(`${I}black_balloon.png`),
      FREEZE: loadImg(`${I}frozen_balloon.png`),
    };
    const auntie = {
      x: -500, y: groundLevel, baseHeight: 550, width: 0, height: 0,
      direction: 1, speed: 2.5, walkCycle: 0, isActive: false,
      appearanceCount: 0, currentType: 1,
    };

    this._gameState = {
      get totalScore() { return totalScore; },
      get mainTimerInterval() { return mainTimerInterval; },
    };
    this._getFinalScore = () => totalScore;

    const getStartX = () => window.innerWidth / 2;
    const getStartY = () => window.innerHeight - 80;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      actualBalloonWidth = (window.innerWidth * 0.73 - window.innerWidth * 0.29) / 10;
      actualBalloonHeight = (window.innerHeight * 0.58 - window.innerHeight * 0.25) / 4;
    }

    function createFloatingText(x, y, text, color = "#ffffff", isBonus = false) {
      comboTexts.push({ x, y, text, color, opacity: 1, scale: isBonus ? 1.5 : 1, isBonus });
    }

    function roundRect(c, x, y, width, height, radius) {
      c.beginPath();
      c.moveTo(x + radius, y);
      c.lineTo(x + width - radius, y);
      c.quadraticCurveTo(x + width, y, x + width, y + radius);
      c.lineTo(x + width, y + height - radius);
      c.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      c.lineTo(x + radius, y + height);
      c.quadraticCurveTo(x, y + height, x, y + height - radius);
      c.lineTo(x, y + radius);
      c.quadraticCurveTo(x, y, x + radius, y);
      c.closePath();
    }

    function drawSpeechBubble(c, x, y, text, position = "top") {
      if (!text) return;
      c.font = "bold 20px Tahoma";
      const padding = 15;
      const metrics = c.measureText(text);
      const bw = metrics.width + padding * 2;
      const bh = 20 + padding * 2;
      let bx;
      let by;
      if (position === "side") {
        bx = x + auntie.width / 2 + 50;
        by = y + auntie.height / 4;
      } else {
        bx = x + auntie.width / 2 - bw / 2;
        by = y - bh - 10;
      }
      c.save();
      c.shadowBlur = 8;
      c.fillStyle = "white";
      c.strokeStyle = "black";
      c.lineWidth = 2;
      roundRect(c, bx, by, bw, bh, 15);
      c.fill();
      c.stroke();
      c.beginPath();
      if (position === "side") {
        c.moveTo(bx, by + 15);
        c.lineTo(bx - 20, by + bh / 2);
        c.lineTo(bx, by + bh - 15);
      } else {
        c.moveTo(bx + bw / 2 - 12, by + bh);
        c.lineTo(bx + bw / 2, by + bh + 15);
        c.lineTo(bx + bw / 2 + 12, by + bh);
      }
      c.closePath();
      c.fill();
      c.stroke();
      c.fillStyle = "#ff4444";
      c.textAlign = "center";
      c.fillText(text, bx + bw / 2, by + padding + 18);
      c.restore();
    }

    function createPopParticles(x, y, color) {
      const colorMap = { RED: "#ff4d4d", YELLOW: "#fffa65", BLUE: "#32ff7e", PURPLE: "#7158e2", GREEN: "#32ff7e", GOLD: "#facd3b", RAINBOW: "#ffffff", TRAP: "#000000", FREEZE: "#a0e9ff" };
      for (let i = 0; i < 20; i += 1) {
        const pColor = color === "RAINBOW" ? `hsl(${Math.random() * 360}, 100%, 70%)` : (colorMap[color] || "#ffffff");
        popParticles.push({
          x, y,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.5) * 12,
          size: Math.random() * 4 + 1,
          color: pColor,
          life: 1,
          gravity: 0.15,
          friction: 0.96,
        });
      }
    }

    function triggerLightning() {
      const activeBalloons = balloons.filter((b) => b.active);
      if (!activeBalloons.length) return;
      const targetBalloon = activeBalloons[Math.floor(Math.random() * activeBalloons.length)];
      const realIdx = balloons.indexOf(targetBalloon);
      const row = Math.floor(realIdx / 10);
      const targetX = targetBalloon.freezeTimer > 0 ? targetBalloon.frozenX : targetBalloon.x + (row % 2 === 0 ? balloonOffset : -balloonDirection * balloonOffset);
      const targetY = targetBalloon.y;
      const segments = [];
      let curY = 0;
      let curX = targetX + (Math.random() - 0.5) * 100;
      let safetyCounter = 0;
      while (curY < targetY && safetyCounter < 50) {
        safetyCounter += 1;
        let nextY = curY + Math.random() * 30 + 15;
        if (nextY > targetY) nextY = targetY;
        let nextX = curX + (Math.random() - 0.5) * 50;
        if (nextY === targetY) nextX = targetX;
        segments.push({ x1: curX, y1: curY, x2: nextX, y2: nextY });
        curX = nextX;
        curY = nextY;
      }
      playSfx(sounds.lightning);
      lightningStrike = { segments, timer: 12 };
      lightningFlash = 5;
      screenShake = 12;
      targetBalloon.active = false;
      createPopParticles(targetX, targetY, targetBalloon.color);
      createFloatingText(targetX, targetY, "MISS!", "#9e9e9e");
    }

    function generateBalloons() {
      balloons = [];
      resize();
      const wallTop = window.innerHeight * 0.25;
      const wallLeft = window.innerWidth * 0.29;
      const balloonPool = [];
      balloonPool.push({ color: "RAINBOW", isTrap: false, forcedHP: 3 });
      for (let i = 0; i < 4; i += 1) balloonPool.push({ color: "GOLD", isTrap: false, forcedHP: 2 });
      for (let i = 0; i < 2; i += 1) balloonPool.push({ color: "FREEZE", isTrap: false, forcedHP: 1 });
      const trapCount = Math.floor(Math.random() * 3) + 4;
      for (let i = 0; i < trapCount; i += 1) balloonPool.push({ color: "TRAP", isTrap: true, forcedHP: 1 });
      const baseColors = ["RED", "YELLOW", "BLUE", "GREEN", "PURPLE"];
      while (balloonPool.length < 40) {
        balloonPool.push({
          color: baseColors[Math.floor(Math.random() * baseColors.length)],
          isTrap: false,
          forcedHP: Math.random() < 0.15 ? 2 : 1,
        });
      }
      for (let i = balloonPool.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [balloonPool[i], balloonPool[j]] = [balloonPool[j], balloonPool[i]];
      }
      let index = 0;
      for (let row = 0; row < 4; row += 1) {
        for (let col = 0; col < 10; col += 1) {
          const item = balloonPool[index];
          index += 1;
          balloons.push({
            x: wallLeft + col * actualBalloonWidth + actualBalloonWidth / 2,
            y: wallTop + row * actualBalloonHeight + actualBalloonHeight / 2,
            color: item.color, //state ที่เพิ่มเข้าไปในลูกโป่งแต่ละลูก ตอนสร้าง object ของลูกโป่ง 
            originalColor: item.color,
            radius: actualBalloonWidth / 2, //เพิ่ม 2 field
            active: true,
            hp: item.forcedHP,
            gapSize: 0.6,
            isTrap: item.isTrap,
            isAuraImmune: false,                                                                                                                         //isAuraImmune: false ตัวนี้คือบอกว่าลูกนี้เป็นลูกออร่าหรือยัง เริ่มต้นให้ทุกลูกเป็น false ก่อน แล้วค่อยไปสุ่มบางลูกให้เป็น true
            hitShakeTimer: 0,                                                                                                                               //ตัวนี้คือ timer สำหรับแอนิเมชันสั่น ถ้าเป็น 0 แปลว่าไม่สั่น ถ้ามากกว่า 0 แปลว่ากำลังอยู่ในช่วงสั่น
            freezeTimer: 0, 
            frozenX: 0,
          });
        }
      }
      // logic สุ่มว่าลูกไหนเป็นออร่า
      const auraIndices = balloons                                                                                                                                         // สร้าง auraIndices ขึ้นมาเป็น list ของ index ที่ “มีสิทธิ์” กลายเป็นออร่า
        .map((balloon, idx) => ({ balloon, idx }))                                                                                                       //ขั้นนี้จับคู่ object ลูกโป่งกับเลข index ของมัน ทำแบบนี้เพราะตอน filter ต้องใช้ทั้งข้อมูลลูกโป่งและตำแหน่งของมัน
        .filter(({ balloon }) => baseColors.includes(balloon.color) && balloon.hp === 1)                                                                  //บังคับว่าออร่าจะสุ่มได้เฉพาะสีธรรมดาเท่านั้น และต้องไม่มีเกราะ: hp === 1เพราะถ้า hp > 1 เกมถือว่าลูกนั้นมีเกราะอยู่แล้ว
        .map(({ idx }) => idx);                                                                                                                           // หลังคัดเสร็จ เอาเหลือแค่เลข index ล้วน ๆ
      for (let i = auraIndices.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [auraIndices[i], auraIndices[j]] = [auraIndices[j], auraIndices[i]];
      }                                                                                                                                                                    //เป็นการ shuffle รายการ index เพื่อให้การสุ่มกระจายจริง ไม่ใช่เอาแต่ตัวหน้า ๆ 
      auraIndices.slice(0, Math.min(AURA_BALLOON_COUNT, balloons.length)).forEach((idx) => {                                                                             // เลือกมาแค่จำนวนที่เรากำหนด ถ้าจำนวนลูกที่เข้าเงื่อนไขมีน้อยกว่าค่าที่ตั้ง ก็จะเอาเท่าที่มี
        balloons[idx].isAuraImmune = true;                                                                                                                              //นี่คือจุดที่ “เปิดโหมดออร่า” ให้ลูกโป่งบางลูก
      });
    }

    function update() {
      if (!gameActive && !isCountingDown) return;
      if (isCountingDown) return;
      const isFrozenActive = balloons.some((b) => b.freezeTimer > 0);

      if (isCharging) {
        if (powerDirection === 1) {
          power += 2;
          if (power >= 100) { power = 100; powerDirection = -1; }
        } else {
          power -= 2;
          if (power <= 0) { power = 0; powerDirection = 1; }
        }
      } else if (power > 0) {
        power -= 1.5;
        if (power < 0) power = 0;
      }

      if (screenShake > 0) screenShake *= 0.9;
      if (lightningFlash > 0) lightningFlash -= 1;
      if (doubleScoreTimer > 0) {
        doubleScoreTimer -= 1 / 60;
        if (doubleScoreTimer < 0) doubleScoreTimer = 0;
      }

      if (timeLeft < 30 && !isFrozenActive && Math.random() < 0.003) triggerLightning();

      const currentHandSpeed = handSpeed * (1 + (totalScore / 2000) * 0.1);
      handX += currentHandSpeed * handAutoDir;
      const targetTilt = handAutoDir * 0.25;
      handTilt += (targetTilt - handTilt) * 0.05;
      if (Math.abs(handX) > window.innerWidth * 0.28) handAutoDir *= -1;

      darts.forEach((dart) => {
        if (!dart.active) return;
        dart.vx *= 0.995;
        dart.vx += wind * 0.04;
        dart.vy += 0.15;
        dart.x += dart.vx;
        dart.y += dart.vy;

        if (auntie.isActive && auntieStunTimer <= 0) {
          const hPadding = auntie.width * 0.2;
          if (dart.x > auntie.x + hPadding && dart.x < auntie.x + auntie.width - hPadding && dart.y > auntie.y && dart.y < auntie.y + auntie.height) {
            playSfx(sounds.stun);
            dart.active = false;
            comboCount = 0;
            auntieStunTimer = 45;
            auntieSpeech = auntie.currentType === 1 ? "หยุดเดี๋ยวนี้นะ!" : "ลูกโป่งยายหายหมด!";
          }
        }
                                                                                                                                                     //คำนวณตำแหน่งจริงของลูกโป่งกับระยะชนก่อน ถ้ายังไม่โดนจริงก็ออกไปเลย
        balloons.forEach((b, idx) => { 
          if (!b.active || !dart.active) return;
          const row = Math.floor(idx / 10);
          const currentX = b.freezeTimer > 0 ? b.frozenX : b.x + (row % 2 === 0 ? balloonOffset : -balloonDirection * balloonOffset);
          const dist = Math.hypot(dart.x - currentX, dart.y - b.y);
          if (dist >= b.radius * 1.3) return;

          if (b.isAuraImmune) {                                                                                                                         //ระบบออร่าถ้าลูกนี้เป็นออร่า จะไม่ไหลต่อไปยัง logic เดิมของ เกราะ/แตก/คะแนน
            playSfx(sounds.hitShield);                                                                                                                  //ใช้เสียงเพื่อให้รู้สึกว่าโดนแล้ว แต่ไม่แตก
            dart.active = false;                                                                                                                          //ลูกดอกหายไปทันทีหลังชน แปลว่าชนจริง ไม่ใช่ทะลุผ่าน
            b.hitShakeTimer = AURA_HIT_SHAKE_FRAMES;                                                                                                      //เปิดการสั่นของลูกโป่ง โดยโหลด timer ให้เต็ม 18 เฟรม
            screenShake = Math.max(screenShake, 4);                                                                                                     //เพิ่มการสั่นจอเล็กน้อย ใช้ Math.max เพื่อไม่ให้ไปลดค่าถ้ามีแรงสั่นที่สูงกว่าอยู่แล้ว
            createFloatingText(currentX, b.y - 10, "ไม่แตกหรอกจ้า", "#fff2b3", true);                                                                      //เรียกฟังก์ชันข้อความลอยเดิมของเกมเมื่อปาโดนลูกโป่งออร่า
            return;                                                                                                                                             //หยุด flow ทันที ทำให้ลูกโป่งออร่าไม่ไปถึงโค้ดเดิมด้านล่างที่ทำให้แตก, ปิด active, สร้างอนุภาคแตก, คิดคะแนน, หรือเปิดเอฟเฟกต์พิเศษ
          }                                                                                                                                                      //ไม่เข้า FREEZE/TRAP/RAINBOW ไม่ได้คะแนน ไม่ได้คะแนน

          const hitAngle = (Math.atan2(dart.y - b.y, dart.x - currentX) + Math.PI * 2) % (Math.PI * 2);
          const gapStart = shieldRotation % (Math.PI * 2);
          const gapEnd = (gapStart + b.gapSize) % (Math.PI * 2);
          const hitGap = gapStart < gapEnd ? (hitAngle > gapStart && hitAngle < gapEnd) : (hitAngle > gapStart || hitAngle < gapEnd);

          if (b.hp > 1 && !hitGap) {
            playSfx(sounds.hitShield);
            b.hp -= 1;
            dart.active = false;
            screenShake = 7;
            comboCount = 0;
            return;
          }

          playSfx(b.isTrap ? sounds.explosion : sounds.pop);
          b.active = false;
          dart.active = false;
          createPopParticles(currentX, b.y, b.color);

          if (b.color === "FREEZE" && !isFrozenActive) {
            playSfx(sounds.timeStop);
            screenShake = 10;
            createFloatingText(currentX, b.y, "TIME STOP!", "#a0e9ff", true);
            balloons.forEach((otherB) => {
              if (!otherB.active) return;
              otherB.freezeTimer = 180;
              otherB.color = "FREEZE";
              const oRow = Math.floor(balloons.indexOf(otherB) / 10);
              otherB.frozenX = otherB.x + (oRow % 2 === 0 ? balloonOffset : -balloonDirection * balloonOffset);
            });
            return;
          }

          if (b.isTrap) {
            screenShake = 20;
            comboCount = 0;
            createFloatingText(currentX, b.y, "BOOM!", "#000000", true);
            balloons.forEach((o) => {
              if (o.active && Math.hypot(o.x - currentX, o.y - b.y) < 80) o.active = false;
            });
            return;
          }

          comboCount += 1;
          const finalScore = ((SCORE_VALUES[b.color] || 10) * (comboCount >= 5 ? comboCount : 1)) * (doubleScoreTimer > 0 ? 2 : 1);
          totalScore += finalScore;
          createFloatingText(currentX, b.y, `+${finalScore}`, doubleScoreTimer > 0 ? "#FFD700" : "#ffffff");
          if (b.color === "RAINBOW") {
            doubleScoreTimer = 10;
            createFloatingText(currentX, b.y - 40, "DOUBLE SCORE!", "#FFD700", true);
          }
        });

        if (dart.y > canvas.height || dart.x > canvas.width || dart.x < 0) {
          dart.active = false;
          comboCount = 0;
        }
      });

      if (!isFrozenActive) {
        difficultyMultiplier = Math.min(MAX_DIFFICULTY, 1 + (totalScore / 1500) * 0.05 + comboCount * 0.015);
        flagWave += 0.1;
        shieldRotation += (timeLeft <= 30 ? 0.08 : 0.04) * difficultyMultiplier;
        balloonOffset += (timeLeft <= 30 ? 6.5 : 4.0) * difficultyMultiplier * balloonDirection;
        if (Math.abs(balloonOffset) > 85) balloonDirection *= -1;

        if (timeLeft <= 30) {
          if (sounds.rain.paused) sounds.rain.play().catch(() => {});
          for (let i = 0; i < 2; i += 1) {
            rainParticles.push({ x: Math.random() * canvas.width, y: -20, speed: 15 + Math.random() * 10, len: 15 + Math.random() * 20, opacity: 0.1 + Math.random() * 0.3 });
          }
        } else if (!sounds.rain.paused) {
          sounds.rain.pause();
          sounds.rain.currentTime = 0;
        }

        if (!auntie.isActive && (timeLeft === 50 || timeLeft === 25)) {
          auntie.isActive = true;
          auntie.appearanceCount += 1;
          auntie.speed = 2.5;
          auntie.currentType = timeLeft === 25 ? 2 : (auntie.appearanceCount % 2 === 1 ? 1 : 2);
          auntie.direction = Math.random() > 0.5 ? 1 : -1;
          auntie.x = auntie.direction === 1 ? -400 : window.innerWidth + 400;
          auntie.walkCycle = 0;
        }

        if (auntie.isActive) {
          if (auntieStunTimer <= 0) {
            auntie.x += auntie.speed * difficultyMultiplier * auntie.direction;
            auntie.walkCycle = auntie.currentType === 1 ? auntie.walkCycle + 0.15 : 0;
          }
          auntie.y = groundLevel - auntie.baseHeight * 0.8 - (auntie.currentType === 2 ? 70 : 0);
          auntie.height = auntie.currentType === 1 ? auntie.baseHeight * 1.13 : auntie.baseHeight * 1.3;
          const imgForRef = auntie.currentType === 1 ? auntieImg : auntieBalloonImg;
          auntie.width = auntie.height * ((imgForRef.width / imgForRef.height) || 1);
          if ((auntie.direction === 1 && auntie.x > window.innerWidth + auntie.width) || (auntie.direction === -1 && auntie.x < -auntie.width)) {
            auntie.isActive = false;
          }
        }
      }

      if (lightningStrike) {
        lightningStrike.timer -= 1;
        if (lightningStrike.timer <= 0) lightningStrike = null;
      }
      if (auntieStunTimer > 0) auntieStunTimer -= 1;
      if (stormWarningTimer > 0) stormWarningTimer -= 1;
      if (timeLeft === 33 && stormWarningTimer <= 0) stormWarningTimer = 180;

      popParticles.forEach((p, i) => { p.vx *= p.friction; p.vy *= p.friction; p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.life -= 0.02; if (p.life <= 0) popParticles.splice(i, 1); });
      rainParticles.forEach((r, i) => { r.y += r.speed; r.x += wind * 2; if (r.y > canvas.height) rainParticles.splice(i, 1); });
      comboTexts.forEach((t, i) => { t.y -= 1.5; t.opacity -= 0.02; if (t.opacity <= 0) comboTexts.splice(i, 1); });
      balloons.forEach((b) => {  // timer สั่น
        if (b.hitShakeTimer > 0) b.hitShakeTimer -= 1; //ทุกเฟรม timer จะลดลงทีละ 1 จาก 18 ไป 17, 16, 15 ... จนเหลือ 0 พอเหลือ 0 การสั่นก็หายเองอัตโนมัติ
        if (b.freezeTimer > 0) { //
          b.freezeTimer -= 1;
          if (b.freezeTimer <= 0) b.color = b.originalColor;
        }
      }); //ผูกกับ logic วาด draw() 
    }

    function draw() {
      ctx.save();
      if (screenShake > 0.1) ctx.translate(Math.random() * screenShake - screenShake / 2, Math.random() * screenShake - screenShake / 2);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (bgImg.complete) {
        if (timeLeft <= 30 && !isCountingDown) ctx.filter = "brightness(45%) contrast(1.1)";
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        ctx.filter = "none";
      }

      balloons.forEach((b, idx) => { //currentX นี่คือตำแหน่งจริงของลูกโป่งจากการแกว่ง
        if (!b.active) return;
        const row = Math.floor(idx / 10);
        const currentX = b.freezeTimer > 0 ? b.frozenX : b.x + (row % 2 === 0 ? balloonOffset : -balloonOffset);
        const shakeProgress = AURA_HIT_SHAKE_FRAMES - b.hitShakeTimer; //ใช้เพื่อรู้ว่า “แอนิเมชันสั่นดำเนินมาไกลแค่ไหนแล้ว”ตอนเพิ่งโดนใหม่ ๆ ค่า progress จะน้อยพอใกล้จบจะค่อย ๆ มากขึ้น
        const shakeStrength = b.hitShakeTimer > 0 ? (0.55 + b.hitShakeTimer / AURA_HIT_SHAKE_FRAMES) : 0; // คำนวณแรงสั่น ยิ่ง timer ยังเยอะ แรงสั่นจะยังชัด ยิ่ง timer ลดลง แรงสั่นจะค่อย ๆ เบาลง
        const shakeOffsetX = b.hitShakeTimer > 0 ? Math.sin(shakeProgress * 2.2) * 10 * shakeStrength : 0;
        const shakeOffsetY = b.hitShakeTimer > 0 ? Math.cos(shakeProgress * 3.1) * 3.6 * shakeStrength : 0; //ใช้ sin กับ cos สร้างการสั่นแกน X/Y X สั่นแรงกว่า Y สั่นเบากว่า 
        const renderX = currentX + shakeOffsetX; //รวมตำแหน่งเดิมกับ offset สั่น กลายเป็นrenderX / renderY จากจุดนี้ onward การวาดทั้งหมดจะใช้ตำแหน่งใหม่ เลยทำให้ทั้ง glow, โล่, และตัวลูกโป่งขยับพร้อมกัน 
        const renderY = b.y + shakeOffsetY;
        ctx.save();
        if (images[b.color].complete) {
          if (b.isAuraImmune) { //เช็กอีกชั้นว่าลูกนี้เป็นออร่าหรือไม่ ถ้าไม่ใช่ จะวาดเหมือนเดิม
            const auraPulse = 0.96 + Math.sin(Date.now() / 170 + idx) * 0.14; //ใช้ Date.now() ทำให้ค่าแกว่งขึ้นลงตลอดเวลา 
            const auraGradient = ctx.createRadialGradient(renderX, renderY, b.radius * 0.22, renderX, renderY, b.radius * 1.62); //สร้าง radialGradient แกนหลักของ glow เริ่มจากวงในเล็ก แล้วค่อย ๆ ฟุ้งออกวงนอก
            auraGradient.addColorStop(0, `rgba(255,255,255,${0.12 * auraPulse})`);
            auraGradient.addColorStop(0.28, `rgba(255,255,255,${0.18 * auraPulse})`);
            auraGradient.addColorStop(0.58, `rgba(255,255,255,${0.24 * auraPulse})`);
            auraGradient.addColorStop(0.82, `rgba(255,255,255,${0.10 * auraPulse})`);
            auraGradient.addColorStop(1, "rgba(255,255,255,0)"); //กำหนดชั้นสีของ gradient
            ctx.fillStyle = auraGradient; //
            ctx.beginPath();
            ctx.arc(renderX, renderY, b.radius * 1.66, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 24; //เพิ่ม shadowBlur และ shadowColor ทำให้ glow ฟุ้งออกจากวัตถุอีกชั้น 
            ctx.shadowColor = `rgba(255,255,255,${0.56 + Math.sin(Date.now() / 155 + idx) * 0.10})`;
          }
          if (b.hp > 1) {
            ctx.beginPath();
            ctx.arc(renderX, renderY, b.radius * 1.35, shieldRotation + b.gapSize, shieldRotation, false);
            ctx.strokeStyle = b.hp === 3 ? "white" : "Cyan";
            ctx.lineWidth = 8;
            ctx.lineCap = "round";
            ctx.stroke();
          }
          ctx.drawImage(images[b.color], renderX - actualBalloonWidth / 2, renderY - actualBalloonHeight / 2, actualBalloonWidth, actualBalloonHeight);
          ctx.shadowBlur = 0; //วาดตัวลูกโป่งจริงทับบน glow ถ้าไม่ reset เงา/แสงจะไปติดกับ object ที่ วาดต่อจากนี้ทั้งเกม
        }
        ctx.restore();
      });

      if (gameActive && comboCount >= 5) {
        ctx.save();
        ctx.textAlign = "center";
        const comboSize = 40 + Math.min(comboCount, 20) * 2;
        ctx.font = `bold ${comboSize}px Kanit`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ff4444";
        const comboGrad = ctx.createLinearGradient(0, 40, 0, 100);
        comboGrad.addColorStop(0, "#ff0000");
        comboGrad.addColorStop(1, "#ffaa00");
        ctx.fillStyle = comboGrad;
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        const shake = Math.sin(Date.now() / 50) * 3;
        ctx.strokeText(`${comboCount} COMBO!`, canvas.width / 2 + shake, 180);
        ctx.fillText(`${comboCount} COMBO!`, canvas.width / 2 + shake, 180);
        ctx.restore();
      }

      if (stormWarningTimer > 0) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, canvas.height / 2 - 80, canvas.width, 160);
        ctx.font = "bold 80px Kanit";
        const pulse = Math.sin(Date.now() / 150) * 10;
        ctx.shadowBlur = 20 + pulse;
        ctx.shadowColor = "red";
        const grad = ctx.createLinearGradient(0, canvas.height / 2 - 40, 0, canvas.height / 2 + 40);
        grad.addColorStop(0, "#FF0000");
        grad.addColorStop(1, "#FFFF00");
        ctx.fillStyle = grad;
        ctx.fillText("⚠️ พายุกำลังเข้าระวัง!!!!! ⚠️", canvas.width / 2, canvas.height / 2 + 20);
        ctx.restore();
      }

      if (doubleScoreTimer > 0) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = "bold 40px Kanit";
        const pulse = Math.sin(Date.now() / 100) * 5;
        ctx.shadowBlur = 15 + pulse;
        ctx.shadowColor = "gold";
        const grad = ctx.createLinearGradient(0, 80, 0, 130);
        grad.addColorStop(0, "#FFF700");
        grad.addColorStop(1, "#FFA200");
        ctx.fillStyle = grad;
        ctx.fillText(`✨ GOLDEN TIME: ${Math.ceil(doubleScoreTimer)}s (x2 SCORE) ✨`, canvas.width / 2, 110);
        ctx.restore();
      }

      if (lightningStrike) {
        ctx.save();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = 4;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "cyan";
        ctx.beginPath();
        lightningStrike.segments.forEach((s) => { ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); });
        ctx.stroke();
        ctx.restore();
      }

      if (lightningFlash > 0) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${lightningFlash * 0.15})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      ctx.save();
      ctx.lineWidth = 1.5;
      rainParticles.forEach((r) => {
        ctx.strokeStyle = `rgba(180, 200, 240, ${r.opacity})`;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x + wind * 4, r.y + r.len);
        ctx.stroke();
      });
      ctx.restore();

      comboTexts.forEach((t) => {
        ctx.save();
        ctx.globalAlpha = t.opacity;
        ctx.translate(t.x, t.y);
        if (t.isBonus) {
          ctx.font = "bold 45px Kanit";
          ctx.shadowBlur = 15;
          ctx.shadowColor = "gold";
          ctx.scale(1.2, 1.2);
        } else {
          ctx.font = "bold 32px Kanit";
          ctx.shadowBlur = 5;
          ctx.shadowColor = "black";
        }
        ctx.textAlign = "center";
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, 0, 0);
        ctx.restore();
      });

      if (auntie.isActive) {
        ctx.save();
        ctx.translate(auntie.x + auntie.width / 2, auntie.y + auntie.height);
        const imgToDraw = auntieStunTimer > 0 ? (auntie.currentType === 1 ? auntieMadImg : auntieBalloonMadImg) : (auntie.currentType === 1 ? auntieImg : auntieBalloonImg);
        if (imgToDraw.complete) {
          if (auntie.direction === 1) ctx.scale(-1, 1);
          if (auntieStunTimer <= 0 && auntie.currentType === 1) ctx.rotate(Math.sin(auntie.walkCycle) * 0.05);
          ctx.drawImage(imgToDraw, -auntie.width / 2, -auntie.height, auntie.width, auntie.height);
        }
        ctx.restore();
        if (auntieStunTimer > 0) {
          const bubbleX = auntie.x + (auntie.currentType === 2 ? 250 : 0);
          drawSpeechBubble(ctx, bubbleX, auntie.y, auntieSpeech, auntie.currentType === 2 ? "side" : "top");
        }
      }

      const startX = canvas.width - 100;
      const startY = 150;
      ctx.strokeStyle = "#5d4037";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX, startY + 80);
      ctx.stroke();
      ctx.fillStyle = Math.abs(wind) > 1.5 ? "#ff4444" : "#ffcc00";
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(startX + wind * 20, startY + 15 + Math.sin(flagWave) * 10, startX + wind * 20, startY + 30);
      ctx.lineTo(startX, startY + 40);
      ctx.fill();

      darts.forEach((dart) => {
        if (!dart.active) return;
        ctx.save();
        ctx.translate(dart.x, dart.y);
        ctx.rotate(Math.atan2(dart.vy, dart.vx) + Math.PI / 2);
        if (dartImg.complete) {
          const ratio = dartImg.width / dartImg.height;
          ctx.drawImage(dartImg, -30 * ratio, -30, 60 * ratio, 60);
        }
        ctx.restore();
      });

      if (gameActive || isCountingDown) {
        const finalHandX = getStartX() + handX;
        const finalHandY = getStartY();
        ctx.save();
        ctx.translate(finalHandX, finalHandY);
        ctx.rotate(handTilt);
        if (handImg.complete) {
          const hRatio = handImg.width / handImg.height;
          if (isReloading) ctx.globalAlpha = 0.4;
          ctx.drawImage(handImg, -125 * hRatio, -125, 250 * hRatio, 250);
        }
        ctx.restore();
      }

      const scoreEl = document.getElementById("bs-score");
      const powerFillEl = document.getElementById("bs-power-fill");
      const windEl = document.getElementById("bs-wind-info");
      if (scoreEl) scoreEl.innerText = `${totalScore} (x${comboCount})`;
      if (powerFillEl) powerFillEl.style.height = `${power}%`;
      if (windEl) windEl.innerText = `เวลา: ${timeLeft}s | ลม: ${wind.toFixed(1)}`;
      ctx.restore();
    }

    const playCleanSfx = (audio) => {
      if (!audio) return;
      audio.pause();
      audio.currentTime = 0;
      audio.play().catch(() => {});
    };

    function startMainTimer() {
      if (mainTimerInterval) clearInterval(mainTimerInterval);
      mainTimerInterval = setInterval(() => {
        if (!gameActive) return;
        timeLeft -= 1;
        if (timeLeft <= 0) {
          gameActive = false;
          clearInterval(mainTimerInterval);
          mainTimerInterval = null;
          sounds.bgm.pause();
          sounds.bgm.currentTime = 0;
          sounds.rain.pause();
          sounds.rain.currentTime = 0;
          showScoreScreen();
        }
      }, 1000);
    }

    function showScoreScreen() {
      document.getElementById("bs-ui-layer")?.classList.add("bs-ui-hidden");
      document.getElementById("bs-power-bar")?.classList.add("bs-ui-hidden");
      document.getElementById("bs-instruction")?.classList.add("bs-ui-hidden");
      const scoreScreen = document.getElementById("bs-score-screen");
      scoreScreen?.classList.remove("bs-ui-hidden");
      const finalScoreDisplay = document.getElementById("bs-total-score");
      if (finalScoreDisplay) finalScoreDisplay.innerText = totalScore.toLocaleString();
    }

    function initCountdown() {
      if (isCountingDown) return;
      isCountingDown = true;
      countdownValue = 3;
      const overlay = document.getElementById("bs-countdown-overlay");
      const textEl = document.getElementById("bs-countdown-text");
      if (overlay) overlay.style.display = "flex";
      if (textEl) {
        textEl.innerText = "";
        textEl.innerText = countdownValue;
      }
      playCleanSfx(sounds.count);
      const countdownInterval = setInterval(() => {
        countdownValue -= 1;
        if (textEl) {
          textEl.style.animation = "none";
          void textEl.offsetHeight;
          textEl.style.animation = "";
        }
        if (countdownValue > 0) {
          if (textEl) textEl.innerText = countdownValue;
          playCleanSfx(sounds.count);
        } else if (countdownValue === 0) {
          if (textEl) textEl.innerText = "เริ่ม!";
          playCleanSfx(sounds.start);
        } else {
          clearInterval(countdownInterval);
          if (overlay) overlay.style.display = "none";
          isCountingDown = false;
          gameActive = true;
          sounds.bgm.currentTime = 0;
          sounds.bgm.play().catch(() => {});
          startMainTimer();
        }
      }, 1000);
    }

    const onKeyDown = (e) => {
      if (e.code === "Space" && gameActive && !isReloading) {
        isCharging = true;
        e.preventDefault();
      }
    };
    const onKeyUp = (e) => {
      if (e.code === "Space" && gameActive && isCharging) {
        playSfx(sounds.shoot);
        const currentHandX = getStartX() + handX;
        const currentHandY = getStartY();
        const finalAngle = -Math.PI / 2 + handTilt;
        const launchSpeed = power * 0.25 + 2.5;
        darts.push({ x: currentHandX, y: currentHandY - 130, vx: Math.cos(finalAngle) * launchSpeed, vy: Math.sin(finalAngle) * launchSpeed, active: true });
        isReloading = true;
        isCharging = false;
        wind = Math.random() * 5 - 2.5;
        setTimeout(() => { isReloading = false; }, 450);
      }
    };

    const loop = () => {
      update();
      draw();
      rafId = requestAnimationFrame(loop);
    };

    this._offResize = () => window.removeEventListener("resize", resize);
    this._offKeys = () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
    };
    this._stopLoop = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };
    this._cleanupGame = () => {
      if (mainTimerInterval) {
        clearInterval(mainTimerInterval);
        mainTimerInterval = null;
      }
      [sounds.bgm, sounds.rain].forEach((audio) => {
        if (!audio) return;
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch (_) {}
      });
    };
    this._startGame = () => {
      document.getElementById("bs-start-screen")?.style.setProperty("display", "none");
      document.getElementById("bs-ui-layer")?.classList.remove("bs-ui-hidden");
      document.getElementById("bs-power-bar")?.classList.remove("bs-ui-hidden");
      document.getElementById("bs-instruction")?.classList.remove("bs-ui-hidden");
      initCountdown();
    };

    window.addEventListener("resize", resize);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    resize();
    generateBalloons();
    loop();
  }

  _getCSS() {
    return `
      #bs-overlay {
        color: #fff;
      }

      .bs-game-container {
        position: absolute;
        inset: 0;
      }

      #bs-canvas {
        display: block;
        width: 100vw;
        height: 100vh;
      }

      .bs-top-sign-container {
        position: absolute;
        top: -100px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 5;
        pointer-events: none;
      }

      .bs-top-roof-sign {
        width: 500px;
        max-width: 60vw;
        height: auto;
        object-fit: contain;
        filter: drop-shadow(0 10px 15px rgba(0,0,0,0.5));
        animation: bs-signSwing 4s ease-in-out infinite;
        transform-origin: top center;
      }

      @keyframes bs-signSwing {
        0%, 100% { transform: rotate(-1deg); }
        50% { transform: rotate(1deg); }
      }

      #bs-ui-layer {
        position: absolute;
        top: 15px;
        left: 20px;
        right: 20px;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-start;
        pointer-events: none;
        z-index: 10;
      }

      .bs-stat-box {
        position: relative;
        width: 230px;
        height: 90px;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .bs-stat-bg {
        position: absolute;
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: drop-shadow(3px 5px 8px rgba(0,0,0,0.5));
      }

      .bs-stat-label {
        position: relative;
        z-index: 11;
        color: #fff;
        font-weight: 600;
        font-size: 1.1rem;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        transform: translateY(-4px);
        white-space: nowrap;
      }

      #bs-score {
        color: #ffd700;
        font-size: 1.3rem;
      }

      #bs-power-bar {
        position: absolute;
        left: 40px;
        bottom: 120px;
        width: 24px;
        height: 250px;
        background: rgba(0, 0, 0, 0.3);
        border: 3px solid #ffd700;
        box-shadow: 0 0 10px rgba(212, 175, 55, 0.6), inset 0 0 5px rgba(0,0,0,0.5);
        border-radius: 30px;
        z-index: 10;
        overflow: visible;
      }

      #bs-power-fill {
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 0%;
        background: linear-gradient(to top, #00ff88, #fbff00, #ff0055);
        box-shadow: 0 0 15px rgba(255, 0, 85, 0.5);
        transition: height 0.05s linear;
        border-radius: 0 0 25px 25px;
      }

      .bs-power-label {
        position: absolute;
        bottom: -45px;
        left: 50%;
        transform: translateX(-50%);
        width: 100px;
        text-align: center;
        font-size: 14px;
        font-weight: bold;
        letter-spacing: 1.5px;
        color: #ffd700;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.9);
      }

      #bs-instruction {
        position: absolute;
        bottom: 30px;
        width: 100%;
        text-align: center;
        color: rgba(255, 255, 255, 0.9);
        font-weight: 300;
        text-shadow: 0 2px 10px rgba(0,0,0,0.5);
      }

      #bs-start-screen {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100;
      }

      .bs-sign-wrapper {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        animation: bs-floatingSign 3s ease-in-out infinite;
      }

      .bs-start-sign {
        width: 700px;
        max-width: 80vw;
        height: auto;
        object-fit: contain;
        transform: scale(0.95);
      }

      .bs-sign-content {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        pointer-events: auto;
      }

      .bs-sign-title {
        margin-top: 0;
        margin-bottom: 10px;
        color: #f1c40f;
        font-size: 55px;
        font-weight: 900;
        -webkit-text-stroke: 2px #333;
        text-shadow: 4px 4px 0 #c0392b, 6px 6px 0 #333;
      }

      .bs-start-btn {
        padding: 15px 40px;
        font-size: 28px;
        font-family: 'Kanit', sans-serif;
        font-weight: bold;
        color: white;
        background: linear-gradient(180deg, #ffcc00 0%, #ff8800 50%, #ff4400 100%);
        border: 4px solid #fff;
        border-radius: 50px;
        cursor: pointer;
        outline: none;
        margin-top: 110px;
        box-shadow: 0 8px 0 #992200, 0 15px 20px rgba(0,0,0,0.5);
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
      }

      .bs-start-btn:hover {
        transform: translateY(-3px) scale(1.05);
        background: linear-gradient(180deg, #ffe066 0%, #ffa500 50%, #ff5500 100%);
        box-shadow: 0 10px 0 #992200, 0 20px 25px rgba(0,0,0,0.6);
      }

      .bs-start-btn:active {
        transform: translateY(4px);
        box-shadow: 0 2px 0 #992200, 0 5px 10px rgba(0,0,0,0.5);
      }

      .bs-start-btn::after {
        content: "";
        position: absolute;
        top: -50%;
        left: -60%;
        width: 20%;
        height: 200%;
        background: rgba(255, 255, 255, 0.4);
        transform: rotate(30deg);
        transition: all 0.5s;
        animation: bs-shine 3s infinite;
      }

      @keyframes bs-shine {
        0% { left: -60%; }
        20% { left: 120%; }
        100% { left: 120%; }
      }

      .bs-ui-hidden {
        display: none !important;
      }

      #bs-score-screen {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        z-index: 110;
      }

      #bs-total-score {
        font-size: 90px;
        font-family: 'Kanit', sans-serif;
        font-weight: 900;
        margin: 0;
        background: linear-gradient(180deg, #FFFFFF 30%, #FFD700 60%, #FF8C00 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        filter: drop-shadow(4px 4px 0 #632b00) drop-shadow(0 0 15px rgba(255, 140, 0, 0.5));
        transform: translateY(50px);
        animation: bs-scorePop 0.5s ease-out forwards;
      }

      @keyframes bs-scorePop {
        0% { transform: scale(0.5) translateY(50px); opacity: 0; }
        80% { transform: scale(1.1) translateY(50px); }
        100% { transform: scale(1) translateY(50px); opacity: 1; }
      }

      #bs-score-screen .bs-sign-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        width: 700px;
        max-width: 90vw;
      }

      #bs-score-screen .bs-start-sign {
        width: 100%;
        height: auto;
      }

      #bs-score-screen .bs-sign-content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -55%);
        text-align: center;
        width: 80%;
      }

      .bs-return-btn {
        margin-top: 28px;
        font-size: 20px;
        padding: 12px 28px;
      }

      #bs-countdown-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.8) !important;
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }

      #bs-countdown-text {
        font-family: 'Kanit', sans-serif;
        font-size: 250px;
        font-weight: 900;
        color: #f1c40f;
        text-shadow: 10px 10px 0 #000;
        position: relative;
        margin: 0;
        padding: 0;
        line-height: 1;
        pointer-events: none;
        animation: bs-countBounce 0.5s ease-out forwards;
      }

      @keyframes bs-countBounce {
        0% { transform: scale(1.5); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
  }

  _el(tag, attrs = {}) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === "style") {
        el.style.cssText = value;
      } else if (key === "class") {
        el.className = value;
      } else if (key in el) {
        el[key] = value;
      } else {
        el.setAttribute(key, value);
      }
    });
    return el;
  }

  _removeOverlay() {
    this._destroyUI();
  }

  shutdown() {
    this._destroyUI();
  }

  _destroyUI() {
    if (this._stopLoop) {
      this._stopLoop();
      this._stopLoop = null;
    }
    if (this._offKeys) {
      this._offKeys();
      this._offKeys = null;
    }
    if (this._offResize) {
      this._offResize();
      this._offResize = null;
    }
    if (this._cleanupGame) {
      this._cleanupGame();
      this._cleanupGame = null;
    }
    if (this._gameState?.mainTimerInterval) {
      clearInterval(this._gameState.mainTimerInterval);
    }
    this._ui.forEach((el) => {
      try {
        el.remove();
      } catch (_) {}
    });
    this._ui = [];
  }
}
>>>>>>> Stashed changes
