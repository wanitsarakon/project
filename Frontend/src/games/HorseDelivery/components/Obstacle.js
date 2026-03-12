import Phaser from "phaser"

export default class Obstacle extends Phaser.Physics.Arcade.Sprite {

  constructor(scene, x, y) {

    super(scene, x, y, "obstacle")

    /* ======================
       ADD TO SCENE
    ====================== */

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.scene = scene

    /* ======================
       VISUAL
    ====================== */

    this.setScale(0.7)
    this.setOrigin(0.5, 1)

    /* ======================
       PHYSICS
    ====================== */

    this.setVelocityX(-350)

    this.body.allowGravity = false

    this.setImmovable(true)

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
     AUTO DESTROY
  ====================== */

  preUpdate(time, delta) {

    super.preUpdate(time, delta)

    if (this.x < -100) {

      this.destroy()

    }

  }

}