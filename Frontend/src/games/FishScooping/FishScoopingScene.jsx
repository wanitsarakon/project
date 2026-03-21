import Phaser from "phaser";
import Spoon from "./components/Spoon";
import Fish from "./components/Fish";

const BG_IMAGE = new URL("./assetsFish/BGfish.jpg", import.meta.url).href;
const SPOON_IMAGE = new URL("./assetsFish/Spoon.png", import.meta.url).href;
const BUCKET_IMAGE = new URL("./assetsFish/WaterBowl.png", import.meta.url).href;
const START_IMAGE = new URL("./assetsFish/fish_start.png", import.meta.url).href;
const RESULT_IMAGE = new URL("./assetsFish/fish_score.png", import.meta.url).href;
const FISH_IMAGES = {
  fish1: new URL("./assetsFish/1.png", import.meta.url).href,
  fish2: new URL("./assetsFish/2.png", import.meta.url).href,
  fish3: new URL("./assetsFish/3.png", import.meta.url).href,
  fish4: new URL("./assetsFish/4.png", import.meta.url).href,
  fish5: new URL("./assetsFish/5.png", import.meta.url).href,
};

const COUNTDOWN_SOUND = new URL("./sounds/countdown.mp3", import.meta.url).href;
const START_SOUND = new URL("./sounds/start.mp3", import.meta.url).href;
const SCOOP_SOUND = new URL("./sounds/scoop.wav", import.meta.url).href;
const FAIR_AMBIENCE = new URL("./sounds/fair_ambience.wav", import.meta.url).href;
const HUD_SIGN_IMAGE = "/assets/เเผ่นป้ายเวลากับคะเเนน.png";
const GAME_TIME = 60;
const MAX_FISH = 10;
const HOLD_LIMIT_MS = 1000;

export default class FishScoopingScene extends Phaser.Scene {
  constructor() {
    super("FishScoopingScene");
    this.spawnTimer = null;
    this.gameTimer = null;
    this.countdownTimer = null;
    this.hud = {};
    this.escapeTimer = null;
    this.toastTween = null;
  }

  init(data = {}) {
    this.roomCode = data.roomCode ?? null;
    this.player = data.player ?? null;
    this.roundId = data.roundId ?? null;
    this.onGameEnd = data.onGameEnd ?? null;
    this.phase = "intro";
    this.score = 0;
    this.timeLeft = GAME_TIME;
    this.goldCaught = 0;
    this.normalCaught = 0;
    this.ended = false;
  }

  preload() {
    this.load.image("bg", BG_IMAGE);
    this.load.image("spoon", SPOON_IMAGE);
    this.load.image("bucket", BUCKET_IMAGE);
    this.load.image("fish-start", START_IMAGE);
    this.load.image("fish-result", RESULT_IMAGE);
    this.load.image("fish1", FISH_IMAGES.fish1);
    this.load.image("fish2", FISH_IMAGES.fish2);
    this.load.image("fish3", FISH_IMAGES.fish3);
    this.load.image("fish4", FISH_IMAGES.fish4);
    this.load.image("fish5", FISH_IMAGES.fish5);
    this.load.audio("fish-count", COUNTDOWN_SOUND);
    this.load.audio("fish-start-sfx", START_SOUND);
    this.load.audio("fish-scoop", SCOOP_SOUND);
    this.load.audio("fish-fair-bgm", FAIR_AMBIENCE);
    this.load.image("fish-hud-sign", HUD_SIGN_IMAGE);
  }

  create() {
    const { width, height } = this.scale;

    this.add.image(width / 2, height / 2, "bg").setDisplaySize(width, height);

    this.waterZone = {
      cx: width * 0.546,
      cy: height * 0.692,
      rx: width * 0.254,
      ry: height * 0.188,
    };

    this.bucket = this.physics.add.image(width * 0.108, height * 0.86, "bucket")
      .setScale(Math.min(width / 800, height / 600) * 0.52)
      .setImmovable(true)
      .setDepth(3);
    this.bucket.body.allowGravity = false;

    this.spoon = new Spoon(this, width / 2, height / 2);
    this.spoon.setDepth(5);

    this.fishes = this.physics.add.group();
    this.spawnInitialFish();
    this.createHud();
    this.createStartOverlay();
    this.createResultOverlay();

    this.input.on("pointerdown", () => {
      if (this.phase !== "playing" || this.spoon?.holdingFish) return;
      this.tryCatchFish();
    });

    this.events.once("shutdown", () => this.cleanup());
    this.events.once("destroy", () => this.cleanup());
  }

