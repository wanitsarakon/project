let score = 0;
let timeLeft = 120; 
let gameActive = true;
let round = 1; 
let customers = [];
let selectedCustomer = null;
let currentInput = [];
let gameTimer = null;
let combo = 0; 
let feverMode = false;

// --- ส่วนที่เพิ่ม: ตัวแปรไอเทมพิเศษ ---
let itemWaterCount = 3;
let itemPowderCount = 1;
let isTimeFrozen = false;
let perfectStreak = 0;

const customerImages = [
    'npc-customer-1.png',
    'npc-customer-21.png',
    'npc-customer-3.png',
    'npc-customer-4.png',
    'npc-customer-5.png'
];

// --- ส่วนที่เพิ่ม: บทพูดตอนสั่งของ ---
const orderDialogs = [
    "สวัสดีจ้า รับร้อยพวงมาลัยแบบนี้หน่อย",
    "ช่วยร้อยพวงมาลัยให้ทีนะจ๊ะ",
    "ขอแบบสวยๆ ไปไหว้พระหน่อยจ้า",
    "รบกวนร้อยตามแบบนี้ให้หน่อยสิ",
    "แม่ค้าจ๋า เอาแบบตามนี้เลยนะ"
];

const angryDialogs = [
    "ทำไมทำแบบนี้! ไม่เอาแล้ว!",
    "ร้อยผิดแบบนี้ ฉันไปร้านอื่นดีกว่า!",
    "นี่มันไม่ใช่ที่สั่งไว้นี่นา! แย่มาก!",
    "เสียเวลาจริงๆ! ฉันรีบนะ!",
    "โถ่เอ๊ย! ทำของสวยๆ เสียหมดเลย!"
];

const npcProfiles = {
    'npc-customer-1.png': { type: 'normal', patience: 45, scoreMult: 1, timeBonus: 0, lengthMod: 0, decay: 0.1 },
    'npc-customer-21.png': { type: 'rusher', patience: 25, scoreMult: 3.0, timeBonus: 0, lengthMod: -2, decay: 0.2 },
    'npc-customer-3.png': { type: 'tourist', patience: 80, scoreMult: 1.5, timeBonus: 0, lengthMod: 5, decay: 0.05 },
    'npc-customer-4.png': { type: 'vip', patience: 40, scoreMult: 1.2, timeBonus: 10, lengthMod: 1, decay: 0.1 },
    'npc-customer-5.png': { type: 'normal', patience: 55, scoreMult: 1.1, timeBonus: 0, lengthMod: 0, decay: 0.08 }
};

function initGame() {
    score = 0;
    timeLeft = 120;
    combo = 0;
    perfectStreak = 0;
    itemWaterCount = 3;
    itemPowderCount = 1;
    isTimeFrozen = false;
    feverMode = false;
    gameActive = true;
    document.body.classList.remove('fever-active');
    const gc = document.getElementById('game-container');
    if(gc) gc.classList.remove('time-frozen');
    
    updateItemUI();
    const scoreVal = document.getElementById('score-val');
    const timerVal = document.getElementById('timer-val');
    if (scoreVal) scoreVal.innerText = score;
    if (timerVal) timerVal.innerText = timeLeft;
    
    if (gameTimer) clearInterval(gameTimer);
    gameTimer = setInterval(updateGlobalTimer, 1000);
    startRound();
}

function updateGlobalTimer() {
    if (!gameActive) return;
    timeLeft--;
    const timerVal = document.getElementById('timer-val');
    if (timerVal) timerVal.innerText = timeLeft;
    if (timeLeft <= 0) endGame();
}

function startRound() {
    const area = document.getElementById('customer-area');
    if (area) area.innerHTML = '';
    customers = [];
    selectedCustomer = null;
    const stack = document.getElementById('garland-stack');
    if (stack) stack.innerHTML = '';
    
    let availableNPCs = [...customerImages];
    availableNPCs.sort(() => Math.random() - 0.5);
    
    let numCustomers = ((round - 1) % 5) + 1; 
    let selectedForThisRound = availableNPCs.slice(0, numCustomers);
    
    for (let i = 0; i < selectedForThisRound.length; i++) {
        const npcImg = selectedForThisRound[i];
        setTimeout(() => { 
            if (gameActive) createCustomer(i, npcImg); 
        }, i * 1500); 
    }
}

