import Phaser from "phaser";

const BOOTH_SPACING = 620;
const BOOTH_Y = 585;
const WORLD_MARGIN = 220;
const STALL_WIDTH = 430;
const STALL_HEIGHT = 430;
const FESTIVAL_STALL_BG = "/assets/festival-stall-bg.png";

export const FESTIVAL_BOOTHS = [
  { key: "fish", label: "เกมตักปลา", subtitle: "ช้อนปลาไวให้ได้มากที่สุด", scene: "FishScoopingScene", texture: "/assets/booth-fish.png", accent: 0x57d2ff, trim: 0x0e778b, awningAlt: 0xfff4d8 },
  { key: "horse", label: "เกมขี่ม้าส่งเมือง", subtitle: "ควบม้าฝ่าด่านเก็บของให้ไว", scene: "HorseDeliveryScene", texture: "/assets/booth-horse.png", accent: 0xffc75c, trim: 0x9e5a12, awningAlt: 0xfff2d2 },
  { key: "boxing", label: "เกมท่ามวย", subtitle: "จับจังหวะแล้วตอบให้ถูก", scene: "BoxingGameScene", texture: "/assets/booth-boxing.png", accent: 0xff8f84, trim: 0xc24736, awningAlt: 0xffece9 },
  { key: "cooking", label: "เกมสอนทำลูกชุบ", subtitle: "ทำตามสูตรให้ครบทุกขั้นตอน", scene: "CookingGameScene", texture: "/assets/booth-cooking.png", accent: 0xffc772, trim: 0xd06f1c, awningAlt: 0xfff1d8 },
  { key: "balloon", label: "เกมปาโป่ง", subtitle: "เล็งดี ยิงไว ทำคอมโบให้ต่อเนื่อง", scene: "BalloonShootScene", texture: "/assets/booth-balloon.png", accent: 0xff78cf, trim: 0xc33479, awningAlt: 0xffedf9 },
  { key: "doll", label: "เกมยิงตุ๊กตา", subtitle: "เล็งเป้าให้แม่น คว้ารางวัลกลับบ้าน", scene: "DollGameScene", texture: "/assets/booth-doll.png", accent: 0x9fc6ff, trim: 0x4167c4, awningAlt: 0xedf4ff },
  { key: "flower", label: "เกมร้อยมาลัย", subtitle: "ร้อยพวงมาลัยตามใจลูกค้า", scene: "FlowerGameScene", texture: "/assets/booth-flower.png", accent: 0xffa9c6, trim: 0xc4507d, awningAlt: 0xffeef4 },
  { key: "haunted", label: "เกมบ้านผีสิง", subtitle: "ช่วยวิญญาณให้พบของที่ตามหา", scene: "HauntedHouseScene", texture: "/assets/booth-haunted.png", accent: 0xbda7ff, trim: 0x6241bd, awningAlt: 0xf2eeff },
  { key: "tug", label: "เกมชักเย่อ", subtitle: "ดวลแรงใจให้ทีมเป็นผู้ชนะ", scene: "TugOfWarScene", texture: "/assets/booth-tug.png", accent: 0x8cf2b0, trim: 0x199653, awningAlt: 0xeaffef },
  { key: "worship", label: "เกมไหว้พระ", subtitle: "พิธีปิดท้าย เสี่ยงเซียมซีรับพรกลับบ้าน", scene: "WorshipBoothScene", texture: "/assets/booth-worship.png", accent: 0xffec9e, trim: 0xb78019, awningAlt: 0xfff8e1 },
];