  createHud() {
    const { width } = this.scale;

    const createPanel = (x, y, label, valueColor) => {
      const bg = this.add.image(x, y, "fish-hud-sign")
        .setDisplaySize(222, 84)
        .setScrollFactor(0)
        .setDepth(10);
      const labelText = this.add.text(x, y - 12, label, {
        fontFamily: "Kanit",
        fontSize: "17px",
        color: "#ffe8b0",
      }).setOrigin(0.5).setDepth(11);
      const valueText = this.add.text(x, y + 10, "0", {
        fontFamily: "Kanit",
        fontSize: "26px",
        fontStyle: "bold",
        color: valueColor,
        stroke: "#2b1703",
        strokeThickness: 4,
      }).setOrigin(0.5).setDepth(11);
      return { bg, labelText, valueText };
    };

    this.hud.score = createPanel(width * 0.15, 58, "คะแนน", "#fff7cc");
    this.hud.timer = createPanel(width * 0.85, 58, "เวลา", "#ffd86a");
    this.hud.note = this.add.text(width / 2, 92, "ลากช้อนให้ถึงตัวปลาแล้วคลิกตัก รีบเอาไปลงถังภายใน 1 วินาที", {
      fontFamily: "Kanit",
      fontSize: "18px",
      color: "#fffaf0",
      backgroundColor: "rgba(63,38,12,0.55)",
      padding: { left: 14, right: 14, top: 6, bottom: 6 },
    }).setOrigin(0.5).setDepth(10);

    this.updateHud();
  }

