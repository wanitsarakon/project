import Phaser from "phaser";
import BlessingBox from "./components/BlessingBox";

export default class WorshipBoothScene extends Phaser.Scene {
  constructor() {
    super({ key: "WorshipBoothScene" });
  }

  preload() {
    this.load.image("bg", "/assets/bg.png");
    this.load.image("buddha", "/assets/buddha.png");
    this.load.image("incense", "/assets/incense.png");
    this.load.image("candle", "/assets/candle.png");
    this.load.image("lotus", "/assets/lotus.png");
    this.load.image("smoke", "/assets/smoke.png");
  }

  create() {
    const { width, height } = this.scale;

    this.add.image(width / 2, height / 2, "bg");

    this.add.image(width / 2, height / 2 - 40, "buddha").setScale(0.6);

    /* ===== OFFERINGS ===== */
    this.incense = this.add.image(width / 2 - 120, height / 2 + 80, "incense")
      .setScale(0.3)
      .setInteractive();

    this.candle = this.add.image(width / 2, height / 2 + 90, "candle")
      .setScale(0.3)
      .setInteractive();

    this.lotus = this.add.image(width / 2 + 120, height / 2 + 90, "lotus")
      .setScale(0.35)
      .setInteractive();

    this.incense.on("pointerdown", () => this.lightIncense());
    this.candle.on("pointerdown", () => this.lightCandle());
    this.lotus.on("pointerdown", () => this.offerLotus());

    /* ===== PRAY BUTTON ===== */
    this.prayBtn = this.add.text(
      width / 2,
      height - 60,
      "🙏 ขอพร",
      {
        fontSize: "26px",
        color: "#fff",
        backgroundColor: "#8b4513",
        padding: { x: 20, y: 10 },
      }
    )
      .setOrigin(0.5)
      .setInteractive();

    this.prayBtn.on("pointerdown", () => {
      new BlessingBox(this, width / 2, height / 2);
    });
  }

  lightIncense() {
    this.add.image(this.incense.x, this.incense.y - 40, "smoke")
      .setScale(0.2)
      .setAlpha(0.8);
  }

  lightCandle() {
    this.candle.setTint(0xffd700);
  }

  offerLotus() {
    this.lotus.y -= 30;
    this.lotus.setScale(0.4);
  }

  finishBooth() {
    // กลับไปหน้า Lobby / End
    this.scene.stop();
  }
}
