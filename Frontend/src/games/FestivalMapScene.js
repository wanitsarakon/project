import Phaser from "phaser";

const BOOTH_SPACING = 620;
const BOOTH_Y = 500;
const WORLD_MARGIN = 220;
const STALL_WIDTH = 380;
const STALL_HEIGHT = 380;

export const FESTIVAL_BOOTHS = [
  { key: "fish", label: "ชั้นตักปลา", subtitle: "ช้อนปลาไวให้ได้มากที่สุด", scene: "FishScoopingScene", texture: "/assets/fish_booth.png", accent: 0x57d2ff, trim: 0x0e778b, awningAlt: 0xfff4d8 },
  { key: "horse", label: "ขี่ม้าส่งของ", subtitle: "ควบม้าฝ่าด่านเก็บของให้ไว", scene: "HorseDeliveryScene", texture: "/assetsHorse/horse.png", accent: 0xffc75c, trim: 0x9e5a12, awningAlt: 0xfff2d2 },
  { key: "boxing", label: "ซุ้มมวยไทย", subtitle: "จับจังหวะแล้วตอบให้ถูก", scene: "BoxingGameScene", texture: "/assets/boxing_booth.png", accent: 0xff8f84, trim: 0xc24736, awningAlt: 0xffece9 },
  { key: "cooking", label: "ซุ้มทำขนม", subtitle: "ทำตามสูตรให้ครบทุกขั้นตอน", scene: "CookingGameScene", texture: "/assets/cooking_booth.png", accent: 0xffc772, trim: 0xd06f1c, awningAlt: 0xfff1d8 },
  { key: "balloon", label: "ซุ้มยิงลูกโป่ง", subtitle: "เล็งดี ยิงไว ทำคอมโบให้ต่อเนื่อง", scene: "BalloonShootScene", texture: "/assets/balloon_booth.png", accent: 0xff78cf, trim: 0xc33479, awningAlt: 0xffedf9 },
  { key: "doll", label: "ซุ้มยิงตุ๊กตา", subtitle: "เล็งเป้าให้แม่น คว้ารางวัลกลับบ้าน", scene: "DollGameScene", texture: "/assets/doll_booth.png", accent: 0x9fc6ff, trim: 0x4167c4, awningAlt: 0xedf4ff },
  { key: "flower", label: "ซุ้มร้อยมาลัย", subtitle: "ร้อยพวงมาลัยตามใจลูกค้า", scene: "FlowerGameScene", texture: "/assets/flower_booth.png", accent: 0xffa9c6, trim: 0xc4507d, awningAlt: 0xffeef4 },
  { key: "haunted", label: "บ้านผี", subtitle: "ช่วยวิญญาณให้พบของที่ตามหา", scene: "HauntedHouseScene", texture: "/assets/haunted_booth.png", accent: 0xbda7ff, trim: 0x6241bd, awningAlt: 0xf2eeff },
  { key: "tug", label: "ซุ้มชักเย่อ", subtitle: "ดวลแรงใจให้ทีมเป็นผู้ชนะ", scene: "TugOfWarScene", texture: "/assets/tug_booth.png", accent: 0x8cf2b0, trim: 0x199653, awningAlt: 0xeaffef },
  { key: "worship", label: "ซุ้มไหว้พระขอพร", subtitle: "พิธีปิดท้าย เสี่ยงเซียมซีรับพรกลับบ้าน", scene: "WorshipBoothScene", texture: "/assets/worship_booth.png", accent: 0xffec9e, trim: 0xb78019, awningAlt: 0xfff8e1 },
];

const BOOTH_THUMBNAIL_LAYOUT = {
  fish: { x: 0, y: 56, scale: 0.24 },
  horse: { x: 0, y: 58, scale: 0.195 },
  boxing: { x: 0, y: 58, scale: 0.245 },
  cooking: { x: 0, y: 60, scale: 0.24 },
  balloon: { x: 0, y: 58, scale: 0.245 },
  doll: { x: 0, y: 58, scale: 0.245 },
  flower: { x: 0, y: 60, scale: 0.24 },
  haunted: { x: 0, y: 56, scale: 0.245 },
  tug: { x: 0, y: 60, scale: 0.24 },
  worship: { x: 0, y: 54, scale: 0.245 },
};

