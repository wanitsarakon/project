import Phaser from "phaser";

export default class FestivalMapScene extends Phaser.Scene {
  constructor() {
    super("FestivalMapScene");

    /* =====================
       STATE
    ===================== */
    this.currentRound = 1;
    this.booths = []; // เก็บ booth ทั้งหมด
  }

  /* =====================
     INIT
  ===================== */
  init(data = {}) {
    this.currentRound = data.currentRound ?? 1;
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
    const W = 800;
    const H = 600;

    this.scale.resize(W, H);

    /* ===== MAP ===== */
    this.add
      .image(W / 2, H / 2, "map")
      .setDisplaySize(W, H)
      .setDepth(0);

    /* ===== PATH ===== */
    const boothPoints = [
      { x: 75, y: 200 },
      { x: 300, y: 175 },
      { x: 520, y: 170 },
      { x: 170, y: 420 },
      { x: 480, y: 420 },
    ];
    this.drawPath(boothPoints);

    /* ===== BOOTHS ===== */
    this.booths = []; // reset

    this.createBooth(75, 200, "fish", "เกมตักปลา", "FISH", 1);
    this.createBooth(300, 175, "carousel", "เกมขี่ม้า", "CAROUSEL", 2);
    this.createBooth(520, 170, "shoot", "เกมยิงตุ๊กตา", "SHOOT", 3);
    this.createBooth(170, 420, "worship", "จุดไหว้ขอพร", "WORSHIP", 4);
    this.createBooth(480, 420, "cotton", "เกมทำสายไหม", "COTTON", 5);

    /* =====================
       🎯 LISTEN ROUND EVENTS
    ===================== */
    this.game.events.on("round_start", this.onRoundStart, this);
    this.game.events.on("round_end", this.onRoundEnd, this);

    this.events.once("shutdown", this.onShutdown, this);
    this.events.once("destroy", this.onShutdown, this);
  }

  /* =====================
     DRAW PATH
  ===================== */
  drawPath(points) {
    const g = this.add.graphics().setDepth(1);

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
    const booth = this.add.container(x, y).setDepth(2);

    const img = this.add
      .image(0, -22, key)
      .setScale(0.25)
      .setOrigin(0.25);

    const lockIcon = this.add
      .image(0, -60, "lock")
      .setScale(0.05)
      .setDepth(3);

    const text = this.add
      .text(0, 42, label, {
        fontFamily: "Kanit",
        fontSize: "16px",
        backgroundColor: "#e0e0e0",
        color: "#999",
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.25);

    booth.add([img, lockIcon, text]);

    const boothData = {
      order,
      gameKey,
      booth,
      img,
      lockIcon,
      text,
      unlocked: false,
    };

    this.booths.push(boothData);

    // initial lock
    this.updateBoothState(boothData);
  }

  /* =====================
     UPDATE BOOTH STATE
  ===================== */
  updateBoothState(boothData) {
    const { order, img, lockIcon, text, booth, gameKey } =
      boothData;

    const shouldUnlock = order === this.currentRound;

    if (shouldUnlock && !boothData.unlocked) {
      boothData.unlocked = true;

      this.playUnlock(lockIcon);

      img.clearTint().setAlpha(1);
      img.setInteractive({ useHandCursor: true });
      img.once("pointerdown", () => {
        this.game.events.emit("enter-game", gameKey);
      });

      text.setStyle({
        backgroundColor: "#ffd28a",
        color: "#5b2c00",
      });

      this.tweens.add({
        targets: booth,
        y: booth.y - 6,
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    }

    if (!shouldUnlock) {
      img.setTint(0x777777).setAlpha(0.55);
      img.disableInteractive();
    }
  }

  /* =====================
     ROUND EVENTS
  ===================== */
  onRoundStart(data) {
    if (!data?.round) return;

    this.currentRound = data.round;

    this.booths.forEach((b) =>
      this.updateBoothState(b)
    );
  }

  onRoundEnd() {
    // ตอนนี้ยังไม่ต้องทำอะไร
    // เผื่อ future animation / summary
  }

  /* =====================
     🔓 UNLOCK ANIMATION
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
  }
}
