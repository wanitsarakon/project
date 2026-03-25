import Phaser from "phaser";
import Spoon from "./components/Spoon";
import Fish from "./components/Fish";

const BG_IMAGE = new URL("./assetsFish/พื้นหลังเกมตักปลา.PNG", import.meta.url).href;
const SPOON_IMAGE = new URL("./assetsFish/ช้อนตักปลา.png", import.meta.url).href;
const BUCKET_IMAGE = new URL("./assetsFish/ถังไม้.png", import.meta.url).href;
const POND_IMAGE = new URL("./assetsFish/อ่างปลา.png", import.meta.url).href;
const START_IMAGE = new URL("./assetsFish/fish_start.png", import.meta.url).href;
const RESULT_IMAGE = new URL("./assetsFish/fish_score.png", import.meta.url).href;
const SPOON_BROKEN_IMAGE = new URL("./assetsFish/ช้อนขาด.png", import.meta.url).href;
const FISH_IMAGES = {
  red: new URL("./assetsFish/ปลาเเดง.png", import.meta.url).href,
  silver: new URL("./assetsFish/ปลาเงิน.png", import.meta.url).href,
  gold: new URL("./assetsFish/ปลาทอง.png", import.meta.url).href,
};

const COUNTDOWN_SOUND = new URL("./sounds/countdown.mp3", import.meta.url).href;
const START_SOUND = new URL("./sounds/start.mp3", import.meta.url).href;
const SCOOP_SOUND = new URL("./sounds/scoop.wav", import.meta.url).href;
const FAIR_AMBIENCE = new URL("./sounds/fair_ambience.wav", import.meta.url).href;
const HUD_SIGN_IMAGE = "/assets/เเผ่นป้ายเวลากับคะเเนน.png";
const GAME_TIME = 60;
const MAX_FISH = 20;
const HOLD_LIMIT_MS = 1000;
const INITIAL_FISH_TYPES = ["red", "silver", "red", "silver", "gold", "red", "silver", "gold","red", "silver", "red", "silver", "gold", "red", "silver", "gold"];
const FISH_DEFS = {
  red: { texture: "fish-red", label: "ปลาแดง", score: 1, toastColor: "#ffc7a0" },
  silver: { texture: "fish-silver", label: "ปลาเงิน", score: 2, toastColor: "#dff4ff" }, // ตรวจสอบบรรทัดนี้
  gold: { texture: "fish-gold", label: "ปลาทอง", score: 3, toastColor: "#ffe57a" },
};
export default class FishScoopingScene extends Phaser.Scene {
  constructor() {
    super("FishScoopingScene");
    this.spawnTimer = null;
    this.bucketFishGroup = null; // เพิ่มบรรทัดนี้
    this.gameTimer = null;
    this.countdownTimer = null;
    this.hud = {};
    this.currentToast = null; // เพิ่มบรรทัดนี้
    this.toastTween = null;
    this.escapeTimer = null;
    this.layout = null;
  }

  init(data = {}) {
    this.roomCode = data.roomCode ?? null;
    this.player = data.player ?? null;
    this.roundId = data.roundId ?? null;
    this.onGameEnd = data.onGameEnd ?? null;
    this.phase = "intro";
    this.score = 0;
    this.timeLeft = GAME_TIME;
    this.redCaught = 0;
    this.silverCaught = 0;
    this.goldCaught = 0;
    this.ended = false;
   this.missDamage = 0;      // สะสมความเสียหายของช้อนปัจจุบัน (เต็ม 5 คือขาด)
    this.spoonsLeft = 5;      // จำนวนช้อนทั้งหมด (5 ชีวิต)
    this.isSpoonBroken = false;
    this.spoonIcons = [];     // Array สำหรับเก็บ GameObject ของไอคอนช้อน
  }

