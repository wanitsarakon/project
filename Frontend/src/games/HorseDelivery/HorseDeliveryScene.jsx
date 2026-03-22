import Phaser from "phaser";

import Horse from "./components/Horse";
import Obstacle from "./components/Obstacle";
import Items from "./components/Items";
import ScoreManager from "./components/ScoreManager";

const GAME_TIME = 60;
const BG_IMAGE = new URL("./assetsHorse/BGhorse.PNG", import.meta.url).href;
const HORSE_TEXTURES = [
  { key: "horse-1", asset: new URL("./assetsHorse/ขี่ม้า1.png", import.meta.url).href, label: "ขี่ม้า 1" },
  { key: "horse-2", asset: new URL("./assetsHorse/ขี่ม้า2.png", import.meta.url).href, label: "ขี่ม้า 2" },
  { key: "horse-3", asset: new URL("./assetsHorse/ขี่ม้า3.png", import.meta.url).href, label: "ขี่ม้า 3" },
];
const OBSTACLE_IMAGE = new URL("./assetsHorse/obstacle.png", import.meta.url).href;
const ITEM_CANDY = new URL("./assetsHorse/item_candy.png", import.meta.url).href;
const ITEM_COIN = new URL("./assetsHorse/item_coin.png", import.meta.url).href;
const ITEM_GIFT = new URL("./assetsHorse/item_gift.png", import.meta.url).href;
const ITEM_HAY = new URL("./assetsHorse/item_hay.png", import.meta.url).href;
const RULE_SIGN = new URL("./assetsHorse/sign.png", import.meta.url).href;
const START_SIGN = new URL("./assetsHorse/ขี่ม้าเริ่มเกม.png", import.meta.url).href;
const RESULT_SIGN = new URL("./assetsHorse/ขี่ม้าคะเนน.png", import.meta.url).href;
const COUNT_SOUND = new URL("./sounds/countdown.mp3", import.meta.url).href;
const START_SOUND = new URL("./sounds/start.mp3", import.meta.url).href;
const HORSE_GALLOP = new URL("./sounds/horse_gallop.wav", import.meta.url).href;
const HORSE_NEIGH = new URL("./sounds/horse_neigh.wav", import.meta.url).href;
const FAIR_AMBIENCE = new URL("./sounds/fair_ambience.wav", import.meta.url).href;
const HUD_SIGN_IMAGE = "/assets/เเผ่นป้ายเวลากับคะเเนน.png";
const HORSE_SWAP_TIMINGS = [
  { elapsed: 15, index: 1 },
  { elapsed: 45, index: 2 },
];
const HORSE_SWAP_REQUIRED_ACTIONS = 2;
const HORSE_SWAP_MISS_PENALTY = 5;
const RUN_SPEED = 620;
const ITEM_SPAWN_OFFSET_X = 150;
const ITEM_LANE_OFFSET = 175;
const OBSTACLE_LANE_OFFSET = -115;
const ITEM_MIN_SPACING = 260;
const SWAP_PREVIEW_SCREEN_X = 640;
const HORSE_Y_OFFSET = 8;
const SPAWN_PATTERN = ["item", "obstacle","item","item", "obstacle"];
const BASE_SPAWN_DELAY = 3100;
const LATE_SPAWN_DELAY = 2700;
const OPENING_SPAWN_DELAYS = [700, 2100, 3600];
const JUMP_FORWARD_OFFSET = 120;
export default class HorseDeliveryScene extends Phaser.Scene {
  constructor() {
    super("HorseDeliveryScene");
    this.timerEvent = null;
    this.swapDeadlineEvent = null;
    this.penaltyEvent = null;
    this.previewTween = null;
    this.swapApproachTween = null;
    this.openingSpawnCalls = [];
  }