const FIRST_X = WORLD_MARGIN + STALL_WIDTH / 2;
const LAST_X = FIRST_X + BOOTH_SPACING * (FESTIVAL_BOOTHS.length - 1);
const WORLD_WIDTH = LAST_X + STALL_WIDTH / 2 + WORLD_MARGIN;

export default class FestivalMapScene extends Phaser.Scene {
  constructor() {
    super({ key: "FestivalMapScene" });
    this.onEnterGame = null;
    this.entering = false;
    this.boothStates = {};
    this.boothCards = {};
    this.dragStartX = 0;
    this.didPan = false;
  }

  init(data = {}) {
    this.onEnterGame = data?.onEnterGame ?? null;
    this.entering = false;
    this.boothStates = data?.boothStates ?? {};
    this.dragStartX = 0;
    this.didPan = false;
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

    this.drawNightFestivalBackground(height);

    const cam = this.cameras.main;
    cam.setBackgroundColor("#081022");
    cam.setBounds(0, 0, WORLD_WIDTH, height);
    cam.scrollX = 0;

    this.boothContainers = FESTIVAL_BOOTHS.map((booth, index) =>
      this.createBoothCard(booth, FIRST_X + index * BOOTH_SPACING, BOOTH_Y + (index % 2 === 0 ? 0 : 8)),
    );
    this.applyMapData({ boothStates: this.boothStates });
    this.createMapHints(width);
    this.installCameraControls();
    this.panToNextUnlocked(false);

    this.scale.on("resize", this.handleResize, this);
    this.events.once("shutdown", () => {
      this.input.removeAllListeners();
      this.scale.off("resize", this.handleResize, this);
    });
  }

  handleResize(gameSize) {
    const { width } = gameSize;
    this.hintUi?.pill?.setX(width - 24);
    this.panToNextUnlocked(false);
  }

  drawNightFestivalBackground(height) {
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x06102a, 0x0a1840, 0x11255e, 0x050d20, 1);
    sky.fillRect(0, 0, WORLD_WIDTH, height);

    this.add.circle(420, 96, 50, 0xffeeae, 0.96).setScrollFactor(0.08);
    this.add.circle(420, 96, 82, 0xffd870, 0.15).setScrollFactor(0.08);
    this.add.circle(446, 78, 16, 0x071126, 0.45).setScrollFactor(0.08);

