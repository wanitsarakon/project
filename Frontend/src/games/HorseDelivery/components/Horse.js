import Phaser from "phaser";

export default class Horse extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "horse");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.38);
    this.setOrigin(0.5, 1);
    this.setDepth(6);
    this.setCollideWorldBounds(true);

    this.body.setGravityY(1200);
    this.body.setSize(this.displayWidth * 0.56, this.displayHeight * 0.46, true);
    this.body.setOffset(this.displayWidth * 0.22, this.displayHeight * 0.26);
  }

  jump() {
    if (!this.body) return;

    const onGround = this.body.blocked.down || this.body.touching.down;
    if (onGround) {
      this.setVelocityY(-660);
    }
  }

  update() {
    if (!this.body) return;
    this.rotation = Phaser.Math.Clamp(this.body.velocity.y / 1600, -0.12, 0.22);
  }
}
