import Phaser from "phaser";

import Horse from "./components/Horse";
import Obstacle from "./components/Obstacle";
import Items from "./components/Items";
import ScoreManager from "./components/ScoreManager";

const GAME_TIME = 60;
const BG_FAR_IMAGE = new URL(`./assetsHorse/${decodeURIComponent("%E0%B8%89%E0%B8%B2%E0%B8%81%E0%B9%83%E0%B8%AB%E0%B8%A1%E0%B9%88%E0%B8%82%E0%B8%B5%E0%B9%88%E0%B8%A1%E0%B9%89%E0%B8%B21.png")}`, import.meta.url).href;
const BG_MID_IMAGE = new URL(`./assetsHorse/${decodeURIComponent("%E0%B8%89%E0%B8%B2%E0%B8%81%E0%B9%83%E0%B8%AB%E0%B8%A1%E0%B9%88%E0%B8%82%E0%B8%B5%E0%B9%88%E0%B8%A1%E0%B9%89%E0%B8%B22.png")}`, import.meta.url).href;
const HORSE_RUN_SHEET = new URL("./assetsHorse/generated/horse-run-sheet.png", import.meta.url).href;
const HORSE_JUMP_SHEET = new URL("./assetsHorse/generated/horse-jump-sheet.png", import.meta.url).href;
const HORSE_HIT_SHEET = new URL("./assetsHorse/generated/horse-hit-sheet.png", import.meta.url).href;
const ITEM_COTTON = new URL("./assetsHorse/cotton_candy.png", import.meta.url).href;
const ITEM_LOTUS = new URL("./assetsHorse/lotus_incense.png", import.meta.url).href;
const OBSTACLE_WATER = new URL("./assetsHorse/water.png", import.meta.url).href;
const OBSTACLE_BANANA = new URL("./assetsHorse/banana_peel.png", import.meta.url).href;
const COUNT_SOUND = new URL("./sounds/countdown.mp3", import.meta.url).href;
const START_SOUND = new URL("./sounds/start.mp3", import.meta.url).href;
const HORSE_GALLOP = new URL("./sounds/horse_gallop.wav", import.meta.url).href;
const HORSE_NEIGH = new URL("./sounds/horse_neigh.wav", import.meta.url).href;
const FAIR_AMBIENCE = new URL("./sounds/fair_ambience.wav", import.meta.url).href;
const HUD_SIGN_IMAGE = `/assets/${decodeURIComponent("%E0%B9%80%E0%B9%80%E0%B8%9C%E0%B9%88%E0%B8%99%E0%B8%9B%E0%B9%89%E0%B8%B2%E0%B8%A2%E0%B9%80%E0%B8%A7%E0%B8%A5%E0%B8%B2%E0%B8%81%E0%B8%B1%E0%B8%9A%E0%B8%84%E0%B8%B0%E0%B9%80%E0%B9%80%E0%B8%99%E0%B8%99.png")}`;

const START_SIGN_IMAGE = new URL(`./assetsHorse/${decodeURIComponent("%E0%B8%82%E0%B8%B5%E0%B9%88%E0%B8%A1%E0%B9%89%E0%B8%B2%E0%B9%80%E0%B8%A3%E0%B8%B4%E0%B9%88%E0%B8%A1%E0%B9%80%E0%B8%81%E0%B8%A1.png")}`, import.meta.url).href;
const RESULT_SIGN_IMAGE = new URL(`./assetsHorse/${decodeURIComponent("%E0%B8%82%E0%B8%B5%E0%B9%88%E0%B8%A1%E0%B9%89%E0%B8%B2%E0%B8%84%E0%B8%B0%E0%B9%80%E0%B8%99%E0%B8%99.png")}`, import.meta.url).href;

const HORSE_FRAME_WIDTH = 288;
const HORSE_FRAME_HEIGHT = 272;
const RUN_SPEED = 680;
const ITEM_SPAWN_OFFSET_X = 160;
const ITEM_GROUND_OFFSET = 8;
const OBSTACLE_GROUND_OFFSET = 14;
const ITEM_MIN_SPACING = 270;
const HORSE_Y_OFFSET = 6;
const SPAWN_PATTERN = ["item", "item", "obstacle", "item", "obstacle", "item"];
const BASE_SPAWN_DELAY = 2750;
const LATE_SPAWN_DELAY = 2280;
const OPENING_SPAWN_DELAYS = [700, 1800, 3200];
const JUMP_FORWARD_OFFSET = 108;
const HORIZONTAL_MOVE_COOLDOWN = 120;
const JUMP_INPUT_COOLDOWN = 180;
const SWIPE_UP_THRESHOLD = 54;
const SWIPE_BIAS = 1.1;
const SKY_SCROLL_SPEED = 12;
const BACKDROP_SCROLL_SPEED = 44;
const GROUND_SCROLL_SPEED = 138;

const ITEM_SCORE = { cotton_candy: 10, lotus_incense: 15 };
const ITEM_LABEL = { cotton_candy: "\u0e2a\u0e32\u0e22\u0e44\u0e2b\u0e21", lotus_incense: "\u0e14\u0e2d\u0e01\u0e44\u0e21\u0e49\u0e18\u0e39\u0e1b\u0e40\u0e17\u0e35\u0e22\u0e19" };
const OBSTACLE_PENALTY = { water: 6, banana_peel: 10 };

export default class HorseDeliveryScene extends Phaser.Scene {
  constructor() {
    super("HorseDeliveryScene");
    this.timerEvent = null;
    this.countdownEvent = null;
    this.openingSpawnCalls = [];
    this.slipPenaltyEvent = null;
    this.pointerDownAt = null;
  }

