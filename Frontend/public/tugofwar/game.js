const screens = {
    setup: document.getElementById('setup-page'),
    arena: document.getElementById('game-arena'),
    canvas: document.getElementById('gameCanvas')
};

// เพิ่มฟังก์ชันสำหรับปุ่มหน้าแรก
function enterGame() {
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.style.display = 'none';
    }
    if (screens.setup) {
        screens.setup.style.display = 'block';
    }
}

const ropeImg = new Image();
ropeImg.src = 'images/rope.png'; 

const hoverSound = new Audio('sounds/pick.mp3');    // เสียงตอนเอาเมาส์ชี้
const pickSound = new Audio('sounds/pick.mp3');     // เสียงตอนคลิกเลือกตัวละคร
const clickGeneric = new Audio('sounds/pick.mp3'); // ใช้เสียงเลือกแทนไฟล์คลิกที่ไม่มีในชุด assets

// ตั้งระดับเสียงให้พอดี
hoverSound.volume = 0.3; 
pickSound.volume = 0.5;



// เพิ่มไว้ด้านบนสุดของไฟล์ game.js ร่วมกับเสียงอื่นๆ
const battleBgm = new Audio('sounds/battle_bgm.mp3'); // เปลี่ยน path เป็นไฟล์เพลงของคุณ
battleBgm.loop = true;  // ตั้งให้เล่นวนลูป
battleBgm.volume = 0.4; // ปรับระดับเสียงให้ไม่กลบเสียงเอฟเฟกต์ (0.0 - 1.0)

// เพิ่มไว้ด้านบนสุดของไฟล์ game.js
const cheerSound = new Audio('sounds/cheer.mp3'); // เปลี่ยน path เป็นไฟล์ของคุณ
const freezeSound = new Audio('sounds/timestop.mp3'); // ใช้ไฟล์เสียงหยุดเวลาที่มีอยู่จริงใน branch
// เพิ่มไว้ด้านบนสุดร่วมกับเสียงอื่นๆ
const countSound = new Audio('sounds/count.mp3'); // เสียง ติ๊ด (3, 2, 1)
const startGoSound = new Audio('sounds/start_go.mp3'); // เสียง ปรี๊ด! หรือ เริ่มได้!

const charImages = {};
function getCharImage(src) {
    if (!charImages[src]) {
        charImages[src] = new Image();
        charImages[src].src = `images/${src}`;
    }
    return charImages[src];
}
const HOST_MESSAGE_SOURCE = "tugofwar-game";
const HOST_MESSAGE_END = "tugofwar:end";

const defaultCharacters = [
    { name: 'ผู้ชายผอม', power: 2.0, speed: 1.8, note: 'กดรัวได้ไว', image: 'skinny.png', pullImage: 'skinny_pull.png' },
    { name: 'หนุ่มนักกล้าม', power: 5.0, speed: 0.6, note: 'แรงสูงมาก', image: 'buff.png', pullImage: 'buff_pull.png' },
    { name: 'คนแก่เเต่เท่', power: 3.5, speed: 0.4, note: 'เก๋าเเรงเยอะเเต่เหนื่อยง่าย', image: 'old.png', pullImage: 'old_pull.png' },
    { name: 'เด็ก', power: 1.0, speed: 1.4, note: 'เร็วแต่แรงน้อย', image: 'kid.png', pullImage: 'kid_pull.png' },
    { name: 'ผู้หญิงธรรมดา', power: 2.5, speed: 1.0, note: 'แรงน้อยกว่าผู้ชาย', image: 'woman.png', pullImage: 'woman_pull.png' },
    { name: 'ผู้ชายธรรมดา', power: 4.0, speed: 1.1, note: 'สมดุล', image: 'man.png', pullImage: 'man_pull.png' }
];

let selectedItem = null; // เก็บชื่อไอเท็มที่เลือก
let isItemPhase = false;
let myItem = null;
let aiItem = null;
let myTeam = [], aiTeam = [];
let isMyTurn = false, isPlaying = false; 
let canPick = false; 
let characters = defaultCharacters.map((character) => ({ ...character }));

let perfectZoneMin = 45; // ขอบเขตเริ่มต้นของโซน Perfect (%)
let perfectZoneMax = 55; // ขอบเขตสิ้นสุดของโซน Perfect (%)
let isPerfectHit = false;
// --- ระบบสกิลพิเศษ ---
let canUseCheer = true;   // สกิลเสียงเชียร์
let canUseFreeze = true;  // สกิลหยุด AI
const skillCooldown = 5000; // คูลดาวน์ 5 วินาที
// --- สกิลของผู้เล่น ---
let hasUsedCheer = false;
let hasUsedFreeze = false;

// --- [ใหม่] สกิลของ AI ---
let aiHasUsedCheer = false;  // AI ใช้เสียงเชียร์
let aiHasUsedFreeze = false; // AI ใช้หยุดผู้เล่น

// --- ระบบความเหนื่อยล้า (Stamina System) ---
let playerStamina = 100;
let aiStaminaValue = 100;    
const maxStamina = 100;
const staminaDrain = 4;      
const staminaRecover = 0.4;  
let isExhausted = false;     
const FRAME_DURATION_MS = 1000 / 60;
const MAX_FRAME_DELTA_MS = 50;
let lastGameLoopTime = 0;


// --- ฟิสิกส์และการเคลื่อนที่ ---
let ropePos = 600; 
let playerVelocity = 0;  
let aiVelocity = 0;      
let totalPower = 0, totalSpeed = 0, isSpacePressed = false;

let aiItemUsed = false;
let myItemUsed = false; // เช็คว่าใช้ไอเท็มไปหรือยัง
let canBeFreezed = true; // สำหรับไอเท็มพระเครื่อง
let pullStrength = 1.0;  // สำหรับไอเท็มน้ำมันมวย


// --- ตัวแปร AI ---
let aiTotalPower = 0;
let aiTotalSpeed = 0;
let aiLastPushTime = 0;
let aiNextPushDelay = 150; 
let aiExhaustion = 0; 

fetchChars();

