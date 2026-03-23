export default class ScoreManager {
  constructor(scene) {
    this.scene = scene;
    this.score = 0;

    this.scoreFrame = scene.add.image(168, 52, "horse-hud-sign")
      .setDisplaySize(300, 96)
      .setDepth(19)
      .setScrollFactor(0);

    this.scoreText = scene.add.text(168, 52, "คะแนน: 0", {
      fontFamily: "Kanit",
      fontSize: "30px",
      color: "#fff6cb",
      fontStyle: "bold",
      stroke: "#4f1e00",
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(20).setScrollFactor(0);
  }

  layout(width) {
    this.scoreFrame.setPosition(168, 52);
    this.scoreText.setPosition(168, 52);
    if (width < 880) {
      this.scoreFrame.setPosition(148, 48).setDisplaySize(248, 84);
      this.scoreText.setPosition(148, 48).setFontSize("26px");
      return;
    }
    this.scoreFrame.setDisplaySize(300, 96);
    this.scoreText.setFontSize("30px");
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
