import Phaser from "phaser";

export default class FestivalMapScene extends Phaser.Scene {

  constructor() {
    super({ key: "FestivalMapScene" });
    this.onEnterGame = null;
    this.entering = false;
  }

  init(data = {}) {
    this.onEnterGame = data?.onEnterGame ?? null;
    this.entering = false;
  }

  preload() {
    if (this.textures.exists("map")) return;

    /* MAP */
    this.load.image("map", "/assets/Map.png");

    /* BOOTHS */
    this.load.image("fish",    "/assets/fish_booth.png");
    this.load.image("horse",   "/assets/carousel_booth.png");
    this.load.image("worship", "/assets/worship_booth.png");

    this.load.image("boxing",  "/assets/boxing_booth.png");
    this.load.image("cooking", "/assets/cooking_booth.png");
    this.load.image("balloon", "/assets/balloon_booth.png");

    this.load.image("doll",    "/assets/doll_booth.png");
    this.load.image("flower",  "/assets/flower_booth.png");
    this.load.image("haunted", "/assets/haunted_booth.png");
    this.load.image("tug",     "/assets/tug_booth.png");
  }

  create() {
    const { height } = this.scale;

    /* WORLD SIZE */
    this.physics.world.setBounds(0, 0, 7000, height);

    /* MAP */
    const bg = this.add.image(3500, height / 2, "map");
    bg.setDisplaySize(7000, height);

    /* CAMERA */
    const cam = this.cameras.main;
    cam.setBounds(0, 0, 7000, height);
    cam.scrollX = 0;

    /* ======================
       BOOTHS
    ====================== */
    this.createBooth(600,  "fish",    "FishScoopingScene");
    this.createBooth(1200, "horse",   "HorseDeliveryScene");
    this.createBooth(1800, "worship", "WorshipScene");

    this.createBooth(2400, "boxing",  "BoxingGameScene");
    this.createBooth(3000, "cooking", "CookingGameScene");
    this.createBooth(3600, "balloon", "BalloonShootScene");

    this.createBooth(4200, "doll",    "DollGameScene");
    this.createBooth(4800, "flower",  "FlowerGameScene");
    this.createBooth(5400, "haunted", "HauntedHouseScene");
    this.createBooth(6000, "tug",     "TugOfWarScene");

    /* DRAG CAMERA */
    this.input.on("pointermove", (pointer) => {
      if (pointer.isDown) {
        cam.scrollX -= pointer.velocity.x / 10;
        this.limitCamera();
      }
    });

    /* SCROLL WHEEL */
    this.input.on("wheel", (pointer, gameObjects, deltaX) => {
      cam.scrollX += deltaX;
      this.limitCamera();
    });

    /* CLEANUP */
    this.events.once("shutdown", () => {
      this.input.removeAllListeners();
    });
  }

  limitCamera() {
    const cam = this.cameras.main;
    cam.scrollX = Phaser.Math.Clamp(cam.scrollX, 0, 6400);
  }

  createBooth(x, texture, gameKey) {
    const { height } = this.scale;

    const booth = this.physics.add.staticImage(
      x,
      height - 140,
      texture
    );

    booth.setScale(0.35);
    booth.setInteractive({ useHandCursor: true });

    booth.on("pointerover", () => {
      booth.setScale(0.4);
    });

    booth.on("pointerout", () => {
      booth.setScale(0.35);
    });

    booth.on("pointerdown", () => {
      if (this.entering) return;
      this.entering = true;

      console.log("🎮 entering game:", gameKey);

      if (this.onEnterGame) {
        this.onEnterGame(gameKey);  // ส่ง string ตรงๆ ให้ตรงกับที่ GameContainer รับ
      }
    });
  }

}