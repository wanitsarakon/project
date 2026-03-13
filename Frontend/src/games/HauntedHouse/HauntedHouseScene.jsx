import Phaser from "phaser";

const MONSTERS = [
  { id: "ghost", icon: "👻", points: 10, color: "#ffffff" },
  { id: "bat", icon: "🦇", points: -5, color: "#d3d3ff" },
  { id: "spider", icon: "🕷️", points: 15, color: "#f6d365" },
];

export default class HauntedHouseScene extends Phaser.Scene {
  constructor() {
    super({ key: "HauntedHouseScene" });
    this.onGameEnd = null;
    this.root = null;
    this.state = null;
    this.timer = null;
    this.spawnTimer = null;
  }

  init(data = {}) {
    this.onGameEnd = data?.onGameEnd ?? null;
  }

  create() {
    this.state = {
      score: 0,
      timeLeft: 25,
      started: false,
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
        .hh-root { position:absolute; inset:0; font-family:Kanit,sans-serif; background:radial-gradient(circle at top,#464646 0%,#1d1d1d 50%,#060606 100%); color:#f7ead6; }
        .hh-wrap { height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:22px; }
        .hh-card { width:min(92%,760px); background:rgba(0,0,0,0.34); border:1px solid rgba(255,255,255,0.08); border-radius:28px; padding:24px; box-shadow:0 16px 40px rgba(0,0,0,0.28); text-align:center; }
        .hh-title { font-size:34px; font-weight:700; margin-bottom:8px; }
        .hh-hud { display:flex; justify-content:center; gap:18px; margin-bottom:18px; flex-wrap:wrap; }
        .hh-box { background:rgba(255,255,255,0.08); border-radius:18px; padding:10px 18px; font-weight:700; min-width:120px; }
        .hh-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:16px; }
        .hh-cell { height:120px; border:none; border-radius:22px; background:linear-gradient(180deg,#332012 0%,#1b110d 100%); color:#fff; font-size:46px; cursor:pointer; box-shadow:inset 0 0 0 1px rgba(255,255,255,0.06); }
        .hh-start, .hh-result { position:absolute; inset:0; background:rgba(0,0,0,0.48); display:flex; align-items:center; justify-content:center; padding:18px; }
        .hh-panel { width:min(88%,520px); background:#1a1411; border-radius:28px; padding:28px; text-align:center; box-shadow:0 16px 40px rgba(0,0,0,0.35); }
        .hh-panel h2 { margin:0 0 10px; font-size:34px; color:#f7ead6; }
        .hh-panel button { margin-top:16px; border:none; border-radius:999px; padding:12px 24px; background:#8e2c2c; color:#fff; font:inherit; font-weight:700; cursor:pointer; }
        .hh-hidden { display:none; }
      </style>
      <div class="hh-root">
        <div class="hh-wrap">
          <div class="hh-card">
            <div class="hh-title">บ้านผีสิง</div>
            <div>กดผีให้ทัน ระวังค้างคาวลวงตา</div>
            <div class="hh-hud">
              <div class="hh-box">คะแนน <span id="hh-score">0</span></div>
              <div class="hh-box">เวลา <span id="hh-time">25</span></div>
            </div>
            <div id="hh-grid" class="hh-grid"></div>
          </div>
        </div>
        <div id="hh-start" class="hh-start">
          <div class="hh-panel">
            <h2>ผีออกแล้ว</h2>
            <div>คลิกตัวที่โผล่ในห้องให้ทันภายใน 25 วินาที</div>
            <button id="hh-start-btn">เริ่มเกม</button>
          </div>
        </div>
        <div id="hh-result" class="hh-result hh-hidden">
          <div class="hh-panel">
            <h2>จบเกม</h2>
            <div>คะแนนรวม</div>
            <div id="hh-final" style="font-size:64px; font-weight:700; margin-top:8px;">0</div>
            <button id="hh-finish-btn">กลับแผนที่</button>
          </div>
        </div>
      </div>
    `;

    container.appendChild(this.root);

    this.scoreEl = this.root.querySelector("#hh-score");
    this.timeEl = this.root.querySelector("#hh-time");
    this.gridEl = this.root.querySelector("#hh-grid");
    this.startEl = this.root.querySelector("#hh-start");
    this.resultEl = this.root.querySelector("#hh-result");
    this.finalEl = this.root.querySelector("#hh-final");

    for (let i = 0; i < 9; i += 1) {
      const cell = document.createElement("button");
      cell.className = "hh-cell";
      cell.textContent = "🕯️";
      cell.dataset.index = String(i);
      cell.addEventListener("click", () => this.hitCell(cell));
      this.gridEl.appendChild(cell);
    }

    this.root
      .querySelector("#hh-start-btn")
      ?.addEventListener("click", () => this.startGame());

    this.root
      .querySelector("#hh-finish-btn")
      ?.addEventListener("click", () => {
        this.onGameEnd?.({
          score: this.state?.score ?? 0,
          game: "HauntedHouse",
        });
      });
  }

  startGame() {
    if (this.state.started) return;
    this.state.started = true;
    this.startEl?.classList.add("hh-hidden");
    this.spawnMonster();
    this.spawnTimer = window.setInterval(() => {
      this.spawnMonster();
    }, 700);
    this.timer = window.setInterval(() => {
      this.state.timeLeft -= 1;
      this.renderHud();
      if (this.state.timeLeft <= 0) {
        this.endGame();
      }
    }, 1000);
  }

  spawnMonster() {
    const cells = [...this.gridEl.children];
    cells.forEach((cell) => {
      cell.textContent = "🕯️";
      cell.dataset.monster = "";
    });
    const randomCell = cells[Math.floor(Math.random() * cells.length)];
    const monster = MONSTERS[Math.floor(Math.random() * MONSTERS.length)];
    randomCell.textContent = monster.icon;
    randomCell.dataset.monster = monster.id;
  }

  hitCell(cell) {
    if (!this.state.started || this.state.timeLeft <= 0) return;
    const monsterId = cell.dataset.monster;
    if (!monsterId) return;
    const monster = MONSTERS.find((item) => item.id === monsterId);
    if (!monster) return;
    this.state.score = Math.max(0, this.state.score + monster.points);
    this.renderHud();
    cell.textContent = "💥";
    cell.dataset.monster = "";
  }

  renderHud() {
    if (this.scoreEl) this.scoreEl.textContent = this.state.score;
    if (this.timeEl) this.timeEl.textContent = this.state.timeLeft;
  }

  endGame() {
    window.clearInterval(this.timer);
    window.clearInterval(this.spawnTimer);
    this.timer = null;
    this.spawnTimer = null;
    if (this.finalEl) this.finalEl.textContent = this.state.score;
    this.resultEl?.classList.remove("hh-hidden");
  }

  cleanup() {
    window.clearInterval(this.timer);
    window.clearInterval(this.spawnTimer);
    if (this.root?.parentNode) {
      this.root.parentNode.removeChild(this.root);
    }
    this.root = null;
  }
}
