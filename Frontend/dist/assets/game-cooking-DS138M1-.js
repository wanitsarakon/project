import{P as D}from"./phaser-iZDVk5aZ.js";class q extends D.Scene{constructor(){super({key:"CookingGameScene"}),this._ui=[]}init(d={}){this.onGameEnd=d.onGameEnd??null,this.roomCode=d.roomCode??null,this.player=d.player??null,this.roundId=d.roundId??null}preload(){}create(){const{width:d,height:a}=this.scale;this.add.rectangle(d/2,a/2,d,a,1710592),this._buildOverlay(),this.events.once("shutdown",()=>this._destroyUI()),this.events.once("destroy",()=>this._destroyUI())}_buildOverlay(){const d="/cooking/",a=d+"images/",o=this._el("div",{id:"ck-overlay",style:`
        position: fixed; inset: 0; z-index: 200;
        font-family: 'Sarabun', sans-serif;
        background-image: url('${a}bg.png');
        background-size: cover; background-position: center;
        overflow: hidden; user-select: none;
      `}),l=this._el("style");l.textContent=this._getCSS(a),o.appendChild(l),o.appendChild(this._buildStartScreen(a));const f=this._el("div",{id:"ck-countdown-overlay"}),x=this._el("div",{id:"ck-countdown-text"});f.appendChild(x),o.appendChild(f),o.appendChild(this._buildResultScreen(a));const C=this._el("div",{id:"ck-timer",class:"ck-hidden"});C.textContent="เวลา: 45",o.appendChild(C);const v=this._el("div",{id:"ck-npc-area",class:"ck-npc-area"}),h=this._el("div",{class:"ck-speech-bubble"}),E=this._el("p",{id:"ck-npc-text"});E.textContent="รอก่อนนะหลาน...",h.appendChild(E);const n=this._el("img");n.src=`${a}ยาย.png`,n.className="ck-grandma",n.onerror=()=>{n.style.display="none"},v.appendChild(h),v.appendChild(n),o.appendChild(v);const u=this._el("img",{id:"ck-table-decor",class:"ck-table-decor"});u.src=`${a}table.png`,u.onerror=()=>{u.style.display="none"},o.appendChild(u);const y=this._el("div",{class:"ck-table-area",id:"ck-table-area"});o.appendChild(y);const c=this._el("div",{id:"ck-bowl",class:"ck-bowl-container"}),T=this._el("div",{id:"ck-stir-progress",class:"ck-hidden"});T.innerHTML='<div id="ck-stir-bar-bg"><div id="ck-stir-bar"></div></div>',c.appendChild(T);const I=this._el("div",{id:"ck-stir-hint",class:"ck-hidden ck-stir-hint"});I.innerHTML=`
      <div class="ck-stir-visual">
        <div class="ck-arrow ck-arrow-left">←</div>
        <div class="ck-mouse-icon">🖱️</div>
        <div class="ck-arrow ck-arrow-right">→</div>
      </div>
      <div class="ck-stir-msg">เลื่อนเมาส์ซ้าย-ขวาเพื่อผสม</div>
    `,c.appendChild(I);const _=this._el("img");_.src=`${a}ถ้วย copy.png`,_.className="ck-bowl-back",_.onerror=()=>{_.style.display="none"},c.appendChild(_);const S=this._el("div",{class:"ck-fill-wrapper"});Object.entries({"fill-bean":"ถั่วเหลือง_full.png","fill-sugar":"น้ำตาลทรายขาว.png","fill-coconut":"กะทิ_pour.png","fill-agar":"ผงวุ้น_pour.png","fill-color":"สีผสมอาหาร_pour.png","fill-water":"น้ำเปล่า_pour.png","fill-salt":"เกลือ_pour.png"}).forEach(([A,P])=>{const w=this._el("img");w.src=`${a}${P}`,w.id=`ck-${A}`,w.className="ck-filling-asset",w.onerror=()=>{w.style.display="none"},S.appendChild(w)}),c.appendChild(S);const b=this._el("img");b.src=`${a}ช้อน.png`,b.id="ck-spatula",b.className="ck-spatula ck-hidden",b.onerror=()=>{b.src=`${a}spatula.png`,b.onerror=()=>{b.style.display="none"}},c.appendChild(b);const L=this._el("img");L.src=`${a}ถ้วย.png`,L.className="ck-bowl-front",L.onerror=()=>{L.style.display="none"},c.appendChild(L);const B=this._el("p",{class:"ck-bowl-hint",id:"ck-bowl-hint"});B.textContent="ลากวัตถุดิบมาที่นี่",c.appendChild(B),o.appendChild(c),document.body.appendChild(o),this._ui.push(o),this._initGame(a,d)}_buildStartScreen(d){const a=this._el("div",{id:"ck-start-screen"});a.style.cssText=`
      position: absolute; inset: 0; display: flex;
      justify-content: center; align-items: center; z-index: 300;
      background: linear-gradient(180deg, rgba(13,8,6,0.18), rgba(13,8,6,0.52));
      backdrop-filter: blur(4px);
    `;const o=this._el("div",{class:"ck-banner-wrapper"}),l=this._el("img");l.src=`${d}ป้ายด่าน.png`,l.className="ck-stage-banner",l.onerror=()=>{l.style.display="none"},o.appendChild(l);const f=this._el("div",{class:"ck-banner-inner"}),x=this._el("button",{id:"ck-btn-start"});return x.textContent="เริ่มทำขนม",x.onclick=()=>this._startGame(),f.appendChild(x),o.appendChild(f),a.appendChild(o),a}_buildResultScreen(d){const a=this._el("div",{id:"ck-result-screen",class:"ck-hidden"});a.style.cssText=`
      position: absolute; inset: 0; display: none;
      justify-content: center; align-items: center; z-index: 400;
      background: linear-gradient(180deg, rgba(13,8,6,0.34), rgba(13,8,6,0.66));
      backdrop-filter: blur(4px);
    `;const o=this._el("div",{class:"ck-banner-wrapper"}),l=this._el("img");l.src=`${d}ป้ายด่าน2.png`,l.className="ck-result-banner",l.onerror=()=>{l.style.display="none"},o.appendChild(l);const f=this._el("div",{class:"ck-banner-inner"}),x=this._el("span",{id:"ck-total-score"});x.textContent="0",f.appendChild(x);const C=this._el("div",{id:"ck-result-note"});C.textContent="คุณยายจะชิมแล้วบอกผลให้นะ",C.style.cssText="margin-top:10px; max-width:320px; text-align:center; color:#5f2b00; font-weight:700; line-height:1.5;",f.appendChild(C);const v=this._el("button",{id:"ck-back-btn"});return v.textContent="กลับแผนที่",v.onclick=()=>{var E,n;const h=((E=this._gs)==null?void 0:E.score)??0;this._destroyUI(),(n=this.onGameEnd)==null||n.call(this,{score:h})},f.appendChild(v),o.appendChild(f),a.appendChild(o),a}_initGame(d,a){const o=a+"sounds/",l=["ถั่วเหลือง","น้ำตาลทรายขาว","กะทิ","ผงวุ้น","สีผสมอาหาร","น้ำเปล่า","เกลือ"],f={ถั่วเหลือง:"ck-fill-bean",น้ำตาลทรายขาว:"ck-fill-sugar",กะทิ:"ck-fill-coconut",ผงวุ้น:"ck-fill-agar",สีผสมอาหาร:"ck-fill-color",น้ำเปล่า:"ck-fill-water",เกลือ:"ck-fill-salt"},x=[{name:"ถั่วเหลือง",cls:"ck-green-bean",file:"ถั่วเหลือง.png"},{name:"น้ำตาลทรายขาว",cls:"ck-sugar",file:"น้ำตาลทรายขาว.png"},{name:"กะทิ",cls:"ck-coconut",file:"กะทิ.png"},{name:"ผงวุ้น",cls:"ck-agar",file:"ผงวุ้น.png"},{name:"สีผสมอาหาร",cls:"ck-color",file:"สีผสมอาหาร.png"},{name:"น้ำเปล่า",cls:"ck-water",file:"น้ำเปล่า.png"},{name:"เกลือ",cls:"ck-salt",file:"เกลือ.png"},{name:"palm_sugar",cls:"ck-decoy-1",file:"palm_sugar.png"},{name:"ไข่ไก่",cls:"ck-decoy-2",file:"ไข่ไก่.png"},{name:"น้ำเชื่อม",cls:"ck-decoy-3",file:"น้ำเชื่อม.png"},{name:"กลิ่นผลไม้",cls:"ck-decoy-4",file:"กลิ่นผลไม้.png"}],C=new Audio(`${o}count.mp3`),v=new Audio(`${o}start_game.mp3`),h=new Audio(`${o}bgm.mp3`);h.loop=!0,this._bgm=h;const E=e=>{try{e.pause(),e.currentTime=0,e.play()}catch{}},n={steps:[],isGameActive:!1,gameTimeLeft:45,gameInterval:null,isFinishing:!1,currentY:180,stirProgress:0,lastAngle:null,isStirringEnabled:!1,score:0};this._gs=n;const u=document.getElementById("ck-bowl"),y=document.getElementById("ck-npc-text"),c=y==null?void 0:y.parentElement,T=document.getElementById("ck-table-area");function I(e,t,i=50){return new Promise(r=>{if(!e){r();return}e.innerText="";let s=0;const p=()=>{s<t.length?(e.innerText+=t[s++],setTimeout(p,i)):r()};p()})}const _=(e,t)=>new Promise(i=>{c&&c.classList.remove("ck-hidden"),I(y,e,40).then(()=>setTimeout(i,t))});function S(){T&&(T.innerHTML="",x.forEach(e=>{const t=document.createElement("img");t.src=`${d}${e.file}`,t.className=`ck-ingredient ${e.cls}`,t.dataset.name=e.name,t.draggable=!0,t.onerror=()=>{t.style.display="none";const i=document.createElement("div");i.className=`ck-ingredient ${e.cls} ck-placeholder`,i.dataset.name=e.name,i.textContent=e.name,i.draggable=!0,i.addEventListener("dragstart",z),T.appendChild(i)},t.addEventListener("dragstart",z),T.appendChild(t)}))}function z(e){if(!n.isGameActive||n.isStirringEnabled){e.preventDefault();return}e.dataTransfer.setData("text/plain",e.target.dataset.name),e.dataTransfer.setData("srcId",e.target.id||""),window._ckDragSrc=e.target}u.addEventListener("dragover",e=>e.preventDefault()),u.addEventListener("drop",e=>{var $;if(e.preventDefault(),!n.isGameActive||n.isStirringEnabled)return;const t=e.dataTransfer.getData("text/plain"),i=window._ckDragSrc;if(!t||!i)return;n.steps.push(t),($=document.getElementById("ck-bowl-hint"))==null||$.classList.add("ck-hidden"),i.style.visibility="hidden";const r=i.getBoundingClientRect(),s=u.getBoundingClientRect(),p=document.createElement("div");p.className="ck-pouring-wrapper",p.style.cssText=`
        width:${r.width}px; height:${r.height}px;
        left:${s.left+s.width/2-r.width/2}px;
        top:${s.top-130}px;
      `,document.body.appendChild(p);const m=document.createElement("img");m.src=`${d}${t}.png`,m.className="ck-item-pouring",m.onerror=()=>{m.style.display="none"},p.appendChild(m);const k=L(t);let g;setTimeout(()=>{g=B(p,t,k,180)},400),setTimeout(()=>{g&&clearInterval(g),A(t)},1400),setTimeout(()=>{p.remove(),(n.steps.length===3||n.steps.length===7)&&P()},2500)});const b=e=>["กะทิ","น้ำเปล่า","สีผสมอาหาร","น้ำเชื่อม","ไข่ไก่","กลิ่นผลไม้"].includes(e);function L(e){return{ถั่วเหลือง:"#f3e18a",น้ำตาลทรายขาว:"#fff",กะทิ:"#fff",ผงวุ้น:"rgba(255,255,255,0.7)",สีผสมอาหาร:"#ff4d4d",น้ำเปล่า:"rgba(120,199,226,0.6)",เกลือ:"#eee",palm_sugar:"#f2efed",ไข่ไก่:"#FFD700",น้ำเชื่อม:"#FFFACD",กลิ่นผลไม้:"#FF69B4"}[e]||"#fff"}function B(e,t,i,r){const s=document.createElement("div");return s.className=b(t)?"ck-liquid-stream":"ck-powder-stream",s.style.cssText="position:absolute; left:calc(50% - 30px); top:35%; z-index:5;",e.appendChild(s),setInterval(()=>{if(b(t)){const m=document.createElement("div");m.className="ck-drop",m.style.cssText=`background:${i}; --ty:${r+25}px;`,s.appendChild(m),setTimeout(()=>m.remove(),1200)}else for(let m=0;m<4;m++){const k=document.createElement("div"),g=(Math.random()-.5)*60,$=r+Math.random()*40;k.className="ck-grain",k.style.cssText=`background:${i}; --tx:${g}px; --ty:${$}px;`,s.appendChild(k),setTimeout(()=>k.remove(),1e3)}},15)}function A(e){const t=f[e];if(!t)return;const i=document.getElementById(t);i&&(i.style.opacity="1",n.currentY-=20,n.currentY<45&&(n.currentY=45),i.style.transform=`translateY(${n.currentY}px)`)}function P(){var i,r,s;n.isStirringEnabled=!0,n.stirProgress=0;const e=document.getElementById("ck-stir-bar");e&&(e.style.height="0%"),(i=document.getElementById("ck-stir-progress"))==null||i.classList.remove("ck-hidden"),(r=document.getElementById("ck-spatula"))==null||r.classList.remove("ck-hidden"),(s=document.getElementById("ck-stir-hint"))==null||s.classList.remove("ck-hidden");const t=n.steps.length===3?"ใส่ครบสามอย่างแล้ว อย่าลืมคนผสมให้เข้ากันก่อนนะหลาน!":"รอบสุดท้ายแล้ว คนให้เนื้อเนียนเลยนะจ๊ะ ขนมจะได้สวยๆ";c&&c.classList.remove("ck-hidden"),I(y,t,40),u.addEventListener("mousemove",w)}function w(e){if(!n.isStirringEnabled||!n.isGameActive)return;const t=u.getBoundingClientRect(),i=t.left+t.width/2,r=t.top+t.height/2,s=e.clientX-i,p=e.clientY-r,m=Math.atan2(p,s),k=document.getElementById("ck-spatula");if(k){let g=Math.max(60,Math.min(180,e.clientX-t.left-40));k.style.left=g+"px",k.style.bottom=60-Math.abs(130-g)*.25+"px",k.style.transform=`rotate(${Math.max(-25,Math.min(25,s/4))}deg)`}if(n.lastAngle!==null){let g=m-n.lastAngle;g>Math.PI&&(g-=Math.PI*2),g<-Math.PI&&(g+=Math.PI*2),n.stirProgress+=Math.abs(g)*2.5;const $=document.getElementById("ck-stir-bar");$&&($.style.height=Math.min(n.stirProgress,100)+"%"),n.stirProgress>=100&&G()}n.lastAngle=m}function G(){var e,t,i;n.isStirringEnabled=!1,n.stirProgress=0,n.lastAngle=null,u.removeEventListener("mousemove",w),(e=document.getElementById("ck-stir-progress"))==null||e.classList.add("ck-hidden"),(t=document.getElementById("ck-spatula"))==null||t.classList.add("ck-hidden"),(i=document.getElementById("ck-stir-hint"))==null||i.classList.add("ck-hidden"),n.steps.length===3?(c&&c.classList.remove("ck-hidden"),I(y,"ดีมากหลาน! ผสมเข้ากันดีแล้ว ใส่ส่วนผสมที่เหลือต่อได้เลยจ่ะ",40).then(()=>setTimeout(()=>{c&&c.classList.add("ck-hidden")},2e3))):n.steps.length===7&&M(!1)}this._startGame=async()=>{var e,t;document.getElementById("ck-start-screen").style.display="none",n.steps=[],n.isFinishing=!1,n.gameTimeLeft=45,n.currentY=180,n.stirProgress=0,h.pause(),h.currentTime=0,(e=document.getElementById("ck-stir-hint"))==null||e.classList.add("ck-hidden"),document.querySelectorAll(".ck-filling-asset").forEach(i=>{i.style.opacity="0",i.style.transform="translateY(180px)"}),document.querySelectorAll(".ck-ingredient").forEach(i=>{i.style.visibility="visible"}),(t=document.getElementById("ck-bowl-hint"))==null||t.classList.remove("ck-hidden"),S(),c&&c.classList.remove("ck-hidden"),await _("มาหลาน... ยายจะบอกสูตรลูกชุบให้ฟังนะ ตั้งใจฟังล่ะ",2e3);for(let i=0;i<l.length;i++)await _(`ขั้นตอนที่ ${i+1}: ใส่ "${l[i]}"`,1e3);await _("ใส่ส่วนผสมแล้ว อย่าลืมคนให้เข้ากันตามที่ยายบอกด้วยนะหลาน... เริ่มได้!",2e3),c&&c.classList.add("ck-hidden"),await N(),Y()};function N(){return new Promise(e=>{const t=document.getElementById("ck-countdown-overlay"),i=document.getElementById("ck-countdown-text");t&&(t.style.display="flex");const r=[3,2,1,"เริ่ม!"];let s=0;const p=setInterval(()=>{if(s<r.length)i&&(i.innerText=r[s],i.style.animation="none",i.offsetWidth,i.style.animation="ck-count-bounce 0.5s ease-out forwards"),typeof r[s]=="number"?E(C):E(v),s++;else{clearInterval(p),t&&(t.style.display="none");try{h.play().catch(()=>{})}catch{}e()}},1e3)})}function Y(){n.isGameActive=!0;const e=document.getElementById("ck-timer");e&&(e.classList.remove("ck-hidden"),e.textContent=`เวลา: ${n.gameTimeLeft}`),n.gameInterval=setInterval(()=>{n.gameTimeLeft--,e&&(e.textContent=`เวลา: ${n.gameTimeLeft}`),n.gameTimeLeft<=0&&M(!0)},1e3)}function M(e){var t,i,r,s;n.isFinishing||(n.isFinishing=!0,n.isGameActive=!1,clearInterval(n.gameInterval),u.removeEventListener("mousemove",w),(t=document.getElementById("ck-timer"))==null||t.classList.add("ck-hidden"),(i=document.getElementById("ck-stir-progress"))==null||i.classList.add("ck-hidden"),(r=document.getElementById("ck-spatula"))==null||r.classList.add("ck-hidden"),(s=document.getElementById("ck-stir-hint"))==null||s.classList.add("ck-hidden"),setTimeout(()=>{c&&c.classList.remove("ck-hidden"),I(y,e?"หมดเวลาแล้วจ๊ะ! มัวแต่คนเพลินหรือเปล่านี่เรา":"ทำเสร็จแล้วรึ? ไหนยายดูซิว่าคนจนเนียนดีหรือยัง...",40).then(()=>setTimeout(F,1e3))},e?0:1e3))}function F(){let e=0,t=0;for(let s=0;s<l.length;s++)s<n.steps.length&&n.steps[s]===l[s]&&(e+=10,t++);t===l.length&&n.gameTimeLeft>0&&(e+=30),n.score=e;let i,r;t===l.length?(i=`โอ้โห! เก่งมากหลาน ทำถูกหมดทั้ง 7 ขั้นตอนเลย รับไป ${e} คะแนนเต็ม!`,r="ยอดเชฟลูกชุบ"):t>=4?(i=`ทำเสร็จแล้วจ้ะหลาน ได้ไป ${e} คะแนน... มีบางขั้นตอนที่สลับกันนะ`,r="พ่อครัวฝึกหัด"):(i=`ยายชิมแล้วรสชาติแปลกๆ นะหลาน... ได้ไป ${e} คะแนนจ้ะ`,r="ต้องพยายามอีกนิด"),I(y,i,40).then(()=>setTimeout(()=>j(e,r,i),1500))}function j(e,t,i){h.pause(),h.currentTime=0;const r=document.getElementById("ck-result-screen"),s=document.getElementById("ck-total-score"),p=document.getElementById("ck-result-note");c&&c.classList.remove("ck-hidden"),s&&(s.textContent=e),p&&(p.textContent=t?`${t} • ${i}`:"คุณยายบอกผลการทำขนมให้แล้ว"),r&&(r.classList.remove("ck-hidden"),r.style.display="flex")}}_getCSS(d){return`
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
        position: absolute; top: 10px; right: 20px; z-index: 10;
        background: rgba(0,0,0,0.6); color: #ffd700;
        font-size: 1.5rem; font-weight: 800; padding: 8px 20px; border-radius: 12px;
        border: 2px solid #ffd700;
      }

      /* ─── NPC ─── */
      .ck-npc-area {
        position: absolute; bottom: 0; left: 20px;
        display: flex; align-items: flex-end; gap: 10px; z-index: 5;
        pointer-events: none;
      }
      .ck-speech-bubble {
        background: white; border: 2px solid #555; border-radius: 14px;
        padding: 10px 16px; font-size: 1rem; font-weight: 700; color: #333;
        max-width: 260px; position: relative; margin-bottom: 60px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      }
      .ck-speech-bubble p { margin: 0; }
      .ck-grandma { width: 160px; height: auto; animation: ck-nudge 3s ease-in-out infinite; }
      @keyframes ck-nudge {
        0%,100% { transform: translateY(0); }
        50%      { transform: translateY(-10px); }
      }

      /* ─── Table Area ─── */
      .ck-table-area {
        position: absolute; bottom: 82px; left: 51%; transform: translateX(-50%);
        display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;
        max-width: 700px; z-index: 4; padding: 0 20px;
      }
      .ck-table-decor {
        position: absolute;
        bottom: 22px;
        left: 50%;
        transform: translateX(-50%);
        width: min(78vw, 800px);
        height: auto;
        z-index: 2;
        pointer-events: none;
        filter: drop-shadow(0 10px 20px rgba(0,0,0,0.35));
      }
      .ck-ingredient {
        width: 70px; height: 70px; object-fit: contain; cursor: grab;
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
        position: absolute; top: 52%; left: 58%; transform: translate(-50%, -50%);
        width: 300px; height: 300px; z-index: 4;
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
        position: absolute; bottom: 60px; left: 100px; width: 60px;
        z-index: 7; pointer-events: none;
        transition: left 0.1s, bottom 0.1s, transform 0.1s;
      }
      .ck-bowl-hint {
        position: absolute; bottom: 30px; width: 100%; text-align: center;
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
          bottom: 34px;
        }
        .ck-table-area {
          bottom: 94px;
          max-width: 90vw;
          gap: 6px;
        }
        .ck-ingredient,
        .ck-placeholder {
          width: 58px;
          height: 58px;
        }
      }
    `}_el(d,a={}){const o=document.createElement(d);return Object.entries(a).forEach(([l,f])=>{l==="style"?o.style.cssText=f:o.setAttribute(l,f)}),o}_destroyUI(){var d;if(this._bgm){try{this._bgm.pause()}catch{}this._bgm=null}(d=this._gs)!=null&&d.gameInterval&&clearInterval(this._gs.gameInterval),this._ui.forEach(a=>{try{a.remove()}catch{}}),this._ui=[]}}export{q as C};
