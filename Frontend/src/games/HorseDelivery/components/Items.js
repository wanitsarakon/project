import Phaser from "phaser";

const TYPES = ["item_candy", "item_coin", "item_gift", "item_hay"];

export default class Items extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, Phaser.Utils.Array.GetRandom(TYPES));

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.1);
    this.setDepth(5);
    this.body.allowGravity = false;
    this.body.setCircle(Math.min(this.displayWidth, this.displayHeight) * 0.22);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.x < -120) {
      this.destroy();
    }
  }
}