  createStartOverlay() {
    const { width, height } = this.scale;
    this.startOverlay = this.add.container(0, 0).setDepth(30);
    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.55);
    const panel = this.add.image(width / 2, height / 2, "fish-start").setDisplaySize(700, 467);
    const copy = this.add.text(width / 2, height / 2 + 72, "คลิกเมื่อตาข่ายครอบตัวปลา แล้วรีบวิ่งมาปล่อยลงถัง ถ้าช้าเกิน 1 วินาทีปลาจะหลุด", {
      fontFamily: "Kanit",
      fontSize: "20px",
      align: "center",
      color: "#fff7e0",
      stroke: "#4a2100",
      strokeThickness: 5,
      wordWrap: { width: 480 },
    }).setOrigin(0.5);
    const btn = this.add.text(width / 2, height / 2 + 152, "เริ่มเกม", {
      fontFamily: "Kanit",
      fontSize: "28px",
      color: "#fff8dd",
      backgroundColor: "#bb4f11",
      padding: { left: 26, right: 26, top: 10, bottom: 10 },
      stroke: "#5e2200",
      strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on("pointerdown", () => this.startCountdown());
    this.startOverlay.add([dim, panel, copy, btn]);
  }

  createResultOverlay() {
    const { width, height } = this.scale;
    this.resultOverlay = this.add.container(0, 0).setDepth(40).setVisible(false);
    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.68);
    const panel = this.add.image(width / 2, height / 2, "fish-result").setDisplaySize(700, 467);
    this.resultScoreText = this.add.text(width / 2, height / 2 + 10, "0", {
      fontFamily: "Kanit",
      fontSize: "60px",
      fontStyle: "bold",
      color: "#7c1e00",
      stroke: "#fff1bb",
      strokeThickness: 6,
    }).setOrigin(0.5);
    this.resultMetaText = this.add.text(width / 2, height / 2 + 92, "", {
      fontFamily: "Kanit",
      fontSize: "20px",
      color: "#6b2500",
      align: "center",
    }).setOrigin(0.5);
    const btn = this.add.text(width / 2, height / 2 + 168, "กลับแผนที่", {
      fontFamily: "Kanit",
      fontSize: "26px",
      color: "#fff8dd",
      backgroundColor: "#914013",
      padding: { left: 24, right: 24, top: 10, bottom: 10 },
      stroke: "#522000",
      strokeThickness: 4,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on("pointerdown", () => {
      this.onGameEnd?.({
        score: this.score,
        roundId: this.roundId,
        meta: {
          normalCaught: this.normalCaught,
          goldCaught: this.goldCaught,
          timeLeft: this.timeLeft,
        },
      });
    });

    this.resultOverlay.add([dim, panel, this.resultScoreText, this.resultMetaText, btn]);
  }

  spawnInitialFish() {
    const fishTextures = ["fish1", "fish2", "fish3", "fish4", "fish5"];

    for (let i = 0; i < 8; i += 1) {
      const isGold = i >= 6;
      const point = this.randomPointInWater();
      const fish = new Fish(
        this,
        point.x,
        point.y,
        Phaser.Utils.Array.GetRandom(fishTextures),
        isGold ? "gold" : "normal",
      );
      this.fishes.add(fish);
    }
  }

  randomPointInWater() {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const radius = Math.sqrt(Math.random());
    return {
      x: this.waterZone.cx + Math.cos(angle) * this.waterZone.rx * radius,
      y: this.waterZone.cy + Math.sin(angle) * this.waterZone.ry * radius,
    };
  }

  startCountdown() {
    if (this.phase !== "intro") return;
    this.phase = "countdown";
    this.startOverlay.setVisible(false);

    this.countdownText = this.add.text(this.scale.width / 2, this.scale.height / 2, "3", {
      fontFamily: "Kanit",
      fontSize: "130px",
      fontStyle: "bold",
      color: "#fff4c7",
      stroke: "#5f2600",
      strokeThickness: 8,
    }).setOrigin(0.5).setDepth(35);

    let count = 3;
    this.sound.play("fish-count", { volume: 0.45 });
    this.countdownTimer = this.time.addEvent({
      delay: 1000,
      repeat: 3,
      callback: () => {
        count -= 1;
        if (count > 0) {
          this.countdownText.setText(String(count));
          this.sound.play("fish-count", { volume: 0.45 });
        } else if (count === 0) {
          this.countdownText.setText("เริ่ม!");
          this.sound.play("fish-start-sfx", { volume: 0.55 });
        } else {
          this.countdownText.destroy();
          this.startPlaying();
        }
      },
    });
  }

  startPlaying() {
    this.phase = "playing";
    this.fairBgm = this.sound.add("fish-fair-bgm", {
      loop: true,
      volume: 0.16,
    });
    if (!this.fairBgm.isPlaying) {
      this.fairBgm.play();
    }

    this.spawnTimer = this.time.addEvent({
      delay: 2200,
      loop: true,
      callback: () => {
        if (this.phase !== "playing") return;
        if (this.fishes.countActive(true) >= MAX_FISH) return;
        const fishTextures = ["fish1", "fish2", "fish3", "fish4", "fish5"];
        const point = this.randomPointInWater();
        const fish = new Fish(
          this,
          point.x,
          point.y,
          Phaser.Utils.Array.GetRandom(fishTextures),
          Math.random() < 0.28 ? "gold" : "normal",
        );
        this.fishes.add(fish);
      },
    });

    this.gameTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.timeLeft -= 1;
        this.updateHud();
        if (this.timeLeft <= 0) {
          this.endGame();
        }
      },
    });
  }

  tryCatchFish() {
    let nearestFish = null;
    let nearestDistance = 9999;

    this.fishes.children.each((fish) => {
      if (!fish?.active || fish.isCaught) return;
      const distance = Phaser.Math.Distance.Between(this.spoon.x, this.spoon.y, fish.x, fish.y);
      if (distance < 56 && distance < nearestDistance) {
        nearestFish = fish;
        nearestDistance = distance;
      }
    });

    if (!nearestFish) {
      this.showToast("ต้องเอาช้อนให้ถึงตัวปลาก่อนค่อยคลิกตัก", "#ffd2a0");
      return;
    }

    this.catchFish(nearestFish);
  }

  catchFish(fish) {
    if (this.phase !== "playing") return;
    if (this.spoon.holdingFish || fish.isCaught) return;

    this.spoon.catchFish(fish);
    fish.setDepth(6);
    this.sound.play("fish-scoop", { volume: 0.5 });

    this.escapeTimer?.remove(false);
    this.escapeTimer = this.time.delayedCall(HOLD_LIMIT_MS, () => {
      if (this.spoon.holdingFish !== fish || this.phase !== "playing") return;
      this.spoon.releaseFish();
      fish.releaseBackToWater(this.waterZone);
      this.cameras.main.shake(120, 0.0022);
      this.showToast("ช้าเกินไป ปลาหลุดแล้ว!", "#ffd2a0");
    });
  }

  update() {
    const pointer = this.input.activePointer;
    this.spoon?.update(pointer, this.phase === "playing");

    if (this.phase === "playing") {
      this.fishes.children.each((fish) => {
        if (!fish?.active) return;
        fish.update(this.waterZone);
      });

      if (this.spoon?.holdingFish) {
        const fish = this.spoon.holdingFish;
        const dist = Phaser.Math.Distance.Between(
          fish.x,
          fish.y,
          this.bucket.x,
          this.bucket.y,
        );

        if (dist < 116) {
          this.registerCatch(fish);
        }
      }
    }
  }

  registerCatch(fish) {
    const points = fish.score;
    this.score += points;
    if (fish.type === "gold") this.goldCaught += 1;
    else this.normalCaught += 1;

    this.escapeTimer?.remove(false);
    this.escapeTimer = null;
    this.updateHud();
    this.showToast(points > 1 ? "+2 ปลาทอง!" : "+1 ได้ปลาแล้ว", points > 1 ? "#ffd95e" : "#d4ffd3");

    fish.destroy();
    this.spoon.releaseFish();
    this.cameras.main.flash(90, 255, 247, 210, false);
    this.tweens.add({
      targets: this.bucket,
      scaleX: this.bucket.scaleX * 1.08,
      scaleY: this.bucket.scaleY * 1.08,
      duration: 120,
      yoyo: true,
      ease: "Sine.easeOut",
    });

    const burst = this.add.circle(this.bucket.x, this.bucket.y - 30, 16, 0xffef9c, 0.9).setDepth(7);
    this.tweens.add({
      targets: burst,
      scale: 3,
      alpha: 0,
      duration: 320,
      onComplete: () => burst.destroy(),
    });
  }

  updateHud() {
    this.hud.score.valueText.setText(String(this.score));
    this.hud.timer.valueText.setText(String(Math.max(0, this.timeLeft)));
  }

  showToast(message, color) {
    const toast = this.add.text(this.scale.width / 2, 136, message, {
      fontFamily: "Kanit",
      fontSize: "24px",
      color: "#381600",
      backgroundColor: color,
      padding: { left: 14, right: 14, top: 8, bottom: 8 },
    }).setOrigin(0.5).setDepth(20).setAlpha(0);

    this.toastTween?.stop();
    this.toastTween = this.tweens.add({
      targets: toast,
      alpha: 1,
      y: 112,
      duration: 700,
      ease: "Cubic.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: toast,
          alpha: 0,
          y: 100,
          duration: 220,
          onComplete: () => toast.destroy(),
        });
      },
    });
  }

  endGame() {
    if (this.ended) return;
    this.ended = true;
    this.phase = "ended";
    this.fairBgm?.stop();
    this.spawnTimer?.remove(false);
    this.gameTimer?.remove(false);
    this.countdownTimer?.remove(false);
    this.escapeTimer?.remove(false);
    this.physics.pause();

    this.resultScoreText.setText(String(this.score));
    this.resultMetaText.setText(
      `ปลาปกติ ${this.normalCaught} ตัว  •  ปลาทอง ${this.goldCaught} ตัว  •  เวลาที่เหลือ ${Math.max(0, this.timeLeft)} วินาที`,
    );
    this.resultOverlay.setVisible(true);
  }

  cleanup() {
    this.fairBgm?.stop();
    this.fairBgm?.destroy();
    this.fairBgm = null;
    this.spawnTimer?.remove(false);
    this.gameTimer?.remove(false);
    this.countdownTimer?.remove(false);
    this.escapeTimer?.remove(false);
  }
}
