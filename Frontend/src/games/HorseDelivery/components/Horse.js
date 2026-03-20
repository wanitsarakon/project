import Phaser from "phaser";

export default class Horse extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "horse");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.47);
    this.setOrigin(0.5, 1);
    this.setDepth(6);
    this.setCollideWorldBounds(true);

    this.body.setGravityY(1200);
    this.body.setSize(this.displayWidth * 0.62, this.displayHeight * 0.44, true);
    this.body.setOffset(this.displayWidth * 0.18, this.displayHeight * 0.18);

    this.jumpCooldownMs = 360;
    this.lastJumpAt = -this.jumpCooldownMs;
  }

  jump() {
    if (!this.body) return;

    const onGround = this.body.blocked.down || this.body.touching.down;
    const now = this.scene?.time?.now ?? 0;

    if (onGround && now - this.lastJumpAt >= this.jumpCooldownMs) {
      this.lastJumpAt = now;
      this.setVelocityY(-660);
    }
  }

  getBoostRatio() {
    const now = this.scene?.time?.now ?? 0;
    return Phaser.Math.Clamp((now - this.lastJumpAt) / this.jumpCooldownMs, 0, 1);
  }

  update() {
    if (!this.body) return;
    this.rotation = Phaser.Math.Clamp(this.body.velocity.y / 1600, -0.12, 0.22);
  }
}