  init(data = {}) {
    this.playerData = data.player ?? null;
    this.onGameEnd = data.onGameEnd ?? null;
    this.roundId = data.roundId ?? null;

    this.timeLeft = GAME_TIME;
    this.elapsedSeconds = 0;
    this.ended = false;
    this.started = false;
    this.midgameRampApplied = false;
    this.deliveries = 0;
    this.crashes = 0;
    this.currentHorseIndex = 0;
    this.pendingHorseIndex = null;
    this.swapWindowActive = false;
    this.speedPenaltyActive = false;
    this.worldSpeedFactor = 1;
    this.nextSwapStep = 0;
    this.lastItemSpawnAt = 0;
    this.lastObstacleSpawnAt = 0;
    this.lastSpawnAt = 0;
    this.spawnPatternIndex = 0;
    this.nextSpawnAt = 0;
    this.playerRestY = 0;
    this.lastActionAt = -9999;
    this.inputBlockUntil = 0;
    this.swapActionCount = 0;
  }

  preload() {
    this.load.image("horse-bg", BG_IMAGE);
    HORSE_TEXTURES.forEach((horse) => this.load.image(horse.key, horse.asset));
    this.load.image("obstacle", OBSTACLE_IMAGE);
    this.load.image("item_candy", ITEM_CANDY);
    this.load.image("item_coin", ITEM_COIN);
    this.load.image("item_gift", ITEM_GIFT);
    this.load.image("item_hay", ITEM_HAY);
    this.load.image("horse-rule-sign", RULE_SIGN);
    this.load.image("horse-start-sign", START_SIGN);
    this.load.image("horse-result-sign", RESULT_SIGN);
    this.load.image("horse-hud-sign", HUD_SIGN_IMAGE);
    this.load.audio("horse-count", COUNT_SOUND);
    this.load.audio("horse-start", START_SOUND);
    this.load.audio("horse-gallop", HORSE_GALLOP);
    this.load.audio("horse-neigh", HORSE_NEIGH);
    this.load.audio("horse-fair-bgm", FAIR_AMBIENCE);
  }

  create() {
    const { width, height } = this.scale;

    this.bg = this.add.image(width / 2, height / 2, "horse-bg").setDepth(-5);
    this.fitBackgroundToViewport();
    this.add.rectangle(width / 2, height - 74, width, 160, 0x5f3517, 0.01).setDepth(-4);

    this.groundY = height - 172;
    this.ground = this.physics.add.staticImage(width / 2, this.groundY + 14 )
      .setDisplaySize(width, 90)
      .setVisible(false);
    this.ground.refreshBody();

    this.createHud();
    this.createStartOverlay();
    this.createResultOverlay();

    this.events.once("shutdown", () => this.cleanup());
    this.events.once("destroy", () => this.cleanup());
  }

  fitBackgroundToViewport() {
    const { width, height } = this.scale;
    const source = this.textures.get("horse-bg")?.getSourceImage?.();
    if (!this.bg || !source?.width || !source?.height) return;

    const coverScale = Math.max(width / source.width, height / source.height);
    this.bg.setPosition(width / 2, height / 2);
    this.bg.setScale(coverScale);
  }

