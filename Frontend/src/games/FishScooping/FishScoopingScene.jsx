import Phaser from "phaser";

export default class FishScoopingScene extends Phaser.Scene {
  constructor() {
    super({ key: "FishScoopingScene" });

    this.timeLeft = 60;
    this.score = 0;
    this.failHit = 0;
    this.netBroken = false;
  }

  /* =====================
     INIT
  ===================== */
  init(data = {}) {
    this.roomCode = data.roomCode;
    this.player = data.player;
    this.wsRef = data.wsRef;
    this.onGameEnd = data.onGameEnd;

    this.timeLeft = 60;
    this.score = 0;
    this.failHit = 0;
    this.netBroken = false;
  }

  /* =====================
     PRELOAD
  ===================== */
  preload() {
    this.load.image("bg", "/assets/BGfish.jpg");
    this.load.image("fish", "/assets/Fish.png");
    this.load.image("fish_gold", "/assets/Fish_gold.png");
    this.load.image("spoon", "/assets/Spoon.png");
    this.load.image("bucket", "/assets/water_bowl.png");
  }

  /* =====================
     CREATE
  ===================== */
  create() {
    const { width, height } = this.scale;

    /* ===== BG ===== */
    this.add.image(width / 2, height / 2, "bg").setDepth(0);

    /* ===== UI ===== */
    this.scoreText = this.add.text(16, 16, "คะแนน: 0", {
      fontSize: "20px",
      color: "#ffffff",
    }).setDepth(10);

    this.timeText = this.add
      .text(width - 16, 16, "เวลา: 60", {
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(1, 0)
      .setDepth(10);

    this.netStatusText = this.add
      .text(width / 2, height - 20, "", {
        fontSize: "18px",
        color: "#ff4444",
      })
      .setOrigin(0.5)
      .setDepth(10);

    /* ===== BUCKET ===== */
    this.bucket = this.physics.add
      .staticImage(width / 2, height - 55, "bucket")
      .setScale(0.4)
      .setDepth(5);

    /* ===== NET (SPOON) ===== */
    this.net = this.physics.add.image(width / 2, height / 2, "spoon");
    this.net.setScale(0.4);
    this.net.setDepth(6);
    this.net.body.setAllowGravity(false);
    this.net.body.setCircle(28, -28, -28); // ✅ FIX hitbox

    this.input.on("pointermove", (p) => {
      if (!this.netBroken) {
        this.net.setPosition(p.x, p.y);
      }
    });

    /* ===== FISH GROUP ===== */
    this.fishes = this.physics.add.group();

    /* ===== COLLISION ===== */
    this.physics.add.overlap(
      this.net,
      this.fishes,
      this.catchFish,
      null,
      this
    );

    this.physics.add.overlap(
      this.bucket,
      this.fishes,
      this.dropFish,
      null,
      this
    );

    /* ===== TIMERS ===== */
    this.spawnTimer = this.time.addEvent({
      delay: 900,
      loop: true,
      callback: this.spawnFish,
      callbackScope: this,
    });

    this.timer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: this.tick,
      callbackScope: this,
    });
  }

  /* =====================
     SPAWN FISH
  ===================== */
  spawnFish() {
    if (this.netBroken) return;

    const isGold = Math.random() < 0.2;
    const fromLeft = Math.random() < 0.5;
    const dir = fromLeft ? 1 : -1;

    const fish = this.fishes.create(
      fromLeft ? -80 : this.scale.width + 80,
      Phaser.Math.Between(150, 420),
      isGold ? "fish_gold" : "fish"
    );

    fish.setScale(isGold ? 0.45 : 0.4);
    fish.setDepth(4);
    fish.setFlipX(!fromLeft);

    fish.value = isGold ? 3 : 1;
    fish.following = false;

    const timeFactor = (60 - this.timeLeft) / 60;
    const speed = 70 + timeFactor * 90;

    fish.setVelocity(dir * speed, 0);
    fish.waveOffset = Math.random() * 100;
    fish.body.setAllowGravity(false);
  }

  /* =====================
     UPDATE
  ===================== */
  update(time) {
    this.fishes.getChildren().forEach((fish) => {
      if (!fish.body) return;

      if (fish.following) {
        fish.setPosition(this.net.x, this.net.y);
        return;
      }

      fish.setVelocityY(
        Math.sin((time + fish.waveOffset) * 0.005) * 25
      );

      if (
        fish.x < -150 ||
        fish.x > this.scale.width + 150
      ) {
        fish.destroy();
      }
    });
  }

  /* =====================
     CATCH FISH
  ===================== */
  catchFish(net, fish) {
    if (this.netBroken || fish.following) return;

    fish.following = true;
    fish.body.stop();
    fish.body.enable = false; // ✅ FIX

    this.time.delayedCall(2000, () => {
      if (!fish.active) return;

      if (fish.following) {
        fish.following = false;
        fish.body.enable = true;

        fish.setVelocity(
          Phaser.Math.Between(-80, 80),
          Phaser.Math.Between(-40, 40)
        );

        this.failHit++;
        if (this.failHit >= 3) {
          this.breakNet();
        }
      }
    });
  }

  /* =====================
     DROP INTO BUCKET
  ===================== */
  dropFish(bucket, fish) {
    if (!fish.following) return;

    this.score += fish.value;
    this.scoreText.setText(`คะแนน: ${this.score}`);

    fish.destroy();
    this.failHit = 0;

    this.wsRef?.current?.send?.({
      type: "score_update",
      player_id: this.player?.id,
      score: fish.value,
    });
  }

  /* =====================
     NET BREAK
  ===================== */
  breakNet() {
    if (this.netBroken) return;

    this.netBroken = true;
    this.netStatusText.setText("❌ แหขาด! รอ 3 วินาที");

    this.time.delayedCall(3000, () => {
      this.netBroken = false;
      this.failHit = 0;
      this.netStatusText.setText("");
    });
  }

  /* =====================
     TIMER
  ===================== */
  tick() {
    this.timeLeft--;
    this.timeText.setText(`เวลา: ${this.timeLeft}`);

    if (this.timeLeft <= 0) {
      this.endGame();
    }
  }

  /* =====================
     END GAME
  ===================== */
  endGame() {
    this.spawnTimer?.remove();
    this.timer?.remove();

    this.onGameEnd?.({
      player_id: this.player?.id,
      score: this.score,
    });
  }
}
