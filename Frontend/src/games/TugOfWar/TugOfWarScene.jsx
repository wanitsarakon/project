import Phaser from "phaser";

/**
 * TugOfWarScene
 * -------------
 * Phaser Scene ที่ mount HTML overlay ของเกม tug-of-war
 * (vanilla JS เดิม) ทับบน Phaser canvas
 *
 * วิธีทำงาน:
 *  1. create() → สร้าง <div id="tug-overlay"> แล้ว inject HTML + CSS + JS
 *  2. เมื่อเกมจบ → เรียก this.onGameEnd({ score }) แล้วลบ overlay
 *  3. shutdown() → cleanup DOM ทั้งหมด
 */
export default class TugOfWarScene extends Phaser.Scene {
  constructor() {
    super("TugOfWarScene");
    this._overlay = null;
    this._cleanupDone = false;
  }

  /* ─────────────────────────────────────
     รับ data จาก GameContainer
  ───────────────────────────────────── */
  init(data = {}) {
    this.onGameEnd = data?.onGameEnd ?? null;
    this.roomCode = data?.roomCode ?? null;
    this.player = data?.player ?? null;
    this.roundId = data?.roundId ?? null;
    this._cleanupDone = false;
  }

  /* ─────────────────────────────────────
     preload – ไม่ต้อง load asset Phaser
     (เกมใช้ DOM canvas เอง)
  ───────────────────────────────────── */
  preload() {}

  /* ─────────────────────────────────────
     create – inject HTML overlay
  ───────────────────────────────────── */
  create() {
    this._mountOverlay();
  }

  /* ─────────────────────────────────────
     update – ไม่ต้องใช้ (เกมมี loop เอง)
  ───────────────────────────────────── */
  update() {}

  /* ─────────────────────────────────────
     cleanup เมื่อ scene ถูก shutdown
  ───────────────────────────────────── */
  shutdown() {
    this._removeOverlay();
  }

  destroy() {
    this._removeOverlay();
  }

