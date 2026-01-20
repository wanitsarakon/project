import Phaser from "phaser";

export default class FishScoopingScene extends Phaser.Scene {
  constructor() {
    super({ key: "FishScoopingScene" });

    this.roomCode = null;
    this.player = null;
    this.wsRef = null;
    this.onGameEnd = null;

    this.timeLeft = 60;
    this.score = 0;

    this.failHit = 0;
    this.netBroken = false;
  }

  /* =====================
     INIT
  ===================== */
  init(data) {
    this.roomCode = data.roomCode;
    this.player = data.player;
    this.wsRef = data.wsRef;
    this.onGameEnd = data.onGameEnd;

    this.timeLeft = 60;
    this.score = 0;
    this.failHit = 0;
    this.netBroken = false;
  }

  preload() {
    // ใช้ shape ก่อน ยังไม่ต้อง asset
  }

  /* =====================
     CREATE
  ===================== */
  create() {
    const { width, height } = this.scale;

    /* ===== UI ===== */
    this.scoreText = this.add.text(16, 16, "คะแนน: 0", {
      fontSize: "20px",
      color: "#fff",
    });

    this.timeText = this.add
      .text(width - 16, 16, "เวลา: 60", {
        fontSize: "20px",
        color: "#fff",
      })
      .setOrigin(1, 0);

    this.netStatusText = this.add
      .text(width / 2, height - 20, "", {
        fontSize: "18px",
        color: "#ff4444",
      })
      .setOrigin(0.5);

    /* ===== BUCKET ===== */
    this.bucket = this.add.rectangle(
      width / 2,
      height - 60,
      120,
      40,
      0x8b4513
    );

    this.physics.add.existing(this.bucket, true);

    /* ===== NET (SCOOP) ===== */
    this.net = this.add.circle(
      width / 2,
      height / 2,
      20,
      0xffffff,
      0.6
    );
    this.physics.add.existing(this.net);
    this.net.body.setAllowGravity(false);

    this.input.on("pointermove", (p) => {
      this.net.setPosition(p.x, p.y);
    });

    /* ===== GROUPS ===== */
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
      this.net,
      this.dropFish,
      null,
      this
    );

    /* ===== SPAWN ===== */
    this.spawnTimer = this.time.addEvent({
      delay: 900,
      loop: true,
      callback: this.spawnFish,
      callbackScope: this,
    });

    /* ===== TIMER ===== */
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
    const fish = this.add.circle(
      Phaser.Math.Between(50, this.scale.width - 50),
      Phaser.Math.Between(80, 300),
      isGold ? 12 : 10,
      isGold ? 0xffd700 : 0x00bfff
    );

    fish.type = isGold ? "gold" : "normal";
    fish.value = isGold ? 3 : 1;

    this.physics.add.existing(fish);
    fish.body.setAllowGravity(false);

    const speed =
      40 + Math.floor((60 - this.timeLeft) / 15) * 20;

    fish.body.setVelocity(
      Phaser.Math.Between(-speed, speed),
      Phaser.Math.Between(-speed, speed)
    );

    this.fishes.add(fish);
  }

  /* =====================
     CATCH FISH
  ===================== */
  catchFish(net, fish) {
    if (this.netBroken || fish.caught) return;

    fish.caught = true;
    fish.body.stop();
    fish.setFillStyle(0xffffff);
    fish.following = true;
  }

  /* =====================
     DROP INTO BUCKET
  ===================== */
  dropFish() {
    const caughtFish = this.fishes
      .getChildren()
      .find((f) => f.following);

    if (!caughtFish) return;

    caughtFish.destroy();

    this.score += caughtFish.value;
    this.scoreText.setText(`คะแนน: ${this.score}`);

    this.wsRef?.current?.send({
      type: "score_update",
      player_id: this.player.id,
      score: caughtFish.value,
    });

    this.failHit = 0;
  }

  /* =====================
     FAIL HANDLING
  ===================== */
  update() {
    this.fishes.getChildren().forEach((f) => {
      if (f.following) {
        f.setPosition(this.net.x, this.net.y);
      }
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
     NET BREAK
  ===================== */
  breakNet() {
    if (this.netBroken) return;

    this.netBroken = true;
    this.netStatusText.setText("❌ แหขาด! รอ 3 วินาที");

    this.time.delayedCall(3000, () => {
      this.netBroken = false;
      this.netStatusText.setText("");
      this.failHit = 0;
    });
  }

  /* =====================
     END GAME
  ===================== */
  endGame() {
    this.spawnTimer.remove();
    this.timer.remove();

    this.time.delayedCall(300, () => {
      this.onGameEnd?.({
        player_id: this.player.id,
        score: this.score,
      });
    });
  }
}