  preload() {
    this.load.image("bg", BG_IMAGE);
    this.load.image("spoon", SPOON_IMAGE);
    this.load.image("bucket", BUCKET_IMAGE);
    this.load.image("pond", POND_IMAGE);
    this.load.image("fish-start", START_IMAGE);
    this.load.image("spoon-broken", SPOON_BROKEN_IMAGE);
    this.load.image("fish-result", RESULT_IMAGE);
    this.load.image("fish-red", FISH_IMAGES.red);
    this.load.image("fish-silver", FISH_IMAGES.silver);
    this.load.image("fish-gold", FISH_IMAGES.gold);
    this.load.audio("fish-count", COUNTDOWN_SOUND);
    this.load.audio("fish-start-sfx", START_SOUND);
    this.load.audio("fish-scoop", SCOOP_SOUND);
    this.load.audio("fish-fair-bgm", FAIR_AMBIENCE);
    this.load.image("fish-hud-sign", HUD_SIGN_IMAGE);
  }
create() {
    const { width, height } = this.scale;

  // หาจุดนี้ใน create() และวางทับ
const style = document.createElement('style');
style.innerHTML = `
  @keyframes countBounce {
    0% { transform: scale(0.3); opacity: 0; }
    50% { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }

  /* ใน FishScoopingScene.jsx ส่วน create() */
.countdown-overlay-style {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;         /* ใช้ Flexbox */
  justify-content: center; /* จัดกึ่งกลางแนวนอน */
  align-items: center;     /* จัดกึ่งกลางแนวตั้ง */
  z-index: 1000;
  pointer-events: none;
}
#total-score {
    font-size: 90px;          /* ขนาดตัวเลขที่ใหญ่สะใจ */
    font-family: 'Kanit', sans-serif;
    font-weight: 900;          /* ใช้ความหนาสูงสุด */
    margin: 0;
    /* การไล่เฉดสีจากขาวไปเหลืองทอง */
    background: linear-gradient(180deg, #FFFFFF 30%, #FFD700 60%, #FF8C00 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    /* ใส่ขอบตัวอักษรสีน้ำตาลเข้ม/ดำ เพื่อให้ตัดกับป้าย */
    filter: drop-shadow(4px 4px 0px #632b00) 
            drop-shadow(0px 0px 15px rgba(255, 140, 0, 0.5));
    transform: translateY(50px);
    /* เพิ่ม Animation เล็กๆ ให้ตัวเลขดูมีชีวิต */
    animation: scorePop 0.5s ease-out;
}

@keyframes scorePop {
    0% { transform: scale(0.5); opacity: 0; }
    70% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
}
.game-btn {
    padding: 15px 40px;
    font-size: 28px;
    font-family: 'Kanit', sans-serif;
    font-weight: bold;
    color: white;
    background: linear-gradient(180deg, #ffcc00 0%, #ff8800 50%, #ff4400 100%);
    border: 4px solid #fff;
    border-radius: 50px;
    cursor: pointer;
    outline: none;
    box-shadow: 0 8px 0 #992200, 0 15px 20px rgba(0,0,0,0.5);
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .game-btn:hover {
    transform: translateY(-3px) scale(1.05);
    background: linear-gradient(180deg, #ffe066 0%, #ffa500 50%, #ff5500 100%);
    box-shadow: 0 10px 0 #992200, 0 20px 25px rgba(0,0,0,0.6);
  }

  .game-btn:active {
    transform: translateY(4px);
    box-shadow: 0 2px 0 #992200, 0 5px 10px rgba(0,0,0,0.5);
  }

  /* เอฟเฟกต์แสงวิ่ง (Shine) */
  .game-btn:after {
    content: "";
    position: absolute;
    top: -50%;
    left: -60%;
    width: 20%;
    height: 200%;
    background: rgba(255, 255, 255, 0.4);
    transform: rotate(30deg);
    animation: shine 3s infinite;
  }

  @keyframes shine {
    0% { left: -60%; }
    20% { left: 120%; }
    100% { left: 120%; }
  }
#countdown-text {
  color: #f1c40f !important;
  font-size: 180px; 
  font-weight: 900 !important;
  font-family: 'Kanit', sans-serif !important;
  text-shadow: 8px 8px 0px #000, 0px 10px 20px rgba(0,0,0,0.4) !important;
  animation: countBounce 0.5s ease-out forwards;
  text-align: center !important;
  margin-left: 430px;
  margin-top: 290px;
  display: inline-block !important;
  width: 600px;           /* กำหนดความกว้างให้คลุมคำที่ยาวที่สุด */
  text-align: center !important; 
  line-height: 1 !important;
}
`;
document.head.appendChild(style);

    // --- 2. สร้าง Elements ในเกม ---
    
    // Background
    this.bg = this.add.image(width / 2, height / 2, "bg").setDepth(0);

    // อ่างปลา (Pond)
    this.pond = this.add.image(width * 0.5, height * 0.5, "pond").setDepth(1); 

    // โซนน้ำ (WaterZone)
    this.waterZone = {
      cx: width * 0.5, 
      cy: height * 0.5,
      rx: 400, 
      ry: 250,
    };

    // ถังน้ำ
    this.bucket = this.physics.add.image(width * 0.11, height * 0.865, "bucket")
      .setImmovable(true)
      .setDepth(3);
    this.bucket.body.allowGravity = false;

    // ช้อนตักปลา
    this.spoon = new Spoon(this, width / 2, height / 2);
    this.spoon.setDepth(5);

    // กลุ่มปลา
    this.fishes = this.physics.add.group();
    this.bucketFishGroup = this.add.group();
    
    // ระบบเริ่มเกม
    this.spawnInitialFish();
    this.createHud();
    this.createStartOverlay();
    this.createResultOverlay();

    // Input การคลิกตักปลา
    this.input.on("pointerdown", () => {
      if (this.phase !== "playing" || this.spoon?.holdingFish) return;
      this.tryCatchFish();
    });

    // ระบบจัดการขนาดหน้าจอและ Cleanup
    this.handleResize({ width, height });
    this.scale.on("resize", this.handleResize, this);
    this.events.once("shutdown", () => this.cleanup());
    this.events.once("destroy", () => this.cleanup());
  }
  

// FishScoopingScene.jsx -> createHud()
createHud() {
    const createPanel = (label, valueColor) => {
        const bg = this.add.image(0, 0, "fish-hud-sign").setScrollFactor(0).setDepth(10);
        const valueText = this.add.text(0, 0, `${label}: 0`, {
            fontFamily: "Kanit",
            fontSize: "28px",
            fontWeight: "bold",
            color: "#ffffff",
            stroke: "#2b1703",
            strokeThickness: 5,
            shadow: { offsetX: 0, offsetY: 3, color: "#000", blur: 4, fill: true }
        }).setOrigin(0.5).setDepth(11);

        const grad = valueText.context.createLinearGradient(0, 0, 0, 30);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, valueColor);
        valueText.setFill(grad);

        return { bg, valueText, label };
    };

    this.hud.score = createPanel("คะแนน", "#fff7cc");
    this.hud.timer = createPanel("เวลา", "#ffd86a");

    // --- ส่วนที่เพิ่ม: สร้างไอคอนช้อน 5 อันเรียงกันที่มุมขวาล่าง ---
    const { width, height } = this.scale;
    const uiScale = this.layout?.uiScale || 1;
    
    this.spoonIcons = []; // เก็บ GameObject ของไอคอนช้อน
    const startX = width - (60 * uiScale);  // ตำแหน่ง X เริ่มจากขวา
    const startY = height - (60 * uiScale); // ตำแหน่ง Y เริ่มจากล่าง
    const gap = 45 * uiScale;               // ระยะห่างระหว่างช้อน