function createCustomer(id, npcImage) {
    const area = document.getElementById('customer-area');
    if (!area) return;

    const profile = npcProfiles[npcImage]; 
    const container = document.createElement('div');
    container.id = `cust-${id}`;
    const isLeft = id % 2 === 0;
    const offset = Math.floor(id / 2) * 12; 
    container.className = `customer-container ${isLeft ? 'from-left' : 'from-right'} npc-${profile.type}`;
    
    let minLength = 11;
    let patternLength = Math.min(15, Math.max(minLength, (round + 10) + profile.lengthMod)); 
    let colorVariety = Math.min(5, 3 + Math.floor(round / 4));
    const colors = ["white", "red", "yellow", "green", "purple"].slice(0, colorVariety);
    
    let pattern = [];
    for(let i=0; i < patternLength; i++) pattern.push(colors[Math.floor(Math.random() * colors.length)]);

    // แสดงบทพูดสั่งของก่อนในฟองคำพูด
    container.innerHTML = `
        <div class="patience-bar-bg"><div id="bar-${id}" class="patience-bar-fill"></div></div>
        <div id="bubble-${id}" class="order-bubble show">
            <p class="order-text">${orderDialogs[Math.floor(Math.random() * orderDialogs.length)]}</p>
        </div>
        <div class="customer-sprite" style="background-image: url('image/${npcImage}')"></div>
    `;

    container.onclick = () => selectCustomer(id);
    area.appendChild(container);

    setTimeout(() => {
        if (isLeft) container.style.left = `${2 + offset}vw`;
        else container.style.right = `${2 + offset}vw`;
    }, 100);

    let customerObj = {
        id: id, type: profile.type, npcImage: npcImage, pattern: pattern, patience: profile.patience, 
        maxPatience: profile.patience, isDone: false, isLeft: isLeft, 
        baseImage: npcImage, timer: null
    };

    customerObj.timer = setInterval(() => {
        if (customerObj.isDone || !gameActive || isTimeFrozen) return; 
        
        let speedMult = 1 + (round * 0.05); 
        customerObj.patience -= (profile.decay + (round * 0.02)) * speedMult; 
        
        const fill = document.getElementById(`bar-${id}`);
        const sprite = container.querySelector('.customer-sprite');
        
        if (fill && sprite) {
            const percentage = (customerObj.patience / customerObj.maxPatience * 100);
            fill.style.height = percentage + "%";
            if (percentage < 50 && percentage >= 30) {
                const worriedImg = customerObj.baseImage.replace('.png', '-worried.png');
                sprite.style.backgroundImage = `url('image/${worriedImg}')`;
            }
            if (percentage < 30) {
                container.classList.add('patience-warning');
                fill.style.backgroundColor = "red";
            }
        }
        
        if (customerObj.patience <= 0) {
            clearInterval(customerObj.timer);
            customerLeave(id, true);
        }
    }, 100);
    customers.push(customerObj);
}

function selectCustomer(id) {
    if (!gameActive) return;
    const custObj = customers.find(c => c.id === id);
    if (!custObj || custObj.isDone) return;
    
    document.querySelectorAll('.customer-container').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('.order-bubble').forEach(b => b.classList.remove('show'));
    
    const targetCust = document.getElementById(`cust-${id}`);
    const bubble = document.getElementById(`bubble-${id}`);
    
    if (targetCust && bubble) {
        selectedCustomer = custObj;
        targetCust.classList.add('selected');
        bubble.classList.add('show'); 
        
        // ล้างบทพูดแล้วแสดงดอกไม้แทนเมื่อกดเลือก
        bubble.innerHTML = ''; 
        custObj.pattern.forEach(c => {
            const d = document.createElement('div');
            d.className = `hint-flower f-${c}`;
            d.style.backgroundImage = `url('image/flower-${c}.png')`;
            bubble.appendChild(d);
        });
    }
    
    currentInput = [];
    const stack = document.getElementById('garland-stack');
    if (stack) stack.innerHTML = '';
}