  /* ═══════════════════════════════════
     PRIVATE: สร้าง HTML overlay
  ═══════════════════════════════════ */
  _mountOverlay() {
    // ลบ overlay เก่าถ้ายังค้างอยู่
    this._cleanupDone = false;
    this._removeOverlay();
    this._cleanupDone = false;

    const overlay = document.createElement("div");
    overlay.id = "tug-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      z-index: 9999;
      background: #000;
      font-family: 'Kanit', sans-serif;
    `;

    overlay.innerHTML = this._buildHTML();
    document.body.appendChild(overlay);
    this._overlay = overlay;
    this._cleanupDone = false;

    // inject CSS
    this._injectStyle();

    // inject JS หลังจาก DOM พร้อม
    requestAnimationFrame(() => {
      this._injectGameScript();
    });
  }

  _removeOverlay() {
    if (this._cleanupDone) return;
    this._cleanupDone = true;

    // หยุด BGM ถ้ายังเล่นอยู่
    if (window.__tugBattleBgm) {
      try {
        window.__tugBattleBgm.pause();
        window.__tugBattleBgm = null;
      } catch {}
    }

    // ลบ overlay DOM
    const el = document.getElementById("tug-overlay");
    if (el) el.remove();
    this._overlay = null;

    // ลบ CSS ที่ inject ไว้
    const style = document.getElementById("tug-style");
    if (style) style.remove();
  }

  /* ═══════════════════════════════════
     PRIVATE: HTML template (เกม)
  ═══════════════════════════════════ */
  _buildHTML() {
    return `
      <!-- START SCREEN -->
      <div id="start-screen" style="
        position:fixed; top:0; left:0; width:100%; height:100%;
        z-index:10000; display:flex; justify-content:center;
        align-items:center; background:rgba(0,0,0,0.6);">
        <div style="text-align:center;">
          <h1 style="color:#ffd700; font-size:3rem; margin-bottom:20px; text-shadow:3px 3px 0 #000;">
            🎪 ชักกะเย่อ
          </h1>
          <p style="color:#fff; font-size:1.2rem; margin-bottom:30px;">
            เลือกทีมแล้วดึงเชือกให้ชนะ!
          </p>
          <button id="enter-game-btn" style="
            padding:15px 40px; font-size:24px; font-family:'Kanit',sans-serif;
            background:linear-gradient(180deg,#ffcc00,#ff8800); color:#fff;
            border:4px solid #fff; border-radius:50px; cursor:pointer;
            box-shadow:0 8px 0 #992200;">
            ▶ เข้าสู่เกม
          </button>
          <br><br>
          <button id="tug-back-btn" style="
            padding:10px 28px; font-size:18px; font-family:'Kanit',sans-serif;
            background:rgba(0,0,0,0.6); color:#ccc;
            border:2px solid #666; border-radius:20px; cursor:pointer;">
            ← กลับแผนที่
          </button>
        </div>
      </div>

      <!-- GAME CONTENT -->
      <div id="game-content" class="initial-blur">
        <div id="game-container">

          <!-- SETUP PAGE -->
          <div id="setup-page" class="page">
            <div class="top-header">
              <div style="color:#ffd700;font-size:2.5rem;font-weight:bold;
                text-shadow:3px 3px 0 #000;margin-top:20px;">
                🏆 ชักกะเย่อ
              </div>
            </div>

            <div class="selection-area">
              <!-- ทีมผู้เล่น -->
              <div class="team-side left-side">
                <div style="color:#4caf50;font-size:1.6rem;font-weight:bold;
                  text-shadow:2px 2px 0 #000;margin-bottom:10px;">
                  🟢 ทีมคุณ
                </div>
                <div id="my-team-slots" class="slots">
                  <div class="slot">?</div>
                  <div class="slot">?</div>
                  <div class="slot">?</div>
                  <div class="slot">?</div>
                </div>
              </div>

              <!-- ไอเท็ม -->
              <div id="item-selection-area" style="display:none; text-align:center;">
                <div class="char-footer" id="item-list"
                  style="justify-content:center; display:flex; gap:20px;">
                  <div class="char-item has-tooltip" onclick="tugSelectItem('amulet', this)">
                    <img src="/assets/tugofwar/images/item_amulet.png">
                    <div class="ability-tooltip">
                      <div class="tooltip-title">พระเครื่อง</div>
                      <div class="tooltip-stat"><span>คุณสมบัติ:</span> <span>กัน Freeze</span></div>
                      <div class="tooltip-note">แคล้วคลาดจากคำสาปตะคริว</div>
                    </div>
                  </div>
                  <div class="char-item has-tooltip" onclick="tugSelectItem('drink', this)">
                    <img src="/assets/tugofwar/images/item_drink.png">
                    <div class="ability-tooltip">
                      <div class="tooltip-title">เครื่องดื่มชูกำลัง</div>
                      <div class="tooltip-stat"><span>คุณสมบัติ:</span> <span>อึดขึ้น 30%</span></div>
                      <div class="tooltip-note">เพิ่มพลังกายช่วยให้เหนื่อยช้าลง</div>
                    </div>
                  </div>
                  <div class="char-item has-tooltip" onclick="tugSelectItem('oil', this)">
                    <img src="/assets/tugofwar/images/item_oil.png">
                    <div class="ability-tooltip">
                      <div class="tooltip-title">น้ำมันมวย</div>
                      <div class="tooltip-stat"><span>คุณสมบัติ:</span> <span>ดึงแรงขึ้น 15%</span></div>
                      <div class="tooltip-note">เพิ่มพลังการดึงให้คนในทีม</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- กลาง: เป่ายิงฉุบ -->
              <div class="center-stage">
                <div id="rps-ui">
                  <p id="turn-display">กรุณาเลือกปุ่มที่ต้องการออก</p>
                  <div id="hands-battle" class="hands-battle-area">
                    <div class="hand-wrapper left">
                      <div class="hand-pillar"></div>
                      <img id="player-hand" src="" class="hand-img">
                    </div>
                    <div class="hand-wrapper right">
                      <div class="hand-pillar"></div>
                      <img id="ai-hand" src="" class="hand-img">
                    </div>
                  </div>
                  <div class="rps-choices">
                    <div class="rps-item" onclick="tugPlayRPS('rock')">
                      <img src="/assets/tugofwar/images/rock2.png" alt="ค้อน">
                    </div>
                    <div class="rps-item" onclick="tugPlayRPS('paper')">
                      <img src="/assets/tugofwar/images/paper2.png" alt="กระดาษ">
                    </div>
                    <div class="rps-item" onclick="tugPlayRPS('scissors')">
                      <img src="/assets/tugofwar/images/scissors2.png" alt="กรรไกร">
                    </div>
                  </div>
                  <div id="rps-result"></div>
                </div>
              </div>

              <!-- ทีม AI -->
              <div class="team-side right-side">
                <div style="color:#ff5252;font-size:1.6rem;font-weight:bold;
                  text-shadow:2px 2px 0 #000;margin-bottom:10px;">
                  🔴 ทีมคู่แข่ง
                </div>
                <div id="ai-team-slots" class="slots">
                  <div class="slot">?</div>
                  <div class="slot">?</div>
                  <div class="slot">?</div>
                  <div class="slot">?</div>
                </div>
              </div>
            </div>

            <div id="char-list" class="char-footer"></div>
          </div>

          <!-- GAME ARENA -->
          <div id="game-arena" class="page"
            style="display:none; position:relative; width:100vw; height:100vh;">
            <div id="power-bar-container">
              <div class="team-label p1">ทีมคุณ</div>
              <div id="power-bar-bg">
                <div id="power-fill"></div>
                <div id="power-indicator"></div>
              </div>
              <div class="team-label p2">ทีมคู่แข่ง</div>
            </div>

            <div id="stamina-ui-overlay" style="
              position:absolute; top:80px; width:100%;
              display:flex; justify-content:space-between;
              padding:0 50px; box-sizing:border-box; z-index:1000;">
              <div class="stamina-wrapper" style="width:250px;">
                <div style="color:white;font-family:'Kanit';font-size:14px;margin-bottom:5px;">
                  พลังกายคุณ
                </div>
                <div id="stamina-container" style="
                  width:100%; height:15px; background:rgba(0,0,0,0.5);
                  border:2px solid #fff; border-radius:10px; overflow:hidden;">
                  <div id="stamina-bar" style="
                    width:100%; height:100%; background:#00ff00; transition:width 0.1s;">
                  </div>
                </div>
              </div>
              <div class="stamina-wrapper" style="width:250px; text-align:right;">
                <div style="color:white;font-family:'Kanit';font-size:14px;margin-bottom:5px;">
                  พลังกายคู่แข่ง
                </div>
                <div id="ai-stamina-container" style="
                  width:100%; height:15px; background:rgba(0,0,0,0.5);
                  border:2px solid #fff; border-radius:10px; overflow:hidden;">
                  <div id="ai-stamina-bar" style="
                    width:100%; height:100%; background:#00ffff; float:right;">
                  </div>
                </div>
              </div>
            </div>

            <div id="ingame-item-display"
              style="position:absolute; bottom:30px; left:30px; z-index:1002;">
              <div id="my-item-slot-arena" class="ingame-item-slot">
                <div class="key-hint">ทีมคุณ</div>
              </div>
            </div>

            <div id="ai-item-display"
              style="position:absolute; bottom:30px; right:30px; z-index:1002;">
              <div id="ai-item-slot-arena" class="ingame-item-slot"
                style="border-color:#ff5252;">
                <div class="key-hint"
                  style="background:linear-gradient(180deg,#ff5252,#b71c1c);color:white;">
                  คู่แข่ง
                </div>
              </div>
            </div>

            <div id="controls-guide" style="
              position:absolute; bottom:100px; left:50%;
              transform:translateX(-50%); display:flex; gap:20px;
              background:rgba(0,0,0,0.7); padding:8px 25px;
              border-radius:50px; border:1px solid rgba(255,215,0,0.4); z-index:1005;">
              <div style="display:flex;align-items:center;gap:8px;color:white;font-family:'Kanit';font-size:14px;">
                <span style="background:#444;color:#ffd700;padding:2px 10px;border-radius:5px;border:1px solid #666;font-weight:bold;font-size:12px;">Space</span>
                <span>ดึงเชือก</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px;color:white;font-family:'Kanit';font-size:14px;">
                <span style="background:#444;color:#ffd700;padding:2px 10px;border-radius:5px;border:1px solid #666;font-weight:bold;font-size:12px;">Q</span>
                <span>ใช้ไอเท็ม</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px;color:white;font-family:'Kanit';font-size:14px;">
                <span style="background:#444;color:#ffd700;padding:2px 10px;border-radius:5px;border:1px solid #666;font-weight:bold;font-size:12px;">S</span>
                <span>เสียงเชียร์</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px;color:white;font-family:'Kanit';font-size:14px;">
                <span style="background:#444;color:#ffd700;padding:2px 10px;border-radius:5px;border:1px solid #666;font-weight:bold;font-size:12px;">D</span>
                <span>ตะคริวกิน</span>
              </div>
            </div>

            <div id="keyboard-controls" style="z-index:1001;">
              <div class="key-btn" id="key-s">
                <img src="/assets/tugofwar/images/key_s.png" alt="S">
                <div class="key-tooltip">เสียงเชียร์: เพิ่มพลังการดึง</div>
              </div>
              <div class="key-btn" id="key-space">
                <img src="/assets/tugofwar/images/spacebar.png" alt="Spacebar">
                <div class="key-tooltip">ดึงเชือก!</div>
              </div>
              <div class="key-btn" id="key-d">
                <img src="/assets/tugofwar/images/key_d.png" alt="D">
                <div class="key-tooltip">ทำให้คู่แข่งเป็นตะคริว</div>
              </div>
            </div>

            <canvas id="gameCanvas" style="display:block;"></canvas>
          </div>

          <!-- RESULT SCREEN -->
          <div id="result-screen" style="display:none;">
            <div class="final-score-container">
              <div class="final-score-overlay">
                <div id="result-status" style="
                  color:#ffd700; font-size:2.5rem; font-weight:bold;
                  text-shadow:3px 3px 0 #000; margin-bottom:20px;">
                </div>
                <div class="score-label">คะแนนที่ได้</div>
                <div id="total-score">0</div>
                <br>
                <button id="tug-exit-btn" style="
                  margin-top:20px; padding:12px 32px; font-size:20px;
                  font-family:'Kanit',sans-serif; background:#e74c3c;
                  color:#fff; border:none; border-radius:20px; cursor:pointer;">
                  🗺️ กลับแผนที่
                </button>
              </div>
            </div>
          </div>

        </div><!-- /#game-container -->
      </div><!-- /#game-content -->
    `;
  }

  /* ═══════════════════════════════════
     PRIVATE: inject CSS ของเกม
  ═══════════════════════════════════ */
  _injectStyle() {
    if (document.getElementById("tug-style")) return;

    // อ่าน CSS จากไฟล์ที่ copy ไว้ใน public
    const link = document.createElement("link");
    link.id = "tug-style";
    link.rel = "stylesheet";
    link.href = "/assets/tugofwar/style.css";
    document.head.appendChild(link);
  }

  /* ═══════════════════════════════════
     PRIVATE: inject game logic (JS)
     แปลงจาก game.js เดิม ให้ทำงาน
     ใน overlay โดยไม่ conflict global
  ═══════════════════════════════════ */
  _injectGameScript() {
    const scene = this;

    /* ── ข้อมูลตัวละคร (แทน /api/characters) ── */
    const CHARACTERS = [
      { name:"ผู้ชายผอม",  power:2.0, speed:1.8, note:"กดรัวได้ไว",          image:"skinny.png",  pullImage:"skinny_pull.png" },
      { name:"หนุ่มนักกล้าม", power:5.0, speed:0.6, note:"แรงสูงมาก",       image:"buff.png",    pullImage:"buff_pull.png"   },
      { name:"คนแก่แต่เท่", power:3.5, speed:0.4, note:"เก๋าแรงเยอะแต่เหนื่อยง่าย", image:"old.png", pullImage:"old_pull.png" },
      { name:"เด็ก",        power:1.0, speed:1.4, note:"เร็วแต่แรงน้อย",     image:"kid.png",     pullImage:"kid_pull.png"    },
      { name:"ผู้หญิงธรรมดา", power:2.5, speed:1.0, note:"แรงน้อยกว่าผู้ชาย", image:"woman.png", pullImage:"woman_pull.png"  },
      { name:"ผู้ชายธรรมดา", power:4.0, speed:1.1, note:"สมดุล",            image:"man.png",     pullImage:"man_pull.png"    },
    ];

    /* ── helper ── */
    const $ = (id) => document.getElementById(id);

    /* ── SCREENS ── */
    const screens = {
      setup:  $("setup-page"),
      arena:  $("game-arena"),
      canvas: $("gameCanvas"),
    };

    /* ── AUDIO ── */
    const BASE = "/assets/tugofwar/sounds/";
    const hoverSound   = new Audio(BASE + "pick.mp3");
    const pickSound    = new Audio(BASE + "pick.mp3");
    const battleBgm    = new Audio(BASE + "battle_bgm.mp3");
    const cheerSound   = new Audio(BASE + "cheer.mp3");
    const freezeSound  = new Audio(BASE + "freeze.mp3");
    const countSound   = new Audio(BASE + "count.mp3");
    const startGoSound = new Audio(BASE + "start_go.mp3");
    hoverSound.volume  = 0.3;
    pickSound.volume   = 0.5;
    battleBgm.loop     = true;
    battleBgm.volume   = 0.4;
    window.__tugBattleBgm = battleBgm; // เพื่อให้ cleanup หยุดได้

    /* ── ROPE IMAGE ── */
    const ropeImg = new Image();
    ropeImg.src = "/assets/tugofwar/images/rope.png";

    /* ── CHAR IMAGE CACHE ── */
    const charImages = {};
    function getCharImage(src) {
      if (!charImages[src]) {
        charImages[src] = new Image();
        charImages[src].src = `/assets/tugofwar/images/${src}`;
      }
      return charImages[src];
    }

    /* ── STATE ── */
    let selectedItem = null, isItemPhase = false;
    let myItem = null, aiItem = null;
    let myTeam = [], aiTeam = [];
    let isMyTurn = false, isPlaying = false, canPick = false;
    let characters = [...CHARACTERS];

    let perfectZoneMin = 45, perfectZoneMax = 55, isPerfectHit = false;
    let canUseCheer = true, canUseFreeze = true;
    const skillCooldown = 5000;
    let hasUsedCheer = false, hasUsedFreeze = false;
    let aiHasUsedCheer = false, aiHasUsedFreeze = false;

    let playerStamina = 100, aiStaminaValue = 100;
    const maxStamina = 100, staminaDrain = 4, staminaRecover = 0.4;
    let isExhausted = false;

    let ropePos = 600, playerVelocity = 0, aiVelocity = 0;
    let totalPower = 0, totalSpeed = 0, isSpacePressed = false;
    let aiItemUsed = false, myItemUsed = false;
    let canBeFreezed = true, pullStrength = 1.0;

    let aiTotalPower = 0, aiTotalSpeed = 0;
    let aiLastPushTime = 0, aiNextPushDelay = 150, aiExhaustion = 0;

    /* ── RENDER CHAR LIST ── */
    function renderList() {
      const list = $("char-list");
      list.innerHTML = "";

      const charAbilities = [
        { Name:"ผู้ชายผอม",    Power:2.0, Speed:1.8, Note:"กดรัวได้ไว" },
        { Name:"หนุ่มนักกล้าม", Power:5.0, Speed:0.6, Note:"แรงสูงมาก" },
        { Name:"คนแก่แต่เท่",  Power:3.5, Speed:0.4, Note:"เก๋าแรงเยอะแต่เหนื่อยง่าย" },
        { Name:"เด็ก",          Power:1.0, Speed:1.4, Note:"เร็วแต่แรงน้อย" },
        { Name:"ผู้หญิงธรรมดา", Power:2.5, Speed:1.0, Note:"แรงน้อยกว่าผู้ชาย" },
        { Name:"ผู้ชายธรรมดา",  Power:4.0, Speed:1.1, Note:"สมดุล" },
      ];

      characters.forEach((c, i) => {
        const div = document.createElement("div");
        div.className = "char-item has-tooltip";
        div.id = `char-${i}`;
        const ability = charAbilities.find(a => a.Name === c.name) || { Power: c.power, Speed: c.speed, Note: "" };
        div.innerHTML = `
          <img src="/assets/tugofwar/images/${c.image}" alt="${c.name}">
          <div class="ability-tooltip">
            <div class="tooltip-title">${ability.Name}</div>
            <div class="tooltip-stat"><span>พลัง:</span> <span>${ability.Power}</span></div>
            <div class="tooltip-stat"><span>ความเร็ว:</span> <span>${ability.Speed}</span></div>
            <div class="tooltip-note">${ability.Note}</div>
          </div>
        `;
        div.onclick = () => tugPick(i);
        list.appendChild(div);
      });
    }

    /* expose ฟังก์ชันไปยัง window สำหรับ onclick ใน HTML */
    window.tugPlayRPS    = tugPlayRPS;
    window.tugSelectItem = tugSelectItem;

    function tugPlayRPS(pChoice) {
      if (typeof pickSound !== "undefined") {
        pickSound.pause(); pickSound.currentTime = 0;
        pickSound.play().catch(() => {});
      }
      const opts = ["rock","paper","scissors"];
      const aiChoice = opts[Math.floor(Math.random() * 3)];
      const win = { rock:"scissors", paper:"rock", scissors:"paper" };
      const choicesUI = document.querySelector(".rps-choices");
      const pHandImg = $("player-hand");
      const aiHandImg = $("ai-hand");
      if (pHandImg && aiHandImg) {
        pHandImg.src = `/assets/tugofwar/images/${pChoice}.png`;
        aiHandImg.src = `/assets/tugofwar/images/${aiChoice}.png`;
        pHandImg.classList.add("show");
        aiHandImg.classList.add("show");
      }
      const rpsResult = $("rps-result");
      setTimeout(() => {
        if (pChoice === aiChoice) {
          rpsResult.innerText = "เสมอ! เป่าใหม่...";
          setTimeout(() => {
            pHandImg?.classList.remove("show");
            aiHandImg?.classList.remove("show");
          }, 1000);
          return;
        }
        isMyTurn = win[pChoice] === aiChoice;
        canPick = true;
        rpsResult.innerText = isMyTurn ? "คุณชนะ! เลือกตัวละครได้" : "คุณแพ้! ทีมคู่แข่งเลือกก่อน";
        if (choicesUI) choicesUI.style.display = "none";
        handleTurn();
      }, 600);
    }

    function handleTurn() {
      if (myTeam.length >= 3 && aiTeam.length >= 3) {
        $("char-list").style.display = "none";
        $("item-selection-area").style.display = "block";
        if (!isMyTurn) {
          $("turn-display").innerText = "ตาทีมคู่แข่งเลือก...";
          setTimeout(aiPickItem, 1000);
        } else {
          $("turn-display").innerText = "ตาทีมคุณเลือก...";
        }
        return;
      }
      if (!isMyTurn) {
        $("turn-display").innerText = "ตาทีมคู่แข่งเลือก...";
        setTimeout(aiPickFn, 1000);
      } else {
        $("turn-display").innerText = "ตาทีมคุณเลือก...";
      }
    }

    function tugSelectItem(itemName, element) {
      if (!isMyTurn || myItem || element.classList.contains("item-disabled")) return;
      myItem = itemName;
      if (pickSound) { pickSound.currentTime = 0; pickSound.play().catch(() => {}); }
      const slots = $("my-team-slots").children;
      if (slots[3]) {
        slots[3].innerHTML = `<img src="/assets/tugofwar/images/item_${itemName}.png" style="width:100%;height:100%;object-fit:contain;">`;
        slots[3].classList.add("has-char");
      }
      element.classList.add("item-disabled");
      isMyTurn = false;
      setTimeout(checkItemPhaseEnd, 1000);
    }

    function aiPickItem() {
      if (isMyTurn || aiItem) return;
      const items = ["amulet","drink","oil"];
      const avail = items.filter(it => it !== myItem);
      aiItem = avail[Math.floor(Math.random() * avail.length)];
      const aiSlots = $("ai-team-slots").children;
      if (aiSlots[3]) {
        aiSlots[3].innerHTML = `<img src="/assets/tugofwar/images/item_${aiItem}.png" style="width:100%;height:100%;object-fit:contain;">`;
        aiSlots[3].classList.add("has-char");
      }
      if (pickSound) { pickSound.currentTime = 0; pickSound.play().catch(() => {}); }
      const itemEls = document.querySelectorAll("#item-selection-area .char-item");
      itemEls.forEach(el => {
        const oc = el.getAttribute("onclick") || "";
        if (oc.includes(aiItem)) el.classList.add("item-disabled");
      });
      isMyTurn = true;
      checkItemPhaseEnd();
    }

    function checkItemPhaseEnd() {
      if (myItem && aiItem) {
        $("turn-display").innerText = "เตรียมตัวเข้าสู่สนาม!";
        setTimeout(prepareArena, 1500);
      } else {
        if (!isMyTurn) {
          $("turn-display").innerText = "ตาทีมคู่แข่งเลือก...";
          setTimeout(aiPickItem, 1000);
        } else {
          $("turn-display").innerText = "ตาทีมคุณเลือก...";
        }
      }
    }

    function tugPick(i) {
      const charEl = $(`char-${i}`);
      if (!canPick || !isMyTurn || myTeam.length >= 3 || charEl.classList.contains("selected")) return;
      pickSound.pause(); pickSound.currentTime = 0;
      pickSound.play().catch(() => {});
      myTeam.push(characters[i]);
      updateSlots("my-team-slots", myTeam);
      charEl.classList.add("selected");
      isMyTurn = false;
      handleTurn();
    }

    function aiPickFn() {
      if (!canPick) return;
      const selectable = [];
      characters.forEach((_, i) => {
        const el = $(`char-${i}`);
        if (el && !el.classList.contains("selected")) selectable.push(i);
      });
      if (selectable.length > 0 && aiTeam.length < 3) {
        pickSound.pause(); pickSound.currentTime = 0;
        pickSound.play().catch(() => {});
        const idx = selectable[Math.floor(Math.random() * selectable.length)];
        aiTeam.push(characters[idx]);
        updateSlots("ai-team-slots", aiTeam);
        $(`char-${idx}`).classList.add("selected");
      }
      isMyTurn = true;
      handleTurn();
    }

    function updateSlots(id, team) {
      const slots = $(id).children;
      team.forEach((char, index) => {
        if (slots[index]) {
          slots[index].innerHTML = `<img src="/assets/tugofwar/images/${char.image}">`;
          slots[index].classList.add("has-char");
        }
      });
    }

    function prepareArena() {
      setupCanvas();
      totalPower  = myTeam.reduce((s, c) => s + (c.power || 0), 0);
      totalSpeed  = myTeam.reduce((s, c) => s + (c.speed || 0), 0);
      aiTotalPower = aiTeam.reduce((s, c) => s + (c.power || 0), 0);
      aiTotalSpeed = aiTeam.reduce((s, c) => s + (c.speed || 0), 0);
      screens.setup.style.display = "none";
      screens.arena.style.display = "block";
      showItemInArena();
      $("game-container").style.backgroundImage = "url('/assets/tugofwar/images/bg21.png')";
      battleBgm.currentTime = 0;
      battleBgm.play().catch(() => {});
      setTimeout(startCountdown, 500);
      requestAnimationFrame(gameLoop);
    }

    function updatePowerBarUI() {
      const powerFill = $("power-fill");
      const indicator = $("power-indicator");
      const pZone = $("perfect-zone");
      if (pZone) pZone.remove();
      if (powerFill && indicator) {
        let percent = ((ropePos - 100) / 1000) * 100;
        percent = Math.max(0, Math.min(100, percent));
        indicator.style.left = percent + "%";
        powerFill.style.width = percent + "%";
      }
    }

    function updateStaminaUI() {
      const pBar = $("stamina-bar");
      const aiBar = $("ai-stamina-bar");
      if (pBar) {
        pBar.style.width = `${playerStamina}%`;
        pBar.style.backgroundColor = isExhausted ? "#ff5252" : "#00ff00";
      }
      if (aiBar) {
        aiStaminaValue = 100 - (aiExhaustion * 2);
        aiBar.style.width = `${aiStaminaValue}%`;
      }
    }

    function startCountdown() {
      const overlay = document.createElement("div");
      overlay.id = "countdown-overlay";
      Object.assign(overlay.style, {
        position:"fixed", top:"50%", left:"50%",
        transform:"translate(-50%,-50%)",
        fontSize:"150px", fontWeight:"bold", color:"#fff",
        textShadow:"0 0 20px rgba(0,0,0,0.8)",
        zIndex:"9999", pointerEvents:"none", transition:"all 0.5s ease-out",
      });
      document.body.appendChild(overlay);

      let count = 3;
      const timer = setInterval(() => {
        if (count > 0) {
          countSound.currentTime = 0; countSound.play().catch(() => {});
          overlay.innerText = count;
          overlay.style.transform = "translate(-50%,-50%) scale(1.5)";
          overlay.style.opacity = "1";
          setTimeout(() => {
            overlay.style.transform = "translate(-50%,-50%) scale(1)";
            overlay.style.opacity = "0.5";
          }, 500);
          count--;
        } else {
          clearInterval(timer);
          startGoSound.currentTime = 0; startGoSound.play().catch(() => {});
          overlay.innerText = "เริ่ม!";
          overlay.style.transform = "translate(-50%,-50%) scale(1.8)";
          overlay.style.opacity = "1";
          setTimeout(() => { overlay.remove(); isPlaying = true; }, 800);
        }
      }, 1000);
    }

    function gameLoop(timestamp) {
      if (isPlaying) {
        if (playerStamina < maxStamina) playerStamina += staminaRecover;
        if (isExhausted && playerStamina > 25) isExhausted = false;
        updateStaminaUI();

        // AI ใช้ไอเท็ม
        if (ropePos < 500 && aiItem && !aiItemUsed) {
          aiItemUsed = true;
          const aiSlotEl = $("ai-item-slot-arena");
          if (aiSlotEl) aiSlotEl.classList.add("item-used");
          const aiItemName = aiItem === "drink" ? "เครื่องดื่มชูกำลัง"
                           : aiItem === "oil"   ? "น้ำมันมวย" : "พระเครื่อง";
          showSkillMessage(`คู่แข่งใช้ ${aiItemName}!`, "#ff5252");
          if (aiItem === "drink") aiExhaustion = 0;
          else if (aiItem === "oil") aiVelocity += 25;
        }

        ropePos -= playerVelocity;
        ropePos += aiVelocity;
        playerVelocity *= 0.88;
        aiVelocity *= 0.88;

        // AI สกิลตะคริว
        if (ropePos < 550 && !aiHasUsedFreeze && Math.random() < 0.003) {
          aiHasUsedFreeze = true;
          if (myItem === "amulet") {
            showSkillMessage("พระคุ้มครอง! ป้องกันตะคริวสำเร็จ", "#ffffff");
          } else {
            playerStamina = 0; isExhausted = true;
            showSkillMessage("คุณเป็นตะคริว! พลังกายเหลือศูนย์", "#ff5252");
            if (freezeSound) { freezeSound.currentTime = 0; freezeSound.play().catch(() => {}); }
            updateStaminaUI();
          }
        }

        // AI pull logic
        if (timestamp - aiLastPushTime > aiNextPushDelay) {
          const pushStrength = ((aiTotalPower / 8.5) * (aiTotalSpeed / 4));
          const aiOilBonus = (aiItem === "oil") ? 1.15 : 1.0;
          aiVelocity += (pushStrength * aiOilBonus);
          aiExhaustion += 0.5;
          if (aiExhaustion > 50) aiExhaustion = 0;
          let baseDelay = Math.max(110, 190 - (aiTotalSpeed * 2));
          aiNextPushDelay = baseDelay + aiExhaustion + (Math.random() * 60);
          aiLastPushTime = timestamp;
        }

        if (ropePos < 100) return endGame("คุณชนะแล้ว!");
        if (ropePos > 1100) return endGame("ทีมคู่แข่ง ชนะแล้ว...");
      }
      renderGame();
      requestAnimationFrame(gameLoop);
    }

    function renderGame() {
      const ctx = screens.canvas.getContext("2d");
      const screenW = window.innerWidth;
      ctx.clearRect(0, 0, screens.canvas.width, screens.canvas.height);
      ctx.imageSmoothingEnabled = true;
      const visualRopePos = (ropePos / 1200) * screenW;
      const targetHeight = 350, posY = 200, ropeY = 360, ropeThickness = 270;

      if (ropeImg.complete) {
        const extW = screenW * 3;
        ctx.drawImage(ropeImg, visualRopePos-(extW/2), ropeY-(ropeThickness/2), extW, ropeThickness);
      }

      myTeam.forEach((char, i) => {
        const img = getCharImage(char.pullImage);
        if (img.complete) {
          const ratio = img.naturalWidth / img.naturalHeight;
          const tw = targetHeight * ratio;
          const x = visualRopePos - tw - (i * 90) - 35;
          ctx.save();
          ctx.translate(x + tw/2, posY + targetHeight/2);
          ctx.scale(-1, 1);
          ctx.drawImage(img, -tw/2, -targetHeight/2, tw, targetHeight);
          ctx.restore();
        }
      });

      aiTeam.forEach((char, i) => {
        const img = getCharImage(char.pullImage);
        if (img.complete) {
          const ratio = img.naturalWidth / img.naturalHeight;
          const tw = targetHeight * ratio;
          const x = visualRopePos + (i * 90) + 35;
          ctx.drawImage(img, x, posY, tw, targetHeight);
        }
      });

      // วาดธง
      ctx.save();
      const flagWidth = 50, poleHeight = 60;
      ctx.fillStyle = "#333";
      ctx.fillRect(visualRopePos-2, ropeY-(poleHeight/2), 4, poleHeight);
      ctx.fillStyle = "#ff0000";
      ctx.beginPath();
      ctx.moveTo(visualRopePos+2, ropeY-(poleHeight/2)+5);
      ctx.lineTo(visualRopePos+2+flagWidth, ropeY-(poleHeight/2)+5+17.5);
      ctx.lineTo(visualRopePos+2, ropeY-(poleHeight/2)+5+35);
      ctx.closePath(); ctx.fill();
      ctx.restore();

      updatePowerBarUI();
    }

    function endGame(m) {
      isPlaying = false;
      if (screens.arena) screens.arena.style.display = "none";
      battleBgm.pause();

      const won = m.includes("คุณชนะ");
      const score = won ? 100 : 0;

      const resultScreen = $("result-screen");
      if (resultScreen) {
        resultScreen.style.display = "flex";
        const statusEl = $("result-status");
        const scoreEl  = $("total-score");
        if (statusEl) statusEl.innerText = won ? "🏆 ยินดีด้วย คุณชนะ!" : "😢 น่าเสียดาย คุณแพ้!";
        if (scoreEl) {
          scoreEl.innerText = score;
          scoreEl.style.color = won ? "#ffeb3b" : "#ff5252";
        }
      }

      // ─── ส่งคะแนนกลับไปยัง GameContainer ─────
      if (scene.onGameEnd) {
        setTimeout(() => {
          scene._removeOverlay();
          scene.onGameEnd({ score, won, game: "TugOfWar" });
        }, 3000);
      } else {
        setTimeout(() => location.reload(), 5000);
      }
    }

    function showSkillMessage(text, color = "#ffeb3b") {
      const msg = document.createElement("div");
      msg.innerText = text;
      Object.assign(msg.style, {
        position:"fixed", top:"30%", left:"50%",
        transform:"translateX(-50%)", color, fontSize:"32px",
        fontWeight:"bold", fontFamily:"Kanit",
        zIndex:"10000", textShadow:"2px 2px 10px rgba(0,0,0,0.8)",
        pointerEvents:"none", transition:"all 0.5s ease-out",
      });
      document.body.appendChild(msg);
      setTimeout(() => { msg.style.top = "25%"; }, 10);
      setTimeout(() => { msg.style.opacity = "0"; setTimeout(() => msg.remove(), 500); }, 1500);
    }

    function setupCanvas() {
      const canvas = screens.canvas;
      const ctx = canvas.getContext("2d");
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.scale(dpr, dpr);
    }

    function showItemInArena() {
      const myArenaSlot = $("my-item-slot-arena");
      if (myItem && myArenaSlot) {
        myArenaSlot.innerHTML = `<div class="key-hint">ไอเท็มทีมคุณ</div><img src="/assets/tugofwar/images/item_${myItem}.png">`;
        myItemUsed = false; myArenaSlot.classList.remove("item-used");
      }
      const aiArenaSlot = $("ai-item-slot-arena");
      if (aiItem && aiArenaSlot) {
        aiArenaSlot.innerHTML = `<div class="key-hint">ไอเท็มคู่แข่ง</div><img src="/assets/tugofwar/images/item_${aiItem}.png">`;
        aiItemUsed = false; aiArenaSlot.classList.remove("item-used");
      }
    }

    function useMyItem() {
      if (!myItem || myItemUsed) return;
      myItemUsed = true;
      const slot = $("my-item-slot-arena");
      if (slot) slot.classList.add("item-used");
      if (pickSound) { pickSound.currentTime = 0; pickSound.play(); }
      switch (myItem) {
        case "amulet": showSkillMessage("พระคุ้มครอง! ป้องกันการหยุดชะงัก", "#ffffff"); break;
        case "drink":
          playerStamina = Math.min(100, playerStamina + 40);
          showSkillMessage("สดชื่น! เพิ่มพลังกาย", "#00ff00");
          updateStaminaUI(); break;
        case "oil":
          playerVelocity += 30;
          showSkillMessage("แรงฮึด! ดึงแรงขึ้นชั่วขณะ", "#ffeb3b"); break;
      }
    }

    function useSkillS() {
      if (!isPlaying || hasUsedCheer) return;
      cheerSound.currentTime = 0; cheerSound.play().catch(() => {});
      hasUsedCheer = true;
      showSkillMessage("คุณใช้เสียงเชียร์เพิ่มพลัง!", "#ffff00");
      const btnS = $("key-s");
      if (btnS) { btnS.classList.add("key-active"); setTimeout(() => btnS.classList.remove("key-active"), 200); }
    }

    function useSkillD() {
      if (!isPlaying || hasUsedFreeze) return;
      if (freezeSound) { freezeSound.currentTime = 0; freezeSound.play().catch(() => {}); }
      hasUsedFreeze = true;
      if (aiItem === "amulet") {
        showSkillMessage("ศัตรูมีพระเครื่อง! ป้องกันตะคริวได้", "#ffffff");
      } else {
        aiExhaustion = 50;
        showSkillMessage("ศัตรูตะคริวกิน! พลังกายหมดหลอด", "#ffeb3b");
        updateStaminaUI();
      }
      const btnD = $("key-d");
      if (btnD) {
        btnD.classList.add("key-active");
        btnD.style.opacity = "0.5";
        setTimeout(() => btnD.classList.remove("key-active"), 200);
        setTimeout(() => { hasUsedFreeze = false; if (btnD) btnD.style.opacity = "1"; }, 10000);
      }
    }

    /* ── KEYBOARD ── */
    function onKeyDown(e) {
      if (!isPlaying) return;
      const key = e.key.toLowerCase();
      const code = e.code;

      if (key === "q" && myItem && !myItemUsed) useMyItem();

      if (code === "Space" && !isSpacePressed) {
        isSpacePressed = true;
        const btnSpace = $("key-space");
        if (btnSpace) btnSpace.classList.add("key-active");

        let finalPower = (totalPower / 8) * (totalSpeed / 4);
        if (myItem === "oil") finalPower *= 1.1;
        const staminaMultiplier = isExhausted ? 0.5 : 1.0;
        finalPower *= staminaMultiplier;
        playerVelocity += finalPower;

        let currentDrain = staminaDrain;
        if (myItem === "drink") currentDrain *= 0.7;
        playerStamina -= currentDrain;
        if (playerStamina <= 0) {
          playerStamina = 0; isExhausted = true;
          showSkillMessage("คุณเหนื่อยจัด!", "#ff5252");
        }
      }

      if (key === "s") useSkillS();
      if (key === "d") useSkillD();
    }

    function onKeyUp(e) {
      const code = e.code;
      const key = e.key.toLowerCase();
      if (key === "s") $("key-s")?.classList.remove("key-active");
      if (key === "d") $("key-d")?.classList.remove("key-active");
      if (code === "Space") {
        $("key-space")?.classList.remove("key-active");
        isSpacePressed = false;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    /* ── TOUCH CONTROLS ── */
    const btnSpace = $("key-space");
    const btnS = $("key-s");
    const btnD = $("key-d");
    if (btnSpace) { btnSpace.style.cursor = "pointer"; btnSpace.onclick = () => { const ev = new KeyboardEvent("keydown",{code:"Space",key:" "}); window.dispatchEvent(ev); setTimeout(()=>{ window.dispatchEvent(new KeyboardEvent("keyup",{code:"Space",key:" "})); },100); }; }
    if (btnS) { btnS.style.cursor = "pointer"; btnS.onclick = () => useSkillS(); }
    if (btnD) { btnD.style.cursor = "pointer"; btnD.onclick = () => useSkillD(); }

    /* ── ปุ่มกลับแผนที่ ── */
    const backBtn = $("tug-back-btn");
    if (backBtn) {
      backBtn.onclick = () => {
        scene._removeOverlay();
        if (scene.onGameEnd) scene.onGameEnd({ score: 0, won: false, game: "TugOfWar" });
        else if (scene.scene) scene.scene.start("FestivalMapScene");
      };
    }
    const exitBtn = $("tug-exit-btn");
    if (exitBtn) {
      exitBtn.onclick = () => {
        scene._removeOverlay();
        if (scene.onGameEnd) scene.onGameEnd({ score: 0, won: false, game: "TugOfWar" });
        else if (scene.scene) scene.scene.start("FestivalMapScene");
      };
    }

    /* ── ปุ่มเข้าเกม (start screen) ── */
    const enterBtn = $("enter-game-btn");
    if (enterBtn) {
      enterBtn.onclick = () => {
        const ss = $("start-screen");
        if (ss) { ss.style.opacity = "0"; ss.style.pointerEvents = "none"; setTimeout(() => { ss.style.display = "none"; }, 500); }
        const gc = $("game-content");
        if (gc) gc.classList.remove("initial-blur");
        renderList();
      };
    }

    /* ── cleanup keyboard เมื่อ scene shutdown ── */
    this.events.once("shutdown", () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      delete window.tugPlayRPS;
      delete window.tugSelectItem;
    });
  }
}
