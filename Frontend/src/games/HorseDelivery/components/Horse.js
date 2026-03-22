import Phaser from "phaser";

export default class Horse extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey = "horse-1") {
    super(scene, x, y, textureKey);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.baseScale = 0.8;
    this.setScale(this.baseScale);
    this.setOrigin(0.5, 1);
    this.setDepth(6);
    this.setCollideWorldBounds(true);

    this.body.setGravityY(1200);
    this.refreshHitbox();

    this.jumpCooldownMs = 360;
    this.lastJumpAt = -this.jumpCooldownMs;
    this.lastTapAt = -9999;
    this.doubleTapWindowMs = 320;
    this.doubleJumpUsed = false;
  }

  refreshHitbox() {
    if (!this.body) return;
    this.body.setSize(this.displayWidth * 0.42, this.displayHeight * 0.3, true);
    this.body.setOffset(this.displayWidth * 0.29, this.displayHeight * 0.48);
  }

  setHorseTexture(textureKey) {
    this.setTexture(textureKey);
    this.refreshHitbox();
  }

  jump() {
    if (!this.body) return;

    const onGround = this.body.blocked.down || this.body.touching.down;
    const now = this.scene?.time?.now ?? 0;

    if (onGround && now - this.lastJumpAt >= this.jumpCooldownMs) {
      this.lastJumpAt = now;
      this.lastTapAt = now;
      this.doubleJumpUsed = false;
      this.setVelocityY(-760);
      return;
    }

    if (!onGround && !this.doubleJumpUsed && now - this.lastTapAt <= this.doubleTapWindowMs) {
      this.doubleJumpUsed = true;
      this.lastJumpAt = now;
      this.setVelocityY(-980);
    }

    this.lastTapAt = now;
  }

  getBoostRatio() {
    const now = this.scene?.time?.now ?? 0;
    return Phaser.Math.Clamp((now - this.lastJumpAt) / this.jumpCooldownMs, 0, 1);
  }

  update() {
    if (!this.body) return;
    if (this.body.blocked.down || this.body.touching.down) {
      this.doubleJumpUsed = false;
    }
    this.rotation = Phaser.Math.Clamp(this.body.velocity.y / 1600, -0.12, 0.22);
  }
}