async function fetchChars() {
    try {
        const res = await fetch('characters.json');
        if (!res.ok) throw new Error('Network response was not ok');
        characters = await res.json();
        renderList();
    } catch (e) {
        console.error("Character data load error:", e);
        characters = defaultCharacters.map((character) => ({ ...character }));
        renderList();
    }
}

function notifyHost(type, payload) {
    if (window.parent && window.parent !== window) {
        window.parent.postMessage(
            { source: HOST_MESSAGE_SOURCE, type, payload },
            window.location.origin
        );
        return true;
    }
    return false;
}

function playRPS(pChoice) {
    // --- เพิ่มเสียงตอนกดเลือกตรงนี้ ---
    if (typeof pickSound !== 'undefined') {
        pickSound.pause();         // หยุดเสียงเก่าถ้ามี
        pickSound.currentTime = 0;  // รีเซ็ตเสียง
        pickSound.play().catch(e => console.log("Audio error:", e));
    }
    // ----------------------------

    const opts = ['rock', 'paper', 'scissors'];
    const aiChoice = opts[Math.floor(Math.random() * 3)]; 
    const win = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
    const choicesUI = document.querySelector('.rps-choices');

    const pHandImg = document.getElementById('player-hand');
    const aiHandImg = document.getElementById('ai-hand');

    if (pHandImg && aiHandImg) {
        pHandImg.src = `images/${pChoice}.png`; 
        aiHandImg.src = `images/${aiChoice}.png`;

        pHandImg.classList.add('show');
        aiHandImg.classList.add('show');
    }

    const rpsResult = document.getElementById('rps-result');
    setTimeout(() => {
        if (pChoice === aiChoice) {
            rpsResult.innerText = `เสมอ! เป่าใหม่...`;
            setTimeout(() => {
                if (pHandImg) pHandImg.classList.remove('show');
                if (aiHandImg) aiHandImg.classList.remove('show');
            }, 1000);
            return;
        }
        
        isMyTurn = win[pChoice] === aiChoice;
        canPick = true; 
        rpsResult.innerText = isMyTurn ? `คุณชนะ! เลือกตัวละครได้` : `คุณแพ้! ทีมคู่เเข่งเลือกตัวละครก่อน`;
        
        if (choicesUI) choicesUI.style.display = 'none';
        handleTurn(); 
    }, 600); 
}

function renderList() {
    const list = document.getElementById('char-list');
    list.innerHTML = ''; 

    const charAbilities = [
        {Name: "ผู้ชายผอม", Power: 2.0, Speed: 1.8, Note: "กดรัวได้ไว"},
        {Name: "หนุ่มนักกล้าม", Power: 5.0, Speed: 0.6, Note: "แรงสูงมาก"},
        {Name: "คนแก่เเต่เท่", Power: 3.5, Speed: 0.4, Note: "เก๋าเเรงเยอะเเต่เหนื่อยง่าย"},
        {Name: "เด็ก", Power: 1.0, Speed: 1.4, Note: "เร็วแต่แรงน้อย"},
        {Name: "ผู้หญิงธรรมดา", Power: 2.5, Speed: 1.0, Note: "แรงน้อยกว่าผู้ชาย"},
        {Name: "ผู้ชายธรรมดา", Power: 4.0, Speed: 1.1, Note: "สมดุล"}
    ];

    characters.forEach((c, i) => {
        const div = document.createElement('div');
        div.className = 'char-item has-tooltip'; 
        div.id = `char-${i}`;
        
        const ability = charAbilities.find(a => a.Name === c.name) || {Power: c.power, Speed: c.speed, Note: ""};

        div.innerHTML = `
            <img src="images/${c.image}" alt="${c.name}">
            <div class="ability-tooltip">
                <div class="tooltip-title">${ability.Name}</div>
                <div class="tooltip-stat"><span>พลัง:</span> <span>${ability.Power}</span></div>
                <div class="tooltip-stat"><span>ความเร็ว:</span> <span>${ability.Speed}</span></div>
                <div class="tooltip-note">${ability.Note}</div>
            </div>
        `;
        div.onclick = () => pick(i);
        list.appendChild(div);
    });
}



function handleTurn() {
    if (myTeam.length >= 3 && aiTeam.length >= 3) {
        if (typeof pickSound !== 'undefined') {
            pickSound.pause();
            pickSound.currentTime = 0;
        }
        
        // เข้าสู่ช่วงเลือกไอเท็ม
        document.getElementById('char-list').style.display = 'none';
        document.getElementById('item-selection-area').style.display = 'block';
        
        // ตรวจสอบว่าใครต้องเลือกไอเท็มก่อน (ตามลำดับล่าสุด)
        if (!isMyTurn) {
            document.getElementById('turn-display').innerText = "ตาทีมคู่เเข่งเลือก...";
            setTimeout(aiPickItem, 1000);
        } else {
            document.getElementById('turn-display').innerText = "ตาทีมคุณเลือก...";
        }
        return;
    }
    
    if (!isMyTurn) {
        document.getElementById('turn-display').innerText = "ตาทีมคู่เเข่งเลือก...";
        setTimeout(aiPick, 1000);
    } else {
        document.getElementById('turn-display').innerText = "ตาทีมคุณเลือก...";
    }
}
function startItemPhase() {
    // 1. ซ่อนหน้าเลือกตัวละคร
    document.getElementById('char-list').style.display = 'none';
    document.getElementById('item-selection-area').style.display = 'block';
    
    // 2. รีเซ็ตหน้าเป่ายิงฉุบใหม่เพื่อหาคนเลือกไอเท็มก่อน
    document.getElementById('rps-ui').style.display = 'block';
    document.getElementById('turn-display').innerText = "เป่ายิงฉุบเพื่อเลือกไอเท็มก่อน!";
    
    // แก้ไข callback ของเป่ายิงฉุบชั่วคราวเพื่อให้รู้ว่าเป็นการเลือกไอเท็ม
    // (ในฟังก์ชัน rps เลือกผู้ชนะ ให้เช็ค if(isItemPhase) แล้วสั่งเปิดหน้า item-list-container)
}

