import Phaser from "phaser";

const BLESSINGS = [
  "ขอให้มีความสุข ความสบายใจ และสมหวังในสิ่งที่ตั้งใจ",
  "ขอให้สุขภาพแข็งแรง ปราศจากโรคภัย",
  "ขอให้การเรียน การงานราบรื่น พบเจอแต่สิ่งดี ๆ",
  "ขอให้มีสติ ปัญญา และกำลังใจในทุกวัน",
  "ขอให้โชคดี มีคนเมตตาเกื้อหนุน",
];

export default class BlessingBox {
  constructor(scene, x, y) {
    this.scene = scene;

    this.container = scene.add.container(x, y);

    const bg = scene.add.rectangle(0, 0, 520, 220, 0x000000, 0.75);
    bg.setStrokeStyle(3, 0xffffff);

    const text = scene.add.text(0, -20, Phaser.Utils.Array.GetRandom(BLESSINGS), {
      color: "#fff",
      fontSize: "20px",
      align: "center",
      wordWrap: { width: 460 },
    }).setOrigin(0.5);

    const btn = scene.add.text(0, 70, "🙏 กราบขอบพระคุณ", {
      color: "#ffd700",
      fontSize: "18px",
    }).setOrigin(0.5).setInteractive();

    btn.on("pointerdown", () => {
      this.container.destroy();
      scene.finishBooth();
    });

    this.container.add([bg, text, btn]);
  }
}
