import Phaser from "phaser";

function randomPointInEllipse(bounds) {
  const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
  const radius = Math.sqrt(Math.random());
  return {
    x: bounds.cx + Math.cos(angle) * bounds.rx * radius,
    y: bounds.cy + Math.sin(angle) * bounds.ry * radius,
  };
}

function keepInsideEllipse(sprite, bounds) {
  const dx = sprite.x - bounds.cx;
  const dy = sprite.y - bounds.cy;
  const norm = ((dx * dx) / (bounds.rx * bounds.rx)) + ((dy * dy) / (bounds.ry * bounds.ry));
  if (norm <= 1) return;

  const angle = Math.atan2(dy, dx);
  sprite.x = bounds.cx + Math.cos(angle) * (bounds.rx - 6);
  sprite.y = bounds.cy + Math.sin(angle) * (bounds.ry - 6);
}

export default class Fish extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, type) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.type = type;
    this.isCaught = false;
    this.setScale(type === "gold" ? 0.36 : 0.34);
    this.body.setSize(this.width * 0.38, this.height * 0.22);
    this.body.setOffset(this.width * 0.28, this.height * 0.36);
    this.setCollideWorldBounds(false);

    this.baseSpeed = type === "gold"
      ? Phaser.Math.Between(122, 156)
      : Phaser.Math.Between(72, 124);
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
      const point = randomPointInEllipse(bounds);
      this.x = point.x;
      this.y = point.y;
    }

    this.body.velocity.set(0, 0);
  }

  update(bounds) {
    if (this.isCaught || !this.body || !bounds) return;

    this.moveTimer -= 1;
    if (this.moveTimer <= 0) {
      this.moveTimer = Phaser.Math.Between(16, 58);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speedBoost = Math.random() < 0.45 ? Phaser.Math.Between(18, 42) : 0;
      this.scene.physics.velocityFromRotation(
        angle,
        this.baseSpeed + speedBoost,
        this.body.velocity,
      );
    }

    keepInsideEllipse(this, bounds);

    const dx = this.x - bounds.cx;
    const dy = this.y - bounds.cy;
    const norm = ((dx * dx) / (bounds.rx * bounds.rx)) + ((dy * dy) / (bounds.ry * bounds.ry));
    if (norm >= 0.94) {
      this.body.velocity.x *= -1;
      this.body.velocity.y *= -1;
      keepInsideEllipse(this, bounds);
    }

    this.setFlipX(this.body.velocity.x < 0);
  }
}
