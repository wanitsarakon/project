import Phaser from "phaser";

const FLOWERS = [
  { id: "jasmine", label: "มะลิ", icon: "🤍", color: "#fffaf0" },
  { id: "rose", label: "กุหลาบ", icon: "🌹", color: "#ffd7e2" },
  { id: "marigold", label: "ดาวเรือง", icon: "🌼", color: "#ffe08a" },
  { id: "orchid", label: "กล้วยไม้", icon: "💜", color: "#eadbff" },
];

export default class FlowerGameScene extends Phaser.Scene {
  constructor() {
    super({ key: "FlowerGameScene" });
    this.onGameEnd = null;
    this.root = null;
    this.state = null;
    this.timer = null;
  }

  init(data = {}) {
    this.onGameEnd = data?.onGameEnd ?? null;
  }

  create() {
    this.state = {
      score: 0,
      timeLeft: 30,
      started: false,
      sequence: [],
      input: [],
    };

    this.buildDom();
    this.generateSequence();

    this.events.once("shutdown", () => this.cleanup());
    this.events.once("destroy", () => this.cleanup());
  }

  buildDom() {
    const container = this.game.canvas?.parentElement;
    if (!container) return;

    this.root = document.createElement("div");
    this.root.innerHTML = `
      <style>
        .fg-root { position:absolute; inset:0; font-family:Kanit,sans-serif; background:linear-gradient(180deg,#fff9ec 0%,#ffd48b 100%); color:#5b2c00; }
        .fg-wrap { height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:22px; text-align:center; }
        .fg-card { width:min(90%,720px); background:rgba(255,255,255,0.9); border-radius:28px; padding:24px; box-shadow:0 16px 40px rgba(0,0,0,0.18); }
        .fg-title { font-size:34px; font-weight:700; margin-bottom:8px; }
        .fg-sub { color:#8a5a2f; margin-bottom:18px; }
        .fg-hud { display:flex; justify-content:center; gap:18px; margin-bottom:18px; flex-wrap:wrap; }
        .fg-box { background:#fff4dd; border-radius:18px; padding:10px 18px; font-weight:700; min-width:120px; }
        .fg-seq, .fg-input { display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin-bottom:14px; min-height:58px; }
        .fg-chip { width:64px; height:64px; border-radius:18px; display:flex; align-items:center; justify-content:center; font-size:30px; background:#fff; box-shadow:inset 0 0 0 2px rgba(139,90,43,0.12); }
        .fg-buttons { display:grid; grid-template-columns:repeat(2,minmax(140px,1fr)); gap:12px; margin-top:14px; }
        .fg-btn { border:none; border-radius:18px; padding:14px 12px; font:inherit; font-weight:700; cursor:pointer; box-shadow:0 8px 20px rgba(0,0,0,0.08); }
        .fg-msg { min-height:28px; font-weight:700; color:#a04d00; }
        .fg-start, .fg-result { position:absolute; inset:0; background:rgba(0,0,0,0.42); display:flex; align-items:center; justify-content:center; padding:18px; }
        .fg-panel { width:min(88%,520px); background:#fff9ef; border-radius:28px; padding:28px; text-align:center; box-shadow:0 16px 40px rgba(0,0,0,0.2); }
        .fg-panel h2 { margin:0 0 10px; font-size:34px; color:#8a4d0f; }
        .fg-panel button { margin-top:16px; border:none; border-radius:999px; padding:12px 24px; background:#d35400; color:#fff; font:inherit; font-weight:700; cursor:pointer; }
        .fg-hidden { display:none; }
      </style>
      <div class="fg-root">
        <div class="fg-wrap">
          <div class="fg-card">
            <div class="fg-title">ร้อยมาลัย</div>
            <div class="fg-sub">กดดอกไม้ให้ตรงตามลำดับที่ลูกค้าสั่งภายในเวลา 30 วินาที</div>
            <div class="fg-hud">
              <div class="fg-box">คะแนน <span id="fg-score">0</span></div>
              <div class="fg-box">เวลา <span id="fg-time">30</span></div>
            </div>
            <div style="font-weight:700; margin-bottom:8px;">ออเดอร์</div>
            <div id="fg-sequence" class="fg-seq"></div>
            <div style="font-weight:700; margin-bottom:8px;">ที่คุณร้อยแล้ว</div>
            <div id="fg-input" class="fg-input"></div>
            <div id="fg-msg" class="fg-msg"></div>
            <div id="fg-buttons" class="fg-buttons"></div>
          </div>
        </div>
        <div id="fg-start" class="fg-start">
          <div class="fg-panel">
            <h2>ซุ้มร้อยมาลัย</h2>
            <div>จำลำดับดอกไม้ แล้วกดให้ครบชุด รับคะแนนเพิ่มเมื่อร้อยได้ถูกทั้งชุด</div>
            <button id="fg-start-btn">เริ่มเกม</button>
          </div>
        </div>
        <div id="fg-result" class="fg-result fg-hidden">
          <div class="fg-panel">
            <h2>จบเกม</h2>
            <div>มาลัยที่ได้คะแนนรวม</div>
            <div id="fg-final" style="font-size:64px; font-weight:700; color:#d35400; margin-top:8px;">0</div>
            <button id="fg-finish-btn">กลับแผนที่</button>
          </div>
        </div>
      </div>
    `;

    container.appendChild(this.root);

    this.scoreEl = this.root.querySelector("#fg-score");
    this.timeEl = this.root.querySelector("#fg-time");
    this.sequenceEl = this.root.querySelector("#fg-sequence");
    this.inputEl = this.root.querySelector("#fg-input");
    this.messageEl = this.root.querySelector("#fg-msg");
    this.buttonsEl = this.root.querySelector("#fg-buttons");
    this.startEl = this.root.querySelector("#fg-start");
    this.resultEl = this.root.querySelector("#fg-result");
    this.finalEl = this.root.querySelector("#fg-final");

    FLOWERS.forEach((flower) => {
      const btn = document.createElement("button");
      btn.className = "fg-btn";
      btn.style.background = flower.color;
      btn.innerHTML = `${flower.icon} ${flower.label}`;
      btn.addEventListener("click", () => this.pickFlower(flower.id));
      this.buttonsEl.appendChild(btn);
    });

    this.root
      .querySelector("#fg-start-btn")
      ?.addEventListener("click", () => this.startGame());

    this.root
      .querySelector("#fg-finish-btn")
      ?.addEventListener("click", () => {
        this.onGameEnd?.({
          score: this.state?.score ?? 0,
          game: "FlowerGame",
        });
      });

    this.renderState();
  }

