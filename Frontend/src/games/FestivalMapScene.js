import Phaser from "phaser";

const WORLD_WIDTH = 7200;

export const FESTIVAL_BOOTHS = [
  { key: "fish", label: "ตักปลา", scene: "FishScoopingScene", texture: "/assets/fish_booth.png", x: 620, accent: 0x63d5ff, icon: "ปลา" },
  { key: "horse", label: "ขี่ม้าส่งของ", scene: "HorseDeliveryScene", texture: "/assetsHorse/horse.png", x: 1320, accent: 0xffc857, icon: "ม้า" },
  { key: "worship", label: "ไหว้พระ", scene: "WorshipBoothScene", texture: "/assets/worship_booth.png", x: 2020, accent: 0xffde8a, icon: "พร" },
  { key: "boxing", label: "มวยไทย", scene: "BoxingGameScene", texture: "/assets/boxing_booth.png", x: 2720, accent: 0xff8a80, icon: "มวย" },
  { key: "cooking", label: "ทำขนม", scene: "CookingGameScene", texture: "/assets/cooking_booth.png", x: 3420, accent: 0xffd37b, icon: "ครัว" },
  { key: "balloon", label: "ยิงลูกโป่ง", scene: "BalloonShootScene", texture: "/assets/balloon_booth.png", x: 4120, accent: 0xff79c6, icon: "โป่ง" },
  { key: "doll", label: "ยิงตุ๊กตา", scene: "DollGameScene", texture: "/assets/doll_booth.png", x: 4820, accent: 0x9ed8ff, icon: "ตุ๊กตา" },
  { key: "flower", label: "ร้อยมาลัย", scene: "FlowerGameScene", texture: "/assets/flower_booth.png", x: 5520, accent: 0xff9cb9, icon: "ดอก" },
  { key: "haunted", label: "บ้านผี", scene: "HauntedHouseScene", texture: "/assets/haunted_booth.png", x: 6220, accent: 0xb3a2ff, icon: "ผี" },
  { key: "tug", label: "ชักเย่อ", scene: "TugOfWarScene", texture: "/assets/tug_booth.png", x: 6920, accent: 0x87ffb0, icon: "ทีม" },
];

const BOOTH_THUMBNAIL_LAYOUT = {
  horse: { x: 28, y: 10, scale: 0.115 },
  fish: { x: 24, y: 6, scale: 0.16 },
};

export default class FestivalMapScene extends Phaser.Scene {
  constructor() {
    super({ key: "FestivalMapScene" });
    this.onEnterGame = null;
    this.entering = false;
    this.dragging = false;
    this.boothStates = {};
    this.boothCards = {};
  }

  init(data = {}) {
    this.onEnterGame = data?.onEnterGame ?? null;
    this.entering = false;
    this.boothStates = data?.boothStates ?? {};
  }

  preload() {
    FESTIVAL_BOOTHS.forEach((booth) => {
      const textureKey = `booth-${booth.key}`;
      if (!this.textures.exists(textureKey)) {
        this.load.image(textureKey, booth.texture);
      }
    });
  }

  create() {
    const { width, height } = this.scale;
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, height);

    this.drawNightFestivalBackground(width, height);

    const cam = this.cameras.main;
    cam.setBackgroundColor("#0a1028");
    cam.setBounds(0, 0, WORLD_WIDTH, height);
    cam.scrollX = 0;

    this.boothContainers = FESTIVAL_BOOTHS.map((booth, index) =>
      this.createBoothCard(booth, height - 172 - (index % 2 === 0 ? 0 : 10)),
    );
    this.applyMapData({ boothStates: this.boothStates });

    this.createMapHints(width, height);
    this.installCameraControls();