  createHud() {
    const { width, height } = this.scale;

    this.scoreManager = new ScoreManager(this);
    this.scoreManager.hide();

    this.timeFrame = this.add.image(width - 168, 44, "horse-hud-sign")
      .setDisplaySize(258, 86)
      .setDepth(19)
      .setVisible(false)
      .setScrollFactor(0);

    this.timeText = this.add.text(width - 168, 44, `เวลา: ${GAME_TIME} วิ`, {
      fontFamily: "Kanit",
      fontSize: "28px",
      color: "#fff4bf",
      stroke: "#4f1e00",
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(20).setVisible(false).setScrollFactor(0);

    this.infoText = this.add.text(width / 2, 28, "", {
      fontFamily: "Kanit",
      fontSize: "18px",
      color: "#fffbe6",
      backgroundColor: "rgba(51,26,4,0.5)",
      padding: { left: 14, right: 14, top: 6, bottom: 6 },
      align: "center",
    }).setOrigin(0.5, 0).setDepth(20).setVisible(false).setScrollFactor(0);

    this.swapPromptText = this.add.text(width / 2, 70, "", {
      fontFamily: "Kanit",
      fontSize: "24px",
      fontStyle: "bold",
      color: "#fff6d6",
      stroke: "#4f1e00",
      strokeThickness: 5,
      align: "center",
    }).setOrigin(0.5, 0).setDepth(21).setVisible(false).setScrollFactor(0);

    this.rulePanel = this.add.container(width - 220, 188).setDepth(18).setVisible(false).setScrollFactor(0);
    const ruleSign = this.add.image(0, 0, "horse-rule-sign").setDisplaySize(380, 272);
    this.rulePanel.add([ruleSign]);

  }

  createStartOverlay() {
    const { width, height } = this.scale;
    this.startOverlay = this.add.container(0, 0).setDepth(40).setScrollFactor(0);
    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.58);
    const banner = this.add.image(width / 2, height / 2 - 96, "horse-start-sign").setDisplaySize(700, 468);
    const copy = this.add.text(
      width / 2,
      height / 2 + 4,
      "เก็บลูกอม เหรียญ และของขวัญได้ +1 แต่ถ้าชนถังหรือเก็บฟางจะโดน -1\nครบ 15 และ 45 วินาที ต้องกด Space หรือคลิก 2 ครั้งภายใน 4 วินาที ไม่ทันจะโดน -5",
      {
        fontFamily: "Kanit",
        fontSize: "18px",
        color: "#fff7db",
        stroke: "#3c1e00",
        strokeThickness: 5,
        wordWrap: { width: 540 },
        align: "center",
      },
    ).setOrigin(0.5);
    const button = this.add.text(width / 2, height / 2 + 216, "เริ่มแข่ง", {
      fontFamily: "Kanit",
      fontSize: "28px",
      color: "#fff7d9",
      backgroundColor: "#b44b12",
      padding: { left: 24, right: 24, top: 10, bottom: 10 },
      stroke: "#632500",
      strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    button.on("pointerdown", () => this.startCountdown());

    this.startOverlay.add([dim, banner, copy, button]);
  }

  createResultOverlay() {
    const { width, height } = this.scale;
    this.resultOverlay = this.add.container(0, 0).setDepth(50).setVisible(false).setScrollFactor(0);
    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    const banner = this.add.image(width / 2, height / 2, "horse-result-sign").setDisplaySize(720, 480);
    this.resultScoreText = this.add.text(width / 2, height / 2 + 18, "0", {
      fontFamily: "Kanit",
      fontSize: "60px",
      fontStyle: "bold",
      color: "#702500",
      stroke: "#fff1b6",
      strokeThickness: 6,
    }).setOrigin(0.5);
    this.resultHintText = this.add.text(width / 2, height / 2 + 96, "", {
      fontFamily: "Kanit",
      fontSize: "20px",
      color: "#5f2400",
      align: "center",
    }).setOrigin(0.5);
    const button = this.add.text(width / 2, height / 2 + 172, "กลับแผนที่", {
      fontFamily: "Kanit",
      fontSize: "26px",
      color: "#fff5dd",
      backgroundColor: "#8f3d13",
      padding: { left: 24, right: 24, top: 10, bottom: 10 },
      stroke: "#532000",
      strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    button.on("pointerdown", () => {
      this.onGameEnd?.({
        score: this.scoreManager.getScore(),
        roundId: this.roundId,
        meta: {
          timeLeft: this.timeLeft,
          deliveries: this.deliveries,
          crashes: this.crashes,
        },
      });
    });

    this.resultOverlay.add([dim, banner, this.resultScoreText, this.resultHintText, button]);
  }

  startCountdown() {
    if (this.started) return;
    this.started = true;
    this.startOverlay.setVisible(false);

    this.countdownText = this.add.text(this.scale.width / 2, this.scale.height / 2, "3", {
      fontFamily: "Kanit",
      fontSize: "132px",
      fontStyle: "bold",
      color: "#fff0c5",
      stroke: "#4e1b00",
      strokeThickness: 8,
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
          this.countdownText.setText("ไป!");
          this.sound.play("horse-start", { volume: 0.6 });
        } else {
          this.countdownText.destroy();
          this.startGame();
        }
      },
    });
  }

  startGame() {
    const { width } = this.scale;
    this.playerCruiseX = width / 2 - 220;
    this.spawnPatternIndex = 0;
    this.lastSpawnAt = this.time.now;
    this.lastItemSpawnAt = this.time.now - 1200;
    this.lastObstacleSpawnAt = this.time.now - 1200;
    this.nextSpawnAt = this.time.now + OPENING_SPAWN_DELAYS[0];
    this.inputBlockUntil = this.time.now + 450;

    this.gallopBgm = this.sound.add("horse-gallop", { loop: true, volume: 0.24 });
    this.fairBgm = this.sound.add("horse-fair-bgm", { loop: true, volume: 0.11 });
    if (!this.gallopBgm.isPlaying) this.gallopBgm.play();
    if (!this.fairBgm.isPlaying) this.fairBgm.play();
    this.sound.play("horse-neigh", { volume: 0.35 });

    this.scoreManager.show();
    this.timeFrame.setVisible(true);
    this.timeText.setVisible(true);
    this.infoText.setVisible(true);
    this.swapPromptText.setVisible(true);
    this.rulePanel.setVisible(true);
    this.setDefaultHudMessage();

    this.tweens.add({
      targets: this.infoText,
      alpha: 0.82,
      duration: 1800,
      yoyo: true,
      repeat: 1,
    });

    this.player = new Horse(this, this.playerCruiseX, this.groundY - HORSE_Y_OFFSET, HORSE_TEXTURES[0].key);
    this.playerRestY = this.player.y;
    this.physics.add.collider(this.player, this.ground);
    this.nextHorsePreview = this.add.image(this.player.x + SWAP_PREVIEW_SCREEN_X, this.player.y - 10, HORSE_TEXTURES[1].key)
      .setOrigin(0.5, 1)
      .setScale(this.player.baseScale * 0.94)
      .setDepth(7)
      .setAlpha(0.72)
      .setVisible(false);

    this.obstacles = this.physics.add.group({ maxSize: 24 });
    this.items = this.physics.add.group({ maxSize: 24 });

    this.openingSpawnCalls = OPENING_SPAWN_DELAYS.map((delay) => this.time.delayedCall(delay, () => {
      if (!this.ended) this.advanceSpawnPattern(true);
    }));

    this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);
    this.physics.add.overlap(this.player, this.items, this.collectItem, null, this);

    this.actionHandler = () => this.handleActionInput();
    this.input.on("pointerup", this.actionHandler);
    this.keyJump = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyJump?.on("down", this.actionHandler);

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.ended) return;
        this.elapsedSeconds += 1;
        this.timeLeft -= 1;
        this.timeText.setText(`เวลา: ${Math.max(0, this.timeLeft)} วิ`);
        this.maybeStartHorseSwap();
        if (this.timeLeft === 25 && !this.swapWindowActive && !this.speedPenaltyActive) {
        this.infoText.setText("ช่วงท้ายแล้ว ของจะมาไวขึ้น เตรียมกระโดดและสลับม้า 2 ครั้งให้ทัน");
        }
        if (this.timeLeft <= 0) this.endGame();
      },
    });
  }

  spawnObstacle(ignoreSpacing = false, spawnXOverride = null) {
    if (this.ended) return false;
    if (!ignoreSpacing && !this.canSpawnObstacleNow()) return false;
    const spawnX = spawnXOverride ?? (this.scale.width + ITEM_SPAWN_OFFSET_X);
    const obstacleY = this.playerRestY + OBSTACLE_LANE_OFFSET;
    const obstacle = new Obstacle(
      this,
      spawnX,
      obstacleY,
    );
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
    group?.children?.each((entity) => {
      if (entity?.active) rightmost = Math.max(rightmost, entity.x);
    });
    return rightmost;
  }

  getClosestEntityToSpawnX(spawnX) {
    const nearestItemX = this.getRightmostActiveX(this.items);
    const nearestObstacleX = this.getRightmostActiveX(this.obstacles);
    return Math.max(nearestItemX, nearestObstacleX);
  }

  spawnItem(ignoreSpacing = false, spawnXOverride = null) {
    if (this.ended) return false;
    if (!ignoreSpacing && !this.canSpawnItemNow()) return false;
    const spawnX = spawnXOverride ?? (this.scale.width + ITEM_SPAWN_OFFSET_X);
    const itemY = this.playerRestY - ITEM_LANE_OFFSET;
    const item = new Items(
      this,
      spawnX,
      itemY,
    );
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
    if (this.ended || !this.player) return;

    this.player.update(this.playerRestY);
    this.advanceRun(this.game.loop.delta / 1000);
    this.keepPlayerOnScreen();
    this.detectVisualOverlaps();
    if (this.nextHorsePreview?.visible) {
      this.nextHorsePreview.setY(this.playerRestY - 10);
    }
    this.obstacles?.children?.each((obs) => {
      if (obs?.active && obs.x < -120) obs.destroy();
    });

    this.items?.children?.each((item) => {
      if (item?.active && item.x < -120) item.destroy();
    });

    this.ensureSpawnFlow();
  }

  detectVisualOverlaps() {
    const isAirborne = !this.player.isGrounded(this.playerRestY);
    const playerBounds = this.getCollisionBounds(
      this.player,
      isAirborne ? this.player.airborneVisualCollisionInsets : this.player.visualCollisionInsets,
    );

    this.obstacles?.children?.each((obstacle) => {
      if (!obstacle?.active || obstacle.hitRegistered) return;
      const obstacleBounds = this.getCollisionBounds(obstacle, obstacle.visualCollisionInsets);

      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, obstacleBounds)) {
        this.hitObstacle(this.player, obstacle);
      }
    });

    this.items?.children?.each((item) => {
      if (!item?.active) return;
      const itemBounds = this.getCollisionBounds(item, item.visualCollisionInsets);

      if (Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, itemBounds)) {
        this.collectItem(this.player, item);
      }
    });
  }

  getCollisionBounds(sprite, insets = {}) {
    const bounds = sprite.getBounds();
    const left = insets.left ?? insets.padX ?? 0;
    const right = insets.right ?? insets.padX ?? 0;
    const top = insets.top ?? insets.padTop ?? 0;
    const bottom = insets.bottom ?? insets.padBottom ?? 0;
    return new Phaser.Geom.Rectangle(
      bounds.x + left,
      bounds.y + top,
      Math.max(1, bounds.width - left - right),
      Math.max(1, bounds.height - top - bottom),
    );
  }

  ensureSpawnFlow() {
    if (this.swapWindowActive || this.speedPenaltyActive) return;

    const now = this.time.now;
    if (now < this.nextSpawnAt) return;

    const activeItems = this.getActiveEntityCount(this.items);
    const activeObstacles = this.getActiveEntityCount(this.obstacles);
    const needsRecovery = now - this.lastSpawnAt > 2100 || (activeItems + activeObstacles) === 0;
    const spawned = this.advanceSpawnPattern(needsRecovery);

    if (!spawned) {
      this.nextSpawnAt = now + 280;
    }
  }

  getCurrentSpawnDelay() {
    return this.timeLeft <= 24 ? LATE_SPAWN_DELAY : BASE_SPAWN_DELAY;
  }

  getActiveEntityCount(group) {
    let count = 0;
    group?.children?.each((entity) => {
      if (entity?.active) count += 1;
    });
    return count;
  }

  advanceSpawnPattern(ignoreSpacing = false) {
    const kind = SPAWN_PATTERN[this.spawnPatternIndex % SPAWN_PATTERN.length];
    const spawned = kind === "obstacle"
      ? this.spawnObstacle(ignoreSpacing, this.scale.width + 60)
      : this.spawnItem(ignoreSpacing, this.scale.width + 180);

    if (spawned !== false) {
      this.spawnPatternIndex = (this.spawnPatternIndex + 1) % SPAWN_PATTERN.length;
      return true;
    }

    return false;
  }

  advanceRun(deltaSeconds) {
    if (!this.player) return;

    const isAirborne = !this.player.isGrounded(this.playerRestY);
    const baseTargetX = this.playerCruiseX ?? this.scale.width / 2;
    const targetX = this.swapWindowActive || this.speedPenaltyActive
      ? this.player.x
      : baseTargetX + (isAirborne ? JUMP_FORWARD_OFFSET : 0);
    const blend = Phaser.Math.Clamp(deltaSeconds * (isAirborne ? 5.5 : 7.5), 0, 1);
    this.player.x = Phaser.Math.Linear(this.player.x, targetX, blend);
  }

  keepPlayerOnScreen() {
    if (!this.player) return;
    const minX = this.scale.width * 0.34;
    const maxX = this.scale.width * 0.62;
    this.player.x = Phaser.Math.Clamp(this.player.x, minX, maxX);
  }

  handleActionInput() {
    if (this.ended || !this.started) return;
    const now = this.time.now;
    if (now < this.inputBlockUntil || now - this.lastActionAt < 180) return;
    this.lastActionAt = now;
    if (this.swapWindowActive) {
      this.swapActionCount += 1;
      const actionsLeft = Math.max(0, HORSE_SWAP_REQUIRED_ACTIONS - this.swapActionCount);
      if (actionsLeft === 0) {
        this.completeHorseSwap();
      } else if (this.pendingHorseIndex != null) {
        this.swapPromptText.setText(
          `${HORSE_TEXTURES[this.pendingHorseIndex].label}\nอีก ${actionsLeft} ครั้ง ภายใน 4 วินาที`
        );
      }
      return;
    }
    if (this.speedPenaltyActive) return;
    this.player?.jump(this.playerRestY);
  }

  maybeStartHorseSwap() {
    const nextSwap = HORSE_SWAP_TIMINGS[this.nextSwapStep];
    if (!nextSwap || this.elapsedSeconds !== nextSwap.elapsed) return;

    this.beginHorseSwap(nextSwap.index);
    this.nextSwapStep += 1;
  }

  beginHorseSwap(targetHorseIndex) {
    if (this.swapWindowActive || this.speedPenaltyActive || !this.player) return;

    this.pendingHorseIndex = targetHorseIndex;
    this.swapWindowActive = true;
    this.swapActionCount = 0;
    this.showNextHorsePreview(targetHorseIndex);
    this.swapPromptText.setText(`ถึงจุดเปลี่ยนเป็น ${HORSE_TEXTURES[targetHorseIndex].label}\nกด Space หรือคลิก 2 ครั้งภายใน 4 วินาที`);
    this.infoText.setText("ตอนนี้ปุ่ม Space และคลิกจะใช้สำหรับเปลี่ยนม้า ต้องกดให้ครบ 2 ครั้ง");
    this.swapPromptText.setAlpha(1);
    this.sound.play("horse-neigh", { volume: 0.26 });

    this.tweens.add({
      targets: this.swapPromptText,
      alpha: 0.35,
      duration: 160,
      yoyo: true,
      repeat: 5,
    });

    this.swapDeadlineEvent?.remove(false);
    this.swapDeadlineEvent = this.time.delayedCall(4000, () => this.failHorseSwap());
  }

  completeHorseSwap() {
    if (!this.swapWindowActive || this.pendingHorseIndex == null) return;

    this.swapDeadlineEvent?.remove(false);
    this.inputBlockUntil = this.time.now + 220;
    const nextHorseIndex = this.pendingHorseIndex;
    this.swapWindowActive = false;
    this.pendingHorseIndex = null;
    this.swapActionCount = 0;
    this.hideNextHorsePreview();
    this.setHorseCharacter(nextHorseIndex);
    this.resetPlayerLane();
    this.swapPromptText.setText(`${HORSE_TEXTURES[nextHorseIndex].label} พร้อมลุยแล้ว`);
    this.deferPromptClear();
    this.setDefaultHudMessage();
  }

  failHorseSwap() {
    if (!this.swapWindowActive || this.pendingHorseIndex == null) return;

    const nextHorseIndex = this.pendingHorseIndex;
    this.swapWindowActive = false;
    this.pendingHorseIndex = null;
    this.swapActionCount = 0;
    this.speedPenaltyActive = true;
    this.inputBlockUntil = this.time.now + 220;
    this.setWorldSpeedFactor(0);
    this.scoreManager.addScore(-HORSE_SWAP_MISS_PENALTY);
    this.flashFeedback(`-${HORSE_SWAP_MISS_PENALTY}`, "#ffd7d7");
    this.infoText.setText(`เปลี่ยนม้าไม่ทัน โดน -${HORSE_SWAP_MISS_PENALTY} และม้าจะหยุดวิ่ง 3 วินาที`);
    this.swapPromptText.setText(`กำลังสลับเป็น ${HORSE_TEXTURES[nextHorseIndex].label}`);

    this.penaltyEvent?.remove(false);
    this.penaltyEvent = this.time.delayedCall(3000, () => {
      this.speedPenaltyActive = false;
      this.setWorldSpeedFactor(1);
      this.hideNextHorsePreview();
      this.setHorseCharacter(nextHorseIndex);
      this.resetPlayerLane();
      this.swapPromptText.setText(`${HORSE_TEXTURES[nextHorseIndex].label} กลับมาวิ่งต่อแล้ว`);
      this.deferPromptClear();
      this.setDefaultHudMessage();
    });
  }

  setHorseCharacter(horseIndex) {
    this.currentHorseIndex = horseIndex;
    this.player?.setHorseTexture(HORSE_TEXTURES[horseIndex].key);
    this.sound.play("horse-neigh", { volume: 0.3 });
    this.tweens.add({
      targets: this.player,
      angle: 3,
      duration: 110,
      yoyo: true,
      onComplete: () => {
        if (this.player) this.player.angle = 0;
      },
    });
  }

  showNextHorsePreview(horseIndex) {
    if (!this.nextHorsePreview || !this.player) return;
    const previewX = Math.min(this.scale.width - 160, this.playerCruiseX + 250);
    this.nextHorsePreview
      .setTexture(HORSE_TEXTURES[horseIndex].key)
      .setPosition(previewX, this.player.y - 10)
      .setScale(this.player.baseScale * 0.94)
      .setAlpha(0.72)
      .setVisible(true);
    this.previewTween?.stop();
    this.previewTween = null;
    this.swapApproachTween?.stop();
    this.swapApproachTween = null;
  }

  hideNextHorsePreview() {
    this.previewTween?.stop();
    this.previewTween = null;
    this.swapApproachTween?.stop();
    this.swapApproachTween = null;
    this.nextHorsePreview?.setVisible(false);
  }

  resetPlayerLane() {
    if (!this.player) return;
    this.swapApproachTween?.stop();
    this.swapApproachTween = null;
    this.player.x = this.playerCruiseX ?? this.scale.width / 2;
    this.keepPlayerOnScreen();
  }

  setWorldSpeedFactor(factor) {
    this.worldSpeedFactor = factor;
    this.obstacles?.children?.each((obs) => {
      if (obs?.active) {
        const baseSpeed = obs.baseSpeed ?? RUN_SPEED;
        obs.setVelocityX(-(baseSpeed * factor));
      }
    });
    this.items?.children?.each((item) => {
      if (item?.active) {
        const baseSpeed = item.baseSpeed ?? RUN_SPEED;
        item.setVelocityX(-(baseSpeed * factor));
      }
    });
  }

  setDefaultHudMessage() {
    if (!this.infoText) return;
    if (this.timeLeft <= 25) {
      this.infoText.setText("ช่วงท้ายแล้ว ของจะมาไวขึ้น เตรียมกระโดดและสลับม้าให้แม่น");
      return;
    }
    this.infoText.setText("คลิกหรือกด Space เพื่อกระโดด และตอนสลับม้าต้องกดให้ครบ 2 ครั้งภายใน 4 วินาที");
  }

  deferPromptClear() {
    this.time.delayedCall(900, () => {
      if (!this.ended && !this.swapWindowActive && !this.speedPenaltyActive) {
        this.swapPromptText.setText("");
        this.swapPromptText.setAlpha(1);
      }
    });
  }

  hitObstacle(player, obstacle) {
    if (this.ended || obstacle.hitRegistered) return;
    if (this.isClearingObstacle(player, obstacle)) return;
    obstacle.hitRegistered = true;
    obstacle.destroy();
    this.crashes += 1;
    this.scoreManager.addScore(-1);
    this.tweens.add({
      targets: this.player,
      angle: -10,
      duration: 90,
      yoyo: true,
      repeat: 1,
    });
    this.flashFeedback("-1", "#ffd7d7");
    this.cameras.main.shake(180, 0.008);
  }

  isClearingObstacle(player, obstacle) {
    if (!player || !obstacle?.active || player.isGrounded(this.playerRestY)) return false;

    const playerBounds = this.getCollisionBounds(player, player.airborneVisualCollisionInsets);
    const obstacleBounds = this.getCollisionBounds(obstacle, obstacle.visualCollisionInsets);

    // If the horse's collision feet are above the upper portion of the barrel, count it as a clean jump.
    return playerBounds.bottom <= obstacleBounds.y + (obstacleBounds.height * 0.38);
  }

  collectItem(player, item) {
    if (this.ended) return;

    const type = item.texture.key;
    item.destroy();

    if (type === "item_hay") {
      this.scoreManager.addScore(-1);
      this.cameras.main.shake(120, 0.004);
      this.flashFeedback("-1", "#ffe0cf");
      return;
    }

    this.deliveries += 1;

    if (type === "item_gift") {
      this.scoreManager.addScore(1);
      this.flashFeedback("+1", "#ffefbe");
      this.sound.play("horse-neigh", { volume: 0.28 });
    } else {
      this.scoreManager.addScore(1);
      this.flashFeedback("+1", "#ddffd8");
    }

    this.tweens.add({
      targets: this.player,
      angle: -2,
      duration: 90,
      yoyo: true,
      ease: "Sine.easeOut",
      onComplete: () => {
        if (this.player) this.player.angle = 0;
      },
    });
  }

  flashFeedback(message) {
    const toast = this.add.text(this.scale.width / 2 + 20, 250, message, {
      fontFamily: "Kanit",
      fontSize: "42px",
      fontStyle: "bold",
      color: "#3b1800",
      stroke: "#fff4d1",
      strokeThickness: 8,
    }).setOrigin(0.5).setDepth(30).setAlpha(0);

    this.tweens.add({
      targets: toast,
      alpha: 1,
      y: 214,
      duration: 380,
      ease: "Cubic.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: toast,
          alpha: 0,
          y: 186,
          duration: 220,
          onComplete: () => toast.destroy(),
        });
      },
    });
  }

  endGame() {
    if (this.ended) return;

    this.ended = true;
    this.gallopBgm?.stop();
    this.fairBgm?.stop();
    this.physics.pause();
    this.timerEvent?.remove(false);
    this.countdownEvent?.remove(false);
    this.swapDeadlineEvent?.remove(false);
    this.penaltyEvent?.remove(false);
    this.openingSpawnCalls.forEach((call) => call?.remove(false));
    this.openingSpawnCalls = [];
    this.infoText.setVisible(false);
    this.swapPromptText.setVisible(false);
    this.hideNextHorsePreview();
    this.swapApproachTween?.stop();
    this.swapApproachTween = null;
    this.timeFrame.setVisible(false);
    this.rulePanel.setVisible(false);
    this.resultScoreText.setText(String(this.scoreManager.getScore()));
    this.resultHintText.setText(
      `เก็บของสำเร็จ ${this.deliveries} ครั้ง  •  ชนสิ่งกีดขวาง ${this.crashes} ครั้ง  •  เวลาคงเหลือ ${Math.max(0, this.timeLeft)} วินาที`,
    );
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
    this.swapDeadlineEvent?.remove(false);
    this.penaltyEvent?.remove(false);
    this.openingSpawnCalls.forEach((call) => call?.remove(false));
    this.openingSpawnCalls = [];
    this.hideNextHorsePreview();
    this.previewTween?.stop();
    this.previewTween = null;
    this.swapApproachTween?.stop();
    this.swapApproachTween = null;
    if (this.actionHandler) {
      this.input.off("pointerup", this.actionHandler);
      this.keyJump?.off("down", this.actionHandler);
    }
  }
}
