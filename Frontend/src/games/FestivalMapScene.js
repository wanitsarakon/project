import Phaser from "phaser";

export default class FestivalMapScene extends Phaser.Scene {

  constructor() {
    super({ key: "FestivalMapScene" });

    this.player = null;
    this.onEnterGame = null;
  }

  init(data = {}) {
    this.onEnterGame = data.onEnterGame ?? null;
  }

  preload() {

    this.load.image("map", "/assets/MapLong.png");

    this.load.image("fish", "/assets/fish_booth.png");
    this.load.image("horse", "/assets/carousel_booth.png");
    this.load.image("shoot", "/assets/shoot_booth.png");
    this.load.image("worship", "/assets/worship_booth.png");
    this.load.image("cotton", "/assets/cotton_booth.png");

    this.load.image("player", "/assets/player.png");

  }

  create() {

    const { width, height } = this.scale;

    /* ======================
       WORLD SIZE
    ====================== */

    this.physics.world.setBounds(0, 0, 4000, height);

    /* ======================
       MAP
    ====================== */

    const bg = this.add.image(2000, height / 2, "map");

    /* ======================
       PLAYER
    ====================== */

    this.player = this.physics.add.sprite(200, height - 120, "player");

    this.player.setCollideWorldBounds(true);

    /* ======================
       CAMERA
    ====================== */

    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0, 0, 4000, height);

    /* ======================
       BOOTHS
    ====================== */

    this.createBooth(600, "fish", "FishScoopingScene");
    this.createBooth(1200, "horse", "HorseDeliveryScene");
    this.createBooth(1800, "shoot", "DollShootScene");
    this.createBooth(2400, "worship", "WorshipScene");
    this.createBooth(3000, "cotton", "CottonCandyScene");

    /* ======================
       INPUT
    ====================== */

    this.cursors = this.input.keyboard.createCursorKeys();

  }

  /* ======================
     CREATE BOOTH
  ====================== */

  createBooth(x, texture, gameKey) {

    const { height } = this.scale;

    const booth = this.physics.add.staticImage(
      x,
      height - 140,
      texture
    );

    booth.setScale(0.35);

    this.physics.add.overlap(
      this.player,
      booth,
      () => {

        this.onEnterGame?.({ gameKey });

      },
      null,
      this
    );

  }

  /* ======================
     UPDATE
  ====================== */

  update() {

    if (this.cursors.right.isDown) {
      this.player.setVelocityX(250);
    } else if (this.cursors.left.isDown) {
      this.player.setVelocityX(-250);
    } else {
      this.player.setVelocityX(0);
    }

  }

}