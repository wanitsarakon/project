import Phaser from "phaser";

const STEPS = [
  { id: "incense", label: "ธูป", icon: "🪔" },
  { id: "candle", label: "เทียน", icon: "🕯️" },
  { id: "lotus", label: "ดอกบัว", icon: "🪷" },
];

const BLESSINGS = [
  "สุขภาพแข็งแรง",
  "โชคดีตลอดปี",
  "การงานราบรื่น",
  "มีคนเมตตาอุปถัมภ์",
  "สมหวังในสิ่งที่ตั้งใจ",
];

export default class WorshipBoothScene extends Phaser.Scene {
  constructor() {
    super({ key: "WorshipBoothScene" });
    this.onGameEnd = null;
    this.root = null;
    this.state = null;
  }

  init(data = {}) {
    this.onGameEnd = data?.onGameEnd ?? null;
  }

  create() {
    this.state = {
      score: 0,
      stepIndex: 0,
      mistakes: 0,
      blessed: false,
    };

    this.buildDom();

    this.events.once("shutdown", () => this.cleanup());
    this.events.once("destroy", () => this.cleanup());
  }

  buildDom() {
    const container = this.game.canvas?.parentElement;
    if (!container) return;

    this.root = document.createElement("div");
    this.root.innerHTML = `
      <style>
        .wb-root { position:absolute; inset:0; font-family:Kanit,sans-serif; background:linear-gradient(180deg,#ffefcf 0%,#e5b56f 100%); color:#5b2c00; }
        .wb-wrap { height:100%; display:flex; align-items:center; justify-content:center; padding:22px; }
        .wb-card { width:min(92%,760px); background:rgba(255,255,255,0.9); border-radius:28px; padding:24px; box-shadow:0 16px 40px rgba(0,0,0,0.18); text-align:center; }
        .wb-title { font-size:34px; font-weight:700; margin-bottom:8px; }
        .wb-hud { display:flex; justify-content:center; gap:18px; margin-bottom:20px; flex-wrap:wrap; }
        .wb-box { background:#fff5e2; border-radius:18px; padding:10px 18px; font-weight:700; min-width:120px; }
        .wb-grid { display:grid; grid-template-columns:repeat(3,minmax(120px,1fr)); gap:14px; margin-top:18px; }
        .wb-btn { border:none; border-radius:22px; padding:22px 16px; background:#fff; font:inherit; font-weight:700; cursor:pointer; box-shadow:0 10px 24px rgba(0,0,0,0.08); }
        .wb-btn span { display:block; font-size:42px; margin-bottom:8px; }
        .wb-msg { min-height:28px; font-weight:700; color:#8a4d0f; }
        .wb-finish { margin-top:18px; border:none; border-radius:999px; padding:12px 24px; background:#8b4513; color:#fff; font:inherit; font-weight:700; cursor:pointer; }
      </style>
      <div class="wb-root">
        <div class="wb-wrap">
          <div class="wb-card">
            <div class="wb-title">ซุ้มไหว้พระขอพร</div>
            <div>ทำเครื่องสักการะให้ถูกลำดับ แล้วกดขอพร</div>
            <div class="wb-hud">
              <div class="wb-box">คะแนน <span id="wb-score">0</span></div>
              <div class="wb-box">ขั้นตอน <span id="wb-step">1</span> / 3</div>
            </div>
            <div id="wb-msg" class="wb-msg">เริ่มจากจุดธูปก่อน</div>
            <div id="wb-grid" class="wb-grid"></div>
            <button id="wb-pray" class="wb-finish" disabled>ขอพร</button>
          </div>
        </div>
      </div>
    `;

    container.appendChild(this.root);

    this.scoreEl = this.root.querySelector("#wb-score");
    this.stepEl = this.root.querySelector("#wb-step");
    this.msgEl = this.root.querySelector("#wb-msg");
    this.gridEl = this.root.querySelector("#wb-grid");
    this.prayBtn = this.root.querySelector("#wb-pray");

    STEPS.forEach((step) => {
      const btn = document.createElement("button");
      btn.className = "wb-btn";
      btn.innerHTML = `<span>${step.icon}</span>${step.label}`;
      btn.addEventListener("click", () => this.pickStep(step.id));
      this.gridEl.appendChild(btn);
    });

    this.prayBtn?.addEventListener("click", () => this.pray());
    this.renderState();
  }

  pickStep(stepId) {
    if (this.state.blessed) return;

    const expected = STEPS[this.state.stepIndex]?.id;
    if (expected === stepId) {
      this.state.score += 20;
      this.state.stepIndex += 1;
      this.msgEl.textContent =
        this.state.stepIndex >= STEPS.length
          ? "เครื่องสักการะพร้อมแล้ว กดขอพรได้เลย"
          : `ต่อไป: ${STEPS[this.state.stepIndex].label}`;
    } else {
      this.state.mistakes += 1;
      this.state.score = Math.max(0, this.state.score - 10);
      this.msgEl.textContent = "ลำดับไม่ถูก ต้องเริ่มใหม่ด้วยสติ";
      this.state.stepIndex = 0;
    }

    this.renderState();
  }

  pray() {
    if (this.state.stepIndex < STEPS.length || this.state.blessed) return;

    this.state.blessed = true;
    this.state.score += Math.max(10, 40 - this.state.mistakes * 10);
    const blessing =
      BLESSINGS[
        Math.floor(Math.random() * BLESSINGS.length)
      ];
    this.msgEl.textContent = `พรที่ได้รับ: ${blessing}`;
    this.renderState();

    window.setTimeout(() => {
      this.onGameEnd?.({
        score: this.state.score,
        blessing,
        game: "WorshipBooth",
      });
    }, 1200);
  }

  renderState() {
    if (this.scoreEl) this.scoreEl.textContent = this.state.score;
    if (this.stepEl) {
      this.stepEl.textContent = Math.min(
        this.state.stepIndex + 1,
        STEPS.length
      );
    }
    if (this.prayBtn) {
      this.prayBtn.disabled =
        this.state.stepIndex < STEPS.length || this.state.blessed;
      this.prayBtn.style.opacity =
        this.prayBtn.disabled ? "0.55" : "1";
      this.prayBtn.style.cursor =
        this.prayBtn.disabled ? "default" : "pointer";
    }
  }

  cleanup() {
    if (this.root?.parentNode) {
      this.root.parentNode.removeChild(this.root);
    }
    this.root = null;
  }
}