function playAdd(color) {
    if (!gameActive || !selectedCustomer) return;
    const expectedColor = selectedCustomer.pattern[currentInput.length];
    
    if (color === expectedColor) {
        const flowerIndex = currentInput.length;
        currentInput.push(color);
        perfectStreak++;
        const stack = document.getElementById('garland-stack');
        const img = document.createElement('div');
        
        let sizeClass = "f-small";
        if (flowerIndex % 3 === 1) sizeClass = "f-medium";
        else if (flowerIndex % 3 === 2) sizeClass = "f-large";
        
        img.className = `flower-on-garland f-${color} ${sizeClass} flower-pop`;
        img.style.backgroundImage = `url('image/flower-${color}.png')`;
        if (stack) stack.appendChild(img);
        
        if (currentInput.length === selectedCustomer.pattern.length) finishCustomer();
    } else {
        perfectStreak = 0;
        document.getElementById('game-container').classList.add('shake-effect');
        setTimeout(() => document.getElementById('game-container').classList.remove('shake-effect'), 500);
        customerAngryLeave();
    }
}

function useWater() {
    if (itemWaterCount <= 0 || !gameActive || isTimeFrozen) return; 
    
    itemWaterCount--;
    isTimeFrozen = true;
    updateItemUI();
    
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) gameContainer.classList.add('time-frozen'); 
    
    setTimeout(() => {
        isTimeFrozen = false;
        if (gameContainer) gameContainer.classList.remove('time-frozen');
    }, 5000); 
}

function usePowder() {
    if (itemPowderCount <= 0 || !gameActive || !selectedCustomer) return; 
    
    itemPowderCount--;
    updateItemUI();
    
    const bubble = document.getElementById(`bubble-${selectedCustomer.id}`);
    if (bubble) {
        bubble.innerHTML = `<p class="item-success-text">เสร็จทันใจ!</p>`;
    }
    
    currentInput = [...selectedCustomer.pattern]; 
    const stack = document.getElementById('garland-stack');
    if (stack) stack.innerHTML = ''; 
    
    finishCustomer(); 
}

function updateItemUI() {
    const w = document.getElementById('count-water');
    const p = document.getElementById('count-powder');
    if (w) w.innerText = itemWaterCount;
    if (p) p.innerText = itemPowderCount;
}

function customerAngryLeave() {
    if (!selectedCustomer) return;
    combo = 0;
    const custId = selectedCustomer.id;
    const el = document.getElementById(`cust-${custId}`);
    const bubble = document.getElementById(`bubble-${custId}`);
    const sprite = el.querySelector('.customer-sprite');
    
    selectedCustomer.isDone = true;
    clearInterval(selectedCustomer.timer);

    const angryImg = selectedCustomer.baseImage.replace('.png', '-angry.png');
    sprite.style.backgroundImage = `url('image/${angryImg}')`;

    bubble.style.bottom = "auto";
    bubble.innerHTML = `<p class="angry-text">${angryDialogs[Math.floor(Math.random() * angryDialogs.length)]}</p>`;
    bubble.classList.add('show');
    setTimeout(() => {
        const stack = document.getElementById('garland-stack');
        if (stack) stack.innerHTML = '';
        customerLeave(custId, false, true); 
    }, 1200);
    selectedCustomer = null;
}

