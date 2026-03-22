import Phaser from "phaser";

const NET_ORIGIN = {
  x: 0.372,
  y: 0.286,
};

export default class Spoon extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y) {
    super(scene, x, y, "spoon");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.26);
    this.setOrigin(NET_ORIGIN.x, NET_ORIGIN.y);
    this.setDepth(5);
    this.body.setCircle(
      34,
      (this.displayWidth * NET_ORIGIN.x) - 34,
      (this.displayHeight * NET_ORIGIN.y) - 34,
    );
    this.body.allowGravity = false;

    this.holdingFish = null;
  }

  update(pointer, enabled = true) {
    if (!pointer) return;

    const leftInset = this.displayWidth * this.originX;
    const rightInset = this.displayWidth * (1 - this.originX);
    const topInset = this.displayHeight * this.originY;
    const bottomInset = this.displayHeight * (1 - this.originY);

    this.x = Phaser.Math.Clamp(pointer.x, leftInset + 8, this.scene.scale.width - rightInset - 8);
    this.y = Phaser.Math.Clamp(pointer.y, topInset + 8, this.scene.scale.height - bottomInset - 8);

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
    return {
      x: this.x,
      y: this.y,
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
