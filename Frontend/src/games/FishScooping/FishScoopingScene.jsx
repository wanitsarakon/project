import Phaser from "phaser";
import Spoon from "./components/Spoon";

/* =====================
   CONSTANTS
===================== */
const GAME_TIME = 60;
const CONFIRM_TIME = 500;

const FISH_SCORE = { normal: 1, gold: 3 };

export default class FishScoopingScene extends Phaser.Scene {
  constructor() {
    super({ key: "FishScoopingScene" });

    this.timeLeft = GAME_TIME;
    this.score = 0;

    this.failHit = 0;
    this.pendingFish = null;
    this.pendingTimer = null;

    this.baseFishSpeed = 70;
    this.spawnDelay = 900;

    this.isDragging = false;
    this.ended = false;
  }

  init(data = {}) {
    this.player = data.player ?? null;
    this.onGameEnd = data.onGameEnd ?? null;

    this.timeLeft = GAME_TIME;
    this.score = 0;
    this.failHit = 0;
    this.pendingFish = null;
    this.pendingTimer = null;

    this.baseFishSpeed = 70;
    this.spawnDelay = 900;

    this.isDragging = false;
    this.ended = false;
  }

  preload() {
    this.load.image("bg", "/assets/BGfish.jpg");
    this.load.image("fish", "/assets/Fish.png");
    this.load.image("fish_gold", "/assets/Fish_gold.png");
    this.load.image("spoon", "/assets/Spoon.png");
    this.load.image("bucket", "/assets/water_bowl.png");
  }

  create() {
    const { width, height } = this.scale;

    this.add.image(width / 2, height / 2, "bg");

    this.scoreText = this.add.text(16, 16, "คะแนน: 0", {
      color: "#fff",
      fontSize: "20px",
    });

    this.timeText = this.add
      .text(width - 16, 16, `เวลา: ${GAME_TIME}`, {
        color: "#fff",
        fontSize: "20px",
      })
      .setOrigin(1, 0);

    this.bucket = this.physics.add
      .staticImage(width / 2, height - 55, "bucket")
      .setScale(0.4);

    this.spoon = new Spoon(this, width / 2, height / 2);

    /* ===== INPUT ===== */
    this.input.on("pointermove", (p) => {
      if (!this.ended) this.spoon.moveTo(p.x, p.y);
    });

    this.input.on("pointerdown", () => {
      if (this.ended) return;

      const fish = this.pendingFish;
      if (!fish || fish.following) return;

      this.isDragging = true;

      this.pendingFish = null;
      this.pendingTimer?.remove();
      this.pendingTimer = null;

      fish.pending = false;
      fish.following = true;
      fish.caught = true;
    });

    this.input.on("pointerup", () => {
      this.isDragging = false;
    });

    /* ===== FISH GROUP ===== */
    this.fishes = this.physics.add.group({ allowGravity: false });

    this.physics.add.overlap(
      this.spoon,
      this.fishes,
      this.tryCatchFish,
      null,
      this
    );

    /* ===== TIMERS ===== */
    this.spawnTimer = this.time.addEvent({
      delay: this.spawnDelay,
      loop: true,
      callback: () => this.spawnFish(),
    });

    this.timer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.tick(),
    });
  }

  updateDifficulty() {
    const elapsed = GAME_TIME - this.timeLeft;
    const level = Math.floor(elapsed / 10);

    this.baseFishSpeed = 70 + level * 15;
    this.spawnDelay = Phaser.Math.Clamp(900 - level * 80, 350, 900);

    if (this.spawnTimer) {
      this.spawnTimer.delay = this.spawnDelay;
    }
  }

  spawnFish() {
    if (this.ended) return;

    const type = Math.random() < 0.66 ? "normal" : "gold";
    const tex = type === "gold" ? "fish_gold" : "fish";

    const fromLeft = Math.random() < 0.5;
    const dir = fromLeft ? 1 : -1;

    const fish = this.fishes.create(
      fromLeft ? -80 : this.scale.width + 80,
      Phaser.Math.Between(150, 420),
      tex
    );

    fish.setScale(type === "gold" ? 0.13 : 0.11);
    fish.setFlipX(!fromLeft);

    fish.type = type;
    fish.value = FISH_SCORE[type];

    fish.following = false;
    fish.caught = false;
    fish.scored = false;
    fish.pending = false; // 🔑 สำคัญ

    fish.speed = this.baseFishSpeed + Phaser.Math.Between(-10, 15);
    fish.setVelocity(dir * fish.speed, 0);
  }

  update(time) {
    if (this.ended) return;

    this.spoon.update?.();

    const netX = this.spoon.x;
    const netY = this.spoon.y;

    this.fishes.getChildren().forEach((fish) => {
      if (!fish.body) return;

      if (
        fish.x < -150 ||
        fish.x > this.scale.width + 150
      ) {
        if (this.pendingFish === fish) {
          this.pendingFish = null;
          this.pendingTimer?.remove();
          this.pendingTimer = null;
        }
        fish.destroy();
        return;
      }

      if (fish.following) {
        fish.setPosition(netX, netY - 6);
        this.checkDropIntoBucket(fish);
      } else {
        fish.setVelocityY(
          Math.sin((time + fish.y) * 0.005) *
            (20 + this.baseFishSpeed * 0.15)
        );
      }
    });
  }

  /* =====================
     FIXED TRY CATCH
  ===================== */
  tryCatchFish(spoon, fish) {
    if (fish.following || fish.caught || fish.pending || this.isDragging) return;

    fish.pending = true;
    this.pendingFish = fish;

    this.pendingTimer?.remove();
    this.pendingTimer = this.time.delayedCall(CONFIRM_TIME, () => {
      if (this.pendingFish === fish && !fish.following) {
        this.pendingFish = null;
        fish.pending = false;

        this.failHit++;
        if (this.failHit >= 3) {
          this.spoon.breakNet?.();
          this.failHit = 0;
        }
      }
    });
  }

  checkDropIntoBucket(fish) {
    if (!fish.caught || fish.scored) return;
    if (this.isDragging) return;

    if (this.bucket.getBounds().contains(fish.x, fish.y)) {
      this.scoreFish(fish);
    }
  }

  scoreFish(fish) {
    fish.scored = true;

    this.score += fish.value;
    this.scoreText.setText(`คะแนน: ${this.score}`);

    fish.destroy();
    this.failHit = 0;
  }

  tick() {
    if (this.ended) return;

    this.timeLeft--;
    this.timeText.setText(`เวลา: ${this.timeLeft}`);

    this.updateDifficulty();

    if (this.timeLeft <= 0) {
      this.endGame();
    }
  }

  endGame() {
    if (this.ended) return;
    this.ended = true;

    this.spawnTimer?.remove();
    this.timer?.remove();
    this.input.enabled = false;

    this.onGameEnd?.({
      player_id: this.player?.id ?? null,
      score: this.score,
    });
  }
}