    this.events.once("shutdown", () => {
      this.input.removeAllListeners();
    });
  }

  drawNightFestivalBackground(width, height) {
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x06112b, 0x0b1740, 0x16245f, 0x09122b, 1);
    sky.fillRect(0, 0, WORLD_WIDTH, height);

    const moon = this.add.circle(420, 120, 52, 0xfff3c4, 0.95).setScrollFactor(0.2);
    moon.setBlendMode(Phaser.BlendModes.SCREEN);
    this.add.circle(442, 102, 18, 0x09122b, 0.55).setScrollFactor(0.2);
    this.add.circle(420, 120, 78, 0xfff3c4, 0.12).setScrollFactor(0.2);

    for (let i = 0; i < 110; i += 1) {
      const star = this.add.circle(
        Phaser.Math.Between(20, WORLD_WIDTH - 20),
        Phaser.Math.Between(18, Math.floor(height * 0.42)),
        Phaser.Math.Between(1, 3),
        i % 6 === 0 ? 0xffd97a : 0xffffff,
        Phaser.Math.FloatBetween(0.55, 1),
      );
      star.setScrollFactor(0.1 + (i % 5) * 0.05);
      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.25, 0.9),
        duration: Phaser.Math.Between(900, 2200),
        yoyo: true,
        repeat: -1,
      });
    }

    this.drawMountainRange(height);
    this.drawLanternLines(height);
    this.drawGroundAndLights(height);
    this.drawFerrisWheel(height);
  }

  drawMountainRange(height) {
    const far = this.add.graphics();
    far.fillStyle(0x101a3d, 0.85);
    far.beginPath();
    far.moveTo(0, height * 0.58);
    for (let x = 0; x <= WORLD_WIDTH + 200; x += 220) {
      far.lineTo(x + 110, height * Phaser.Math.FloatBetween(0.3, 0.54));
      far.lineTo(x + 220, height * 0.58);
    }
    far.lineTo(WORLD_WIDTH, height);
    far.lineTo(0, height);
    far.closePath();
    far.fillPath();

    const near = this.add.graphics();
    near.fillStyle(0x1b2554, 0.94);
    near.beginPath();
    near.moveTo(0, height * 0.69);
    for (let x = 0; x <= WORLD_WIDTH + 260; x += 260) {
      near.lineTo(x + 130, height * Phaser.Math.FloatBetween(0.45, 0.67));
      near.lineTo(x + 260, height * 0.69);
    }
    near.lineTo(WORLD_WIDTH, height);
    near.lineTo(0, height);
    near.closePath();
    near.fillPath();
  }

  drawLanternLines(height) {
    for (let row = 0; row < 2; row += 1) {
      const y = 110 + row * 72;
      const rope = this.add.graphics();
      rope.lineStyle(3, 0x26110a, 0.85);
      rope.beginPath();
      rope.moveTo(0, y);
      for (let x = 0; x <= WORLD_WIDTH; x += 140) {
        rope.lineTo(x, y + Math.sin((x / 300) + row) * 16);
      }
      rope.strokePath();

      for (let x = 40; x < WORLD_WIDTH; x += 170) {
        const ly = y + Math.sin((x / 300) + row) * 16 + 20;
        this.add.line(x, ly - 14, 0, 0, 0, 14, 0x2d130b, 0.9).setLineWidth(2);
        const lantern = this.add.container(x, ly);
        lantern.add(this.add.ellipse(0, 0, 30, 40, row === 0 ? 0xff8c70 : 0xffc65e, 0.95));
        lantern.add(this.add.ellipse(0, 5, 20, 22, 0xfff1bf, 0.32));
        lantern.add(this.add.rectangle(0, -22, 8, 4, 0x5a2a14, 1));
        lantern.add(this.add.rectangle(0, 22, 10, 4, 0x5a2a14, 1));
        lantern.add(this.add.ellipse(0, 0, 52, 58, row === 0 ? 0xff9160 : 0xffd973, 0.11));
      }
    }
  }

  drawGroundAndLights(height) {
    const ground = this.add.graphics();
    ground.fillStyle(0x2d190c, 1);
    ground.fillRect(0, height - 170, WORLD_WIDTH, 170);
    ground.fillStyle(0x422411, 1);
    ground.fillRect(0, height - 144, WORLD_WIDTH, 38);
    ground.fillStyle(0x5b3517, 1);
    ground.fillRect(0, height - 106, WORLD_WIDTH, 106);

    for (let x = 0; x < WORLD_WIDTH; x += 80) {
      const light = this.add.circle(x + 30, height - 124 + (x % 3) * 2, 4, 0xffe08d, 0.9);
      this.add.circle(light.x, light.y, 14, 0xffe08d, 0.08);
    }
  }

  drawFerrisWheel(height) {
    const wheel = this.add.container(1100, height - 265);
    const gfx = this.add.graphics();
    gfx.lineStyle(4, 0xb3c7ff, 0.4);
    gfx.strokeCircle(0, 0, 92);
    gfx.strokeCircle(0, 0, 68);
    for (let i = 0; i < 10; i += 1) {
      const angle = Phaser.Math.DegToRad(i * 36);
      gfx.lineBetween(0, 0, Math.cos(angle) * 92, Math.sin(angle) * 92);
      const bx = Math.cos(angle) * 92;
      const by = Math.sin(angle) * 92;
      gfx.fillStyle(i % 2 === 0 ? 0xffb56b : 0x8ac8ff, 0.9);
      gfx.fillRoundedRect(bx - 10, by - 8, 20, 16, 4);
      gfx.fillStyle(0xfff1a6, 0.22);
      gfx.fillCircle(bx, by, 15);
    }
    gfx.lineStyle(8, 0x6a749c, 0.5);
    gfx.lineBetween(-40, 100, 0, 0);
    gfx.lineBetween(40, 100, 0, 0);
    gfx.lineBetween(-18, 100, 0, 0);
    gfx.lineBetween(18, 100, 0, 0);
    wheel.add(gfx);
    wheel.setAlpha(0.62);
  }

  createMapHints(width, height) {
    const title = this.add.text(24, 22, "Night Festival", {
      fontFamily: "Kanit",
      fontSize: "34px",
      fontStyle: "bold",
      color: "#fff4cf",
      stroke: "#261003",
      strokeThickness: 6,
    }).setScrollFactor(0).setDepth(20);

    const subtitle = this.add.text(26, 62, "ลากเพื่อเลื่อนแมพ หรือคลิกที่ซุ้มเพื่อเข้าเล่น", {
      fontFamily: "Kanit",
      fontSize: "18px",
      color: "#ffe9bb",
      backgroundColor: "rgba(17,9,4,0.35)",
      padding: { left: 12, right: 12, top: 6, bottom: 6 },
    }).setScrollFactor(0).setDepth(20);

    const pill = this.add.text(width - 24, 24, "เลื่อนซ้าย ขวา", {
      fontFamily: "Kanit",
      fontSize: "18px",
      color: "#fff6d7",
      backgroundColor: "rgba(17,9,4,0.45)",
      padding: { left: 14, right: 14, top: 6, bottom: 6 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(20);

    this.hintUi = [title, subtitle, pill];
  }

  installCameraControls() {
    const cam = this.cameras.main;

    this.input.on("pointerdown", () => {
      this.dragging = true;
    });

    this.input.on("pointerup", () => {
      this.dragging = false;
    });

    this.input.on("pointermove", (pointer) => {
      if (!this.dragging || !pointer.isDown) return;
      cam.scrollX = Phaser.Math.Clamp(
        cam.scrollX - pointer.velocity.x / 8,
        0,
        WORLD_WIDTH - this.scale.width,
      );
    });

    this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
      cam.scrollX = Phaser.Math.Clamp(
        cam.scrollX + deltaX + deltaY * 0.35,
        0,
        WORLD_WIDTH - this.scale.width,
      );
    });

    const keys = this.input.keyboard?.createCursorKeys();
    this.events.on("update", () => {
      if (keys?.right?.isDown) {
        cam.scrollX = Phaser.Math.Clamp(cam.scrollX + 12, 0, WORLD_WIDTH - this.scale.width);
      }
      if (keys?.left?.isDown) {
        cam.scrollX = Phaser.Math.Clamp(cam.scrollX - 12, 0, WORLD_WIDTH - this.scale.width);
      }
    });
  }

  createBoothCard(booth, y) {
    const container = this.add.container(booth.x, y);

    const glow = this.add.ellipse(0, 8, 280, 108, booth.accent, 0.12);
    const poleLeft = this.add.rectangle(-88, 28, 12, 168, 0x4e2913, 1);
    const poleRight = this.add.rectangle(88, 28, 12, 168, 0x4e2913, 1);
    const counter = this.add.rectangle(0, 78, 250, 116, 0x7a4320, 1);
    counter.setStrokeStyle(4, 0xf4c983, 0.55);

    const awning = this.add.graphics();
    awning.fillStyle(0xffe0a5, 1);
    awning.fillRoundedRect(-140, -74, 280, 86, 20);
    for (let i = 0; i < 7; i += 1) {
      awning.fillStyle(i % 2 === 0 ? booth.accent : 0xfff2d0, 1);
      awning.fillRoundedRect(-132 + i * 38, -66, 30, 70, 10);
    }
    awning.fillStyle(0x47220d, 0.95);
    awning.fillRoundedRect(-150, -90, 300, 22, 10);

    const sign = this.add.rectangle(0, -108, 196, 50, 0x2f1609, 0.92);
    sign.setStrokeStyle(3, booth.accent, 0.95);
    const signText = this.add.text(0, -108, booth.label, {
      fontFamily: "Kanit",
      fontSize: "24px",
      fontStyle: "bold",
      color: "#fff5dd",
    }).setOrigin(0.5);

    const iconText = this.add.text(-82, -14, booth.icon, {
      fontFamily: "Kanit",
      fontSize: "26px",
      color: "#fff3c2",
      backgroundColor: "rgba(34,16,8,0.55)",
      padding: { left: 10, right: 10, top: 6, bottom: 6 },
    }).setOrigin(0.5);

    const thumbLayout = BOOTH_THUMBNAIL_LAYOUT[booth.key] ?? { x: 18, y: -6, scale: 0.17 };
    const thumbnail = this.add.image(thumbLayout.x, thumbLayout.y, `booth-${booth.key}`);
    thumbnail.setScale(thumbLayout.scale);
    thumbnail.setAngle(Phaser.Math.Between(-2, 2));

    const lamps = [
      this.add.circle(-105, -48, 9, 0xfff0a5, 1),
      this.add.circle(105, -48, 9, 0xfff0a5, 1),
    ];
    lamps.forEach((lamp) => this.add.circle(lamp.x, lamp.y, 22, 0xffe38d, 0.13));

    const button = this.add.rectangle(0, 155, 170, 42, 0x20100a, 0.85);
    button.setStrokeStyle(2, booth.accent, 0.85);
    const buttonText = this.add.text(0, 155, "\u0e40\u0e02\u0e49\u0e32\u0e40\u0e25\u0e48\u0e19", {
      fontFamily: "Kanit",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#fff8e4",
    }).setOrigin(0.5);
    const statePill = this.add.text(0, 116, "", {
      fontFamily: "Kanit",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#fff8e4",
      backgroundColor: "rgba(24,14,8,0.72)",
      padding: { left: 12, right: 12, top: 5, bottom: 5 },
    }).setOrigin(0.5);
    const lockOverlay = this.add.rectangle(0, 24, 252, 214, 0x06060a, 0.56);
    const lockIcon = this.add.text(0, 16, "\u0e25\u0e47\u0e2d\u0e01", {
      fontFamily: "Kanit",
      fontSize: "30px",
      fontStyle: "bold",
      color: "#fff0c8",
    }).setOrigin(0.5);
    const completeBadge = this.add.text(0, 18, "\u0e1c\u0e48\u0e32\u0e19\u0e41\u0e25\u0e49\u0e27", {
      fontFamily: "Kanit",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#083b22",
      backgroundColor: "#b8ffd1",
      padding: { left: 12, right: 12, top: 6, bottom: 6 },
    }).setOrigin(0.5);

    container.add([
      glow,
      poleLeft,
      poleRight,
      counter,
      awning,
      sign,
      signText,
      iconText,
      thumbnail,
      ...lamps,
      statePill,
      button,
      buttonText,
      lockOverlay,
      lockIcon,
      completeBadge,
    ]);

    container.setSize(320, 360);
    const hit = new Phaser.Geom.Rectangle(-160, -130, 320, 320);
    container.setInteractive(hit, Phaser.Geom.Rectangle.Contains);

    container.on("pointerover", () => {
      this.tweens.add({
        targets: [container],
        y: y - 10,
        duration: 180,
        ease: "Sine.Out",
      });
      this.tweens.add({
        targets: [thumbnail],
        scale: thumbLayout.scale + 0.02,
        duration: 180,
      });
    });

    container.on("pointerout", () => {
      this.tweens.add({
        targets: [container],
        y,
        duration: 180,
        ease: "Sine.Out",
      });
      this.tweens.add({
        targets: [thumbnail],
        scale: thumbLayout.scale,
        duration: 180,
      });
    });

    container.on("pointerdown", () => {
      if (this.entering) return;
      const boothState = this.boothStates?.[booth.scene] ?? "locked";
      if (boothState !== "unlocked") return;
      this.entering = true;
      this.onEnterGame?.(booth.scene);
    });

    this.boothCards[booth.scene] = {
      container,
      thumbnail,
      button,
      buttonText,
      statePill,
      lockOverlay,
      lockIcon,
      completeBadge,
    };
    this.applyBoothState(booth.scene, this.boothStates?.[booth.scene] ?? "locked");

    return container;
  }

  applyMapData(data = {}) {
    this.boothStates = data?.boothStates ?? {};
    FESTIVAL_BOOTHS.forEach((booth) => {
      this.applyBoothState(booth.scene, this.boothStates?.[booth.scene] ?? "locked");
    });
  }

  applyBoothState(sceneKey, state) {
    const card = this.boothCards?.[sceneKey];
    if (!card) return;

    const unlocked = state === "unlocked";
    const completed = state === "completed";
    const locked = !unlocked && !completed;

    card.thumbnail.setAlpha(locked ? 0.3 : 1);
    card.button.setFillStyle(
      completed ? 0x1a6b46 : locked ? 0x3d3130 : 0x20100a,
      completed ? 0.95 : 0.85,
    );
    card.buttonText.setText(
      completed
        ? "\u0e1c\u0e48\u0e32\u0e19\u0e41\u0e25\u0e49\u0e27"
        : locked
          ? "\u0e25\u0e47\u0e2d\u0e01"
          : "\u0e40\u0e02\u0e49\u0e32\u0e40\u0e25\u0e48\u0e19",
    );
    card.statePill.setText(
      completed
        ? "\u0e40\u0e01\u0e47\u0e1a\u0e04\u0e30\u0e41\u0e19\u0e19\u0e41\u0e25\u0e49\u0e27"
        : unlocked
          ? "\u0e1e\u0e23\u0e49\u0e2d\u0e21\u0e40\u0e25\u0e48\u0e19"
          : "\u0e15\u0e49\u0e2d\u0e07\u0e40\u0e04\u0e25\u0e35\u0e22\u0e23\u0e4c\u0e0b\u0e38\u0e49\u0e21\u0e01\u0e48\u0e2d\u0e19\u0e2b\u0e19\u0e49\u0e32",
    );
    card.lockOverlay.setVisible(locked);
    card.lockIcon.setVisible(locked);
    card.completeBadge.setVisible(completed);
  }
}