const BOOTH_THUMBNAIL_LAYOUT = {
  fish: { x: 0, y: 8, scale: 0.36 },
  horse: { x: 0, y: 8, scale: 0.35 },
  boxing: { x: 0, y: 8, scale: 0.36 },
  cooking: { x: 0, y: 8, scale: 0.36 },
  balloon: { x: 0, y: 8, scale: 0.36 },
  doll: { x: 0, y: 8, scale: 0.36 },
  flower: { x: 0, y: 8, scale: 0.36 },
  haunted: { x: 0, y: 8, scale: 0.36 },
  tug: { x: 0, y: 8, scale: 0.35 },
  worship: { x: 0, y: 8, scale: 0.36 },
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

    if (!this.textures.exists("festival-stall-bg")) {
      this.load.image("festival-stall-bg", FESTIVAL_STALL_BG);
    }
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
    const bg = this.add.tileSprite(
      WORLD_WIDTH / 2,
      height / 2,
      WORLD_WIDTH,
      height,
      "festival-stall-bg",
    );
    bg.setOrigin(0.5, 0.5);
    const texture = this.textures.get("festival-stall-bg")?.getSourceImage?.();
    if (texture?.width && texture?.height) {
      const scaleByHeight = height / texture.height;
      bg.tileScaleX = scaleByHeight;
      bg.tileScaleY = scaleByHeight;
    }
  }

  drawFestivalBackdrop(height) {
    return height;
  }

  drawGround(height) {
    return height;
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

    const baseGlow = this.add.ellipse(0, 142, 360, 80, booth.accent, 0.18);
    const shadow = this.add.ellipse(0, 154, 292, 36, 0x120905, 0.42);

    const thumbLayout = BOOTH_THUMBNAIL_LAYOUT[booth.key] ?? { x: 0, y: 8, scale: 0.35 };
    const thumbnail = this.add.image(thumbLayout.x, thumbLayout.y, `booth-${booth.key}`);
    thumbnail.setScale(thumbLayout.scale);

    const signText = this.add.text(0, -132, booth.label, {
      fontFamily: "Kanit",
      fontSize: "24px",
      fontStyle: "bold",
      color: "#fff7e5",
      align: "center",
      wordWrap: { width: 266 },
    }).setOrigin(0.5);
    signText.setStroke("#3a1808", 6);
    signText.setShadow(0, 4, "#1f0c04", 10, false, true);

    const statePill = this.add.text(0, 156, "", {
      fontFamily: "Kanit",
      fontSize: "17px",
      fontStyle: "bold",
      color: "#fff7e5",
      backgroundColor: "rgba(34,15,7,0.84)",
      padding: { left: 12, right: 12, top: 5, bottom: 5 },
    }).setOrigin(0.5);

    const actionButton = this.add.rectangle(0, 212, 200, 48, 0x261109, 0.94);
    actionButton.setStrokeStyle(3, booth.accent, 1);
    const actionText = this.add.text(0, 212, "เข้าเล่น", {
      fontFamily: "Kanit",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#fff7e5",
    }).setOrigin(0.5);

    const lockOverlay = this.add.rectangle(0, 28, 322, 286, 0x050507, 0.42);
    lockOverlay.setStrokeStyle(2, 0xffe2a4, 0.2);
    const lockText = this.add.text(0, 30, "ล็อก", {
      fontFamily: "Kanit",
      fontSize: "32px",
      fontStyle: "bold",
      color: "#fff0cd",
    }).setOrigin(0.5);
    const completeBadge = this.add.text(0, 30, booth.key === "worship" ? "ขอพรแล้ว" : "ผ่านแล้ว", {
      fontFamily: "Kanit",
      fontSize: "22px",
      fontStyle: "bold",
      color: "#0a4c25",
      backgroundColor: "#b5ffd0",
      padding: { left: 14, right: 14, top: 6, bottom: 6 },
    }).setOrigin(0.5);

    container.add([
      baseGlow,
      shadow,
      thumbnail,
      signText,
      statePill,
      actionButton,
      actionText,
      lockOverlay,
      lockText,
      completeBadge,
    ]);

    container.setSize(STALL_WIDTH, STALL_HEIGHT);
    container.setDepth(10 + Math.round(x / 100));
    container.setInteractive(new Phaser.Geom.Rectangle(-215, -180, 430, 430), Phaser.Geom.Rectangle.Contains);

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