    for (let i = 0; i < this.spoonsLeft; i++) {
        const icon = this.add.image(startX - (i * gap), startY, "spoon")
            .setOrigin(0.5)
            .setScale(uiScale * 0.1) // ปรับขนาดให้เป็นไอคอนเล็กๆ
            .setAngle(-15)           // เอียงช้อนให้ดูสวยงาม
            .setDepth(20)            // ให้อยู่เหนือ UI อื่นๆ
            .setAlpha(0.9);

        this.spoonIcons.push(icon);
    }
    // -------------------------------------------------------

    this.hud.note = this.add.text(0, 0, "ลากช้อนให้ครอบปลาแล้วคลิกตัก จากนั้นรีบปล่อยลงถังให้ทัน", {
        fontFamily: "Kanit",
        fontSize: "40px",
        fontWeight: "bold",
        color: "#ffffff",
        stroke: "#2b1703",
        strokeThickness: 5,
        shadow: { offsetX: 0, offsetY: 3, color: "#000000", blur: 4, fill: true, stroke: true }
    }).setOrigin(0.5, 1).setDepth(10);

    const noteGradient = this.hud.note.context.createLinearGradient(0, 0, 0, 24);
    noteGradient.addColorStop(0, '#ffffff');
    noteGradient.addColorStop(1, '#ffddaa');
    this.hud.note.setFill(noteGradient);

    this.hud.ruleBg = this.add.graphics().setDepth(10).setScrollFactor(0);
    this.hud.ruleTitle = this.add.text(0, 0, "กติกาการเล่น", {
        fontFamily: "Kanit", fontSize: "20px", fontStyle: "bold", color: "#ffe7ab",
        stroke: "#2b1703", strokeThickness: 4,
    }).setOrigin(0.5, 0).setDepth(11);

    this.hud.ruleText = this.add.text(0, 0, [
        "• ลากช้อนให้ครอบปลาแล้วคลิกตัก",
        "• รีบปล่อยปลาลงถังภายใน 1 วินาที",
        "• ปลาแดง 1 ครั้งขาด | เงิน 2 ครั้ง | ทอง 5 ครั้ง",
    ].join("\n"), {
        fontFamily: "Kanit", fontSize: "16px", color: "#fff8e7",
        lineSpacing: 6, wordWrap: { width: 300 },
    }).setOrigin(0, 0).setDepth(11);

    this.hud.rulePanel = this.add.container(0, 0, [
        this.hud.ruleBg,
        this.hud.ruleTitle,
        this.hud.ruleText,
    ]).setScrollFactor(0).setDepth(15);

    this.updateHud();
}

createOverlayButton(label, onClick) {
    // 1. สร้าง HTML Element (ปุ่มจริง)
    const element = document.createElement('div');
    
    // แต่งสไตล์ด้วย CSS Direct
    element.style.cssText = `
      background: linear-gradient(to bottom, #ffd45b 0%, #ff6f18 100%);
      color: white;
      font-family: 'Kanit', sans-serif;
      font-size: 28px;
      font-weight: 900;
      padding: 12px 40px;
      border: 6px solid white;
      border-radius: 40px;
      cursor: pointer;
      box-shadow: 0 6px 0 #7f2500, 0 10px 20px rgba(0,0,0,0.3);
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3); /* เงาตัวอักษรให้อ่านง่าย ไม่มีเส้นขอบกวนตา */
      user-select: none;
      min-width: 200px;
      transition: transform 0.1s;
    `;

    element.innerText = label;

    // 2. นำเข้าสู่ Phaser ด้วยคำสั่ง dom
    const button = this.add.dom(0, 0, element);

    // 3. ใส่ลูกเล่นตอนเอาเมาส์ชี้และกด
    element.onmouseover = () => { element.style.transform = 'scale(1.05)'; };
    element.onmouseout = () => { element.style.transform = 'scale(1)'; };
    element.onmousedown = () => { element.style.transform = 'scale(0.95)'; };
    element.onmouseup = () => { element.style.transform = 'scale(1.05)'; };

    element.onclick = () => {
        onClick?.();
    };

    return button;
  }

  createStartOverlay() {
    this.startOverlay = this.add.container(0, 0).setDepth(30);
    const dim = this.add.rectangle(0, 0, 0, 0, 0x000000, 0.55);
    const panel = this.add.image(0, 0, "fish-start");

    // ลบส่วน const copy ออกไปแล้ว

    const btn = this.createOverlayButton("เริ่มเกม", () => this.startCountdown());

    // เหลือแค่ dim, panel และ btn
    this.startOverlay.add([dim, panel, btn]);
    this.startOverlayRefs = { dim, panel, btn };
}
 // FishScoopingScene.jsx
