import Phaser from "phaser";

function randomPointInEllipse(bounds) {
  const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
  const radius = Phaser.Math.FloatBetween(0.45, 0.98);
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
  sprite.x = bounds.cx + Math.cos(angle) * (bounds.rx - 10);
  sprite.y = bounds.cy + Math.sin(angle) * (bounds.ry - 10);
}

export default class Fish extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, type) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.type = type;
    this.isCaught = false;
    this.setScale(type === "gold" ? 0.33 : 0.29);
    this.setDepth(2);
    this.body.setSize(this.width * 0.3, this.height * 0.2);
    this.body.setOffset(this.width * 0.35, this.height * 0.4);
    this.setCollideWorldBounds(false);

    this.baseSpeed = type === "gold"
      ? Phaser.Math.Between(260, 330)
      : Phaser.Math.Between(150, 210);
    this.score = type === "gold" ? 3 : 1;
    this.moveTimer = 0;
    this.turnEase = type === "gold" ? 0.22 : 0.15;
    this.targetVelocity = new Phaser.Math.Vector2(0, 0);
    this.swimPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.swimBobSpeed = Phaser.Math.FloatBetween(0.03, 0.055);
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
    this.targetVelocity.set(0, 0);
  }

  update(bounds, threat = null) {
    if (this.isCaught || !this.body || !bounds) return;

    if (threat) {
      const distanceFromThreat = Phaser.Math.Distance.Between(this.x, this.y, threat.x, threat.y);
      const fleeRadius = this.type === "gold" ? 180 : 150;
      if (distanceFromThreat < fleeRadius) {
        const fleeAngle = Phaser.Math.Angle.Between(threat.x, threat.y, this.x, this.y);
        const fleeBoost = this.type === "gold" ? 150 : 110;
        this.targetVelocity.setToPolar(fleeAngle, this.baseSpeed + fleeBoost);
        this.moveTimer = Math.max(this.moveTimer, this.type === "gold" ? 16 : 20);
      }
    }

    this.moveTimer -= 1;
    if (this.moveTimer <= 0) {
      this.moveTimer = this.type === "gold"
        ? Phaser.Math.Between(20, 42)
        : Phaser.Math.Between(30, 58);
      const centerPull = Phaser.Math.Angle.Between(this.x, this.y, bounds.cx, bounds.cy);
      const tangent = centerPull + (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
      const dx = this.x - bounds.cx;
      const dy = this.y - bounds.cy;
      const norm = ((dx * dx) / (bounds.rx * bounds.rx)) + ((dy * dy) / (bounds.ry * bounds.ry));
      const angle = norm < 0.38
        ? tangent + Phaser.Math.FloatBetween(-0.35, 0.35)
        : Phaser.Math.Interpolation.Linear(
            [tangent, centerPull + Phaser.Math.FloatBetween(-0.75, 0.75)],
            Phaser.Math.FloatBetween(0.18, 0.42),
          );
      const speedBoost = Math.random() < 0.45
        ? Phaser.Math.Between(this.type === "gold" ? 48 : 28, this.type === "gold" ? 96 : 58)
        : 0;
      this.targetVelocity.setToPolar(angle, this.baseSpeed + speedBoost);
    }

    const dx = this.x - bounds.cx;
    const dy = this.y - bounds.cy;
    const norm = ((dx * dx) / (bounds.rx * bounds.rx)) + ((dy * dy) / (bounds.ry * bounds.ry));
    if (norm >= 0.92) {
      const turnHome = Phaser.Math.Angle.Between(this.x, this.y, bounds.cx, bounds.cy);
      this.targetVelocity.setToPolar(turnHome, this.baseSpeed + 56);
    }

    this.body.velocity.x = Phaser.Math.Linear(this.body.velocity.x, this.targetVelocity.x, this.turnEase);
    this.body.velocity.y = Phaser.Math.Linear(this.body.velocity.y, this.targetVelocity.y, this.turnEase);

    keepInsideEllipse(this, bounds);

    this.swimPhase += this.swimBobSpeed;
    this.y += Math.sin(this.swimPhase) * 0.28;
    this.rotation = Phaser.Math.Clamp(this.body.velocity.y / 1200, -0.18, 0.18);
    this.setFlipX(this.body.velocity.x < 0);
  }
}