function selectItem(itemName, element) {
    // 1. ตรวจสอบเงื่อนไข: ต้องเป็นตาเรา, เรายังไม่มีไอเท็ม, และไอเท็มนี้ต้องยังไม่ถูกเลือก (กันพลาด)
    if (!isMyTurn || myItem || element.classList.contains('item-disabled')) return;

    // 2. ใส่ข้อมูลไอเท็มที่เลือก
    myItem = itemName;

    // 3. เล่นเสียงตอนกด (ใช้ pickSound ตัวเดียวกับตัวละคร)
    if (pickSound) {
        pickSound.currentTime = 0;
        pickSound.play().catch(e => console.log("Audio play error:", e));
    }

    // 4. แสดงรูปใน Slot (Slot ที่ 4 หรือ index 3)
    const slots = document.getElementById('my-team-slots').children;
    if (slots[3]) {
        slots[3].innerHTML = `<img src="images/item_${itemName}.png" style="width:100%; height:100%; object-fit:contain;">`;
        slots[3].classList.add('has-char');
    }

    // 5. ปรับสถานะรูปที่ถูกเลือกให้กดซ้ำไม่ได้ (ใช้ class ที่เราสร้างใน CSS)
    element.classList.add('item-disabled');

    // 6. สลับเทิร์นไปให้ AI
    isMyTurn = false;
    
    // หน่วงเวลาเล็กน้อยก่อน AI เลือก เพื่อความสมจริง
    setTimeout(() => {
        checkItemPhaseEnd();
    }, 1000);
}

function aiPickItem() {
    // ตรวจสอบเงื่อนไขการเลือก
    if (isMyTurn || aiItem) return;

    // แก้ไขชื่อให้ตรงกับไฟล์ภาพ: amulet, drink, oil
    const items = ['amulet', 'drink', 'oil']; 
    
    // กรองไม่ให้ AI เลือกซ้ำกับผู้เล่น
    let availableItems = items.filter(it => it !== myItem);
    aiItem = availableItems[Math.floor(Math.random() * availableItems.length)];

    // แสดงรูปใน Slot ฝั่ง AI (Slot ที่ 4 คือ index 3)
    const aiSlots = document.getElementById('ai-team-slots').children;
    if (aiSlots[3]) {
        // ใช้ template literal เรียกชื่อไฟล์ให้ถูก
        aiSlots[3].innerHTML = `<img src="images/item_${aiItem}.png" style="width:100%; height:100%; object-fit:contain;">`;
        aiSlots[3].classList.add('has-char');
    }

    // เล่นเสียงตอนเลือก (เพื่อให้เหมือนตัวละคร)
    if (pickSound) {
        pickSound.currentTime = 0;
        pickSound.play().catch(e => {});
    }

    // ทำให้ไอเท็มในหน้าจอเลือกกลายเป็นสีเทา (ห้ามผู้เล่นเลือกซ้ำ)
    const itemElements = document.querySelectorAll('#item-selection-area .char-item');
    itemElements.forEach(el => {
        if (el.getAttribute('onclick') && el.getAttribute('onclick').includes(aiItem)) {
            el.classList.add('item-disabled'); 
        }
    });

    isMyTurn = true;
    checkItemPhaseEnd();
}

function checkItemPhaseEnd() {
    if (myItem && aiItem) {
        document.getElementById('turn-display').innerText = "เตรียมตัวเข้าสู่สนาม!";
        setTimeout(prepareArena, 1500);
    } else {
        if (!isMyTurn) {
            document.getElementById('turn-display').innerText = "ตาทีมคู่เเข่งเลือก...";
            setTimeout(aiPickItem, 1000);
        } else {
            document.getElementById('turn-display').innerText = "ตาทีมคุณเลือก...";
        }
    }
}

function pick(i) {
    const charEl = document.getElementById(`char-${i}`);
    
    // ตรวจสอบเงื่อนไขการเลือกก่อนเล่นเสียง
    if (!canPick || !isMyTurn || myTeam.length >= 3 || charEl.classList.contains('selected')) return;

    // เล่นเสียงเฉพาะเมื่อผ่านเงื่อนไขด้านบนแล้วเท่านั้น
    pickSound.pause();        
    pickSound.currentTime = 0; 
    pickSound.play().catch(e => console.log("Audio play error:", e));

    myTeam.push(characters[i]);
    updateSlots('my-team-slots', myTeam);
    charEl.classList.add('selected');
    isMyTurn = false; 
    handleTurn();
}
function enableCharHoverSounds() {
    const items = document.querySelectorAll('.char-item');
    items.forEach(item => {
        item.addEventListener('mouseenter', () => {
            // เล่นเสียงเฉพาะตอนที่ canPick เป็น true และเรายังเลือกไม่ครบ 3 คน
            if (canPick && myTeam.length < 3 && !item.classList.contains('selected')) {
                hoverSound.currentTime = 0;
                hoverSound.play().catch(e => {});
            }
        });
    });
}
function aiPick() {
    // --- จุดที่ต้องเพิ่ม: ถ้ายังไม่เริ่มเกม (canPick เป็น false) ให้ AI หยุดทำงานทันที ---
    if (!canPick) return; 

    const selectable = [];
    characters.forEach((_, i) => {
        const el = document.getElementById(`char-${i}`);
        if (el && !el.classList.contains('selected')) {
            selectable.push(i);
        }
    });

    if (selectable.length > 0 && aiTeam.length < 3) {
        // จัดการเสียง
        pickSound.pause();
        pickSound.currentTime = 0;
        pickSound.play().catch(e => console.log("Audio error:", e));

        const idx = selectable[Math.floor(Math.random() * selectable.length)];
        aiTeam.push(characters[idx]);
        updateSlots('ai-team-slots', aiTeam);
        document.getElementById(`char-${idx}`).classList.add('selected');
    }
    
    isMyTurn = true; 
    handleTurn();
}
function updateSlots(id, team) {
    const slots = document.getElementById(id).children;
    team.forEach((char, index) => {
        if (slots[index]) {
            slots[index].innerHTML = `<img src="images/${char.image}">`;
            slots[index].classList.add('has-char');
        }
    });
}

