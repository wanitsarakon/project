import Phaser from "phaser";

export default class Obstacle extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "obstacle");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.46);
    this.setOrigin(0.5, 1);
    this.setDepth(5);
    this.body.allowGravity = false;
    this.setImmovable(true);
    this.body.setSize(this.displayWidth * 0.54, this.displayHeight * 0.46, true);
    this.body.setOffset(this.displayWidth * 0.24, this.displayHeight * 0.35);
    this.visualCollisionInsets = {
      left: this.displayWidth * 0.24,
      right: this.displayWidth * 0.22,
      top: this.displayHeight * 0.32,
      bottom: this.displayHeight * 0.2,
    };
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.x < -120) {
      this.destroy();
    }
  }
}
