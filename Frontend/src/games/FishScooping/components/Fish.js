import Phaser from "phaser";

const FISH_TRAITS = {
  red: {
    scale: 0.19,
    score: 1,
    cruiseSpeed: [120, 160], // ช้าลงเล็กน้อยเพื่อให้ดูใจเย็น
    fleeBoost: [220, 276],
    fleeRadius: 172,
    steerEase: 0.04, // ลดจาก 0.075 เพื่อให้การเลี้ยวสมูทขึ้น
    routeMs: [1500, 2500], // อยู่ในเส้นทางเดิมนานขึ้น
    swimBobSpeed: [0.003, 0.005],
  },
  silver: {
    scale: 0.17,
    score: 2,
    cruiseSpeed: [160, 210],
    fleeBoost: [250, 318],
    fleeRadius: 194,
    steerEase: 0.06, // การตอบสนองปานกลาง
    routeMs: [1000, 2000],
    swimBobSpeed: [0.005, 0.007],
  },
  gold: {
    scale: 0.15,
    score: 3,
    cruiseSpeed: [240, 300],
    fleeBoost: [100, 150], // ลดจาก [300, 380] เพื่อไม่ให้ความเร็วพุ่งกระโดด
    fleeRadius: 214,
    steerEase: 0.08,
    routeMs: [600, 1200],
    swimBobSpeed: [0.007, 0.01],
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

  if (norm <= 1.02) return; // ยอมให้เหลื่อมได้นิดหน่อยเพื่อความสมูท

  const angle = Math.atan2(dy, dx);
  // แทนที่จะกระชากกลับ ให้ใช้การขยับทีละนิด (Damping)
  const targetX = bounds.cx + Math.cos(angle) * (bounds.rx - 2);
  const targetY = bounds.cy + Math.sin(angle) * (bounds.ry - 2);

  sprite.x = Phaser.Math.Linear(sprite.x, targetX, 0.1);
  sprite.y = Phaser.Math.Linear(sprite.y, targetY, 0.1);
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
    if (Math.random() < 0.34) {
      const point = randomPointInEllipse(bounds);
      const topBias = Math.random() < 0.58 ? Phaser.Math.FloatBetween(0.12, 0.3) : 0;
      this.routeTarget.set(
        point.x,
        Phaser.Math.Linear(point.y, bounds.cy - (bounds.ry * 0.78), topBias),
      );
    } else {
      const currentAngle = Phaser.Math.Angle.Between(bounds.cx, bounds.cy, this.x, this.y);
      const advance = Phaser.Math.FloatBetween(0.56, 1.28) * this.orbitDirection;
      const radial = Phaser.Math.FloatBetween(0.38, 0.98);
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

// ในไฟล์ Fish.js
// ในไฟล์ Fish.js
fleeFromThreat(bounds, threat, distanceFromThreat) {
    const proximity = Phaser.Math.Clamp(1 - (distanceFromThreat / this.fleeRadius), 0, 1);

    // 1. คำนวณมุมหนี (หันหลังให้ช้อน)
    const fleeAngle = Phaser.Math.Angle.Between(threat.x, threat.y, this.x, this.y);

    // 2. คำนวณมุมกลับเข้าหาจุดศูนย์กลาง (Home) เพื่อเลี้ยวหลบขอบอัตโนมัติ
    const homeAngle = Phaser.Math.Angle.Between(this.x, this.y, bounds.cx, bounds.cy);
    const norm = this.getNormalizedRadius(bounds);

    // ยิ่งใกล้ขอบ ยิ่งให้น้ำหนักการเลี้ยวกลับเข้ากลางอ่างมากขึ้น (ป้องกันการพุ่งชนขอบ)
    const edgeAvoidance = Phaser.Math.Clamp((norm - 0.6) / 0.4, 0, 1);
    const finalAngle = Phaser.Math.Angle.RotateTo(fleeAngle, homeAngle, edgeAvoidance * 0.7);

    // 3. ปรับความเร็ว: เน้นว่ายเร็วขึ้นแบบต่อเนื่อง ไม่ใช้แรงพุ่ง (No Burst)
    // ใช้ค่า baseSpeed คูณกับตัวคูณความเร็ว แทนการบวก fleeBoost เข้าไปตรงๆ
    const fleeSpeedMultiplier = 1.4 + (proximity * 0.6); // เร็วขึ้นประมาณ 1.4 - 2.0 เท่าของความเร็วปกติ
    let speed = this.baseSpeed * fleeSpeedMultiplier;

    // 4. ระบบเบรกหน้าขอบ: ถ้าใกล้ขอบอ่างมาก ให้ลดความเร็วลงเพื่อไม่ให้ชนแรง
    if (norm > 0.85) {
        speed *= 0.7;
    }

    this.targetVelocity.setToPolar(finalAngle, speed);

    // ให้ปลาคงสถานะว่ายเร็วไว้สักพัก
    this.fleeTimer = Math.max(this.fleeTimer, 300 + (proximity * 300));
}
// ในไฟล์ Fish.js -> update()
// ในไฟล์ Fish.js -> ฟังก์ชัน update()
update(bounds, threat = null, delta = 16.67) {
    if (this.isCaught || !this.body || !bounds) return;

    const dt = Math.min(delta || 16.67, 40);
    const steerEase = this.fleeTimer > 0 ? this.traits.steerEase * 1.2 : this.traits.steerEase;
    const steering = 1 - Math.pow(1 - steerEase, dt / 16.67);

    this.motionClock += dt * this.swimBobSpeed;
    const swimCycle = Math.sin(this.motionClock * 2.5);
    const velocityMultiplier = Phaser.Math.Linear(0.85, 1.15, (swimCycle + 1) / 2);

    // เช็คการหนีช้อน (ลดความแรงลงตามที่คุยกันก่อนหน้า)
    if (threat) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, threat.x, threat.y);
        if (dist < this.fleeRadius) {
            this.fleeFromThreat(bounds, threat, dist);
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

    // --- ส่วนที่แก้ไข: การจัดการขอบบน/ล่าง แบบนุ่มนวล ---
    const norm = this.getNormalizedRadius(bounds);

    // ตรวจสอบว่าปลาอยู่โซนขอบ (บนหรือล่าง)
    // โดยเช็คจากค่า Y ว่าห่างจากจุดศูนย์กลางเกิน 80% ของรัศมีแนวตั้งหรือไม่
    const distY = Math.abs(this.y - bounds.cy);
    const isAtVerticalEdge = distY > (bounds.ry * 0.8);

    if (norm >= 0.82 || isAtVerticalEdge) {
        // 1. คำนวณมุมที่มุ่งหน้ากลับเข้าหาจุดศูนย์กลางอ่าง
        const angleToCenter = Phaser.Math.Angle.Between(this.x, this.y, bounds.cx, bounds.cy);
        const currentAngle = Math.atan2(this.targetVelocity.y, this.targetVelocity.x);

        // 2. ใช้ความเร็วปกติ (baseSpeed) และค่อยๆ เลี้ยวกลับ (RotateTo ด้วยค่าที่น้อยลง)
        // 0.08 คือความเร็วในการเลี้ยว ยิ่งน้อยยิ่งโค้งกว้างและดูไม่เด้ง
        const redirectAngle = Phaser.Math.Angle.RotateTo(currentAngle, angleToCenter, 0.08);

        // 3. บังคับใช้ความเร็วปกติที่ช้าลงเล็กน้อย (0.9 ของ baseSpeed) เพื่อความละมุน
        const slowReturnSpeed = this.baseSpeed * 0.9;
        this.targetVelocity.setToPolar(redirectAngle, slowReturnSpeed);

        // รีเซ็ต fleeTimer เพื่อให้ปลาเลิกตกใจและกลับมาว่ายปกติ
        if (this.fleeTimer > 0) this.fleeTimer *= 0.5;
    }

    const finalTargetX = this.targetVelocity.x * velocityMultiplier;
    const finalTargetY = this.targetVelocity.y * velocityMultiplier;

    this.body.velocity.x = Phaser.Math.Linear(this.body.velocity.x, finalTargetX, steering);
    this.body.velocity.y = Phaser.Math.Linear(this.body.velocity.y, finalTargetY, steering);

    keepInsideEllipse(this, bounds);

    // การเอียงตัว (Rotation)
    const speed = Math.hypot(this.body.velocity.x, this.body.velocity.y);
    if (speed > 5) {
        const headingTilt = Phaser.Math.Clamp(this.body.velocity.y / 900, -0.2, 0.2);
        this.rotation = Phaser.Math.Linear(this.rotation, headingTilt + (swimCycle * 0.05), 0.1);
        this.setFlipX(this.body.velocity.x > 0);
    }
}
}