function prepareArena() {
    setupCanvas();
    ropePos = 600;
    playerVelocity = 0;
    aiVelocity = 0;
    playerStamina = maxStamina;
    aiStaminaValue = 100;
    isExhausted = false;
    aiExhaustion = 0;
    aiLastPushTime = 0;
    aiNextPushDelay = 150;
    lastGameLoopTime = 0;
    
    totalPower = myTeam.reduce((s, c) => s + (c.power || 0), 0);
    totalSpeed = myTeam.reduce((s, c) => s + (c.speed || 0), 0);
    aiTotalPower = aiTeam.reduce((s, c) => s + (c.power || 0), 0);
    aiTotalSpeed = aiTeam.reduce((s, c) => s + (c.speed || 0), 0);
    
    screens.setup.style.display = 'none';
    screens.arena.style.display = 'block';
    
    // --- เพิ่มบรรทัดนี้เพื่อแสดงรูปไอเท็มในหน้าแข่ง ---
    showItemInArena(); 
    // ------------------------------------------

    document.getElementById('game-container').style.backgroundImage = "url('images/bg21.png')";
    
    if (battleBgm) {
        battleBgm.currentTime = 0;
        battleBgm.play().catch(e => console.log("BGM Play Error:", e));
    }
    setTimeout(startCountdown, 500);
    requestAnimationFrame(gameLoop);
}

// --- แก้ไขฟังก์ชัน updatePowerBarUI เพื่อวาดโซน Perfect ---
function updatePowerBarUI() {
    const powerFill = document.getElementById('power-fill');
    const indicator = document.getElementById('power-indicator');
    
    // ค้นหาและลบแถบ Perfect Zone เก่าทิ้งเพื่อไม่ให้แสดงผล
    const pZone = document.getElementById('perfect-zone');
    if (pZone) pZone.remove();

    if (powerFill && indicator) {
        let percent = ((ropePos - 100) / 1000) * 100;
        percent = Math.max(0, Math.min(100, percent));
        
        indicator.style.left = percent + "%";
        powerFill.style.width = percent + "%";
    }
}

function updateStaminaUI() {
    const pBar = document.getElementById('stamina-bar');
    const aiBar = document.getElementById('ai-stamina-bar');
    
    if (pBar) {
        pBar.style.width = `${playerStamina}%`;
        pBar.style.backgroundColor = isExhausted ? '#ff5252' : '#00ff00';
    }
    
    if (aiBar) {
        aiStaminaValue = 100 - (aiExhaustion * 2); 
        aiBar.style.width = `${aiStaminaValue}%`;
    }
}




function gameLoop(timestamp) {
    const deltaMs = lastGameLoopTime
        ? Math.min(Math.max(timestamp - lastGameLoopTime, 0), MAX_FRAME_DELTA_MS)
        : FRAME_DURATION_MS;
    const frameScale = deltaMs / FRAME_DURATION_MS;
    lastGameLoopTime = timestamp;

    if (isPlaying) {
        // --- 1. ระบบ Stamina ผู้เล่น ---
        if (playerStamina < maxStamina) {
            playerStamina = Math.min(maxStamina, playerStamina + (staminaRecover * frameScale));
        }
        // ถ้า Exhausted ต้องรอฟื้นถึง 25% ถึงจะหายเหนื่อย
        if (isExhausted && playerStamina > 25) { 
            isExhausted = false;
        }
        updateStaminaUI();

        // --- 2. ระบบการใช้ไอเท็มของ AI ---
        if (ropePos < 500 && aiItem && !aiItemUsed) {
            aiItemUsed = true;
            const aiSlot = document.getElementById('ai-item-slot-arena');
            if (aiSlot) aiSlot.classList.add('item-used');
            
            let aiItemName = (aiItem === 'drink') ? "เครื่องดื่มชูกำลัง" : 
                            (aiItem === 'oil') ? "น้ำมันมวย" : "พระเครื่อง";
            showSkillMessage(`คู่แข่งใช้ ${aiItemName}!`, "#ff5252");

            switch(aiItem) {
                case 'drink': aiExhaustion = 0; break;
                case 'oil': aiVelocity += 25; break;
                // 'amulet' (พระเครื่อง) เป็น Passive ป้องกันอัตโนมัติ ไม่ต้องสั่งในนี้
            }
        }

        // --- 3. คำนวณตำแหน่งเชือกและแรงเฉื่อย ---
        ropePos -= playerVelocity * frameScale; 
        ropePos += aiVelocity * frameScale;
        const drag = Math.pow(0.88, frameScale);
        playerVelocity *= drag; 
        aiVelocity *= drag;

        // --- 4. สกิลติดตัวของ AI (พยายามทำให้ผู้เล่นเป็นตะคริว) ---
        let aiDistress = ropePos < 550;

        if (aiDistress && !aiHasUsedFreeze && Math.random() < 0.003) {
            aiHasUsedFreeze = true;

            // ตรวจสอบ: ถ้าผู้เล่นมีพระเครื่อง (Amulet)
            if (myItem === 'amulet') { 
                showSkillMessage("พระคุ้มครอง! ป้องกันตะคริวสำเร็จ", "#ffffff");
                const playerImgs = document.querySelectorAll('#my-team-slots .slot img');
                playerImgs.forEach(img => {
                    img.style.filter = "brightness(2) drop-shadow(0 0 10px white)";
                    setTimeout(() => img.style.filter = "none", 800);
                });
            } else {
                // --- กรณีไม่มีพระเครื่อง: พลังกายลดจนหมดทันที! ---
                playerStamina = 0; 
                isExhausted = true; 
                showSkillMessage("คุณเป็นตะคริว! พลังกายเหลือศูนย์", "#ff5252");
                
                if (freezeSound) {
                    freezeSound.currentTime = 0;
                    freezeSound.play().catch(e => console.log(e));
                }

                const playerImgs = document.querySelectorAll('#my-team-slots .slot img');
                playerImgs.forEach(img => {
                    img.style.filter = "sepia(1) saturate(5) hue-rotate(-50deg)";
                    setTimeout(() => img.style.filter = "none", 3000);
                });

                triggerVibrate(80); // สั่นแรงพิเศษเมื่อผู้เล่นโดนเอง
                updateStaminaUI();
            }
        }

        // --- 5. Logic การดึงปกติของ AI ---
        if (timestamp - aiLastPushTime > aiNextPushDelay) {
            const pushStrength = ((aiTotalPower / 8.5) * (aiTotalSpeed / 4));
            let aiOilBonus = (aiItem === 'oil') ? 1.15 : 1.0;
            aiVelocity += (pushStrength * aiOilBonus);
            
            aiExhaustion += 0.5;
            if (aiExhaustion > 50) aiExhaustion = 0; 

            let baseDelay = Math.max(110, 190 - (aiTotalSpeed * 2));
            aiNextPushDelay = baseDelay + aiExhaustion + (Math.random() * 60);
            aiLastPushTime = timestamp;
        }

        // --- 6. ตรวจสอบเงื่อนไขแพ้ชนะ ---
        if (ropePos < 100) return end("คุณชนะแล้ว!");
        if (ropePos > 1100) return end("ทีมคู่เเข่ง ชนะแล้ว...");
    }
    renderGame();
    requestAnimationFrame(gameLoop);
}

