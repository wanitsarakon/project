// ==========================================
// 1. CONFIG & DATA
// ==========================================
const recipe = ["ถั่วเหลือง", "น้ำตาลทรายขาว", "กะทิ", "ผงวุ้น", "สีผสมอาหาร", "น้ำเปล่า", "เกลือ"];

const ingredientVisualMap = {
    "ถั่วเหลือง": "fill-bean",
    "น้ำตาลทรายขาว": "fill-sugar",
    "กะทิ": "fill-coconut",
    "ผงวุ้น": "fill-agar",
    "สีผสมอาหาร": "fill-color",
    "น้ำเปล่า": "fill-water",
    "เกลือ": "fill-salt"
};

// ส่วนของเสียง (Audio)
const sfxCount = new Audio('sounds/count.mp3');
const sfxGo = new Audio('sounds/start_game.mp3');
const bgm = new Audio('sounds/bgm.mp3');   
bgm.loop = true;

let steps = []; 
let isGameActive = false;
let gameTimeLeft = 45;
let gameInterval;
let isFinishing = false; 

let currentY = 180; 
let stirProgress = 0;
let lastAngle = null;
let isStirringEnabled = false;

const npcText = document.getElementById("npcText");
const bowl = document.getElementById("mixing-bowl");
const ingredients = document.querySelectorAll('.ingredient');

// ==========================================
// 2. EFFECTS & VISUALS
// ==========================================

function typeEffect(element, text, speed = 50) {
    return new Promise(resolve => {
        element.innerText = "";
        let i = 0;
        function typing() {
            if (i < text.length) {
                element.innerText += text.charAt(i);
                i++;
                setTimeout(typing, speed);
            } else { resolve(); }
        }
        typing();
    });
}

function getStreamColor(name) {
    const colors = {
        "ถั่วเหลือง": "#f3e18a", "น้ำตาลทรายขาว": "#ffffff", "กะทิ": "#ffffff",
        "ผงวุ้น": "rgba(255,255,255,0.7)", "สีผสมอาหาร": "#ff4d4d",
        "น้ำเปล่า": "rgba(120, 199, 226, 0.6)", "เกลือ": "#eeeeee",
        "palm_sugar": "#f2efed", "ไข่ไก่": "#FFD700", "น้ำเชื่อม": "#FFFACD", "กลิ่นผลไม้": "#FF69B4"
    };
    return colors[name] || "#ffffff";
}

const isLiquid = (name) => ["กะทิ", "น้ำเปล่า", "สีผสมอาหาร", "น้ำเชื่อม", "ไข่ไก่", "กลิ่นผลไม้"].includes(name);

function createSplash(parent, color, fallDist) {
    if (Math.random() > 0.4) return;
    const s = document.createElement('div');
    s.className = 'splash';
    s.style.backgroundColor = color;
    s.style.left = (Math.random() * 50) + "px";
    s.style.top = (fallDist + 20) + "px";
    parent.appendChild(s);
    setTimeout(() => s.remove(), 500);
}

function startPourEffect(parent, name, color, fallDist) {
    const container = document.createElement('div');
    container.className = isLiquid(name) ? 'liquid-stream-container' : 'powder-container';
    let pourPosition = (name === "น้ำตาลทรายขาว" || name === "palm_sugar") ? "150px" : "calc(50% - 30px)"; 
    container.style.left = pourPosition; 
    container.style.top = '35%'; 
    parent.appendChild(container);

    const interval = setInterval(() => {
        if (isLiquid(name)) {
            const drop = document.createElement('div');
            drop.className = 'drop'; 
            drop.style.backgroundColor = color;
            drop.style.left = (Math.random() * 5) + "px"; 
            drop.style.setProperty('--ty', (fallDist + 25) + "px");
            container.appendChild(drop);
            createSplash(container, color, fallDist);
            setTimeout(() => drop.remove(), 1200); 
        } else {
            for (let i = 0; i < 4; i++) {
                const grain = document.createElement('div');
                grain.className = 'grain'; 
                grain.style.backgroundColor = color;
                const tx = (Math.random() - 0.5) * 60; 
                const ty = fallDist + (Math.random() * 40);
                grain.style.setProperty('--tx', tx + "px"); 
                grain.style.setProperty('--ty', ty + "px");
                container.appendChild(grain);
                setTimeout(() => grain.remove(), 1000);
            }
        }
    }, 15);
    return interval; 
}

// ==========================================
// 3. STIRRING & FILLING LOGIC
// ==========================================

function updateFillVisual(ingredientName) {
    const visualId = ingredientVisualMap[ingredientName];
    const el = document.getElementById(visualId);
    if (el) {
        el.style.opacity = "1";
        currentY -= 20; 
        if (currentY < 45) currentY = 45; 
        el.style.transform = `translateY(${currentY}px)`;
    }
}

