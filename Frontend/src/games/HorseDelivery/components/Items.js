import Phaser from "phaser";

const TYPES = ["cotton_candy", "lotus_incense"];

const ITEM_CONFIG = {
  cotton_candy: {
    scale: 0.4,
    width: 0.46,
    height: 0.46,
    offsetX: 0.27,
    offsetY: 0.22,
    visualInsets: { left: 0.18, right: 0.18, top: 0.14, bottom: 0.12 },
  },
  lotus_incense: {
    scale: 0.42,
    width: 0.48,
    height: 0.54,
    offsetX: 0.26,
    offsetY: 0.18,
    visualInsets: { left: 0.16, right: 0.16, top: 0.12, bottom: 0.12 },
  },
};

export default class Items extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    const type = Phaser.Utils.Array.GetRandom(TYPES);
    super(scene, x, y, type);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.itemType = type;
    this.setOrigin(0.5, 1);
    this.setDepth(5);
    this.body.allowGravity = false;
    this.refreshHitbox();
  }

  refreshHitbox() {
    const config = ITEM_CONFIG[this.itemType] ?? ITEM_CONFIG.cotton_candy;
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
