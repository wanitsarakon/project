import{P as D}from"./phaser-iZDVk5aZ.js";class q extends D.Scene{constructor(){super({key:"CookingGameScene"}),this._ui=[]}init(l={}){this.onGameEnd=l.onGameEnd??null,this.roomCode=l.roomCode??null,this.player=l.player??null,this.roundId=l.roundId??null}preload(){}create(){const{width:l,height:s}=this.scale;this.add.rectangle(l/2,s/2,l,s,1710592),this._buildOverlay(),this.events.once("shutdown",()=>this._destroyUI()),this.events.once("destroy",()=>this._destroyUI())}_buildOverlay(){const l="/cooking/",s=l+"images/",a=this._el("div",{id:"ck-overlay",style:`
        position: fixed; inset: 0; z-index: 200;
        font-family: 'Sarabun', sans-serif;
        background-image: url('${s}bg.png');
        background-size: cover; background-position: center;
        overflow: hidden; user-select: none;
      `}),c=this._el("style");c.textContent=this._getCSS(s),a.appendChild(c),a.appendChild(this._buildStartScreen(s));const f=this._el("div",{id:"ck-countdown-overlay"}),x=this._el("div",{id:"ck-countdown-text"});f.appendChild(x),a.appendChild(f),a.appendChild(this._buildResultScreen(s));const _=this._el("div",{id:"ck-timer",class:"ck-hidden"});_.textContent="เวลา: 45",a.appendChild(_);const I=this._el("div",{id:"ck-npc-area",class:"ck-npc-area"}),h=this._el("div",{class:"ck-speech-bubble"}),C=this._el("p",{id:"ck-npc-text"});C.textContent="รอก่อนนะหลาน...",h.appendChild(C);const i=this._el("img");i.src=`${s}ยาย.png`,i.className="ck-grandma",i.onerror=()=>{i.style.display="none"},I.appendChild(h),I.appendChild(i),a.appendChild(I);const u=this._el("img",{id:"ck-table-decor",class:"ck-table-decor"});u.src=`${s}table.png`,u.onerror=()=>{u.style.display="none"},a.appendChild(u);const y=this._el("div",{class:"ck-table-area",id:"ck-table-area"});a.appendChild(y);const d=this._el("div",{id:"ck-bowl",class:"ck-bowl-container"}),T=this._el("div",{id:"ck-stir-progress",class:"ck-hidden"});T.innerHTML='<div id="ck-stir-bar-bg"><div id="ck-stir-bar"></div></div>',d.appendChild(T);const E=this._el("div",{id:"ck-stir-hint",class:"ck-hidden ck-stir-hint"});E.innerHTML=`
      <div class="ck-stir-visual">
        <div class="ck-arrow ck-arrow-left">←</div>
        <div class="ck-mouse-icon">🖱️</div>
        <div class="ck-arrow ck-arrow-right">→</div>
      </div>
      <div class="ck-stir-msg">เลื่อนเมาส์ซ้าย-ขวาเพื่อผสม</div>
    `,d.appendChild(E);const v=this._el("img");v.src=`${s}ถ้วย copy.png`,v.className="ck-bowl-back",v.onerror=()=>{v.style.display="none"},d.appendChild(v);const $=this._el("div",{class:"ck-fill-wrapper"});Object.entries({"fill-bean":"ถั่วเหลือง_full.png","fill-sugar":"น้ำตาลทรายขาว.png","fill-coconut":"กะทิ_pour.png","fill-agar":"ผงวุ้น_pour.png","fill-color":"สีผสมอาหาร_pour.png","fill-water":"น้ำเปล่า_pour.png","fill-salt":"เกลือ_pour.png"}).forEach(([A,P])=>{const w=this._el("img");w.src=`${s}${P}`,w.id=`ck-${A}`,w.className="ck-filling-asset",w.onerror=()=>{w.style.display="none"},$.appendChild(w)}),d.appendChild($);const k=this._el("img");k.src=`${s}ช้อน.png`,k.id="ck-spatula",k.className="ck-spatula ck-hidden",k.onerror=()=>{k.src=`${s}spatula.png`,k.onerror=()=>{k.style.display="none"}},d.appendChild(k);const L=this._el("img");L.src=`${s}ถ้วย.png`,L.className="ck-bowl-front",L.onerror=()=>{L.style.display="none"},d.appendChild(L);const B=this._el("p",{class:"ck-bowl-hint",id:"ck-bowl-hint"});B.textContent="ลากวัตถุดิบมาที่นี่",d.appendChild(B),a.appendChild(d),document.body.appendChild(a),this._ui.push(a),this._initGame(s,l)}_buildStartScreen(l){const s=this._el("div",{id:"ck-start-screen"});s.style.cssText=`
      position: absolute; inset: 0; display: flex;
      justify-content: center; align-items: center; z-index: 300;
    `;const a=this._el("div",{class:"ck-banner-wrapper"}),c=this._el("img");c.src=`${l}ป้ายด่าน.png`,c.className="ck-stage-banner",c.onerror=()=>{c.style.display="none"},a.appendChild(c);const f=this._el("div",{class:"ck-banner-inner"}),x=this._el("button",{id:"ck-btn-start"});return x.textContent="เริ่มทำขนม",x.onclick=()=>this._startGame(),f.appendChild(x),a.appendChild(f),s.appendChild(a),s}_buildResultScreen(l){const s=this._el("div",{id:"ck-result-screen",class:"ck-hidden"});s.style.cssText=`
      position: absolute; inset: 0; display: none;
      justify-content: center; align-items: center; z-index: 400;
    `;const a=this._el("div",{class:"ck-banner-wrapper"}),c=this._el("img");c.src=`${l}ป้ายด่าน2.png`,c.className="ck-result-banner",c.onerror=()=>{c.style.display="none"},a.appendChild(c);const f=this._el("div",{class:"ck-banner-inner"}),x=this._el("span",{id:"ck-total-score"});x.textContent="0",f.appendChild(x);const _=this._el("button",{id:"ck-back-btn"});return _.textContent="กลับแผนที่",_.onclick=()=>{var h,C;const I=((h=this._gs)==null?void 0:h.score)??0;this._destroyUI(),(C=this.onGameEnd)==null||C.call(this,{score:I})},f.appendChild(_),a.appendChild(f),s.appendChild(a),s}_initGame(l,s){const a=s+"sounds/",c=["ถั่วเหลือง","น้ำตาลทรายขาว","กะทิ","ผงวุ้น","สีผสมอาหาร","น้ำเปล่า","เกลือ"],f={ถั่วเหลือง:"ck-fill-bean",น้ำตาลทรายขาว:"ck-fill-sugar",กะทิ:"ck-fill-coconut",ผงวุ้น:"ck-fill-agar",สีผสมอาหาร:"ck-fill-color",น้ำเปล่า:"ck-fill-water",เกลือ:"ck-fill-salt"},x=[{name:"ถั่วเหลือง",cls:"ck-green-bean",file:"ถั่วเหลือง.png"},{name:"น้ำตาลทรายขาว",cls:"ck-sugar",file:"น้ำตาลทรายขาว.png"},{name:"กะทิ",cls:"ck-coconut",file:"กะทิ.png"},{name:"ผงวุ้น",cls:"ck-agar",file:"ผงวุ้น.png"},{name:"สีผสมอาหาร",cls:"ck-color",file:"สีผสมอาหาร.png"},{name:"น้ำเปล่า",cls:"ck-water",file:"น้ำเปล่า.png"},{name:"เกลือ",cls:"ck-salt",file:"เกลือ.png"},{name:"palm_sugar",cls:"ck-decoy-1",file:"palm_sugar.png"},{name:"ไข่ไก่",cls:"ck-decoy-2",file:"ไข่ไก่.png"},{name:"น้ำเชื่อม",cls:"ck-decoy-3",file:"น้ำเชื่อม.png"},{name:"กลิ่นผลไม้",cls:"ck-decoy-4",file:"กลิ่นผลไม้.png"}],_=new Audio(`${a}count.mp3`),I=new Audio(`${a}start_game.mp3`),h=new Audio(`${a}bgm.mp3`);h.loop=!0,this._bgm=h;const C=e=>{try{e.pause(),e.currentTime=0,e.play()}catch{}},i={steps:[],isGameActive:!1,gameTimeLeft:45,gameInterval:null,isFinishing:!1,currentY:180,stirProgress:0,lastAngle:null,isStirringEnabled:!1,score:0};this._gs=i;const u=document.getElementById("ck-bowl"),y=document.getElementById("ck-npc-text"),d=y==null?void 0:y.parentElement,T=document.getElementById("ck-table-area");function E(e,t,n=50){return new Promise(r=>{if(!e){r();return}e.innerText="";let o=0;const m=()=>{o<t.length?(e.innerText+=t[o++],setTimeout(m,n)):r()};m()})}const v=(e,t)=>new Promise(n=>{d&&d.classList.remove("ck-hidden"),E(y,e,40).then(()=>setTimeout(n,t))});function $(){T&&(T.innerHTML="",x.forEach(e=>{const t=document.createElement("img");t.src=`${l}${e.file}`,t.className=`ck-ingredient ${e.cls}`,t.dataset.name=e.name,t.draggable=!0,t.onerror=()=>{t.style.display="none";const n=document.createElement("div");n.className=`ck-ingredient ${e.cls} ck-placeholder`,n.dataset.name=e.name,n.textContent=e.name,n.draggable=!0,n.addEventListener("dragstart",z),T.appendChild(n)},t.addEventListener("dragstart",z),T.appendChild(t)}))}function z(e){if(!i.isGameActive||i.isStirringEnabled){e.preventDefault();return}e.dataTransfer.setData("text/plain",e.target.dataset.name),e.dataTransfer.setData("srcId",e.target.id||""),window._ckDragSrc=e.target}u.addEventListener("dragover",e=>e.preventDefault()),u.addEventListener("drop",e=>{var S;if(e.preventDefault(),!i.isGameActive||i.isStirringEnabled)return;const t=e.dataTransfer.getData("text/plain"),n=window._ckDragSrc;if(!t||!n)return;i.steps.push(t),(S=document.getElementById("ck-bowl-hint"))==null||S.classList.add("ck-hidden"),n.style.visibility="hidden";const r=n.getBoundingClientRect(),o=u.getBoundingClientRect(),m=document.createElement("div");m.className="ck-pouring-wrapper",m.style.cssText=`
        width:${r.width}px; height:${r.height}px;
        left:${o.left+o.width/2-r.width/2}px;
        top:${o.top-130}px;
      `,document.body.appendChild(m);const p=document.createElement("img");p.src=`${l}${t}.png`,p.className="ck-item-pouring",p.onerror=()=>{p.style.display="none"},m.appendChild(p);const b=L(t);let g;setTimeout(()=>{g=B(m,t,b,180)},400),setTimeout(()=>{g&&clearInterval(g),A(t)},1400),setTimeout(()=>{m.remove(),(i.steps.length===3||i.steps.length===7)&&P()},2500)});const k=e=>["กะทิ","น้ำเปล่า","สีผสมอาหาร","น้ำเชื่อม","ไข่ไก่","กลิ่นผลไม้"].includes(e);function L(e){return{ถั่วเหลือง:"#f3e18a",น้ำตาลทรายขาว:"#fff",กะทิ:"#fff",ผงวุ้น:"rgba(255,255,255,0.7)",สีผสมอาหาร:"#ff4d4d",น้ำเปล่า:"rgba(120,199,226,0.6)",เกลือ:"#eee",palm_sugar:"#f2efed",ไข่ไก่:"#FFD700",น้ำเชื่อม:"#FFFACD",กลิ่นผลไม้:"#FF69B4"}[e]||"#fff"}function B(e,t,n,r){const o=document.createElement("div");return o.className=k(t)?"ck-liquid-stream":"ck-powder-stream",o.style.cssText="position:absolute; left:calc(50% - 30px); top:35%; z-index:5;",e.appendChild(o),setInterval(()=>{if(k(t)){const p=document.createElement("div");p.className="ck-drop",p.style.cssText=`background:${n}; --ty:${r+25}px;`,o.appendChild(p),setTimeout(()=>p.remove(),1200)}else for(let p=0;p<4;p++){const b=document.createElement("div"),g=(Math.random()-.5)*60,S=r+Math.random()*40;b.className="ck-grain",b.style.cssText=`background:${n}; --tx:${g}px; --ty:${S}px;`,o.appendChild(b),setTimeout(()=>b.remove(),1e3)}},15)}function A(e){const t=f[e];if(!t)return;const n=document.getElementById(t);n&&(n.style.opacity="1",i.currentY-=20,i.currentY<45&&(i.currentY=45),n.style.transform=`translateY(${i.currentY}px)`)}function P(){var n,r,o;i.isStirringEnabled=!0,i.stirProgress=0;const e=document.getElementById("ck-stir-bar");e&&(e.style.height="0%"),(n=document.getElementById("ck-stir-progress"))==null||n.classList.remove("ck-hidden"),(r=document.getElementById("ck-spatula"))==null||r.classList.remove("ck-hidden"),(o=document.getElementById("ck-stir-hint"))==null||o.classList.remove("ck-hidden");const t=i.steps.length===3?"ใส่ครบสามอย่างแล้ว อย่าลืมคนผสมให้เข้ากันก่อนนะหลาน!":"รอบสุดท้ายแล้ว คนให้เนื้อเนียนเลยนะจ๊ะ ขนมจะได้สวยๆ";d&&d.classList.remove("ck-hidden"),E(y,t,40),u.addEventListener("mousemove",w)}function w(e){if(!i.isStirringEnabled||!i.isGameActive)return;const t=u.getBoundingClientRect(),n=t.left+t.width/2,r=t.top+t.height/2,o=e.clientX-n,m=e.clientY-r,p=Math.atan2(m,o),b=document.getElementById("ck-spatula");if(b){let g=Math.max(60,Math.min(180,e.clientX-t.left-40));b.style.left=g+"px",b.style.bottom=60-Math.abs(130-g)*.25+"px",b.style.transform=`rotate(${Math.max(-25,Math.min(25,o/4))}deg)`}if(i.lastAngle!==null){let g=p-i.lastAngle;g>Math.PI&&(g-=Math.PI*2),g<-Math.PI&&(g+=Math.PI*2),i.stirProgress+=Math.abs(g)*2.5;const S=document.getElementById("ck-stir-bar");S&&(S.style.height=Math.min(i.stirProgress,100)+"%"),i.stirProgress>=100&&G()}i.lastAngle=p}function G(){var e,t,n;i.isStirringEnabled=!1,i.stirProgress=0,i.lastAngle=null,u.removeEventListener("mousemove",w),(e=document.getElementById("ck-stir-progress"))==null||e.classList.add("ck-hidden"),(t=document.getElementById("ck-spatula"))==null||t.classList.add("ck-hidden"),(n=document.getElementById("ck-stir-hint"))==null||n.classList.add("ck-hidden"),i.steps.length===3?(d&&d.classList.remove("ck-hidden"),E(y,"ดีมากหลาน! ผสมเข้ากันดีแล้ว ใส่ส่วนผสมที่เหลือต่อได้เลยจ่ะ",40).then(()=>setTimeout(()=>{d&&d.classList.add("ck-hidden")},2e3))):i.steps.length===7&&M(!1)}this._startGame=async()=>{var e,t;document.getElementById("ck-start-screen").style.display="none",i.steps=[],i.isFinishing=!1,i.gameTimeLeft=45,i.currentY=180,i.stirProgress=0,h.pause(),h.currentTime=0,(e=document.getElementById("ck-stir-hint"))==null||e.classList.add("ck-hidden"),document.querySelectorAll(".ck-filling-asset").forEach(n=>{n.style.opacity="0",n.style.transform="translateY(180px)"}),document.querySelectorAll(".ck-ingredient").forEach(n=>{n.style.visibility="visible"}),(t=document.getElementById("ck-bowl-hint"))==null||t.classList.remove("ck-hidden"),$(),d&&d.classList.remove("ck-hidden"),await v("มาหลาน... ยายจะบอกสูตรลูกชุบให้ฟังนะ ตั้งใจฟังล่ะ",2e3);for(let n=0;n<c.length;n++)await v(`ขั้นตอนที่ ${n+1}: ใส่ "${c[n]}"`,1e3);await v("ใส่ส่วนผสมแล้ว อย่าลืมคนให้เข้ากันตามที่ยายบอกด้วยนะหลาน... เริ่มได้!",2e3),d&&d.classList.add("ck-hidden"),await N(),Y()};function N(){return new Promise(e=>{const t=document.getElementById("ck-countdown-overlay"),n=document.getElementById("ck-countdown-text");t&&(t.style.display="flex");const r=[3,2,1,"เริ่ม!"];let o=0;const m=setInterval(()=>{if(o<r.length)n&&(n.innerText=r[o],n.style.animation="none",n.offsetWidth,n.style.animation="ck-count-bounce 0.5s ease-out forwards"),typeof r[o]=="number"?C(_):C(I),o++;else{clearInterval(m),t&&(t.style.display="none");try{h.play()}catch{}e()}},1e3)})}function Y(){i.isGameActive=!0;const e=document.getElementById("ck-timer");e&&(e.classList.remove("ck-hidden"),e.textContent=`เวลา: ${i.gameTimeLeft}`),i.gameInterval=setInterval(()=>{i.gameTimeLeft--,e&&(e.textContent=`เวลา: ${i.gameTimeLeft}`),i.gameTimeLeft<=0&&M(!0)},1e3)}function M(e){var t,n,r,o;i.isFinishing||(i.isFinishing=!0,i.isGameActive=!1,clearInterval(i.gameInterval),u.removeEventListener("mousemove",w),(t=document.getElementById("ck-timer"))==null||t.classList.add("ck-hidden"),(n=document.getElementById("ck-stir-progress"))==null||n.classList.add("ck-hidden"),(r=document.getElementById("ck-spatula"))==null||r.classList.add("ck-hidden"),(o=document.getElementById("ck-stir-hint"))==null||o.classList.add("ck-hidden"),setTimeout(()=>{d&&d.classList.remove("ck-hidden"),E(y,e?"หมดเวลาแล้วจ๊ะ! มัวแต่คนเพลินหรือเปล่านี่เรา":"ทำเสร็จแล้วรึ? ไหนยายดูซิว่าคนจนเนียนดีหรือยัง...",40).then(()=>setTimeout(F,1e3))},e?0:1e3))}function F(){let e=0,t=0;for(let r=0;r<c.length;r++)r<i.steps.length&&i.steps[r]===c[r]&&(e+=10,t++);t===c.length&&i.gameTimeLeft>0&&(e+=30),i.score=e;let n;t===c.length?n=`โอ้โห! เก่งมากหลาน ทำถูกหมดทั้ง 7 ขั้นตอนเลย รับไป ${e} คะแนนเต็ม!`:t>=4?n=`ทำเสร็จแล้วจ้ะหลาน ได้ไป ${e} คะแนน... มีบางขั้นตอนที่สลับกันนะ`:n=`ยายชิมแล้วรสชาติแปลกๆ นะหลาน... ได้ไป ${e} คะแนนจ้ะ`,E(y,n,40).then(()=>setTimeout(()=>j(e),1500))}function j(e){h.pause(),h.currentTime=0;const t=document.getElementById("ck-result-screen"),n=document.getElementById("ck-total-score");n&&(n.textContent=e),t&&(t.classList.remove("ck-hidden"),t.style.display="flex")}}_getCSS(l){return`
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
    `}_el(l,s={}){const a=document.createElement(l);return Object.entries(s).forEach(([c,f])=>{c==="style"?a.style.cssText=f:a.setAttribute(c,f)}),a}_destroyUI(){var l;if(this._bgm){try{this._bgm.pause()}catch{}this._bgm=null}(l=this._gs)!=null&&l.gameInterval&&clearInterval(this._gs.gameInterval),this._ui.forEach(s=>{try{s.remove()}catch{}}),this._ui=[]}}export{q as C};
