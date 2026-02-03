import Phaser from "phaser";

/**
 * Spoon (ช้อน / แหตักปลา)
 * - movement smooth
 * - hitbox ตรงวงตาข่าย
 * - break animation (shake / rotate / fade)
 * - countdown + repair
 */
export default class Spoon extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y) {
    super(scene, x, y, "spoon");

    this.scene = scene;

    /* =====================
       STATE
    ===================== */
    this.isBroken = false;
    this.targetX = x;
    this.targetY = y;

    this.countdownText = null;
    this.countdownTimer = null;
    this.repairTimer = null;

    /* =====================
       ADD TO SCENE
    ===================== */
    scene.add.existing(this);
    scene.physics.add.existing(this);

    /* =====================
       CONFIG
    ===================== */
    this
      .setScale(0.35)
      .setOrigin(0.5, 0.5)
      .setDepth(10);

    // 🎯 hitbox วงตาข่าย (อิงจากภาพจริง)
    this.setCircle(18, -18, -18);

    this.body.setAllowGravity(false);
    this.body.setImmovable(true);

    /* =====================
       CLEANUP
    ===================== */
    scene.events.once("shutdown", this.destroySelf, this);
    scene.events.once("destroy", this.destroySelf, this);
  }

  /* =====================
     MOVE TARGET
  ===================== */
  moveTo(x, y) {
    if (this.isBroken || !this.active) return;

    const { width, height } = this.scene.scale;

    this.targetX = Phaser.Math.Clamp(x, 40, width - 40);
    this.targetY = Phaser.Math.Clamp(y, 40, height - 40);
  }

  /* =====================
     UPDATE (SMOOTH MOVE)
  ===================== */
  update() {
    if (!this.active) return;

    const smooth = 0.22;

    this.x = Phaser.Math.Linear(this.x, this.targetX, smooth);
    this.y = Phaser.Math.Linear(this.y, this.targetY, smooth);

    if (this.countdownText) {
      this.countdownText.setPosition(this.x, this.y - 26);
    }
  }

  /* =====================
     BREAK NET + ANIMATION
  ===================== */
  breakNet(duration = 3000) {
    if (this.isBroken || !this.active) return;

    this.isBroken = true;

    /* 🔒 ปิด physics อย่างปลอดภัย */
    this.body.enable = false;

    /* =====================
       🔥 BREAK ANIMATION
    ===================== */
    this.scene.tweens.add({
      targets: this,
      x: { from: this.x - 6, to: this.x + 6 },
      y: { from: this.y - 6, to: this.y + 6 },
      angle: { from: -12, to: 12 },
      alpha: 0.35,
      duration: 80,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: 6,
    });

    /* =====================
       COUNTDOWN
    ===================== */
    let timeLeft = Math.ceil(duration / 1000);

    this.countdownText = this.scene.add
      .text(this.x, this.y - 26, timeLeft, {
        fontSize: "14px",
        fontStyle: "bold",
        color: "#ff4444",
        stroke: "#000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(999);

    this.countdownTimer = this.scene.time.addEvent({
      delay: 1000,
      repeat: timeLeft - 1,
      callback: () => {
        timeLeft--;
        this.countdownText?.setText(timeLeft);
      },
    });

    this.repairTimer = this.scene.time.delayedCall(
      duration,
      () => this.repairNet()
    );
  }

  /* =====================
     REPAIR NET
  ===================== */
  repairNet() {
    if (!this.isBroken || !this.active) return;

    this.isBroken = false;

    /* 🧹 ล้าง tween เก่า */
    this.scene.tweens.killTweensOf(this);

    /* ✅ เปิด physics กลับ */
    this.body.enable = true;

    this.setAlpha(1);
    this.setAngle(0);

    this.countdownTimer?.remove();
    this.countdownText?.destroy();
    this.repairTimer?.remove();

    this.countdownTimer = null;
    this.countdownText = null;
    this.repairTimer = null;
  }

  /* =====================
     CLEANUP
  ===================== */
  destroySelf() {
    this.scene?.tweens?.killTweensOf(this);

    this.countdownTimer?.remove();
    this.repairTimer?.remove();
    this.countdownText?.destroy();

    this.countdownTimer = null;
    this.repairTimer = null;
    this.countdownText = null;

    if (this.active) {
      super.destroy();
    }
  }
}
