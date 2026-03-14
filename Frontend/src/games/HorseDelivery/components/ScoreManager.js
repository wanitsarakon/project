export default class ScoreManager {
  constructor(scene) {
    this.scene = scene;
    this.score = 0;

    this.scoreText = scene.add.text(28, 28, "คะแนน 0", {
      fontFamily: "Kanit",
      fontSize: "32px",
      color: "#fff6cb",
      fontStyle: "bold",
      stroke: "#4f1e00",
      strokeThickness: 5,
    }).setDepth(20);
  }

  addScore(value) {
    this.score = Math.max(0, this.score + value);
    this.updateUI();
  }

  updateUI() {
    this.scoreText.setText(`คะแนน ${this.score}`);
  }

  getScore() {
    return this.score;
  }

  show() {
    this.scoreText.setVisible(true);
  }

  hide() {
    this.scoreText.setVisible(false);
  }
}
