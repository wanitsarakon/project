import{P as $e}from"./phaser-iZDVk5aZ.js";class De extends $e.Scene{constructor(){super("TugOfWarScene"),this._overlay=null,this._cleanupDone=!1}init(a={}){this.onGameEnd=(a==null?void 0:a.onGameEnd)??null,this.roomCode=(a==null?void 0:a.roomCode)??null,this.player=(a==null?void 0:a.player)??null,this.roundId=(a==null?void 0:a.roundId)??null,this._cleanupDone=!1}preload(){}create(){this._mountOverlay()}update(){}shutdown(){this._removeOverlay()}destroy(){this._removeOverlay()}_mountOverlay(){this._cleanupDone=!1,this._removeOverlay(),this._cleanupDone=!1;const a=document.createElement("div");a.id="tug-overlay",a.style.cssText=`
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      z-index: 9999;
      background: #000;
      font-family: 'Kanit', sans-serif;
    `,a.innerHTML=this._buildHTML(),document.body.appendChild(a),this._overlay=a,this._cleanupDone=!1,this._injectStyle(),requestAnimationFrame(()=>{this._injectGameScript()})}_removeOverlay(){if(this._cleanupDone)return;if(this._cleanupDone=!0,window.__tugBattleBgm)try{window.__tugBattleBgm.pause(),window.__tugBattleBgm=null}catch{}const a=document.getElementById("tug-overlay");a&&a.remove(),this._overlay=null;const P=document.getElementById("tug-style");P&&P.remove()}_buildHTML(){return`
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
    `}_injectStyle(){if(document.getElementById("tug-style"))return;const a=document.createElement("link");a.id="tug-style",a.rel="stylesheet",a.href="/assets/tugofwar/style.css",document.head.appendChild(a)}_injectGameScript(){const a=this,P=[{name:"ผู้ชายผอม",power:2,speed:1.8,note:"กดรัวได้ไว",image:"skinny.png",pullImage:"skinny_pull.png"},{name:"หนุ่มนักกล้าม",power:5,speed:.6,note:"แรงสูงมาก",image:"buff.png",pullImage:"buff_pull.png"},{name:"คนแก่แต่เท่",power:3.5,speed:.4,note:"เก๋าแรงเยอะแต่เหนื่อยง่าย",image:"old.png",pullImage:"old_pull.png"},{name:"เด็ก",power:1,speed:1.4,note:"เร็วแต่แรงน้อย",image:"kid.png",pullImage:"kid_pull.png"},{name:"ผู้หญิงธรรมดา",power:2.5,speed:1,note:"แรงน้อยกว่าผู้ชาย",image:"woman.png",pullImage:"woman_pull.png"},{name:"ผู้ชายธรรมดา",power:4,speed:1.1,note:"สมดุล",image:"man.png",pullImage:"man_pull.png"}],s=e=>document.getElementById(e),v={setup:s("setup-page"),arena:s("game-arena"),canvas:s("gameCanvas")},h="/assets/tugofwar/sounds/",be=new Audio(h+"pick.mp3"),r=new Audio(h+"pick.mp3"),k=new Audio(h+"battle_bgm.mp3"),Y=new Audio(h+"cheer.mp3"),S=new Audio(h+"freeze.mp3"),Q=new Audio(h+"count.mp3"),Z=new Audio(h+"start_go.mp3");be.volume=.3,r.volume=.5,k.loop=!0,k.volume=.4,window.__tugBattleBgm=k;const O=new Image;O.src="/assets/tugofwar/images/rope.png";const z={};function J(e){return z[e]||(z[e]=new Image,z[e].src=`/assets/tugofwar/images/${e}`),z[e]}let p=null,d=null,w=[],b=[],f=!1,T=!1,R=!1,M=[...P],ee=!1,D=!1,te=!1,m=100,ie=100;const xe=100,ke=4,Se=.4;let E=!1,y=600,A=0,N=0,se=0,ae=0,G=!1,H=!1,B=!1,ne=0,K=0,oe=0,le=150,x=0;function Te(){const e=s("char-list");e.innerHTML="";const t=[{Name:"ผู้ชายผอม",Power:2,Speed:1.8,Note:"กดรัวได้ไว"},{Name:"หนุ่มนักกล้าม",Power:5,Speed:.6,Note:"แรงสูงมาก"},{Name:"คนแก่แต่เท่",Power:3.5,Speed:.4,Note:"เก๋าแรงเยอะแต่เหนื่อยง่าย"},{Name:"เด็ก",Power:1,Speed:1.4,Note:"เร็วแต่แรงน้อย"},{Name:"ผู้หญิงธรรมดา",Power:2.5,Speed:1,Note:"แรงน้อยกว่าผู้ชาย"},{Name:"ผู้ชายธรรมดา",Power:4,Speed:1.1,Note:"สมดุล"}];M.forEach((i,n)=>{const o=document.createElement("div");o.className="char-item has-tooltip",o.id=`char-${n}`;const l=t.find(c=>c.Name===i.name)||{Power:i.power,Speed:i.speed,Note:""};o.innerHTML=`
          <img src="/assets/tugofwar/images/${i.image}" alt="${i.name}">
          <div class="ability-tooltip">
            <div class="tooltip-title">${l.Name}</div>
            <div class="tooltip-stat"><span>พลัง:</span> <span>${l.Power}</span></div>
            <div class="tooltip-stat"><span>ความเร็ว:</span> <span>${l.Speed}</span></div>
            <div class="tooltip-note">${l.Note}</div>
          </div>
        `,o.onclick=()=>Le(n),e.appendChild(o)})}window.tugPlayRPS=Ee,window.tugSelectItem=_e;function Ee(e){typeof r<"u"&&(r.pause(),r.currentTime=0,r.play().catch(()=>{}));const i=["rock","paper","scissors"][Math.floor(Math.random()*3)],n={rock:"scissors",paper:"rock",scissors:"paper"},o=document.querySelector(".rps-choices"),l=s("player-hand"),c=s("ai-hand");l&&c&&(l.src=`/assets/tugofwar/images/${e}.png`,c.src=`/assets/tugofwar/images/${i}.png`,l.classList.add("show"),c.classList.add("show"));const $=s("rps-result");setTimeout(()=>{if(e===i){$.innerText="เสมอ! เป่าใหม่...",setTimeout(()=>{l==null||l.classList.remove("show"),c==null||c.classList.remove("show")},1e3);return}f=n[e]===i,R=!0,$.innerText=f?"คุณชนะ! เลือกตัวละครได้":"คุณแพ้! ทีมคู่แข่งเลือกก่อน",o&&(o.style.display="none"),W()},600)}function W(){if(w.length>=3&&b.length>=3){s("char-list").style.display="none",s("item-selection-area").style.display="block",f?s("turn-display").innerText="ตาทีมคุณเลือก...":(s("turn-display").innerText="ตาทีมคู่แข่งเลือก...",setTimeout(re,1e3));return}f?s("turn-display").innerText="ตาทีมคุณเลือก...":(s("turn-display").innerText="ตาทีมคู่แข่งเลือก...",setTimeout(Ie,1e3))}function _e(e,t){if(!f||p||t.classList.contains("item-disabled"))return;p=e,r&&(r.currentTime=0,r.play().catch(()=>{}));const i=s("my-team-slots").children;i[3]&&(i[3].innerHTML=`<img src="/assets/tugofwar/images/item_${e}.png" style="width:100%;height:100%;object-fit:contain;">`,i[3].classList.add("has-char")),t.classList.add("item-disabled"),f=!1,setTimeout(de,1e3)}function re(){if(f||d)return;const t=["amulet","drink","oil"].filter(o=>o!==p);d=t[Math.floor(Math.random()*t.length)];const i=s("ai-team-slots").children;i[3]&&(i[3].innerHTML=`<img src="/assets/tugofwar/images/item_${d}.png" style="width:100%;height:100%;object-fit:contain;">`,i[3].classList.add("has-char")),r&&(r.currentTime=0,r.play().catch(()=>{})),document.querySelectorAll("#item-selection-area .char-item").forEach(o=>{(o.getAttribute("onclick")||"").includes(d)&&o.classList.add("item-disabled")}),f=!0,de()}function de(){p&&d?(s("turn-display").innerText="เตรียมตัวเข้าสู่สนาม!",setTimeout(Pe,1500)):f?s("turn-display").innerText="ตาทีมคุณเลือก...":(s("turn-display").innerText="ตาทีมคู่แข่งเลือก...",setTimeout(re,1e3))}function Le(e){const t=s(`char-${e}`);!R||!f||w.length>=3||t.classList.contains("selected")||(r.pause(),r.currentTime=0,r.play().catch(()=>{}),w.push(M[e]),ce("my-team-slots",w),t.classList.add("selected"),f=!1,W())}function Ie(){if(!R)return;const e=[];if(M.forEach((t,i)=>{const n=s(`char-${i}`);n&&!n.classList.contains("selected")&&e.push(i)}),e.length>0&&b.length<3){r.pause(),r.currentTime=0,r.play().catch(()=>{});const t=e[Math.floor(Math.random()*e.length)];b.push(M[t]),ce("ai-team-slots",b),s(`char-${t}`).classList.add("selected")}f=!0,W()}function ce(e,t){const i=s(e).children;t.forEach((n,o)=>{i[o]&&(i[o].innerHTML=`<img src="/assets/tugofwar/images/${n.image}">`,i[o].classList.add("has-char"))})}function Pe(){Ne(),se=w.reduce((e,t)=>e+(t.power||0),0),ae=w.reduce((e,t)=>e+(t.speed||0),0),ne=b.reduce((e,t)=>e+(t.power||0),0),K=b.reduce((e,t)=>e+(t.speed||0),0),v.setup.style.display="none",v.arena.style.display="block",Be(),s("game-container").style.backgroundImage="url('/assets/tugofwar/images/bg21.png')",k.currentTime=0,k.play().catch(()=>{}),setTimeout(Me,500),requestAnimationFrame(pe)}function ze(){const e=s("power-fill"),t=s("power-indicator"),i=s("perfect-zone");if(i&&i.remove(),e&&t){let n=(y-100)/1e3*100;n=Math.max(0,Math.min(100,n)),t.style.left=n+"%",e.style.width=n+"%"}}function C(){const e=s("stamina-bar"),t=s("ai-stamina-bar");e&&(e.style.width=`${m}%`,e.style.backgroundColor=E?"#ff5252":"#00ff00"),t&&(ie=100-x*2,t.style.width=`${ie}%`)}function Me(){const e=document.createElement("div");e.id="countdown-overlay",Object.assign(e.style,{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:"150px",fontWeight:"bold",color:"#fff",textShadow:"0 0 20px rgba(0,0,0,0.8)",zIndex:"9999",pointerEvents:"none",transition:"all 0.5s ease-out"}),document.body.appendChild(e);let t=3;const i=setInterval(()=>{t>0?(Q.currentTime=0,Q.play().catch(()=>{}),e.innerText=t,e.style.transform="translate(-50%,-50%) scale(1.5)",e.style.opacity="1",setTimeout(()=>{e.style.transform="translate(-50%,-50%) scale(1)",e.style.opacity="0.5"},500),t--):(clearInterval(i),Z.currentTime=0,Z.play().catch(()=>{}),e.innerText="เริ่ม!",e.style.transform="translate(-50%,-50%) scale(1.8)",e.style.opacity="1",setTimeout(()=>{e.remove(),T=!0},800))},1e3)}function pe(e){if(T){if(m<xe&&(m+=Se),E&&m>25&&(E=!1),C(),y<500&&d&&!H){H=!0;const t=s("ai-item-slot-arena");t&&t.classList.add("item-used"),u(`คู่แข่งใช้ ${d==="drink"?"เครื่องดื่มชูกำลัง":d==="oil"?"น้ำมันมวย":"พระเครื่อง"}!`,"#ff5252"),d==="drink"?x=0:d==="oil"&&(N+=25)}if(y-=A,y+=N,A*=.88,N*=.88,y<550&&!te&&Math.random()<.003&&(te=!0,p==="amulet"?u("พระคุ้มครอง! ป้องกันตะคริวสำเร็จ","#ffffff"):(m=0,E=!0,u("คุณเป็นตะคริว! พลังกายเหลือศูนย์","#ff5252"),S&&(S.currentTime=0,S.play().catch(()=>{})),C())),e-oe>le){const t=ne/8.5*(K/4);N+=t*(d==="oil"?1.15:1),x+=.5,x>50&&(x=0),le=Math.max(110,190-K*2)+x+Math.random()*60,oe=e}if(y<100)return fe("คุณชนะแล้ว!");if(y>1100)return fe("ทีมคู่แข่ง ชนะแล้ว...")}Ae(),requestAnimationFrame(pe)}function Ae(){const e=v.canvas.getContext("2d"),t=window.innerWidth;e.clearRect(0,0,v.canvas.width,v.canvas.height),e.imageSmoothingEnabled=!0;const i=y/1200*t,n=350,o=200,l=360,c=270;if(O.complete){const _=t*3;e.drawImage(O,i-_/2,l-c/2,_,c)}w.forEach((_,q)=>{const g=J(_.pullImage);if(g.complete){const V=g.naturalWidth/g.naturalHeight,L=n*V,X=i-L-q*90-35;e.save(),e.translate(X+L/2,o+n/2),e.scale(-1,1),e.drawImage(g,-L/2,-n/2,L,n),e.restore()}}),b.forEach((_,q)=>{const g=J(_.pullImage);if(g.complete){const V=g.naturalWidth/g.naturalHeight,L=n*V,X=i+q*90+35;e.drawImage(g,X,o,L,n)}}),e.save();const $=50,I=60;e.fillStyle="#333",e.fillRect(i-2,l-I/2,4,I),e.fillStyle="#ff0000",e.beginPath(),e.moveTo(i+2,l-I/2+5),e.lineTo(i+2+$,l-I/2+5+17.5),e.lineTo(i+2,l-I/2+5+35),e.closePath(),e.fill(),e.restore(),ze()}function fe(e){T=!1,v.arena&&(v.arena.style.display="none"),k.pause();const t=e.includes("คุณชนะ"),i=t?100:0,n=s("result-screen");if(n){n.style.display="flex";const o=s("result-status"),l=s("total-score");o&&(o.innerText=t?"🏆 ยินดีด้วย คุณชนะ!":"😢 น่าเสียดาย คุณแพ้!"),l&&(l.innerText=i,l.style.color=t?"#ffeb3b":"#ff5252")}a.onGameEnd?setTimeout(()=>{a._removeOverlay(),a.onGameEnd({score:i,won:t,game:"TugOfWar"})},3e3):setTimeout(()=>location.reload(),5e3)}function u(e,t="#ffeb3b"){const i=document.createElement("div");i.innerText=e,Object.assign(i.style,{position:"fixed",top:"30%",left:"50%",transform:"translateX(-50%)",color:t,fontSize:"32px",fontWeight:"bold",fontFamily:"Kanit",zIndex:"10000",textShadow:"2px 2px 10px rgba(0,0,0,0.8)",pointerEvents:"none",transition:"all 0.5s ease-out"}),document.body.appendChild(i),setTimeout(()=>{i.style.top="25%"},10),setTimeout(()=>{i.style.opacity="0",setTimeout(()=>i.remove(),500)},1500)}function Ne(){const e=v.canvas,t=e.getContext("2d"),i=window.devicePixelRatio||1;e.width=window.innerWidth*i,e.height=window.innerHeight*i,e.style.width=window.innerWidth+"px",e.style.height=window.innerHeight+"px",t.scale(i,i)}function Be(){const e=s("my-item-slot-arena");p&&e&&(e.innerHTML=`<div class="key-hint">ไอเท็มทีมคุณ</div><img src="/assets/tugofwar/images/item_${p}.png">`,B=!1,e.classList.remove("item-used"));const t=s("ai-item-slot-arena");d&&t&&(t.innerHTML=`<div class="key-hint">ไอเท็มคู่แข่ง</div><img src="/assets/tugofwar/images/item_${d}.png">`,H=!1,t.classList.remove("item-used"))}function Ce(){if(!p||B)return;B=!0;const e=s("my-item-slot-arena");switch(e&&e.classList.add("item-used"),r&&(r.currentTime=0,r.play()),p){case"amulet":u("พระคุ้มครอง! ป้องกันการหยุดชะงัก","#ffffff");break;case"drink":m=Math.min(100,m+40),u("สดชื่น! เพิ่มพลังกาย","#00ff00"),C();break;case"oil":A+=30,u("แรงฮึด! ดึงแรงขึ้นชั่วขณะ","#ffeb3b");break}}function me(){if(!T||ee)return;Y.currentTime=0,Y.play().catch(()=>{}),ee=!0,u("คุณใช้เสียงเชียร์เพิ่มพลัง!","#ffff00");const e=s("key-s");e&&(e.classList.add("key-active"),setTimeout(()=>e.classList.remove("key-active"),200))}function ue(){if(!T||D)return;S&&(S.currentTime=0,S.play().catch(()=>{})),D=!0,d==="amulet"?u("ศัตรูมีพระเครื่อง! ป้องกันตะคริวได้","#ffffff"):(x=50,u("ศัตรูตะคริวกิน! พลังกายหมดหลอด","#ffeb3b"),C());const e=s("key-d");e&&(e.classList.add("key-active"),e.style.opacity="0.5",setTimeout(()=>e.classList.remove("key-active"),200),setTimeout(()=>{D=!1,e&&(e.style.opacity="1")},1e4))}function ge(e){if(!T)return;const t=e.key.toLowerCase(),i=e.code;if(t==="q"&&p&&!B&&Ce(),i==="Space"&&!G){G=!0;const n=s("key-space");n&&n.classList.add("key-active");let o=se/8*(ae/4);p==="oil"&&(o*=1.1),o*=E?.5:1,A+=o;let c=ke;p==="drink"&&(c*=.7),m-=c,m<=0&&(m=0,E=!0,u("คุณเหนื่อยจัด!","#ff5252"))}t==="s"&&me(),t==="d"&&ue()}function ve(e){var n,o,l;const t=e.code,i=e.key.toLowerCase();i==="s"&&((n=s("key-s"))==null||n.classList.remove("key-active")),i==="d"&&((o=s("key-d"))==null||o.classList.remove("key-active")),t==="Space"&&((l=s("key-space"))==null||l.classList.remove("key-active"),G=!1)}window.addEventListener("keydown",ge),window.addEventListener("keyup",ve);const j=s("key-space"),F=s("key-s"),U=s("key-d");j&&(j.style.cursor="pointer",j.onclick=()=>{const e=new KeyboardEvent("keydown",{code:"Space",key:" "});window.dispatchEvent(e),setTimeout(()=>{window.dispatchEvent(new KeyboardEvent("keyup",{code:"Space",key:" "}))},100)}),F&&(F.style.cursor="pointer",F.onclick=()=>me()),U&&(U.style.cursor="pointer",U.onclick=()=>ue());const ye=s("tug-back-btn");ye&&(ye.onclick=()=>{a._removeOverlay(),a.onGameEnd?a.onGameEnd({score:0,won:!1,game:"TugOfWar"}):a.scene&&a.scene.start("FestivalMapScene")});const he=s("tug-exit-btn");he&&(he.onclick=()=>{a._removeOverlay(),a.onGameEnd?a.onGameEnd({score:0,won:!1,game:"TugOfWar"}):a.scene&&a.scene.start("FestivalMapScene")});const we=s("enter-game-btn");we&&(we.onclick=()=>{const e=s("start-screen");e&&(e.style.opacity="0",e.style.pointerEvents="none",setTimeout(()=>{e.style.display="none"},500));const t=s("game-content");t&&t.classList.remove("initial-blur"),Te()}),this.events.once("shutdown",()=>{window.removeEventListener("keydown",ge),window.removeEventListener("keyup",ve),delete window.tugPlayRPS,delete window.tugSelectItem})}}export{De as T};
