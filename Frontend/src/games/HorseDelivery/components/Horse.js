import Phaser from "phaser";

export default class Horse extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "horse");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.78);
    this.setOrigin(0.5, 1);
    this.setDepth(6);
    this.setCollideWorldBounds(true);

    this.body.setGravityY(1200);
    this.body.setSize(this.width * 0.54, this.height * 0.54);
    this.body.setOffset(this.width * 0.25, this.height * 0.36);
  }

  jump() {
    if (!this.body) return;

    const onGround = this.body.blocked.down || this.body.touching.down;
    if (onGround) {
      this.setVelocityY(-620);
    }
  }

  update() {
    if (!this.body) return;
    this.rotation = Phaser.Math.Clamp(this.body.velocity.y / 1600, -0.12, 0.22);
  }
}