createResultOverlay() {
    this.resultOverlay = this.add.container(0, 0).setDepth(40).setVisible(false);
    const dim = this.add.rectangle(0, 0, 0, 0, 0x000000, 0.68);
    const panel = this.add.image(0, 0, "fish-result");
    
    this.resultScoreText = this.add.text(0, 0, "0", {
        fontFamily: "Kanit", fontSize: "60px", fontStyle: "bold",
        color: "#7c1e00", stroke: "#fff1bb", strokeThickness: 6,
    }).setOrigin(0.5);

    this.resultMetaText = this.add.text(0, 0, "", {
        fontFamily: "Kanit", fontSize: "20px", color: "#6b2500",
        align: "center", lineSpacing: 6,
    }).setOrigin(0.5);

    const btn = this.createOverlayButton("กลับแผนที่", () => {
        // --- ส่วนสำคัญ: ต้องลบปุ่ม DOM ออกก่อนเปลี่ยนหน้า ---
        if (this.startOverlayRefs?.btn) this.startOverlayRefs.btn.destroy();
        if (this.resultOverlayRefs?.btn) this.resultOverlayRefs.btn.destroy();
        if (this.countdownDisplay) this.countdownDisplay.destroy();

        if (this.onGameEnd) {
            this.onGameEnd({
                score: this.score,
                roundId: this.roundId,
                meta: {
                    redCaught: this.redCaught,
                    silverCaught: this.silverCaught,
                    goldCaught: this.goldCaught,
                    timeLeft: this.timeLeft,
                },
            });
        } else {
            // มั่นใจว่าชื่อ Scene ตรงกับใน class FestivalMapScene
            this.scene.start("FestivalMapScene", { fromGame: true, lastScore: this.score });
        }
    });

    this.resultOverlay.add([dim, panel, this.resultScoreText, this.resultMetaText, btn]);
    this.resultOverlayRefs = { dim, panel, btn };
} // ปิดฟังก์ชัน createResultOverlay

  handleResize(gameSize) {
    const width = gameSize?.width ?? this.scale.width;
    const height = gameSize?.height ?? this.scale.height;
    const shortSide = Math.min(width, height);
    const uiScale = Phaser.Math.Clamp(shortSide / 900, 0.78, 1.18);
    const panelScale = Phaser.Math.Clamp(shortSide / 980, 0.25, 1.14);

    this.layout = { width, height, uiScale, panelScale };

    this.bg?.setPosition(width / 2, height / 2).setDisplaySize(width, height);

    const pondSize = Math.min(width * 1.20, height * 1.5);
    this.pond?.setPosition(width * 0.5, height * 0.5).setDisplaySize(pondSize, pondSize);

    this.waterZone = {
      cx: width * 0.5,
      cy: height * 0.5,
      rx: pondSize * 0.40,
      ry: pondSize * 0.17,
    };

    const bucketScale = Math.min(width / 800, height / 600) * 0.34;
    this.bucket?.setPosition(width * 0.11, height * 0.865).setScale(bucketScale);
    this.bucket?.body?.updateFromGameObject();

  if (this.bucketFishGroup && this.bucket) {
    const bX = this.bucket.x;
    const bY = this.bucket.y - (this.bucket.displayHeight * 0.12);

    this.bucketFishGroup.getChildren().forEach((child, index) => {
        // ใช้สูตรคณิตศาสตร์จาก index เพื่อให้ปลาแต่ละตัวมี "ที่ประจำ" ของมันเอง
        const seed = index * 137.5; // Golden angle-ish สำหรับการกระจายตัว
        const ox = (Math.cos(seed) * 30) * uiScale;
        const oy = (Math.sin(seed) * 15) * uiScale;

        child.setPosition(bX + ox, bY + oy);
        child.setScale(uiScale * 0.11); // ปรับตามขนาดหน้าจอ
    });
}
    if (this.spoonIcons && this.spoonIcons.length > 0) {
        const startX = width - (60 * uiScale);  // ระยะห่างจากขอบขวา
        const startY = height - (60 * uiScale); // ระยะห่างจากขอบล่าง
        const gap = 45 * uiScale;               // ระยะห่างระหว่างไอคอน

        this.spoonIcons.forEach((icon, i) => {
            if (icon && icon.active) {
                // คำนวณตำแหน่งใหม่ให้เรียงจากขวาไปซ้ายเหมือนตอนสร้าง
                icon.setPosition(startX - (i * gap), startY);
                icon.setScale(uiScale * 0.1); // ปรับ Scale ตาม uiScale ของหน้าจอใหม่
            }
        });
    }

    if (this.spoon) {
      const spoonScale = Phaser.Math.Clamp(Math.min(width / 800, height / 600) * 0.18, 0.15, 0.25);
      this.spoon.setResponsiveScale(spoonScale);
      this.spoon.x = Phaser.Math.Clamp(this.spoon.x, 24, width - 24);
      this.spoon.y = Phaser.Math.Clamp(this.spoon.y, 24, height - 24);
    }

    this.layoutHud(width, uiScale);
    this.layoutStartOverlay(width, height, panelScale);
    this.layoutResultOverlay(width, height, panelScale);
if (this.resultOverlay && this.resultOverlayRefs) {
    const { dim, panel, btn } = this.resultOverlayRefs;
    dim.setSize(width, height).setPosition(width / 2, height / 2);

    // 1. ขนาดป้ายที่คุณกำหนดไว้ (เล็กลงเหลือ 0.48)
    const resultPanelScale = panelScale * 0.48;
    panel.setPosition(width / 2, height * 0.48).setScale(resultPanelScale);

    // 2. ปรับขนาดและตำแหน่งคะแนน (Score) ให้อยู่ในป้าย
    // ขยับ Y ขึ้นไปนิดหน่อย (0.45) เพื่อให้อยู่ครึ่งบนของป้าย
    if (this.resultScoreText) {
        this.resultScoreText
            .setPosition(width / 2, height * 0.52) 
            .setScale(resultPanelScale * 2.2); // ปรับตัวคูณตามความเหมาะสม
    }

    // 3. ปรับขนาดและตำแหน่งรายละเอียด (Meta)
    // ขยับ Y ลงมาหน่อย (0.52)
    if (this.resultMetaText) {
        this.resultMetaText
            .setPosition(width / 2, height * 0.52)
            .setScale(resultPanelScale * 1.9);
    }

    // 4. ปรับขนาดปุ่ม "กลับแผนที่" ให้เล็กลงและอยู่ในป้าย
    // ขยับ Y ลงมาด้านล่างของป้าย (0.60)
    if (btn) {
        btn.setPosition(width / 2, height * 0.60)
           .setScale(resultPanelScale * 1.8); 
    }
}
    
/* ใน FishScoopingScene.jsx ส่วน handleResize() */
if (this.countdownDisplay) {
  const { width, height } = this.scale;
  // ตั้งค่าให้อยู่กึ่งกลางจอ (ซึ่งเป็นจุดเดียวกับศูนย์กลางอ่างปลา)
  this.countdownDisplay.setPosition(width / 2, height / 2);
  
  // ปรับขนาด font ตามขนาดหน้าจอเล็กน้อยเพื่อให้ดูสมดุล
  if (this.countdownDisplay.node) {
    const shortSide = Math.min(width, height);
    const fontSize = Math.round(shortSide * 0.25); // ปรับขนาดตามความเหมาะสม
    this.countdownDisplay.node.style.fontSize = `${fontSize}px`;
  }
}

if (this.countdownBg) {
    const { width, height } = this.scale;
    this.countdownBg.clear()
        .fillStyle(0x000000, 0.4)
        .fillRect(0, 0, width, height);

}
}

