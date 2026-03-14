import Phaser from "phaser";

export default class Spoon extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y) {
    super(scene, x, y, "spoon");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.255);
    this.setOrigin(0.3, 0.64);
    this.setDepth(5);
    this.body.setCircle(34, 10, 18);
    this.body.allowGravity = false;

    this.holdingFish = null;
  }

  update(pointer, enabled = true) {
    if (!pointer) return;

    this.x = Phaser.Math.Clamp(pointer.x, 18, this.scene.scale.width - 18);
    this.y = Phaser.Math.Clamp(pointer.y, 18, this.scene.scale.height - 18);

    if (!enabled && this.holdingFish) {
      this.releaseFish();
    }

    if (this.holdingFish) {
      this.holdingFish.x = this.x - 12;
      this.holdingFish.y = this.y + 6;
    }
  }

  catchFish(fish) {
    if (this.holdingFish) return;

    this.holdingFish = fish;
    fish.isCaught = true;
    fish.body.enable = false;
  }

  releaseFish() {
    this.holdingFish = null;
  }
}
