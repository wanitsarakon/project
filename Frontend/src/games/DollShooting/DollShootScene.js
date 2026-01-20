import Phaser from "phaser";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

export default class DollShootScene extends Phaser.Scene {
  constructor() {
    super({ key: "DollShootScene" });

    /* ===== FROM REACT ===== */
    this.roomCode = null;
    this.player = null;
    this.roundId = null;
    this.onGameEnd = null;

    /* ===== GAME STATE ===== */
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
    this.roundId = data.roundId; // ⭐ สำคัญ
    this.onGameEnd = data.onGameEnd;

    this.score = 0;
    this.combo = 0;
    this.timeLeft = 60;
    this.ended = false;
  }

  preload() {}

  /* =========================
     CREATE
  ========================= */
  create() {
    const { width } = this.scale;

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
      if (!this.ended) this.shoot(p.x, p.y);
    });

    /* ---------- COLLISION ---------- */
    this.physics.add.overlap(
      this.bullets,
      this.dolls,
      this.hitDoll,
      null,
      this
    );

    /* ---------- SPAWN ---------- */
    this.spawnTimer = this.time.addEvent({
      delay: 900,
      loop: true,
      callback: this.spawnDoll,
      callbackScope: this,
    });

    /* ---------- TIMER ---------- */
    this.timeEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: this.tick,
      callbackScope: this,
    });

    this.events.once("shutdown", this.onShutdown, this);
    this.events.once("destroy", this.onShutdown, this);
  }

  /* =========================
     SHOOT
  ========================= */
  shoot(x, y) {
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

    this.time.delayedCall(1500, () => bullet.destroy());
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

    doll.body.setVelocityX(
      Phaser.Math.Between(-60, 60)
    );

    this.dolls.add(doll);
  }

  /* =========================
     HIT DOLL
  ========================= */
  hitDoll(bullet, doll) {
    bullet.destroy();
    doll.destroy();

    this.combo++;

    let gain = 10;
    if (this.combo % 3 === 0) gain += 5;

    this.score += gain;
    this.scoreText.setText(`คะแนน: ${this.score}`);

    this.time.delayedCall(500, () => {
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
     END GAME (SEND SCORE)
  ========================= */
  async endGame() {
    if (this.ended) return;
    this.ended = true;

    this.spawnTimer?.remove();
    this.timeEvent?.remove();

    /* ---------- SUBMIT SCORE (HTTP) ---------- */
    try {
      await fetch(
        `${API_BASE}/rounds/${this.roundId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            player_id: this.player.id,
            score: this.score,
            meta: { game: "shoot" },
          }),
        }
      );
    } catch (err) {
      console.error("❌ submit score failed", err);
    }

    /* ---------- BACK TO MAP ---------- */
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
    this.spawnTimer?.remove();
    this.timeEvent?.remove();
    this.bullets?.clear(true, true);
    this.dolls?.clear(true, true);
  }
}
