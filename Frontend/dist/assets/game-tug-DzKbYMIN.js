import{P as je}from"./phaser-iZDVk5aZ.js";class Ve extends je.Scene{constructor(){super("TugOfWarScene"),this._overlay=null,this._cleanupDone=!1}init(a={}){this.onGameEnd=(a==null?void 0:a.onGameEnd)??null,this.roomCode=(a==null?void 0:a.roomCode)??null,this.player=(a==null?void 0:a.player)??null,this.roundId=(a==null?void 0:a.roundId)??null,this._cleanupDone=!1}preload(){}create(){this._mountOverlay()}update(){}shutdown(){this._removeOverlay()}destroy(){this._removeOverlay()}_mountOverlay(){this._cleanupDone=!1,this._removeOverlay(),this._cleanupDone=!1;const a=document.createElement("div");a.id="tug-overlay",a.style.cssText=`
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      z-index: 9999;
      background: #000;
      font-family: 'Kanit', sans-serif;
    `,a.innerHTML=this._buildHTML(),document.body.appendChild(a),this._overlay=a,this._cleanupDone=!1,this._injectStyle(),requestAnimationFrame(()=>{this._injectGameScript()})}_removeOverlay(){if(this._cleanupDone)return;if(this._cleanupDone=!0,window.__tugBattleBgm)try{window.__tugBattleBgm.pause(),window.__tugBattleBgm=null}catch{}const a=document.getElementById("tug-overlay");a&&a.remove(),this._overlay=null;const A=document.getElementById("tug-style");A&&A.remove()}_buildHTML(){return`
      <!-- START SCREEN -->
      <div id="start-screen" style="
        position:fixed; top:0; left:0; width:100%; height:100%;
        z-index:10000; display:flex; justify-content:center;
        align-items:center; background:rgba(0,0,0,0.6);">
        <div style="text-align:center;">
          <h1 style="color:#ffd700; font-size:3rem; margin-bottom:20px; text-shadow:3px 3px 0 #000;">
            ชักกะเย่อ
          </h1>
          <p style="color:#fff; font-size:1.2rem; margin-bottom:30px;">
            เป่ายิ้งฉุบหาใครเริ่มก่อน เลือกตัวละครและไอเท็มให้พร้อม แล้วดึงเชือกเอาชัยให้ได้
          </p>
          <button id="enter-game-btn" style="
            padding:15px 40px; font-size:24px; font-family:'Kanit',sans-serif;
            background:linear-gradient(180deg,#ffcc00,#ff8800); color:#fff;
            border:4px solid #fff; border-radius:50px; cursor:pointer;
            box-shadow:0 8px 0 #992200;">
            เข้าสู่เกม
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
                ชักกะเย่อ
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
                  กลับแผนที่
                </button>
              </div>
            </div>
          </div>

        </div><!-- /#game-container -->
      </div><!-- /#game-content -->
    `}_injectStyle(){if(document.getElementById("tug-style"))return;const a=document.createElement("link");a.id="tug-style",a.rel="stylesheet",a.href="/assets/tugofwar/style.css",document.head.appendChild(a)}_injectGameScript(){const a=this,A=[{name:"ผู้ชายผอม",power:2,speed:1.8,note:"กดรัวได้ไว",image:"skinny.png",pullImage:"skinny_pull.png"},{name:"หนุ่มนักกล้าม",power:5,speed:.6,note:"แรงสูงมาก",image:"buff.png",pullImage:"buff_pull.png"},{name:"คนแก่แต่เท่",power:3.5,speed:.4,note:"เก๋าแรงเยอะแต่เหนื่อยง่าย",image:"old.png",pullImage:"old_pull.png"},{name:"เด็ก",power:1,speed:1.4,note:"เร็วแต่แรงน้อย",image:"kid.png",pullImage:"kid_pull.png"},{name:"ผู้หญิงธรรมดา",power:2.5,speed:1,note:"แรงน้อยกว่าผู้ชาย",image:"woman.png",pullImage:"woman_pull.png"},{name:"ผู้ชายธรรมดา",power:4,speed:1.1,note:"สมดุล",image:"man.png",pullImage:"man_pull.png"}],o=()=>!a._cleanupDone&&!!document.getElementById("tug-overlay"),B=new Set,N=new Set,C=new Set,d=(e,i=0)=>{const t=window.setTimeout(()=>{B.delete(t),o()&&e()},i);return B.add(t),t},_e=(e,i=0)=>{const t=window.setInterval(()=>{if(!o()){W(t);return}e()},i);return N.add(t),t},W=e=>{N.delete(e),window.clearInterval(e)},ie=e=>{const i=window.requestAnimationFrame(t=>{C.delete(i),o()&&e(t)});return C.add(i),i},Le=()=>{B.forEach(e=>window.clearTimeout(e)),B.clear(),N.forEach(e=>window.clearInterval(e)),N.clear(),C.forEach(e=>window.cancelAnimationFrame(e)),C.clear()},s=e=>o()?document.getElementById(e):null,m={setup:s("setup-page"),arena:s("game-arena"),canvas:s("gameCanvas")},b="/assets/tugofwar/sounds/",Pe=new Audio(b+"pick.mp3"),c=new Audio(b+"pick.mp3"),T=new Audio(b+"battle_bgm.mp3"),se=new Audio(b+"cheer.mp3"),E=new Audio(b+"freeze.mp3"),ae=new Audio(b+"count.mp3"),ne=new Audio(b+"start_go.mp3");Pe.volume=.3,c.volume=.5,T.loop=!0,T.volume=.4,window.__tugBattleBgm=T;const K=new Image;K.src="/assets/tugofwar/images/rope.png";const D={};function oe(e){return D[e]||(D[e]=new Image,D[e].src=`/assets/tugofwar/images/${e}`),D[e]}let u=null,f=null,x=[],k=[],v=!1,I=!1,F=!1,O=[...A],le=!1,j=!1,re=!1,g=100,de=100;const ze=100,Me=4,Ae=.4;let _=!1,w=600,R=0,$=0,ce=0,pe=0,U=!1,q=!1,G=!1,fe=0,V=0,me=0,ue=150,S=0;function Be(){const e=s("char-list");if(!e)return;e.innerHTML="";const i=[{Name:"ผู้ชายผอม",Power:2,Speed:1.8,Note:"กดรัวได้ไว"},{Name:"หนุ่มนักกล้าม",Power:5,Speed:.6,Note:"แรงสูงมาก"},{Name:"คนแก่แต่เท่",Power:3.5,Speed:.4,Note:"เก๋าแรงเยอะแต่เหนื่อยง่าย"},{Name:"เด็ก",Power:1,Speed:1.4,Note:"เร็วแต่แรงน้อย"},{Name:"ผู้หญิงธรรมดา",Power:2.5,Speed:1,Note:"แรงน้อยกว่าผู้ชาย"},{Name:"ผู้ชายธรรมดา",Power:4,Speed:1.1,Note:"สมดุล"}];O.forEach((t,n)=>{const r=document.createElement("div");r.className="char-item has-tooltip",r.id=`char-${n}`;const l=i.find(p=>p.Name===t.name)||{Power:t.power,Speed:t.speed,Note:""};r.innerHTML=`
          <img src="/assets/tugofwar/images/${t.image}" alt="${t.name}">
          <div class="ability-tooltip">
            <div class="tooltip-title">${l.Name}</div>
            <div class="tooltip-stat"><span>พลัง:</span> <span>${l.Power}</span></div>
            <div class="tooltip-stat"><span>ความเร็ว:</span> <span>${l.Speed}</span></div>
            <div class="tooltip-note">${l.Note}</div>
          </div>
        `,r.onclick=()=>De(n),e.appendChild(r)})}window.tugPlayRPS=Ne,window.tugSelectItem=Ce;function Ne(e){if(!o())return;typeof c<"u"&&(c.pause(),c.currentTime=0,c.play().catch(()=>{}));const t=["rock","paper","scissors"][Math.floor(Math.random()*3)],n={rock:"scissors",paper:"rock",scissors:"paper"},r=o()?document.querySelector(".rps-choices"):null,l=s("player-hand"),p=s("ai-hand");l&&p&&(l.src="/assets/tugofwar/images/"+e+".png",p.src="/assets/tugofwar/images/"+t+".png",l.classList.add("show"),p.classList.add("show"));const L=s("rps-result");d(()=>{if(o()){if(e===t){L&&(L.innerText="เสมอ! ลองใหม่อีกครั้ง..."),d(()=>{o()&&(l==null||l.classList.remove("show"),p==null||p.classList.remove("show"))},1e3);return}v=n[e]===t,F=!0,L&&(L.innerText=v?"ชนะแล้ว! คุณได้เลือกก่อน":"แพ้แล้ว! คู่แข่งได้เลือกก่อน"),r&&(r.style.display="none"),X()}},600)}function X(){if(!o())return;const e=s("turn-display");if(x.length>=3&&k.length>=3){const i=s("char-list"),t=s("item-selection-area");i&&(i.style.display="none"),t&&(t.style.display="block"),v?e&&(e.innerText="เลือกไอเท็มของคุณ..."):(e&&(e.innerText="คู่แข่งกำลังเลือกไอเท็ม..."),d(()=>{o()&&ve()},1e3));return}v?e&&(e.innerText="เลือกสมาชิกทีมของคุณ..."):(e&&(e.innerText="คู่แข่งกำลังเลือกสมาชิก..."),d(()=>{o()&&Oe()},1e3))}function Ce(e,i){if(!o()||!v||u||i.classList.contains("item-disabled"))return;u=e,c&&(c.currentTime=0,c.play().catch(()=>{}));const t=s("my-team-slots");if(!t)return;const n=t.children;n[3]&&(n[3].innerHTML='<img src="/assets/tugofwar/images/item_'+e+'.png" style="width:100%;height:100%;object-fit:contain;">',n[3].classList.add("has-char")),i.classList.add("item-disabled"),v=!1,d(()=>{o()&&ge()},1e3)}function ve(){if(!o()||v||f)return;const i=["amulet","drink","oil"].filter(l=>l!==u);f=i[Math.floor(Math.random()*i.length)];const t=s("ai-team-slots");if(!t)return;const n=t.children;n[3]&&(n[3].innerHTML='<img src="/assets/tugofwar/images/item_'+f+'.png" style="width:100%;height:100%;object-fit:contain;">',n[3].classList.add("has-char")),c&&(c.currentTime=0,c.play().catch(()=>{})),(o()?document.querySelectorAll("#item-selection-area .char-item"):[]).forEach(l=>{(l.getAttribute("onclick")||"").includes(f)&&l.classList.add("item-disabled")}),v=!0,ge()}function ge(){if(!o())return;const e=s("turn-display");u&&f?(e&&(e.innerText="ได้สมาชิกและไอเท็มครบแล้ว!"),d(()=>{o()&&Re()},1500)):v?e&&(e.innerText="เลือกไอเท็มของคุณ..."):(e&&(e.innerText="คู่แข่งกำลังเลือกไอเท็ม..."),d(()=>{o()&&ve()},1e3))}function De(e){const i=s(`char-${e}`);!F||!v||x.length>=3||i.classList.contains("selected")||(c.pause(),c.currentTime=0,c.play().catch(()=>{}),x.push(O[e]),ye("my-team-slots",x),i.classList.add("selected"),v=!1,X())}function Oe(){var i;if(!o()||!F)return;const e=[];if(O.forEach((t,n)=>{const r=s(`char-${n}`);r&&!r.classList.contains("selected")&&e.push(n)}),e.length>0&&k.length<3){c.pause(),c.currentTime=0,c.play().catch(()=>{});const t=e[Math.floor(Math.random()*e.length)];k.push(O[t]),ye("ai-team-slots",k),(i=s(`char-${t}`))==null||i.classList.add("selected")}v=!0,X()}function ye(e,i){const t=s(e);if(!t)return;const n=t.children;i.forEach((r,l)=>{n[l]&&(n[l].innerHTML=`<img src="/assets/tugofwar/images/${r.image}">`,n[l].classList.add("has-char"))})}function Re(){if(!o()||(We(),ce=x.reduce((i,t)=>i+(t.power||0),0),pe=x.reduce((i,t)=>i+(t.speed||0),0),fe=k.reduce((i,t)=>i+(t.power||0),0),V=k.reduce((i,t)=>i+(t.speed||0),0),!m.setup||!m.arena))return;m.setup.style.display="none",m.arena.style.display="block",Ke();const e=s("game-container");e&&(e.style.backgroundImage="url('/assets/tugofwar/images/bg21.png')"),T.currentTime=0,T.play().catch(()=>{}),d(()=>{o()&&Ge()},500),ie(he)}function $e(){const e=s("power-fill"),i=s("power-indicator"),t=s("perfect-zone");if(t&&t.remove(),e&&i){let n=(w-100)/1e3*100;n=Math.max(0,Math.min(100,n)),i.style.left=n+"%",e.style.width=n+"%"}}function H(){const e=s("stamina-bar"),i=s("ai-stamina-bar");e&&(e.style.width=`${g}%`,e.style.backgroundColor=_?"#ff5252":"#00ff00"),i&&(de=100-S*2,i.style.width=`${de}%`)}function Ge(){if(!o())return;const e=document.createElement("div");e.id="countdown-overlay",Object.assign(e.style,{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:"150px",fontWeight:"bold",color:"#fff",textShadow:"0 0 20px rgba(0,0,0,0.8)",zIndex:"9999",pointerEvents:"none",transition:"all 0.5s ease-out"}),document.body.appendChild(e);let i=3;const t=_e(()=>{if(!o()){W(t),e.remove();return}i>0?(ae.currentTime=0,ae.play().catch(()=>{}),e.innerText=i,e.style.transform="translate(-50%,-50%) scale(1.5)",e.style.opacity="1",d(()=>{o()&&(e.style.transform="translate(-50%,-50%) scale(1)",e.style.opacity="0.5")},500),i--):(W(t),ne.currentTime=0,ne.play().catch(()=>{}),e.innerText="เริ่ม!",e.style.transform="translate(-50%,-50%) scale(1.8)",e.style.opacity="1",d(()=>{o()&&(e.remove(),I=!0)},800))},1e3)}function he(e){if(o()){if(I){if(g<ze&&(g+=Ae),_&&g>25&&(_=!1),H(),w<500&&f&&!q){q=!0;const i=s("ai-item-slot-arena");i&&i.classList.add("item-used"),y(`คู่แข่งใช้ ${f==="drink"?"เครื่องดื่มชูกำลัง":f==="oil"?"น้ำมันมวย":"พระเครื่อง"}!`,"#ff5252"),f==="drink"?S=0:f==="oil"&&($+=25)}if(w-=R,w+=$,R*=.88,$*=.88,w<550&&!re&&Math.random()<.003&&(re=!0,u==="amulet"?y("พระคุ้มครอง! ป้องกันตะคริวสำเร็จ","#ffffff"):(g=0,_=!0,y("คุณเป็นตะคริว! พลังกายเหลือศูนย์","#ff5252"),E&&(E.currentTime=0,E.play().catch(()=>{})),H())),e-me>ue){const i=fe/8.5*(V/4);$+=i*(f==="oil"?1.15:1),S+=.5,S>50&&(S=0),ue=Math.max(110,190-V*2)+S+Math.random()*60,me=e}if(w<100)return we("คุณชนะแล้ว!");if(w>1100)return we("ทีมคู่แข่ง ชนะแล้ว...")}He(),o()&&ie(he)}}function He(){if(!o()||!m.canvas)return;const e=m.canvas.getContext("2d"),i=window.innerWidth;e.clearRect(0,0,m.canvas.width,m.canvas.height),e.imageSmoothingEnabled=!0;const t=w/1200*i,n=350,r=200,l=360,p=270;if(K.complete){const P=i*3;e.drawImage(K,t-P/2,l-p/2,P,p)}x.forEach((P,J)=>{const h=oe(P.pullImage);if(h.complete){const ee=h.naturalWidth/h.naturalHeight,z=n*ee,te=t-z-J*90-35;e.save(),e.translate(te+z/2,r+n/2),e.scale(-1,1),e.drawImage(h,-z/2,-n/2,z,n),e.restore()}}),k.forEach((P,J)=>{const h=oe(P.pullImage);if(h.complete){const ee=h.naturalWidth/h.naturalHeight,z=n*ee,te=t+J*90+35;e.drawImage(h,te,r,z,n)}}),e.save();const L=50,M=60;e.fillStyle="#333",e.fillRect(t-2,l-M/2,4,M),e.fillStyle="#ff0000",e.beginPath(),e.moveTo(t+2,l-M/2+5),e.lineTo(t+2+L,l-M/2+5+17.5),e.lineTo(t+2,l-M/2+5+35),e.closePath(),e.fill(),e.restore(),$e()}function we(e){if(!o())return;I=!1,m.arena&&(m.arena.style.display="none"),T.pause();const i=e.includes("คุณชนะ"),t=i?100:0,n=s("result-screen");if(n){n.style.display="flex";const r=s("result-status"),l=s("total-score");r&&(r.innerText=i?"ยินดีด้วย คุณชนะ!":"น่าเสียดาย คุณแพ้!"),l&&(l.innerText=t,l.style.color=i?"#ffeb3b":"#ff5252")}a.onGameEnd?d(()=>{o()&&(a._removeOverlay(),a.onGameEnd({score:t,won:i,game:"TugOfWar"}))},3e3):d(()=>{o()&&a.scene&&a.scene.start("FestivalMapScene")},5e3)}function y(e,i="#ffeb3b"){if(!o())return;const t=document.createElement("div");t.innerText=e,Object.assign(t.style,{position:"fixed",top:"30%",left:"50%",transform:"translateX(-50%)",color:i,fontSize:"32px",fontWeight:"bold",fontFamily:"Kanit",zIndex:"10000",textShadow:"2px 2px 10px rgba(0,0,0,0.8)",pointerEvents:"none",transition:"all 0.5s ease-out"}),document.body.appendChild(t),d(()=>{o()&&(t.style.top="25%")},10),d(()=>{o()&&(t.style.opacity="0",d(()=>t.remove(),500))},1500)}function We(){if(!o()||!m.canvas)return;const e=m.canvas,i=e.getContext("2d"),t=window.devicePixelRatio||1;e.width=window.innerWidth*t,e.height=window.innerHeight*t,e.style.width=window.innerWidth+"px",e.style.height=window.innerHeight+"px",i.scale(t,t)}function Ke(){if(!o())return;const e=s("my-item-slot-arena");u&&e&&(e.innerHTML=`<div class="key-hint">ไอเท็มทีมคุณ</div><img src="/assets/tugofwar/images/item_${u}.png">`,G=!1,e.classList.remove("item-used"));const i=s("ai-item-slot-arena");f&&i&&(i.innerHTML=`<div class="key-hint">ไอเท็มคู่แข่ง</div><img src="/assets/tugofwar/images/item_${f}.png">`,q=!1,i.classList.remove("item-used"))}function Fe(){if(!u||G)return;G=!0;const e=s("my-item-slot-arena");switch(e&&e.classList.add("item-used"),c&&(c.currentTime=0,c.play().catch(()=>{})),u){case"amulet":y("พระคุ้มครอง! ป้องกันการหยุดชะงัก","#ffffff");break;case"drink":g=Math.min(100,g+40),y("สดชื่น! เพิ่มพลังกาย","#00ff00"),H();break;case"oil":R+=30,y("แรงฮึด! ดึงแรงขึ้นชั่วขณะ","#ffeb3b");break}}function be(){if(!I||le)return;se.currentTime=0,se.play().catch(()=>{}),le=!0,y("คุณใช้เสียงเชียร์เพิ่มพลัง!","#ffff00");const e=s("key-s");e&&(e.classList.add("key-active"),d(()=>e.classList.remove("key-active"),200))}function xe(){if(!I||j)return;E&&(E.currentTime=0,E.play().catch(()=>{})),j=!0,f==="amulet"?y("ศัตรูมีพระเครื่อง! ป้องกันตะคริวได้","#ffffff"):(S=50,y("ศัตรูตะคริวกิน! พลังกายหมดหลอด","#ffeb3b"),H());const e=s("key-d");e&&(e.classList.add("key-active"),e.style.opacity="0.5",d(()=>e.classList.remove("key-active"),200),d(()=>{j=!1,e&&(e.style.opacity="1")},1e4))}function ke(e){if(!I)return;const i=e.key.toLowerCase(),t=e.code;if(i==="q"&&u&&!G&&Fe(),t==="Space"&&!U){U=!0;const n=s("key-space");n&&n.classList.add("key-active");let r=ce/8*(pe/4);u==="oil"&&(r*=1.1),r*=_?.5:1,R+=r;let p=Me;u==="drink"&&(p*=.7),g-=p,g<=0&&(g=0,_=!0,y("คุณเหนื่อยจัด!","#ff5252"))}i==="s"&&be(),i==="d"&&xe()}function Se(e){var n,r,l;const i=e.code,t=e.key.toLowerCase();t==="s"&&((n=s("key-s"))==null||n.classList.remove("key-active")),t==="d"&&((r=s("key-d"))==null||r.classList.remove("key-active")),i==="Space"&&((l=s("key-space"))==null||l.classList.remove("key-active"),U=!1)}window.addEventListener("keydown",ke),window.addEventListener("keyup",Se);const Y=s("key-space"),Q=s("key-s"),Z=s("key-d");Y&&(Y.style.cursor="pointer",Y.onclick=()=>{const e=new KeyboardEvent("keydown",{code:"Space",key:" "});window.dispatchEvent(e),d(()=>{o()&&window.dispatchEvent(new KeyboardEvent("keyup",{code:"Space",key:" "}))},100)}),Q&&(Q.style.cursor="pointer",Q.onclick=()=>be()),Z&&(Z.style.cursor="pointer",Z.onclick=()=>xe());const Te=s("tug-back-btn");Te&&(Te.onclick=()=>{a._removeOverlay(),a.onGameEnd?a.onGameEnd({score:0,won:!1,game:"TugOfWar"}):a.scene&&a.scene.start("FestivalMapScene")});const Ee=s("tug-exit-btn");Ee&&(Ee.onclick=()=>{a._removeOverlay(),a.onGameEnd?a.onGameEnd({score:0,won:!1,game:"TugOfWar"}):a.scene&&a.scene.start("FestivalMapScene")});const Ie=s("enter-game-btn");Ie&&(Ie.onclick=()=>{const e=s("start-screen");e&&(e.style.opacity="0",e.style.pointerEvents="none",d(()=>{o()&&e&&(e.style.display="none")},500));const i=s("game-content");i&&i.classList.remove("initial-blur"),Be()}),this.events.once("shutdown",()=>{Le(),window.removeEventListener("keydown",ke),window.removeEventListener("keyup",Se),delete window.tugPlayRPS,delete window.tugSelectItem})}}export{Ve as T};
