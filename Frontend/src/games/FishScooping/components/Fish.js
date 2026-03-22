import Phaser from "phaser";

const FISH_TRAITS = {
  red: {
    scale: 0.29,
    score: 1,
    cruiseSpeed: [122, 158],
    fleeBoost: [138, 182],
    fleeRadius: 148,
    steerEase: 0.075,
    routeMs: [1120, 1880],
    swimBobSpeed: [0.0048, 0.0062],
  },
  silver: {
    scale: 0.3,
    score: 2,
    cruiseSpeed: [144, 184],
    fleeBoost: [168, 220],
    fleeRadius: 166,
    steerEase: 0.09,
    routeMs: [960, 1620],
    swimBobSpeed: [0.0054, 0.0069],
  },
  gold: {
    scale: 0.33,
    score: 3,
    cruiseSpeed: [168, 212],
    fleeBoost: [198, 255],
    fleeRadius: 184,
    steerEase: 0.108,
    routeMs: [820, 1420],
    swimBobSpeed: [0.0058, 0.0075],
  },
};

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
  sprite.x = bounds.cx + Math.cos(angle) * (bounds.rx - 10);
  sprite.y = bounds.cy + Math.sin(angle) * (bounds.ry - 10);
}

export default class Fish extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture, type) {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.type = type;
    this.traits = FISH_TRAITS[type] ?? FISH_TRAITS.red;
    this.score = this.traits.score;
    this.isCaught = false;

    this.setScale(this.traits.scale);
    this.setDepth(2);
    this.setCollideWorldBounds(false);
    this.body.setAllowGravity(false);
    this.body.setSize(this.width * 0.3, this.height * 0.2);
    this.body.setOffset(this.width * 0.35, this.height * 0.4);

    this.baseSpeed = Phaser.Math.Between(...this.traits.cruiseSpeed);
    this.cruiseSpeed = this.baseSpeed;
    this.fleeBoost = Phaser.Math.Between(...this.traits.fleeBoost);
    this.fleeRadius = this.traits.fleeRadius;
    this.targetVelocity = new Phaser.Math.Vector2(0, 0);
    this.routeTarget = new Phaser.Math.Vector2(x, y);
    this.routeTimer = 0;
    this.fleeTimer = 0;
    this.orbitDirection = Math.random() < 0.5 ? -1 : 1;
    this.motionClock = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.swimBobSpeed = Phaser.Math.FloatBetween(...this.traits.swimBobSpeed);