function handleStirring(e) {
    if (!isStirringEnabled || !isGameActive) return;
    const rect = bowl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const currentAngle = Math.atan2(dy, dx);
    const spatula = document.getElementById("spatula");

    if (spatula) {
        let moveX = (e.clientX - rect.left) - 40;
        moveX = Math.max(60, Math.min(180, moveX)); 
        spatula.style.left = moveX + "px";
        const centerPoint = 130; 
        const curveOffset = Math.abs(centerPoint - moveX) * 0.25; 
        spatula.style.bottom = (60 - curveOffset) + "px"; 
        const tilt = Math.max(-25, Math.min(25, dx / 4)); 
        spatula.style.transform = `rotate(${tilt}deg)`;
    }

    if (lastAngle !== null) {
        let delta = currentAngle - lastAngle;
        if (delta > Math.PI) delta -= Math.PI * 2;
        if (delta < -Math.PI) delta += Math.PI * 2;
        stirProgress += Math.abs(delta) * 2.5; 
        const bar = document.getElementById("stir-bar");
        if (bar) bar.style.height = Math.min(stirProgress, 100) + "%";
        if (stirProgress >= 100) finishStirringStep();
    }
    lastAngle = currentAngle;
}

function finishStirringStep() {
    isStirringEnabled = false;
    stirProgress = 0;
    lastAngle = null;
    document.getElementById("stir-progress-container").classList.add("hidden");
    document.getElementById("spatula").classList.add("hidden");
    const stirHint = document.getElementById("stir-hint");
    if (stirHint) stirHint.classList.add("hidden"); 

    if (steps.length === 3) {
        if (npcText && npcText.parentElement) npcText.parentElement.classList.remove("hidden");
        typeEffect(npcText, "ดีมากหลาน! ผสมเข้ากันดีแล้ว ใส่ส่วนผสมที่เหลือต่อได้เลยจ่ะ", 40).then(() => {
            setTimeout(() => {
                if (npcText && npcText.parentElement) npcText.parentElement.classList.add("hidden");
            }, 2000);
        });
    } else if (steps.length === 7) {
        finishGame(false);
    }
}

// ==========================================
// 4. MAIN GAMEPLAY
// ==========================================

ingredients.forEach((item, index) => {
    item.addEventListener('dragstart', (e) => {
        if (!isGameActive || isStirringEnabled) return e.preventDefault();
        e.dataTransfer.setData("text/plain", item.dataset.name);
        e.dataTransfer.setData("elementIndex", index);
    });
});

bowl.addEventListener('dragover', (e) => e.preventDefault());
bowl.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!isGameActive || isStirringEnabled) return;

    const name = e.dataTransfer.getData("text/plain");
    const idx = e.dataTransfer.getData("elementIndex");
    const sourceItem = ingredients[idx];

    if (name && sourceItem) {
        steps.push(name);
        const bowlHint = document.querySelector('.bowl-hint');
        if (bowlHint) bowlHint.classList.add('hidden');
        const rect = sourceItem.getBoundingClientRect();
        sourceItem.style.visibility = "hidden";
        const bowlRect = bowl.getBoundingClientRect();
        const wrapper = document.createElement('div');
        wrapper.className = 'pouring-wrapper';
        wrapper.style.width = rect.width + "px";
        wrapper.style.height = rect.height + "px";
        wrapper.style.left = (bowlRect.left + bowlRect.width / 2 - rect.width / 2) + "px";
        wrapper.style.top = (bowlRect.top - 130) + "px"; 
        document.body.appendChild(wrapper);

        const img = document.createElement('img');
        img.src = `images/${name}.png`;
        img.className = 'item-pouring';
        wrapper.appendChild(img);

        let pourTimer;
        setTimeout(() => { pourTimer = startPourEffect(wrapper, name, getStreamColor(name), 180); }, 400);
        setTimeout(() => {
            if (pourTimer) clearInterval(pourTimer);
            updateFillVisual(name); 
        }, 1400);

        setTimeout(() => {
            wrapper.remove();
            if (steps.length === 3 || steps.length === 7) {
                setTimeout(() => {
                    isStirringEnabled = true;
                    stirProgress = 0;
                    document.getElementById("stir-bar").style.height = "0%";
                    document.getElementById("stir-progress-container").classList.remove("hidden");
                    document.getElementById("spatula").classList.remove("hidden");
                    document.getElementById("stir-hint").classList.remove("hidden");
                    const msg = (steps.length === 3) 
                        ? "ใส่ครบสามอย่างแล้ว อย่าลืมคนผสมให้เข้ากันก่อนนะหลาน!" 
                        : "รอบสุดท้ายแล้ว คนให้เนื้อเนียนเลยนะจ๊ะ ขนมจะได้สวยๆ";
                    if (npcText && npcText.parentElement) npcText.parentElement.classList.remove("hidden");
                    typeEffect(npcText, msg, 40);
                    bowl.addEventListener('mousemove', handleStirring);
                }, 500);
            }
        }, 2500);
    }
});

// ==========================================
// 5. FLOW & FINISH
// ==========================================