layoutHud(width, uiScale) {
    const height = this.scale.height;
    const panelWidth = Math.round(222 * uiScale);
    const panelHeight = Math.round(84 * uiScale);
    const panelY = Math.round(58 * uiScale);

    const placePanel = (panel, x) => {
      if (!panel) return;
      // วางแผ่นป้าย
      panel.bg.setPosition(Math.round(x), panelY).setDisplaySize(panelWidth, panelHeight);

      // วางข้อความไว้ตรงกลางแผ่นป้าย (Center Alignment)
      panel.valueText.setPosition(Math.round(x), panelY)
        .setFontSize(`${Math.round(28 * uiScale)}px`);
    };

    placePanel(this.hud.score, width * 0.16);
    placePanel(this.hud.timer, width * 0.84);

    // ตำแหน่ง Note และ Rules (ใช้ Math.round เพื่อความคมชัด)
   const bottomMargin = Math.round(50 * uiScale);
    const noteFontSize = Math.round(30 * uiScale); // ปรับขนาดให้ใหญ่ขึ้นกว่าเดิม (จาก 18 เป็น 22)

    this.hud.note
      ?.setPosition(Math.round(width / 2), Math.round(this.scale.height - bottomMargin))
      .setFontSize(`${noteFontSize}px`);

const pondRight = this.pond
      ? this.pond.x + (this.pond.displayWidth * 0.47)
      : width * 0.85;

    const viewportRightMargin = Math.round(20 * uiScale);
    const ruleWidth = Math.round(300 * uiScale);

    // วางตำแหน่งให้อยู่ชิดขอบขวา และขยับเข้ามาเล็กน้อยเพื่อให้ทับอ่าง
    const ruleLeft = width - ruleWidth - viewportRightMargin;
    const ruleX = ruleLeft + (ruleWidth / 2);

    // ปรับ ruleY ให้ลงมาอยู่ที่ประมาณ 35% ของความสูงจอ (จะอยู่ระดับเดียวกับขอบอ่างด้านบน)
    const ruleY = Math.round(height * 0.16);

    const titleTop = Math.round(15 * uiScale);
    const textTop = Math.round(55 * uiScale);
    const textPaddingX = Math.round(20 * uiScale);

    this.hud.ruleTitle
      ?.setPosition(Math.round(ruleX), Math.round(ruleY + titleTop))
      .setFontSize(`${Math.round(22 * uiScale)}px`);

    this.hud.ruleText
      ?.setPosition(Math.round(ruleLeft + textPaddingX), Math.round(ruleY + textTop))
      .setFontSize(`${Math.round(17 * uiScale)}px`)
      .setWordWrapWidth(ruleWidth - (textPaddingX * 2));

    const textHeight = this.hud.ruleText?.height ?? 100;
    const ruleHeight = textTop + textHeight + Math.round(25 * uiScale);

    // วาดพื้นหลังให้สวยงาม (น้ำตาลเข้ม ขอบทอง)
    this.hud.ruleBg?.clear();
    this.hud.ruleBg?.fillStyle(0x2b1703, 0.85); // เพิ่มความทึบเป็น 0.85 เพื่อให้บังปลาข้างหลังได้ชัดเจน
    this.hud.ruleBg?.lineStyle(Math.round(3 * uiScale), 0xf3c977, 1);

    this.hud.ruleBg?.fillRoundedRect(
        Math.round(ruleLeft),
        Math.round(ruleY),
        Math.round(ruleWidth),
        Math.round(ruleHeight),
        15 * uiScale
    );
    this.hud.ruleBg?.strokeRoundedRect(
        Math.round(ruleLeft),
        Math.round(ruleY),
        Math.round(ruleWidth),
        Math.round(ruleHeight),
        15 * uiScale
    );
}
  isFishOverBucket(fish) {
    if (!fish || !this.bucket) return false;

    const dx = fish.x - this.bucket.x;
    const dy = fish.y - (this.bucket.y - (this.bucket.displayHeight * 0.18));
    const rx = Math.max(78, this.bucket.displayWidth * 0.34);
    const ry = Math.max(52, this.bucket.displayHeight * 0.22);

    return ((dx * dx) / (rx * rx)) + ((dy * dy) / (ry * ry)) <= 1;
  }

