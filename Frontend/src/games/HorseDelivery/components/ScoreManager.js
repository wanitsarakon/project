export default class ScoreManager {

  constructor(scene) {

    this.scene = scene
    this.score = 0

    const width = scene.scale.width

    /* ======================
       SCORE TEXT
    ====================== */

    this.scoreText = scene.add.text(
      30,
      30,
      "คะแนน : 0",
      {
        fontSize: "34px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 5
      }
    )

    this.scoreText.setDepth(100)

  }

  /* ======================
     ADD SCORE
  ====================== */

  addScore(value) {

    this.score += value

    if (this.score < 0) {
      this.score = 0
    }

    this.updateUI()

  }

  /* ======================
     UPDATE UI
  ====================== */

  updateUI() {

    this.scoreText.setText(
      "คะแนน : " + this.score
    )

  }

  /* ======================
     GET SCORE
  ====================== */

  getScore() {
    return this.score
  }

  /* ======================
     GAME OVER
  ====================== */

  showGameOver() {

    const width = this.scene.scale.width
    const height = this.scene.scale.height

    this.scene.add.text(
      width / 2,
      height / 2,
      "จบเกม",
      {
        fontSize: "64px",
        color: "#ff0000",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 6
      }
    ).setOrigin(0.5)
     .setDepth(200)

  }

}