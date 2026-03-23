import Phaser from "phaser";

const TYPES = ["water", "banana_peel"];

const OBSTACLE_CONFIG = {
  water: {
    scale: 0.44,
    width: 0.58,
    height: 0.26,
    offsetX: 0.2,
    offsetY: 0.54,
    visualInsets: { left: 0.12, right: 0.12, top: 0.48, bottom: 0.1 },
  },
  banana_peel: {
    scale: 0.38,
    width: 0.48,
    height: 0.28,
    offsetX: 0.26,
    offsetY: 0.48,
    visualInsets: { left: 0.18, right: 0.18, top: 0.4, bottom: 0.08 },
  },
};

export default class Obstacle extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    const type = Phaser.Utils.Array.GetRandom(TYPES);
    super(scene, x, y, type);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.obstacleType = type;
    this.setOrigin(0.5, 1);
    this.setDepth(5);
    this.body.allowGravity = false;
    this.setImmovable(true);
    this.refreshHitbox();
  }

  refreshHitbox() {
    const config = OBSTACLE_CONFIG[this.obstacleType] ?? OBSTACLE_CONFIG.banana_peel;
    this.setScale(config.scale);
    this.body.setSize(this.displayWidth * config.width, this.displayHeight * config.height, true);
    this.body.setOffset(this.displayWidth * config.offsetX, this.displayHeight * config.offsetY);
    this.visualCollisionInsets = {
      left: this.displayWidth * config.visualInsets.left,
      right: this.displayWidth * config.visualInsets.right,
      top: this.displayHeight * config.visualInsets.top,
      bottom: this.displayHeight * config.visualInsets.bottom,
    };
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.x < -120) {
      this.destroy();
    }
  }
}
