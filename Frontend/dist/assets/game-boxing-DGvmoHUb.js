import{P as Y}from"./phaser-iZDVk5aZ.js";const O="/assets/เเผ่นป้ายเวลากับคะเเนน.png";class Z extends Y.Scene{constructor(){super({key:"BoxingGameScene"}),this._ui=[]}init(a={}){this.onGameEnd=a.onGameEnd??null,this.roomCode=a.roomCode??null,this.player=a.player??null,this.roundId=a.roundId??null}preload(){}create(){const{width:a,height:o}=this.scale;this.add.rectangle(a/2,o/2,a,o,1706496),this._buildOverlay(),this.events.once("shutdown",()=>this._destroyUI()),this.events.once("destroy",()=>this._destroyUI())}_buildOverlay(){const a=this._el("div",{id:"bg-overlay",style:`
        position: fixed; inset: 0; z-index: 200;
        font-family: 'Sarabun', sans-serif;
        background-image: url('/assets/boxing/images/bg.png');
        background-size: cover; background-position: center;
        overflow: hidden; user-select: none;
      `}),o=this._el("style");o.textContent=this._getCSS(),a.appendChild(o),a.appendChild(this._buildStartScreen());const c=this._el("div",{id:"bg-countdown-overlay"}),g=this._el("div",{id:"bg-countdown-text"});c.appendChild(g),a.appendChild(c),a.appendChild(this._buildResultModal());const f=this._el("div",{id:"bg-main",class:"bg-hidden"});f.style.cssText=`
      width: 100%; max-width: 1400px; margin: 0 auto; padding: 10px 20px;
      box-sizing: border-box; height: 100vh;
      display: flex; flex-direction: column; align-items: center;
      padding-bottom: 128px;
    `;const i=this._el("div");i.style.cssText=`
      display: flex; justify-content: space-between; width: 100%;
      max-width: 1100px; padding: 12px 42px; box-sizing: border-box;
      pointer-events: none; margin-top: -16px;
    `,i.appendChild(this._hudBox('<span id="bg-score" style="color:#2e7d32;">คะแนน: 0</span>')),i.appendChild(this._hudBox('<span id="bg-timer" style="color:#d32f2f;">เวลา: 20</span>')),f.appendChild(i);const m=this._el("div");m.style.cssText=`
      width: 100%; max-width: 700px; position: relative;
      margin-top: -8px; margin-bottom: 16px; text-align: center; z-index: 5;
    `,m.innerHTML=`
      <div style="width:100%;height:22px;background:#4e342e;border:2px solid #ffca28;border-radius:12px;overflow:hidden;">
        <div id="bg-progress-fill" style="height:100%;width:0%;background:linear-gradient(180deg,rgba(255,255,255,0.4) 0%,#4caf50 20%,#2e7d32 80%,#1b5e20 100%);transition:width 0.4s;border-radius:12px 0 0 12px;"></div>
      </div>
      <div style="position:absolute;top:-30px;left:0;width:100%;text-align:center;font-size:1.3rem;font-weight:700;color:#ffd700;text-shadow:2px 2px 0 #3e2723,-1px -1px 0 #3e2723;">
        จำได้แล้ว <span id="bg-placed-count" style="color:#ffca28;font-size:1.5rem;">0</span> / 5
      </div>
    `,f.appendChild(m);const x=this._el("div",{id:"bg-instruction"});x.style.cssText=`
      font-size: 1.5rem; font-weight: 800; color: #ffd700;
      text-shadow: 2px 2px 0 #3e2723; letter-spacing: 1px; margin-bottom: 18px; text-align: center;
    `,x.textContent="ช่วงจดจำ: จำรูปท่าและชื่อให้แม่น!",f.appendChild(x);const b=this._el("div",{id:"bg-board"});b.style.cssText=`
      display: flex; justify-content: center; gap: 18px; width: 100%;
    `,f.appendChild(b),a.appendChild(f);const u=this._el("div",{id:"bg-deck"});u.style.cssText=`
      width: 100%; height: 110px;
      background: linear-gradient(to top, rgba(62,39,35,0.95), rgba(62,39,35,0.7));
      border-top: 3px solid #ffca28;
      display: none; justify-content: center; align-items: center;
      gap: 12px; position: fixed; bottom: 0; left: 0;
      z-index: 210; padding: 10px 15px; box-sizing: border-box;
      box-shadow: 0 -5px 15px rgba(0,0,0,0.5);
    `,a.appendChild(u),document.body.appendChild(a),this._ui.push(a),this._initGame()}_hudBox(a){const o=this._el("div");o.style.cssText=`
      background-image: url('${O}');
      background-size: 100% 100%; width: 248px; height: 108px;
      display: flex; justify-content: center; align-items: center;
      filter: drop-shadow(0 8px 15px rgba(0,0,0,0.4));
    `;const c=this._el("div");return c.style.cssText=`
      font-size: 1.24rem; font-weight: 800; margin-top: 4px;
      background: linear-gradient(180deg,#fff 0%,#ffd700 50%,#f39c12 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      filter: drop-shadow(2px 2px 0 #3e2723) drop-shadow(-1px -1px 0 #3e2723);
      letter-spacing: 1px;
    `,c.innerHTML=a,o.appendChild(c),o}_buildStartScreen(){const a=this._el("div",{id:"bg-start-screen"});a.style.cssText=`
      position: absolute; inset: 0; display: flex;
      justify-content: center; align-items: center; z-index: 300;
      background: rgba(0,0,0,0.7);
    `;const o=this._el("div");o.style.cssText=`
      background-image: url('/assets/boxing/images/start.png');
      background-size: 100% 100%; width: 710px; height: 452px;
      max-width: 90vw; display: flex; flex-direction: column;
      justify-content: center; align-items: center; padding-top: 46px;
      filter: drop-shadow(0 15px 30px rgba(0,0,0,0.6));
      position: relative;
    `;const c=this._el("div");c.style.cssText=`
      position: absolute; left: calc(50% + 62px); bottom: -12px; z-index: 5;
    `;const g=this._el("img");g.src="/assets/boxing/images/npc.png",g.style.cssText="width: 208px; height: auto; filter: drop-shadow(10px 10px 15px rgba(0,0,0,0.5)); animation: bg-nudge 3s ease-in-out infinite;",g.onerror=()=>{g.style.display="none"},c.appendChild(g),o.appendChild(c);const f=this._el("div",{id:"bg-npc-speech"});f.style.cssText=`
      position: absolute; top: 24px; left: 50%; transform: translateX(-50%);
      background: white; border: 2px solid #333; border-radius: 12px;
      padding: 10px 16px; font-size: 0.92rem; font-weight: 700;
      color: #c0392b; max-width: 286px; text-align: center; z-index: 6;
    `,f.textContent="",o.appendChild(f);const i=this._el("div");i.style.cssText=`
      position: absolute; top: 114px; left: 50%; transform: translateX(-50%);
      width: min(72%, 388px); text-align: center; color: #fff5da;
      font-size: 0.96rem; font-weight: 700; line-height: 1.5;
      text-shadow: 0 2px 8px rgba(0,0,0,0.8); z-index: 6;
    `,i.innerHTML="จดจำท่ามวยและชื่อให้แม่น จากนั้นลากป้ายชื่อไปวางบนเงาที่ถูกต้องให้ครบก่อนหมดเวลา",o.appendChild(i);const m=this._el("button");m.style.cssText=`
      min-width: 220px; padding: 13px 38px; font-size: 1.46rem; font-family: 'Sarabun', sans-serif;
      font-weight: 800; color: white; margin-top: 102px;
      background: linear-gradient(180deg,#ffcc00,#ff8800 50%,#ff4400);
      border: 4px solid #fff; border-radius: 50px; cursor: pointer;
      box-shadow: 0 8px 0 #992200, 0 15px 20px rgba(0,0,0,0.5);
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5); outline: none; z-index: 7; position: relative;
    `,m.textContent="เริ่มเกม",m.onclick=()=>this._startGame();const x=this._el("div");return x.style.cssText="display:flex;flex-direction:column;align-items:center;",x.appendChild(m),o.appendChild(x),a.appendChild(o),a}_buildResultModal(){const a=this._el("div",{id:"bg-result-modal"});a.style.cssText=`
      position: absolute; inset: 0; display: none;
      justify-content: center; align-items: center;
      background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); z-index: 400;
    `;const o=this._el("div");o.style.cssText=`
      background-image: url('/assets/boxing/images/start2.png');
      background-size: 100% 100%; background-repeat: no-repeat;
      width: 690px; height: 440px; max-width: 90vw;
      display: flex; justify-content: center; align-items: center; flex-direction: column;
      filter: drop-shadow(0 15px 40px rgba(0,0,0,0.7)); position: relative;
    `;const c=this._el("img");c.src="/assets/boxing/images/score_frame.png",c.style.cssText=`
      position: absolute; top: 112px; left: 50%; transform: translateX(-50%);
      width: min(44vw, 268px); height: auto; pointer-events:none;
      filter: drop-shadow(0 8px 18px rgba(0,0,0,0.35));
    `,o.appendChild(c);const g=this._el("div");g.style.cssText=`
      position: absolute; top: 88px; left: 50%; transform: translateX(-50%);
      color: #fff0d2; font-size: 1.08rem; font-weight: 700;
      text-shadow: 0 2px 8px rgba(0,0,0,0.8);
    `,g.textContent="คะแนนรวมจากท่าที่วางถูกต้องทั้งหมด",o.appendChild(g);const f=this._el("div",{id:"bg-final-score"});f.style.cssText=`
      position: absolute; top: 150px; left: 50%; transform: translateX(-50%);
      font-size: 6.4rem; font-family: 'Sarabun', sans-serif; font-weight: 900;
      background: linear-gradient(180deg,#fff 30%,#ffd700 60%,#ff8c00 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      filter: drop-shadow(6px 6px 0 #632b00);
      animation: bg-score-pop 0.6s cubic-bezier(0.175,0.885,0.32,1.275) forwards;
    `,f.textContent="0",o.appendChild(f);const i=this._el("button");return i.style.cssText=`
      position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%);
      padding: 12px 30px; font-size: 1.04rem; font-family: 'Sarabun', sans-serif;
      font-weight: 800; color: white;
      background: linear-gradient(180deg,#ffcc00,#ff8800); border: 3px solid #fff;
      border-radius: 40px; cursor: pointer; outline: none;
      box-shadow: 0 6px 0 #992200;
    `,i.textContent="กลับไปแผนที่",i.onclick=()=>{var x,b;const m=((x=this._gs)==null?void 0:x.score)??0;this._destroyUI(),(b=this.onGameEnd)==null||b.call(this,{score:m})},o.appendChild(i),a.appendChild(o),a}_initGame(){const a="/assets/boxing/",o=a+"images/",c=a+"sounds/",g=[{id:1,imgColor:`${o}ท่ามวยสี1.png`,imgShadow:`${o}ท่ามวยเงา1.png`,imgName:`${o}ป้าย11.png`},{id:2,imgColor:`${o}ท่ามวยสี2.png`,imgShadow:`${o}ท่ามวยเงา2.png`,imgName:`${o}ป้าย2.png`},{id:3,imgColor:`${o}ท่ามวยสี3.png`,imgShadow:`${o}ท่ามวยเงา3.png`,imgName:`${o}ป้าย3.png`},{id:4,imgColor:`${o}ท่ามวยสี4.png`,imgShadow:`${o}ท่ามวยเงา4.png`,imgName:`${o}ป้าย4.png`},{id:5,imgColor:`${o}ท่ามวยสี5.png`,imgShadow:`${o}ท่ามวยเงา5.png`,imgName:`${o}ป้าย6.png`}],f=[{id:99,imgName:`${o}ป้ายหลอก1.png`},{id:100,imgName:`${o}ป้ายหลอก2.png`}],i={score:0,timeLeft:20,playTime:15,isPlaying:!1,timerInterval:null,hasShuffledMidGame:!1};this._gs=i;const m=new Audio(`${c}npc_voice.mp3`),x=new Audio(`${c}321.mp3`),b=new Audio(`${c}start_go.mp3`),u=new Audio(`${c}bg_music.mp3`);u.loop=!0,u.volume=.4,this._bgMusic=u;const A=()=>{try{u.currentTime=0,u.play().catch(()=>{})}catch{}},G=()=>{try{u.pause(),u.currentTime=0}catch{}},k=e=>{if(e)try{e.pause(),e.currentTime=0,e.play().catch(()=>{})}catch{}},y=e=>{try{const t=window.AudioContext||window.webkitAudioContext;if(!t)return;this._audioCtx||(this._audioCtx=new t);const n=this._audioCtx,s=n.currentTime,p=n.createOscillator(),d=n.createGain();p.connect(d),d.connect(n.destination);const l={pick:{type:"triangle",start:260,end:420,dur:.12,vol:.028},alert:{type:"square",start:420,end:170,dur:.22,vol:.036},success:{type:"triangle",start:420,end:820,dur:.2,vol:.034},wrong:{type:"sawtooth",start:240,end:110,dur:.18,vol:.026},finish:{type:"sine",start:520,end:940,dur:.28,vol:.035}}[e];if(!l)return;p.type=l.type,p.frequency.setValueAtTime(l.start,s),p.frequency.exponentialRampToValueAtTime(l.end,s+l.dur),d.gain.setValueAtTime(1e-4,s),d.gain.exponentialRampToValueAtTime(l.vol,s+.01),d.gain.exponentialRampToValueAtTime(1e-4,s+l.dur),p.start(s),p.stop(s+l.dur+.02)}catch{}},L="สวัสดีขอรับ! จำท่ามวยและชื่อท่าให้แม่นภายใน 20 วินาที แล้วลากป้ายชื่อไปวางบนเงาให้ถูกต้องนะ!";function N(e,t,n,s=!1){if(!t)return;t.textContent="",s&&k(m);let p=0;const d=()=>{p<e.length&&(t.textContent+=e[p++],setTimeout(d,n))};d()}const E=()=>document.getElementById("bg-board"),C=()=>document.getElementById("bg-deck"),_=()=>document.getElementById("bg-instruction");function z(e){const t=document.createElement("img");return t.src=e.imgName,t.className="bg-name-card",t.id=`bg-card-${e.id}`,t.dataset.id=e.id,t.draggable=!1,t.onerror=()=>{const n=document.createElement("div");n.className="bg-name-card bg-name-card-text",n.id=`bg-card-${e.id}`,n.dataset.id=e.id,n.textContent=`ท่าที่ ${e.id}`,t.replaceWith(n)},t.addEventListener("dragstart",n=>n.dataTransfer.setData("text",n.target.id)),t}function S(e){e.preventDefault()}function $(e){if(e.preventDefault(),!i.isPlaying)return;const t=e.dataTransfer.getData("text"),n=document.getElementById(t);if(!n)return;const s=e.target.closest(".bg-drop-zone")||e.target.closest("#bg-deck");s&&((s.id==="bg-deck"||s.children.length===0)&&s.appendChild(n),y("pick"),B())}function B(){let e=0;document.querySelectorAll(".bg-drop-zone").forEach(s=>{s.children.length>0&&e++});const t=document.getElementById("bg-placed-count"),n=document.getElementById("bg-progress-fill");t&&(t.textContent=e),n&&(n.style.width=`${e/5*100}%`),e===5&&i.isPlaying&&setTimeout(()=>M(!1),500)}function q(){const e=E();if(!e)return;e.innerHTML="",g.forEach(n=>{const s=document.createElement("div");s.className="bg-card-container",s.dataset.slotId=n.id;const p=document.createElement("div");p.className="bg-image-box";const d=document.createElement("img");d.src=n.imgShadow,d.id=`bg-img-display-${n.id}`,d.className="bg-real-img",p.appendChild(d);const r=document.createElement("div");r.className="bg-drop-zone",r.addEventListener("drop",$),r.addEventListener("dragover",S),s.appendChild(p),s.appendChild(r),e.appendChild(s)});const t=C();t&&(t.innerHTML="",t.style.display="none",t.addEventListener("drop",$),t.addEventListener("dragover",S)),N(L,document.getElementById("bg-npc-speech"),80,!0)}this._startGame=()=>{const e=document.getElementById("bg-start-screen");e&&(e.style.display="none");try{m.pause(),m.currentTime=0}catch{}j()};const w=e=>new Promise(t=>setTimeout(t,e));async function j(){const e=document.getElementById("bg-countdown-overlay"),t=document.getElementById("bg-countdown-text");e&&(e.style.display="flex"),k(x);for(let s=3;s>0;s--)t&&(t.textContent=s,t.style.animation="none",t.offsetWidth,t.style.animation="bg-count-bounce 0.5s ease-out forwards"),await w(1e3);t&&(t.textContent="เริ่ม!",t.style.animation="none",t.offsetWidth,t.style.animation="bg-count-bounce 0.5s ease-out forwards"),k(b),await w(800),e&&(e.style.display="none");const n=document.getElementById("bg-main");n&&n.classList.remove("bg-hidden"),A(),H()}function H(){g.forEach(e=>{const t=document.getElementById(`bg-img-display-${e.id}`);t&&(t.src=e.imgColor);const n=document.querySelector(`[data-slot-id="${e.id}"]`);if(!n)return;const s=n.querySelector(".bg-drop-zone");s.innerHTML="";const p=z(e);s.appendChild(p)}),P()}function P(){i.timeLeft=20;const e=document.getElementById("bg-timer");e&&(e.textContent=`เวลา: ${i.timeLeft}`);const t=_();t&&(t.textContent="ช่วงจดจำ: จำรูปท่าและชื่อให้แม่น!",t.style.color="#ffd700"),i.timerInterval&&clearInterval(i.timerInterval),i.timerInterval=setInterval(()=>{i.timeLeft--;const n=document.getElementById("bg-timer");n&&(n.textContent=`เวลา: ${i.timeLeft}`),i.timeLeft<=0&&(clearInterval(i.timerInterval),D())},1e3)}async function R(){const e=_();e&&(e.textContent="⚠️ ระวัง! ท่ามวยสลับตำแหน่ง!",e.style.filter="drop-shadow(0 0 10px #ff0000)"),y("alert");const t=E();if(!t)return;const n=Array.from(t.querySelectorAll(".bg-card-container"));t.style.animation="bg-shake 0.5s",await w(500),t.style.animation="",n.sort(()=>Math.random()-.5),n.forEach(s=>t.appendChild(s)),t.style.backgroundColor="rgba(255,255,255,0.3)",await w(100),t.style.backgroundColor="transparent",e&&(e.style.filter="")}async function D(){const e=_();e&&(e.textContent="กำลังสลับไพ่...");const t=E();if(!t)return;const n=Array.from(t.querySelectorAll(".bg-card-container"));n.forEach(r=>{const l=r.querySelector(".bg-drop-zone");l.style.opacity="0",l.innerHTML=""});const s=t.getBoundingClientRect(),p=s.left+s.width/2,d=s.top+s.height/2;n.forEach((r,l)=>{const h=r.getBoundingClientRect(),v=p-(h.left+h.width/2),T=d-(h.top+h.height/2),I=Math.random()*10-5;r.style.transition="transform 0.5s cubic-bezier(0.25,1,0.5,1)",r.style.zIndex=l+10,setTimeout(()=>{r.style.transform=`translate(${v}px,${T}px) rotate(${I}deg)`},l*150)}),await w(500+n.length*150),g.forEach(r=>{const l=document.getElementById(`bg-img-display-${r.id}`);l&&(l.src=r.imgShadow)}),n.forEach(r=>{r.style.transition="none",r.style.transform="",r.style.zIndex=""}),n.sort(()=>Math.random()-.5),n.forEach(r=>t.appendChild(r)),n.forEach(r=>{const l=r.getBoundingClientRect(),h=p-(l.left+l.width/2),v=d-(l.top+l.height/2);r.style.transform=`translate(${h}px,${v}px)`}),document.body.offsetHeight,n.forEach((r,l)=>{r.style.transition="transform 0.6s cubic-bezier(0.25,1,0.5,1)",r.querySelector(".bg-drop-zone").style.opacity="1",setTimeout(()=>{r.style.transform=""},l*150)}),await w(600+n.length*150),n.forEach(r=>{r.style.transition="",r.style.transform=""}),X()}function X(){i.isPlaying=!0,i.playTime=15;const e=_();e&&(e.textContent="ระวังป้ายหลอก ลากป้ายที่ถูกต้องไปวางบนรูปเงาให้ครบ",e.style.color="");const t=C();if(!t)return;t.style.display="flex",t.innerHTML="";const n=[...g,...f];n.sort(()=>Math.random()-.5),n.forEach(s=>{const p=z(s);p.draggable=!0,t.appendChild(p)}),B(),U()}function U(){i.timerInterval&&clearInterval(i.timerInterval),i.hasShuffledMidGame=!1;const e=document.getElementById("bg-timer");e&&(e.textContent=`เวลา: ${i.playTime}`),i.timerInterval=setInterval(()=>{i.playTime--;const t=document.getElementById("bg-timer");t&&(t.textContent=`เวลา: ${i.playTime}`),i.playTime===5&&!i.hasShuffledMidGame&&(R(),i.hasShuffledMidGame=!0),i.playTime<=0&&(clearInterval(i.timerInterval),M(!0))},1e3)}async function M(e=!1){var p;clearInterval(i.timerInterval),i.isPlaying=!1,G(),document.querySelectorAll(".bg-name-card").forEach(d=>d.draggable=!1);const t=document.querySelectorAll(".bg-card-container");let n=0;t.forEach(d=>{const r=parseInt(d.dataset.slotId),l=d.querySelector(".bg-drop-zone");let h=!1;l.children.length>0&&parseInt(l.children[0].dataset.id)===r&&(n+=10,h=!0),d.classList.remove("bg-correct-box","bg-wrong-box"),d.classList.add(h?"bg-correct-box":"bg-wrong-box");const v=d.querySelector(".bg-real-img"),T=g.find(I=>I.id===r);v&&T&&(v.src=T.imgColor)}),n>=40?y("success"):n>0?y("pick"):y("wrong"),i.score=n;const s=document.getElementById("bg-score");s&&(s.textContent=`คะแนน: ${n}`),(p=C())!=null&&p.style&&(C().style.display="none"),setTimeout(()=>{y("finish");const d=document.getElementById("bg-result-modal"),r=document.getElementById("bg-final-score");d&&(d.style.display="flex"),r&&(r.textContent=n)},800)}q()}_getCSS(){return`
      @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700;800&display=swap');

      .bg-hidden { display: none !important; }

      #bg-countdown-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.4);
        display: none; justify-content: center; align-items: center; z-index: 500;
      }
      #bg-countdown-text {
        color: #f1c40f; font-size: 180px; font-weight: 900;
        font-family: 'Sarabun', sans-serif; text-shadow: 8px 8px 0 #000;
        pointer-events: none;
        animation: bg-count-bounce 0.5s ease-out forwards;
      }
      @keyframes bg-count-bounce {
        0%   { transform: scale(0.5); opacity: 0; }
        50%  { transform: scale(1.2); opacity: 1; }
        100% { transform: scale(1);   opacity: 1; }
      }
      @keyframes bg-score-pop {
        0%   { transform: scale(0) translateY(40px); opacity: 0; }
        80%  { transform: scale(1.1) translateY(40px); }
        100% { transform: scale(1) translateY(40px); opacity: 1; }
      }
      @keyframes bg-nudge {
        0%,100% { transform: translateY(0) rotate(0deg); }
        50%     { transform: translateY(-12px) rotate(2deg); }
      }
      @keyframes bg-shake {
        0%   { transform: translate(1px,1px) rotate(0deg); }
        20%  { transform: translate(-3px,0) rotate(1deg); }
        40%  { transform: translate(1px,-1px) rotate(1deg); }
        60%  { transform: translate(-3px,1px) rotate(0deg); }
        80%  { transform: translate(-1px,-1px) rotate(1deg); }
        100% { transform: translate(1px,-2px) rotate(-1deg); }
      }

      .bg-card-container {
        display: flex; flex-direction: column; align-items: center;
        flex: 1; max-width: 160px; margin: 0 auto;
        transition: all 0.5s cubic-bezier(0.68,-0.55,0.27,1.55);
      }
      .bg-image-box {
        background-color: #350901;
        border: 2px solid rgba(70,50,5,0.9);
        box-shadow: 0 6px 12px rgba(0,0,0,0.6);
        border-radius: 12px; overflow: hidden;
        display: flex; justify-content: center; align-items: center;
        width: 140px; height: 240px;
      }
      .bg-real-img { display: block; width: 100%; height: 100%; object-fit: cover; }
      .bg-drop-zone {
        width: 100%; height: 70px; min-height: 70px;
        background: rgba(255,236,179,0.3);
        border: 3px solid #b8860b; border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 8px rgba(0,0,0,0.4);
        transition: opacity 0.3s; margin-top: 30px;
      }
      .bg-drop-zone.drag-over { background: rgba(255,200,0,0.4); }
      .bg-name-card {
        cursor: grab; filter: drop-shadow(0 3px 4px rgba(0,0,0,0.5));
        transition: transform 0.1s; height: 70px !important; width: auto;
      }
      .bg-name-card-text {
        cursor: grab; background: #8b4513; color: #ffd700;
        border: 2px solid #ffd700; border-radius: 8px;
        padding: 8px 12px; font-size: 1rem; font-weight: 800;
        text-shadow: 1px 1px 0 #333; white-space: nowrap;
        filter: drop-shadow(0 3px 4px rgba(0,0,0,0.5));
      }
      .bg-correct-box .bg-image-box { border-color: #4caf50 !important; box-shadow: 0 0 20px #4caf50; }
      .bg-wrong-box  .bg-image-box  { border-color: #f44336 !important; box-shadow: 0 0 20px #f44336; }
    `}_el(a,o={}){const c=document.createElement(a);return Object.entries(o).forEach(([g,f])=>{g==="style"?c.style.cssText=f:c.setAttribute(g,f)}),c}_destroyUI(){var a;if(this._bgMusic){try{this._bgMusic.pause()}catch{}this._bgMusic=null}(a=this._gs)!=null&&a.timerInterval&&clearInterval(this._gs.timerInterval),this._ui.forEach(o=>{try{o.remove()}catch{}}),this._ui=[]}}export{Z as B};
