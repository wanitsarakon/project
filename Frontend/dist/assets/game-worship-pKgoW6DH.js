import{P as h}from"./phaser-iZDVk5aZ.js";const b=new URL("/assets/%E0%B9%84%E0%B8%AB%E0%B8%A7%E0%B9%89%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B9%80%E0%B8%A3%E0%B8%B4%E0%B9%88%E0%B8%A1%E0%B9%80%E0%B8%81%E0%B8%A1-DxXClK2N.jpg",import.meta.url).href,u=new URL("/assets/temple_bell-zYhLx0tT.wav",import.meta.url).href,w=new URL("/assets/calm_ambience-BqQWv_i4.wav",import.meta.url).href,l=[{id:"incense",label:"ธูป",icon:"🪔",color:"#ffcf8a"},{id:"candle",label:"เทียน",icon:"🕯️",color:"#ffe59e"},{id:"lotus",label:"ดอกบัว",icon:"🪷",color:"#ffcde0"}],c=["สุขภาพแข็งแรง","โชคดีตลอดปี","การงานราบรื่น","มีคนเมตตาอุปถัมภ์","สมหวังในสิ่งที่ตั้งใจ"],a=3,p=45;class f extends h.Scene{constructor(){super({key:"WorshipBoothScene"}),this.onGameEnd=null,this.root=null,this.state=null,this.timerHandle=null}init(t={}){this.onGameEnd=(t==null?void 0:t.onGameEnd)??null}preload(){this.load.audio("worship-bell",u),this.load.audio("worship-calm",w)}create(){this.state=this.createInitialState(),this.buildDom(),this.renderState(),this.events.once("shutdown",()=>this.cleanup()),this.events.once("destroy",()=>this.cleanup())}createInitialState(){return{phase:"intro",score:0,mistakes:0,round:1,timeLeft:p,stepIndex:0,roundSequence:this.generateSequence(),completedRounds:0,blessing:null}}generateSequence(){return h.Utils.Array.Shuffle([...l]).map(t=>t.id)}buildDom(){var e,s,n,r,d;const t=(e=this.game.canvas)==null?void 0:e.parentElement;t&&(this.root=document.createElement("div"),this.root.innerHTML=`
      <style>
        .wb-root{position:absolute;inset:0;overflow:hidden;font-family:Kanit,sans-serif;background:radial-gradient(circle at top,#ffe9bf,#d89d4f 55%,#8b4e18 100%);color:#5b2c00}
        .wb-dim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(45,18,0,.18))}
        .wb-wrap{position:relative;z-index:2;height:100%;display:flex;align-items:center;justify-content:center;padding:24px}
        .wb-card{width:min(94vw,920px);background:rgba(255,249,236,.92);border-radius:32px;box-shadow:0 20px 48px rgba(0,0,0,.24);padding:26px 28px 28px}
        .wb-title{font-size:38px;font-weight:800;text-align:center;color:#6d3100}
        .wb-sub{margin-top:8px;text-align:center;font-size:18px;color:#7b430f}
        .wb-hud{margin-top:18px;display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:12px}
        .wb-box{background:#fff4dc;border-radius:18px;padding:12px 14px;text-align:center;box-shadow:inset 0 0 0 1px rgba(150,84,20,.08)}
        .wb-box strong{display:block;font-size:14px;color:#8e541a}
        .wb-box span{display:block;font-size:30px;font-weight:800}
        .wb-sequence{margin-top:18px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
        .wb-pill{min-width:110px;border-radius:999px;padding:12px 18px;background:#fff0d2;border:2px solid transparent;text-align:center;font-weight:700;transition:.18s ease}
        .wb-pill.active{border-color:#b25a0d;transform:translateY(-2px);box-shadow:0 10px 18px rgba(0,0,0,.08)}
        .wb-pill.done{background:#e4ffd6;color:#356315}
        .wb-msg{margin-top:18px;min-height:54px;text-align:center;font-size:20px;font-weight:700;color:#7d430e}
        .wb-grid{margin-top:10px;display:grid;grid-template-columns:repeat(3,minmax(160px,1fr));gap:16px}
        .wb-btn{border:none;border-radius:24px;padding:24px 16px;background:#fff;font:inherit;font-weight:800;color:#6a3000;cursor:pointer;box-shadow:0 12px 24px rgba(0,0,0,.1);transition:transform .15s ease,box-shadow .15s ease,background .15s ease}
        .wb-btn:hover{transform:translateY(-2px);box-shadow:0 16px 28px rgba(0,0,0,.14)}
        .wb-btn:active{transform:translateY(2px)}
        .wb-btn span{display:block;font-size:44px;margin-bottom:8px}
        .wb-btn.wrong{background:#ffe0d8}
        .wb-btn.right{background:#e7ffd8}
        .wb-footer{margin-top:18px;display:flex;justify-content:center}
        .wb-finish{border:none;border-radius:999px;padding:13px 28px;background:#8b4513;color:#fff;font:inherit;font-weight:800;cursor:pointer;box-shadow:0 12px 20px rgba(0,0,0,.16)}
        .wb-finish[disabled]{opacity:.5;cursor:default}
        .wb-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;z-index:4;background:rgba(0,0,0,.55)}
        .wb-start{width:min(92vw,760px);aspect-ratio:3/2;background:url('${b}') center/contain no-repeat;display:flex;align-items:flex-end;justify-content:center;padding-bottom:44px}
        .wb-panel{width:min(92vw,760px);padding:26px;border-radius:28px;background:rgba(52,18,0,.74);text-align:center;color:#fff6dd}
        .wb-panel h2{margin:0;font-size:38px}
        .wb-panel p{font-size:18px;line-height:1.6}
        .wb-mainbtn,.wb-subbtn{border:none;border-radius:999px;font:inherit;font-weight:800;cursor:pointer}
        .wb-mainbtn{padding:13px 26px;background:#cb6a18;color:#fff8e6}
        .wb-subbtn{margin-top:10px;padding:10px 20px;background:rgba(255,245,214,.15);color:#fff3cf}
        .wb-count{font-size:120px;font-weight:900;color:#fff4d2;text-shadow:0 0 24px rgba(255,208,122,.45)}
        .wb-result{width:min(92vw,760px);padding:32px;border-radius:30px;background:rgba(255,247,225,.96);text-align:center;color:#6a3000;box-shadow:0 20px 48px rgba(0,0,0,.24)}
        .wb-scorebig{font-size:72px;font-weight:900}
        .wb-note{margin-top:10px;font-size:20px}
        @media (max-width:760px){.wb-hud{grid-template-columns:repeat(2,minmax(120px,1fr))}.wb-grid{grid-template-columns:1fr}.wb-pill{min-width:92px}}
      </style>
      <div class="wb-root">
        <div class="wb-dim"></div>
        <div class="wb-wrap">
          <div class="wb-card">
            <div class="wb-title">ซุ้มไหว้พระขอพร</div>
            <div class="wb-sub">ทำพิธีให้ถูกลำดับภายในเวลา แล้วรับพรกลับไปพร้อมคะแนน</div>
            <div class="wb-hud">
              <div class="wb-box"><strong>คะแนน</strong><span id="wb-score">0</span></div>
              <div class="wb-box"><strong>เวลา</strong><span id="wb-time">${p}</span></div>
              <div class="wb-box"><strong>รอบ</strong><span id="wb-round">1 / ${a}</span></div>
              <div class="wb-box"><strong>พลาด</strong><span id="wb-mistakes">0</span></div>
            </div>
            <div id="wb-sequence" class="wb-sequence"></div>
            <div id="wb-msg" class="wb-msg"></div>
            <div id="wb-grid" class="wb-grid"></div>
            <div class="wb-footer">
              <button id="wb-pray" class="wb-finish" disabled>รับพรและจบเกม</button>
            </div>
          </div>
        </div>
        <div id="wb-intro" class="wb-overlay">
          <div class="wb-panel">
            <div class="wb-start"></div>
            <h2>ไหว้พระขอพร</h2>
            <p>จำลำดับเครื่องสักการะของแต่ละรอบให้ดี แล้วกดให้ถูกต้องครบ 3 รอบ หากกดผิดจะเสียคะแนนและต้องเริ่มลำดับรอบนั้นใหม่</p>
            <button id="wb-start-btn" class="wb-mainbtn">เริ่มพิธี</button>
            <div><button id="wb-help-btn" class="wb-subbtn">ดูวิธีเล่นอีกครั้ง</button></div>
          </div>
        </div>
        <div id="wb-countdown" class="wb-overlay" style="display:none"><div id="wb-count" class="wb-count">3</div></div>
        <div id="wb-result" class="wb-overlay" style="display:none">
          <div class="wb-result">
            <h2 style="margin:0">พรที่ได้รับ</h2>
            <div id="wb-final-blessing" class="wb-note" style="font-size:28px;font-weight:800"></div>
            <div id="wb-final-score" class="wb-scorebig">0</div>
            <div id="wb-final-meta" class="wb-note"></div>
            <button id="wb-finish-btn" class="wb-mainbtn" style="margin-top:20px">กลับแผนที่</button>
          </div>
        </div>
      </div>
    `,t.appendChild(this.root),this.scoreEl=this.root.querySelector("#wb-score"),this.timeEl=this.root.querySelector("#wb-time"),this.roundEl=this.root.querySelector("#wb-round"),this.mistakesEl=this.root.querySelector("#wb-mistakes"),this.sequenceEl=this.root.querySelector("#wb-sequence"),this.msgEl=this.root.querySelector("#wb-msg"),this.gridEl=this.root.querySelector("#wb-grid"),this.prayBtn=this.root.querySelector("#wb-pray"),this.introEl=this.root.querySelector("#wb-intro"),this.countdownEl=this.root.querySelector("#wb-countdown"),this.countValueEl=this.root.querySelector("#wb-count"),this.resultEl=this.root.querySelector("#wb-result"),this.finalBlessingEl=this.root.querySelector("#wb-final-blessing"),this.finalScoreEl=this.root.querySelector("#wb-final-score"),this.finalMetaEl=this.root.querySelector("#wb-final-meta"),l.forEach(i=>{const o=document.createElement("button");o.className="wb-btn",o.dataset.stepId=i.id,o.innerHTML=`<span>${i.icon}</span>${i.label}`,o.addEventListener("click",()=>this.pickStep(i.id,o)),this.gridEl.appendChild(o)}),(s=this.root.querySelector("#wb-start-btn"))==null||s.addEventListener("click",()=>this.startCountdown()),(n=this.root.querySelector("#wb-help-btn"))==null||n.addEventListener("click",()=>{this.msgEl.textContent="กดให้ตรงตามลำดับที่แสดงด้านบน หากผิดจะต้องเริ่มลำดับรอบนั้นใหม่"}),(r=this.prayBtn)==null||r.addEventListener("click",()=>this.finishGame()),(d=this.root.querySelector("#wb-finish-btn"))==null||d.addEventListener("click",()=>{var i;(i=this.onGameEnd)==null||i.call(this,{score:this.state.score,blessing:this.state.blessing,meta:{mistakes:this.state.mistakes,completedRounds:this.state.completedRounds,timeLeft:this.state.timeLeft}})}))}startCountdown(){if(this.state.phase!=="intro")return;this.state.phase="countdown",this.introEl.style.display="none",this.countdownEl.style.display="flex";let t=3;this.countValueEl.textContent="3",this.countdownTimer=window.setInterval(()=>{t-=1,t>0?this.countValueEl.textContent=String(t):t===0?this.countValueEl.textContent="เริ่ม!":(window.clearInterval(this.countdownTimer),this.countdownTimer=null,this.countdownEl.style.display="none",this.calmBgm=this.sound.add("worship-calm",{loop:!0,volume:.18}),this.calmBgm.isPlaying||this.calmBgm.play(),this.startRoundTimer(),this.state.phase="playing",this.msgEl.textContent=`เริ่มจาก ${this.stepLabel(this.state.roundSequence[0])}`,this.renderState())},1e3)}startRoundTimer(){this.timerHandle=window.setInterval(()=>{this.state.phase==="playing"&&(this.state.timeLeft-=1,this.state.timeLeft<=0&&(this.state.timeLeft=0,this.finishGame(!0)),this.renderState())},1e3)}stepLabel(t){var e;return((e=l.find(s=>s.id===t))==null?void 0:e.label)??t}pickStep(t,e){if(this.state.phase!=="playing")return;const n=this.state.roundSequence[this.state.stepIndex]===t;if(e.classList.remove("wrong","right"),e.offsetWidth,e.classList.add(n?"right":"wrong"),window.setTimeout(()=>e.classList.remove("wrong","right"),240),!n){this.state.mistakes+=1,this.state.score=Math.max(0,this.state.score-5),this.state.stepIndex=0,this.msgEl.textContent=`ผิดลำดับ ต้องเริ่มรอบ ${this.state.round} ใหม่`,this.renderState();return}if(this.state.score+=15,this.state.stepIndex+=1,this.sound.play("worship-bell",{volume:.18}),this.state.stepIndex>=this.state.roundSequence.length){if(this.state.completedRounds+=1,this.state.score+=20,this.state.round>=a){this.msgEl.textContent="พิธีครบแล้ว กดรับพรได้เลย",this.state.phase="ready",this.renderState();return}this.state.round+=1,this.state.stepIndex=0,this.state.roundSequence=this.generateSequence(),this.msgEl.textContent=`ผ่านรอบแล้ว เริ่มรอบ ${this.state.round} ด้วย ${this.stepLabel(this.state.roundSequence[0])}`,this.renderState();return}this.msgEl.textContent=`ต่อไป: ${this.stepLabel(this.state.roundSequence[this.state.stepIndex])}`,this.renderState()}finishGame(t=!1){var e;this.state.phase!=="result"&&(window.clearInterval(this.timerHandle),this.timerHandle=null,(e=this.calmBgm)==null||e.stop(),this.state.phase="result",this.state.blessing=c[Math.floor(Math.random()*c.length)],this.sound.play("worship-bell",{volume:.35}),t||(this.state.score+=Math.max(10,this.state.timeLeft)),this.finalBlessingEl.textContent=this.state.blessing,this.finalScoreEl.textContent=String(this.state.score),this.finalMetaEl.textContent=t?`หมดเวลาก่อนจบพิธี พลาด ${this.state.mistakes} ครั้ง สำเร็จ ${this.state.completedRounds}/${a} รอบ`:`ทำพิธีครบ ${this.state.completedRounds}/${a} รอบ พลาด ${this.state.mistakes} ครั้ง เหลือเวลา ${this.state.timeLeft} วินาที`,this.resultEl.style.display="flex",this.renderState())}renderState(){this.scoreEl.textContent=String(this.state.score),this.timeEl.textContent=String(this.state.timeLeft),this.roundEl.textContent=`${Math.min(this.state.round,a)} / ${a}`,this.mistakesEl.textContent=String(this.state.mistakes),this.sequenceEl.innerHTML=this.state.roundSequence.map((t,e)=>{const s=l.find(r=>r.id===t);return`<div class="${["wb-pill",e<this.state.stepIndex?"done":"",e===this.state.stepIndex&&(this.state.phase==="playing"||this.state.phase==="ready")?"active":""].filter(Boolean).join(" ")}" style="background:${e<this.state.stepIndex?"#e7ffd8":s.color}">${s.icon} ${s.label}</div>`}).join(""),this.prayBtn.disabled=this.state.phase!=="ready"}cleanup(){var t,e,s;(t=this.calmBgm)==null||t.stop(),(e=this.calmBgm)==null||e.destroy(),this.calmBgm=null,window.clearInterval(this.timerHandle),window.clearInterval(this.countdownTimer),this.timerHandle=null,this.countdownTimer=null,(s=this.root)!=null&&s.parentNode&&this.root.parentNode.removeChild(this.root),this.root=null}}export{f as W};