    this.releaseBackToWater();
  }

  getNormalizedRadius(bounds) {
    const dx = this.x - bounds.cx;
    const dy = this.y - bounds.cy;
    return Phaser.Math.Clamp(
      ((dx * dx) / (bounds.rx * bounds.rx)) + ((dy * dy) / (bounds.ry * bounds.ry)),
      0,
      1.25,
    );
  }

  chooseCruiseRoute(bounds, shortened = false) {
    if (Math.random() < 0.42) {
      const point = randomPointInEllipse(bounds);
      const topBias = Math.random() < 0.58 ? Phaser.Math.FloatBetween(0.12, 0.3) : 0;
      this.routeTarget.set(
        point.x,
        Phaser.Math.Linear(point.y, bounds.cy - (bounds.ry * 0.78), topBias),
      );
    } else {
      const currentAngle = Phaser.Math.Angle.Between(bounds.cx, bounds.cy, this.x, this.y);
      const advance = Phaser.Math.FloatBetween(0.42, 1.08) * this.orbitDirection;
      const radial = Phaser.Math.FloatBetween(0.16, 0.98);
      const angle = currentAngle + advance + Phaser.Math.FloatBetween(-0.24, 0.24);

      if (Math.random() < 0.18) {
        this.orbitDirection *= -1;
      }

      this.routeTarget.set(
        bounds.cx + Math.cos(angle) * bounds.rx * radial,
        bounds.cy + Math.sin(angle) * bounds.ry * radial,
      );
    }

    this.cruiseSpeed = this.baseSpeed * Phaser.Math.FloatBetween(0.9, 1.18);

    const routeMs = Phaser.Math.Between(...this.traits.routeMs);
    this.routeTimer = shortened ? routeMs * Phaser.Math.FloatBetween(0.45, 0.75) : routeMs;
  }

  releaseBackToWater(bounds) {
    this.isCaught = false;
    this.body.enable = true;
    this.routeTimer = 0;
    this.fleeTimer = 0;

    if (bounds) {
      const point = randomPointInEllipse(bounds);
      this.x = point.x;
      this.y = point.y;
      this.chooseCruiseRoute(bounds, true);
    }

    this.body.velocity.set(0, 0);
    this.targetVelocity.set(0, 0);
  }

  setCruiseVelocity(bounds) {
    const toTargetX = this.routeTarget.x - this.x;
    const toTargetY = this.routeTarget.y - this.y;
    const distanceToTarget = Math.hypot(toTargetX, toTargetY);

    if (distanceToTarget < 26) {
      this.chooseCruiseRoute(bounds);
    }

    const norm = this.getNormalizedRadius(bounds);
    const tangentAngle = Phaser.Math.Angle.Between(bounds.cx, bounds.cy, this.x, this.y)
      + (this.orbitDirection * Math.PI) / 2;
    const tangentWeight = Phaser.Math.Linear(0.18, 0.38, Phaser.Math.Clamp(norm, 0, 1));
    const tangentX = Math.cos(tangentAngle) * this.cruiseSpeed * tangentWeight;
    const tangentY = Math.sin(tangentAngle) * this.cruiseSpeed * tangentWeight;

    const seekLength = Math.max(1, Math.hypot(toTargetX, toTargetY));
    const desiredX = (toTargetX / seekLength) * this.cruiseSpeed + tangentX;
    const desiredY = (toTargetY / seekLength) * this.cruiseSpeed + tangentY;
    const desiredLength = Math.max(1, Math.hypot(desiredX, desiredY));

    this.targetVelocity.set(
      (desiredX / desiredLength) * this.cruiseSpeed,
      (desiredY / desiredLength) * this.cruiseSpeed,
    );
  }

  fleeFromThreat(bounds, threat, distanceFromThreat) {
    const proximity = Phaser.Math.Clamp(1 - (distanceFromThreat / this.fleeRadius), 0, 1);
    const fleeAngle = Phaser.Math.Angle.Between(threat.x, threat.y, this.x, this.y);
    const homeAngle = Phaser.Math.Angle.Between(this.x, this.y, bounds.cx, bounds.cy);
    const edgePressure = Phaser.Math.Clamp((this.getNormalizedRadius(bounds) - 0.72) / 0.28, 0, 1);
    const wobble = Math.sin(this.motionClock * 1.65) * 0.16;
    const angle = Phaser.Math.Angle.RotateTo(fleeAngle + wobble, homeAngle, edgePressure * 0.58);
    const speed = this.baseSpeed + this.fleeBoost * (0.65 + proximity * 0.7);

    this.targetVelocity.setToPolar(angle, speed);
    this.fleeTimer = Math.max(this.fleeTimer, 220 + (proximity * 260));
    this.routeTimer = Math.max(this.routeTimer, 180);
  }

  update(bounds, threat = null, delta = 16.67) {
    if (this.isCaught || !this.body || !bounds) return;

    const dt = Math.min(delta || 16.67, 40);
    const steering = 1 - Math.pow(1 - this.traits.steerEase, dt / 16.67);
    this.motionClock += dt * this.swimBobSpeed;

    if (threat) {
      const distanceFromThreat = Phaser.Math.Distance.Between(this.x, this.y, threat.x, threat.y);
      if (distanceFromThreat < this.fleeRadius) {
        this.fleeFromThreat(bounds, threat, distanceFromThreat);
      }
    }

    if (this.fleeTimer > 0) {
      this.fleeTimer = Math.max(0, this.fleeTimer - dt);
    } else {
      this.routeTimer -= dt;
      if (this.routeTimer <= 0) {
        this.chooseCruiseRoute(bounds);
      }
      this.setCruiseVelocity(bounds);
    }

    const norm = this.getNormalizedRadius(bounds);
    if (norm >= 0.94) {
      const recoverAngle = Phaser.Math.Angle.Between(this.x, this.y, bounds.cx, bounds.cy);
      const redirectAngle = Phaser.Math.Angle.RotateTo(
        Math.atan2(this.targetVelocity.y, this.targetVelocity.x),
        recoverAngle,
        0.8,
      );
      this.targetVelocity.setToPolar(redirectAngle, Math.max(this.baseSpeed + 46, this.cruiseSpeed));
    }

    this.body.velocity.x = Phaser.Math.Linear(this.body.velocity.x, this.targetVelocity.x, steering);
    this.body.velocity.y = Phaser.Math.Linear(this.body.velocity.y, this.targetVelocity.y, steering);

    keepInsideEllipse(this, bounds);

    this.rotation = Phaser.Math.Clamp(this.body.velocity.y / 980, -0.2, 0.2)
      + Math.sin(this.motionClock) * 0.025;
    this.setFlipX(this.body.velocity.x < 0);
  }
}
