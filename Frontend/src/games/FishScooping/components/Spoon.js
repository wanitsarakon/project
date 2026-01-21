import Phaser from "phaser";

/**
 * Spoon (ช้อน / แหตักปลา)
 * - ควบคุมด้วยเมาส์
 * - รองรับสถานะแหขาด
 */
export default class Spoon extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y) {
    super(scene, x, y, "spoon");

    this.scene = scene;
    this.isBroken = false;

    // add เข้า scene + physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    /* ===== CONFIG ===== */
    this.setScale(0.4);
    this.setOrigin(0.5);
    this.setCircle(32);          // hit area
    this.body.setAllowGravity(false);

    /* ===== INPUT ===== */
    scene.input.on("pointermove", this.handleMove, this);

    /* ===== CLEANUP ===== */
    scene.events.once("shutdown", this.destroySelf, this);
    scene.events.once("destroy", this.destroySelf, this);
  }

  /* =====================
     MOVE WITH MOUSE
  ===================== */
  handleMove(pointer) {
    if (this.isBroken) return;

    this.setPosition(pointer.x, pointer.y);
  }

  /* =====================
     BREAK NET
  ===================== */
  breakNet(duration = 3000) {
    if (this.isBroken) return;

    this.isBroken = true;
    this.body.enable = false;

    // visual feedback
    this.setAlpha(0.4);
    this.scene.netStatusText?.setText("❌ แหขาด! รอ 3 วินาที");

    this.scene.time.delayedCall(duration, () => {
      this.repairNet();
    });
  }

  /* =====================
     REPAIR NET
  ===================== */
  repairNet() {
    this.isBroken = false;
    this.body.enable = true;

    this.setAlpha(1);
    this.scene.netStatusText?.setText("");
  }

  /* =====================
     DESTROY
  ===================== */
  destroySelf() {
    if (this.scene?.input) {
      this.scene.input.off(
        "pointermove",
        this.handleMove,
        this
      );
    }
    this.destroy();
  }
}
