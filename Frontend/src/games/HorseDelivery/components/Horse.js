import Phaser from "phaser"

export default class Horse extends Phaser.Physics.Arcade.Sprite {

  constructor(scene, x, y) {

    super(scene, x, y, "horse")

    /* ======================
       ADD TO SCENE
    ====================== */

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.scene = scene

    /* ======================
       VISUAL
    ====================== */

    this.setScale(0.8)
    this.setOrigin(0.5, 1)

    /* ======================
       PHYSICS
    ====================== */

    this.setCollideWorldBounds(true)

    this.body.setGravityY(1000)

    /* ======================
       HITBOX
    ====================== */

    this.body.setSize(
      this.width * 0.6,
      this.height * 0.7
    )

    this.body.setOffset(
      this.width * 0.2,
      this.height * 0.2
    )

  }

  /* ======================
     JUMP
  ====================== */

  jump() {

    if (!this.body) return

    const onGround =
      this.body.blocked.down ||
      this.body.touching.down

    if (onGround) {

      this.setVelocityY(-520)

    }

  }

}