function speak(text, duration) {
    return new Promise(resolve => { 
        typeEffect(npcText, text, 40).then(() => setTimeout(resolve, duration));
    });
}

async function startGameFlow() {
    steps = []; isFinishing = false; gameTimeLeft = 45; currentY = 180; stirProgress = 0;
    bgm.pause(); bgm.currentTime = 0;
    document.getElementById("stir-hint").classList.add("hidden");
    document.querySelectorAll('.filling-asset').forEach(el => {
        el.style.opacity = "0";
        el.style.transform = "translateY(180px)";
    });
    ingredients.forEach(img => img.style.visibility = "visible");
    document.querySelector('.bowl-hint').classList.remove('hidden');
    if (npcText && npcText.parentElement) npcText.parentElement.classList.remove("hidden");
    
    await speak("มาหลาน... ยายจะบอกสูตรลูกชุบให้ฟังนะ ตั้งใจฟังล่ะ", 2000);
    for (let i = 0; i < recipe.length; i++) { await speak(`ขั้นตอนที่ ${i + 1}: ใส่ "${recipe[i]}"`, 1000); }
    await speak("ใส่ส่วนผสมแล้ว อย่าลืมคนให้เข้ากันตามที่ยายบอกด้วยนะหลาน... เริ่มได้!", 2000);
    
    await startCountdown();
    startGameplay();
}

function startCountdown() {
    return new Promise(resolve => {
        const overlay = document.getElementById("countdown-overlay");
        const cdText = document.getElementById("countdown-text");
        if (npcText && npcText.parentElement) npcText.parentElement.classList.add("hidden");
        overlay.style.display = "flex"; 
        const counts = [3, 2, 1, "เริ่ม!"];
        let index = 0;
        const interval = setInterval(() => {
            if (index < counts.length) {
                cdText.innerText = counts[index];
                cdText.style.animation = 'none';
                cdText.offsetHeight; 
                cdText.style.animation = 'countBounce 0.5s ease-out forwards';
                if (typeof counts[index] === 'number') {
                    sfxCount.currentTime = 0; sfxCount.play().catch(e => {});
                } else {
                    sfxGo.currentTime = 0; sfxGo.play().catch(e => {});
                }
                index++;
            } else { 
                clearInterval(interval); 
                overlay.style.display = "none"; 
                bgm.play().catch(e => {});
                resolve(); 
            }
        }, 1000);
    });
}

function startGameplay() {
    isGameActive = true;
    const timerDisp = document.getElementById("game-timer");
    timerDisp.classList.remove("hidden");
    timerDisp.innerText = `เวลา: ${gameTimeLeft}`;
    gameInterval = setInterval(() => {
        gameTimeLeft--;
        timerDisp.innerText = `เวลา: ${gameTimeLeft}`;
        if (gameTimeLeft <= 0) finishGame(true);
    }, 1000);
}

function finishGame(isTimeout) {
    if (isFinishing) return;
    isFinishing = true; isGameActive = false;
    clearInterval(gameInterval);
    
    // bgm.pause();  <-- ลบบรรทัดนี้ออก หรือใส่ // ไว้ข้างหน้า

    document.getElementById("game-timer").classList.add("hidden");
    document.getElementById("stir-progress-container").classList.add("hidden");
    document.getElementById("spatula").classList.add("hidden");
    document.getElementById("stir-hint").classList.add("hidden");

    setTimeout(() => {
        if (npcText && npcText.parentElement) npcText.parentElement.classList.remove("hidden");
        const msg = isTimeout ? "หมดเวลาแล้วจ๊ะ! มัวแต่คนเพลินหรือเปล่านี่เรา" : "ทำเสร็จแล้วรึ? ไหนยายดูซิว่าคนจนเนียนดีหรือยัง...";
        typeEffect(npcText, msg, 40).then(() => setTimeout(sendCheckRequest, 1000));
    }, isTimeout ? 0 : 1000);
}

function sendCheckRequest() {
    fetch('/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steps: steps, timeLeft: gameTimeLeft }),
    })
    .then(res => res.json())
    .then(data => { 
        typeEffect(npcText, data.text, 40).then(() => {
            setTimeout(() => { showResultScreen(data); }, 1500);
        });
    })
    .catch(() => { showResultScreen({ score: 0 }); });
}

function showResultScreen(data) {
    const resultScreen = document.getElementById("result-screen");
    const resultScore = document.getElementById("total-score");
    
    // หยุดเพลง BGM เมื่อหน้าสรุปคะแนนปรากฏขึ้น
    bgm.pause(); 
    
    if (resultScore) {
        resultScore.innerText = data.score;
    }

    if (resultScreen) {
        resultScreen.classList.remove("hidden");
        resultScreen.style.display = "flex"; 
    }
}

window.onload = () => {
    const startBtn = document.getElementById('btn-start');
    const startScreen = document.getElementById('start-screen');
    if (startBtn && startScreen) {
        startBtn.onclick = () => {
            startScreen.classList.add('hidden');
            startGameFlow(); 
        };
    }
};