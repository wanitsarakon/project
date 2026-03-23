import Phaser from "phaser";

export default class Horse extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey = "horse-1") {
    super(scene, x, y, textureKey);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.baseScale = 0.53;
    this.setScale(this.baseScale);
    this.setOrigin(0.5, 1);
    this.setDepth(6);
    this.setCollideWorldBounds(true);
    this.updateCollisionInsets();

    this.body.setGravityY(780);
    this.refreshHitbox();

    this.jumpCooldownMs = 360;
    this.lastJumpAt = -this.jumpCooldownMs;
    this.lastTapAt = -9999;
    this.doubleTapWindowMs = 320;
    this.doubleJumpUsed = false;
    this.groundTolerance = 6;
  }

  refreshHitbox() {
    if (!this.body) return;
    this.body.setSize(this.displayWidth * 0.46, this.displayHeight * 0.27, true);
    this.body.setOffset(this.displayWidth * 0.28, this.displayHeight * 0.5);
    this.updateCollisionInsets();
  }

  updateCollisionInsets() {
    this.visualCollisionInsets = {
      left: this.displayWidth * 0.24,
      right: this.displayWidth * 0.18,
      top: this.displayHeight * 0.38,
      bottom: this.displayHeight * 0.2,
    };

    this.airborneVisualCollisionInsets = {
      left: this.displayWidth * 0.3,
      right: this.displayWidth * 0.24,
      top: this.displayHeight * 0.54,
      bottom: this.displayHeight * 0.32,
    };
  }

  setHorseTexture(textureKey) {
    this.setTexture(textureKey);
    this.refreshHitbox();
  }

  isGrounded(restY = null) {
    if (!this.body) return false;
    const touchingGround = this.body.blocked.down || this.body.touching.down;
    if (touchingGround) return true;
    if (typeof restY !== "number") return false;
    return this.y >= restY - this.groundTolerance && this.body.velocity.y >= 0;
  }

  jump(restY = null) {
    if (!this.body) return;

    const onGround = this.isGrounded(restY);
    const now = this.scene?.time?.now ?? 0;

    if (onGround && now - this.lastJumpAt >= this.jumpCooldownMs) {
      this.lastJumpAt = now;
      this.lastTapAt = now;
      this.doubleJumpUsed = false;
      this.setVelocityY(-840);
      return;
    }

    if (!onGround && !this.doubleJumpUsed && now - this.lastTapAt <= this.doubleTapWindowMs) {
      this.doubleJumpUsed = true;
      this.lastJumpAt = now;
      this.setVelocityY(-960);
    }

    this.lastTapAt = now;
  }

  getBoostRatio() {
    const now = this.scene?.time?.now ?? 0;
    return Phaser.Math.Clamp((now - this.lastJumpAt) / this.jumpCooldownMs, 0, 1);
  }

  update(restY = null) {
    if (!this.body) return;
    const onGround = this.isGrounded(restY);
    if (onGround) {
      this.doubleJumpUsed = false;
      if (typeof restY === "number" && this.y >= restY - this.groundTolerance) {
        this.setY(restY);
        this.body.setVelocityY(0);
      }
      const phase = Math.sin((this.scene?.time?.now ?? 0) / 240);
      this.rotation = phase * 0.0022;
      this.setScale(this.baseScale);
      return;
    }
    this.setScale(this.baseScale);
    this.rotation = Phaser.Math.Clamp(this.body.velocity.y / 1600, -0.12, 0.22);
  }
}
