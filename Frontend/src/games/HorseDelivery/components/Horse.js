import Phaser from "phaser";

export default class Horse extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "horse");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setGravityY(900);

    this.isJumping = false;
  }

  jump() {
    if (this.body.blocked.down) {
      this.setVelocityY(-420);
      this.isJumping = true;
    }
  }

  update() {
    if (this.body.blocked.down) {
      this.isJumping = false;
    }
  }
}
