import Phaser from "phaser"

export default class Items extends Phaser.Physics.Arcade.Sprite {

  constructor(scene, x, y) {

    /* ======================
       RANDOM ITEM TYPE
    ====================== */

    const types = [
      "item_candy",
      "item_coin",
      "item_gift",
      "item_hay"
    ]

    const texture =
      Phaser.Utils.Array.GetRandom(types)

    super(scene, x, y, texture)

    /* ======================
       ADD TO SCENE
    ====================== */

    scene.add.existing(this)
    scene.physics.add.existing(this)

    this.scene = scene

    /* ======================
       VISUAL
    ====================== */

    this.setScale(0.5)

    /* ======================
       PHYSICS
    ====================== */

    this.setVelocityX(-320)

    this.body.allowGravity = false

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