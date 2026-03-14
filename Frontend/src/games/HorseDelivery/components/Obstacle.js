import Phaser from "phaser";

export default class Obstacle extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "obstacle");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.68);
    this.setOrigin(0.5, 1);
    this.setDepth(5);
    this.body.allowGravity = false;
    this.setImmovable(true);
    this.body.setSize(this.width * 0.45, this.height * 0.55);
    this.body.setOffset(this.width * 0.3, this.height * 0.3);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.x < -120) {
      this.destroy();
    }
  }
}
