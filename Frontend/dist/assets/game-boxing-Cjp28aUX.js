import{P as U}from"./phaser-iZDVk5aZ.js";class X extends U.Scene{constructor(){super({key:"BoxingGameScene"}),this._ui=[]}init(s={}){this.onGameEnd=s.onGameEnd??null,this.roomCode=s.roomCode??null,this.player=s.player??null,this.roundId=s.roundId??null}preload(){}create(){const{width:s,height:i}=this.scale;this.add.rectangle(s/2,i/2,s,i,1706496),this._buildOverlay(),this.events.once("shutdown",()=>this._destroyUI()),this.events.once("destroy",()=>this._destroyUI())}_buildOverlay(){const s=this._el("div",{id:"bg-overlay",style:`
        position: fixed; inset: 0; z-index: 200;
        font-family: 'Sarabun', sans-serif;
        background-image: url('/assets/boxing/images/bg.png');
        background-size: cover; background-position: center;
        overflow: hidden; user-select: none;
      `}),i=this._el("style");i.textContent=this._getCSS(),s.appendChild(i),s.appendChild(this._buildStartScreen());const d=this._el("div",{id:"bg-countdown-overlay"}),l=this._el("div",{id:"bg-countdown-text"});d.appendChild(l),s.appendChild(d),s.appendChild(this._buildResultModal());const g=this._el("div",{id:"bg-main",class:"bg-hidden"});g.style.cssText=`
      width: 100%; max-width: 1400px; margin: 0 auto; padding: 10px 20px;
      box-sizing: border-box; height: 100vh;
      display: flex; flex-direction: column; align-items: center;
      padding-bottom: 140px;
    `;const o=this._el("div");o.style.cssText=`
      display: flex; justify-content: space-between; width: 100%;
      max-width: 1100px; padding: 20px 50px; box-sizing: border-box;
      pointer-events: none; margin-top: -30px;
    `,o.appendChild(this._hudBox('<span id="bg-timer" style="color:#d32f2f;">เวลา:20</span>')),o.appendChild(this._hudBox('<span id="bg-score" style="color:#2e7d32;">คะแนน:0</span>')),g.appendChild(o);const m=this._el("div");m.style.cssText=`
      width: 100%; max-width: 700px; position: relative;
      margin-top: -20px; margin-bottom: 15px; text-align: center; z-index: 5;
    `,m.innerHTML=`
      <div style="width:100%;height:22px;background:#4e342e;border:2px solid #ffca28;border-radius:12px;overflow:hidden;">
        <div id="bg-progress-fill" style="height:100%;width:0%;background:linear-gradient(180deg,rgba(255,255,255,0.4) 0%,#4caf50 20%,#2e7d32 80%,#1b5e20 100%);transition:width 0.4s;border-radius:12px 0 0 12px;"></div>
      </div>
      <div style="position:absolute;top:-30px;left:0;width:100%;text-align:center;font-size:1.3rem;font-weight:700;color:#ffd700;text-shadow:2px 2px 0 #3e2723,-1px -1px 0 #3e2723;">
        จำได้แล้ว <span id="bg-placed-count" style="color:#ffca28;font-size:1.5rem;">0</span> / 5
      </div>
    `,g.appendChild(m);const y=this._el("div",{id:"bg-instruction"});y.style.cssText=`
      font-size: 1.5rem; font-weight: 800; color: #ffd700;
      text-shadow: 2px 2px 0 #3e2723; letter-spacing: 1px; margin-bottom: 25px; text-align: center;
    `,y.textContent="ช่วงจดจำ: จำรูปท่าและชื่อให้แม่น!",g.appendChild(y);const w=this._el("div",{id:"bg-board"});w.style.cssText=`
      display: flex; justify-content: center; gap: 20px; width: 100%;
    `,g.appendChild(w),s.appendChild(g);const x=this._el("div",{id:"bg-deck"});x.style.cssText=`
      width: 100%; height: 110px;
      background: linear-gradient(to top, rgba(62,39,35,0.95), rgba(62,39,35,0.7));
      border-top: 3px solid #ffca28;
      display: none; justify-content: center; align-items: center;
      gap: 12px; position: fixed; bottom: 0; left: 0;
      z-index: 210; padding: 10px 15px; box-sizing: border-box;
      box-shadow: 0 -5px 15px rgba(0,0,0,0.5);
    `,s.appendChild(x),document.body.appendChild(s),this._ui.push(s),this._initGame()}_hudBox(s){const i=this._el("div");i.style.cssText=`
      background-image: url('/assets/boxing/images/counttime.png');
      background-size: 100% 100%; width: 250px; height: 180px;
      display: flex; justify-content: center; align-items: center;
      filter: drop-shadow(0 8px 15px rgba(0,0,0,0.4));
    `;const d=this._el("div");return d.style.cssText=`
      font-size: 1.5rem; font-weight: 600; margin-top: -15px;
      background: linear-gradient(180deg,#fff 0%,#ffd700 50%,#f39c12 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      filter: drop-shadow(2px 2px 0 #3e2723) drop-shadow(-1px -1px 0 #3e2723);
      letter-spacing: 1px;
    `,d.innerHTML=s,i.appendChild(d),i}_buildStartScreen(){const s=this._el("div",{id:"bg-start-screen"});s.style.cssText=`
      position: absolute; inset: 0; display: flex;
      justify-content: center; align-items: center; z-index: 300;
      background: rgba(0,0,0,0.7);
    `;const i=this._el("div");i.style.cssText=`
      background-image: url('/assets/boxing/images/start.png');
      background-size: 100% 100%; width: 700px; height: 450px;
      max-width: 90vw; display: flex; flex-direction: column;
      justify-content: center; align-items: center; padding-top: 60px;
      filter: drop-shadow(0 15px 30px rgba(0,0,0,0.6));
      position: relative;
    `;const d=this._el("div");d.style.cssText=`
      position: absolute; left: calc(50% + 60px); bottom: -20px; z-index: 5;
    `;const l=this._el("img");l.src="/assets/boxing/images/npc.png",l.style.cssText="width: 220px; height: auto; filter: drop-shadow(10px 10px 15px rgba(0,0,0,0.5)); animation: bg-nudge 3s ease-in-out infinite;",l.onerror=()=>{l.style.display="none"},d.appendChild(l),i.appendChild(d);const g=this._el("div",{id:"bg-npc-speech"});g.style.cssText=`
      position: absolute; top: 30px; left: 50%; transform: translateX(-50%);
      background: white; border: 2px solid #333; border-radius: 12px;
      padding: 10px 16px; font-size: 0.95rem; font-weight: 700;
      color: #c0392b; max-width: 300px; text-align: center; z-index: 6;
    `,g.textContent="",i.appendChild(g);const o=this._el("button");o.style.cssText=`
      padding: 15px 40px; font-size: 1.6rem; font-family: 'Sarabun', sans-serif;
      font-weight: 800; color: white; margin-top: 110px;
      background: linear-gradient(180deg,#ffcc00,#ff8800 50%,#ff4400);
      border: 4px solid #fff; border-radius: 50px; cursor: pointer;
      box-shadow: 0 8px 0 #992200, 0 15px 20px rgba(0,0,0,0.5);
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5); outline: none; z-index: 7; position: relative;
    `,o.textContent="เริ่มเล่นเกม",o.onclick=()=>this._startGame();const m=this._el("div");return m.style.cssText="display:flex;flex-direction:column;align-items:center;",m.appendChild(o),i.appendChild(m),s.appendChild(i),s}_buildResultModal(){const s=this._el("div",{id:"bg-result-modal"});s.style.cssText=`
      position: absolute; inset: 0; display: none;
      justify-content: center; align-items: center;
      background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); z-index: 400;
    `;const i=this._el("div");i.style.cssText=`
      background-image: url('/assets/boxing/images/start2.png');
      background-size: 100% 100%; background-repeat: no-repeat;
      width: 700px; height: 450px; max-width: 90vw;
      display: flex; justify-content: center; align-items: center;
      filter: drop-shadow(0 15px 40px rgba(0,0,0,0.7)); position: relative;
    `;const d=this._el("div",{id:"bg-final-score"});d.style.cssText=`
      font-size: 7rem; font-family: 'Sarabun', sans-serif; font-weight: 900;
      background: linear-gradient(180deg,#fff 30%,#ffd700 60%,#ff8c00 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      filter: drop-shadow(6px 6px 0 #632b00);
      transform: translateY(40px);
      animation: bg-score-pop 0.6s cubic-bezier(0.175,0.885,0.32,1.275) forwards;
    `,d.textContent="0",i.appendChild(d);const l=this._el("button");return l.style.cssText=`
      position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%);
      padding: 12px 32px; font-size: 1.1rem; font-family: 'Sarabun', sans-serif;
      font-weight: 800; color: white;
      background: linear-gradient(180deg,#ffcc00,#ff8800); border: 3px solid #fff;
      border-radius: 40px; cursor: pointer; outline: none;
      box-shadow: 0 6px 0 #992200;
    `,l.textContent="กลับแผนที่",l.onclick=()=>{var o,m;const g=((o=this._gs)==null?void 0:o.score)??0;this._destroyUI(),(m=this.onGameEnd)==null||m.call(this,{score:g})},i.appendChild(l),s.appendChild(i),s}_initGame(){const s="/assets/boxing/",i=s+"images/",d=s+"sounds/",l=[{id:1,imgColor:`${i}ท่ามวยสี1.png`,imgShadow:`${i}ท่ามวยเงา1.png`,imgName:`${i}ป้าย11.png`},{id:2,imgColor:`${i}ท่ามวยสี2.png`,imgShadow:`${i}ท่ามวยเงา2.png`,imgName:`${i}ป้าย2.png`},{id:3,imgColor:`${i}ท่ามวยสี3.png`,imgShadow:`${i}ท่ามวยเงา3.png`,imgName:`${i}ป้าย3.png`},{id:4,imgColor:`${i}ท่ามวยสี4.png`,imgShadow:`${i}ท่ามวยเงา4.png`,imgName:`${i}ป้าย4.png`},{id:5,imgColor:`${i}ท่ามวยสี5.png`,imgShadow:`${i}ท่ามวยเงา5.png`,imgName:`${i}ป้าย6.png`}],g=[{id:99,imgName:`${i}ป้ายหลอก1.png`},{id:100,imgName:`${i}ป้ายหลอก2.png`}],o={score:0,timeLeft:20,playTime:15,isPlaying:!1,timerInterval:null,hasShuffledMidGame:!1};this._gs=o;const m=new Audio(`${d}npc_voice.mp3`),y=new Audio(`${d}321.mp3`),w=new Audio(`${d}start_go.mp3`),x=new Audio(`${d}bg_music.mp3`);x.loop=!0,x.volume=.4,this._bgMusic=x;const M=()=>{try{x.currentTime=0,x.play()}catch{}},L=()=>{try{x.pause(),x.currentTime=0}catch{}},k=e=>{if(e)try{e.pause(),e.currentTime=0,e.play()}catch{}},G="สวัสดีขอรับ! จำท่ามวยและชื่อให้แม่นภายใน 20 วินาที แล้วลากชื่อวางที่เงาให้ถูกนะ!";function A(e,t,n,a=!1){if(!t)return;t.textContent="",a&&k(m);let f=0;const c=()=>{f<e.length&&(t.textContent+=e[f++],setTimeout(c,n))};c()}const E=()=>document.getElementById("bg-board"),v=()=>document.getElementById("bg-deck"),C=()=>document.getElementById("bg-instruction");function T(e){const t=document.createElement("img");return t.src=e.imgName,t.className="bg-name-card",t.id=`bg-card-${e.id}`,t.dataset.id=e.id,t.draggable=!1,t.onerror=()=>{const n=document.createElement("div");n.className="bg-name-card bg-name-card-text",n.id=`bg-card-${e.id}`,n.dataset.id=e.id,n.textContent=`ท่าที่ ${e.id}`,t.replaceWith(n)},t.addEventListener("dragstart",n=>n.dataTransfer.setData("text",n.target.id)),t}function S(e){e.preventDefault()}function z(e){if(e.preventDefault(),!o.isPlaying)return;const t=e.dataTransfer.getData("text"),n=document.getElementById(t);if(!n)return;const a=e.target.closest(".bg-drop-zone")||e.target.closest("#bg-deck");a&&((a.id==="bg-deck"||a.children.length===0)&&a.appendChild(n),$())}function $(){let e=0;document.querySelectorAll(".bg-drop-zone").forEach(a=>{a.children.length>0&&e++});const t=document.getElementById("bg-placed-count"),n=document.getElementById("bg-progress-fill");t&&(t.textContent=e),n&&(n.style.width=`${e/5*100}%`),e===5&&o.isPlaying&&setTimeout(()=>B(!1),500)}function N(){const e=E();if(!e)return;e.innerHTML="",l.forEach(n=>{const a=document.createElement("div");a.className="bg-card-container",a.dataset.slotId=n.id;const f=document.createElement("div");f.className="bg-image-box";const c=document.createElement("img");c.src=n.imgShadow,c.id=`bg-img-display-${n.id}`,c.className="bg-real-img",f.appendChild(c);const r=document.createElement("div");r.className="bg-drop-zone",r.addEventListener("drop",z),r.addEventListener("dragover",S),a.appendChild(f),a.appendChild(r),e.appendChild(a)});const t=v();t&&(t.innerHTML="",t.style.display="none",t.addEventListener("drop",z),t.addEventListener("dragover",S)),A(G,document.getElementById("bg-npc-speech"),80,!0)}this._startGame=()=>{const e=document.getElementById("bg-start-screen");e&&(e.style.display="none");try{m.pause(),m.currentTime=0}catch{}j()};const u=e=>new Promise(t=>setTimeout(t,e));async function j(){const e=document.getElementById("bg-countdown-overlay"),t=document.getElementById("bg-countdown-text");e&&(e.style.display="flex"),k(y);for(let a=3;a>0;a--)t&&(t.textContent=a,t.style.animation="none",t.offsetWidth,t.style.animation="bg-count-bounce 0.5s ease-out forwards"),await u(1e3);t&&(t.textContent="เริ่ม!",t.style.animation="none",t.offsetWidth,t.style.animation="bg-count-bounce 0.5s ease-out forwards"),k(w),await u(800),e&&(e.style.display="none");const n=document.getElementById("bg-main");n&&n.classList.remove("bg-hidden"),M(),q()}function q(){l.forEach(e=>{const t=document.getElementById(`bg-img-display-${e.id}`);t&&(t.src=e.imgColor);const n=document.querySelector(`[data-slot-id="${e.id}"]`);if(!n)return;const a=n.querySelector(".bg-drop-zone");a.innerHTML="";const f=T(e);a.appendChild(f)}),P()}function P(){o.timeLeft=20;const e=document.getElementById("bg-timer");e&&(e.textContent=`เวลา:${o.timeLeft}`);const t=C();t&&(t.textContent="ช่วงจดจำ: จำรูปท่าและชื่อให้แม่น!",t.style.color="#ffd700"),o.timerInterval&&clearInterval(o.timerInterval),o.timerInterval=setInterval(()=>{o.timeLeft--;const n=document.getElementById("bg-timer");n&&(n.textContent=`เวลา:${o.timeLeft}`),o.timeLeft<=0&&(clearInterval(o.timerInterval),D())},1e3)}async function H(){const e=C();e&&(e.textContent="⚠️ ระวัง! ท่ามวยสลับตำแหน่ง!",e.style.filter="drop-shadow(0 0 10px #ff0000)");const t=E();if(!t)return;const n=Array.from(t.querySelectorAll(".bg-card-container"));t.style.animation="bg-shake 0.5s",await u(500),t.style.animation="",n.sort(()=>Math.random()-.5),n.forEach(a=>t.appendChild(a)),t.style.backgroundColor="rgba(255,255,255,0.3)",await u(100),t.style.backgroundColor="transparent",e&&(e.style.filter="")}async function D(){const e=C();e&&(e.textContent="กำลังสลับไพ่...");const t=E();if(!t)return;const n=Array.from(t.querySelectorAll(".bg-card-container"));n.forEach(r=>{const p=r.querySelector(".bg-drop-zone");p.style.opacity="0",p.innerHTML=""});const a=t.getBoundingClientRect(),f=a.left+a.width/2,c=a.top+a.height/2;n.forEach((r,p)=>{const b=r.getBoundingClientRect(),h=f-(b.left+b.width/2),_=c-(b.top+b.height/2),I=Math.random()*10-5;r.style.transition="transform 0.5s cubic-bezier(0.25,1,0.5,1)",r.style.zIndex=p+10,setTimeout(()=>{r.style.transform=`translate(${h}px,${_}px) rotate(${I}deg)`},p*150)}),await u(500+n.length*150),l.forEach(r=>{const p=document.getElementById(`bg-img-display-${r.id}`);p&&(p.src=r.imgShadow)}),n.forEach(r=>{r.style.transition="none",r.style.transform="",r.style.zIndex=""}),n.sort(()=>Math.random()-.5),n.forEach(r=>t.appendChild(r)),n.forEach(r=>{const p=r.getBoundingClientRect(),b=f-(p.left+p.width/2),h=c-(p.top+p.height/2);r.style.transform=`translate(${b}px,${h}px)`}),document.body.offsetHeight,n.forEach((r,p)=>{r.style.transition="transform 0.6s cubic-bezier(0.25,1,0.5,1)",r.querySelector(".bg-drop-zone").style.opacity="1",setTimeout(()=>{r.style.transform=""},p*150)}),await u(600+n.length*150),n.forEach(r=>{r.style.transition="",r.style.transform=""}),Y()}function Y(){o.isPlaying=!0,o.playTime=15;const e=C();e&&(e.textContent="ระวังป้ายหลอก! ลากป้ายที่ถูกต้องวางที่รูปเงา!",e.style.color="");const t=v();if(!t)return;t.style.display="flex",t.innerHTML="";const n=[...l,...g];n.sort(()=>Math.random()-.5),n.forEach(a=>{const f=T(a);f.draggable=!0,t.appendChild(f)}),$(),R()}function R(){o.timerInterval&&clearInterval(o.timerInterval),o.hasShuffledMidGame=!1;const e=document.getElementById("bg-timer");e&&(e.textContent=`เวลา:${o.playTime}`),o.timerInterval=setInterval(()=>{o.playTime--;const t=document.getElementById("bg-timer");t&&(t.textContent=`เวลา:${o.playTime}`),o.playTime===5&&!o.hasShuffledMidGame&&(H(),o.hasShuffledMidGame=!0),o.playTime<=0&&(clearInterval(o.timerInterval),B(!0))},1e3)}async function B(e=!1){var f;clearInterval(o.timerInterval),o.isPlaying=!1,L(),document.querySelectorAll(".bg-name-card").forEach(c=>c.draggable=!1);const t=document.querySelectorAll(".bg-card-container");let n=0;t.forEach(c=>{const r=parseInt(c.dataset.slotId),p=c.querySelector(".bg-drop-zone");let b=!1;p.children.length>0&&parseInt(p.children[0].dataset.id)===r&&(n+=10,b=!0),c.classList.remove("bg-correct-box","bg-wrong-box"),c.classList.add(b?"bg-correct-box":"bg-wrong-box");const h=c.querySelector(".bg-real-img"),_=l.find(I=>I.id===r);h&&_&&(h.src=_.imgColor)}),o.score=n;const a=document.getElementById("bg-score");a&&(a.textContent=`คะแนน:${n}`),(f=v())!=null&&f.style&&(v().style.display="none"),setTimeout(()=>{const c=document.getElementById("bg-result-modal"),r=document.getElementById("bg-final-score");c&&(c.style.display="flex"),r&&(r.textContent=n)},800)}N()}_getCSS(){return`
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
    `}_el(s,i={}){const d=document.createElement(s);return Object.entries(i).forEach(([l,g])=>{l==="style"?d.style.cssText=g:d.setAttribute(l,g)}),d}_destroyUI(){var s;if(this._bgMusic){try{this._bgMusic.pause()}catch{}this._bgMusic=null}(s=this._gs)!=null&&s.timerInterval&&clearInterval(this._gs.timerInterval),this._ui.forEach(i=>{try{i.remove()}catch{}}),this._ui=[]}}export{X as B};
