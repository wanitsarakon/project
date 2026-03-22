import Phaser from "phaser";

export default class Obstacle extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "obstacle");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.56);
    this.setOrigin(0.5, 1);
    this.setDepth(5);
    this.body.allowGravity = false;
    this.setImmovable(true);
    this.body.setSize(this.displayWidth * 0.52, this.displayHeight * 0.58, true);
    this.body.setOffset(this.displayWidth * 0.23, this.displayHeight * 0.28);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.x < -120) {
      this.destroy();
    }
  }
}
