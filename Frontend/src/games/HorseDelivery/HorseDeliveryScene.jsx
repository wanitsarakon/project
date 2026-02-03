import Phaser from "phaser";
import Horse from "./components/Horse";

const GAME_TIME = 60;

export default class HorseDeliveryScene extends Phaser.Scene {
  constructor() {
    super({ key: "HorseDeliveryScene" });

    this.timeLeft = GAME_TIME;
    this.score = 0;
    this.speed = 220;
    this.ended = false;
  }

  init(data = {}) {
    this.player = data.player ?? null;
    this.onGameEnd = data.onGameEnd ?? null;

    this.timeLeft = GAME_TIME;
    this.score = 0;
    this.speed = 220;
    this.ended = false;
  }

  preload() {
    this.load.image("bg", "/assets/bg.png");
    this.load.image("ground", "/assets/ground.png");
    this.load.image("horse", "/assets/horse.png");
    this.load.image("tree", "/assets/obstacle_tree.png");
  }

  create() {
    const { width, height } = this.scale;

    /* ===== BG ===== */
    this.bg = this.add.tileSprite(
      width / 2,
      height / 2,
      width,
      height,
      "bg"
    );

    /* ===== UI ===== */
    this.scoreText = this.add.text(16, 16, "ระยะทาง: 0", {
      color: "#fff",
      fontSize: "20px",
    });

    this.timeText = this.add
      .text(width - 16, 16, `เวลา: ${GAME_TIME}`, {
        color: "#fff",
        fontSize: "20px",
      })
      .setOrigin(1, 0);

    /* ===== GROUND ===== */
    this.ground = this.physics.add
      .staticImage(width / 2, height - 40, "ground")
      .setScale(2)
      .refreshBody();

    /* ===== HORSE ===== */
    this.horse = new Horse(this, 140, height - 100);
    this.physics.add.collider(this.horse, this.ground);

    /* ===== OBSTACLES ===== */
    this.obstacles = this.physics.add.group({
      allowGravity: false,
    });

    this.physics.add.collider(
      this.horse,
      this.obstacles,
      this.hitObstacle,
      null,
      this
    );

    /* ===== INPUT ===== */
    this.input.on("pointerdown", () => {
      if (!this.ended) this.horse.jump();
    });

    /* ===== TIMERS ===== */
    this.spawnTimer = this.time.addEvent({
      delay: 1400,
      loop: true,
      callback: () => this.spawnObstacle(),
    });

    this.timer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.tick(),
    });
  }

  spawnObstacle() {
    const { width, height } = this.scale;

    const obs = this.obstacles.create(
      width + 60,
      height - 90,
      "tree"
    );

    obs.setVelocityX(-this.speed);
  }

  update(time, delta) {
    if (this.ended) return;

    this.bg.tilePositionX += this.speed * delta * 0.001;

    this.horse.update();

    this.score += delta * 0.01;
    this.scoreText.setText(`ระยะทาง: ${Math.floor(this.score)}`);

    this.obstacles.getChildren().forEach((obs) => {
      if (obs.x < -100) obs.destroy();
    });
  }

  hitObstacle() {
    this.endGame();
  }

  tick() {
    if (this.ended) return;

    this.timeLeft--;
    this.timeText.setText(`เวลา: ${this.timeLeft}`);

    this.speed += 6;

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
      score: Math.floor(this.score),
    });
  }
}
