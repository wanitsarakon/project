import{P as h}from"./phaser-iZDVk5aZ.js";const c=new URL("/assets/%E0%B9%84%E0%B8%AB%E0%B8%A7%E0%B9%89%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B9%80%E0%B8%A3%E0%B8%B4%E0%B9%88%E0%B8%A1%E0%B9%80%E0%B8%81%E0%B8%A1-Bos3kp7C.png",import.meta.url).href,g=new URL("/assets/monk-CheTvQqz.png",import.meta.url).href,w=new URL("/assets/temple_bell-zYhLx0tT.wav",import.meta.url).href,u=new URL("/assets/calm_ambience-BqQWv_i4.wav",import.meta.url).href,x="/assets/flowergame/image/bg-temple.png",m="/assets/worship_ui/พระพุธรูป.png",f="/assets/worship_ui/top_sign.svg",d="/assets/worship_ui/side_panel.svg",v="/assets/worship_ui/pray_button.svg",y="/assets/worship_ui/ธูป.png",E="/assets/worship_ui/เทียน.png",k="/assets/worship_ui/ดอกบัว.png",S="/assets/worship_ui/โต๊ะบูชา.png",B="/assets/worship_ui/เซียมซี.png",I="/assets/เเผ่นป้ายเวลากับคะเเนน.png",r=[{id:"incense",label:"ธูป",action:"จุดธูป",icon:y},{id:"candle",label:"เทียน",action:"จุดเทียน",icon:E},{id:"lotus",label:"ดอกบัว",action:"ถวายดอกบัว",icon:k}],p=["เซียมซีเลข 3: ช่วงนี้มีคนเมตตา คิดสิ่งใดให้ค่อย ๆ ทำด้วยใจเย็น","เซียมซีเลข 8: งานที่หวังไว้จะสำเร็จทีละขั้น ขอเพียงตั้งใจต่อเนื่อง","เซียมซีเลข 15: มีโอกาสรับข่าวดีและความช่วยเหลือจากผู้ใหญ่","เซียมซีเลข 21: เรื่องที่เหนื่อยอยู่จะคลี่คลาย ได้พักใจและพบทางออก","เซียมซีเลข 28: โชคลาภเล็ก ๆ และรอยยิ้มดี ๆ กำลังเดินเข้ามา"],b=["ขอให้สุขภาพแข็งแรง ใจสงบ และพบแต่สิ่งเป็นมงคล","ขอให้การเรียนการงานราบรื่น มีคนเมตตาอุปถัมภ์","ขอให้สิ่งที่ตั้งใจค่อย ๆ สำเร็จ สมหวังดังปรารถนา","ขอให้ครอบครัวอบอุ่น เดินทางปลอดภัย และมีความสุข","ขอให้โชคดีตลอดปี มีแต่เรื่องดี ๆ เข้ามาในชีวิต"];class T extends h.Scene{constructor(){super({key:"WorshipBoothScene"}),this.onGameEnd=null,this.root=null,this.state=null,this.countdownTimer=null,this.ritualTimer=null,this.calmBgm=null}init(t={}){this.onGameEnd=(t==null?void 0:t.onGameEnd)??null}preload(){this.load.audio("worship-bell",w),this.load.audio("worship-calm",u)}create(){this.state={phase:"intro",timer:45,stepIndex:0,completed:!1,mistakes:0,blessing:"",fortune:""},this.buildDom(),this.renderState(),this.events.once("shutdown",()=>this.cleanup()),this.events.once("destroy",()=>this.cleanup())}buildDom(){var e,s,o,n;const t=(e=this.game.canvas)==null?void 0:e.parentElement;t&&(this.root=document.createElement("div"),this.root.innerHTML=`
      <style>
        .wb-root {
          position: absolute;
          inset: 0;
          overflow: hidden;
          font-family: Kanit, sans-serif;
          color: #fff2d6;
          background: #160803;
        }

        .wb-bg {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(15, 3, 1, 0.2), rgba(15, 3, 1, 0.64)),
            radial-gradient(circle at 50% 32%, rgba(255, 219, 132, 0.2), rgba(255, 219, 132, 0) 30%),
            url('${x}') center/cover no-repeat;
          filter: saturate(1.12) blur(1px);
          transform: scale(1.03);
        }

        .wb-glow {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 18% 20%, rgba(255, 214, 126, 0.46), rgba(255, 214, 126, 0) 16%),
            radial-gradient(circle at 82% 18%, rgba(255, 214, 126, 0.34), rgba(255, 214, 126, 0) 16%),
            radial-gradient(circle at 50% 54%, rgba(255, 188, 92, 0.28), rgba(255, 188, 92, 0) 28%);
          pointer-events: none;
        }

        .wb-wrap {
          position: relative;
          z-index: 2;
          height: 100%;
          box-sizing: border-box;
          padding: 10px 12px 12px;
          display: grid;
          grid-template-columns: 196px 1fr;
          grid-template-rows: auto 1fr auto;
          gap: 10px;
        }

        .wb-top {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: 122px 1fr 186px;
          gap: 8px;
          align-items: stretch;
        }

        .wb-mini,
        .wb-side,
        .wb-footer,
        .wb-status-card {
          border-radius: 26px;
          box-shadow: 0 16px 26px rgba(0, 0, 0, 0.22);
        }

        .wb-mini {
          min-height: 78px;
          background: url('${I}') center/100% 100% no-repeat;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 10px 18px 8px;
          box-sizing: border-box;
          font-size: 25px;
          font-weight: 1000;
          color: #fff4d8;
        }

        .wb-coin {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, #fff5c4, #d89c28 66%, #9b5710);
          box-shadow: inset 0 0 0 2px rgba(255, 240, 178, 0.6);
        }

        .wb-sign {
          min-height: 92px;
          padding: 12px 26px 10px;
          background: url('${f}') center/100% 100% no-repeat;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .wb-title {
          font-size: 36px;
          font-weight: 900;
          line-height: 1;
          color: #fff7de;
          text-shadow: 0 4px 0 #6d2d0a, 0 0 14px rgba(255, 219, 146, 0.2);
        }

        .wb-sub {
          margin-top: 6px;
          font-size: 12px;
          font-weight: 800;
          line-height: 1.28;
          color: #ffe8b2;
          white-space: normal;
        }

        .wb-left {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .wb-side {
          background: url('${d}') center/100% 100% no-repeat;
          padding: 14px;
          position: relative;
        }

        .wb-monk-box {
          min-height: 252px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          padding-top: 76px;
        }

        .wb-bubble {
          position: absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          background: #fff8eb;
          color: #6d3307;
          border-radius: 24px;
          padding: 12px 14px;
          font-size: 15px;
          font-weight: 900;
          line-height: 1.25;
          text-align: center;
          box-shadow: 0 10px 18px rgba(0, 0, 0, 0.18);
          white-space: normal;
          overflow-wrap: anywhere;
        }

        .wb-bubble::after {
          content: '';
          position: absolute;
          left: 26px;
          bottom: -14px;
          border-width: 14px 16px 0 0;
          border-style: solid;
          border-color: #fff8eb transparent transparent transparent;
        }

        .wb-monk {
          width: min(100%, 132px);
          display: block;
          filter: drop-shadow(0 12px 20px rgba(0, 0, 0, 0.28));
        }

        .wb-status-card {
          background: url('${d}') center/100% 100% no-repeat;
          padding: 10px 12px;
        }

        .wb-status-title {
          padding: 0 6px 8px;
          font-size: 17px;
          font-weight: 900;
          color: #ffeab7;
        }

        .wb-status-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 6px;
          border-top: 1px solid rgba(255, 228, 168, 0.14);
          font-size: 13px;
          color: #f9deb2;
        }

        .wb-status-row strong {
          font-size: 20px;
          color: #fff3d9;
        }

        .wb-main {
          display: grid;
          grid-template-rows: 1fr auto;
          gap: 14px;
        }

        .wb-bottom {
          position: relative;
          width: min(1320px, calc(100% - 44px));
          margin: 2px auto 0;
          padding-right: 246px;
          margin-top: 2px;
          padding-bottom: 0;
        }

        .wb-stage {
          position: relative;
          overflow: hidden;
          border-radius: 28px;
          border: 2px solid rgba(255, 219, 145, 0.22);
          background: linear-gradient(180deg, rgba(22, 7, 3, 0.28), rgba(18, 5, 1, 0.48));
          min-height: 390px;
        }

        .wb-stage::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 50% 44%, rgba(255, 211, 123, 0.18), rgba(255, 211, 123, 0) 26%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(0, 0, 0, 0.08));
          pointer-events: none;
        }

        .wb-stage-col {
          position: absolute;
          top: 26px;
          bottom: 26px;
          width: 14px;
          border-radius: 999px;
          background: linear-gradient(180deg, #daab5a, #8c521e);
          box-shadow: inset 0 0 0 2px rgba(255, 235, 185, 0.22);
        }

        .wb-stage-col.left { left: 16px; }
        .wb-stage-col.right { right: 16px; }

        .wb-ribbon {
          position: absolute;
          top: 70px;
          width: 40px;
          height: 108px;
          background: linear-gradient(180deg, rgba(164, 23, 20, 0.92), rgba(114, 9, 8, 0.96));
          border: 2px solid rgba(255, 221, 154, 0.2);
          box-shadow: 0 16px 24px rgba(0, 0, 0, 0.18);
        }

        .wb-ribbon.left { left: 40px; clip-path: polygon(0 0, 100% 0, 82% 100%, 14% 90%); }
        .wb-ribbon.right { right: 40px; clip-path: polygon(0 0, 100% 0, 86% 90%, 18% 100%); }

        .wb-halo {
          position: absolute;
          left: 48.5%;
          top: 34%;
          width: 410px;
          height: 410px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 219, 125, 0.82), rgba(255, 219, 125, 0.12) 48%, rgba(255, 219, 125, 0) 72%);
          filter: blur(2px);
        }

        .wb-buddha {
          position: absolute;
          left: 47.5%;
          top: 30%;
          transform: translate(-50%, -50%);
          width: min(180%, 650px);
          max-height: 230%;
          object-fit: contain;
          filter: drop-shadow(0 18px 28px rgba(0, 0, 0, 0.34));
        }

        .wb-altar-shadow {
          position: absolute;
          left: 50%;
          bottom: 96px;
          transform: translateX(-50%);
          width: 420px;
          height: 106px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(63, 18, 8, 0.84), rgba(63, 18, 8, 0.72) 48%, rgba(63, 18, 8, 0) 74%);
          filter: blur(10px);
          opacity: 0.82;
        }

        .wb-altar {
          position: absolute;
          left: 50%;
          bottom: 60px;
          transform: translateX(-50%);
          width: 576px;
          display: grid;
          grid-template-columns: 444px 132px;
          align-items: end;
          gap: 0;
        }

        .wb-altar-table {
          position: relative;
          height: 232px;
          overflow: visible;
        }

        .wb-altar-table img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
          filter: drop-shadow(0 12px 20px rgba(0, 0, 0, 0.24));
        }

        .wb-altar-base {
          transform: scale(1.47);
          transform-origin: center bottom;
        }

        .wb-can {
          width: 300px;
          display: block;
          filter: drop-shadow(0 10px 16px rgba(0, 0, 0, 0.22));
          transform: translate(16px, 10px);
        }


        .wb-tabs {
          display: flex;
          gap: 10px;
        }

        .wb-tab {
          flex: 1;
          border-radius: 999px;
          padding: 7px 12px;
          text-align: center;
          font-size: 16px;
          font-weight: 900;
          color: #fff4db;
          background: linear-gradient(180deg, rgba(117, 51, 16, 0.96), rgba(70, 24, 7, 0.96));
          border: 2px solid rgba(255, 212, 124, 0.28);
        }

        .wb-tab.active {
          background: linear-gradient(180deg, #d3732d, #963f1a);
        }

        .wb-message {
          min-height: 28px;
          margin: 2px 0 6px;
          text-align: center;
          font-size: 23px;
          line-height: 1.2;
          white-space: normal;
          font-weight: 900;
          color: #fff0c8;
        }

        .wb-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .wb-action {
          border: none;
          border-radius: 18px;
          min-height: 138px;
          padding: 12px 10px 12px;
          font: inherit;
          color: #fff8eb;
          background: linear-gradient(180deg, rgba(62, 24, 8, 0.96), rgba(35, 11, 4, 0.98));
          border: 2px solid rgba(255, 219, 140, 0.3);
          cursor: pointer;
          transition: transform 0.15s ease, filter 0.15s ease;
          font-size: 18px;
          font-weight: 900;
        }

        .wb-action:hover { transform: translateY(-2px); }
        .wb-action.right { background: linear-gradient(180deg, #548d1d, #2a5010); }
        .wb-action.wrong { background: linear-gradient(180deg, #b74729, #6d1b0f); }

        .wb-action img {
          width: 150px;
          height: 150px;
          display: block;
          margin: 0 auto 25px;
          object-fit: contain;
        }

        .wb-pray {
          position: absolute;
          right: 0;
          bottom: 8px;
          width: 230px;
          min-height: 88px;
          border: none;
          border-radius: 24px;
          background: url('${v}') center/100% 100% no-repeat;
          font: inherit;
          font-size: 16px;
          font-weight: 900;
          color: #fff7e1;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
          cursor: pointer;
          padding: 0 18px;
        }

        .wb-pray[disabled] {
          opacity: 0.52;
          cursor: default;
          filter: grayscale(0.18);
        }

        .wb-overlay {
          position: absolute;
          inset: 0;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.58);
        }

        .wb-card,
        .wb-result {
          width: min(92vw, 860px);
          border-radius: 32px;
          background: linear-gradient(180deg, rgba(71, 27, 8, 0.96), rgba(35, 11, 3, 0.98));
          border: 2px solid rgba(255, 218, 140, 0.42);
          color: #fff2da;
          box-shadow: 0 24px 38px rgba(0, 0, 0, 0.32);
          text-align: center;
          padding: 28px;
        }

        .wb-card h2,
        .wb-result h2 {
          margin: 0;
          font-size: 42px;
        }

        .wb-card p,
        .wb-result p {
          margin: 14px auto 0;
          max-width: 720px;
          font-size: 21px;
          line-height: 1.6;
          color: #c60000;
        }

        .wb-startimg {
          width: min(100%, 700px);
          aspect-ratio: 16 / 9;
          margin: 0 auto 18px;
          background: url('${c}') center/contain no-repeat;
        }

        .wb-mainbtn,
        .wb-subbtn {
          border: none;
          border-radius: 999px;
          font: inherit;
          font-weight: 900;
          cursor: pointer;
        }

        .wb-mainbtn {
          margin-top: 18px;
          padding: 14px 30px;
          background: linear-gradient(180deg, #d67422, #954117);
          color: #fff9e8;
        }

        .wb-subbtn {
          margin-top: 10px;
          padding: 10px 18px;
          background: rgba(255, 244, 216, 0.14);
          color: #fff1d3;
        }

        .wb-count {
          font-size: 132px;
          font-weight: 900;
          color: #ffffff;
        }

        .wb-result {
          background: rgba(235, 250, 255, 0.7);
          color: #683105;
        }

        .wb-result strong {
          display: block;
          margin-top: 12px;
          font-size: 36px;
        }

        #wb-final-fortune {  //คำทำนายจากเซียมซี
          color: #b71c1c;
          font-weight: 900;
        }

        #wb-final-meta {
          color: #b71c1c;
          font-weight: 900;
        }

        .wb-wish {
          margin-top: 18px;
          text-align: left;
        }

        .wb-wish label {
          display: block;
          margin-bottom: 8px;
          color: #864615;
          font-size: 16px;
          font-weight: 800;
        }

        .wb-wish textarea {
          width: 100%;
          min-height: 110px;
          box-sizing: border-box;
          resize: none;
          border-radius: 18px;
          border: 2px solid rgba(191, 122, 56, 0.22);
          background: #fffdf8;
          color: #5e2d05;
          padding: 14px 16px;
          font: inherit;
          font-size: 16px;
        }

        .wb-note {
          margin-top: 8px;
          color: #8a5019;
          font-size: 15px;
        }

        @media (max-width: 980px) {
          .wb-wrap {
            grid-template-columns: 1fr;
          }

          .wb-top {
            grid-template-columns: 1fr;
          }

          .wb-left {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .wb-bottom {
            width: 100%;
            padding-right: 0;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
        }

        @media (max-width: 780px) {
          .wb-wrap { padding: 15px; }
          .wb-left { grid-template-columns: 1fr; }
          .wb-title { font-size: 40px; }
          .wb-sub { font-size: 16px; }
          .wb-message { font-size: 25px; }
          .wb-grid { grid-template-columns: 1fr; }
          .wb-pray {
            position: static;
            width: 100%;
            min-height: 90px;
            font-size: 23px;
          }
          .wb-bubble { font-size: 20px; }
        }
      </style>
      <div class="wb-root">
        <div class="wb-bg"></div>
        <div class="wb-glow"></div>
        <div class="wb-wrap">
          <div class="wb-top">
            <div class="wb-mini"><div class="wb-coin"></div><strong>คะแนน 0</strong></div>
            <div class="wb-sign">
              <div class="wb-title">ซุ้มไหว้พระขอพร</div>
              <div class="wb-sub">พิธีปิดท้ายอย่างเป็นมงคล กดธูป เทียน ดอกบัว ให้ครบตามลำดับ แล้วจึงไหว้พระขอพรและเสี่ยงเซียมซี</div>
            </div>
            <div class="wb-mini"><strong>เวลาที่เหลือ <span id="wb-timer">45</span> วิ</strong></div>
          </div>

          <div class="wb-left">
            <div class="wb-side wb-monk-box">
              <div class="wb-bubble">เจริญพรญาติโยม</div>
              <img class="wb-monk" src="${g}" alt="พระอาจารย์" />
            </div>
            <div class="wb-status-card">
              <div class="wb-status-title">สถานะพิธี</div>
              <div class="wb-status-row"><span>พิธีสำเร็จ</span><strong id="wb-progress">0 / 1</strong></div>
              <div class="wb-status-row"><span>ลำดับที่ทำ</span><strong id="wb-order">0 / 3</strong></div>
              <div class="wb-status-row"><span>เริ่มพิธี</span><strong id="wb-state">รอเริ่ม</strong></div>
              <div class="wb-status-row"><span>พลาด</span><strong id="wb-mistakes">0</strong></div>
            </div>
          </div>

          <div class="wb-main">
            <div class="wb-stage">
              <div class="wb-stage-col left"></div>
              <div class="wb-stage-col right"></div>
              <div class="wb-ribbon left"></div>
              <div class="wb-ribbon right"></div>
              <div class="wb-halo"></div>
              <img class="wb-buddha" src="${m}" alt="พระพุทธรูป" />
              <div class="wb-altar-shadow"></div>
              <div class="wb-altar">
                <div class="wb-altar-table">
                  <img class="wb-altar-base" src="${S}" alt="โต๊ะบูชา" />
                </div>
                <div><img class="wb-can" src="${B}" alt="เซียมซี" /></div>
              </div>
            </div>

            <div class="wb-bottom">
              <div class="wb-footer">
                <div id="wb-sequence" class="wb-tabs"></div>
                <div id="wb-msg" class="wb-message">เริ่มจาก รูป</div>
                <div id="wb-grid" class="wb-grid"></div>
              </div>
              <button id="wb-pray" class="wb-pray" disabled>ไหว้พระขอพรและเสี่ยงเซียมซี</button>
            </div>
          </div>
        </div>

        <div id="wb-intro" class="wb-overlay">
          <div class="wb-card">
            <div class="wb-startimg"></div>
            <h2>ซุ้มไหว้พระขอพร</h2>
            <p>ทำพิธีเพียงรอบเดียวตามลำดับ ธูป → เทียน → ดอกบัว เมื่อครบแล้วจึงไหว้พระขอพรและเสี่ยงเซียมซีรับพรกลับบ้านอย่างเป็นมงคล ด่านนี้ไม่นับคะแนนรวม</p>
            <button id="wb-start-btn" class="wb-mainbtn">เริ่มพิธี</button>
          </div>
        </div>

        <div id="wb-countdown" class="wb-overlay" style="display:none">
          <div id="wb-count" class="wb-count">3</div>
        </div>

        <div id="wb-result" class="wb-overlay" style="display:none">
          <div class="wb-result">
            <h2>พรที่ได้รับ</h2>
            <strong id="wb-final-blessing"></strong>
            <p id="wb-final-fortune"></p>
            <p id="wb-final-meta"></p>
            <div class="wb-wish">
              <label for="wb-wish-text">เขียนคำอธิษฐานหรือพรที่อยากขอไว้เป็นสิริมงคล</label>
              <textarea id="wb-wish-text" placeholder="เช่น ขอให้สุขภาพแข็งแรง การงานราบรื่น และมีแต่เรื่องดี ๆ เข้ามา"></textarea>
            </div>
            <button id="wb-finish-btn" class="wb-mainbtn">กลับแผนที่</button>
          </div>
        </div>
      </div>
    `,t.appendChild(this.root),this.timerEl=this.root.querySelector("#wb-timer"),this.progressEl=this.root.querySelector("#wb-progress"),this.orderEl=this.root.querySelector("#wb-order"),this.stateEl=this.root.querySelector("#wb-state"),this.mistakesEl=this.root.querySelector("#wb-mistakes"),this.sequenceEl=this.root.querySelector("#wb-sequence"),this.msgEl=this.root.querySelector("#wb-msg"),this.gridEl=this.root.querySelector("#wb-grid"),this.prayBtn=this.root.querySelector("#wb-pray"),this.introEl=this.root.querySelector("#wb-intro"),this.countdownEl=this.root.querySelector("#wb-countdown"),this.countValueEl=this.root.querySelector("#wb-count"),this.resultEl=this.root.querySelector("#wb-result"),this.finalBlessingEl=this.root.querySelector("#wb-final-blessing"),this.finalFortuneEl=this.root.querySelector("#wb-final-fortune"),this.finalMetaEl=this.root.querySelector("#wb-final-meta"),this.wishInputEl=this.root.querySelector("#wb-wish-text"),r.forEach(i=>{const a=document.createElement("button");a.className="wb-action",a.dataset.stepId=i.id,a.innerHTML=`
        <img src="${i.icon}" alt="${i.label}" />
        ${i.action}
      `,a.addEventListener("click",()=>this.pickStep(i.id,a)),this.gridEl.appendChild(a)}),(s=this.root.querySelector("#wb-start-btn"))==null||s.addEventListener("click",()=>this.startCountdown()),(o=this.prayBtn)==null||o.addEventListener("click",()=>this.finishRitual()),(n=this.root.querySelector("#wb-finish-btn"))==null||n.addEventListener("click",()=>{var i,a,l;(l=this.onGameEnd)==null||l.call(this,{score:0,meta:{mistakes:this.state.mistakes,completed:this.state.completed,blessing:this.state.blessing,fortune:this.state.fortune,wishText:((a=(i=this.wishInputEl)==null?void 0:i.value)==null?void 0:a.trim())??""}})}))}startCountdown(){if(this.state.phase!=="intro")return;this.state.phase="countdown",this.introEl.style.display="none",this.countdownEl.style.display="flex";let t=3;this.countValueEl.textContent="3",this.countdownTimer=window.setInterval(()=>{var e;if(t-=1,t>0){this.countValueEl.textContent=String(t);return}if(t===0){this.countValueEl.textContent="เริ่ม!",(e=this.cache.audio)!=null&&e.exists("worship-bell")&&this.sound.play("worship-bell",{volume:.28});return}window.clearInterval(this.countdownTimer),this.countdownTimer=null,this.countdownEl.style.display="none",this.state.phase="playing",this.msgEl.textContent="เริ่มจาก ธูป",this.startTimer(),this.playCalmBgm(),this.renderState()},1e3)}startTimer(){this.stopTimer(),this.ritualTimer=window.setInterval(()=>{this.state.phase!=="playing"&&this.state.phase!=="ready"||(this.state.timer=Math.max(0,this.state.timer-1),this.timerEl&&(this.timerEl.textContent=String(this.state.timer)),this.state.timer===0&&!this.state.completed&&(this.state.mistakes+=1,this.state.stepIndex=0,this.state.timer=45,this.msgEl.textContent="หมดเวลา ลองเริ่มลำดับใหม่จาก ธูป",this.timerEl&&(this.timerEl.textContent=String(this.state.timer)),this.renderState()))},1e3)}stopTimer(){window.clearInterval(this.ritualTimer),this.ritualTimer=null}playCalmBgm(){var t,e,s;if((t=this.cache.audio)!=null&&t.exists("worship-calm")){(e=this.calmBgm)==null||e.stop(),(s=this.calmBgm)==null||s.destroy(),this.calmBgm=this.sound.add("worship-calm",{loop:!0,volume:.14});try{this.calmBgm.play()}catch{}}}pickStep(t,e){var n,i;if(this.state.phase!=="playing")return;const o=((n=r[this.state.stepIndex])==null?void 0:n.id)===t;if(e.classList.remove("right","wrong"),e.offsetWidth,e.classList.add(o?"right":"wrong"),window.setTimeout(()=>e.classList.remove("right","wrong"),260),!o){this.state.mistakes+=1,this.state.stepIndex=0,this.msgEl.textContent="ลำดับผิด ต้องเริ่มใหม่จาก ธูป",this.renderState();return}if(this.state.stepIndex+=1,(i=this.cache.audio)!=null&&i.exists("worship-bell")&&this.sound.play("worship-bell",{volume:.24}),this.state.stepIndex>=r.length){this.state.completed=!0,this.state.phase="ready",this.msgEl.textContent="ทำพิธีครบแล้ว กดไหว้พระขอพรและเสี่ยงเซียมซีได้เลย",this.renderState();return}this.msgEl.textContent=`ต่อไป: ${r[this.state.stepIndex].label}`,this.renderState()}finishRitual(){var t,e;this.state.phase==="result"||!this.state.completed||(this.stopTimer(),(t=this.calmBgm)==null||t.stop(),this.state.phase="result",this.state.blessing=b[Math.floor(Math.random()*b.length)],this.state.fortune=p[Math.floor(Math.random()*p.length)],(e=this.cache.audio)!=null&&e.exists("worship-bell")&&this.sound.play("worship-bell",{volume:.4}),this.finalBlessingEl.textContent=this.state.blessing,this.finalFortuneEl.textContent=this.state.fortune,this.finalMetaEl.textContent=`ทำพิธีครบ 1 รอบ พลาด ${this.state.mistakes} ครั้ง แล้วรับพรกลับบ้านอย่างเป็นมงคล`,this.resultEl.style.display="flex",this.renderState())}renderState(){this.timerEl&&(this.timerEl.textContent=String(this.state.timer)),this.progressEl&&(this.progressEl.textContent=`${this.state.completed?1:0} / 1`),this.orderEl&&(this.orderEl.textContent=`${this.state.stepIndex} / ${r.length}`),this.mistakesEl&&(this.mistakesEl.textContent=String(this.state.mistakes)),this.stateEl&&(this.stateEl.textContent=this.state.phase==="ready"?"พร้อมขอพร":this.state.phase==="result"?"รับพรแล้ว":this.state.phase==="playing"?"กำลังทำพิธี":"รอเริ่ม"),this.sequenceEl&&(this.sequenceEl.innerHTML=r.map((t,e)=>`<div class="wb-tab ${e<this.state.stepIndex||e===this.state.stepIndex&&(this.state.phase==="playing"||this.state.phase==="ready")?"active":""}">${t.label}</div>`).join("")),this.prayBtn&&(this.prayBtn.disabled=this.state.phase!=="ready")}cleanup(){var t,e,s;window.clearInterval(this.countdownTimer),this.countdownTimer=null,this.stopTimer(),(t=this.calmBgm)==null||t.stop(),(e=this.calmBgm)==null||e.destroy(),this.calmBgm=null,(s=this.root)!=null&&s.parentNode&&this.root.parentNode.removeChild(this.root),this.root=null}}export{T as W};
