export default class ScoreManager {
  constructor(scene) {
    this.scene = scene;
    this.score = 0;

    this.scoreFrame = scene.add
      .rectangle(scene.scale.width - 168, 44, 292, 62, 0x5a2811, 0.82)
      .setStrokeStyle(4, 0xa35c24)
      .setDepth(19);

    this.scoreText = scene.add
      .text(scene.scale.width - 168, 44, "SCORE: 0", {
        fontFamily: "Kanit",
        fontSize: "28px",
        color: "#fff6cb",
        fontStyle: "bold",
        stroke: "#4f1e00",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(20);
  }

  addScore(value) {
    this.score = Math.max(0, this.score + value);
    this.updateUI();
  }

  updateUI() {
    this.scoreText.setText(`SCORE: ${this.score}`);
  }

  getScore() {
    return this.score;
  }

  show() {
    this.scoreFrame.setVisible(true);
    this.scoreText.setVisible(true);
  }

  hide() {
    this.scoreFrame.setVisible(false);
    this.scoreText.setVisible(false);
  }
}