  init(data = {}) {
    this.playerData = data.player ?? null;
    this.onGameEnd = data.onGameEnd ?? null;
    this.roundId = data.roundId ?? null;
    this.timeLeft = GAME_TIME;
    this.elapsedSeconds = 0;
    this.ended = false;
    this.started = false;
    this.playing = false;
    this.deliveries = 0;
    this.crashes = 0;
    this.worldSpeedFactor = 1;
    this.lastItemSpawnAt = 0;
    this.lastObstacleSpawnAt = 0;
    this.lastSpawnAt = 0;
    this.spawnPatternIndex = 0;
    this.nextSpawnAt = 0;
    this.playerRestY = 0;
    this.lastMoveAt = -9999;
    this.lastJumpInputAt = -9999;
    this.inputBlockUntil = 0;
    this.latestCollectLabel = "\u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e44\u0e14\u0e49\u0e40\u0e01\u0e47\u0e1a\u0e02\u0e2d\u0e07";
    this.playerLane = 1;
    this.lanePositions = [];
    this.slipActive = false;
    this.invertControlsUntil = 0;
  }

  preload() {
    this.load.image("horse-bg-far", BG_FAR_IMAGE);
    this.load.image("horse-bg-mid", BG_MID_IMAGE);
    this.load.spritesheet("horse-run", HORSE_RUN_SHEET, { frameWidth: HORSE_FRAME_WIDTH, frameHeight: HORSE_FRAME_HEIGHT });
    this.load.spritesheet("horse-jump", HORSE_JUMP_SHEET, { frameWidth: HORSE_FRAME_WIDTH, frameHeight: HORSE_FRAME_HEIGHT });
    this.load.spritesheet("horse-hit", HORSE_HIT_SHEET, { frameWidth: HORSE_FRAME_WIDTH, frameHeight: HORSE_FRAME_HEIGHT });
    this.load.image("cotton_candy", ITEM_COTTON);
    this.load.image("lotus_incense", ITEM_LOTUS);
    this.load.image("water", OBSTACLE_WATER);
    this.load.image("banana_peel", OBSTACLE_BANANA);
    this.load.image("horse-hud-sign", HUD_SIGN_IMAGE);
    this.load.image("horse-start-sign", START_SIGN_IMAGE);
    this.load.image("horse-result-sign", RESULT_SIGN_IMAGE);
    this.load.audio("horse-count", COUNT_SOUND);
    this.load.audio("horse-start", START_SOUND);
    this.load.audio("horse-gallop", HORSE_GALLOP);
    this.load.audio("horse-neigh", HORSE_NEIGH);
    this.load.audio("horse-fair-bgm", FAIR_AMBIENCE);
  }

  create() {
    this.createPlayerAnimations();
    this.createSkyTexture();
    this.createGroundTexture();
    this.buildScene();
    this.installControls();
    this.scale.on("resize", this.handleResize, this);
    this.events.once("shutdown", () => this.cleanup());
    this.events.once("destroy", () => this.cleanup());
  }

  createPlayerAnimations() {
    if (!this.anims.exists("horse-run-loop")) {
      this.anims.create({ key: "horse-run-loop", frames: this.anims.generateFrameNumbers("horse-run", { start: 0, end: 5 }), frameRate: 12, repeat: -1 });
    }
    if (!this.anims.exists("horse-jump-once")) {
      this.anims.create({ key: "horse-jump-once", frames: this.anims.generateFrameNumbers("horse-jump", { start: 0, end: 5 }), frameRate: 10, repeat: 0 });
    }
    if (!this.anims.exists("horse-hit-once")) {
      this.anims.create({ key: "horse-hit-once", frames: this.anims.generateFrameNumbers("horse-hit", { start: 0, end: 2 }), frameRate: 8, repeat: 0 });
    }
  }

