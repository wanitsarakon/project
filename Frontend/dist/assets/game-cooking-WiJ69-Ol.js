import{P as V}from"./phaser-iZDVk5aZ.js";class O extends V.Scene{constructor(){super({key:"CookingGameScene"}),this._ui=[]}init(p={}){this.onGameEnd=p.onGameEnd??null,this.roomCode=p.roomCode??null,this.player=p.player??null,this.roundId=p.roundId??null,this._audioCtx=null}preload(){}create(){const{width:p,height:r}=this.scale;this.add.rectangle(p/2,r/2,p,r,1710592),this._buildOverlay(),this.events.once("shutdown",()=>this._destroyUI()),this.events.once("destroy",()=>this._destroyUI())}_buildOverlay(){const p="/cooking/",r=p+"images/",o=this._el("div",{id:"ck-overlay",style:`
        position: fixed; inset: 0; z-index: 200;
        font-family: 'Sarabun', sans-serif;
        background-image: url('${r}bg.png');
        background-size: cover; background-position: center;
        overflow: hidden; user-select: none;
      `}),l=this._el("style");l.textContent=this._getCSS(r),o.appendChild(l),o.appendChild(this._buildStartScreen(r));const g=this._el("div",{id:"ck-countdown-overlay"}),w=this._el("div",{id:"ck-countdown-text"});g.appendChild(w),o.appendChild(g),o.appendChild(this._buildResultScreen(r));const E=this._el("div",{id:"ck-timer",class:"ck-hidden"});E.textContent="เวลา: 45",o.appendChild(E);const C=this._el("div",{id:"ck-npc-area",class:"ck-npc-area"}),S=this._el("div",{class:"ck-speech-bubble"}),f=this._el("p",{id:"ck-npc-text"});f.textContent="รอก่อนนะหลาน...",S.appendChild(f);const x=this._el("img");x.src=`${r}ยาย.png`,x.className="ck-grandma",x.onerror=()=>{x.style.display="none"},C.appendChild(S),C.appendChild(x),o.appendChild(C);const b=this._el("img",{id:"ck-table-decor",class:"ck-table-decor"});b.src=`${r}table.png`,b.onerror=()=>{b.style.display="none"},o.appendChild(b);const i=this._el("div",{class:"ck-table-area",id:"ck-table-area"});o.appendChild(i);const u=this._el("div",{id:"ck-bowl",class:"ck-bowl-container"}),k=this._el("div",{id:"ck-stir-progress",class:"ck-hidden"});k.innerHTML='<div id="ck-stir-bar-bg"><div id="ck-stir-bar"></div></div>',u.appendChild(k);const m=this._el("div",{id:"ck-stir-hint",class:"ck-hidden ck-stir-hint"});m.innerHTML=`
      <div class="ck-stir-visual">
        <div class="ck-arrow ck-arrow-left">←</div>
        <div class="ck-mouse-icon">🖱️</div>
        <div class="ck-arrow ck-arrow-right">→</div>
      </div>
      <div class="ck-stir-msg">เลื่อนเมาส์ซ้าย-ขวาเพื่อคนให้เข้ากัน</div>
    `,u.appendChild(m);const v=this._el("img");v.src=`${r}ถ้วย copy.png`,v.className="ck-bowl-back",v.onerror=()=>{v.style.display="none"},u.appendChild(v);const I=this._el("div",{class:"ck-fill-wrapper"});Object.entries({"fill-bean":"ถั่วเหลือง_full.png","fill-sugar":"น้ำตาลทรายขาว.png","fill-coconut":"กะทิ_pour.png","fill-agar":"ผงวุ้น_pour.png","fill-color":"สีผสมอาหาร_pour.png","fill-water":"น้ำเปล่า_pour.png","fill-salt":"เกลือ_pour.png"}).forEach(([A,P])=>{const L=this._el("img");L.src=`${r}${P}`,L.id=`ck-${A}`,L.className="ck-filling-asset",L.onerror=()=>{L.style.display="none"},I.appendChild(L)}),u.appendChild(I);const _=this._el("img");_.src=`${r}ช้อน.png`,_.id="ck-spatula",_.className="ck-spatula ck-hidden",_.onerror=()=>{_.src=`${r}spatula.png`,_.onerror=()=>{_.style.display="none"}},u.appendChild(_);const T=this._el("img");T.src=`${r}ถ้วย.png`,T.className="ck-bowl-front",T.onerror=()=>{T.style.display="none"},u.appendChild(T);const B=this._el("p",{class:"ck-bowl-hint",id:"ck-bowl-hint"});B.textContent="ลากวัตถุดิบมาที่นี่",u.appendChild(B),o.appendChild(u),document.body.appendChild(o),this._ui.push(o),this._initGame(r,p)}_buildStartScreen(p){const r=this._el("div",{id:"ck-start-screen"});r.style.cssText=`
      position: absolute; inset: 0; display: flex;
      justify-content: center; align-items: center; z-index: 300;
      background: linear-gradient(180deg, rgba(13,8,6,0.18), rgba(13,8,6,0.52));
      backdrop-filter: blur(4px);
    `;const o=this._el("div",{class:"ck-banner-wrapper"}),l=this._el("img");l.src=`${p}ป้ายด่าน.png`,l.className="ck-stage-banner",l.onerror=()=>{l.style.display="none"},o.appendChild(l);const g=this._el("div",{class:"ck-banner-inner"}),w=this._el("button",{id:"ck-btn-start"});return w.textContent="เริ่มทำขนม",w.onclick=()=>this._startGame(),g.appendChild(w),o.appendChild(g),r.appendChild(o),r}_buildResultScreen(p){const r=this._el("div",{id:"ck-result-screen",class:"ck-hidden"});r.style.cssText=`
      position: absolute; inset: 0; display: none;
      justify-content: center; align-items: center; z-index: 400;
      background: linear-gradient(180deg, rgba(13,8,6,0.34), rgba(13,8,6,0.66));
      backdrop-filter: blur(4px);
    `;const o=this._el("div",{class:"ck-banner-wrapper"}),l=this._el("img");l.src=`${p}ป้ายด่าน2.png`,l.className="ck-result-banner",l.onerror=()=>{l.style.display="none"},o.appendChild(l);const g=this._el("div",{class:"ck-banner-inner"}),w=this._el("span",{id:"ck-total-score"});w.textContent="0",g.appendChild(w);const E=this._el("div",{id:"ck-result-note"});E.textContent="คุณยายจะชิมแล้วบอกผลให้นะ",E.style.cssText="margin-top:10px; max-width:320px; text-align:center; color:#5f2b00; font-weight:700; line-height:1.5;",g.appendChild(E);const C=this._el("button",{id:"ck-back-btn"});return C.textContent="กลับแผนที่",C.onclick=()=>{var f,x;const S=((f=this._gs)==null?void 0:f.score)??0;this._destroyUI(),(x=this.onGameEnd)==null||x.call(this,{score:S})},g.appendChild(C),o.appendChild(g),r.appendChild(o),r}_initGame(p,r){const o=r+"sounds/",l=["bean","sugar","coconut","agar","color","water","salt"],g={bean:"ถั่วเหลือง",sugar:"น้ำตาลทรายขาว",coconut:"กะทิ",agar:"ผงวุ้น",color:"สีผสมอาหาร",water:"น้ำเปล่า",salt:"เกลือ"},w={bean:"ck-fill-bean",sugar:"ck-fill-sugar",coconut:"ck-fill-coconut",agar:"ck-fill-agar",color:"ck-fill-color",water:"ck-fill-water",salt:"ck-fill-salt"},E=[{name:"bean",cls:"ck-green-bean",file:"ถั่วเหลือง.png"},{name:"salt",cls:"ck-salt",file:"เกลือ.png"},{name:"coconut",cls:"ck-coconut",file:"กะทิ.png"},{name:"sugar",cls:"ck-sugar",file:"น้ำตาลทรายขาว.png"},{name:"agar",cls:"ck-agar",file:"ผงวุ้น.png"},{name:"color",cls:"ck-color",file:"สีผสมอาหาร.png"},{name:"water",cls:"ck-water",file:"น้ำเปล่า.png"}],C=new Audio(`${o}count.mp3`),S=new Audio(`${o}start_game.mp3`),f=new Audio(`${o}bgm.mp3`);f.loop=!0,this._bgm=f;const x=e=>{try{e.pause(),e.currentTime=0,e.play()}catch{}},b=e=>{try{const t=window.AudioContext||window.webkitAudioContext;if(!t)return;this._audioCtx||(this._audioCtx=new t);const n=this._audioCtx,a=n.currentTime,s=n.createOscillator(),d=n.createGain();s.connect(d),d.connect(n.destination);const c={drop:{type:"triangle",start:420,end:620,dur:.09,vol:.03},stir:{type:"sine",start:560,end:740,dur:.08,vol:.025},phase:{type:"triangle",start:680,end:920,dur:.16,vol:.04},success:{type:"sine",start:760,end:1120,dur:.24,vol:.05},fail:{type:"sawtooth",start:260,end:180,dur:.2,vol:.04}}[e];if(!c)return;s.type=c.type,s.frequency.setValueAtTime(c.start,a),s.frequency.exponentialRampToValueAtTime(c.end,a+c.dur),d.gain.setValueAtTime(1e-4,a),d.gain.exponentialRampToValueAtTime(c.vol,a+.012),d.gain.exponentialRampToValueAtTime(1e-4,a+c.dur),s.start(a),s.stop(a+c.dur+.02)}catch{}},i={steps:[],isGameActive:!1,gameTimeLeft:45,gameInterval:null,isFinishing:!1,currentY:180,stirProgress:0,lastAngle:null,isStirringEnabled:!1,score:0};this._gs=i;const u=document.getElementById("ck-bowl"),k=document.getElementById("ck-npc-text"),m=k==null?void 0:k.parentElement,v=document.getElementById("ck-table-area");function I(e,t,n=50){return new Promise(a=>{if(!e){a();return}e.innerText="";let s=0;const d=()=>{s<t.length?(e.innerText+=t[s++],setTimeout(d,n)):a()};d()})}const z=(e,t)=>new Promise(n=>{m&&m.classList.remove("ck-hidden"),I(k,e,40).then(()=>setTimeout(n,t))});function _(){v&&(v.innerHTML="",E.forEach(e=>{const t=document.createElement("img");t.src=`${p}${e.file}`,t.className=`ck-ingredient ${e.cls}`,t.dataset.name=e.name,t.draggable=!0,t.onerror=()=>{t.style.display="none";const n=document.createElement("div");n.className=`ck-ingredient ${e.cls} ck-placeholder`,n.dataset.name=e.name,n.textContent=g[e.name]||e.name,n.draggable=!0,n.addEventListener("dragstart",T),v.appendChild(n)},t.addEventListener("dragstart",T),v.appendChild(t)}))}function T(e){if(!i.isGameActive||i.isStirringEnabled){e.preventDefault();return}e.dataTransfer.setData("text/plain",e.target.dataset.name),e.dataTransfer.setData("srcId",e.target.id||""),window._ckDragSrc=e.target}u.addEventListener("dragover",e=>e.preventDefault()),u.addEventListener("drop",e=>{var $;if(e.preventDefault(),!i.isGameActive||i.isStirringEnabled)return;const t=e.dataTransfer.getData("text/plain"),n=window._ckDragSrc;if(!t||!n)return;i.steps.push(t),b("drop"),($=document.getElementById("ck-bowl-hint"))==null||$.classList.add("ck-hidden"),n.style.visibility="hidden";const a=n.getBoundingClientRect(),s=u.getBoundingClientRect(),d=document.createElement("div");d.className="ck-pouring-wrapper",d.style.cssText=`
        width:${a.width}px; height:${a.height}px;
        left:${s.left+s.width/2-a.width/2}px;
        top:${s.top-130}px;
      `,document.body.appendChild(d);const c=document.createElement("img");c.src=`${p}${g[t]||t}.png`,c.className="ck-item-pouring",c.onerror=()=>{c.style.display="none"},d.appendChild(c);const y=A(t);let h;setTimeout(()=>{h=P(d,t,y,180)},400),setTimeout(()=>{h&&clearInterval(h),L(t)},1400),setTimeout(()=>{d.remove(),(i.steps.length===3||i.steps.length===7)&&N()},2500)});const B=e=>["coconut","water","color"].includes(e);function A(e){return{bean:"#f3e18a",sugar:"#fff",coconut:"#fff",agar:"rgba(255,255,255,0.7)",color:"#ff4d4d",water:"rgba(120,199,226,0.6)",salt:"#eee"}[e]||"#fff"}function P(e,t,n,a){const s=document.createElement("div");return s.className=B(t)?"ck-liquid-stream":"ck-powder-stream",s.style.cssText="position:absolute; left:calc(50% - 30px); top:35%; z-index:5;",e.appendChild(s),setInterval(()=>{if(B(t)){const c=document.createElement("div");c.className="ck-drop",c.style.cssText=`background:${n}; --ty:${a+25}px;`,s.appendChild(c),setTimeout(()=>c.remove(),1200)}else for(let c=0;c<4;c++){const y=document.createElement("div"),h=(Math.random()-.5)*60,$=a+Math.random()*40;y.className="ck-grain",y.style.cssText=`background:${n}; --tx:${h}px; --ty:${$}px;`,s.appendChild(y),setTimeout(()=>y.remove(),1e3)}},15)}function L(e){const t=w[e];if(!t)return;const n=document.getElementById(t);n&&(n.style.opacity="1",i.currentY-=20,i.currentY<45&&(i.currentY=45),n.style.transform=`translateY(${i.currentY}px)`)}function N(){var n,a,s;i.isStirringEnabled=!0,i.stirProgress=0,b("phase");const e=document.getElementById("ck-stir-bar");e&&(e.style.height="0%"),(n=document.getElementById("ck-stir-progress"))==null||n.classList.remove("ck-hidden"),(a=document.getElementById("ck-spatula"))==null||a.classList.remove("ck-hidden"),(s=document.getElementById("ck-stir-hint"))==null||s.classList.remove("ck-hidden");const t=i.steps.length===3?"ใส่ครบสามอย่างแล้ว อย่าลืมคนผสมให้เข้ากันก่อนนะหลาน!":"รอบสุดท้ายแล้ว คนให้เนื้อเนียนเลยนะจ๊ะ ขนมจะได้สวยๆ";m&&m.classList.remove("ck-hidden"),I(k,t,40),u.addEventListener("mousemove",M)}function M(e){if(!i.isStirringEnabled||!i.isGameActive)return;const t=u.getBoundingClientRect(),n=t.left+t.width/2,a=t.top+t.height/2,s=e.clientX-n,d=e.clientY-a,c=Math.atan2(d,s),y=document.getElementById("ck-spatula");if(y){let h=Math.max(60,Math.min(180,e.clientX-t.left-40));y.style.left=h+"px",y.style.bottom=60-Math.abs(130-h)*.25+"px",y.style.transform=`rotate(${Math.max(-25,Math.min(25,s/4))}deg)`}if(i.lastAngle!==null){let h=c-i.lastAngle;h>Math.PI&&(h-=Math.PI*2),h<-Math.PI&&(h+=Math.PI*2),i.stirProgress+=Math.abs(h)*2.5,Math.floor(i.stirProgress)%18===0&&b("stir");const $=document.getElementById("ck-stir-bar");$&&($.style.height=Math.min(i.stirProgress,100)+"%"),i.stirProgress>=100&&Y()}i.lastAngle=c}function Y(){var e,t,n;i.isStirringEnabled=!1,i.stirProgress=0,i.lastAngle=null,b("phase"),u.removeEventListener("mousemove",M),(e=document.getElementById("ck-stir-progress"))==null||e.classList.add("ck-hidden"),(t=document.getElementById("ck-spatula"))==null||t.classList.add("ck-hidden"),(n=document.getElementById("ck-stir-hint"))==null||n.classList.add("ck-hidden"),i.steps.length===3?(m&&m.classList.remove("ck-hidden"),I(k,"ดีมากหลาน! ผสมเข้ากันดีแล้ว ใส่ส่วนผสมที่เหลือต่อได้เลยจ่ะ",40).then(()=>setTimeout(()=>{m&&m.classList.add("ck-hidden")},2e3))):i.steps.length===7&&G(!1)}this._startGame=async()=>{var e,t;document.getElementById("ck-start-screen").style.display="none",i.steps=[],i.isFinishing=!1,i.gameTimeLeft=45,i.currentY=180,i.stirProgress=0,f.pause(),f.currentTime=0,(e=document.getElementById("ck-stir-hint"))==null||e.classList.add("ck-hidden"),document.querySelectorAll(".ck-filling-asset").forEach(n=>{n.style.opacity="0",n.style.transform="translateY(180px)"}),document.querySelectorAll(".ck-ingredient").forEach(n=>{n.style.visibility="visible"}),(t=document.getElementById("ck-bowl-hint"))==null||t.classList.remove("ck-hidden"),_(),m&&m.classList.remove("ck-hidden"),await z("มาหลาน... ยายจะบอกสูตรลูกชุบให้ฟังนะ ตั้งใจฟังล่ะ",2e3);for(let n=0;n<l.length;n++)await z(`?????????? ${n+1}: ??? "${g[l[n]]}"`,1e3);await z("ใส่ส่วนผสมแล้ว อย่าลืมคนให้เข้ากันตามที่ยายบอกด้วยนะหลาน... เริ่มได้!",2e3),m&&m.classList.add("ck-hidden"),await R(),j()};function R(){return new Promise(e=>{const t=document.getElementById("ck-countdown-overlay"),n=document.getElementById("ck-countdown-text");t&&(t.style.display="flex");const a=[3,2,1,"เริ่ม!"];let s=0;const d=setInterval(()=>{if(s<a.length)n&&(n.innerText=a[s],n.style.animation="none",n.offsetWidth,n.style.animation="ck-count-bounce 0.5s ease-out forwards"),typeof a[s]=="number"?x(C):x(S),s++;else{clearInterval(d),t&&(t.style.display="none");try{f.play().catch(()=>{})}catch{}e()}},1e3)})}function j(){i.isGameActive=!0;const e=document.getElementById("ck-timer");e&&(e.classList.remove("ck-hidden"),e.textContent=`เวลา: ${i.gameTimeLeft}`),i.gameInterval=setInterval(()=>{i.gameTimeLeft--,e&&(e.textContent=`เวลา: ${i.gameTimeLeft}`),i.gameTimeLeft<=0&&G(!0)},1e3)}function G(e){var t,n,a,s;i.isFinishing||(i.isFinishing=!0,i.isGameActive=!1,clearInterval(i.gameInterval),u.removeEventListener("mousemove",M),(t=document.getElementById("ck-timer"))==null||t.classList.add("ck-hidden"),(n=document.getElementById("ck-stir-progress"))==null||n.classList.add("ck-hidden"),(a=document.getElementById("ck-spatula"))==null||a.classList.add("ck-hidden"),(s=document.getElementById("ck-stir-hint"))==null||s.classList.add("ck-hidden"),setTimeout(()=>{m&&m.classList.remove("ck-hidden"),b(e?"fail":"success"),I(k,e?"หมดเวลาแล้วจ๊ะ! มัวแต่คนเพลินหรือเปล่านี่เรา":"ทำเสร็จแล้วรึ? ไหนยายดูซิว่าคนจนเนียนดีหรือยัง...",40).then(()=>setTimeout(D,1e3))},e?0:1e3))}function D(){let e=0,t=0;for(let s=0;s<l.length;s++)s<i.steps.length&&i.steps[s]===l[s]&&(e+=10,t++);t===l.length&&i.gameTimeLeft>0&&(e+=30),i.score=e;let n,a;t===l.length?(b("success"),n=`โอ้โห! เก่งมากหลาน ทำถูกหมดทั้ง 7 ขั้นตอนเลย รับไป ${e} คะแนนเต็ม!`,a="ยอดเชฟลูกชุบ"):t>=4?(b("phase"),n=`ทำเสร็จแล้วจ้ะหลาน ได้ไป ${e} คะแนน... มีบางขั้นตอนที่สลับกันนะ`,a="พ่อครัวฝึกหัด"):(b("fail"),n=`ยายชิมแล้วรสชาติแปลกๆ นะหลาน... ได้ไป ${e} คะแนนจ้ะ`,a="ต้องพยายามอีกนิด"),I(k,n,40).then(()=>setTimeout(()=>q(e,a,n),1500))}function q(e,t,n){f.pause(),f.currentTime=0;const a=document.getElementById("ck-result-screen"),s=document.getElementById("ck-total-score"),d=document.getElementById("ck-result-note");m&&m.classList.remove("ck-hidden"),s&&(s.textContent=e),d&&(d.textContent=t?`${t} • ${n}`:"คุณยายบอกผลการทำขนมให้แล้ว"),a&&(a.classList.remove("ck-hidden"),a.style.display="flex")}}_getCSS(p){return`
      @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700;800&display=swap');

      .ck-hidden { display: none !important; }

      /* ─── Countdown ─── */
      #ck-countdown-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.5);
        display: none; justify-content: center; align-items: center; z-index: 600;
      }
      #ck-countdown-text {
        color: #f1c40f; font-size: 200px; font-weight: 900;
        font-family: 'Sarabun', sans-serif; text-shadow: 8px 8px 0 #000;
        pointer-events: none;
        animation: ck-count-bounce 0.5s ease-out forwards;
      }
      @keyframes ck-count-bounce {
        0%   { transform: scale(0.5); opacity: 0; }
        50%  { transform: scale(1.2); opacity: 1; }
        100% { transform: scale(1);   opacity: 1; }
      }

      /* ─── Timer ─── */
      #ck-timer {
        position: absolute; top: 16px; left: 18px; z-index: 10;
        background: linear-gradient(180deg, rgba(51,19,4,0.9), rgba(102,46,8,0.88));
        color: #ffe4a8;
        font-size: 1.55rem; font-weight: 800; padding: 10px 22px; border-radius: 14px;
        border: 2px solid rgba(255,215,120,0.85);
        box-shadow: 0 10px 18px rgba(0,0,0,0.28);
      }

      /* ─── NPC ─── */
      .ck-npc-area {
        position: absolute; bottom: 118px; right: 26px;
        display: flex; align-items: flex-end; gap: 10px; z-index: 5;
        pointer-events: none;
        flex-direction: row-reverse;
      }
      .ck-speech-bubble {
        background: white; border: 2px solid #555; border-radius: 16px;
        padding: 12px 18px; font-size: 1rem; font-weight: 700; color: #333;
        max-width: 190px; position: relative; margin-bottom: 98px;
        box-shadow: 0 8px 18px rgba(0,0,0,0.28);
      }
      .ck-speech-bubble p { margin: 0; }
      .ck-grandma { width: 138px; height: auto; animation: ck-nudge 3s ease-in-out infinite; }
      @keyframes ck-nudge {
        0%,100% { transform: translateY(0); }
        50%      { transform: translateY(-10px); }
      }

      /* ─── Table Area ─── */
      .ck-table-area {
        position: absolute; bottom: 90px; left: 50%; transform: translateX(-50%);
        display: flex; flex-wrap: nowrap; justify-content: center; gap: 18px;
        max-width: 760px; z-index: 4; padding: 0 48px; width: min(78vw, 780px);
      }
      .ck-table-decor {
        position: absolute;
        bottom: 8px;
        left: 50%;
        transform: translateX(-50%);
        width: min(88vw, 980px);
        height: auto;
        z-index: 2;
        pointer-events: none;
        filter: drop-shadow(0 10px 20px rgba(0,0,0,0.35));
      }
      .ck-ingredient {
        width: 52px; height: 52px; object-fit: contain; cursor: grab;
        filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));
        transition: transform 0.15s;
      }
      .ck-ingredient:hover { transform: scale(1.1); }
      .ck-placeholder {
        width: 70px; height: 70px; background: rgba(200,150,50,0.8);
        border: 2px solid #ffd700; border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.65rem; font-weight: 800; color: #fff;
        text-align: center; cursor: grab; padding: 4px; box-sizing: border-box;
      }

      /* ─── Bowl ─── */
      .ck-bowl-container {
        position: absolute; top: 43%; left: 50%; transform: translate(-50%, -50%);
        width: 270px; height: 228px; z-index: 4;
      }
      .ck-bowl-back, .ck-bowl-front {
        position: absolute; width: 100%; bottom: 0; z-index: 2;
      }
      .ck-bowl-front { z-index: 6; }
      .ck-fill-wrapper {
        position: absolute; width: 100%; height: 100%;
        display: flex; align-items: flex-end; justify-content: center;
        z-index: 3; overflow: hidden; bottom: 0;
      }
      .ck-filling-asset {
        position: absolute; bottom: 0; width: 80%; opacity: 0;
        transition: opacity 0.5s, transform 0.5s;
      }
      .ck-spatula {
        position: absolute; bottom: 60px; left: 104px; width: 58px;
        z-index: 7; pointer-events: none;
        transition: left 0.1s, bottom 0.1s, transform 0.1s;
      }
      .ck-bowl-hint {
        position: absolute; bottom: 34px; width: 100%; text-align: center;
        color: rgba(255,255,255,0.8); font-size: 0.9rem; font-weight: 700;
        z-index: 8; pointer-events: none; text-shadow: 1px 1px 3px #000;
      }

      /* ─── Stir UI ─── */
      #ck-stir-progress {
        position: absolute; top: 10px; left: 50%; transform: translateX(-50%); z-index: 10;
      }
      #ck-stir-bar-bg {
        width: 20px; height: 120px; background: rgba(0,0,0,0.4);
        border: 2px solid #ffd700; border-radius: 20px; overflow: hidden;
      }
      #ck-stir-bar {
        position: absolute; bottom: 0; width: 100%; height: 0%;
        background: linear-gradient(to top, #00ff88, #ffff00, #ff0055);
        transition: height 0.05s; border-radius: 0 0 20px 20px;
      }
      .ck-stir-hint {
        position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
        background: rgba(0,0,0,0.7); border-radius: 10px; padding: 6px 12px;
        color: white; font-size: 0.8rem; text-align: center; z-index: 10;
        white-space: nowrap;
      }
      .ck-stir-visual { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
      .ck-arrow { font-size: 1.2rem; color: #00ff88; }
      .ck-mouse-icon { font-size: 1.3rem; }

      /* ─── Pour animation ─── */
      .ck-pouring-wrapper {
        position: fixed; z-index: 500; pointer-events: none;
      }
      .ck-item-pouring {
        width: 100%; height: 100%; object-fit: contain;
        animation: ck-pour-fall 0.4s ease-in forwards;
        animation-delay: 0s;
      }
      @keyframes ck-pour-fall {
        0%   { transform: translateY(-20px) rotate(-15deg); opacity: 1; }
        100% { transform: translateY(0px) rotate(0deg); opacity: 1; }
      }
      .ck-liquid-stream, .ck-powder-stream {
        position: absolute; width: 20px;
      }
      .ck-drop {
        position: absolute; width: 8px; border-radius: 50%;
        animation: ck-drop-fall 1.2s ease-in forwards;
        --ty: 200px;
        height: 12px;
      }
      @keyframes ck-drop-fall {
        0%   { transform: translateY(0); opacity: 1; height: 12px; }
        100% { transform: translateY(var(--ty)); opacity: 0.3; height: 30px; }
      }
      .ck-grain {
        position: absolute; width: 4px; height: 4px; border-radius: 50%;
        animation: ck-grain-fall 1s ease-in forwards;
        --tx: 0px; --ty: 100px;
      }
      @keyframes ck-grain-fall {
        0%   { transform: translate(0,0); opacity: 1; }
        100% { transform: translate(var(--tx), var(--ty)); opacity: 0; }
      }

      /* ─── Start/Result banner ─── */
      .ck-banner-wrapper {
        position: relative; display: flex; justify-content: center; align-items: center;
      }
      .ck-stage-banner {
        width: 700px; max-width: 90vw; height: auto;
        filter: drop-shadow(0 15px 30px rgba(0,0,0,0.6));
      }
      .ck-result-banner {
        width: 700px; max-width: 90vw; height: auto;
        filter: drop-shadow(0 15px 40px rgba(0,0,0,0.7));
      }
      .ck-banner-inner {
        position: absolute; display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        top: 50%; left: 50%; transform: translate(-50%, -50%);
      }

      #ck-btn-start, #ck-back-btn {
        margin-top: 100px;
        padding: 15px 40px; font-size: 1.6rem; font-family: 'Sarabun', sans-serif;
        font-weight: 800; color: white;
        background: linear-gradient(180deg,#ffcc00,#ff8800 50%,#ff4400);
        border: 4px solid #fff; border-radius: 50px; cursor: pointer;
        box-shadow: 0 8px 0 #992200, 0 15px 20px rgba(0,0,0,0.5);
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5); outline: none;
      }
      #ck-back-btn { margin-top: 20px; font-size: 1.2rem; padding: 12px 32px; }

      #ck-total-score {
        font-size: 7rem; font-family: 'Sarabun', sans-serif; font-weight: 900;
        background: linear-gradient(180deg,#fff 30%,#ffd700 60%,#ff8c00 100%);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        filter: drop-shadow(6px 6px 0 #632b00);
        animation: ck-score-pop 0.6s cubic-bezier(0.175,0.885,0.32,1.275) forwards;
      }
      @keyframes ck-score-pop {
        0%   { transform: scale(0); opacity: 0; }
        80%  { transform: scale(1.1); }
        100% { transform: scale(1); opacity: 1; }
      }

      @media (max-width: 900px) {
        .ck-table-decor {
          width: min(90vw, 740px);
          bottom: 18px;
        }
        .ck-table-area {
          bottom: 98px;
          max-width: 90vw;
          gap: 6px;
          flex-wrap: wrap;
        }
        .ck-ingredient,
        .ck-placeholder {
          width: 58px;
          height: 58px;
        }
        .ck-npc-area {
          right: 14px;
          bottom: 118px;
        }
        .ck-speech-bubble {
          max-width: 190px;
          margin-bottom: 96px;
        }
        .ck-bowl-container {
          width: 248px;
          height: 220px;
          top: 38%;
        }
      }
    `}_el(p,r={}){const o=document.createElement(p);return Object.entries(r).forEach(([l,g])=>{l==="style"?o.style.cssText=g:o.setAttribute(l,g)}),o}_destroyUI(){var p;if(this._bgm){try{this._bgm.pause()}catch{}this._bgm=null}(p=this._gs)!=null&&p.gameInterval&&clearInterval(this._gs.gameInterval),this._ui.forEach(r=>{try{r.remove()}catch{}}),this._ui=[]}}export{O as C};
