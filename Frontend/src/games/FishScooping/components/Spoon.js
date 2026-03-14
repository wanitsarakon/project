import Phaser from "phaser";

export default class Spoon extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y) {
    super(scene, x, y, "spoon");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.2);
    this.setDepth(5);
    this.body.setCircle(28);
    this.body.allowGravity = false;

    this.holdingFish = null;
  }

  update(pointer, enabled = true) {
    if (!pointer) return;

    this.x = Phaser.Math.Clamp(pointer.worldX, 52, this.scene.scale.width - 52);
    this.y = Phaser.Math.Clamp(pointer.worldY, 52, this.scene.scale.height - 52);

    if (!enabled && this.holdingFish) {
      this.releaseFish();
    }

    if (this.holdingFish) {
      this.holdingFish.x = this.x;
      this.holdingFish.y = this.y;
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