  createGroundTexture() {
    if (this.textures.exists("horse-ground-pattern")) return;
    const width = 1024;
    const height = 256;
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0x6d4a23, 1);
    graphics.fillRect(0, 0, width, height);
    graphics.fillStyle(0x7e592c, 0.65);
    graphics.fillRect(0, 0, width, 58);
    graphics.fillStyle(0x4b2d14, 0.35);
    for (let y = 64; y < height; y += 16) graphics.fillRect(0, y, width, 6);
    graphics.fillStyle(0xc9974e, 0.95);
    graphics.fillRect(0, 28, width, 6);
    graphics.fillStyle(0xa86f2d, 0.95);
    for (let x = 0; x < width; x += 64) {
      graphics.beginPath();
      graphics.moveTo(x + 8, 46);
      graphics.lineTo(x + 24, 32);
      graphics.lineTo(x + 40, 46);
      graphics.lineTo(x + 24, 60);
      graphics.closePath();
      graphics.fillPath();
      graphics.beginPath();
      graphics.moveTo(x + 24, 30);
      graphics.lineTo(x + 32, 22);
      graphics.lineTo(x + 40, 30);
      graphics.closePath();
      graphics.fillPath();
    }
    graphics.fillStyle(0x3b2412, 0.34);
    for (let i = 0; i < 180; i += 1) {
      const x = (i * 53) % width;
      const y = 76 + ((i * 37) % 164);
      graphics.fillCircle(x, y, 2 + (i % 4));
    }
    graphics.generateTexture("horse-ground-pattern", width, height);
    graphics.destroy();
  }

  createSkyTexture() {
    if (this.textures.exists("horse-sky-pattern")) return;
    const width = 1024;
    const height = 512;
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillGradientStyle(0x120a35, 0x120a35, 0x2b2b78, 0x2b2b78, 1);
    graphics.fillRect(0, 0, width, height);
    graphics.fillStyle(0xffefb0, 0.95);
    for (let i = 0; i < 120; i += 1) {
      const x = (i * 83) % width;
      const y = 20 + ((i * 47) % 280);
      const radius = (i % 3) + 1;
      graphics.fillCircle(x, y, radius);
    }
    graphics.fillStyle(0xffc86e, 0.22);
    for (let i = 0; i < 10; i += 1) {
      const x = 90 + i * 92;
      const y = 86 + (i % 3) * 18;
      graphics.fillCircle(x, y, 28);
    }
    graphics.generateTexture("horse-sky-pattern", width, height);
    graphics.destroy();
  }

  buildScene() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#100616");
    this.createParallaxBackground(width, height);
    this.groundY = height - 166;
    this.ground = this.physics.add.staticImage(width / 2, this.groundY + 16).setDisplaySize(width, 90).setVisible(false);
    this.ground.refreshBody();
    this.updateLanePositions(width);
    this.createHud();
    this.createStartOverlay();
    this.createResultOverlay();
  }

  createParallaxBackground(width, height) {
    this.bgFar?.destroy();
    this.backdropSegments?.forEach((segment) => segment.destroy());
    this.backdropSegments = [];
    this.groundLayer?.destroy();
    this.groundEdgeGlow?.destroy();
    this.bgFar = this.add.tileSprite(width / 2, height * 0.34, width, Math.ceil(height * 0.82), "horse-sky-pattern").setDepth(-30).setOrigin(0.5);
    this.groundLayer = this.add.tileSprite(width / 2, height, width, 210, "horse-ground-pattern").setDepth(-10).setOrigin(0.5, 1);
    this.groundEdgeGlow = this.add.rectangle(width / 2, height - 140, width, 26, 0xf3c06e, 0.14).setDepth(-9);
    const skySource = this.textures.get("horse-sky-pattern")?.getSourceImage?.();
    if (skySource?.width && skySource?.height) {
      const scale = Math.max(width / skySource.width, (height * 0.82) / skySource.height);
      this.bgFar.tileScaleX = scale;
      this.bgFar.tileScaleY = scale;
    }
    this.createBackdropSegments(width, height);
  }

  createBackdropSegments(width, height) {
    const textureKeys = ["horse-bg-far", "horse-bg-mid", "horse-bg-far", "horse-bg-mid"];
    const targetHeight = Math.ceil(height * 0.88);
    let currentX = 0;
    this.backdropSegments = textureKeys.map((textureKey, index) => {
      const source = this.textures.get(textureKey)?.getSourceImage?.();
      const scale = source?.height ? targetHeight / source.height : 1;
      const displayWidth = Math.ceil((source?.width ?? width) * scale);
      const segment = this.add.image(currentX + (displayWidth / 2), height * 0.5 + 8, textureKey)
        .setOrigin(0.5)
        .setDepth(-20)
        .setDisplaySize(displayWidth, targetHeight)
        .setAlpha(index % 2 === 0 ? 0.94 : 1);
      currentX += displayWidth;
      return segment;
    });
  }

  createHud() {
    const { width, height } = this.scale;
    this.scoreManager = new ScoreManager(this);
    this.scoreManager.hide();
    this.scoreManager.layout(width);
    this.timeFrame = this.add.image(width - 168, 52, "horse-hud-sign").setDisplaySize(300, 96).setDepth(19).setVisible(false).setScrollFactor(0);
    this.timeText = this.add.text(width - 168, 52, `\u0e40\u0e27\u0e25\u0e32: ${GAME_TIME} \u0e27\u0e34`, {
      fontFamily: "Kanit", fontSize: "30px", color: "#fff4bf", stroke: "#4f1e00", strokeThickness: 5, fontStyle: "bold",
    }).setOrigin(0.5).setDepth(20).setVisible(false).setScrollFactor(0);
    this.infoText = this.add.text(width / 2, 24, "", {
      fontFamily: "Kanit", fontSize: "18px", color: "#fffbe6", backgroundColor: "rgba(51,26,4,0.66)",
      padding: { left: 14, right: 14, top: 6, bottom: 6 }, align: "center",
    }).setOrigin(0.5, 0).setDepth(20).setVisible(false).setScrollFactor(0);
    this.latestItemText = this.add.text(width / 2, height - 28, "", {
      fontFamily: "Kanit", fontSize: "20px", color: "#fff7d8", backgroundColor: "rgba(35,16,8,0.78)",
      padding: { left: 16, right: 16, top: 8, bottom: 8 }, align: "center",
    }).setOrigin(0.5, 1).setDepth(20).setVisible(false).setScrollFactor(0);
    this.rulePanel = this.add.container(width - 204, 194).setDepth(18).setVisible(false).setScrollFactor(0);
    const ruleBg = this.add.rectangle(0, 0, 390, 232, 0x1f1107, 0.8).setStrokeStyle(3, 0xf5c66d, 0.92);
    const ruleText = this.add.text(0, -18, "Space = \u0e01\u0e23\u0e30\u0e42\u0e14\u0e14\n\u2190 \u2192 = \u0e02\u0e22\u0e31\u0e1a\u0e2b\u0e25\u0e1a\n\u0e41\u0e15\u0e30\u0e0b\u0e49\u0e32\u0e22/\u0e02\u0e27\u0e32 = \u0e02\u0e22\u0e31\u0e1a\n\u0e1b\u0e31\u0e14\u0e02\u0e36\u0e49\u0e19 = \u0e01\u0e23\u0e30\u0e42\u0e14\u0e14\n\u0e2a\u0e32\u0e22\u0e44\u0e2b\u0e21 +10 \u2022 \u0e18\u0e39\u0e1b\u0e40\u0e17\u0e35\u0e22\u0e19 +15", {
      fontFamily: "Kanit", fontSize: "19px", color: "#fff2ce", align: "center", lineSpacing: 6,
    }).setOrigin(0.5);
    this.rulePanel.add([ruleBg, ruleText]);
  }

  createOverlayButton(label, onClick) {
    const button = this.add.container(0, 0);
    const width = 246;
    const height = 76;
    const shadow = this.add.graphics();
    shadow.fillStyle(0x7f2500, 0.95);
    shadow.fillRoundedRect(-width / 2, -height / 2 + 8, width, height, 30);
    const outer = this.add.graphics();
    outer.fillStyle(0xffca33, 1);
    outer.fillRoundedRect(-width / 2, -height / 2, width, height, 30);
    const inner = this.add.graphics();
    inner.fillGradientStyle(0xffd45b, 0xffd45b, 0xff6f18, 0xff6f18, 1);
    inner.fillRoundedRect(-(width - 14) / 2, -(height - 14) / 2 - 1, width - 14, height - 14, 26);
    const gloss = this.add.graphics();
    gloss.fillStyle(0xffef99, 0.38);
    gloss.fillRoundedRect(-(width - 48) / 2, -(height - 40) / 2 - 9, width - 48, height - 40, 18);
    const labelText = this.add.text(0, 1, label, {
      fontFamily: "Kanit",
      fontSize: "30px",
      fontStyle: "bold",
      color: "#fff8ea",
      stroke: "#7a2f00",
      strokeThickness: 5,
      shadow: { offsetX: 0, offsetY: 3, color: "#6a2200", blur: 2, fill: true },
    }).setOrigin(0.5);
    const hitArea = this.add.rectangle(0, 4, width, height, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hitArea.on("pointerover", () => button.setScale(1.04));
    hitArea.on("pointerout", () => button.setScale(1));
    hitArea.on("pointerdown", () => {
      button.setScale(0.97);
      onClick?.();
    });
    hitArea.on("pointerup", () => button.setScale(1.04));
    button.add([shadow, outer, inner, gloss, labelText, hitArea]);
    button.setSize(width, height);
    return button;
  }

  createStartOverlay() {
    const { width, height } = this.scale;
    this.startOverlay = this.add.container(0, 0).setDepth(40).setScrollFactor(0);
    this.startDim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.56);
    this.startCard = this.add.image(width / 2, height / 2, "horse-start-sign")
      .setDisplaySize(Math.min(width * 0.92, 920), Math.min(height * 0.82, 680));
    this.startButton = this.createOverlayButton("\u0e40\u0e23\u0e34\u0e48\u0e21\u0e40\u0e01\u0e21", () => this.startCountdown());
    this.startButton.setPosition(width / 2, height / 2 + 178);
    this.startOverlay.add([this.startDim, this.startCard, this.startButton]);
  }

  createResultOverlay() {
    const { width, height } = this.scale;
    this.resultOverlay = this.add.container(0, 0).setDepth(50).setVisible(false).setScrollFactor(0);
    this.resultDim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.72);
    this.resultCard = this.add.image(width / 2, height / 2, "horse-result-sign")
      .setDisplaySize(Math.min(width * 0.86, 860), Math.min(height * 0.8, 620));
    this.resultScoreText = this.add.text(width / 2, height / 2 - 6, "0", {
      fontFamily: "Kanit", fontSize: "74px", fontStyle: "bold", color: "#ffe39d", stroke: "#6d2800", strokeThickness: 8,
    }).setOrigin(0.5);
    this.resultHintText = this.add.text(width / 2, height / 2 + 104, "", {
      fontFamily: "Kanit", fontSize: "22px", color: "#fff0d7", align: "center", lineSpacing: 8, stroke: "#4d1f05", strokeThickness: 4, wordWrap: { width: 540 },
    }).setOrigin(0.5);
    this.resultButton = this.add.text(width / 2, height / 2 + 210, "\u0e01\u0e25\u0e31\u0e1a\u0e41\u0e1c\u0e19\u0e17\u0e35\u0e48", {
      fontFamily: "Kanit", fontSize: "26px", color: "#fff5dd", backgroundColor: "#8f3d13",
      padding: { left: 24, right: 24, top: 10, bottom: 10 }, stroke: "#532000", strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.resultButton.on("pointerdown", () => {
      this.onGameEnd?.({
        score: this.scoreManager.getScore(),
        roundId: this.roundId,
        meta: { timeLeft: this.timeLeft, deliveries: this.deliveries, crashes: this.crashes },
      });
    });
    this.resultOverlay.add([this.resultDim, this.resultCard, this.resultScoreText, this.resultHintText, this.resultButton]);
  }

  installControls() {
    this.cursorKeys = this.input.keyboard?.createCursorKeys();
    this.pointerDownHandler = (pointer) => { this.pointerDownAt = { x: pointer.x, y: pointer.y }; };
    this.pointerUpHandler = (pointer) => this.handlePointerRelease(pointer);
    this.input.on("pointerdown", this.pointerDownHandler);
    this.input.on("pointerup", this.pointerUpHandler);
  }

  handlePointerRelease(pointer) {
    if (!this.playing || this.ended) return;
    const now = this.time.now;
    if (now < this.inputBlockUntil) return;
    const start = this.pointerDownAt ?? { x: pointer.x, y: pointer.y };
    const deltaX = pointer.x - start.x;
    const deltaY = pointer.y - start.y;
    if (deltaY <= -SWIPE_UP_THRESHOLD && Math.abs(deltaY) > Math.abs(deltaX) * SWIPE_BIAS) {
      this.attemptJump();
      return;
    }
    if (pointer.x < this.scale.width / 2) this.moveLane(-1);
    else this.moveLane(1);
  }

  handleResize(gameSize) {
    const { width, height } = gameSize;
    this.createParallaxBackground(width, height);
    this.groundY = height - 166;
    this.playerRestY = this.groundY - HORSE_Y_OFFSET;
    if (this.ground) {
      this.ground.setPosition(width / 2, this.groundY + 16).setDisplaySize(width, 90);
      this.ground.refreshBody();
    }
    this.updateLanePositions(width);
    if (this.player) {
      if (this.player.isGrounded(this.playerRestY)) this.player.setY(this.playerRestY);
      this.player.x = this.getLaneX(this.playerLane);
    }
    this.scoreManager?.layout(width);
    this.timeFrame?.setPosition(width - 168, 52);
    this.timeText?.setPosition(width - 168, 52);
    this.infoText?.setPosition(width / 2, 24);
    this.latestItemText?.setPosition(width / 2, height - 28);
    this.rulePanel?.setPosition(width - 204, 194);
    this.layoutOverlay(width, height);
  }

  layoutOverlay(width, height) {
    this.startDim?.setPosition(width / 2, height / 2).setSize(width, height);
    this.startCard?.setPosition(width / 2, height / 2).setDisplaySize(Math.min(width * 0.92, 920), Math.min(height * 0.82, 680));
    this.startButton?.setPosition(width / 2, height / 2 + 178);
    this.resultDim?.setPosition(width / 2, height / 2).setSize(width, height);
    this.resultCard?.setPosition(width / 2, height / 2).setDisplaySize(Math.min(width * 0.86, 860), Math.min(height * 0.8, 620));
    this.resultScoreText?.setPosition(width / 2, height / 2 - 6);
    this.resultHintText?.setPosition(width / 2, height / 2 + 104);
    this.resultButton?.setPosition(width / 2, height / 2 + 210);
  }

  updateLanePositions(width) {
    this.lanePositions = [width * 0.34, width * 0.47, width * 0.6];
  }

  getLaneX(laneIndex) {
    return this.lanePositions[Phaser.Math.Clamp(laneIndex, 0, this.lanePositions.length - 1)] ?? (this.scale.width / 2);
  }

  startCountdown() {
    if (this.started) return;
    this.started = true;
    this.playing = false;
    this.inputBlockUntil = this.time.now + 500;
    this.startOverlay.setVisible(false);
    this.countdownText = this.add.text(this.scale.width / 2, this.scale.height / 2, "3", {
      fontFamily: "Kanit", fontSize: "132px", fontStyle: "bold", color: "#fff0c5", stroke: "#4e1b00", strokeThickness: 8,
    }).setOrigin(0.5).setDepth(45);
    let count = 3;
    this.sound.play("horse-count", { volume: 0.5 });
    this.countdownEvent = this.time.addEvent({
      delay: 1000,
      repeat: 3,
      callback: () => {
        count -= 1;
        if (count > 0) {
          this.countdownText.setText(String(count));
          this.sound.play("horse-count", { volume: 0.5 });
        } else if (count === 0) {
          this.countdownText.setText("\u0e44\u0e1b!");
          this.sound.play("horse-start", { volume: 0.6 });
        } else {
          this.countdownText.destroy();
          this.startGame();
        }
      },
    });
  }

  startGame() {
    this.playerLane = 1;
    this.spawnPatternIndex = 0;
    this.lastSpawnAt = this.time.now;
    this.lastItemSpawnAt = this.time.now - 1200;
    this.lastObstacleSpawnAt = this.time.now - 1200;
    this.nextSpawnAt = this.time.now + OPENING_SPAWN_DELAYS[0];
    this.inputBlockUntil = this.time.now + 380;
    this.playing = true;
    this.playerRestY = this.groundY - HORSE_Y_OFFSET;
    this.gallopBgm = this.sound.add("horse-gallop", { loop: true, volume: 0.22 });
    this.fairBgm = this.sound.add("horse-fair-bgm", { loop: true, volume: 0.12 });
    if (!this.gallopBgm.isPlaying) this.gallopBgm.play();
    if (!this.fairBgm.isPlaying) this.fairBgm.play();
    this.scoreManager.show();
    this.timeFrame.setVisible(true);
    this.timeText.setVisible(true);
    this.infoText.setVisible(true);
    this.latestItemText.setVisible(true);
    this.rulePanel.setVisible(true);
    this.setDefaultHudMessage();
    this.setLatestCollectText("\u0e02\u0e2d\u0e07\u0e25\u0e48\u0e32\u0e2a\u0e38\u0e14: \u0e22\u0e31\u0e07\u0e44\u0e21\u0e48\u0e44\u0e14\u0e49\u0e40\u0e01\u0e47\u0e1a\u0e02\u0e2d\u0e07");
    this.player = new Horse(this, this.getLaneX(this.playerLane), this.playerRestY);
    this.physics.add.collider(this.player, this.ground);
    this.obstacles = this.physics.add.group({ maxSize: 24 });
    this.items = this.physics.add.group({ maxSize: 24 });
    this.openingSpawnCalls = OPENING_SPAWN_DELAYS.map((delay) => this.time.delayedCall(delay, () => {
      if (!this.ended) this.advanceSpawnPattern(true);
    }));
    this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);
    this.physics.add.overlap(this.player, this.items, this.collectItem, null, this);
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.ended) return;
        this.elapsedSeconds += 1;
        this.timeLeft -= 1;
        this.timeText.setText(`\u0e40\u0e27\u0e25\u0e32: ${Math.max(0, this.timeLeft)} \u0e27\u0e34`);
        if (this.timeLeft === 25) this.infoText.setText("\u0e0a\u0e48\u0e27\u0e07\u0e17\u0e49\u0e32\u0e22\u0e41\u0e25\u0e49\u0e27 \u0e02\u0e2d\u0e07\u0e08\u0e30\u0e21\u0e32\u0e44\u0e27\u0e02\u0e36\u0e49\u0e19 \u0e40\u0e15\u0e23\u0e35\u0e22\u0e21\u0e02\u0e22\u0e31\u0e1a\u0e41\u0e25\u0e30\u0e01\u0e23\u0e30\u0e42\u0e14\u0e14\u0e43\u0e2b\u0e49\u0e41\u0e21\u0e48\u0e19");
        if (this.timeLeft <= 0) this.endGame();
      },
    });
  }

  spawnObstacle(ignoreSpacing = false, spawnXOverride = null) {
    if (this.ended) return false;
    if (!ignoreSpacing && !this.canSpawnObstacleNow()) return false;
    const spawnX = spawnXOverride ?? (this.scale.width + ITEM_SPAWN_OFFSET_X);
    const obstacleY = this.playerRestY + OBSTACLE_GROUND_OFFSET;
    const obstacle = new Obstacle(this, spawnX, obstacleY);
    this.obstacles.add(obstacle);
    obstacle.setActive(true).setVisible(true);
    obstacle.baseSpeed = RUN_SPEED * 1.62;
    obstacle.setVelocityX(-(obstacle.baseSpeed * this.worldSpeedFactor));
    this.lastObstacleSpawnAt = this.time.now;
    this.lastSpawnAt = this.time.now;
    this.nextSpawnAt = this.time.now + this.getCurrentSpawnDelay();
    return true;
  }

  canSpawnItemNow() {
    const spawnX = this.scale.width + ITEM_SPAWN_OFFSET_X;
    return this.getClosestEntityToSpawnX(spawnX) < spawnX - ITEM_MIN_SPACING;
  }

  canSpawnObstacleNow() {
    const spawnX = this.scale.width + ITEM_SPAWN_OFFSET_X;
    return this.getClosestEntityToSpawnX(spawnX) < spawnX - ITEM_MIN_SPACING;
  }

  getRightmostActiveX(group) {
    let rightmost = -Infinity;
    group?.children?.each((entity) => { if (entity?.active) rightmost = Math.max(rightmost, entity.x); });
    return rightmost;
  }

  getClosestEntityToSpawnX(spawnX) {
    return Math.max(this.getRightmostActiveX(this.items), this.getRightmostActiveX(this.obstacles));
  }

  spawnItem(ignoreSpacing = false, spawnXOverride = null) {
    if (this.ended) return false;
    if (!ignoreSpacing && !this.canSpawnItemNow()) return false;
    const spawnX = spawnXOverride ?? (this.scale.width + ITEM_SPAWN_OFFSET_X);
    const itemY = this.playerRestY + ITEM_GROUND_OFFSET;
    const item = new Items(this, spawnX, itemY);
    this.items.add(item);
    item.setActive(true).setVisible(true);
    item.baseSpeed = RUN_SPEED;
    item.setVelocityX(-(item.baseSpeed * this.worldSpeedFactor));
    this.lastItemSpawnAt = this.time.now;
    this.lastSpawnAt = this.time.now;
    this.nextSpawnAt = this.time.now + this.getCurrentSpawnDelay();
    return true;
  }

  update() {
    if (!this.ended) {
      this.handleKeyboardInput();
      this.updateParallax(this.game.loop.delta / 1000);
    }
    if (this.ended || !this.player) return;
    this.player.update(this.playerRestY);
    this.advanceRun(this.game.loop.delta / 1000);
    this.keepPlayerOnScreen();
    this.detectVisualOverlaps();
    this.obstacles?.children?.each((obs) => { if (obs?.active && obs.x < -140) obs.destroy(); });
    this.items?.children?.each((item) => { if (item?.active && item.x < -140) item.destroy(); });
    this.ensureSpawnFlow();
  }

  handleKeyboardInput() {
    if (!this.playing || this.ended) return;
    if (Phaser.Input.Keyboard.JustDown(this.cursorKeys?.left)) this.moveLane(-1);
    if (Phaser.Input.Keyboard.JustDown(this.cursorKeys?.right)) this.moveLane(1);
    if (Phaser.Input.Keyboard.JustDown(this.cursorKeys?.space)) this.attemptJump();
  }

  updateParallax(deltaSeconds) {
    const factor = this.playing && !this.ended ? this.worldSpeedFactor : 0.4;
    if (this.bgFar) this.bgFar.tilePositionX += SKY_SCROLL_SPEED * deltaSeconds * factor;
    if (this.backdropSegments?.length) {
      const speed = BACKDROP_SCROLL_SPEED * deltaSeconds * factor;
      this.backdropSegments.forEach((segment) => {
        segment.x -= speed;
      });
      this.recycleBackdropSegments();
    }
    if (this.groundLayer) this.groundLayer.tilePositionX += GROUND_SCROLL_SPEED * deltaSeconds * factor;
  }

  recycleBackdropSegments() {
    if (!this.backdropSegments?.length) return;
    let rightmostEdge = Math.max(...this.backdropSegments.map((segment) => segment.x + (segment.displayWidth / 2)));
    this.backdropSegments.forEach((segment) => {
      if (segment.x + (segment.displayWidth / 2) < 0) {
        segment.x = rightmostEdge + (segment.displayWidth / 2);
        rightmostEdge = segment.x + (segment.displayWidth / 2);
      }
    });
  }

  detectVisualOverlaps() {
    const isAirborne = !this.player.isGrounded(this.playerRestY);
    const playerBounds = this.getCollisionBounds(this.player, isAirborne ? this.player.airborneVisualCollisionInsets : this.player.visualCollisionInsets);
    this.obstacles?.children?.each((obstacle) => {
      if (!obstacle?.active || obstacle.hitRegistered) return;
      const obstacleBounds = this.getCollisionBounds(obstacle, obstacle.visualCollisionInsets);
      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, obstacleBounds)) this.hitObstacle(this.player, obstacle);
    });
    this.items?.children?.each((item) => {
      if (!item?.active) return;
      const itemBounds = this.getCollisionBounds(item, item.visualCollisionInsets);
      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, itemBounds)) this.collectItem(this.player, item);
    });
  }

  getCollisionBounds(sprite, insets = {}) {
    const bounds = sprite.getBounds();
    const left = insets.left ?? insets.padX ?? 0;
    const right = insets.right ?? insets.padX ?? 0;
    const top = insets.top ?? insets.padTop ?? 0;
    const bottom = insets.bottom ?? insets.padBottom ?? 0;
    return new Phaser.Geom.Rectangle(bounds.x + left, bounds.y + top, Math.max(1, bounds.width - left - right), Math.max(1, bounds.height - top - bottom));
  }

  ensureSpawnFlow() {
    const now = this.time.now;
    if (now < this.nextSpawnAt) return;
    const activeItems = this.getActiveEntityCount(this.items);
    const activeObstacles = this.getActiveEntityCount(this.obstacles);
    const needsRecovery = now - this.lastSpawnAt > 2050 || (activeItems + activeObstacles) === 0;
    const spawned = this.advanceSpawnPattern(needsRecovery);
    if (!spawned) this.nextSpawnAt = now + 260;
  }

  getCurrentSpawnDelay() {
    return this.timeLeft <= 24 ? LATE_SPAWN_DELAY : BASE_SPAWN_DELAY;
  }

  getActiveEntityCount(group) {
    let count = 0;
    group?.children?.each((entity) => { if (entity?.active) count += 1; });
    return count;
  }

  advanceSpawnPattern(ignoreSpacing = false) {
    const kind = SPAWN_PATTERN[this.spawnPatternIndex % SPAWN_PATTERN.length];
    const spawned = kind === "obstacle" ? this.spawnObstacle(ignoreSpacing, this.scale.width + 80) : this.spawnItem(ignoreSpacing, this.scale.width + 200);
    if (spawned !== false) {
      this.spawnPatternIndex = (this.spawnPatternIndex + 1) % SPAWN_PATTERN.length;
      return true;
    }
    return false;
  }

  advanceRun(deltaSeconds) {
    if (!this.player) return;
    const isAirborne = !this.player.isGrounded(this.playerRestY);
    const targetX = this.getLaneX(this.playerLane) + (isAirborne ? JUMP_FORWARD_OFFSET : 0);
    const controlSpeed = this.slipActive ? 3.4 : isAirborne ? 5.1 : 8.4;
    const blend = Phaser.Math.Clamp(deltaSeconds * controlSpeed, 0, 1);
    this.player.x = Phaser.Math.Linear(this.player.x, targetX, blend);
  }

  keepPlayerOnScreen() {
    if (!this.player) return;
    this.player.x = Phaser.Math.Clamp(this.player.x, this.scale.width * 0.28, this.scale.width * 0.7);
  }

  moveLane(direction) {
    if (!this.playing || this.ended) return;
    const now = this.time.now;
    if (now < this.inputBlockUntil || now - this.lastMoveAt < HORIZONTAL_MOVE_COOLDOWN) return;
    const adjustedDirection = now < this.invertControlsUntil ? -direction : direction;
    const nextLane = Phaser.Math.Clamp(this.playerLane + adjustedDirection, 0, this.lanePositions.length - 1);
    if (nextLane === this.playerLane) return;
    this.playerLane = nextLane;
    this.lastMoveAt = now;
  }

  attemptJump() {
    if (!this.playing || this.ended) return;
    const now = this.time.now;
    if (now < this.inputBlockUntil || now - this.lastJumpInputAt < JUMP_INPUT_COOLDOWN) return;
    this.lastJumpInputAt = now;
    this.player?.jump(this.playerRestY);
  }

  setWorldSpeedFactor(factor) {
    this.worldSpeedFactor = factor;
    this.obstacles?.children?.each((obs) => {
      if (obs?.active) obs.setVelocityX(-((obs.baseSpeed ?? RUN_SPEED) * factor));
    });
    this.items?.children?.each((item) => {
      if (item?.active) item.setVelocityX(-((item.baseSpeed ?? RUN_SPEED) * factor));
    });
  }

  applySlipPenalty() {
    this.slipPenaltyEvent?.remove(false);
    this.slipActive = true;
    this.invertControlsUntil = this.time.now + 1100;
    this.setWorldSpeedFactor(0.76);
    this.infoText.setText("\u0e40\u0e08\u0e2d\u0e19\u0e49\u0e33 \u0e25\u0e37\u0e48\u0e19 \u0e04\u0e27\u0e1a\u0e04\u0e38\u0e21\u0e22\u0e32\u0e01\u0e0a\u0e31\u0e48\u0e27\u0e04\u0e23\u0e32\u0e27!");
    this.slipPenaltyEvent = this.time.delayedCall(1100, () => {
      if (this.ended) return;
      this.slipActive = false;
      this.invertControlsUntil = 0;
      this.setWorldSpeedFactor(1);
      this.setDefaultHudMessage();
    });
  }

  applyBananaPenalty() {
    this.inputBlockUntil = this.time.now + 420;
    this.playerLane = 1;
    this.infoText.setText("\u0e42\u0e14\u0e19\u0e40\u0e1b\u0e25\u0e37\u0e2d\u0e01\u0e01\u0e25\u0e49\u0e27\u0e22 \u0e25\u0e49\u0e21\u0e40\u0e25\u0e22!");
    this.time.delayedCall(760, () => { if (!this.ended) this.setDefaultHudMessage(); });
  }

  setDefaultHudMessage() {
    if (!this.infoText) return;
    if (this.timeLeft <= 25) {
      this.infoText.setText("\u0e0a\u0e48\u0e27\u0e07\u0e17\u0e49\u0e32\u0e22\u0e41\u0e25\u0e49\u0e27 \u0e02\u0e2d\u0e07\u0e08\u0e30\u0e21\u0e32\u0e44\u0e27\u0e02\u0e36\u0e49\u0e19 \u0e40\u0e15\u0e23\u0e35\u0e22\u0e21\u0e02\u0e22\u0e31\u0e1a\u0e41\u0e25\u0e30\u0e01\u0e23\u0e30\u0e42\u0e14\u0e14\u0e43\u0e2b\u0e49\u0e41\u0e21\u0e48\u0e19");
      return;
    }
    this.infoText.setText("Space \u0e01\u0e23\u0e30\u0e42\u0e14\u0e14 \u2022 \u2190 \u2192 \u0e02\u0e22\u0e31\u0e1a\u0e2b\u0e25\u0e1a \u2022 \u0e41\u0e15\u0e30\u0e0b\u0e49\u0e32\u0e22\u0e02\u0e27\u0e32 / \u0e1b\u0e31\u0e14\u0e02\u0e36\u0e49\u0e19\u0e1a\u0e19\u0e21\u0e37\u0e2d\u0e16\u0e37\u0e2d");
  }

  setLatestCollectText(message) {
    this.latestCollectLabel = message;
    this.latestItemText?.setText(message);
  }

  hitObstacle(player, obstacle) {
    if (this.ended || obstacle.hitRegistered) return;
    if (this.isClearingObstacle(player, obstacle)) return;
    obstacle.hitRegistered = true;
    const penalty = OBSTACLE_PENALTY[obstacle.obstacleType] ?? 5;
    const toastX = obstacle.x;
    const toastY = obstacle.y - 40;
    obstacle.destroy();
    this.crashes += 1;
    this.scoreManager.addScore(-penalty);
    this.player?.triggerHit();
    this.cameras.main.shake(180, 0.008);
    if (obstacle.obstacleType === "water") {
      this.applySlipPenalty();
      this.setLatestCollectText("\u0e25\u0e48\u0e32\u0e2a\u0e38\u0e14: \u0e40\u0e08\u0e2d\u0e19\u0e49\u0e33");
    } else {
      this.applyBananaPenalty();
      this.setLatestCollectText("\u0e25\u0e48\u0e32\u0e2a\u0e38\u0e14: \u0e40\u0e08\u0e2d\u0e40\u0e1b\u0e25\u0e37\u0e2d\u0e01\u0e01\u0e25\u0e49\u0e27\u0e22");
    }
    this.flashFeedback(`-${penalty}`, "#ffd7d7", toastX, toastY);
  }

  isClearingObstacle(player, obstacle) {
    if (!player || !obstacle?.active || player.isGrounded(this.playerRestY)) return false;
    const playerBounds = this.getCollisionBounds(player, player.airborneVisualCollisionInsets);
    const obstacleBounds = this.getCollisionBounds(obstacle, obstacle.visualCollisionInsets);
    const verticalVelocity = player.body?.velocity?.y ?? 0;
    const baseClearHeight = obstacleBounds.y + (obstacleBounds.height * 0.52);
    const clearanceGrace = verticalVelocity <= 180 ? 12 : 8;
    return playerBounds.bottom <= baseClearHeight + clearanceGrace;
  }

  collectItem(player, item) {
    if (this.ended) return;
    const type = item.itemType ?? item.texture.key;
    const label = ITEM_LABEL[type] ?? "\u0e02\u0e2d\u0e07\u0e2a\u0e48\u0e07";
    const score = ITEM_SCORE[type] ?? 10;
    const toastX = item.x;
    const toastY = item.y - 30;
    item.destroy();
    this.deliveries += 1;
    this.scoreManager.addScore(score);
    this.setLatestCollectText(`\u0e25\u0e48\u0e32\u0e2a\u0e38\u0e14: ${label}`);
    this.flashFeedback(`+${score}`, type === "lotus_incense" ? "#ffefbe" : "#ddffd8", toastX, toastY);
    if (type === "lotus_incense") this.sound.play("horse-neigh", { volume: 0.24 });
    this.tweens.add({
      targets: this.player,
      angle: -2,
      duration: 90,
      yoyo: true,
      ease: "Sine.easeOut",
      onComplete: () => { if (this.player) this.player.angle = 0; },
    });
  }

  flashFeedback(message, color, x = null, y = null) {
    const toast = this.add.text(x ?? (this.scale.width / 2 + 20), y ?? 250, message, {
      fontFamily: "Kanit", fontSize: "42px", fontStyle: "bold", color: "#3b1800", stroke: color ?? "#fff4d1", strokeThickness: 8,
    }).setOrigin(0.5).setDepth(30).setAlpha(0);
    this.tweens.add({
      targets: toast,
      alpha: 1,
      y: toast.y - 28,
      duration: 360,
      ease: "Cubic.easeOut",
      onComplete: () => {
        this.tweens.add({ targets: toast, alpha: 0, y: toast.y - 24, duration: 220, onComplete: () => toast.destroy() });
      },
    });
  }

  endGame() {
    if (this.ended) return;
    this.ended = true;
    this.playing = false;
    this.gallopBgm?.stop();
    this.fairBgm?.stop();
    this.physics.pause();
    this.timerEvent?.remove(false);
    this.countdownEvent?.remove(false);
    this.slipPenaltyEvent?.remove(false);
    this.openingSpawnCalls.forEach((call) => call?.remove(false));
    this.openingSpawnCalls = [];
    this.infoText.setVisible(false);
    this.latestItemText.setVisible(false);
    this.timeFrame.setVisible(false);
    this.rulePanel.setVisible(false);
    this.resultScoreText.setText(String(this.scoreManager.getScore()));
    this.resultHintText.setText(`\u0e40\u0e01\u0e47\u0e1a\u0e02\u0e2d\u0e07\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08 ${this.deliveries} \u0e04\u0e23\u0e31\u0e49\u0e07\n\u0e0a\u0e19\u0e2a\u0e34\u0e48\u0e07\u0e01\u0e35\u0e14\u0e02\u0e27\u0e32\u0e07 ${this.crashes} \u0e04\u0e23\u0e31\u0e49\u0e07\n\u0e40\u0e27\u0e25\u0e32\u0e04\u0e07\u0e40\u0e2b\u0e25\u0e37\u0e2d ${Math.max(0, this.timeLeft)} \u0e27\u0e34\u0e19\u0e32\u0e17\u0e35`);
    this.resultOverlay.setVisible(true);
  }

  cleanup() {
    this.gallopBgm?.stop();
    this.gallopBgm?.destroy();
    this.gallopBgm = null;
    this.fairBgm?.stop();
    this.fairBgm?.destroy();
    this.fairBgm = null;
    this.timerEvent?.remove(false);
    this.countdownEvent?.remove(false);
    this.slipPenaltyEvent?.remove(false);
    this.openingSpawnCalls.forEach((call) => call?.remove(false));
    this.openingSpawnCalls = [];
    this.backdropSegments?.forEach((segment) => segment.destroy());
    this.backdropSegments = [];
    this.input.off("pointerdown", this.pointerDownHandler);
    this.input.off("pointerup", this.pointerUpHandler);
    this.scale.off("resize", this.handleResize, this);
  }
}
