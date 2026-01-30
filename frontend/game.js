
            const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- 1. ตัวแปรสถานะและตั้งค่าหลัก ---
let currentSpeed = 6.0; // เริ่มต้นให้ไวขึ้น
let gameLevel = 1;      // ตัวแปรระดับความยาก
let score = 0, ammo = 10, timeLeft = 30, combo = 0, isGameOver = false;
let targets = [];
let scorePopups = []; 
let mouseX = 0, mouseY = 0;
let gameTimer = null;

const imageSources = {
    big: 'images/doll_big.png',
    small: 'images/doll_small.png',
    gold: 'images/doll_gold.png',
    gun: 'images/gun.png',
    blue: 'images/doll_blue.png',
    red: 'images/doll_red.png',
    stone: 'images/stone.png'
};

const images = {};
let loadedCount = 0;
const totalImages = Object.keys(imageSources).length;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (targets.length > 0 && !isGameOver) spawnStaticTargets(); 
}
window.addEventListener('resize', resize);
resize();

for (let key in imageSources) {
    const img = new Image();
    img.src = imageSources[key];
    img.onload = () => {
        images[key] = img; 
        loadedCount++;
        if (loadedCount === totalImages) startGame(); 
    };
}

// --- 2. ระบบควบคุมและการยิง ---
canvas.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

canvas.addEventListener('mousedown', (e) => {
    if (isGameOver || ammo <= 0) return;
    ammo--;

    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    let hit = false;
    for (let i = targets.length - 1; i >= 0; i--) {
        let t = targets[i];
        if (!t.isHit) {
            const dist = Math.sqrt((mx - t.x)**2 + (my - t.y)**2);
            // คำนวณขอบเขตการยิงตามขนาดปัจจุบันของตุ๊กตา
            const hitThreshold = t.size * 0.6;

            if (dist < hitThreshold) {
                t.isHit = true; 
                t.opacity = 1.0;
                hit = true;

                // เพิ่มคะแนนและแสดง Popup
                if (t.type === 'stone') {
                    score = Math.max(0, score + t.pts);
                    combo = 0;
                } else {
                    score += t.pts;
                    combo++;
                    showCombo();
                }

                scorePopups.push({
                    x: t.x, y: t.y,
                    text: t.pts > 0 ? `+${t.pts}` : `${t.pts}`,
                    color: t.pts > 0 ? '#f1c40f' : '#ff3e3e',
                    life: 1.0
                });

                // --- ส่วนที่เพิ่ม: ระบบเกิดใหม่ (เล็กลง 15% เร็วขึ้น 20%) ---
                setTimeout(() => {
                    t.isHit = false;
                    t.opacity = 1.0;
                    // สุ่มตำแหน่ง X ใหม่เพื่อให้ไม่เกิดที่เดิมซ้ำๆ
                    t.x = t.minX + Math.random() * (t.maxX - t.minX);
                    
                    // ปรับขนาดและระดับความเร็วเฉพาะตัวนี้
                    t.size *= 0.85; 
                    t.speed *= 1.20; 
                    
                    // ป้องกันตุ๊กตาหายไป (จำกัดขนาดขั้นต่ำที่ 25px)
                    if (t.size < 25) t.size = 25; 
                }, 150); 
                
                break;
            }
        }
    }
    if (!hit) combo = 0;
    updateUI();
});

