import Phaser from "phaser";

export default class Spoon extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y) {
    super(scene, x, y, "spoon");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.26);
    this.setOrigin(0.34, 0.7);
    this.setDepth(5);
    this.body.setCircle(34, 10, 24);
    this.body.allowGravity = false;

    this.holdingFish = null;
  }

  update(pointer, enabled = true) {
    if (!pointer) return;

    const anchorOffset = this.getNetAnchorOffset();
    this.x = Phaser.Math.Clamp(pointer.x + anchorOffset.x, 18, this.scene.scale.width - 18);
    this.y = Phaser.Math.Clamp(pointer.y + anchorOffset.y, 18, this.scene.scale.height - 18);

    if (!enabled && this.holdingFish) {
      this.releaseFish();
    }

    if (this.holdingFish) {
      const netCenter = this.getNetCenter();
      this.holdingFish.x = netCenter.x;
      this.holdingFish.y = netCenter.y;
    }
  }

  getNetCenter() {
    const anchorOffset = this.getNetAnchorOffset();
    return {
      x: this.x - anchorOffset.x,
      y: this.y - anchorOffset.y,
    };
  }

  getNetAnchorOffset() {
    return {
      x: this.displayWidth * 0.14,
      y: this.displayHeight * 0.21,
    };
  }

  catchFish(fish) {
    if (this.holdingFish) return;

    this.holdingFish = fish;
    fish.isCaught = true;
    fish.body.enable = false;
    const netCenter = this.getNetCenter();
    fish.x = netCenter.x;
    fish.y = netCenter.y;
  }

  releaseFish() {
    this.holdingFish = null;
  }
}
