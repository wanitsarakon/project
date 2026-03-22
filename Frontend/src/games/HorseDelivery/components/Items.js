import Phaser from "phaser";

const TYPES = ["item_candy", "item_coin", "item_gift", "item_hay"];
const ITEM_HITBOX = {
  item_candy: {
    width: 0.28, height: 0.56, offsetX: 0.36, offsetY: 0.22,
    visualInsets: { left: 0.36, right: 0.36, top: 0.18, bottom: 0.12 },
  },
  item_coin: {
    width: 0.52, height: 0.52, offsetX: 0.24, offsetY: 0.24,
    visualInsets: { left: 0.24, right: 0.24, top: 0.24, bottom: 0.24 },
  },
  item_gift: {
    width: 0.56, height: 0.5, offsetX: 0.22, offsetY: 0.28,
    visualInsets: { left: 0.2, right: 0.18, top: 0.26, bottom: 0.2 },
  },
  item_hay: {
    width: 0.58, height: 0.4, offsetX: 0.21, offsetY: 0.4,
    visualInsets: { left: 0.18, right: 0.18, top: 0.36, bottom: 0.16 },
  },
};

export default class Items extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, Phaser.Utils.Array.GetRandom(TYPES));

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(1.05);
    this.setDepth(5);
    this.body.allowGravity = false;
    this.refreshHitbox();
  }

  refreshHitbox() {
    const config = ITEM_HITBOX[this.texture.key] ?? ITEM_HITBOX.item_gift;
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
