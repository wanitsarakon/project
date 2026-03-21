export default class ScoreManager {
  constructor(scene) {
    this.scene = scene;
    this.score = 0;

    this.scoreFrame = scene.add
      .image(168, 44, "horse-hud-sign")
      .setDisplaySize(258, 86)
      .setDepth(19);

    this.scoreText = scene.add
      .text(168, 44, "คะแนน: 0", {
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
    this.scoreText.setText(`คะแนน: ${this.score}`);
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
