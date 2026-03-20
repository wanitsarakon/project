import Phaser from "phaser";

import Horse from "./components/Horse";
import Obstacle from "./components/Obstacle";
import Items from "./components/Items";
import ScoreManager from "./components/ScoreManager";

const GAME_TIME = 60;
const BG_IMAGE = "/assetsHorse/BGhorse.png";
const HORSE_IMAGE = "/assetsHorse/horse.png";
const OBSTACLE_IMAGE = "/assetsHorse/obstacle.png";
const ITEM_CANDY = "/assetsHorse/item_candy.png";
const ITEM_COIN = "/assetsHorse/item_coin.png";
const ITEM_GIFT = "/assetsHorse/item_gift.png";
const ITEM_HAY = "/assetsHorse/item_hay.png";
const RULE_SIGN = "/assetsHorse/sign.png";
const START_SIGN = new URL("./assetsHorse/ขี่ม้าเริ่มเกม.png", import.meta.url).href;
const RESULT_SIGN = new URL("./assetsHorse/ขี่ม้าคะเนน.png", import.meta.url).href;
const COUNT_SOUND = new URL("./sounds/countdown.mp3", import.meta.url).href;
const START_SOUND = new URL("./sounds/start.mp3", import.meta.url).href;
const HORSE_GALLOP = new URL("./sounds/horse_gallop.wav", import.meta.url).href;
const HORSE_NEIGH = new URL("./sounds/horse_neigh.wav", import.meta.url).href;
const FAIR_AMBIENCE = new URL("./sounds/fair_ambience.wav", import.meta.url).href;

export default class HorseDeliveryScene extends Phaser.Scene {
  constructor() {
    super("HorseDeliveryScene");
    this.spawnClock = null;
    this.itemClock = null;
    this.timerEvent = null;
  }

  init(data = {}) {
    this.playerData = data.player ?? null;
    this.onGameEnd = data.onGameEnd ?? null;
    this.roundId = data.roundId ?? null;

    this.timeLeft = GAME_TIME;
    this.ended = false;
    this.started = false;
    this.midgameRampApplied = false;
  }

  preload() {
    this.load.image("horse-bg", BG_IMAGE);
    this.load.image("horse", HORSE_IMAGE);
    this.load.image("obstacle", OBSTACLE_IMAGE);
    this.load.image("item_candy", ITEM_CANDY);
    this.load.image("item_coin", ITEM_COIN);
    this.load.image("item_gift", ITEM_GIFT);
    this.load.image("item_hay", ITEM_HAY);
    this.load.image("horse-rule-sign", RULE_SIGN);
    this.load.image("horse-start-sign", START_SIGN);
    this.load.image("horse-result-sign", RESULT_SIGN);
    this.load.audio("horse-count", COUNT_SOUND);
    this.load.audio("horse-start", START_SOUND);
    this.load.audio("horse-gallop", HORSE_GALLOP);
    this.load.audio("horse-neigh", HORSE_NEIGH);
    this.load.audio("horse-fair-bgm", FAIR_AMBIENCE);
  }

  create() {
    const { width, height } = this.scale;

    this.add.image(width / 2, height / 2, "horse-bg").setDisplaySize(width, height);
    this.add.rectangle(width / 2, height - 74, width, 160, 0x5f3517, 0.01);

    this.groundY = height - 132;
    this.ground = this.physics.add.staticImage(width / 2, this.groundY + 30)
      .setDisplaySize(width, 90)
      .setVisible(false);
    this.ground.refreshBody();

    this.createHud();
    this.createStartOverlay();
    this.createResultOverlay();

    this.events.once("shutdown", () => this.cleanup());
    this.events.once("destroy", () => this.cleanup());
  }