    for (let i = 0; i < 160; i += 1) {
      const star = this.add.circle(
        Phaser.Math.Between(14, WORLD_WIDTH - 14),
        Phaser.Math.Between(12, 260),
        Phaser.Math.Between(1, 3),
        i % 7 === 0 ? 0xffd872 : 0xffffff,
        Phaser.Math.FloatBetween(0.45, 1),
      );
      star.setScrollFactor(0.04 + (i % 5) * 0.03);
      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.25, 0.95),
        duration: Phaser.Math.Between(1000, 2400),
        yoyo: true,
        repeat: -1,
      });
    }

    this.drawFireworks();
    this.drawLanternLines();
    this.drawFestivalBackdrop(height);
    this.drawGround(height);
  }

  drawFireworks() {
    const bursts = [
      [560, 150, 0xffc857],
      [1320, 180, 0xff8fa3],
      [2240, 130, 0x81d4ff],
      [3720, 170, 0xffd36b],
      [4920, 150, 0xff9ac7],
      [6100, 165, 0xbca8ff],
    ];

    bursts.forEach(([x, y, color]) => {
      const burst = this.add.graphics();
      burst.lineStyle(2, color, 0.85);
      for (let i = 0; i < 14; i += 1) {
        const angle = Phaser.Math.DegToRad((360 / 14) * i);
        burst.lineBetween(x, y, x + Math.cos(angle) * 44, y + Math.sin(angle) * 44);
      }
      this.add.circle(x, y, 62, color, 0.05);
      burst.setAlpha(0.8);
    });
  }

  drawLanternLines() {
    const rows = [76, 138];
    rows.forEach((y, row) => {
      const rope = this.add.graphics();
      rope.lineStyle(3, 0x2d1408, 0.86);
      rope.beginPath();
      rope.moveTo(0, y);
      for (let x = 0; x <= WORLD_WIDTH; x += 140) {
        rope.lineTo(x, y + Math.sin((x / 280) + row) * 16);
      }
      rope.strokePath();

      const colors = [0xffdd69, 0xff6d65, 0x5fd8ff, 0xa7ff82, 0xffb36b];
      for (let x = 40; x < WORLD_WIDTH; x += 120) {
        const ly = y + Math.sin((x / 280) + row) * 16 + 12;
        const color = colors[(x / 120) % colors.length];
        this.add.line(x, ly - 12, 0, 0, 0, 12, 0x34190c, 0.9).setLineWidth(2);
        this.add.circle(x, ly, 7, color, 1);
        this.add.circle(x, ly, 16, color, 0.16);
      }
    });
  }

  drawFestivalBackdrop(height) {
    const ridge = this.add.graphics();
    ridge.fillStyle(0x111c46, 0.92);
    ridge.beginPath();
    ridge.moveTo(0, height - 270);
    for (let x = 0; x <= WORLD_WIDTH + 200; x += 240) {
      ridge.lineTo(x + 120, Phaser.Math.Between(height - 430, height - 300));
      ridge.lineTo(x + 240, height - 270);
    }
    ridge.lineTo(WORLD_WIDTH, height);
    ridge.lineTo(0, height);
    ridge.closePath();
    ridge.fillPath();

    const booths = this.add.graphics();
    for (let x = -80; x < WORLD_WIDTH + 160; x += 290) {
      booths.fillStyle(0x402111, 0.96);
      booths.fillRoundedRect(x, height - 276, 190, 100, 18);
      booths.fillStyle(0xffe4af, 1);
      booths.fillRoundedRect(x - 6, height - 282, 202, 18, 10);
      for (let i = 0; i < 5; i += 1) {
        booths.fillStyle(i % 2 === 0 ? 0xff9948 : 0xfff0cb, 1);
        booths.fillTriangle(
          x + 8 + i * 38,
          height - 264,
          x + 46 + i * 38,
          height - 264,
          x + 27 + i * 38,
          height - 222,
        );
      }
      booths.fillStyle(0xffcb6b, 0.4);
      booths.fillRect(x + 18, height - 248, 154, 48);
    }

    const temple = this.add.graphics();
    temple.fillStyle(0x4f260a, 0.9);
    temple.fillRect(WORLD_WIDTH - 710, height - 355, 220, 150);
    temple.fillStyle(0xf1ae35, 0.95);
    temple.fillTriangle(WORLD_WIDTH - 730, height - 355, WORLD_WIDTH - 600, height - 470, WORLD_WIDTH - 470, height - 355);
    temple.fillTriangle(WORLD_WIDTH - 700, height - 328, WORLD_WIDTH - 600, height - 430, WORLD_WIDTH - 500, height - 328);
    temple.fillTriangle(WORLD_WIDTH - 678, height - 296, WORLD_WIDTH - 600, height - 382, WORLD_WIDTH - 522, height - 296);
    temple.fillStyle(0xffdc7b, 0.88);
    temple.fillRect(WORLD_WIDTH - 618, height - 355, 36, 150);
    temple.fillRect(WORLD_WIDTH - 556, height - 355, 36, 150);
    temple.fillRect(WORLD_WIDTH - 494, height - 355, 36, 150);
    temple.fillRect(WORLD_WIDTH - 432, height - 355, 36, 150);

    const ferris = this.add.container(300, height - 330);
    const wheel = this.add.graphics();
    wheel.lineStyle(4, 0xc8d4ff, 0.4);
    wheel.strokeCircle(0, 0, 86);
    for (let i = 0; i < 10; i += 1) {
      const angle = Phaser.Math.DegToRad(i * 36);
      wheel.lineBetween(0, 0, Math.cos(angle) * 86, Math.sin(angle) * 86);
      wheel.fillStyle(i % 2 === 0 ? 0xffc65a : 0x6fd3ff, 0.92);
      wheel.fillRoundedRect(Math.cos(angle) * 86 - 8, Math.sin(angle) * 86 - 8, 16, 16, 4);
    }
    wheel.lineStyle(7, 0x5f6f8c, 0.5);
    wheel.lineBetween(-30, 96, 0, 0);
    wheel.lineBetween(30, 96, 0, 0);
    ferris.add(wheel);
    ferris.setAlpha(0.65);
  }

  drawGround(height) {
    const road = this.add.graphics();
    road.fillStyle(0x2e1a0d, 1);
    road.fillRect(0, height - 210, WORLD_WIDTH, 210);
    road.fillStyle(0x72431c, 0.96);
    road.fillRect(0, height - 170, WORLD_WIDTH, 170);
    road.fillStyle(0x8a5324, 0.86);
    road.fillRect(0, height - 150, WORLD_WIDTH, 104);

    for (let x = 0; x < WORLD_WIDTH; x += 90) {
      this.add.circle(x + 28, height - 160 + ((x / 90) % 3) * 4, 4, 0xffd66d, 0.9);
      this.add.circle(x + 28, height - 160 + ((x / 90) % 3) * 4, 14, 0xffd66d, 0.08);
    }
  }

  createMapHints(width) {
    const title = this.add.text(26, 18, "งานวัดกลางคืน", {
      fontFamily: "Kanit",
      fontSize: "30px",
      fontStyle: "bold",
      color: "#fff0c6",
      stroke: "#3a1808",
      strokeThickness: 6,
    }).setScrollFactor(0).setDepth(20);

    const subtitle = this.add.text(28, 56, "ลากเพื่อเลื่อนดูซุ้ม แล้วเล่นตามลำดับเพื่อปลดล็อกซุ้มถัดไป", {
      fontFamily: "Kanit",
      fontSize: "16px",
      color: "#ffe7b1",
      backgroundColor: "rgba(23,10,6,0.45)",
      padding: { left: 10, right: 10, top: 5, bottom: 5 },
    }).setScrollFactor(0).setDepth(20);

    const pill = this.add.text(width - 24, 24, "เลื่อนซ้าย-ขวา", {
      fontFamily: "Kanit",
      fontSize: "18px",
      color: "#fff6d7",
      backgroundColor: "rgba(23,10,6,0.55)",
      padding: { left: 14, right: 14, top: 6, bottom: 6 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(20);

    this.hintUi = { title, subtitle, pill };
  }

  installCameraControls() {
    const cam = this.cameras.main;
    const clampScroll = (scrollX) =>
      Phaser.Math.Clamp(scrollX, 0, Math.max(0, WORLD_WIDTH - this.scale.width));

    this.input.on("pointerdown", (pointer) => {
      this.dragStartX = pointer.x;
      this.didPan = false;
      this.dragging = true;
    });

    this.input.on("pointerup", () => {
      this.dragging = false;
      window.setTimeout(() => {
        this.didPan = false;
      }, 0);
    });

    this.input.on("pointermove", (pointer) => {
      if (!this.dragging || !pointer.isDown) return;
      const delta = Math.abs(pointer.x - this.dragStartX);
      if (delta > 8) this.didPan = true;
      cam.scrollX = clampScroll(cam.scrollX - pointer.velocity.x / 7);
    });

    this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
      cam.scrollX = clampScroll(cam.scrollX + deltaX + deltaY * 0.3);
    });

    const keys = this.input.keyboard?.createCursorKeys();
    this.events.on("update", () => {
      if (keys?.right?.isDown) cam.scrollX = clampScroll(cam.scrollX + 10);
      if (keys?.left?.isDown) cam.scrollX = clampScroll(cam.scrollX - 10);
    });
  }

  createBoothCard(booth, x, y) {
    const container = this.add.container(x, y);

    const baseGlow = this.add.ellipse(0, 108, 390, 84, booth.accent, 0.18);
    const stageBase = this.add.rectangle(0, 152, 352, 46, 0x6d3a17, 1);
    stageBase.setStrokeStyle(4, 0xffdf9c, 0.45);
    const bunting = this.add.graphics();
    for (let i = 0; i < 10; i += 1) {
      bunting.fillStyle(i % 2 === 0 ? booth.accent : 0xffd387, 1);
      bunting.fillTriangle(-158 + i * 32, 122, -126 + i * 32, 122, -142 + i * 32, 148);
    }

    const postLeft = this.add.rectangle(-138, 40, 16, 208, 0x5a2d12, 1);
    const postRight = this.add.rectangle(138, 40, 16, 208, 0x5a2d12, 1);
    const counter = this.add.rectangle(0, 104, 316, 122, 0x7e4721, 1);
    counter.setStrokeStyle(4, 0xffdf9c, 0.82);

    const canopyTop = this.add.graphics();
    canopyTop.fillStyle(booth.trim, 1);
    canopyTop.fillRoundedRect(-188, -134, 376, 30, 14);
    canopyTop.fillStyle(booth.awningAlt, 1);
    canopyTop.fillRoundedRect(-176, -106, 352, 112, 22);
    for (let i = 0; i < 8; i += 1) {
      canopyTop.fillStyle(i % 2 === 0 ? booth.accent : booth.awningAlt, 1);
      canopyTop.fillTriangle(-168 + i * 44, -96, -124 + i * 44, -96, -146 + i * 44, -22);
    }

    const sign = this.add.rectangle(0, -126, 248, 56, 0x431d0b, 0.96);
    sign.setStrokeStyle(4, booth.accent, 1);
    const signText = this.add.text(0, -126, booth.label, {
      fontFamily: "Kanit",
      fontSize: "23px",
      fontStyle: "bold",
      color: "#fff7e5",
      align: "center",
      wordWrap: { width: 232 },
    }).setOrigin(0.5);

    const subLabel = this.add.text(0, -82, booth.subtitle, {
      fontFamily: "Kanit",
      fontSize: "13px",
      color: "#ffeec7",
      align: "center",
      wordWrap: { width: 266 },
    }).setOrigin(0.5);

    const frame = this.add.rectangle(0, 34, 278, 156, 0x2a160d, 0.48);
    frame.setStrokeStyle(3, 0xffd997, 0.72);

    const thumbLayout = BOOTH_THUMBNAIL_LAYOUT[booth.key] ?? { x: 0, y: 58, scale: 0.23 };
    const thumbnail = this.add.image(thumbLayout.x, thumbLayout.y, `booth-${booth.key}`);
    thumbnail.setScale(thumbLayout.scale);

    const lights = [
      this.add.circle(-130, -36, 10, 0xffefb1, 1),
      this.add.circle(130, -36, 10, 0xffefb1, 1),
      this.add.circle(-92, -74, 6, booth.accent, 0.95),
      this.add.circle(92, -74, 6, booth.accent, 0.95),
    ];
    lights.forEach((lamp) => this.add.circle(lamp.x, lamp.y, lamp.radius + 12, lamp.fillColor, 0.12));

    const decor = this.createBoothDecorations(booth);

    const statePill = this.add.text(0, 118, "", {
      fontFamily: "Kanit",
      fontSize: "17px",
      fontStyle: "bold",
      color: "#fff7e5",
      backgroundColor: "rgba(34,15,7,0.84)",
      padding: { left: 12, right: 12, top: 5, bottom: 5 },
    }).setOrigin(0.5);

    const actionButton = this.add.rectangle(0, 178, 184, 44, 0x261109, 0.92);
    actionButton.setStrokeStyle(3, booth.accent, 1);
    const actionText = this.add.text(0, 178, "เข้าเล่น", {
      fontFamily: "Kanit",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#fff7e5",
    }).setOrigin(0.5);

    const lockOverlay = this.add.rectangle(0, 46, 304, 176, 0x050507, 0.46);
    const lockText = this.add.text(0, 38, "ล็อก", {
      fontFamily: "Kanit",
      fontSize: "30px",
      fontStyle: "bold",
      color: "#fff0cd",
    }).setOrigin(0.5);
    const completeBadge = this.add.text(0, 42, booth.key === "worship" ? "ขอพรแล้ว" : "ผ่านแล้ว", {
      fontFamily: "Kanit",
      fontSize: "22px",
      fontStyle: "bold",
      color: "#0a4c25",
      backgroundColor: "#b5ffd0",
      padding: { left: 14, right: 14, top: 6, bottom: 6 },
    }).setOrigin(0.5);

    container.add([
      baseGlow,
      stageBase,
      bunting,
      postLeft,
      postRight,
      counter,
      canopyTop,
      sign,
      signText,
      subLabel,
      frame,
      thumbnail,
      ...decor,
      ...lights,
      statePill,
      actionButton,
      actionText,
      lockOverlay,
      lockText,
      completeBadge,
    ]);

    container.setSize(STALL_WIDTH, STALL_HEIGHT);
    container.setDepth(10 + Math.round(x / 100));
    container.setInteractive(new Phaser.Geom.Rectangle(-190, -160, 380, 380), Phaser.Geom.Rectangle.Contains);

    container.on("pointerover", () => {
      this.tweens.add({
        targets: [container],
        y: y - 10,
        duration: 180,
        ease: "Sine.Out",
      });
      this.tweens.add({
        targets: thumbnail,
        scale: thumbLayout.scale + 0.015,
        duration: 180,
        ease: "Sine.Out",
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
        targets: thumbnail,
        scale: thumbLayout.scale,
        duration: 180,
        ease: "Sine.Out",
      });
    });

    container.on("pointerup", () => {
      if (this.entering || this.didPan) return;
      const boothState = this.boothStates?.[booth.scene] ?? "locked";
      if (boothState !== "unlocked") return;
      this.entering = true;
      this.onEnterGame?.(booth.scene);
    });

    this.boothCards[booth.scene] = {
      x,
      thumbnail,
      actionButton,
      actionText,
      statePill,
      lockOverlay,
      lockText,
      completeBadge,
    };
    this.applyBoothState(booth.scene, this.boothStates?.[booth.scene] ?? "locked");

    return container;
  }

  createBoothDecorations(booth) {
    const decor = [];
    const palette = [booth.accent, 0xffefb6, 0xffb15e];

    const shelf = this.add.rectangle(0, 92, 248, 10, 0xffddb0, 0.82);
    decor.push(shelf);

    if (booth.key === "fish") {
      const tub = this.add.ellipse(0, 102, 116, 34, 0x4cc8ff, 0.8);
      tub.setStrokeStyle(4, 0xffddb0, 0.9);
      decor.push(tub);
      decor.push(this.add.circle(-26, 98, 10, 0xff8d5e, 1));
      decor.push(this.add.circle(8, 106, 8, 0xffca5f, 1));
      decor.push(this.add.circle(34, 97, 9, 0xff6f61, 1));
    } else if (booth.key === "horse") {
      for (let i = 0; i < 4; i += 1) {
        decor.push(this.add.circle(-44 + i * 28, -2 - (i % 2) * 12, 10, palette[i % palette.length], 0.95));
        decor.push(this.add.line(-44 + i * 28, 12, 0, 0, 0, 28, 0x8a5a1b, 0.85).setLineWidth(2));
      }
    } else if (booth.key === "boxing") {
      for (let i = 0; i < 5; i += 1) {
        const d = this.add.circle(-54 + i * 27, 92, 10, i % 2 === 0 ? 0xffd168 : 0xff876b, 1);
        d.setStrokeStyle(2, 0x7a3412, 0.9);
        decor.push(d);
      }
    } else if (booth.key === "cooking") {
      for (let i = 0; i < 4; i += 1) {
        decor.push(this.add.circle(-48 + i * 32, 96, 12, [0xffcd68, 0xff8d6f, 0x94e08c, 0xffeab2][i], 1));
      }
    } else if (booth.key === "balloon") {
      for (let i = 0; i < 4; i += 1) {
        decor.push(this.add.circle(-48 + i * 30, -8 - (i % 2) * 12, 11, [0xff74a6, 0x78d9ff, 0xffd86d, 0xb685ff][i], 0.95));
        decor.push(this.add.line(-48 + i * 30, 8, 0, 0, 0, 24, 0x805425, 0.8).setLineWidth(2));
      }
    } else if (booth.key === "doll") {
      for (let i = 0; i < 4; i += 1) {
        const body = this.add.circle(-44 + i * 29, 98, 10, [0xffc78f, 0xffa1d6, 0x9fd1ff, 0xffe179][i], 1);
        decor.push(body);
      }
    } else if (booth.key === "flower") {
      for (let i = 0; i < 5; i += 1) {
        const petal = this.add.circle(-56 + i * 28, 96, 11, [0xffb5c9, 0xffe38c, 0xffd6f5, 0xc1ff9e, 0xffc88d][i], 1);
        decor.push(petal);
      }
    } else if (booth.key === "haunted") {
      const lantern = this.add.rectangle(0, 90, 124, 34, 0x49305f, 0.7);
      lantern.setStrokeStyle(2, 0xbca8ff, 0.9);
      decor.push(lantern);
      for (let i = 0; i < 3; i += 1) {
        decor.push(this.add.circle(-32 + i * 32, 90, 7, 0xd9cfff, 0.95));
        decor.push(this.add.circle(-32 + i * 32, 90, 18, 0xd9cfff, 0.12));
      }
    } else if (booth.key === "tug") {
      decor.push(this.add.rectangle(-38, 98, 24, 18, 0xff6f5f, 1));
      decor.push(this.add.rectangle(-8, 98, 24, 18, 0xffd56b, 1));
      decor.push(this.add.rectangle(22, 98, 24, 18, 0x7ce39f, 1));
      decor.push(this.add.line(-60, 98, 0, 0, 120, 0, 0xe7c189, 0.9).setLineWidth(4));
    } else if (booth.key === "worship") {
      const altar = this.add.rectangle(0, 96, 132, 40, 0x7a4a18, 0.95);
      altar.setStrokeStyle(3, 0xffdc94, 0.85);
      decor.push(altar);
      decor.push(this.add.circle(-36, 84, 7, 0xffe8a8, 1));
      decor.push(this.add.circle(36, 84, 7, 0xffe8a8, 1));
      decor.push(this.add.rectangle(0, 82, 18, 26, 0xffd86f, 1));
      decor.push(this.add.circle(0, 70, 10, 0xfff0b7, 0.75));
    }

    return decor;
  }

  applyMapData(data = {}) {
    this.boothStates = data?.boothStates ?? {};
    FESTIVAL_BOOTHS.forEach((booth) => {
      this.applyBoothState(booth.scene, this.boothStates?.[booth.scene] ?? "locked");
    });
    this.panToNextUnlocked();
  }

  applyBoothState(sceneKey, state) {
    const card = this.boothCards?.[sceneKey];
    if (!card) return;

    const unlocked = state === "unlocked";
    const completed = state === "completed";
    const locked = !unlocked && !completed;

    card.thumbnail.setAlpha(locked ? 0.32 : 1);
    card.actionButton.setFillStyle(
      completed ? 0x15663b : locked ? 0x3c302a : 0x261109,
      completed ? 0.96 : 0.92,
    );
    card.actionText.setText(completed ? "ผ่านแล้ว" : locked ? "ล็อก" : "เข้าเล่น");
    card.statePill.setText(
      completed
        ? sceneKey === "WorshipBoothScene"
          ? "ขอพรปิดท้ายแล้ว"
          : "เก็บคะแนนแล้ว"
        : unlocked
          ? sceneKey === "WorshipBoothScene"
            ? "พร้อมปิดท้ายอย่างมงคล"
            : "พร้อมเล่น"
          : "ต้องผ่านซุ้มก่อนหน้า",
    );
    card.lockOverlay.setVisible(locked);
    card.lockText.setVisible(locked);
    card.completeBadge.setVisible(completed);
  }

  panToNextUnlocked(animated = true) {
    const nextBooth =
      FESTIVAL_BOOTHS.find((booth) => this.boothStates?.[booth.scene] === "unlocked")
      || FESTIVAL_BOOTHS.find((booth) => this.boothStates?.[booth.scene] === "completed")
      || FESTIVAL_BOOTHS[0];

    const card = this.boothCards?.[nextBooth?.scene];
    if (!card) return;

    const targetScroll = Phaser.Math.Clamp(
      card.x - this.scale.width / 2,
      0,
      Math.max(0, WORLD_WIDTH - this.scale.width),
    );

    if (!animated) {
      this.cameras.main.scrollX = targetScroll;
      return;
    }

    this.tweens.add({
      targets: this.cameras.main,
      scrollX: targetScroll,
      duration: 480,
      ease: "Sine.Out",
    });
  }
}