layoutStartOverlay(width, height, panelScale) {
    if (!this.startOverlayRefs) return;
    const { dim, panel, btn } = this.startOverlayRefs; // ลบ copy ออกจากตรงนี้
    const panelWidth = Math.min(width * 0.78, 700 * panelScale);
    const panelHeight = panelWidth * (467 / 700);

    dim.setPosition(width / 2, height / 2).setSize(width, height);
    panel.setPosition(width / 2, height / 2).setDisplaySize(panelWidth, panelHeight);

    // ปรับตำแหน่งปุ่มให้อยู่กึ่งกลางค่อนลงมาข้างล่างของแผ่นป้าย
    btn
      .setPosition(width / 2, height / 2.7 + (panelHeight * 0.325))
      .setScale(panelScale);
}
layoutResultOverlay(width, height, panelScale) {
    if (!this.resultOverlay || !this.resultOverlay.visible) return;

    const { dim, panel, btn } = this.resultOverlayRefs;

    // 1. พื้นหลังมืด
    dim.setSize(width, height).setPosition(width / 2, height / 2);

    // 2. ปรับขนาดป้ายให้เท่ากับป้ายเริ่มเกม
    // โดยปกติป้ายเริ่มเกมมักใช้การคำนวณ scale ที่เล็กกว่า หรือใช้ค่ามาตรฐานเดียวกัน
    // ในที่นี้เราจะใช้ panelScale ปกติแต่ตรวจสอบว่าไม่ได้ถูกขยายเพิ่มในส่วนอื่น
    panel.setPosition(width / 2, height / 2).setScale(panelScale);

    // 3. จัดวางปุ่ม "กลับแผนที่"
    // ปรับค่า 0.28 ลงเล็กน้อยถ้าป้ายเล็กลง เพื่อให้ปุ่มอยู่ขอบล่างพอดี
    const btnY = (height / 2) + (panel.displayHeight * 0.28);
    btn.setPosition(width / 2, btnY).setScale(panelScale);

    // 4. แสดงคะแนนไว้ด้านบนของปุ่ม
    if (this.resultScoreText) {
        this.resultScoreText
            .setPosition(width / 2, btnY - (110 * panelScale)) // ขยับขึ้นจากปุ่ม 110 หน่วย
            .setScale(panelScale)
            .setVisible(true);
    }

    if (this.resultMetaText) {
        this.resultMetaText
            .setPosition(width / 2, btnY - (55 * panelScale)) // อยู่ระหว่างคะแนนกับปุ่ม
            .setScale(panelScale * 0.8) // ย่อขนาดตัวอักษรรายละเอียดลงเล็กน้อยเพื่อให้เข้ากับป้ายเล็ก
            .setVisible(true);
    }

}
  // FishScoopingScene.jsx
spawnFish(type) {
  const point = this.randomPointInWater();
  const fish = new Fish(this, point.x, point.y, FISH_DEFS[type].texture, type);

  // สั่งให้ปลาเลือกเส้นทางสุ่มทันทีที่เกิด
  fish.chooseCruiseRoute(this.waterZone);

  this.fishes.add(fish);
  return fish;
}

  spawnInitialFish() {
    INITIAL_FISH_TYPES.forEach((type) => this.spawnFish(type));
  }

  getRandomFishType() {
    const roll = Math.random();
    if (roll < 0.44) return "red";
    if (roll < 0.8) return "silver";
    return "gold";
  }

  randomPointInWater() {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const radius = Math.sqrt(Math.random());
    return {
      x: this.waterZone.cx + Math.cos(angle) * this.waterZone.rx * radius,
      y: this.waterZone.cy + Math.sin(angle) * this.waterZone.ry * radius,
    };
  }

  startCountdown() {
    if (this.phase !== "intro") return;
    this.phase = "countdown";
    this.startOverlay.setVisible(false);

    this.fishes.children.each((fish) => {
      if (fish.active) fish.chooseCruiseRoute(this.waterZone);
    });

    let count = 3;
    this.sound.play("fish-count", { volume: 0.45 });
    
    // --- เปลี่ยนจาก this.add.text เป็นบรรทัดนี้ ---
    this.updateCountdownDisplay(count); 

    this.countdownTimer = this.time.addEvent({
      delay: 1000,
      repeat: 3,
      callback: () => {
        count -= 1;
        if (count > 0) {
          // --- เปลี่ยนจาก this.countdownText.setText เป็นบรรทัดนี้ ---
          this.updateCountdownDisplay(count);
          this.sound.play("fish-count", { volume: 0.45 });
       // แก้ไขใน countdownTimer callback
} else if (count === 0) {
    this.updateCountdownDisplay("เริ่ม!");
    this.sound.play("fish-start-sfx", { volume: 0.55 });
} else {
    // ลบตัวเลข
    if (this.countdownDisplay) {
        this.countdownDisplay.destroy();
        this.countdownDisplay = null;
    }
    // ลบพื้นหลังสีดำ
    if (this.countdownBg) {
        this.countdownBg.destroy();
        this.countdownBg = null;
    }
    this.startPlaying();
}
      },
    });
  }
updateCountdownDisplay(value) {
    if (this.countdownDisplay) {
        this.countdownDisplay.destroy();
    }

    const { width, height } = this.scale;

    // 1. สร้างแผ่นหลังมืด (เพื่อความสวยงามเหมือนเดิม)
    if (!this.countdownBg) {
        this.countdownBg = this.add.graphics()
            .fillStyle(0x000000, 0.4)
            .fillRect(0, 0, width, height)
            .setDepth(99);
    }

    // 2. สร้างตัวเลข
    const el = document.createElement('div');
    el.id = 'countdown-text';
    
    if (value === "เริ่ม!") {
        el.className = 'start-dom';
        el.innerText = 'เริ่ม!';
    } else {
        el.innerText = value;
    }

    // 3. วางที่กึ่งกลางจอ (สำคัญ: ต้องใช้ setOrigin(0.5))
    this.countdownDisplay = this.add.dom(width / 2, height / 0, el)
        .setOrigin(0.5) 
        .setDepth(100);

    // ปรับ Scale ของ DOM ให้สัมพันธ์กับขนาดจอ เพื่อความสวยงาม
    const shortSide = Math.min(width, height);
    const scaleFactor = Phaser.Math.Clamp(shortSide / 900, 0.8, 1.2);
    this.countdownDisplay.setScale(scaleFactor);
}
// FishScoopingScene.jsx
startPlaying() {
    this.phase = "playing";

    // เริ่มเพลง BGM และตัวนับเวลาเกม
    this.fairBgm = this.sound.add("fish-fair-bgm", {
      loop: true,
      volume: 0.16,
    });

    if (!this.fairBgm.isPlaying) {
      this.fairBgm.play();
    }

    // เริ่มระบบ Spawn ปลาใหม่ระหว่างเล่น
    this.spawnTimer = this.time.addEvent({
      delay: 2200,
      loop: true,
      callback: () => {
        if (this.phase !== "playing") return;
        if (this.fishes.countActive(true) >= MAX_FISH) return;
        this.spawnFish(this.getRandomFishType());
      },
    });

    // เริ่มลดเวลาเกมจาก 60 วินาที
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.timeLeft -= 1;
        this.updateHud();
        if (this.timeLeft <= 0) {
          this.endGame();
        }
      },
    });
}

  // FishScoopingScene.jsx
