import Phaser from "phaser";

export default class Horse extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "horse-run", 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.baseScale = 0.82;
    this.setScale(this.baseScale);
    this.setOrigin(0.5, 1);
    this.setDepth(6);
    this.setCollideWorldBounds(true);

    this.body.setGravityY(780);

    this.jumpCooldownMs = 360;
    this.lastJumpAt = -this.jumpCooldownMs;
    this.lastTapAt = -9999;
    this.doubleTapWindowMs = 320;
    this.doubleJumpUsed = false;
    this.groundTolerance = 6;
    this.hitUntil = 0;

    this.refreshHitbox();
    this.playRun();
  }

  refreshHitbox() {
    if (!this.body) return;
    this.body.setSize(this.displayWidth * 0.34, this.displayHeight * 0.2, true);
    this.body.setOffset(this.displayWidth * 0.34, this.displayHeight * 0.69);
    this.updateCollisionInsets();
  }

  updateCollisionInsets() {
    this.visualCollisionInsets = {
      left: this.displayWidth * 0.26,
      right: this.displayWidth * 0.2,
      top: this.displayHeight * 0.34,
      bottom: this.displayHeight * 0.18,
    };

    this.airborneVisualCollisionInsets = {
      left: this.displayWidth * 0.28,
      right: this.displayWidth * 0.22,
      top: this.displayHeight * 0.46,
      bottom: this.displayHeight * 0.24,
    };
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
      this.playJump();
      return;
    }

    if (!onGround && !this.doubleJumpUsed && now - this.lastTapAt <= this.doubleTapWindowMs) {
      this.doubleJumpUsed = true;
      this.lastJumpAt = now;
      this.setVelocityY(-960);
      this.playJump();
    }

    this.lastTapAt = now;
  }

  triggerHit(durationMs = 460) {
    this.hitUntil = (this.scene?.time?.now ?? 0) + durationMs;
    this.playHit();
  }

  playRun() {
    if (this.anims.currentAnim?.key === "horse-run-loop") return;
    this.play("horse-run-loop", true);
    this.refreshHitbox();
  }

  playJump() {
    this.play("horse-jump-once", true);
    this.refreshHitbox();
  }

  playHit() {
    this.play("horse-hit-once", true);
    this.refreshHitbox();
  }

  update(restY = null) {
    if (!this.body) return;

    const now = this.scene?.time?.now ?? 0;
    const onGround = this.isGrounded(restY);
    const isHit = now < this.hitUntil;

    if (onGround) {
      this.doubleJumpUsed = false;
      if (typeof restY === "number" && this.y >= restY - this.groundTolerance) {
        this.setY(restY);
        this.body.setVelocityY(0);
      }

      if (!isHit) {
        this.playRun();
      }

      const phase = Math.sin(now / 240);
      this.rotation = phase * (isHit ? 0.01 : 0.0022);
      this.setScale(this.baseScale);
      return;
    }

    if (!isHit) {
      this.playJump();
    }

    this.setScale(this.baseScale);
    this.rotation = Phaser.Math.Clamp(this.body.velocity.y / 1600, -0.12, 0.22);
  }
}
