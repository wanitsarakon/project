import Phaser from "phaser";

const ASSET_BASE = "/assets/flowergame";
const SIGN_BOARD = "/assets/เเผ่นป้ายเวลากับคะเเนน.png";
const GAME_DURATION_SECONDS = 120;
const FLOWERS = [
  { id: "white", label: "ดอกมะลิ", image: `${ASSET_BASE}/image/flower-white.png` },
  { id: "red", label: "ดอกกุหลาบ", image: `${ASSET_BASE}/image/flower-red.png` },
  { id: "yellow", label: "ดอกจำปา", image: `${ASSET_BASE}/image/flower-yellow.png` },
  { id: "green", label: "ใบแก้ว", image: `${ASSET_BASE}/image/flower-green.png` },
  { id: "purple", label: "ดอกรักม่วง", image: `${ASSET_BASE}/image/flower-purple.png` },
];
const FLOWER_BY_ID = Object.fromEntries(FLOWERS.map((flower) => [flower.id, flower]));
const CUSTOMER_IMAGES = ["npc-customer-1.png", "npc-customer-21.png", "npc-customer-3.png", "npc-customer-4.png", "npc-customer-5.png"];
const ORDER_DIALOGS = [
  "สวัสดีจ้า รับร้อยพวงมาลัยแบบนี้หน่อย",
  "ช่วยร้อยพวงมาลัยให้ทีนะจ๊ะ",
  "ขอแบบสวยๆ ไปไหว้พระหน่อยจ้า",
  "รบกวนร้อยตามแบบนี้ให้หน่อยสิ",
  "แม่ค้าจ๋า เอาแบบตามนี้เลยนะ",
];
const ANGRY_DIALOGS = [
  "ทำไมทำแบบนี้! ไม่เอาแล้ว!",
  "ร้อยผิดแบบนี้ ฉันไปร้านอื่นดีกว่า!",
  "นี่มันไม่ใช่ที่สั่งไว้นี่นา! แย่มาก!",
  "เสียเวลาจริงๆ! ฉันรีบนะ!",
  "โถ่เอ๊ย! ทำของสวยๆ เสียหมดเลย!",
];
const NPC_PROFILES = {
  "npc-customer-1.png": { type: "normal", patience: 45, scoreMult: 1, timeBonus: 0, lengthMod: 0, decay: 0.1 },
  "npc-customer-21.png": { type: "rusher", patience: 25, scoreMult: 3, timeBonus: 0, lengthMod: -2, decay: 0.2 },
  "npc-customer-3.png": { type: "tourist", patience: 80, scoreMult: 1.5, timeBonus: 0, lengthMod: 5, decay: 0.05 },
  "npc-customer-4.png": { type: "vip", patience: 40, scoreMult: 1.2, timeBonus: 10, lengthMod: 1, decay: 0.1 },
  "npc-customer-5.png": { type: "normal", patience: 55, scoreMult: 1.1, timeBonus: 0, lengthMod: 0, decay: 0.08 },
};
const rand = (items) => items[Math.floor(Math.random() * items.length)];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default class FlowerGameScene extends Phaser.Scene {
  constructor() {
    super({ key: "FlowerGameScene" });
    this.onGameEnd = null;
    this.root = null;
    this.shadow = null;
    this.gameTimer = null;
    this.countdownTimer = null;
    this.customerTimers = new Map();
    this.timeouts = new Set();
    this.audio = {};
    this.cleanedUp = false;
    this.resetGameState();
  }

  init(data = {}) {
    this.onGameEnd = data?.onGameEnd ?? null;
    this.cleanedUp = false;
    this.resetGameState();
  }

  create() {
    this.mount();
    this.events.once("shutdown", () => this.cleanup());
    this.events.once("destroy", () => this.cleanup());
  }

  shutdown() {
    this.cleanup();
  }

  _removeOverlay() {
    this.cleanup();
  }

  resetGameState() {
    this.score = 0;
    this.timeLeft = GAME_DURATION_SECONDS;
    this.gameActive = false;
    this.started = false;
    this.ended = false;
    this.round = 1;
    this.customers = [];
    this.selectedCustomer = null;
    this.currentInput = [];
    this.combo = 0;
    this.maxCombo = 0;
    this.feverMode = false;
    this.itemWaterCount = 3;
    this.itemPowderCount = 1;
    this.isTimeFrozen = false;
    this.perfectStreak = 0;
    this.bestPerfectStreak = 0;
  }

  css() {
    return `
      :host,*,*::before,*::after{box-sizing:border-box}
      #game-container{position:absolute;inset:0;overflow:hidden;font-family:Kanit,Tahoma,sans-serif;background:url('${ASSET_BASE}/image/bg-temple.png') no-repeat center/100% 100%}
      .ui-header{position:absolute;top:1.2vh;left:0;width:100%;display:flex;justify-content:space-between;align-items:flex-start;padding:0 1.6vw;z-index:100;pointer-events:none}
      .sign-board{width:min(18vw,250px);min-width:170px;aspect-ratio:606/186;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;padding:0 1.4vw 0 1.2vw;background:url('${SIGN_BOARD}') no-repeat center/100% 100%;filter:drop-shadow(0 5px 12px rgba(0,0,0,.4))}
      .sign-board .label{font-size:clamp(18px,1.7vw,24px);font-weight:800;color:#ffd55b;text-shadow:1px 1px 0 #6d3300}.sign-board .value{justify-self:end;font-size:clamp(30px,3vw,50px);font-weight:900;line-height:1;color:#fff0a8;text-shadow:0 2px 0 #7a3f00}
      .item-inventory{position:absolute;left:50%;bottom:2vh;transform:translateX(-50%);display:flex;gap:18px;align-items:center;padding:7px 22px 9px;background:rgba(65,32,20,.82);border:2px solid #d6aa2c;border-radius:999px;z-index:101;pointer-events:none}.item-slot{min-width:76px;text-align:center;color:#fff}.item-label{display:block;font-size:12px;color:#f4cf54}.item-count{display:block;font-size:24px;font-weight:900;line-height:1.1}
      .customer-area{position:absolute;left:0;bottom:0;width:100%;height:100vh;pointer-events:none;z-index:10}.customer-container{position:absolute;width:45vh;height:80vh;bottom:0;display:flex;align-items:flex-end;pointer-events:auto;cursor:pointer;transition:left 1.5s ease-out,right 1.5s ease-out,opacity 1s,transform .3s,filter .3s}.from-left{left:-50vh}.from-right{right:-50vh}.customer-container.selected{filter:drop-shadow(0 0 20px rgba(255,215,0,.8));transform:scale(1.05)}.customer-container.fast-leave{transition:left .5s ease-in,right .5s ease-in,opacity .4s}.customer-container.patience-warning{animation:blink-red .5s infinite alternate}
      .customer-sprite{width:100%;height:100%;background:no-repeat center/contain}.npc-5-special .customer-sprite{transform:scale(.9);transform-origin:bottom center}
      .patience-bar-bg{position:absolute;left:0;bottom:45%;width:12px;height:35%;background:rgba(0,0,0,.5);border:2px solid #fff;border-radius:10px;overflow:hidden;z-index:11}.from-right .patience-bar-bg{left:auto;right:0}.patience-bar-fill{position:absolute;bottom:0;width:100%;height:100%;background:linear-gradient(to top,#f44336,#ffeb3b,#4caf50);transition:height .1s linear}
      .order-bubble{position:absolute;top:-10%;left:70%;display:none;flex-wrap:wrap;justify-content:center;gap:5px;max-width:150px;min-width:150px;padding:10px;background:rgba(255,255,255,.96);border:4px solid #f9dcc4;border-radius:20px;box-shadow:0 5px 15px rgba(0,0,0,.3);z-index:110}.order-bubble.show{display:flex;animation:pop-bubble .4s forwards}.order-bubble::before{content:"";position:absolute;bottom:-18px;left:25px;border-width:18px 12px 0;border-style:solid;border-color:#f9dcc4 transparent transparent;z-index:99}.order-bubble::after{content:"";position:absolute;bottom:-12px;left:27px;border-width:15px 10px 0;border-style:solid;border-color:rgba(255,255,255,.98) transparent transparent;z-index:101}
      .from-right .order-bubble{left:auto;right:40%;top:-5%}.from-right .order-bubble::before,.from-right .order-bubble::after{left:auto;right:22px}.npc-5-special .order-bubble{top:15%!important}.from-right.npc-5-special .order-bubble{right:75%!important}.from-right.npc-5-special .order-bubble::before,.from-right.npc-5-special .order-bubble::after{right:20px}.order-bubble.bubble-angry{border-color:#f00;background:#fff0f0;box-shadow:0 0 15px rgba(255,0,0,.4)}.order-bubble.bubble-angry::before{border-color:#f00 transparent transparent}
      .order-text,.angry-text,.item-success-text{margin:0;padding:5px 10px;font-size:14px;font-weight:700;text-align:center;line-height:1.45}.order-text{color:#4b3621}.angry-text{color:#c62828}.item-success-text{color:#2e7d32}.hint-flower{width:20px;height:20px;background:no-repeat center/contain}
      .garland-display{position:absolute;top:12vh;left:50%;transform:translateX(-50%);z-index:20;pointer-events:none}.rope{position:absolute;top:-15vh;left:50%;width:min(74vw,800px);height:50vh;transform:translateX(-50%);background:url('${ASSET_BASE}/image/rope.png') no-repeat center/contain;z-index:-15}#garland-stack{position:relative;width:250px;height:600px;margin:0 auto;animation:wind-swing 5s ease-in-out infinite alternate;transform-origin:top center}
      .flower-on-garland{position:absolute;width:100px;height:60px;left:50%;margin-left:-50px;background:no-repeat center/contain;animation:flower-sparkle .4s ease-out}.flower-on-garland:nth-child(1){top:0vh;transform:rotate(0deg);z-index:10}.flower-on-garland:nth-child(2){top:3vh;left:35%;transform:rotate(-30deg);z-index:9}.flower-on-garland:nth-child(3){top:9vh;left:30%;transform:rotate(-70deg);z-index:8}.flower-on-garland:nth-child(4){top:15vh;left:35%;transform:rotate(-120deg);z-index:9}.flower-on-garland:nth-child(5){top:3vh;left:65%;transform:rotate(30deg);z-index:9}.flower-on-garland:nth-child(6){top:9vh;left:70%;transform:rotate(70deg);z-index:8}.flower-on-garland:nth-child(7){top:15vh;left:65%;transform:rotate(120deg);z-index:9}.flower-on-garland:nth-child(8){top:18vh;transform:rotate(0deg);z-index:15}.flower-on-garland:nth-child(9){top:23vh;z-index:14}.flower-on-garland:nth-child(10){top:27vh;transform:scale(.9);z-index:13}.flower-on-garland:nth-child(11){top:31vh;transform:scale(1.1);z-index:12}.flower-on-garland:nth-child(12){top:35vh;left:40%;transform:rotate(-15deg) scale(.9);z-index:11}.flower-on-garland:nth-child(13){top:39vh;left:35%;transform:rotate(-25deg) scale(.9);z-index:10}.flower-on-garland:nth-child(14){top:35vh;left:60%;transform:rotate(15deg) scale(.9);z-index:11}.flower-on-garland:nth-child(15){top:39vh;left:65%;transform:rotate(25deg) scale(.9);z-index:10}
      .tassel-garland{position:absolute;top:44vh;left:50%;width:160px;height:130px;margin-left:-80px;z-index:20}.tassel-garland::before,.tassel-garland::after{content:"";position:absolute;top:14px;width:26px;height:92px;border-radius:999px 999px 40px 40px;background:linear-gradient(180deg,#fff4d4 0%,#ffd87c 28%,#ff8d66 100%);box-shadow:0 5px 18px rgba(0,0,0,.22)}.tassel-garland::before{left:42px;transform:rotate(14deg)}.tassel-garland::after{right:42px;transform:rotate(-14deg)}.tassel-knot{position:absolute;top:0;left:50%;width:46px;height:32px;transform:translateX(-50%);border-radius:999px;background:linear-gradient(180deg,#fff9d5,#f0b35c);box-shadow:0 3px 10px rgba(0,0,0,.22)}
      .table-foreground{position:absolute;left:0;bottom:0;width:100%;height:100%;background:url('${ASSET_BASE}/image/table-front.png') no-repeat bottom center/100% auto;z-index:30;pointer-events:none}.item-actions{position:absolute;inset:0;z-index:210;pointer-events:none}.btn-use-item{position:absolute;z-index:210;min-width:102px;padding:12px 25px;border:2px solid rgba(255,255,255,.8);border-radius:50px;color:#fff;font-size:18px;font-weight:800;text-shadow:1px 1px 2px rgba(0,0,0,.5);box-shadow:0 6px 0 rgba(0,0,0,.2),0 10px 20px rgba(0,0,0,.3);cursor:pointer;pointer-events:auto;transition:all .2s cubic-bezier(.175,.885,.32,1.275)}
      .btn-use-item:hover{transform:translateY(-3px) scale(1.05);box-shadow:0 9px 0 rgba(0,0,0,.15),0 15px 25px rgba(0,0,0,.4);filter:brightness(1.1)}.btn-use-item:disabled{opacity:.45;cursor:default;transform:none;filter:none}.btn-use-item::after{content:attr(data-tooltip);position:absolute;bottom:130%;left:50%;transform:translateX(-50%) translateY(10px);padding:8px 15px;background:#632b00;color:#ffd700;border:2px solid #ffd700;border-radius:12px;font-size:14px;white-space:nowrap;box-shadow:0 5px 15px rgba(0,0,0,.4);opacity:0;visibility:hidden;transition:all .2s ease-out;pointer-events:none}.btn-use-item::before{content:"";position:absolute;bottom:115%;left:50%;transform:translateX(-50%) translateY(10px);border-width:8px 8px 0;border-style:solid;border-color:#ffd700 transparent transparent;opacity:0;visibility:hidden;transition:all .2s ease-out;pointer-events:none}.btn-use-item:hover::after,.btn-use-item:hover::before{opacity:1;visibility:visible;transform:translateX(-50%) translateY(0)}
      .water-bg{left:14vw;bottom:30vh;background:linear-gradient(135deg,#00c6ff 0%,#0072ff 100%)}.powder-bg{right:13vw;bottom:31vh;background:linear-gradient(135deg,#ff9a9e 0%,#f6416c 100%)}.controls-container{position:absolute;bottom:20vh;left:0;width:100%;display:flex;justify-content:center;gap:2vw;padding-left:2vw;z-index:200}.btn-flower{width:15vh;height:20vh;border:none;background:transparent no-repeat center/contain;cursor:pointer;transition:transform .12s ease,filter .12s ease}.btn-flower:hover{transform:translateY(-2px) scale(1.05);filter:drop-shadow(0 3px 6px rgba(0,0,0,.25))}.btn-flower:active{transform:scale(.9)}
      .overlay{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.62);z-index:1000}.overlay.show{display:flex}.level-board{position:relative;width:min(78vw,820px);aspect-ratio:1280/960;background:url('${ASSET_BASE}/image/frame.png') no-repeat center/contain;filter:drop-shadow(0 14px 28px rgba(0,0,0,.42))}.start-copy{position:absolute;top:51%;left:50%;width:46%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;color:#fff6e7;text-shadow:0 2px 8px rgba(0,0,0,.45)}.start-copy p{margin:0;font-size:clamp(14px,1.05vw,17px);line-height:1.55;max-width:100%}.start-actions{position:absolute;left:50%;bottom:17%;display:flex;gap:16px;transform:translateX(-50%)}
      #start-btn,#finish-btn,#close-tutorial,#tutorial-btn{border:none;border-radius:999px;cursor:pointer;font-family:inherit;font-weight:800}#start-btn,#finish-btn{padding:15px 40px;font-size:clamp(20px,2vw,30px);color:#fff;background:linear-gradient(180deg,#ffcc00 0%,#ff8800 50%,#ff4400 100%);box-shadow:0 8px 0 #992200,0 15px 20px rgba(0,0,0,.5);text-shadow:2px 2px 4px rgba(0,0,0,.5)}#start-btn:hover,#finish-btn:hover{transform:translateY(-3px) scale(1.05)}#tutorial-btn{padding:13px 26px;font-size:clamp(16px,1.5vw,20px);color:#fff4dc;background:rgba(82,29,5,.88);box-shadow:0 10px 18px rgba(0,0,0,.28)}#countdown-text{color:#f1c40f;font-size:clamp(110px,18vw,180px);font-weight:900;text-shadow:8px 8px 0 #000;animation:count-bounce .5s ease-out forwards}
      #tutorial-overlay{flex-direction:column}.tutorial-step{position:absolute;bottom:110px;display:flex;flex-direction:column-reverse;align-items:center;text-align:center}#tutorial-water{left:20%}#tutorial-powder{right:20%}.tutorial-box{width:180px;padding:10px;background:#fff;border:3px solid #632b00;border-radius:15px;box-shadow:0 5px 15px rgba(0,0,0,.3);color:#333}.tutorial-box h4{margin:0 0 5px;color:#d32f2f}.tutorial-box p{margin:0;font-size:14px;line-height:1.45}.arrow{font-size:40px;font-weight:900;color:#ffd700;text-shadow:2px 2px 0 #632b00;animation:arrow-bounce .6s infinite alternate}#close-tutorial{margin-top:auto;margin-bottom:48px;padding:12px 30px;font-size:20px;color:#fff7e8;background:linear-gradient(180deg,#b33e08,#7c2200);box-shadow:0 14px 24px rgba(0,0,0,.24)}
      #result-screen{flex-direction:column}.result-container{position:relative;width:min(76vw,780px);display:flex;align-items:center;justify-content:center}#result-banner{display:block;width:100%;height:auto;filter:drop-shadow(0 10px 15px rgba(0,0,0,.5))}.result-text-overlay{position:absolute;top:59%;left:50%;width:74%;transform:translate(-50%,-50%);text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px}#total-score{margin:34px 0 0;font-size:clamp(56px,8vw,90px);font-weight:900;line-height:.9;background:linear-gradient(180deg,#fff 30%,#ffd700 60%,#ff8c00 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;filter:drop-shadow(4px 4px 0 #632b00) drop-shadow(0 0 15px rgba(255,140,0,.5))}.result-meta{margin:0;max-width:420px;color:#5c2600;font-size:clamp(14px,2vw,18px);font-weight:700}.result-actions{margin-top:14px}
      #game-container::after{content:"";position:absolute;top:0;left:0;width:100%;height:100%;opacity:0;pointer-events:none;z-index:4;transition:opacity .5s ease}#game-container.time-frozen::after{opacity:1;background:radial-gradient(circle at center,transparent 40%,rgba(255,255,255,.8) 100%),radial-gradient(circle at center,transparent 60%,rgba(0,160,255,.4) 100%);backdrop-filter:blur(4px) saturate(1.2);box-shadow:inset 0 0 100px rgba(0,242,254,.6)}#game-container.fever-active{animation:fever-bg .5s infinite alternate}#game-container.shake-effect{animation:shake .3s ease-in-out}#game-container.time-frozen #garland-stack{animation-play-state:paused;filter:drop-shadow(0 0 10px rgba(0,191,255,.5)) saturate(.8)}
      @keyframes pop-bubble{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}@keyframes wind-swing{from{transform:rotate(-1.5deg)}to{transform:rotate(1.5deg)}}@keyframes flower-sparkle{0%{transform:scale(.5);filter:brightness(2)}50%{transform:scale(1.2);filter:brightness(1.5)}100%{transform:scale(1);filter:brightness(1)}}@keyframes blink-red{from{filter:drop-shadow(0 0 5px red)}to{filter:drop-shadow(0 0 15px red) brightness(1.2)}}@keyframes fever-bg{from{box-shadow:inset 0 0 50px #f00}to{box-shadow:inset 0 0 100px #fc0}}@keyframes shake{10%,90%{transform:translate3d(-1px,0,0)}20%,80%{transform:translate3d(2px,0,0)}30%,50%,70%{transform:translate3d(-4px,0,0)}40%,60%{transform:translate3d(4px,0,0)}}@keyframes count-bounce{0%{transform:scale(.3);opacity:0}50%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}@keyframes arrow-bounce{from{transform:translateY(0)}to{transform:translateY(15px)}}
      @media (max-width:900px){.ui-header{padding:0 8px}.sign-board{min-width:132px;width:26vw;padding:0 14px 0 16px}.sign-board .label{font-size:14px}.sign-board .value{font-size:24px}.customer-container{width:min(31vw,220px);height:min(58vh,380px)}.order-bubble{top:-2%;left:62%;min-width:118px;max-width:142px}.from-right .order-bubble{right:46%}.controls-container{bottom:17vh;gap:3vw;padding-left:0}.btn-flower{width:14vw;height:18vw;max-width:86px;max-height:112px}.water-bg{left:10vw;bottom:25vh}.powder-bg{right:10vw;bottom:25vh}.btn-use-item{min-width:80px;padding:8px 14px;font-size:14px}.item-inventory{gap:10px;padding:6px 12px}.item-slot{min-width:64px}.level-board{width:min(92vw,620px)}.start-copy{top:52%;width:58%;gap:8px}.start-copy p{font-size:12px;line-height:1.45}.start-actions{bottom:16%;gap:10px}.result-container{width:min(94vw,700px)}}
    `;
  }

  html() {
    return `
      <div id="game-container">
        <div class="ui-header">
          <div class="sign-board"><div class="label">เวลา</div><div id="timer-val" class="value">${GAME_DURATION_SECONDS}</div></div>
          <div class="item-inventory"><div class="item-slot"><span class="item-label">น้ำอบ</span><span id="count-water" class="item-count">3</span></div><div class="item-slot"><span class="item-label">ธูป</span><span id="count-powder" class="item-count">1</span></div></div>
          <div class="sign-board"><div class="label">คะแนน</div><div id="score-val" class="value">0</div></div>
        </div>
        <div id="start-screen" class="overlay show"><div class="level-board"><div class="start-copy"><p>เลือกลูกค้าที่ต้องการบริการ แล้วร้อยพวงมาลัยให้ตรงแบบก่อนความอดทนจะหมด ใช้น้ำอบและธูปให้ถูกจังหวะเพื่อเร่งคอมโบและทำคะแนนให้สูงที่สุด</p></div><div class="start-actions"><button id="start-btn">เริ่มเกม</button><button id="tutorial-btn">ดูวิธีเล่น</button></div></div></div>
        <div id="result-screen" class="overlay"><div class="result-container"><img src="${ASSET_BASE}/image/result_summary_banner.png" id="result-banner" alt="สรุปผลคะแนน" /><div class="result-text-overlay"><h1 id="total-score">0</h1><p id="result-meta" class="result-meta"></p><div class="result-actions"><button id="finish-btn">กลับไปแผนที่</button></div></div></div></div>
        <div id="countdown-overlay" class="overlay"><div id="countdown-text">3</div></div>
        <div id="customer-area" class="customer-area"></div>
        <div class="garland-display"><div class="rope"></div><div id="garland-stack"></div></div>
        <div class="table-foreground"></div>
        <div class="item-actions"><button id="water-btn" class="btn-use-item water-bg" data-tooltip="น้ำอบ: ช่วยหยุดหลอดความอดทนเป็นเวลา 5 วินาที">ใช้น้ำอบ</button><button id="powder-btn" class="btn-use-item powder-bg" data-tooltip="ธูป: ช่วยให้ร้อยพวงมาลัยเสร็จทันที">ใช้ธูป</button></div>
        <div id="controls-container" class="controls-container"></div>
        <div id="tutorial-overlay" class="overlay"><div class="tutorial-step" id="tutorial-water"><div class="tutorial-box"><h4>น้ำอบ</h4><p>ช่วยหยุดหลอดความอดทนของลูกค้าทุกคนเป็นเวลา 5 วินาที</p></div><div class="arrow">↓</div></div><div class="tutorial-step" id="tutorial-powder"><div class="tutorial-box"><h4>ธูป</h4><p>ช่วยร้อยพวงมาลัยของลูกค้าคนที่เลือกอยู่ให้เสร็จทันที</p></div><div class="arrow">↓</div></div><button id="close-tutorial">เข้าใจแล้ว!</button></div>
      </div>
    `;
  }

  mount() {
    const container = this.game.canvas?.parentElement;
    if (!container) return;
    if (window.getComputedStyle(container).position === "static") container.style.position = "relative";
    this.root = document.createElement("div");
    this.root.style.cssText = "position:absolute;inset:0;z-index:2";
    this.shadow = this.root.attachShadow({ mode: "open" });
    this.shadow.innerHTML = `<style>${this.css()}</style>${this.html()}`;
    container.appendChild(this.root);
    this.cacheElements();
    this.setupAudio();
    this.createFlowerButtons();
    this.bindEvents();
    this.renderHud();
    this.clearGarland();
  }

  cacheElements() {
    const $ = (selector) => this.shadow.querySelector(selector);
    this.gameContainer = $("#game-container");
    this.timerValEl = $("#timer-val");
    this.scoreValEl = $("#score-val");
    this.countWaterEl = $("#count-water");
    this.countPowderEl = $("#count-powder");
    this.startScreenEl = $("#start-screen");
    this.resultScreenEl = $("#result-screen");
    this.countdownOverlayEl = $("#countdown-overlay");
    this.countdownTextEl = $("#countdown-text");
    this.customerAreaEl = $("#customer-area");
    this.garlandStackEl = $("#garland-stack");
    this.controlsContainerEl = $("#controls-container");
    this.waterBtnEl = $("#water-btn");
    this.powderBtnEl = $("#powder-btn");
    this.tutorialOverlayEl = $("#tutorial-overlay");
    this.totalScoreEl = $("#total-score");
    this.resultMetaEl = $("#result-meta");
    this.startBtnEl = $("#start-btn");
    this.tutorialBtnEl = $("#tutorial-btn");
    this.closeTutorialEl = $("#close-tutorial");
    this.finishBtnEl = $("#finish-btn");
  }

  setupAudio() {
    this.audio = {
      bgMusic: new Audio(`${ASSET_BASE}/audio/background.mp3`),
      sfx321: new Audio(`${ASSET_BASE}/audio/countdown.mp3`),
      sfxStart: new Audio(`${ASSET_BASE}/audio/start.mp3`),
    };
    this.audio.bgMusic.loop = true;
    this.audio.bgMusic.volume = 0.4;
  }

  createFlowerButtons() {
    this.controlsContainerEl.innerHTML = "";
    FLOWERS.forEach((flower) => {
      const button = document.createElement("button");
      button.className = "btn-flower";
      button.title = flower.label;
      button.style.backgroundImage = `url('${flower.image}')`;
      button.addEventListener("click", () => this.playAdd(flower.id));
      this.controlsContainerEl.appendChild(button);
    });
  }

  bindEvents() {
    this.startBtnEl?.addEventListener("click", () => this.startCountdown());
    this.tutorialBtnEl?.addEventListener("click", () => this.showTutorial());
    this.closeTutorialEl?.addEventListener("click", () => this.hideTutorial());
    this.waterBtnEl?.addEventListener("click", () => this.useWater());
    this.powderBtnEl?.addEventListener("click", () => this.usePowder());
    this.finishBtnEl?.addEventListener("click", () => {
      this.onGameEnd?.({ score: this.score, game: "FlowerGame", meta: { round: this.round, combo: this.maxCombo, perfectStreak: this.bestPerfectStreak } });
    });
  }

  initGame() {
    this.score = 0;
    this.timeLeft = GAME_DURATION_SECONDS;
    this.combo = 0;
    this.maxCombo = 0;
    this.perfectStreak = 0;
    this.bestPerfectStreak = 0;
    this.itemWaterCount = 3;
    this.itemPowderCount = 1;
    this.isTimeFrozen = false;
    this.feverMode = false;
    this.gameActive = true;
    this.started = true;
    this.ended = false;
    this.round = 1;
    this.selectedCustomer = null;
    this.currentInput = [];
    this.clearAllCustomerTimers();
    this.customerAreaEl.innerHTML = "";
    this.customers = [];
    this.clearGarland();
    this.gameContainer.classList.remove("time-frozen", "fever-active", "shake-effect");
    this.resultScreenEl.classList.remove("show");
    if (this.gameTimer) window.clearInterval(this.gameTimer);
    this.renderHud();
    this.gameTimer = window.setInterval(() => this.updateGlobalTimer(), 1000);
    this.startRound();
  }

  updateGlobalTimer() {
    if (!this.gameActive) return;
    this.timeLeft -= 1;
    this.renderHud();
    if (this.timeLeft <= 0) this.endGame();
  }

  startRound() {
    this.customerAreaEl.innerHTML = "";
    this.clearAllCustomerTimers();
    this.customers = [];
    this.selectedCustomer = null;
    this.currentInput = [];
    this.clearGarland();
    [...CUSTOMER_IMAGES].sort(() => Math.random() - 0.5).slice(0, ((this.round - 1) % 5) + 1).forEach((npcImage, index) => {
      this.schedule(() => { if (this.gameActive) this.createCustomer(index, npcImage); }, index * 1500);
    });
    this.renderHud();
  }

  createCustomer(id, npcImage) {
    const profile = NPC_PROFILES[npcImage];
    if (!profile) return;
    const isLeft = id % 2 === 0;
    const offset = Math.floor(id / 2) * 12;
    const container = document.createElement("div");
    const patternLength = Math.min(15, Math.max(11, this.round + 10 + profile.lengthMod));
    const colors = ["white", "red", "yellow", "green", "purple"].slice(0, Math.min(5, 3 + Math.floor(this.round / 4)));
    const pattern = Array.from({ length: patternLength }, () => rand(colors));
    container.id = `cust-${id}`;
    container.className = `customer-container ${isLeft ? "from-left" : "from-right"} npc-${profile.type} ${npcImage === "npc-customer-5.png" ? "npc-5-special" : ""}`.trim();
    container.innerHTML = `<div class="patience-bar-bg"><div id="bar-${id}" class="patience-bar-fill"></div></div><div id="bubble-${id}" class="order-bubble show"><p class="order-text">${rand(ORDER_DIALOGS)}</p></div><div class="customer-sprite"></div>`;
    const customer = {
      id,
      npcImage,
      baseImage: npcImage,
      pattern,
      patience: profile.patience,
      maxPatience: profile.patience,
      isDone: false,
      isLeft,
      timer: null,
      el: container,
      barEl: container.querySelector(`#bar-${id}`),
      bubbleEl: container.querySelector(`#bubble-${id}`),
      spriteEl: container.querySelector(".customer-sprite"),
    };
    container.addEventListener("click", () => this.selectCustomer(id));
    this.customerAreaEl.appendChild(container);
    this.customers.push(customer);
    this.updateCustomerSprite(customer, "normal");
    this.schedule(() => {
      if (!container.isConnected) return;
      if (isLeft) container.style.left = `${2 + offset}vw`;
      else container.style.right = `${2 + offset}vw`;
    }, 100);
    customer.timer = window.setInterval(() => {
      if (customer.isDone || !this.gameActive || this.isTimeFrozen) return;
      const percentage = ((customer.patience -= (profile.decay + this.round * 0.02) * (1 + this.round * 0.05)) / customer.maxPatience) * 100;
      if (customer.barEl) customer.barEl.style.height = `${clamp(percentage, 0, 100)}%`;
      if (percentage < 50 && percentage >= 30) this.updateCustomerSprite(customer, "worried");
      if (percentage < 30) {
        customer.el.classList.add("patience-warning");
        if (customer.barEl) customer.barEl.style.background = "red";
      }
      if (customer.patience <= 0) {
        window.clearInterval(customer.timer);
        customer.timer = null;
        this.customerLeave(id, true);
      }
    }, 100);
    this.customerTimers.set(id, customer.timer);
  }

  getCustomer(id) {
    return this.customers.find((customer) => customer.id === id) ?? null;
  }

  clearCustomerBubbles() {
    this.customers.forEach((customer) => {
      customer.el.classList.remove("selected");
      customer.bubbleEl?.classList.remove("show", "bubble-angry");
    });
  }

  selectCustomer(id) {
    if (!this.gameActive) return;
    const customer = this.getCustomer(id);
    if (!customer || customer.isDone) return;
    this.clearCustomerBubbles();
    customer.el.classList.add("selected");
    this.selectedCustomer = customer;
    this.currentInput = [];
    this.clearGarland();
    customer.bubbleEl.innerHTML = "";
    customer.pattern.forEach((color) => {
      const hint = document.createElement("div");
      hint.className = "hint-flower";
      hint.style.backgroundImage = `url('${FLOWER_BY_ID[color].image}')`;
      customer.bubbleEl.appendChild(hint);
    });
    customer.bubbleEl.classList.add("show");
    this.renderHud();
  }

  appendGarlandFlower(color) {
    const flower = document.createElement("div");
    flower.className = `flower-on-garland f-${color} flower-pop`;
    flower.style.backgroundImage = `url('${FLOWER_BY_ID[color].image}')`;
    this.garlandStackEl.appendChild(flower);
  }

  clearGarland() {
    if (this.garlandStackEl) this.garlandStackEl.innerHTML = "";
  }

  renderCurrentGarland() {
    this.clearGarland();
    this.currentInput.forEach((color) => this.appendGarlandFlower(color));
  }

  addTassel() {
    const tassel = document.createElement("div");
    tassel.className = "tassel-garland";
    tassel.innerHTML = '<div class="tassel-knot"></div>';
    this.garlandStackEl.appendChild(tassel);
  }

  playAdd(color) {
    if (!this.gameActive || !this.selectedCustomer) return;
    const expected = this.selectedCustomer.pattern[this.currentInput.length];
    if (color === expected) {
      this.currentInput.push(color);
      this.perfectStreak += 1;
      this.bestPerfectStreak = Math.max(this.bestPerfectStreak, this.perfectStreak);
      this.appendGarlandFlower(color);
      if (this.currentInput.length === this.selectedCustomer.pattern.length) this.finishCustomer();
      return;
    }
    this.perfectStreak = 0;
    this.gameContainer.classList.add("shake-effect");
    this.schedule(() => this.gameContainer.classList.remove("shake-effect"), 500);
    this.customerAngryLeave();
  }

  useWater() {
    if (this.itemWaterCount <= 0 || !this.gameActive || this.isTimeFrozen) return;
    this.itemWaterCount -= 1;
    this.isTimeFrozen = true;
    this.renderHud();
    this.gameContainer.classList.add("time-frozen");
    this.schedule(() => {
      this.isTimeFrozen = false;
      this.gameContainer.classList.remove("time-frozen");
      this.renderHud();
    }, 5000);
  }

  usePowder() {
    if (this.itemPowderCount <= 0 || !this.gameActive || !this.selectedCustomer) return;
    this.itemPowderCount -= 1;
    this.selectedCustomer.bubbleEl.innerHTML = '<p class="item-success-text">เสร็จทันใจ!</p>';
    this.selectedCustomer.bubbleEl.classList.add("show");
    this.currentInput = [...this.selectedCustomer.pattern];
    this.renderCurrentGarland();
    this.renderHud();
    this.finishCustomer();
  }

  updateCustomerSprite(customer, mood = "normal") {
    if (!customer?.spriteEl) return;
    let imageName = customer.baseImage;
    if (mood === "worried") imageName = customer.baseImage.replace(".png", "-worried.png");
    else if (mood === "angry") imageName = customer.baseImage.replace(".png", "-angry.png");
    customer.spriteEl.style.backgroundImage = `url('${ASSET_BASE}/image/${imageName}')`;
  }

  customerAngryLeave() {
    if (!this.selectedCustomer) return;
    const customer = this.selectedCustomer;
    this.combo = 0;
    customer.isDone = true;
    this.clearCustomerTimer(customer.id);
    this.updateCustomerSprite(customer, "angry");
    customer.bubbleEl.className = "order-bubble show bubble-angry";
    customer.bubbleEl.innerHTML = `<p class="angry-text">${rand(ANGRY_DIALOGS)}</p>`;
    this.selectedCustomer = null;
    this.currentInput = [];
    this.renderHud();
    this.schedule(() => {
      this.clearGarland();
      this.customerLeave(customer.id, false, true);
    }, 1200);
  }

  finishCustomer() {
    if (!this.selectedCustomer) return;
    const customer = this.selectedCustomer;
    const profile = NPC_PROFILES[customer.npcImage];
    this.combo += 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    customer.isDone = true;
    customer.el.classList.remove("patience-warning", "selected");
    this.clearCustomerTimer(customer.id);
    this.updateCustomerSprite(customer, "normal");
    if (this.combo >= 10 && !this.feverMode) {
      this.feverMode = true;
      this.gameContainer.classList.add("fever-active");
      this.schedule(() => {
        this.feverMode = false;
        this.gameContainer.classList.remove("fever-active");
      }, 5000);
    }
    this.score += Math.floor((150 + this.combo * 20 + Math.floor(this.perfectStreak * 5)) * ((this.feverMode ? 2 : 1) * profile.scoreMult));
    if (profile.timeBonus > 0) this.timeLeft += profile.timeBonus;
    this.addTassel();
    this.selectedCustomer = null;
    this.renderHud();
    this.schedule(() => {
      this.customerLeave(customer.id, false, false);
      this.clearGarland();
    }, 1200);
  }

  customerLeave(id, timedOut, isAngry = false) {
    const customer = this.getCustomer(id);
    if (!customer?.el) return;
    customer.isDone = true;
    if (timedOut) {
      this.combo = 0;
      this.perfectStreak = 0;
      this.score = Math.max(0, this.score - 50);
      customer.el.style.filter = "grayscale(1) brightness(0.5)";
      if (this.selectedCustomer?.id === id) {
        this.selectedCustomer = null;
        this.currentInput = [];
        this.clearGarland();
      }
    }
    this.renderHud();
    if (isAngry) customer.el.classList.add("fast-leave");
    if (customer.isLeft) customer.el.style.left = "-50vh";
    else customer.el.style.right = "-50vh";
    customer.el.style.opacity = "0";
    this.schedule(() => {
      customer.el.remove();
      this.customers = this.customers.filter((entry) => entry.id !== id);
      this.clearCustomerTimer(id);
      this.checkRoundEnd();
    }, isAngry ? 600 : 1500);
  }

  startCountdown() {
    if (this.started || this.countdownTimer) return;
    this.startScreenEl.classList.remove("show");
    this.tutorialOverlayEl.classList.remove("show");
    this.countdownOverlayEl.classList.add("show");
    let count = 3;
    this.countdownTextEl.textContent = `${count}`;
    this.playAudio("sfx321", true);
    this.countdownTimer = window.setInterval(() => {
      count -= 1;
      if (count > 0) {
        this.countdownTextEl.textContent = `${count}`;
        this.playAudio("sfx321", true);
      } else if (count === 0) {
        this.countdownTextEl.textContent = "เริ่ม!";
        this.playAudio("sfxStart", true);
        this.playAudio("bgMusic");
      } else {
        window.clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        this.countdownOverlayEl.classList.remove("show");
        this.initGame();
      }
    }, 1000);
  }

  showTutorial() {
    this.tutorialOverlayEl.classList.add("show");
  }

  hideTutorial() {
    this.tutorialOverlayEl.classList.remove("show");
  }

  checkRoundEnd() {
    if (!this.gameActive) return;
    if (this.customerAreaEl.querySelectorAll(".customer-container").length === 0) {
      this.round += 1;
      this.renderHud();
      this.startRound();
    }
  }

  renderHud() {
    if (this.timerValEl) this.timerValEl.textContent = `${Math.max(0, this.timeLeft)}`;
    if (this.scoreValEl) this.scoreValEl.textContent = `${this.score}`;
    if (this.countWaterEl) this.countWaterEl.textContent = `${this.itemWaterCount}`;
    if (this.countPowderEl) this.countPowderEl.textContent = `${this.itemPowderCount}`;
    if (this.waterBtnEl) this.waterBtnEl.disabled = this.itemWaterCount <= 0 || !this.gameActive || this.isTimeFrozen;
    if (this.powderBtnEl) this.powderBtnEl.disabled = this.itemPowderCount <= 0 || !this.gameActive || !this.selectedCustomer;
  }

  endGame() {
    if (this.ended) return;
    this.ended = true;
    this.started = false;
    this.gameActive = false;
    if (this.gameTimer) {
      window.clearInterval(this.gameTimer);
      this.gameTimer = null;
    }
    if (this.countdownTimer) {
      window.clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    this.clearAllCustomerTimers();
    this.gameContainer.classList.remove("time-frozen", "fever-active", "shake-effect");
    this.audio.bgMusic?.pause();
    if (this.totalScoreEl) this.totalScoreEl.textContent = `${this.score}`;
    if (this.resultMetaEl) this.resultMetaEl.textContent = `ไปถึงรอบ ${this.round} | คอมโบสูงสุด ${this.maxCombo} | สตรีคสูงสุด ${this.bestPerfectStreak}`;
    this.resultScreenEl.classList.add("show");
  }

  playAudio(key, rewind = false) {
    const audio = this.audio[key];
    if (!audio) return;
    if (rewind) audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  schedule(callback, delay) {
    const timeoutId = window.setTimeout(() => {
      this.timeouts.delete(timeoutId);
      callback();
    }, delay);
    this.timeouts.add(timeoutId);
    return timeoutId;
  }

  clearCustomerTimer(id) {
    const timer = this.customerTimers.get(id);
    if (timer) {
      window.clearInterval(timer);
      this.customerTimers.delete(id);
    }
    const customer = this.getCustomer(id);
    if (customer) customer.timer = null;
  }

  clearAllCustomerTimers() {
    this.customerTimers.forEach((timer) => window.clearInterval(timer));
    this.customerTimers.clear();
    this.customers.forEach((customer) => {
      customer.timer = null;
    });
  }

  cleanup() {
    if (this.cleanedUp) return;
    this.cleanedUp = true;
    if (this.gameTimer) window.clearInterval(this.gameTimer);
    if (this.countdownTimer) window.clearInterval(this.countdownTimer);
    this.gameTimer = null;
    this.countdownTimer = null;
    this.clearAllCustomerTimers();
    this.timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    this.timeouts.clear();
    Object.values(this.audio).forEach((audio) => {
      if (!audio) return;
      audio.pause();
      audio.currentTime = 0;
    });
    this.audio = {};
    if (this.root?.parentNode) this.root.parentNode.removeChild(this.root);
    this.root = null;
    this.shadow = null;
  }
}