  startGame() {
    if (this.state.started) return;
    this.state.started = true;
    this.startEl?.classList.add("fg-hidden");
    this.timer = window.setInterval(() => {
      this.state.timeLeft -= 1;
      this.renderState();
      if (this.state.timeLeft <= 0) {
        this.endGame();
      }
    }, 1000);
  }

  generateSequence() {
    this.state.sequence = Array.from({ length: 4 }, () => {
      return FLOWERS[
        Math.floor(Math.random() * FLOWERS.length)
      ].id;
    });
    this.state.input = [];
    this.renderState();
  }

  pickFlower(flowerId) {
    if (!this.state.started || this.state.timeLeft <= 0) return;

    this.state.input.push(flowerId);
    const stepIndex = this.state.input.length - 1;
    const expected = this.state.sequence[stepIndex];

    if (expected !== flowerId) {
      this.state.score = Math.max(0, this.state.score - 5);
      this.messageEl.textContent = "ลำดับผิด ลองเริ่มใหม่";
      this.state.input = [];
      this.renderState();
      return;
    }

    this.messageEl.textContent = "ถูกต้อง";

    if (this.state.input.length === this.state.sequence.length) {
      this.state.score += 25;
      this.messageEl.textContent = "ร้อยมาลัยสำเร็จ +25";
      this.generateSequence();
      return;
    }

    this.renderState();
  }

  renderState() {
    if (this.scoreEl) this.scoreEl.textContent = this.state.score;
    if (this.timeEl) this.timeEl.textContent = this.state.timeLeft;
    if (this.sequenceEl) {
      this.sequenceEl.innerHTML = this.state.sequence
        .map((id) => {
          const flower = FLOWERS.find((item) => item.id === id);
          return `<div class="fg-chip">${flower?.icon || "?"}</div>`;
        })
        .join("");
    }
    if (this.inputEl) {
      this.inputEl.innerHTML = this.state.input
        .map((id) => {
          const flower = FLOWERS.find((item) => item.id === id);
          return `<div class="fg-chip">${flower?.icon || "?"}</div>`;
        })
        .join("");
    }
  }

  endGame() {
    window.clearInterval(this.timer);
    this.timer = null;
    if (this.finalEl) this.finalEl.textContent = this.state.score;
    this.resultEl?.classList.remove("fg-hidden");
  }

  cleanup() {
    window.clearInterval(this.timer);
    this.timer = null;
    if (this.root?.parentNode) {
      this.root.parentNode.removeChild(this.root);
    }
    this.root = null;
  }
}