function renderGame() {
    const ctx = screens.canvas.getContext('2d');
    const screenW = window.innerWidth;
    
    ctx.clearRect(0, 0, screens.canvas.width, screens.canvas.height);
    ctx.imageSmoothingEnabled = true;

    const visualRopePos = (ropePos / 1200) * screenW;
    const targetHeight = 350; 
    const posY = 200;          
    const ropeY = 360;        
    const ropeThickness = 270; 

    if (ropeImg.complete) {
        const extendedRopeW = screenW * 3; 
        ctx.drawImage(
            ropeImg, 
            visualRopePos - (extendedRopeW / 2), 
            ropeY - (ropeThickness / 2),         
            extendedRopeW,                       
            ropeThickness                        
        );
    }

    myTeam.forEach((char, i) => {
        const img = getCharImage(char.pullImage);
        if (img.complete) {
            const ratio = img.naturalWidth / img.naturalHeight;
            const targetWidth = targetHeight * ratio;
            const x = visualRopePos - targetWidth - (i * 90) - 35; 
            ctx.save();
            ctx.translate(x + targetWidth / 2, posY + targetHeight / 2);
            ctx.scale(-1, 1);
            ctx.drawImage(img, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight); 
            ctx.restore();
        }
    });

    aiTeam.forEach((char, i) => {
        const img = getCharImage(char.pullImage);
        if (img.complete) {
            const ratio = img.naturalWidth / img.naturalHeight;
            const targetWidth = targetHeight * ratio;
            const x = visualRopePos + (i * 90) + 35;
            ctx.drawImage(img, x, posY, targetWidth, targetHeight);
        }
    });

    ctx.save();
    const flagWidth = 50;
    const poleHeight = 60;
    ctx.fillStyle = '#333';
    ctx.fillRect(visualRopePos - 2, ropeY - (poleHeight / 2), 4, poleHeight);
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.moveTo(visualRopePos + 2, ropeY - (poleHeight / 2) + 5);
    ctx.lineTo(visualRopePos + 2 + flagWidth, ropeY - (poleHeight / 2) + 5 + 17.5);
    ctx.lineTo(visualRopePos + 2, ropeY - (poleHeight / 2) + 5 + 35);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    updatePowerBarUI();
}

function end(m) { 
    isPlaying = false; 
    if (screens.arena) screens.arena.style.display = 'none';
    const won = m.includes("คุณชนะ");
    const score = won ? 100 : 0;
    
    const resultScreen = document.getElementById('result-screen');
    const resultStatus = document.getElementById('result-status'); // ถ้ามี ID นี้ใน HTML
    const totalScoreDisplay = document.getElementById('total-score');
    if (battleBgm) {
        battleBgm.pause();
    }
    if (resultScreen) {
        resultScreen.style.display = 'flex'; 
        
        // ตรวจสอบเงื่อนไขการชนะ/แพ้
        if (won) {
            if (resultStatus) resultStatus.innerText = "ยินดีด้วย คุณชนะ!";
            if (totalScoreDisplay) {
                totalScoreDisplay.innerText = String(score); // ชนะได้ 100 คะแนน
                totalScoreDisplay.style.color = "#ffeb3b"; // สีเหลืองทอง
            }
        } else {
            if (resultStatus) resultStatus.innerText = "น่าเสียดาย คุณแพ้!";
            if (totalScoreDisplay) {
                totalScoreDisplay.innerText = String(score); // แพ้ได้ 0 คะแนน
                totalScoreDisplay.style.color = "#ff5252"; // สีแดง
            }
        }
    }

    // ในโปรเจคหลักให้ส่งผลลัพธ์กลับไปที่ Phaser scene แทนการ reload ตัวเอง
    setTimeout(() => {
        if (!notifyHost(HOST_MESSAGE_END, { score, won, game: "TugOfWar" })) {
            location.reload();
        }
    }, 5000);
}