  createHud() {
    const { width, height } = this.scale;

    this.scoreManager = new ScoreManager(this);
    this.scoreManager.hide();

    this.timeFrame = this.add.rectangle(170, 44, 292, 62, 0x5a2811, 0.82)
      .setStrokeStyle(4, 0xa35c24)
      .setDepth(19)
      .setVisible(false);

    this.timeText = this.add.text(170, 44, `TIME: ${GAME_TIME}s`, {
      fontFamily: "Kanit",
      fontSize: "28px",
      color: "#fff4bf",
      stroke: "#4f1e00",
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(20).setVisible(false);

    this.infoText = this.add.text(width / 2, 28, "แตะหน้าจอหรือกด Space เพื่อกระโดดข้ามสิ่งกีดขวาง", {
      fontFamily: "Kanit",
      fontSize: "18px",
      color: "#fffbe6",
      backgroundColor: "rgba(51,26,4,0.5)",
      padding: { left: 14, right: 14, top: 6, bottom: 6 },
    }).setOrigin(0.5, 0).setDepth(20).setVisible(false);

    this.rulePanel = this.add.container(width - 210, 170).setDepth(18).setVisible(false);
    const ruleBoard = this.add.rectangle(0, 0, 290, 192, 0x673116, 0.88).setStrokeStyle(5, 0xd8a04f);
    const ruleSign = this.add.image(0, 0, "horse-rule-sign").setDisplaySize(250, 176);
    this.rulePanel.add([ruleBoard, ruleSign]);

    this.boostShell = this.add.rectangle(width / 2, height - 38, 432, 38, 0x5e250f, 0.92)
      .setStrokeStyle(4, 0xd2872d)
      .setDepth(19)
      .setVisible(false);
    this.boostTrack = this.add.rectangle(width / 2 - 36, height - 38, 286, 18, 0x2a1306, 0.9)
      .setDepth(20)
      .setVisible(false);
    this.boostFill = this.add.rectangle(width / 2 - 179, height - 38, 0, 18, 0x2d9cff, 1)
      .setOrigin(0, 0.5)
      .setDepth(21)
      .setVisible(false);
    this.boostLabel = this.add.text(width / 2 + 164, height - 38, "BOOST", {
      fontFamily: "Kanit",
      fontSize: "26px",
      fontStyle: "bold",
      color: "#fff0bf",
      stroke: "#5a2200",
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(22).setVisible(false);
  }

  createStartOverlay() {
    const { width, height } = this.scale;
    this.startOverlay = this.add.container(0, 0).setDepth(40);
    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.58);
    const banner = this.add.image(width / 2, height / 2 - 96, "horse-start-sign").setDisplaySize(700, 468);
    const ruleSign = this.add.image(width / 2 + 4, height / 2 + 118, "horse-rule-sign").setDisplaySize(430, 318);
    const copy = this.add.text(
      width / 2,
      height / 2 + 4,
      "เก็บลูกอม เหรียญ และของขวัญได้ +1 แต่ถ้าชนถังหรือเก็บฟางจะโดน -1 กระโดดให้แม่นเพื่อเก็บของส่งเมืองให้มากที่สุดก่อนหมดเวลา",
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
    const button = this.add.text(width / 2, height / 2 + 256, "เริ่มแข่ง", {
      fontFamily: "Kanit",
      fontSize: "28px",
      color: "#fff7d9",
      backgroundColor: "#b44b12",
      padding: { left: 24, right: 24, top: 10, bottom: 10 },
      stroke: "#632500",
      strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    button.on("pointerdown", () => this.startCountdown());

    this.startOverlay.add([dim, banner, ruleSign, copy, button]);
  }

  createResultOverlay() {
    const { width, height } = this.scale;
    this.resultOverlay = this.add.container(0, 0).setDepth(50).setVisible(false);
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
          deliveries: this.deliveries ?? 0,
          crashes: this.crashes ?? 0,
        },
      });
    });

    this.resultOverlay.add([dim, banner, this.resultScoreText, this.resultHintText, button]);
  }

  startCountdown() {
    if (this.started) return;
    this.started = true;
    this.startOverlay.setVisible(false);
    this.deliveries = 0;
    this.crashes = 0;

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
    const { width, height } = this.scale;

    this.gallopBgm = this.sound.add("horse-gallop", { loop: true, volume: 0.24 });
    this.fairBgm = this.sound.add("horse-fair-bgm", { loop: true, volume: 0.11 });
    if (!this.gallopBgm.isPlaying) this.gallopBgm.play();
    if (!this.fairBgm.isPlaying) this.fairBgm.play();
    this.sound.play("horse-neigh", { volume: 0.35 });

    this.scoreManager.show();
    this.timeFrame.setVisible(true);
    this.timeText.setVisible(true);
    this.infoText.setVisible(true);
    this.rulePanel.setVisible(true);
    this.boostShell.setVisible(true);
    this.boostTrack.setVisible(true);
    this.boostFill.setVisible(true);
    this.boostLabel.setVisible(true);

    this.tweens.add({
      targets: this.infoText,
      alpha: 0.82,
      duration: 1800,
      yoyo: true,
      repeat: 1,
    });

    this.player = new Horse(this, 280, this.groundY - 18);
    this.physics.add.collider(this.player, this.ground);

    this.obstacles = this.physics.add.group({ maxSize: 24 });
    this.items = this.physics.add.group({ maxSize: 24 });

    this.spawnClock = this.time.addEvent({
      delay: 2240,
      loop: true,
      callback: () => this.spawnObstacle(),
    });

    this.itemClock = this.time.addEvent({
      delay: 3260,
      loop: true,
      callback: () => this.spawnItem(),
    });

    this.physics.add.collider(this.player, this.obstacles, this.hitObstacle, null, this);
    this.physics.add.overlap(this.player, this.items, this.collectItem, null, this);

    this.jumpHandler = () => this.player?.jump();
    this.input.on("pointerdown", this.jumpHandler);
    this.keyJump = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyJump?.on("down", this.jumpHandler);

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.ended) return;
        this.timeLeft -= 1;
        this.timeText.setText(`TIME: ${Math.max(0, this.timeLeft)}s`);
        if (this.timeLeft === 25) {
          this.infoText.setText("ช่วงท้ายแล้ว ของจะมาไวขึ้นอีก ระวังจังหวะเก็บกับจังหวะกระโดดให้ดี!");
        }
        if (this.timeLeft <= 0) this.endGame();
      },
    });

    this.cameras.main.setBounds(0, 0, width, height);
  }

  spawnObstacle() {
    if (this.ended) return;
    const obstacle = new Obstacle(this, this.scale.width + 72, this.groundY + 10);
    this.obstacles.add(obstacle);
    obstacle.setVelocityX(-(320 + (GAME_TIME - this.timeLeft) * 2.6));

    if (this.timeLeft <= 24 && !this.midgameRampApplied) {
      this.midgameRampApplied = true;
      this.spawnClock?.reset({
        delay: 1980,
        loop: true,
        callback: () => this.spawnObstacle(),
      });
      this.itemClock?.reset({
        delay: 2860,
        loop: true,
        callback: () => this.spawnItem(),
      });
    }
  }

  spawnItem() {
    if (this.ended) return;
    const item = new Items(
      this,
      this.scale.width + 72,
      this.groundY - Phaser.Math.Between(74, 108),
    );
    this.items.add(item);
    item.setVelocityX(-(270 + (GAME_TIME - this.timeLeft) * 1.9));
  }

  update() {
    if (this.ended || !this.player) return;

    this.player.update();
    const boostRatio = this.player.getBoostRatio();
    this.boostFill.width = 286 * boostRatio;
    this.boostFill.fillColor = boostRatio > 0.7 ? 0x2d9cff : 0xffb323;

    this.obstacles?.children?.each((obs) => {
      if (obs?.active && obs.x < -100) obs.destroy();
    });

    this.items?.children?.each((item) => {
      if (item?.active && item.x < -100) item.destroy();
    });
  }

  hitObstacle(player, obstacle) {
    if (this.ended || obstacle.hitRegistered) return;
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
    } else if (type === "item_candy" || type === "item_coin") {
      this.scoreManager.addScore(1);
      this.flashFeedback("+1", "#ddffd8");
    } else {
      this.scoreManager.addScore(1);
      this.flashFeedback("+1", "#ddffd8");
    }

    this.tweens.add({
      targets: this.player,
      scaleX: this.player.scaleX * 1.04,
      scaleY: this.player.scaleY * 1.04,
      duration: 110,
      yoyo: true,
      ease: "Sine.easeOut",
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
    this.spawnClock?.remove(false);
    this.itemClock?.remove(false);
    this.timerEvent?.remove(false);
    this.countdownEvent?.remove(false);
    this.infoText.setVisible(false);
    this.timeFrame.setVisible(false);
    this.rulePanel.setVisible(false);
    this.boostShell.setVisible(false);
    this.boostTrack.setVisible(false);
    this.boostFill.setVisible(false);
    this.boostLabel.setVisible(false);

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
    this.spawnClock?.remove(false);
    this.itemClock?.remove(false);
    this.timerEvent?.remove(false);
    this.countdownEvent?.remove(false);
    if (this.jumpHandler) {
      this.input.off("pointerdown", this.jumpHandler);
      this.keyJump?.off("down", this.jumpHandler);
    }
  }
}
