import Phaser from "phaser";

export default class DollScene extends Phaser.Scene {
  constructor() {
    super({ key: "DollShootScene" });

    /* =========================
       RUNTIME (FROM REACT)
    ========================= */
    this.roomCode = null;
    this.player = null;
    this.onGameEnd = null;
    this.wsRef = null;

    /* =========================
       GAME STATE
    ========================= */
    this.score = 0;
    this.combo = 0;
    this.timeLeft = 60;
    this.ended = false;
  }

  /* =========================
     INIT FROM REACT
  ========================= */
  init(data) {
    this.roomCode = data.roomCode;
    this.player = data.player;
    this.onGameEnd = data.onGameEnd;
    this.wsRef = data.wsRef; // ✅ ใช้ WS จาก React เท่านั้น

    this.score = 0;
    this.combo = 0;
    this.timeLeft = 60;
    this.ended = false;
  }

  preload() {
    // เผื่อใส่ asset ภายหลัง
  }

  /* =========================
     CREATE
  ========================= */
  create() {
    const { width, height } = this.scale;

    /* ---------- UI ---------- */
    this.scoreText = this.add.text(16, 16, "คะแนน: 0", {
      fontSize: "20px",
      color: "#ffffff",
    });

    this.timeText = this.add
      .text(width - 16, 16, "เวลา: 60", {
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(1, 0);

    /* ---------- GROUPS ---------- */
    this.bullets = this.physics.add.group();
    this.dolls = this.physics.add.group();

    /* ---------- INPUT ---------- */
    this.input.on("pointerdown", (p) => {
      if (!this.ended) {
        this.shoot(p.x, p.y);
      }
    });

    /* ---------- COLLISION ---------- */
    this.physics.add.overlap(
      this.bullets,
      this.dolls,
      this.hitDoll,
      null,
      this
    );

    /* ---------- SPAWN TIMER ---------- */
    this.spawnTimer = this.time.addEvent({
      delay: 900,
      loop: true,
      callback: this.spawnDoll,
      callbackScope: this,
    });

    /* ---------- GAME TIMER ---------- */
    this.timeEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: this.tick,
      callbackScope: this,
    });

    /* ---------- CLEANUP ---------- */
    this.events.once("shutdown", this.onShutdown, this);
    this.events.once("destroy", this.onShutdown, this);
  }

  /* =========================
     SHOOT
  ========================= */
  shoot(x, y) {
    if (this.ended) return;

    const bullet = this.add.circle(
      this.scale.width / 2,
      this.scale.height - 30,
      6,
      0xffd700
    );

    this.physics.add.existing(bullet);
    bullet.body.setAllowGravity(false);
    bullet.body.setVelocity(
      (x - bullet.x) * 3,
      (y - bullet.y) * 3
    );

    this.bullets.add(bullet);

    this.time.delayedCall(1500, () => {
      if (bullet.active) bullet.destroy();
    });
  }

  /* =========================
     SPAWN DOLL
  ========================= */
  spawnDoll() {
    if (this.ended) return;

    const size = Phaser.Math.Between(30, 42);
    const x = Phaser.Math.Between(60, this.scale.width - 60);
    const y = Phaser.Math.Between(80, 240);

    const doll = this.add.rectangle(
      x,
      y,
      size,
      size,
      Phaser.Display.Color.RandomRGB().color
    );

    this.physics.add.existing(doll);
    doll.body.setAllowGravity(false);

    const speed = 40 + (60 - this.timeLeft) * 1.2;
    doll.body.setVelocityX(
      Phaser.Math.Between(-speed, speed)
    );

    this.dolls.add(doll);
  }

  /* =========================
     HIT DOLL
  ========================= */
  hitDoll(bullet, doll) {
    if (this.ended) return;

    bullet.destroy();
    doll.destroy();

    this.combo++;

    let gain = 10;
    if (this.combo % 3 === 0) {
      gain += 5;
    }

    this.score += gain;
    this.scoreText.setText(`คะแนน: ${this.score}`);

    /* ---------- SEND SCORE ---------- */
    this.wsRef?.current?.send({
      type: "score_update",
      player_id: this.player.id,
      score: gain,
    });

    this.time.delayedCall(600, () => {
      this.combo = 0;
    });
  }

  /* =========================
     TIMER
  ========================= */
  tick() {
    if (this.ended) return;

    this.timeLeft--;
    this.timeText.setText(`เวลา: ${this.timeLeft}`);

    if (this.timeLeft <= 0) {
      this.endGame();
    }
  }

  /* =========================
     END GAME (ONCE)
  ========================= */
  endGame() {
    if (this.ended) return;
    this.ended = true;

    this.spawnTimer?.remove(false);
    this.timeEvent?.remove(false);

    /* ---------- NOTIFY BACKEND ---------- */
    this.wsRef?.current?.send({
      type: "game_summary",
      player_id: this.player.id,
      score: this.score,
    });

    /* ---------- NOTIFY REACT ---------- */
    this.time.delayedCall(300, () => {
      this.onGameEnd?.({
        player_id: this.player.id,
        score: this.score,
      });
    });
  }

  /* =========================
     CLEANUP
  ========================= */
  onShutdown() {
    this.spawnTimer?.remove(false);
    this.timeEvent?.remove(false);

    this.bullets?.clear(true, true);
    this.dolls?.clear(true, true);
  }
}
