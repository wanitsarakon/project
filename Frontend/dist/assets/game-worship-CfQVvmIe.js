import{P as a}from"./phaser-iZDVk5aZ.js";const e=[{id:"incense",label:"ธูป",icon:"🪔"},{id:"candle",label:"เทียน",icon:"🕯️"},{id:"lotus",label:"ดอกบัว",icon:"🪷"}],r=["สุขภาพแข็งแรง","โชคดีตลอดปี","การงานราบรื่น","มีคนเมตตาอุปถัมภ์","สมหวังในสิ่งที่ตั้งใจ"];class l extends a.Scene{constructor(){super({key:"WorshipBoothScene"}),this.onGameEnd=null,this.root=null,this.state=null}init(t={}){this.onGameEnd=(t==null?void 0:t.onGameEnd)??null}create(){this.state={score:0,stepIndex:0,mistakes:0,blessed:!1},this.buildDom(),this.events.once("shutdown",()=>this.cleanup()),this.events.once("destroy",()=>this.cleanup())}buildDom(){var s,i;const t=(s=this.game.canvas)==null?void 0:s.parentElement;t&&(this.root=document.createElement("div"),this.root.innerHTML=`
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
    `,t.appendChild(this.root),this.scoreEl=this.root.querySelector("#wb-score"),this.stepEl=this.root.querySelector("#wb-step"),this.msgEl=this.root.querySelector("#wb-msg"),this.gridEl=this.root.querySelector("#wb-grid"),this.prayBtn=this.root.querySelector("#wb-pray"),e.forEach(o=>{const n=document.createElement("button");n.className="wb-btn",n.innerHTML=`<span>${o.icon}</span>${o.label}`,n.addEventListener("click",()=>this.pickStep(o.id)),this.gridEl.appendChild(n)}),(i=this.prayBtn)==null||i.addEventListener("click",()=>this.pray()),this.renderState())}pickStep(t){var i;if(this.state.blessed)return;((i=e[this.state.stepIndex])==null?void 0:i.id)===t?(this.state.score+=20,this.state.stepIndex+=1,this.msgEl.textContent=this.state.stepIndex>=e.length?"เครื่องสักการะพร้อมแล้ว กดขอพรได้เลย":`ต่อไป: ${e[this.state.stepIndex].label}`):(this.state.mistakes+=1,this.state.score=Math.max(0,this.state.score-10),this.msgEl.textContent="ลำดับไม่ถูก ต้องเริ่มใหม่ด้วยสติ",this.state.stepIndex=0),this.renderState()}pray(){if(this.state.stepIndex<e.length||this.state.blessed)return;this.state.blessed=!0,this.state.score+=Math.max(10,40-this.state.mistakes*10);const t=r[Math.floor(Math.random()*r.length)];this.msgEl.textContent=`พรที่ได้รับ: ${t}`,this.renderState(),window.setTimeout(()=>{var s;(s=this.onGameEnd)==null||s.call(this,{score:this.state.score,blessing:t,game:"WorshipBooth"})},1200)}renderState(){this.scoreEl&&(this.scoreEl.textContent=this.state.score),this.stepEl&&(this.stepEl.textContent=Math.min(this.state.stepIndex+1,e.length)),this.prayBtn&&(this.prayBtn.disabled=this.state.stepIndex<e.length||this.state.blessed,this.prayBtn.style.opacity=this.prayBtn.disabled?"0.55":"1",this.prayBtn.style.cursor=this.prayBtn.disabled?"default":"pointer")}cleanup(){var t;(t=this.root)!=null&&t.parentNode&&this.root.parentNode.removeChild(this.root),this.root=null}}export{l as W};