// --- 3. ระบบสร้างตุ๊กตา (ปรับขนาดตามเลเวล) ---
function spawnStaticTargets() {
    targets = [];
    const shelfY = [canvas.height * 0.35, canvas.height * 0.58];
    const typePool = ['big', 'big', 'small', 'small', 'gold', 'gold', 'blue', 'blue', 'red', 'red', 'stone', 'stone'];

    // ตุ๊กตาเล็กลง 15% ทุกครั้งที่ขึ้นเลเวลใหม่
    const sizeMultiplier = Math.pow(0.85, gameLevel - 1);

    shelfY.forEach((baseY, index) => {
        const startX = canvas.width * 0.25; 
        const spacing = canvas.width * 0.045; 
        const woodLeftLimit = canvas.width * 0.24;
        const woodRightLimit = canvas.width * 0.76;

        let shuffledTypes = [...typePool].sort(() => Math.random() - 0.5);
        let directionMap = { 'big': 1, 'small': 1, 'gold': 1, 'blue': 1, 'red': 1, 'stone': 1 };

        for (let i = 0; i < shuffledTypes.length; i++) {
            const type = shuffledTypes[i];
            const xPos = startX + (i * spacing);
            let pts, size, yOffset = 0, speedMult = 1;

            switch(type) {
                  case 'gold': pts = 50; size = canvas.height * 0.05; yOffset = canvas.height * 0.029; speedMult = 2.0; break;
                case 'stone': pts = -5; size = canvas.height * 0.14; yOffset = 0; speedMult = 1.5; break;
                case 'blue': pts = 25; size = canvas.height * 0.08; yOffset = canvas.height * 0.025; speedMult = 1.5; break;
                case 'red': pts = 10; size = canvas.height * 0.10; yOffset = canvas.height * 0.015; speedMult = 1.1; break;
                case 'small': pts = 15; size = canvas.height * 0.07; yOffset = canvas.height * 0.025; speedMult = 1.3; break;
                case 'big': pts = 5; size = canvas.height * 0.12; yOffset = canvas.height * 0.0010; speedMult = 1.0; break;
            }

            const finalDir = directionMap[type]; 
            directionMap[type] *= -1;

            targets.push({
                type, pts, 
                size: size * sizeMultiplier, // คูณลดขนาด
                x: xPos, y: baseY + yOffset, speedMult,
                isHit: false, opacity: 1.0,
                speed: (currentSpeed * finalDir) * speedMult,
                minX: woodLeftLimit, maxX: woodRightLimit
            });
        }
    });

    targets.sort((a, b) => (a.type === 'stone' ? -1 : (b.type === 'stone' ? 1 : 0)));
}

// --- 4. Game Loop ---
function gameLoop() {
    if (isGameOver) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    targets.forEach(t => { 
        if (!t.isHit) {
            t.x += t.speed;
            if (t.x > t.maxX || t.x < t.minX) t.speed *= -1;
            ctx.globalAlpha = 1.0;
            ctx.drawImage(images[t.type], t.x - t.size/2, t.y - t.size/2, t.size, t.size);
        }
    });

    // วาด Score Popups
    for (let i = scorePopups.length - 1; i >= 0; i--) {
        let p = scorePopups[i];
        ctx.fillStyle = p.color;
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.globalAlpha = p.life;
        ctx.fillText(p.text, p.x, p.y);
        p.y -= 1; p.life -= 0.02;
        if (p.life <= 0) scorePopups.splice(i, 1);
    }

    // วาดปืน
    if (images.gun) {
        const h = canvas.height * 0.45;
        const w = (images.gun.width / images.gun.height) * h;
        ctx.globalAlpha = 1.0;
        ctx.drawImage(images.gun, mouseX - w/2, canvas.height - h + 30, w, h);
    }
    requestAnimationFrame(gameLoop);
}

function startGame() {
    score = 0; ammo = 10; timeLeft = 30; currentSpeed = 4.0; gameLevel = 1; isGameOver = false;
    spawnStaticTargets();
    updateUI();
    requestAnimationFrame(gameLoop);
    gameTimer = setInterval(() => {
        if (timeLeft > 0) { timeLeft--; updateUI(); }
        else endGame();
    }, 1000);
}

function updateUI() {
    document.getElementById('score').innerText = score;
    document.getElementById('time').innerText = timeLeft;
    document.getElementById('ammo').innerText = ammo;
}

function showCombo() {
    const el = document.getElementById('combo-alert');
    if (el && combo >= 3) {
        el.innerText = `COMBO x${combo}`;
        setTimeout(() => el.innerText = '', 700);
    }
}

// --- 5. ระบบจบเกมและส่งข้อมูล ---
function endGame() {
    isGameOver = true;
    clearInterval(gameTimer);
    
    // แสดงหน้าจอจบเกม
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('final-score').innerText = score;
    
    // ส่งคะแนนไป Backend
    saveScore(score);
}

async function saveScore(finalScore) {
    const statusMsg = document.getElementById('status-msg');
    const data = { player_name: "Player_1", score: finalScore };

    try {
        const response = await fetch('http://localhost:8084/api/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (response.ok) statusMsg.innerText = "คะแนนของคุณถูกบันทึกแล้ว";
    } catch (e) {
        statusMsg.innerText = "บันทึกคะแนนไม่สำเร็จ";
    }
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { ammo = 10; updateUI(); }
});