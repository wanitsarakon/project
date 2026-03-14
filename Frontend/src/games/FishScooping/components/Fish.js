import Phaser from "phaser";

export default class Fish extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, type) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.type = type;
    this.isCaught = false;
    this.setScale(0.28);
    this.setCollideWorldBounds(false);

    this.baseSpeed = type === "gold" ? 78 : 42;
    this.score = type === "gold" ? 2 : 1;
    if (type === "gold") {
      this.setTint(0xffd66b);
    }

    this.moveTimer = 0;
    this.body.setAllowGravity(false);
    this.releaseBackToWater();
  }

  releaseBackToWater(bounds) {
    this.isCaught = false;
    this.body.enable = true;
    this.moveTimer = 0;
    if (bounds) {
      this.x = Phaser.Math.Clamp(this.x, bounds.x + 20, bounds.right - 20);
      this.y = Phaser.Math.Clamp(this.y, bounds.y + 20, bounds.bottom - 20);
    }
    this.body.velocity.set(0, 0);
  }

  update(bounds) {
    if (this.isCaught || !this.body) return;

    this.moveTimer -= 1;
    if (this.moveTimer <= 0) {
      this.moveTimer = Phaser.Math.Between(40, 120);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      this.scene.physics.velocityFromRotation(angle, this.baseSpeed, this.body.velocity);
    }

    if (bounds) {
      if (this.x <= bounds.x + 20 || this.x >= bounds.right - 20) {
        this.body.velocity.x *= -1;
      }
      if (this.y <= bounds.y + 20 || this.y >= bounds.bottom - 20) {
        this.body.velocity.y *= -1;
      }
      this.x = Phaser.Math.Clamp(this.x, bounds.x + 16, bounds.right - 16);
      this.y = Phaser.Math.Clamp(this.y, bounds.y + 16, bounds.bottom - 16);
    }
  }
}