function finishCustomer() {
    const profile = npcProfiles[selectedCustomer.npcImage];
    combo++;
    
    // คืนค่าหน้าปกติ
    const custId = selectedCustomer.id;
    const el = document.getElementById(`cust-${custId}`);
    if (el) {
        const sprite = el.querySelector('.customer-sprite');
        if (sprite) {
            sprite.style.backgroundImage = `url('image/${selectedCustomer.baseImage}')`;
            el.classList.remove('patience-warning');
        }
    }

    if (combo >= 10 && !feverMode) {
        feverMode = true;
        document.body.classList.add('fever-active');
        setTimeout(() => {
            feverMode = false;
            document.body.classList.remove('fever-active');
        }, 5000);
    }

    let streakBonus = Math.floor(perfectStreak * 5);
    let multiplier = (feverMode ? 2 : 1) * profile.scoreMult;
    score += Math.floor((150 + (combo * 20) + streakBonus) * multiplier);
    
    if (profile.timeBonus > 0) timeLeft += profile.timeBonus;
    
    const scoreVal = document.getElementById('score-val');
    if (scoreVal) scoreVal.innerText = score;
    
    selectedCustomer.isDone = true;
    if (selectedCustomer.timer) clearInterval(selectedCustomer.timer);
    
    const stack = document.getElementById('garland-stack');
    if (stack) {
        const tassel = document.createElement('div');
        tassel.className = 'tassel-garland';
        tassel.style.backgroundImage = `url('image/tassel.png')`;
        stack.appendChild(tassel);
    }
    
    setTimeout(() => {
        if (selectedCustomer) {
            customerLeave(selectedCustomer.id, false, false);
            selectedCustomer = null;
        }
        if (stack) stack.innerHTML = '';
    }, 1200);
}

function customerLeave(id, timedOut, isAngry = false) {
    const el = document.getElementById(`cust-${id}`);
    const custObj = customers.find(c => c.id === id);
    if (!el || !custObj) return;
    
    if (timedOut) {
        combo = 0;
        perfectStreak = 0;
        score = Math.max(0, score - 50);
        const scoreVal = document.getElementById('score-val');
        if (scoreVal) scoreVal.innerText = score;
        el.style.filter = "grayscale(1) brightness(0.5)";
    }
    
    if (isAngry) el.style.transition = "left 0.5s ease-in, right 0.5s ease-in, opacity 0.4s";
    
    if (custObj.isLeft) el.style.left = "-50vh";
    else el.style.right = "-50vh";
    
    el.style.opacity = "0";
    setTimeout(() => { 
        el.remove(); 
        checkRoundEnd(); 
    }, isAngry ? 600 : 1500);
}

window.onload = () => {
    const startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.style.display = 'flex';
};

function startCountdown() {
    document.getElementById('start-screen').style.display = 'none';
    const countdownOverlay = document.getElementById('countdown-overlay');
    const countdownText = document.getElementById('countdown-text');
    
    // ดึง Element เสียง
    const sfx321 = document.getElementById('sfx-321');
    const sfxStart = document.getElementById('sfx-start');
    const bgMusic = document.getElementById('bg-music');

    countdownOverlay.style.display = 'flex';
    let count = 3;
    countdownText.innerText = count;

    // เล่นเสียง 3
    if (sfx321) sfx321.play().catch(e => console.log("Audio blocked"));

    const timer = setInterval(() => {
        count--;
        if (count > 0) {
            countdownText.innerText = count;
            // เล่นเสียง 2 และ 1
            if (sfx321) {
                sfx321.currentTime = 0;
                sfx321.play();
            }
        } else if (count === 0) {
            countdownText.innerText = "เริ่ม!";
            // เล่นเสียง เริ่ม!
            if (sfxStart) sfxStart.play();
            // เริ่มเพลงพื้นหลัง
            if (bgMusic) {
                bgMusic.volume = 0.4;
                bgMusic.play();
            }
        } else {
            clearInterval(timer);
            countdownOverlay.style.display = 'none';
            initGame(); 
        }
    }, 1000);
}

function checkRoundEnd() {
    if (!gameActive) return;
    const remaining = document.querySelectorAll('.customer-container');
    if (remaining.length === 0) {
        round++;
        updateItemUI();
        startRound(); 
    }
}

function endGame() {
    gameActive = false;
    if (gameTimer) clearInterval(gameTimer);
    
    // หยุดเพลงเมื่อจบเกม
    const bgMusic = document.getElementById('bg-music');
    if (bgMusic) bgMusic.pause();

    customers.forEach(c => {
        if (c.timer) clearInterval(c.timer);
    });
    const gc = document.getElementById('game-container');
    if(gc) gc.classList.remove('time-frozen');
    document.body.classList.remove('fever-active');
    const resultScreen = document.getElementById('result-screen');
    const finalScoreText = document.getElementById('final-score-display');
    if (resultScreen && finalScoreText) {
        finalScoreText.innerText = score;
        resultScreen.style.display = 'flex';
    }
}