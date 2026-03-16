import Phaser from "phaser";

const TYPES = ["item_candy", "item_coin", "item_gift", "item_hay"];

export default class Items extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, Phaser.Utils.Array.GetRandom(TYPES));

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.125);
    this.setDepth(5);
    this.body.allowGravity = false;
    this.body.setCircle(Math.min(this.displayWidth, this.displayHeight) * 0.34);
    this.body.setOffset(this.displayWidth * 0.17, this.displayHeight * 0.17);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.x < -120) {
      this.destroy();
    }
  }
}