// 1. สร้างฟังก์ชันสำหรับการสั่น (แบบที่รองรับทั้งค่าเดียวและ Array)
function triggerVibrate(pattern) {
    if ("vibrate" in navigator) {
        navigator.vibrate(pattern);
    }
}
// ฟังก์ชันสำหรับให้ AI แช่แข็งผู้เล่น
function aiUseFreezeSkill() {
    if (!isPlaying || aiHasUsedFreeze) return;

    // ตรวจสอบว่าผู้เล่นมีไอเท็มพระ (amulet) หรือไม่
    if (myItem === 'amulet') {
        showSkillMessage("คู่แข่งพยายามแช่แข็ง แต่คุณมีพระคุ้มครอง!", "#ffffff");
        aiHasUsedFreeze = true; // ให้ถือว่าใช้ไปแล้วแต่ไม่ได้ผล
        return;
    }

    // --- เริ่มการแช่แข็ง ---
    aiHasUsedFreeze = true;
    const freezeDuration = 3000; // แข็งนาน 3 วินาที (ปรับได้)

    if (freezeSound) {
        freezeSound.currentTime = 0;
        freezeSound.play().catch(e => {});
    }

    // 1. แสดงข้อความเหมือนกัน (เปลี่ยนสีให้เข้ากับน้ำแข็ง)
    showSkillMessage("คุณถูกแช่แข็ง! (3 วินาที)", "#00d4ff");

    // 2. หยุดผู้เล่น (ห้ามกด Spacebar)
    // สมมติว่าใช้ตัวแปร isExhausted หรือสร้างตัวแปรใหม่ชื่อ isPlayerFrozen
    const originalIsExhausted = isExhausted;
    isExhausted = true; 

    // 3. เปลี่ยนสีตัวละครฝั่งเราเป็นสีน้ำแข็ง
    const myImgs = document.querySelectorAll('#my-team-slots .slot img');
    myImgs.forEach(img => {
        img.classList.add('frozen-unit');
    });

    // 4. เมื่อครบเวลา ให้คืนค่าปกติ
    setTimeout(() => {
        isExhausted = originalIsExhausted;
        
        myImgs.forEach(img => {
            img.classList.remove('frozen-unit');
        });
    }, freezeDuration);
}

function useSkillD() {
    if (!isPlaying || hasUsedFreeze) return;
    
    if (freezeSound) {
        freezeSound.currentTime = 0; 
        freezeSound.play().catch(e => console.log(e));
    }

    hasUsedFreeze = true; 

    // --- ตรวจสอบพระเครื่องของ AI ---
    if (aiItem === 'amulet') {
        showSkillMessage("ศัตรูมีพระเครื่อง! ป้องกันตะคริวได้", "#ffffff");
        const aiImgs = document.querySelectorAll('#ai-team-slots .slot img');
        aiImgs.forEach(img => {
            img.style.filter = "brightness(2) drop-shadow(0 0 10px white)";
            setTimeout(() => img.style.filter = "none", 800);
        });
    } else {
        // --- แก้ไขจุดนี้: ปรับค่าพลังกาย AI ---
        // 1. ถ้าคุณใช้ aiStamina ให้ตั้งเป็น 0
        if (typeof aiStamina !== 'undefined') {
            aiStamina = 0; 
        }
        
        // 2. ถ้าคุณใช้ aiExhaustion (ความเหนื่อย) ให้ตั้งเป็นค่าสูงสุดเพื่อให้ดึงไม่ออก
        if (typeof aiExhaustion !== 'undefined') {
            aiExhaustion = 50; // หรือค่าสูงสุดในเกมของคุณ
        }

        // 3. บังคับสถานะเหนื่อยจัด
        if (typeof aiExhausted !== 'undefined') {
            aiExhausted = true; 
        }

        showSkillMessage("ศัตรูตะคริวกิน! พลังกายหมดหลอด", "#ffeb3b");

        // 4. สั่ง Render หรืออัปเดต UI (ถ้ามีฟังก์ชัน updateAiStaminaUI)
        if (typeof updateAiStaminaUI === 'function') {
            updateAiStaminaUI();
        }

        const aiImgs = document.querySelectorAll('#ai-team-slots .slot img');
        aiImgs.forEach(img => {
            img.style.filter = "sepia(1) saturate(5) hue-rotate(-50deg)"; 
            setTimeout(() => img.style.filter = "none", 3000);
        });
    }

    // จัดการปุ่ม D และคูลดาวน์
    const btnD = document.getElementById('key-d');
    if (btnD) {
        btnD.classList.add('key-active');
        btnD.style.opacity = "0.5";
        // หน่วงเวลาแวบหนึ่งก่อนลบ class active เพื่อให้เห็นปุ่มกด
        setTimeout(() => btnD.classList.remove('key-active'), 200);

        // คูลดาวน์ 10 วินาที
        setTimeout(() => {
            hasUsedFreeze = false;
            if (btnD) btnD.style.opacity = "1";
        }, 10000); 
    }

}function useSkillS() {
    if (!isPlaying || hasUsedCheer) return;

    // --- นำการเล่นเสียงเชียร์กลับมา ---
    cheerSound.currentTime = 0;
    cheerSound.play().catch(e => console.log("Audio play error:", e));
    // ----------------------------

    triggerVibrate(60); 
    hasUsedCheer = true;
    
    showSkillMessage("คุณใช้เสียงเชียร์เพิ่มพลัง!", "#ffff00");

    const btnS = document.getElementById('key-s');
    if (btnS) {
        btnS.classList.add('key-active');
        setTimeout(() => btnS.classList.remove('key-active'), 200);
    }
}

// 4. เชื่อมโยง Event การ "คลิก" (สำหรับมือถือ/เมาส์) เข้ากับรูปภาพปุ่มโดยตรง
function bindTouchControls() {
    const btnS = document.getElementById('key-s');
    const btnD = document.getElementById('key-d');
    const btnSpace = document.getElementById('key-space');

    if (btnS) {
        btnS.style.cursor = "pointer"; // เปลี่ยนเมาส์เป็นรูปมือ
        btnS.onclick = () => useSkillS();
    }
    if (btnD) {
        btnD.style.cursor = "pointer";
        btnD.onclick = () => useSkillD();
    }
    if (btnSpace) {
        btnSpace.style.cursor = "pointer";
        btnSpace.onclick = () => {
            // จำลองการกด Spacebar
            const event = new KeyboardEvent('keydown', { code: 'Space' });
            window.dispatchEvent(event);
            setTimeout(() => {
                const upEvent = new KeyboardEvent('keyup', { code: 'Space' });
                window.dispatchEvent(upEvent);
            }, 100);
        };
    }
}

// เรียกใช้งานฟังก์ชันเชื่อมปุ่ม (ใส่ไว้ในตอนเริ่มเกม หรือท้ายไฟล์)
bindTouchControls();