tryCatchFish() {
    let nearestFish = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    // ดึงค่าจุดศูนย์กลางของวงกลมช้อนมาใช้
    const netCenter = this.spoon.getNetCenter();

    this.fishes.children.each((fish) => {
      if (!fish?.active || fish.isCaught) return;

      // วัดระยะจาก "กลางตัวปลา" ไปยัง "กลางวงช้อน"
      const distance = Phaser.Math.Distance.Between(
        netCenter.x,
        netCenter.y,
        fish.x,
        fish.y
      );

      // ปรับระยะตักให้พอดีกับขนาดวงกลม (แนะนำที่ 40-50 สำหรับช้อนเล็ก)
      if (distance < 45 && distance < nearestDistance) {
        nearestFish = fish;
        nearestDistance = distance;
      }
    });

    if (!nearestFish) {
      this.showToast("ต้องเอาวงช้อนทับตัวปลาให้ตรงก่อนตัก", "#ffd2a0");
      return;
    }

    this.catchFish(nearestFish);
}

//เเก้กำหนดการขาดของช้อนตามขนาดตัวปลา เเละหักไอคอนช้อน
catchFish(fish) {
    if (this.phase !== "playing" || this.isSpoonBroken) return;
    if (this.spoon.holdingFish || fish.isCaught) return;

    this.spoon.catchFish(fish);
    fish.setDepth(6);
    this.sound.play("fish-scoop", { volume: 0.5 });

    this.escapeTimer?.remove(false);
    this.escapeTimer = this.time.delayedCall(HOLD_LIMIT_MS, () => {
        if (this.spoon.holdingFish !== fish || this.phase !== "playing") return;
        
        const fishType = fish.type;
        this.spoon.releaseFish();
        fish.releaseBackToWater(this.waterZone);
        this.cameras.main.shake(120, 0.0022);

        let damage = (fishType === "red") ? 5 : (fishType === "silver") ? 2.5 : 1;
        this.missDamage += damage;

        if (this.missDamage >= 5) {
            this.isSpoonBroken = true;
            this.spoonsLeft -= 1;
            this.spoon.setTexture("spoon-broken");

            // --- ส่วนการจัดการไอคอนขวาล่าง ---
            const lastIcon = this.spoonIcons.pop(); // ดึงไอคอนอันสุดท้ายออกมา
            if (lastIcon) {
                this.tweens.add({
                    targets: lastIcon,
                    alpha: 0,
                    scale: 0,
                    duration: 400,
                    onComplete: () => lastIcon.destroy()
                });
            }

            if (this.spoonsLeft > 0) {
                this.showToast(`ช้อนขาด! เปลี่ยนอันใหม่ (เหลือ ${this.spoonsLeft})`, "#ff7a7a");
                
                // หน่วงเวลา 0.8 วินาทีแล้วเริ่มช้อนใหม่ทันที
                this.time.delayedCall(800, () => {
                    this.spoon.setTexture("spoon");
                    this.missDamage = 0;
                    this.isSpoonBroken = false;
                });
            } else {
                this.showToast("ช้อนหมดแล้ว!", "#ff0000");
                this.time.delayedCall(1000, () => this.endGame());
            }
        } else {
            this.showToast("ระวังช้อนขาด!", "#ffd2a0");
        }
    });
}
 // FishScoopingScene.jsx
