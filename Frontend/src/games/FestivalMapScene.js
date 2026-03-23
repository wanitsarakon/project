import Phaser from "phaser";
import { FESTIVAL_BOOTHS, getFestivalBoothsBySceneKeys } from "./festivalBooths";

const BOOTH_SPACING = 620;
const BOOTH_Y = 585;
const WORLD_MARGIN = 220;
const STALL_WIDTH = 430;
const STALL_HEIGHT = 430;
const FESTIVAL_STALL_BG = "/assets/festival-stall-bg.png";

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

function getWorldWidth(boothCount) {
  const safeCount = Math.max(1, boothCount);
  const lastX = FIRST_X + BOOTH_SPACING * (safeCount - 1);
  return lastX + STALL_WIDTH / 2 + WORLD_MARGIN;
}

function sequencesMatch(left = [], right = []) {
  if (left.length !== right.length) return false;
  return left.every((item, index) => item === right[index]);
}

export default class FestivalMapScene extends Phaser.Scene {
  constructor() {
    super({ key: "FestivalMapScene" });
    this.onEnterGame = null;
    this.entering = false;
    this.boothStates = {};
    this.boothCards = {};
    this.dragStartX = 0;
    this.didPan = false;
    this.sequence = FESTIVAL_BOOTHS.map((booth) => booth.scene);
    this.visibleBooths = FESTIVAL_BOOTHS;
    this.worldWidth = getWorldWidth(FESTIVAL_BOOTHS.length);
  }

  init(data = {}) {
    this.onEnterGame = data?.onEnterGame ?? null;
    this.entering = false;
    this.boothStates = data?.boothStates ?? {};
    this.dragStartX = 0;
    this.didPan = false;
    this.sequence = Array.isArray(data?.sequence) && data.sequence.length > 0
      ? data.sequence
      : FESTIVAL_BOOTHS.map((booth) => booth.scene);
    this.visibleBooths = getFestivalBoothsBySceneKeys(this.sequence);
    this.worldWidth = getWorldWidth(this.visibleBooths.length);
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
    this.physics.world.setBounds(0, 0, this.worldWidth, height);

    this.drawNightFestivalBackground(height);

    const cam = this.cameras.main;
    cam.setBackgroundColor("#081022");
    cam.setBounds(0, 0, this.worldWidth, height);
    cam.scrollX = 0;

    this.boothCards = {};
    this.boothContainers = this.visibleBooths.map((booth, index) =>
      this.createBoothCard(booth, FIRST_X + index * BOOTH_SPACING, BOOTH_Y + (index % 2 === 0 ? 0 : 8)),
    );
    this.applyMapData({ boothStates: this.boothStates, sequence: this.sequence });
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
      this.worldWidth / 2,
      height / 2,
      this.worldWidth,
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
      Phaser.Math.Clamp(scrollX, 0, Math.max(0, this.worldWidth - this.scale.width));

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

  applyMapData(data = {}) {
    const nextSequence = Array.isArray(data?.sequence) && data.sequence.length > 0
      ? data.sequence
      : this.sequence;

    if (!sequencesMatch(nextSequence, this.sequence)) {
      this.scene.restart({
        onEnterGame: this.onEnterGame,
        boothStates: data?.boothStates ?? this.boothStates,
        sequence: nextSequence,
      });
      return;
    }

    this.boothStates = data?.boothStates ?? {};
    this.visibleBooths.forEach((booth) => {
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
      this.visibleBooths.find((booth) => this.boothStates?.[booth.scene] === "unlocked")
      || this.visibleBooths.find((booth) => this.boothStates?.[booth.scene] === "completed")
      || this.visibleBooths[0];

    const card = this.boothCards?.[nextBooth?.scene];
    if (!card) return;

    const targetScroll = Phaser.Math.Clamp(
      card.x - this.scale.width / 2,
      0,
      Math.max(0, this.worldWidth - this.scale.width),
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