// 5. ปรับปรุง window.onkeydown เดิมให้เรียกใช้ฟังก์ชันกลาง
window.onkeydown = (e) => {
    if (!isPlaying) return;

    if (e.code === 'Space' && !isSpacePressed) {
        isSpacePressed = true;
        
        // คำนวณพลังดึงแบบปกติ (ตัดระบบ Perfect ออก)
        let finalPower = (totalPower / 8) * (totalSpeed / 4);

        // เช็คสถานะเหนื่อย (ถ้าเหนื่อยพลังดึงจะลดลงครึ่งหนึ่ง)
        let staminaMultiplier = isExhausted ? 0.5 : 1.0;
        finalPower *= staminaMultiplier;
        
        // สั่นเบาๆ เมื่อกดดึง
        triggerVibrate(20); 

        playerVelocity += finalPower;

        // ระบบ Stamina
        playerStamina -= staminaDrain;
        if (playerStamina <= 0) {
            playerStamina = 0;
            isExhausted = true;
            // ส่วนนี้ถ้าไม่ต้องการข้อความ "คุณเหนื่อยจัด" สามารถลบบรรทัดล่างนี้ออกได้ครับ
            showSkillMessage("คุณเหนื่อยจัด!", "#ff5252");
        }
    }

    // เรียกใช้ฟังก์ชันสกิล S และ D ปกติ
    if (e.code === 'KeyS') useSkillS();
    if (e.code === 'KeyD') useSkillD();
};
function showSkillMessage(text, color = '#ffeb3b') {
    const msg = document.createElement('div');
    msg.innerText = text;
    msg.style.position = 'fixed';
    msg.style.top = '30%'; 
    msg.style.left = '50%';
    msg.style.transform = 'translateX(-50%)';
    msg.style.color = color;
    msg.style.fontSize = '32px';
    msg.style.fontWeight = 'bold';
    msg.style.fontFamily = 'Kanit';
    msg.style.zIndex = '10000';
    msg.style.textShadow = '2px 2px 10px rgba(0,0,0,0.8)';
    msg.style.pointerEvents = 'none';
    msg.style.transition = 'all 0.5s ease-out';
    
    document.body.appendChild(msg);

    setTimeout(() => { msg.style.top = '25%'; }, 10);
    setTimeout(() => { 
        msg.style.opacity = '0';
        setTimeout(() => msg.remove(), 500);
    }, 1500);
}

window.onkeyup = (e) => { if (e.code === 'Space') isSpacePressed = false; };

function setupCanvas() {
    const canvas = screens.canvas;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.scale(dpr, dpr);
}
// ส่วนควบคุมคีย์บอร์ด (รวมทุกปุ่มไว้ที่นี่ที่เดียว)
window.addEventListener('keydown', (e) => {
    if (!isPlaying) return; 
    if (e.repeat) return; 

    const key = e.key.toLowerCase();
    const code = e.code;

    // --- ปุ่ม Q: ใช้ไอเท็ม ---
    if (key === 'q') {
        if (myItem && !myItemUsed) {
            useMyItem(); 
        }
    }

    // --- ปุ่ม Space: ดึงเชือก ---
    if (code === 'Space') {
        const btnSpace = document.getElementById('key-space');
        if (btnSpace) btnSpace.classList.add('key-active');
        triggerVibrate(25); // สั่นเบาๆ สำหรับการดึงปกติ

        if (!isSpacePressed) {
            isSpacePressed = true;
            let finalPower = (totalPower / 8) * (totalSpeed / 4);
            if (myItem === 'oil') finalPower *= 1.1;
            let staminaMultiplier = isExhausted ? 0.5 : 1.0;
            finalPower *= staminaMultiplier;
            playerVelocity += finalPower;

            let currentDrain = staminaDrain || 2; 
            if (myItem === 'drink') currentDrain *= 0.7;
            
            playerStamina -= currentDrain;
            if (playerStamina <= 0) {
                playerStamina = 0;
                isExhausted = true;
                showSkillMessage("คุณเหนื่อยจัด!", "#ff5252");
            }
        }
    }

    // --- ปุ่ม S: สกิลเชียร์ ---
    if (key === 's') {
        const btnS = document.getElementById('key-s');
        if (btnS) btnS.classList.add('key-active');
        useSkillS();
        triggerVibrate(40); // สั่นมาตรฐาน
    }

    // --- ปุ่ม D: สกิลตะคริวกิน ---
    if (key === 'd') {
        const btnD = document.getElementById('key-d');
        if (btnD) btnD.classList.add('key-active');
        
        // แก้ไข: ให้เรียกใช้ฟังก์ชัน และสั่นแค่ 40 ครั้งเดียวเท่าปุ่ม S
        useSkillD(); 
        triggerVibrate(40); 
    }
});

// อย่าลืมส่วน KeyUp เพื่อเอาสถานะสีปุ่มออก
window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    const code = e.code;
    if ("vibrate" in navigator) navigator.vibrate(0);

    if (key === 's') document.getElementById('key-s')?.classList.remove('key-active');
    if (key === 'd') document.getElementById('key-d')?.classList.remove('key-active');
    if (code === 'Space') {
        document.getElementById('key-space')?.classList.remove('key-active');
        isSpacePressed = false;
    }
});

