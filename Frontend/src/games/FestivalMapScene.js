import Phaser from "phaser";

export default class FestivalMapScene extends Phaser.Scene {
  constructor() {
    super({ key: "FestivalMapScene" });

    this.currentRound = 1;
    this.booths = [];
    this.onEnterGame = null;
  }

  /* =====================
     INIT
  ===================== */
  init(data = {}) {
    this.currentRound = data.currentRound ?? 1;
    this.onEnterGame = data.onEnterGame;
  }

  /* =====================
     PRELOAD
  ===================== */
  preload() {
    this.load.image("map", "/assets/Map.png");
    this.load.image("fish", "/assets/FishScooping.png");
    this.load.image("carousel", "/assets/carousel.png");
    this.load.image("shoot", "/assets/shootdolls.png");
    this.load.image("cotton", "/assets/CottonandyandLukChup.png");
    this.load.image("worship", "/assets/Worship.png");

    this.load.image("lock", "/assets/lock.png");
    this.load.image("unlock", "/assets/unlock.png");
  }

  /* =====================
     CREATE
  ===================== */
  create() {
  /* ===== MAP ===== */
  this.add.image(400, 300, "map");

  /* ===== BOOTH POSITIONS (กำหนดตามจุดแดง) ===== */
  const BOOTH_POINTS = [
    { x: 220, y: 210, key: "fish",     label: "เกมตักปลา",   gameKey: "FishScoopingScene", order: 1 },
    { x: 400, y: 200, key: "carousel", label: "เกมขี่ม้า",    gameKey: "CAROUSEL",          order: 2 },
    { x: 580, y: 220, key: "shoot",    label: "เกมยิงตุ๊กตา", gameKey: "SHOOT",             order: 3 },
    { x: 320, y: 420, key: "worship",  label: "จุดไหว้ขอพร",  gameKey: "WORSHIP",           order: 4 },
    { x: 520, y: 420, key: "cotton",   label: "เกมทำสายไหม",  gameKey: "COTTON",            order: 5 },
  ];

  /* ===== PATH ===== */
  this.drawPath(
    BOOTH_POINTS.map(p => ({ x: p.x, y: p.y }))
  );

  /* ===== BOOTHS ===== */
  this.booths = [];

  BOOTH_POINTS.forEach(p => {
    this.createBooth(
      p.x,
      p.y,
      p.key,
      p.label,
      p.gameKey,
      p.order
    );
  });

  /* ===== ROUND EVENTS ===== */
  this.game.events.on("round_start", this.onRoundStart, this);
  this.game.events.on("round_end", this.onRoundEnd, this);

  this.events.once("shutdown", this.onShutdown, this);
  this.events.once("destroy", this.onShutdown, this);
}

  /* =====================
     DRAW PATH
  ===================== */
  drawPath(points) {
    const g = this.add.graphics();

    g.lineStyle(4, 0xd2a679, 0.9);
    g.beginPath();

    points.forEach((p, i) => {
      i === 0 ? g.moveTo(p.x, p.y) : g.lineTo(p.x, p.y);
    });

    g.strokePath();

    points.forEach((p) => {
      g.fillStyle(0xfff3d6, 1);
      g.fillCircle(p.x, p.y, 6);
    });
  }

  /* =====================
     CREATE BOOTH
  ===================== */
  createBooth(x, y, key, label, gameKey, order) {
    const booth = this.add.container(x, y);

    const img = this.add
      .image(0, -22, key)
      .setScale(0.25)
      .setOrigin(0.5);

    const lockIcon = this.add
      .image(0, -60, "lock")
      .setScale(0.05);

    const text = this.add
      .text(0, 42, label, {
        fontFamily: "Kanit",
        fontSize: "16px",
        backgroundColor: "#e0e0e0",
        color: "#999",
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5);

    booth.add([img, lockIcon, text]);

    const boothData = {
      order,
      gameKey,
      booth,
      img,
      lockIcon,
      text,
      unlocked: false,
      floatTween: null,
    };

    this.booths.push(boothData);
    this.updateBoothState(boothData);
  }

  /* =====================
     UPDATE BOOTH STATE
  ===================== */
  updateBoothState(boothData) {
    const { order, img, lockIcon, text, gameKey } = boothData;
    const shouldUnlock = order === this.currentRound;

    if (shouldUnlock && !boothData.unlocked) {
      boothData.unlocked = true;
      this.playUnlock(lockIcon);

      img.clearTint().setAlpha(1);
      img.setInteractive({ useHandCursor: true });

      img.once("pointerdown", () => {
        this.onEnterGame?.({ gameKey });
      });

      text.setStyle({
        backgroundColor: "#ffd28a",
        color: "#5b2c00",
      });

      // ✅ animation เฉพาะ img (ไม่ทำให้ตำแหน่งเพี้ยน)
      boothData.floatTween = this.tweens.add({
        targets: img,
        y: -28,
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    }

    if (!shouldUnlock) {
      img.setTint(0x777777).setAlpha(0.55);
      img.disableInteractive();

      boothData.floatTween?.stop();
      boothData.floatTween = null;
      img.y = -22;
    }
  }

  /* =====================
     ROUND EVENTS
  ===================== */
  onRoundStart(data) {
    if (!data?.round) return;

    this.currentRound = data.round;
    this.booths.forEach((b) => this.updateBoothState(b));
  }

  onRoundEnd() {}

  /* =====================
     UNLOCK ANIMATION
  ===================== */
  playUnlock(lockIcon) {
    this.tweens.add({
      targets: lockIcon,
      scale: 0.05,
      duration: 600,
      yoyo: true,
      ease: "Back.easeOut",
      onComplete: () => {
        lockIcon.setTexture("unlock");

        this.tweens.add({
          targets: lockIcon,
          alpha: 0,
          y: "-=20",
          duration: 700,
          ease: "Sine.easeIn",
          onComplete: () => lockIcon.destroy(),
        });
      },
    });
  }

  /* =====================
     CLEANUP
  ===================== */
  onShutdown() {
    this.game.events.off("round_start", this.onRoundStart, this);
    this.game.events.off("round_end", this.onRoundEnd, this);

    this.booths.forEach((b) => {
      b.floatTween?.stop();
    });
  }
}
