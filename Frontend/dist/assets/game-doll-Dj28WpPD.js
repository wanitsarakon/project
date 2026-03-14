var v=Object.defineProperty;var w=(p,c,t)=>c in p?v(p,c,{enumerable:!0,configurable:!0,writable:!0,value:t}):p[c]=t;var g=(p,c,t)=>w(p,typeof c!="symbol"?c+"":c,t);import{P as y}from"./phaser-iZDVk5aZ.js";const n="/assets/dollgame",k=["big","small","small","gold","gold","blue","blue","red","red","stone","stone","smoke_bomb"],m={big:`${n}/images/doll_big.png`,small:`${n}/images/doll_small.png`,gold:`${n}/images/doll_gold.png`,blue:`${n}/images/doll_blue.png`,red:`${n}/images/doll_red.png`,stone:`${n}/images/stone.png`,smoke_bomb:`${n}/images/smoke_bomb.png`,gun:`${n}/images/gun.png`,bg:`${n}/images/bg.png`,scoreLegend:`${n}/images/scoredoll.png`,header:`${n}/images/your-header-logo.png`,hud:`${n}/images/your-hud-bg.png`,startFrame:`${n}/images/your-frame-bg.png`,endFrame:`${n}/images/your-frame-bg2.png`},E={shot:`${n}/sounds/shot.mp3`,reload:`${n}/sounds/reload.mp3`,tick:`${n}/sounds/tick.MP3`,start:`${n}/sounds/start.mp3`,bgm:`${n}/sounds/bg-music.mp3`};class z extends y.Scene{constructor(){super({key:"DollGameScene"});g(this,"resizeCanvas",()=>{if(!this.canvas||!this.root)return;const t=this.root.getBoundingClientRect();this.canvas.width=t.width,this.canvas.height=t.height});g(this,"handleMouseMove",t=>{if(!this.canvas)return;const e=this.canvas.getBoundingClientRect();this.state.mouseX=(t.clientX-e.left)*(this.canvas.width/e.width),this.state.mouseY=(t.clientY-e.top)*(this.canvas.height/e.height)});g(this,"handleMouseDown",t=>{const e=this.state;if(!(e!=null&&e.started)||e.over||e.ammo<=0)return;e.ammo-=1,e.shakeTimer=8,this.playSfx("shot",.5);const o=this.canvas.getBoundingClientRect(),i=(t.clientX-o.left)*(this.canvas.width/o.width),s=(t.clientY-o.top)*(this.canvas.height/o.height);let r=!1;for(let d=e.targets.length-1;d>=0;d-=1){const a=e.targets[d];if(Math.sqrt((i-a.x)**2+(s-a.y)**2)>=a.size*.6)continue;r=!0;const h=this.getTargetColor(a.type);this.createParticles(a.x,a.y,h),a.type==="smoke_bomb"?(this.createSmokeCloud(a.x,a.y),e.combo=0,e.scorePopups.push({x:a.x,y:a.y,text:"ควันระเบิด!",color:"#ff3e3e",life:1})):a.type==="stone"?(e.score=Math.max(0,e.score-5),e.combo=0,e.scorePopups.push({x:a.x,y:a.y,text:"-5",color:"#ffffff",life:1})):(e.score+=a.pts,e.combo+=1,this.showCombo(),e.scorePopups.push({x:a.x,y:a.y,text:`+${a.pts}`,color:"#f1c40f",life:1})),a.x=a.minX+Math.random()*(a.maxX-a.minX);break}r||(e.combo=0),this.updateHud()});g(this,"handleKeyDown",t=>{if(t.code!=="Space")return;const e=this.state;!e||e.over||(e.ammo=10,this.playSfx("reload",.5),this.updateHud())});g(this,"startCountdown",()=>{var o,i;if(!this.state||this.state.started)return;(o=this.startOverlay)==null||o.classList.add("dg-hidden"),(i=this.countdownEl)==null||i.classList.remove("dg-hidden");let t=3;const e=()=>{if(this.countdownEl){if(t>0){this.countdownEl.textContent=String(t),this.playSfx("tick",.7),t-=1,this.countdownTimer=window.setTimeout(e,1e3);return}if(t===0){this.countdownEl.textContent="เริ่ม!",this.playSfx("start",.8),t-=1,this.countdownTimer=window.setTimeout(e,900);return}this.countdownEl.classList.add("dg-hidden"),this.actualStart()}};e()});g(this,"finishGame",()=>{var e,o;const t=((e=this.state)==null?void 0:e.score)??0;(o=this.onGameEnd)==null||o.call(this,{score:t,game:"DollGame"})});this.onGameEnd=null,this.root=null,this.cleanupFns=[],this.state=null,this.animationFrame=0,this.countdownTimer=null,this.gameTimer=null,this.imageCache={},this.audio={},this._onResize=null}init(t={}){this.onGameEnd=(t==null?void 0:t.onGameEnd)??null}create(){this.state=this.createInitialState(),this.buildDom(),this.preloadAssets().then(()=>{this.root&&(this.resizeCanvas(),this.spawnStaticTargets(),this.startRenderLoop())}),this.events.once("shutdown",()=>this.teardown()),this.events.once("destroy",()=>this.teardown())}createInitialState(){return{started:!1,over:!1,score:0,ammo:10,timeLeft:60,combo:0,shakeTimer:0,mouseX:400,mouseY:520,targets:[],scorePopups:[],particles:[],smokes:[]}}async preloadAssets(){const t=Object.entries(m);await Promise.all(t.map(async([e,o])=>{this.imageCache[e]=await this.loadImage(o)})),Object.entries(E).forEach(([e,o])=>{this.audio[e]=new Audio(o)}),this.audio.bgm&&(this.audio.bgm.loop=!0,this.audio.bgm.volume=.15)}loadImage(t){return new Promise(e=>{const o=new Image;o.onload=()=>e(o),o.onerror=()=>e(null),o.src=t})}buildDom(){var e;const t=(e=this.game.canvas)==null?void 0:e.parentElement;t&&(this.root=document.createElement("div"),this.root.className="dg-root",this.root.innerHTML=`
      <style>
        .dg-root {
          position: absolute;
          inset: 0;
          overflow: hidden;
          font-family: "Kanit", sans-serif;
          background: #000;
          user-select: none;
        }
        .dg-bg {
          position: absolute;
          inset: 0;
          background-image: url('${m.bg}');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }
        .dg-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          cursor: crosshair;
        }
        .dg-ui {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .dg-header {
          position: absolute;
          top: -80px;
          left: 50%;
          width: min(48vw, 380px);
          transform: translateX(-50%) rotate(-3deg);
          transform-origin: top center;
          animation: dg-sway 3.5s ease-in-out infinite;
          filter: drop-shadow(0 8px 15px rgba(0,0,0,0.4));
        }
        .dg-score-legend {
          position: absolute;
          top: 150px;
          left: 12px;
          width: min(20vw, 170px);
          max-height: 50%;
          object-fit: contain;
          filter: drop-shadow(4px 4px 8px rgba(0,0,0,0.5));
        }
        .dg-stats-left,
        .dg-stats-right {
          position: absolute;
          top: 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .dg-stats-left { left: 16px; }
        .dg-stats-right { right: 16px; }
        .dg-stat {
          width: 150px;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background-image: url('${m.hud}');
          background-size: 100% 100%;
          color: #fff;
          font-size: 18px;
          font-weight: 900;
          text-shadow: 2px 2px 0 #333;
        }
        .dg-stat span {
          color: #f1c40f;
          min-width: 30px;
          text-align: center;
        }
        .dg-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.75);
          z-index: 20;
        }
        .dg-card {
          width: min(78vw, 580px);
          height: min(58vw, 380px);
          padding: 110px 40px 40px;
          box-sizing: border-box;
          text-align: center;
          background-size: 100% 100%;
          background-position: center;
          background-repeat: no-repeat;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
        }
        .dg-start-card { background-image: url('${m.startFrame}'); }
        .dg-end-card { background-image: url('${m.endFrame}'); }
        .dg-title {
          margin: 0 0 8px;
          color: #f1c40f;
          font-size: clamp(30px, 4vw, 54px);
          font-weight: 900;
          -webkit-text-stroke: 2px #333;
          text-shadow: 4px 4px 0 #c0392b, 6px 6px 0 #333;
        }
        .dg-sub {
          color: #fff7dd;
          font-size: clamp(14px, 1.7vw, 18px);
          font-weight: 700;
          text-shadow: 1px 1px 2px rgba(0,0,0,1), 0 0 8px rgba(0,0,0,0.6);
        }
        .dg-button {
          margin-top: 28px;
          padding: 14px 36px;
          font-size: clamp(20px, 2.5vw, 28px);
          font-family: "Kanit", sans-serif;
          font-weight: 700;
          color: #fff;
          background: linear-gradient(180deg, #ffcc00 0%, #ff8800 50%, #ff4400 100%);
          border: 4px solid #fff;
          border-radius: 999px;
          cursor: pointer;
          box-shadow: 0 8px 0 #992200, 0 15px 20px rgba(0,0,0,0.5);
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        .dg-button:hover { transform: translateY(-2px) scale(1.03); }
        .dg-button:active { transform: translateY(4px); box-shadow: 0 2px 0 #992200, 0 5px 10px rgba(0,0,0,0.5); }
        .dg-countdown,
        .dg-combo {
          position: absolute;
          left: 50%;
          transform: translate(-50%, -50%);
          font-weight: 900;
          pointer-events: none;
        }
        .dg-countdown {
          top: 50%;
          z-index: 18;
          color: #f1c40f;
          font-size: clamp(100px, 16vw, 180px);
          text-shadow: 8px 8px 0 #000;
        }
        .dg-combo {
          top: 40%;
          z-index: 12;
          color: rgba(240,1,1,0.86);
          font-size: clamp(40px, 7vw, 80px);
          text-shadow: 4px 4px 0 #fff, 6px 6px 0 #000;
        }
        .dg-instructions {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 16px;
          text-align: center;
          color: #fff;
          font-weight: 700;
          text-shadow: 2px 2px 4px #000;
        }
        .dg-final-score {
          margin-top: 18px;
          font-size: clamp(56px, 9vw, 108px);
          font-weight: 900;
          line-height: 1;
          background: linear-gradient(180deg, #fff 30%, #ffd700 60%, #ff8c00 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(5px 5px 0 #632b00) drop-shadow(0 0 15px rgba(255,140,0,0.5));
          animation: dg-score-pop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards;
        }
        .dg-hidden { display: none !important; }
        @keyframes dg-sway {
          0% { transform: translateX(-50%) rotate(-3deg); }
          50% { transform: translateX(-50%) rotate(3deg); }
          100% { transform: translateX(-50%) rotate(-3deg); }
        }
        @keyframes dg-score-pop {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @media (max-width: 700px) {
          .dg-header { top: -36px; width: min(62vw, 300px); }
          .dg-score-legend { top: 108px; width: 120px; }
          .dg-stat { width: 126px; height: 50px; font-size: 15px; }
          .dg-card { padding-top: 90px; }
        }
      </style>
      <div class="dg-bg"></div>
      <canvas class="dg-canvas"></canvas>
      <div class="dg-ui">
        <img class="dg-header" src="${m.header}" alt="Doll header" />
        <img class="dg-score-legend" src="${m.scoreLegend}" alt="Score legend" />
        <div class="dg-stats-left">
          <div class="dg-stat">คะแนน <span id="dg-score">0</span></div>
        </div>
        <div class="dg-stats-right">
          <div class="dg-stat">เวลา <span id="dg-time">60</span></div>
          <div class="dg-stat">กระสุน <span id="dg-ammo">10</span></div>
        </div>
        <div id="dg-combo" class="dg-combo"></div>
        <div id="dg-countdown" class="dg-countdown dg-hidden"></div>
        <div id="dg-start" class="dg-overlay">
          <div class="dg-card dg-start-card">
            <h2 class="dg-title">ยิงตุ๊กตา</h2>
            <div class="dg-sub">ยิงเป้าตุ๊กตาให้แม่นที่สุดใน 60 วินาที<br/>กด Space เพื่อเติมกระสุนใหม่</div>
            <button id="dg-start-btn" class="dg-button">เริ่มเกม</button>
          </div>
        </div>
        <div id="dg-end" class="dg-overlay dg-hidden">
          <div class="dg-card dg-end-card">
            <h2 class="dg-title">จบเกม</h2>
            <div class="dg-sub">คะแนนรวมของคุณ</div>
            <div id="dg-final-score" class="dg-final-score">0</div>
            <button id="dg-finish-btn" class="dg-button">กลับแผนที่</button>
          </div>
        </div>
        <div class="dg-instructions">คลิกเพื่อยิงเป้า และกด Space เพื่อรีโหลดกระสุน</div>
      </div>
    `,t.appendChild(this.root),this.canvas=this.root.querySelector(".dg-canvas"),this.ctx=this.canvas.getContext("2d"),this.scoreEl=this.root.querySelector("#dg-score"),this.timeEl=this.root.querySelector("#dg-time"),this.ammoEl=this.root.querySelector("#dg-ammo"),this.comboEl=this.root.querySelector("#dg-combo"),this.countdownEl=this.root.querySelector("#dg-countdown"),this.startOverlay=this.root.querySelector("#dg-start"),this.endOverlay=this.root.querySelector("#dg-end"),this.finalScoreEl=this.root.querySelector("#dg-final-score"),this.startBtn=this.root.querySelector("#dg-start-btn"),this.finishBtn=this.root.querySelector("#dg-finish-btn"),this.startBtn.addEventListener("click",this.startCountdown),this.finishBtn.addEventListener("click",this.finishGame),this.canvas.addEventListener("mousemove",this.handleMouseMove),this.canvas.addEventListener("mousedown",this.handleMouseDown),window.addEventListener("keydown",this.handleKeyDown),this.cleanupFns.push(()=>{var o;return(o=this.startBtn)==null?void 0:o.removeEventListener("click",this.startCountdown)}),this.cleanupFns.push(()=>{var o;return(o=this.finishBtn)==null?void 0:o.removeEventListener("click",this.finishGame)}),this.cleanupFns.push(()=>{var o;return(o=this.canvas)==null?void 0:o.removeEventListener("mousemove",this.handleMouseMove)}),this.cleanupFns.push(()=>{var o;return(o=this.canvas)==null?void 0:o.removeEventListener("mousedown",this.handleMouseDown)}),this.cleanupFns.push(()=>window.removeEventListener("keydown",this.handleKeyDown)),this._onResize=()=>{var o,i;this.resizeCanvas(),(i=(o=this.state)==null?void 0:o.targets)!=null&&i.length&&this.spawnStaticTargets()},window.addEventListener("resize",this._onResize),this.cleanupFns.push(()=>window.removeEventListener("resize",this._onResize)))}actualStart(){const t=this.state;t.started=!0,t.over=!1,t.score=0,t.ammo=10,t.timeLeft=60,t.combo=0,t.scorePopups=[],t.particles=[],t.smokes=[],this.spawnStaticTargets(),this.updateHud(),this.audio.bgm&&(this.audio.bgm.currentTime=0,this.audio.bgm.play().catch(()=>{})),this.gameTimer=window.setInterval(()=>{!this.state||this.state.over||(this.state.timeLeft>0?(this.state.timeLeft-=1,this.updateHud()):this.endGame())},1e3)}spawnStaticTargets(){const t=this.state;if(!t||!this.canvas)return;t.targets=[],[this.canvas.height*.35,this.canvas.height*.58].forEach(o=>{const i=this.canvas.width*.25,s=this.canvas.width*.045,r=[...k].sort(()=>Math.random()-.5),d={big:1,small:1,gold:1,blue:1,red:1,stone:1,smoke_bomb:1};for(let a=0;a<r.length;a+=1){const x=r[a];let h=0,l=this.canvas.height*.08,u=0,f=1;switch(x){case"gold":h=50,l=this.canvas.height*.05,u=this.canvas.height*.029,f=2;break;case"stone":h=-5,l=this.canvas.height*.14,f=1.5;break;case"blue":h=25,l=this.canvas.height*.08,u=this.canvas.height*.025,f=1.5;break;case"red":h=10,l=this.canvas.height*.1,u=this.canvas.height*.015,f=1.1;break;case"small":h=15,l=this.canvas.height*.07,u=this.canvas.height*.025,f=1.3;break;case"big":h=5,l=this.canvas.height*.12;break;case"smoke_bomb":l=this.canvas.height*.04,u=-this.canvas.height*.01;break}const b=d[x];d[x]*=-1,t.targets.push({type:x,pts:h,size:l,x:i+a*s,y:o+u,speed:6*b*f,minX:this.canvas.width*.24,maxX:this.canvas.width*.76})}})}createParticles(t,e,o){const i=this.state;for(let s=0;s<12;s+=1)i.particles.push({x:t,y:e,vx:(Math.random()-.5)*10,vy:(Math.random()-.5)*10,size:Math.random()*5+2,color:o,life:1})}createSmokeCloud(t,e){const o=this.state;for(let i=0;i<20;i+=1)o.smokes.push({x:t+(Math.random()-.5)*30,y:e+(Math.random()-.5)*30,vx:(Math.random()-.5)*1.5,vy:-Math.random()*1.2,size:Math.random()*40+30,growth:Math.random()*.5+.2,opacity:.6,life:5})}showCombo(){if(!this.comboEl||this.state.combo<3){this.comboEl&&(this.comboEl.textContent="");return}this.comboEl.textContent=`COMBO x${this.state.combo}`,window.clearTimeout(this.comboClearTimer),this.comboClearTimer=window.setTimeout(()=>{this.comboEl&&(this.comboEl.textContent="")},700)}updateHud(){this.scoreEl&&(this.scoreEl.textContent=String(this.state.score)),this.timeEl&&(this.timeEl.textContent=String(this.state.timeLeft)),this.ammoEl&&(this.ammoEl.textContent=String(this.state.ammo))}startRenderLoop(){const t=()=>{var e,o,i,s;this.draw(),(!((e=this.state)!=null&&e.over)||(o=this.state)!=null&&o.particles.length||(i=this.state)!=null&&i.smokes.length||(s=this.state)!=null&&s.scorePopups.length)&&(this.animationFrame=window.requestAnimationFrame(t))};t()}draw(){if(!this.ctx||!this.canvas||!this.state)return;const t=this.ctx,e=this.state;t.clearRect(0,0,this.canvas.width,this.canvas.height),t.save(),e.shakeTimer>0&&(t.translate((Math.random()-.5)*7,(Math.random()-.5)*7),e.shakeTimer-=1),e.targets.forEach(i=>{e.started&&!e.over&&(i.x+=i.speed,(i.x>i.maxX||i.x<i.minX)&&(i.speed*=-1));const s=this.imageCache[i.type];if(!s)return;const r=s.width/s.height,d=i.size,a=i.size/r;t.drawImage(s,i.x-d/2,i.y-a/2,d,a)});for(let i=e.smokes.length-1;i>=0;i-=1){const s=e.smokes[i];t.save(),t.globalAlpha=s.opacity;const r=t.createRadialGradient(s.x,s.y,s.size*.1,s.x,s.y,s.size);r.addColorStop(0,"rgba(230,230,230,0.9)"),r.addColorStop(.6,"rgba(200,200,200,0.4)"),r.addColorStop(1,"rgba(255,255,255,0)"),t.fillStyle=r,t.beginPath(),t.arc(s.x,s.y,s.size,0,Math.PI*2),t.fill(),t.restore(),s.x+=s.vx,s.y+=s.vy,s.size+=s.growth,s.life-=.016,s.opacity=Math.max(0,s.life/6),(s.life<=0||s.y+s.size<-50)&&e.smokes.splice(i,1)}for(let i=e.particles.length-1;i>=0;i-=1){const s=e.particles[i];t.globalAlpha=s.life,t.fillStyle=s.color,t.fillRect(s.x,s.y,s.size,s.size),s.x+=s.vx,s.y+=s.vy,s.vy+=.2,s.life-=.03,s.life<=0&&e.particles.splice(i,1)}t.globalAlpha=1;const o=this.imageCache.gun;if(o){const i=this.canvas.height*.45,s=o.width/o.height*i;t.drawImage(o,e.mouseX-s/2,this.canvas.height-i+30,s,i)}t.restore();for(let i=e.scorePopups.length-1;i>=0;i-=1){const s=e.scorePopups[i];t.fillStyle=s.color,t.font="bold 24px Kanit",t.textAlign="center",t.globalAlpha=s.life,t.fillText(s.text,s.x,s.y),s.y-=1,s.life-=.02,s.life<=0&&e.scorePopups.splice(i,1)}t.globalAlpha=1}endGame(){var t;!this.state||this.state.over||(this.state.over=!0,window.clearInterval(this.gameTimer),this.audio.bgm&&(this.audio.bgm.pause(),this.audio.bgm.currentTime=0),this.finalScoreEl&&(this.finalScoreEl.textContent=String(this.state.score)),(t=this.endOverlay)==null||t.classList.remove("dg-hidden"))}playSfx(t,e=.5){const o=this.audio[t];if(!o)return;const i=o.cloneNode();i.volume=e,i.play().catch(()=>{})}getTargetColor(t){switch(t){case"red":return"#ff3e3e";case"blue":return"#3498db";case"gold":return"#f1c40f";default:return"#7f8c8d"}}teardown(){var t;window.cancelAnimationFrame(this.animationFrame),window.clearTimeout(this.countdownTimer),window.clearTimeout(this.comboClearTimer),window.clearInterval(this.gameTimer),this.cleanupFns.forEach(e=>{try{e()}catch{}}),this.cleanupFns=[],Object.values(this.audio).forEach(e=>{try{e.pause(),e.currentTime=0}catch{}}),this.audio={},(t=this.root)!=null&&t.parentNode&&this.root.parentNode.removeChild(this.root),this.root=null}}export{z as D};
