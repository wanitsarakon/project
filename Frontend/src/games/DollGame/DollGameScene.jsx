import Phaser from "phaser";

const ASSET_BASE = "/assets/dollgame";

const TARGET_TYPES = [
  "big",
  "small",
  "small",
  "gold",
  "gold",
  "blue",
  "blue",
  "red",
  "red",
  "stone",
  "stone",
  "smoke_bomb",
];

const IMAGE_PATHS = {
  big: `${ASSET_BASE}/images/doll_big.png`,
  small: `${ASSET_BASE}/images/doll_small.png`,
  gold: `${ASSET_BASE}/images/doll_gold.png`,
  blue: `${ASSET_BASE}/images/doll_blue.png`,
  red: `${ASSET_BASE}/images/doll_red.png`,
  stone: `${ASSET_BASE}/images/stone.png`,
  smoke_bomb: `${ASSET_BASE}/images/smoke_bomb.png`,
  gun: `${ASSET_BASE}/images/gun.png`,
  bg: `${ASSET_BASE}/images/bg.png`,
  scoreLegend: `${ASSET_BASE}/images/scoredoll.png`,
  ammoBoard: `${ASSET_BASE}/images/board_ammo.png`,
  timeBoard: `${ASSET_BASE}/images/board_time.png`,
  topSign: `${ASSET_BASE}/images/top_sign.png`,
  header: `${ASSET_BASE}/images/your-header-logo.png`,
  hud: `${ASSET_BASE}/images/your-hud-bg.png`,
  startFrame: `${ASSET_BASE}/images/your-frame-bg.png`,
  endFrame: `${ASSET_BASE}/images/your-frame-bg2.png`,
};

const SOUND_PATHS = {
  shot: `${ASSET_BASE}/sounds/shot.mp3`,
  reload: `${ASSET_BASE}/sounds/reload.mp3`,
  tick: `${ASSET_BASE}/sounds/tick.MP3`,
  start: `${ASSET_BASE}/sounds/start.mp3`,
  bgm: `${ASSET_BASE}/sounds/bg-music.mp3`,
};

export default class DollGameScene extends Phaser.Scene {
  constructor() {
    super({ key: "DollGameScene" });
    this.onGameEnd = null;
    this.root = null;
    this.cleanupFns = [];
    this.state = null;
    this.animationFrame = 0;
    this.countdownTimer = null;
    this.gameTimer = null;
    this.imageCache = {};
    this.audio = {};
    this._onResize = null;
  }

  init(data = {}) {
    this.onGameEnd = data?.onGameEnd ?? null;
  }

  create() {
    this.state = this.createInitialState();
    this.buildDom();
    this.preloadAssets().then(() => {
      if (!this.root) return;
      this.resizeCanvas();
      this.spawnStaticTargets();
      this.startRenderLoop();
    });

    this.events.once("shutdown", () => this.teardown());
    this.events.once("destroy", () => this.teardown());
  }

  createInitialState() {
    return {
      started: false,
      over: false,
      score: 0,
      ammo: 10,
      timeLeft: 60,
      combo: 0,
      shakeTimer: 0,
      mouseX: 400,
      mouseY: 520,
      targets: [],
      scorePopups: [],
      particles: [],
      smokes: [],
      screenSmoke: 0,
    };
  }

  async preloadAssets() {
    const imageEntries = Object.entries(IMAGE_PATHS);
    await Promise.all(
      imageEntries.map(async ([key, src]) => {
        this.imageCache[key] = await this.loadImage(src);
      })
    );

    Object.entries(SOUND_PATHS).forEach(([key, src]) => {
      this.audio[key] = new Audio(src);
    });

    if (this.audio.bgm) {
      this.audio.bgm.loop = true;
      this.audio.bgm.volume = 0.15;
    }
  }

  loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  buildDom() {
    const container = this.game.canvas?.parentElement;
    if (!container) return;

    this.root = document.createElement("div");
    this.root.className = "dg-root";
    this.root.innerHTML = `
      <style>
        .dg-root {
          position: absolute;
          inset: 0;
          overflow: hidden;
          font-family: "Kanit", sans-serif;
          background: #000;
          user-select: none;
        }
        .dg-bg {
          position: absolute;
          inset: 0;
          background-image: url('${IMAGE_PATHS.bg}');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        .dg-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          cursor: crosshair;
        }
        .dg-ui {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .dg-header {
          position: absolute;
          top: -42px;
          left: 50%;
          width: min(42vw, 360px);
          transform: translateX(-50%) rotate(-3deg);
          transform-origin: top center;
          animation: dg-sway 3.5s ease-in-out infinite;
          filter: drop-shadow(0 8px 15px rgba(0,0,0,0.4));
        }
        .dg-score-legend {
          position: absolute;
          top: 120px;
          left: 18px;
          width: min(18vw, 155px);
          max-height: 50%;
          object-fit: contain;
          filter: drop-shadow(4px 4px 8px rgba(0,0,0,0.5));
        }
        .dg-stats-left,
        .dg-stats-right {
          position: absolute;
          top: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .dg-stats-left { left: 24px; }
        .dg-stats-right { right: 24px; }
        .dg-stat {
          width: 150px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background-image: url('${IMAGE_PATHS.hud}');
          background-size: 100% 100%;
          color: #fff;
          font-size: 18px;
          font-weight: 900;
          text-shadow: 2px 2px 0 #333;
        }
        .dg-stat span {
          color: #f1c40f;
          min-width: 30px;
          text-align: center;
        }
        .dg-stat-ornate {
          width: 160px;
          height: 68px;
          background-size: 100% 100%;
          background-position: center;
          background-repeat: no-repeat;
          padding: 0 12px;
        }
        .dg-stat-ornate.dg-time-board { background-image: url('${IMAGE_PATHS.timeBoard}'); }
        .dg-stat-ornate.dg-ammo-board { background-image: url('${IMAGE_PATHS.ammoBoard}'); }
        .dg-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.75);
          z-index: 20;
        }
        .dg-card {
          width: min(72vw, 540px);
          height: min(54vw, 356px);
          padding: 84px 34px 34px;
          box-sizing: border-box;
          text-align: center;
          background-size: 100% 100%;
          background-position: center;
          background-repeat: no-repeat;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
        }
        .dg-start-card { background-image: url('${IMAGE_PATHS.startFrame}'); }
        .dg-end-card { background-image: url('${IMAGE_PATHS.endFrame}'); }
        .dg-card-sign {
          width: min(72%, 332px);
          max-height: 94px;
          object-fit: contain;
          filter: drop-shadow(0 6px 16px rgba(0,0,0,0.4));
          margin-bottom: 6px;
          pointer-events: none;
        }
        .dg-title {
          margin: 0 0 8px;
          color: #f1c40f;
          font-size: clamp(30px, 4vw, 54px);
          font-weight: 900;
          -webkit-text-stroke: 2px #333;
          text-shadow: 4px 4px 0 #c0392b, 6px 6px 0 #333;
        }
        .dg-sub {
          color: #fff7dd;
          font-size: clamp(14px, 1.7vw, 18px);
          font-weight: 700;
          text-shadow: 1px 1px 2px rgba(0,0,0,1), 0 0 8px rgba(0,0,0,0.6);
        }
        .dg-sub.dg-start-copy {
          margin-top: 12px;
          max-width: 340px;
          font-size: clamp(13px, 1.55vw, 16px);
          line-height: 1.55;
        }
        .dg-button {
          margin-top: 28px;
          padding: 14px 36px;
          font-size: clamp(20px, 2.5vw, 28px);
          font-family: "Kanit", sans-serif;
          font-weight: 700;
          color: #fff;
          background: linear-gradient(180deg, #ffcc00 0%, #ff8800 50%, #ff4400 100%);
          border: 4px solid #fff;
          border-radius: 999px;
          cursor: pointer;
          box-shadow: 0 8px 0 #992200, 0 15px 20px rgba(0,0,0,0.5);
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        .dg-button:hover { transform: translateY(-2px) scale(1.03); }
        .dg-button:active { transform: translateY(4px); box-shadow: 0 2px 0 #992200, 0 5px 10px rgba(0,0,0,0.5); }
        .dg-countdown,
        .dg-combo {
          position: absolute;
          left: 50%;
          transform: translate(-50%, -50%);
          font-weight: 900;
          pointer-events: none;
        }
        .dg-countdown {
          top: 50%;
          z-index: 18;
          color: #f1c40f;
          font-size: clamp(100px, 16vw, 180px);
          text-shadow: 8px 8px 0 #000;
        }
        .dg-combo {
          top: 40%;
          z-index: 12;
          color: rgba(240,1,1,0.86);
          font-size: clamp(40px, 7vw, 80px);
          text-shadow: 4px 4px 0 #fff, 6px 6px 0 #000;
        }
        .dg-instructions {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 18px;
          text-align: center;
          color: #fff;
          font-weight: 700;
          text-shadow: 2px 2px 4px #000;
        }
        .dg-screen-smoke {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 10;
          opacity: 0;
          background:
            radial-gradient(circle at 22% 42%, rgba(255,255,255,0.3), transparent 18%),
            radial-gradient(circle at 74% 34%, rgba(255,255,255,0.28), transparent 16%),
            radial-gradient(circle at 58% 68%, rgba(255,255,255,0.24), transparent 20%),
            radial-gradient(circle at 44% 22%, rgba(255,255,255,0.18), transparent 18%),
            rgba(210, 215, 220, 0.32);
          transition: opacity 180ms ease-out;
          mix-blend-mode: screen;
        }
        .dg-final-score {
          margin-top: 18px;
          font-size: clamp(56px, 9vw, 108px);
          font-weight: 900;
          line-height: 1;
          background: linear-gradient(180deg, #fff 30%, #ffd700 60%, #ff8c00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(5px 5px 0 #632b00) drop-shadow(0 0 15px rgba(255,140,0,0.5));
          animation: dg-score-pop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards;
        }
        .dg-hidden { display: none !important; }
        @keyframes dg-sway {
          0% { transform: translateX(-50%) rotate(-3deg); }
          50% { transform: translateX(-50%) rotate(3deg); }
          100% { transform: translateX(-50%) rotate(-3deg); }
        }
        @keyframes dg-score-pop {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @media (max-width: 700px) {
          .dg-header { top: -18px; width: min(62vw, 300px); }
          .dg-score-legend { top: 92px; width: 112px; }
          .dg-stat { width: 126px; height: 50px; font-size: 15px; }
          .dg-card { padding-top: 90px; }
        }
      </style>
      <div class="dg-bg"></div>
      <canvas class="dg-canvas"></canvas>
      <div class="dg-ui">
        <img class="dg-header" src="${IMAGE_PATHS.header}" alt="Doll header" />
        <img class="dg-score-legend" src="${IMAGE_PATHS.scoreLegend}" alt="Score legend" />
        <div id="dg-screen-smoke" class="dg-screen-smoke"></div>
        <div class="dg-stats-left">
          <div class="dg-stat">คะแนน <span id="dg-score">0</span></div>
        </div>
        <div class="dg-stats-right">
          <div class="dg-stat dg-stat-ornate dg-time-board">เวลา <span id="dg-time">60</span></div>
          <div class="dg-stat dg-stat-ornate dg-ammo-board">กระสุน <span id="dg-ammo">10</span></div>
        </div>
        <div id="dg-combo" class="dg-combo"></div>
        <div id="dg-countdown" class="dg-countdown dg-hidden"></div>
        <div id="dg-start" class="dg-overlay">
          <div class="dg-card dg-start-card">
            <img class="dg-card-sign" src="${IMAGE_PATHS.topSign}" alt="ป้ายเกมยิงตุ๊กตา" />
            <div class="dg-sub dg-start-copy">ยิงเป้าตุ๊กตาให้แม่นที่สุดใน 60 วินาที<br/>กด Space เพื่อเติมกระสุนใหม่</div>
            <button id="dg-start-btn" class="dg-button">เริ่มเกม</button>
          </div>
        </div>
        <div id="dg-end" class="dg-overlay dg-hidden">
          <div class="dg-card dg-end-card">
            <img class="dg-card-sign" src="${IMAGE_PATHS.topSign}" alt="ป้ายสรุปคะแนน" />
            <div class="dg-sub">คะแนนรวมของคุณ</div>
            <div id="dg-final-score" class="dg-final-score">0</div>
            <button id="dg-finish-btn" class="dg-button">กลับแผนที่</button>
          </div>
        </div>
        <div class="dg-instructions">คลิกเพื่อยิงเป้า และกด Space เพื่อรีโหลดกระสุน</div>
      </div>
    `;

    container.appendChild(this.root);

    this.canvas = this.root.querySelector(".dg-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.scoreEl = this.root.querySelector("#dg-score");
    this.timeEl = this.root.querySelector("#dg-time");
    this.ammoEl = this.root.querySelector("#dg-ammo");
    this.comboEl = this.root.querySelector("#dg-combo");
    this.countdownEl = this.root.querySelector("#dg-countdown");
    this.screenSmokeEl = this.root.querySelector("#dg-screen-smoke");
    this.startOverlay = this.root.querySelector("#dg-start");
    this.endOverlay = this.root.querySelector("#dg-end");
    this.finalScoreEl = this.root.querySelector("#dg-final-score");
    this.startBtn = this.root.querySelector("#dg-start-btn");
    this.finishBtn = this.root.querySelector("#dg-finish-btn");

    this.startBtn.addEventListener("click", this.startCountdown);
    this.finishBtn.addEventListener("click", this.finishGame);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    window.addEventListener("keydown", this.handleKeyDown);

    this.cleanupFns.push(() =>
      this.startBtn?.removeEventListener("click", this.startCountdown)
    );
    this.cleanupFns.push(() =>
      this.finishBtn?.removeEventListener("click", this.finishGame)
    );
    this.cleanupFns.push(() =>
      this.canvas?.removeEventListener("mousemove", this.handleMouseMove)
    );
    this.cleanupFns.push(() =>
      this.canvas?.removeEventListener("mousedown", this.handleMouseDown)
    );
    this.cleanupFns.push(() =>
      window.removeEventListener("keydown", this.handleKeyDown)
    );

    this._onResize = () => {
      this.resizeCanvas();
      if (this.state?.targets?.length) this.spawnStaticTargets();
    };
    window.addEventListener("resize", this._onResize);
    this.cleanupFns.push(() =>
      window.removeEventListener("resize", this._onResize)
    );
  }

  resizeCanvas = () => {
    if (!this.canvas || !this.root) return;
    const rect = this.root.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  };

  handleMouseMove = (event) => {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.state.mouseX = (event.clientX - rect.left) * (this.canvas.width / rect.width);
    this.state.mouseY = (event.clientY - rect.top) * (this.canvas.height / rect.height);
  };

  handleMouseDown = (event) => {
    const gs = this.state;
    if (!gs?.started || gs.over || gs.ammo <= 0) return;

    gs.ammo -= 1;
    gs.shakeTimer = 8;
    this.playSfx("shot", 0.5);

    const rect = this.canvas.getBoundingClientRect();
    const mx = (event.clientX - rect.left) * (this.canvas.width / rect.width);
    const my = (event.clientY - rect.top) * (this.canvas.height / rect.height);

    let hit = false;
    for (let i = gs.targets.length - 1; i >= 0; i -= 1) {
      const target = gs.targets[i];
      const dist = Math.sqrt((mx - target.x) ** 2 + (my - target.y) ** 2);
      if (dist >= target.size * 0.6) continue;

      hit = true;
      const color = this.getTargetColor(target.type);
      this.createParticles(target.x, target.y, color);

      if (target.type === "smoke_bomb") {
        this.createSmokeCloud(target.x, target.y);
        gs.screenSmoke = 0.82;
        gs.combo = 0;
        gs.scorePopups.push({
          x: target.x,
          y: target.y,
          text: "ควันระเบิด!",
          color: "#ff3e3e",
          life: 1,
        });
      } else if (target.type === "stone") {
        gs.score = Math.max(0, gs.score - 5);
        gs.combo = 0;
        gs.scorePopups.push({
          x: target.x,
          y: target.y,
          text: "-5",
          color: "#ffffff",
          life: 1,
        });
      } else {
        gs.score += target.pts;
        gs.combo += 1;
        this.showCombo();
        gs.scorePopups.push({
          x: target.x,
          y: target.y,
          text: `+${target.pts}`,
          color: "#f1c40f",
          life: 1,
        });
      }

      target.x = target.minX + Math.random() * (target.maxX - target.minX);
      break;
    }

    if (!hit) gs.combo = 0;
    this.updateHud();
  };

  handleKeyDown = (event) => {
    if (event.code !== "Space") return;
    const gs = this.state;
    if (!gs || gs.over) return;
    gs.ammo = 10;
    this.playSfx("reload", 0.5);
    this.updateHud();
  };

  startCountdown = () => {
    if (!this.state || this.state.started) return;
    this.startOverlay?.classList.add("dg-hidden");
    this.countdownEl?.classList.remove("dg-hidden");

    let count = 3;
    const runTick = () => {
      if (!this.countdownEl) return;
      if (count > 0) {
        this.countdownEl.textContent = String(count);
        this.playSfx("tick", 0.7);
        count -= 1;
        this.countdownTimer = window.setTimeout(runTick, 1000);
        return;
      }
      if (count === 0) {
        this.countdownEl.textContent = "เริ่ม!";
        this.playSfx("start", 0.8);
        count -= 1;
        this.countdownTimer = window.setTimeout(runTick, 900);
        return;
      }
      this.countdownEl.classList.add("dg-hidden");
      this.actualStart();
    };

    runTick();
  };

  actualStart() {
    const gs = this.state;
    gs.started = true;
    gs.over = false;
    gs.score = 0;
    gs.ammo = 10;
    gs.timeLeft = 60;
    gs.combo = 0;
    gs.scorePopups = [];
    gs.particles = [];
    gs.smokes = [];
    gs.screenSmoke = 0;
    this.spawnStaticTargets();
    this.updateHud();
    this.updateScreenSmoke();

    if (this.audio.bgm) {
      this.audio.bgm.currentTime = 0;
      this.audio.bgm.play().catch(() => {});
    }

    this.gameTimer = window.setInterval(() => {
      if (!this.state || this.state.over) return;
      if (this.state.timeLeft > 0) {
        this.state.timeLeft -= 1;
        this.updateHud();
      } else {
        this.endGame();
      }
    }, 1000);
  }

  spawnStaticTargets() {
    const gs = this.state;
    if (!gs || !this.canvas) return;

    gs.targets = [];
    const shelfY = [this.canvas.height * 0.37, this.canvas.height * 0.61];
    shelfY.forEach((baseY) => {
      const startX = this.canvas.width * 0.26;
      const spacing = this.canvas.width * 0.042;
      const shuffledTypes = [...TARGET_TYPES].sort(() => Math.random() - 0.5);
      const directionMap = {
        big: 1,
        small: 1,
        gold: 1,
        blue: 1,
        red: 1,
        stone: 1,
        smoke_bomb: 1,
      };

      for (let i = 0; i < shuffledTypes.length; i += 1) {
        const type = shuffledTypes[i];
        let pts = 0;
        let size = this.canvas.height * 0.08;
        let yOffset = 0;
        let speedMult = 1;

        switch (type) {
          case "gold":
            pts = 50;
            size = this.canvas.height * 0.05;
            yOffset = this.canvas.height * 0.029;
            speedMult = 2.15;
            break;
          case "stone":
            pts = -5;
            size = this.canvas.height * 0.14;
            speedMult = 1.4;
            break;
          case "blue":
            pts = 25;
            size = this.canvas.height * 0.08;
            yOffset = this.canvas.height * 0.025;
            speedMult = 1.6;
            break;
          case "red":
            pts = 10;
            size = this.canvas.height * 0.1;
            yOffset = this.canvas.height * 0.015;
            speedMult = 1.18;
            break;
          case "small":
            pts = 15;
            size = this.canvas.height * 0.07;
            yOffset = this.canvas.height * 0.025;
            speedMult = 1.42;
            break;
          case "big":
            pts = 5;
            size = this.canvas.height * 0.12;
            break;
          case "smoke_bomb":
            size = this.canvas.height * 0.04;
            yOffset = -this.canvas.height * 0.01;
            break;
          default:
            break;
        }

        const direction = directionMap[type];
        directionMap[type] *= -1;

        gs.targets.push({
          type,
          pts,
          size,
          x: startX + i * spacing,
          y: baseY + yOffset,
          speed: 5.2 * direction * speedMult,
          minX: this.canvas.width * 0.24,
          maxX: this.canvas.width * 0.78,
        });
      }
    });
  }

  createParticles(x, y, color) {
    const gs = this.state;
    for (let i = 0; i < 12; i += 1) {
      gs.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        size: Math.random() * 5 + 2,
        color,
        life: 1,
      });
    }
  }

  createSmokeCloud(x, y) {
    const gs = this.state;
    for (let i = 0; i < 20; i += 1) {
      gs.smokes.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -Math.random() * 1.2,
        size: Math.random() * 40 + 30,
        growth: Math.random() * 0.5 + 0.2,
        opacity: 0.6,
        life: 5,
      });
    }
  }

  showCombo() {
    if (!this.comboEl || this.state.combo < 3) {
      if (this.comboEl) this.comboEl.textContent = "";
      return;
    }
    this.comboEl.textContent = `COMBO x${this.state.combo}`;
    window.clearTimeout(this.comboClearTimer);
    this.comboClearTimer = window.setTimeout(() => {
      if (this.comboEl) this.comboEl.textContent = "";
    }, 700);
  }

  updateScreenSmoke() {
    if (!this.screenSmokeEl || !this.state) return;
    this.screenSmokeEl.style.opacity = String(Math.max(0, this.state.screenSmoke));
  }

  updateHud() {
    if (this.scoreEl) this.scoreEl.textContent = String(this.state.score);
    if (this.timeEl) this.timeEl.textContent = String(this.state.timeLeft);
    if (this.ammoEl) this.ammoEl.textContent = String(this.state.ammo);
  }

  startRenderLoop() {
    const render = () => {
      this.draw();
      if (!this.state?.over || this.state?.particles.length || this.state?.smokes.length || this.state?.scorePopups.length) {
        this.animationFrame = window.requestAnimationFrame(render);
      }
    };
    render();
  }

  draw() {
    if (!this.ctx || !this.canvas || !this.state) return;
    const ctx = this.ctx;
    const gs = this.state;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();

    if (gs.shakeTimer > 0) {
      ctx.translate((Math.random() - 0.5) * 7, (Math.random() - 0.5) * 7);
      gs.shakeTimer -= 1;
    }

    gs.targets.forEach((target) => {
      if (gs.started && !gs.over) {
        target.x += target.speed;
        if (target.x > target.maxX || target.x < target.minX) {
          target.speed *= -1;
        }
      }
      const img = this.imageCache[target.type];
      if (!img) return;

      const aspect = img.width / img.height;
      const drawW = target.size;
      const drawH = target.size / aspect;
      ctx.drawImage(img, target.x - drawW / 2, target.y - drawH / 2, drawW, drawH);
    });

    for (let i = gs.smokes.length - 1; i >= 0; i -= 1) {
      const smoke = gs.smokes[i];
      ctx.save();
      ctx.globalAlpha = smoke.opacity;
      const grad = ctx.createRadialGradient(
        smoke.x,
        smoke.y,
        smoke.size * 0.1,
        smoke.x,
        smoke.y,
        smoke.size
      );
      grad.addColorStop(0, "rgba(230,230,230,0.9)");
      grad.addColorStop(0.6, "rgba(200,200,200,0.4)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(smoke.x, smoke.y, smoke.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      smoke.x += smoke.vx;
      smoke.y += smoke.vy;
      smoke.size += smoke.growth;
      smoke.life -= 0.016;
      smoke.opacity = Math.max(0, smoke.life / 6);
      if (smoke.life <= 0 || smoke.y + smoke.size < -50) {
        gs.smokes.splice(i, 1);
      }
    }

    for (let i = gs.particles.length - 1; i >= 0; i -= 1) {
      const p = gs.particles[i];
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life -= 0.03;
      if (p.life <= 0) gs.particles.splice(i, 1);
    }

    if (gs.screenSmoke > 0) {
      gs.screenSmoke = Math.max(0, gs.screenSmoke - 0.012);
      this.updateScreenSmoke();
    }

    ctx.globalAlpha = 1;
    const gun = this.imageCache.gun;
    if (gun) {
      const h = this.canvas.height * 0.45;
      const w = (gun.width / gun.height) * h;
      ctx.drawImage(gun, gs.mouseX - w / 2, this.canvas.height - h + 30, w, h);
    }
    ctx.restore();

    for (let i = gs.scorePopups.length - 1; i >= 0; i -= 1) {
      const popup = gs.scorePopups[i];
      ctx.fillStyle = popup.color;
      ctx.font = "bold 24px Kanit";
      ctx.textAlign = "center";
      ctx.globalAlpha = popup.life;
      ctx.fillText(popup.text, popup.x, popup.y);
      popup.y -= 1;
      popup.life -= 0.02;
      if (popup.life <= 0) gs.scorePopups.splice(i, 1);
    }
    ctx.globalAlpha = 1;
  }

  endGame() {
    if (!this.state || this.state.over) return;
    this.state.over = true;
    window.clearInterval(this.gameTimer);
    if (this.audio.bgm) {
      this.audio.bgm.pause();
      this.audio.bgm.currentTime = 0;
    }
    if (this.finalScoreEl) this.finalScoreEl.textContent = String(this.state.score);
    this.state.screenSmoke = 0;
    this.updateScreenSmoke();
    this.endOverlay?.classList.remove("dg-hidden");
  }

  finishGame = () => {
    const score = this.state?.score ?? 0;
    this.onGameEnd?.({ score, game: "DollGame" });
  };

  playSfx(name, volume = 0.5) {
    const sound = this.audio[name];
    if (!sound) return;
    const clone = sound.cloneNode();
    clone.volume = volume;
    clone.play().catch(() => {});
  }

  getTargetColor(type) {
    switch (type) {
      case "red":
        return "#ff3e3e";
      case "blue":
        return "#3498db";
      case "gold":
        return "#f1c40f";
      default:
        return "#7f8c8d";
    }
  }

  teardown() {
    window.cancelAnimationFrame(this.animationFrame);
    window.clearTimeout(this.countdownTimer);
    window.clearTimeout(this.comboClearTimer);
    window.clearInterval(this.gameTimer);
    this.cleanupFns.forEach((fn) => {
      try {
        fn();
      } catch {}
    });
    this.cleanupFns = [];

    Object.values(this.audio).forEach((audio) => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {}
    });
    this.audio = {};

    if (this.root?.parentNode) {
      this.root.parentNode.removeChild(this.root);
    }
    this.root = null;
  }
}