update(_, delta) {
    const pointer = this.input.activePointer;
    // ปรับให้ช้อนขยับตามเมาส์ได้ตั้งแต่ช่วงนับถอยหลังเลยจะดูสมูทขึ้น
    this.spoon?.update(pointer, (this.phase === "playing" || this.phase === "countdown"));

    // --- แก้ไขตรงนี้ ---
    // อนุญาตให้ปลาขยับได้ถ้าอยู่ในสถานะ countdown หรือ playing
    if (this.phase !== "playing" && this.phase !== "countdown") return;

    const netCenter = this.spoon?.getNetCenter?.() ?? null;
    this.fishes.children.each((fish) => {
      if (!fish?.active) return;
      fish.update(this.waterZone, netCenter, delta);
    });

    // เงื่อนไขการตักและการส่งปลาลงถัง ให้ทำได้เฉพาะตอน playing เท่านั้น
    if (this.phase !== "playing") return;

    if (!this.spoon?.holdingFish) return;

    const fish = this.spoon.holdingFish;
    if (this.isFishOverBucket(fish)) {
      this.registerCatch(fish);
    }
}
registerCatch(fish) {
    // 1. ดึงข้อมูลปลาจากนิยาม (FISH_DEFS) ให้ชัวร์ก่อน
    // ถ้า fish.type เป็น "silver" ตัว fishDef จะต้องได้ข้อมูลปลาเงิน
    const fishDef = FISH_DEFS[fish.type] ?? FISH_DEFS.red;

    // 2. ดึงคะแนนจาก fishDef โดยตรง (ป้องกันค่า fish.score เป็น undefined)
    const points = fishDef.score;

    this.score += points;

    // ใช้ else if เพื่อให้เช็คทีละเงื่อนไขอย่างชัดเจน
    if (fish.type === "gold") {
        this.goldCaught += 1;
    } else if (fish.type === "silver") {
        this.silverCaught += 1;
    } else {
        this.redCaught += 1;
    }

    const bucketX = this.bucket.x;
    const bucketY = this.bucket.y - (this.bucket.displayHeight * 0.12);

    const randomOffsetX = Phaser.Math.Between(-35, 35) * this.layout.uiScale;
    const randomOffsetY = Phaser.Math.Between(-18, 18) * this.layout.uiScale;

    const fishInBucket = this.add.image(
        bucketX + randomOffsetX,
        bucketY + randomOffsetY,
        fishDef.texture
    )
    .setScale(fish.scale * 0.55)
    .setAngle(Phaser.Math.Between(-30, 30))
    .setDepth(4);

    fishInBucket.setFlipX(Math.random() > 0.5);

    this.tweens.add({
      targets: fishInBucket,
      x: `+=${Phaser.Math.Between(-5, 5)}`,
      y: `+=${Phaser.Math.Between(3, 6)}`,
      angle: `+=${Phaser.Math.Between(-10, 10)}`,
      duration: 1500 + Math.random() * 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    this.bucketFishGroup.add(fishInBucket);
    this.escapeTimer?.remove(false);
    this.escapeTimer = null;

    this.updateHud();

    // --- จุดสำคัญ: ตรวจสอบว่า fishDef.label และ fishDef.toastColor ของปลาเงินมีค่าจริงไหม ---
    this.showToast(`+${points} คะแนน ${fishDef.label}`, fishDef.toastColor);

    fish.destroy();
    this.spoon.releaseFish();
    this.cameras.main.flash(90, 255, 247, 210, false);

    const baseBucketScale = Math.min(this.scale.width / 800, this.scale.height / 600) * 0.34;
    this.tweens.add({
      targets: this.bucket,
      scaleX: baseBucketScale * 1.06,
      scaleY: baseBucketScale * 1.06,
      duration: 120,
      yoyo: true,
      ease: "Sine.easeOut",
    });

    const burstOffset = Math.max(28, this.bucket.displayHeight * 0.22);
    const burstRadius = Math.max(12, this.bucket.displayWidth * 0.07);
    const burst = this.add.circle(this.bucket.x, this.bucket.y - burstOffset, burstRadius, 0xffef9c, 0.9).setDepth(7);
    this.tweens.add({
      targets: burst,
      scale: 3,
      alpha: 0,
      duration: 320,
      onComplete: () => burst.destroy(),
    });
}
updateHud() {
    // อัปเดตข้อความให้เป็นรูปแบบ "คะแนน: X" และ "เวลา: X"
    if (this.hud.score) {
        this.hud.score.valueText.setText(`คะแนน: ${this.score}`);
    }
    if (this.hud.timer) {
        this.hud.timer.valueText.setText(`เวลา: ${Math.max(0, this.timeLeft)}`);
    }
}
// FishScoopingScene.jsx
showToast(message, color) {
    const uiScale = this.layout?.uiScale ?? 1;
    const baseY = Math.round(136 * uiScale);
    const targetY = Math.round(112 * uiScale);
    const exitY = Math.round(100 * uiScale);

    // --- แก้ไข: ล้าง Toast เก่าทิ้งทันทีถ้ามีอยู่เพื่อป้องกันอาการไม่ขึ้นหรือค้าง ---
    if (this.currentToast) {
        this.currentToast.destroy();
    }
    if (this.toastTween) {
        this.toastTween.stop();
    }
    // ------------------------------------------------------------------

    this.currentToast = this.add.text(this.scale.width / 2, baseY, message, {
      fontFamily: "Kanit",
      fontSize: `${Math.round(24 * uiScale)}px`,
      color: "#381600",
      backgroundColor: color,
      padding: { left: 14, right: 14, top: 8, bottom: 8 },
    })
    .setOrigin(0.5)
    .setDepth(50) // ปรับ Depth ให้สูงมาก (เช่น 50) เพื่อไม่ให้โดนอะไรบัง
    .setAlpha(0);

    this.toastTween = this.tweens.add({
      targets: this.currentToast,
      alpha: 1,
      y: targetY,
      duration: 400, // ปรับให้แสดงผลไวขึ้น
      ease: "Cubic.easeOut",
      onComplete: () => {
        // รอ 800ms แล้วค่อยจางหายไป
        this.time.delayedCall(800, () => {
          if (!this.currentToast) return;
          this.tweens.add({
            targets: this.currentToast,
            alpha: 0,
            y: exitY,
            duration: 200,
            onComplete: () => {
              if (this.currentToast) {
                this.currentToast.destroy();
                this.currentToast = null;
              }
            },
          });
        });
      },
    });
}
endGame() {
    if (this.ended) return;
    this.ended = true;
    this.phase = "ended";
    
    // หยุดการทำงานของระบบต่างๆ
    this.fairBgm?.stop();
    this.spawnTimer?.remove(false);
    this.gameTimer?.remove(false);
    this.countdownTimer?.remove(false);
    this.escapeTimer?.remove(false);
    this.physics.pause();

    // --- ส่วนที่ต้องเพิ่ม/แก้ไข เพื่อให้อัปเดตคะแนน ---
    if (this.resultScoreText) {
        this.resultScoreText.setText(this.score.toString()); // อัปเดตตัวเลขคะแนนหลัก
        this.resultScoreText.setVisible(true);
    }

    // แสดงหน้าจอสรุปผล
    this.resultOverlay.setVisible(true);
    this.handleResize(); // เรียก resize เพื่อจัดตำแหน่งคะแนนให้อยู่ในป้ายที่ย่อขนาดลง
}

  cleanup() {
    this.scale.off("resize", this.handleResize, this);
    this.fairBgm?.stop();
    this.fairBgm?.destroy();
    this.fairBgm = null;
    this.spawnTimer?.remove(false);
    this.gameTimer?.remove(false);
    this.countdownTimer?.remove(false);
    this.escapeTimer?.remove(false);
    this.toastTween?.stop();
  }
}