function setupHoverSounds() {
    // เลือกทุกตัวละครที่มีคลาส char-item
    const charItems = document.querySelectorAll('.char-item');
    
    charItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            if (canPick) { // เล่นเสียงเฉพาะตอนที่ยังเลือกตัวละครได้
                hoverSound.currentTime = 0;
                hoverSound.play().catch(e => {}); 
            }
        });
    });
}
document.querySelectorAll('.key-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
        // ใช้ hoverSound ที่คุณมีอยู่แล้วในโค้ด
        if (typeof hoverSound !== 'undefined') {
            hoverSound.currentTime = 0;
            hoverSound.play();
        }
    });
});
// ฟังก์ชันสำหรับเตรียมไอเท็มที่เลือกไว้มาแสดงในหน้าแข่ง
function initItemInArena() {
    const arenaSlot = document.getElementById('my-item-slot-arena');
    if (myItem && arenaSlot) {
        arenaSlot.innerHTML = `<div class="key-hint">Q</div><img src="images/item_${myItem}.png">`;
        myItemUsed = false; // รีเซ็ตสถานะการใช้
    }
}
function useMyItem() {
    if (!myItem || myItemUsed) return;

    myItemUsed = true; // ล็อกทันทีที่กดสำเร็จ
    
    // ทำให้ช่องไอเท็มในหน้าจอแข่งกลายเป็นสีเทา
    const slot = document.getElementById('my-item-slot-arena');
    if (slot) slot.classList.add('item-used');

    if (pickSound) {
        pickSound.currentTime = 0;
        pickSound.play();
    }

    // ตรวจสอบชื่อไอเท็มให้ตรงกับตอนที่เลือก
    switch(myItem) {
        case 'amulet':
            showSkillMessage("พระคุ้มครอง! ป้องกันการหยุดชะงัก", "#ffffff");
            break;
        case 'drink':
            playerStamina = Math.min(100, playerStamina + 40);
            showSkillMessage("สดชื่น! เพิ่มพลังกาย", "#00ff00");
            updateStaminaUI();
            break;
        case 'oil':
            playerVelocity += 30; // เพิ่มแรงดึงทันที
            showSkillMessage("แรงฮึด! ดึงแรงขึ้นชั่วขณะ", "#ffeb3b");
            break;
    }
}
function showItemInArena() {
    // 1. ไอเท็มของผู้เล่น (ฝั่งซ้าย)
    const myArenaSlot = document.getElementById('my-item-slot-arena');
    if (myItem && myArenaSlot) {
        // เปลี่ยนจาก Q เป็น ทีมคุณ
        myArenaSlot.innerHTML = `<div class="key-hint">ไอเท็มทีมคุณ</div><img src="images/item_${myItem}.png">`;
        myItemUsed = false; 
        myArenaSlot.classList.remove('item-used');
    }

    // 2. ไอเท็มของ AI (ฝั่งขวา)
    const aiArenaSlot = document.getElementById('ai-item-slot-arena');
    if (aiItem && aiArenaSlot) {
        // เปลี่ยนจาก AI เป็น คู่แข่ง
        aiArenaSlot.innerHTML = `<div class="key-hint">ไอเท็มทีมคู่แข่ง</div><img src="images/item_${aiItem}.png">`;
        aiItemUsed = false;
        aiArenaSlot.classList.remove('item-used');
    }
}

function useMuscleCrampSkill() {
    // เช็คคูลดาวน์ (ใช้ตัวแปรเดิมจากระบบสกิล D ของคุณ)
    if (!canUseSkillD) return; 

    // --- ผลของอุปสรรค ---
    // 1. ลด Stamina ทันที 40 หน่วย (ไม่ให้ติดลบ)
    playerStamina = Math.max(0, playerStamina - 20);
    
    // 2. บังคับติดสถานะ Exhausted (เหนื่อยจัด) ทันที
    isExhausted = true; 

    // 3. แสดงข้อความแจ้งเตือนให้ผู้เล่นตกใจ
    showSkillMessage("ตะคริวกิน! พลังกายลดฮวบ", "#ff5252");

    // 4. (ทางเลือก) เล่นเสียงเอฟเฟกต์ถ้ามี
    if (typeof freezeSound !== 'undefined') {
        freezeSound.play(); 
    }

    // --- การจัดการระบบ UI และคูลดาวน์ ---
    updateStaminaUI(); // อัปเดตแถบเลือด/พลังกายบนหน้าจอ
    
    canUseSkillD = false;
    const btnD = document.getElementById('key-d');
    if (btnD) btnD.classList.add('key-cooldown');

    // ตั้งเวลาคูลดาวน์ (ตัวอย่างคือ 5 วินาที)
    setTimeout(() => {
        canUseSkillD = true;
        if (btnD) btnD.classList.remove('key-cooldown');
    }, 5000); 
}
function startCountdown() {
    // 1. สร้าง Overlay และตัวเลข (ถ้ายังไม่มีใน index.html)
    let overlay = document.getElementById('countdown-overlay');
    let textDisplay = document.getElementById('countdown-text');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'countdown-overlay';
        textDisplay = document.createElement('div');
        textDisplay.id = 'countdown-text';
        overlay.appendChild(textDisplay);
        document.body.appendChild(overlay);
    }

    // เตรียมตัวแปร
    let count = 3;
    overlay.style.display = 'flex'; // แสดง Overlay
    isPlaying = false; // ป้องกันการกดระหว่างนับ

    const timer = setInterval(() => {
        // รีเซ็ต Animation ของตัวเลขทุกครั้งที่เปลี่ยนเลข (Trick: ลบแล้วใส่ใหม่)
        textDisplay.style.animation = 'none';
        void textDisplay.offsetWidth; // บังคับให้ Browser รีเฟรช DOM
        textDisplay.style.animation = 'countBounce 0.5s ease-out forwards';

        if (count > 0) {
            // --- เล่นเสียงนับถอยหลัง ---
            if (typeof countSound !== 'undefined') {
                countSound.currentTime = 0;
                countSound.play().catch(e => console.log(e));
            }
            
            textDisplay.innerText = count;
            textDisplay.style.color = "#f1c40f"; // สีเหลืองปกติ
            count--;
        } else {
            clearInterval(timer);
            
            // --- เล่นเสียงเริ่มเกม ---
            if (typeof startGoSound !== 'undefined') {
                startGoSound.currentTime = 0;
                startGoSound.play().catch(e => console.log(e));
            }
            
            textDisplay.innerText = "เริ่ม!";
            textDisplay.style.color = "#f1c40f"; // เปลี่ยนเป็นสีเขียวให้ดูสดชื่น
            
            setTimeout(() => {
                overlay.style.display = 'none'; // ซ่อนหน้าจอ
                isPlaying = true; // อนุญาตให้เริ่มเกม
                lastGameLoopTime = performance.now();
                
                // เริ่ม Loop เกมถ้าคุณใช้ requestAnimationFrame
                // requestAnimationFrame(gameLoop); 
            }, 800);
        }
    }, 1000);
}
