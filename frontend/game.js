const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let isGameStarted = false, isGameOver = false;
let score = 0, ammo = 10, timeLeft = 60, combo = 0;
let targets = [], scorePopups = [], particles = [];
let smokes = []; 
let mouseX = 0, mouseY = 0, gameTimer = null;
let shakeTimer = 0;

// --- 1. ระบบเสียงและเพลงประกอบ ---
const sounds = {
    shot: new Audio('sounds/shot.mp3'),
    hit: new Audio('sounds/hit.mp3'),
    reload: new Audio('sounds/reload.mp3'),
    tick: new Audio('sounds/tick.mp3'),
    start: new Audio('sounds/start.mp3'),
    bgMusic: new Audio('sounds/bg-music.mp3') 
};

sounds.bgMusic.loop = true;
sounds.bgMusic.volume = 0.15; 

function playSfx(name) {
    const s = sounds[name].cloneNode();
    s.volume = 0.5;
    s.play().catch(() => {});
}

// --- 2. การโหลดรูปภาพ (Safe Load System) ---
const imageSources = {
    big: 'images/doll_big.png', small: 'images/doll_small.png', gold: 'images/doll_gold.png',
    gun: 'images/gun.png', blue: 'images/doll_blue.png', red: 'images/doll_red.png', 
    stone: 'images/stone.png', smoke_bomb: 'images/smoke_bomb.png' 
};

const images = {};
let loadedCount = 0;
const totalImages = Object.keys(imageSources).length;

for (let key in imageSources) {
    const img = new Image();
    img.src = imageSources[key];
    img.onload = () => { images[key] = img; checkAllLoaded(); };
    img.onerror = () => { checkAllLoaded(); };
}

function checkAllLoaded() {
    loadedCount++;
    if (loadedCount === totalImages) { spawnStaticTargets(); requestAnimationFrame(gameLoop); }
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (targets.length > 0) spawnStaticTargets(); 
}
window.addEventListener('resize', resize);
resize();

// --- 3. ฟังก์ชันเอฟเฟกต์ ---
function createParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x, y, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
            size: Math.random() * 5 + 2, color: color, life: 1.0
        });
    }
}

function createSmokeCloud(x, y) {
    for (let i = 0; i < 20; i++) { // เพิ่มจำนวนก้อนควันให้ดูหนาแน่นขึ้น
        smokes.push({
            x: x + (Math.random() - 0.5) * 30,
            y: y + (Math.random() - 0.5) * 30,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -Math.random() * 1.2,
            size: Math.random() * 40 + 30, // เริ่มต้นก้อนเล็กแล้วค่อยโต
            growth: Math.random() * 0.5 + 0.2, // อัตราการขยายตัว
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            opacity: 0.6,
            life: 5.0 
        });
    }
}

canvas.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });

canvas.addEventListener('mousedown', (e) => {
    if (!isGameStarted || isGameOver || ammo <= 0) return;
    ammo--;
    playSfx('shot');
    shakeTimer = 8;

    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    let hit = false;
    for (let i = targets.length - 1; i >= 0; i--) {
        let t = targets[i];
        const dist = Math.sqrt((mx - t.x)**2 + (my - t.y)**2);
        
        if (dist < t.size * 0.6) {
            hit = true;
            playSfx('hit');
            
            let pColor = t.type === 'red' ? "#ff3e3e" : t.type === 'blue' ? "#3498db" : t.type === 'gold' ? "#f1c40f" : "#7f8c8d";
            createParticles(t.x, t.y, pColor);

            if (t.type === 'smoke_bomb') {
                createSmokeCloud(t.x, t.y);
                combo = 0;
                scorePopups.push({ x: t.x, y: t.y, text: "ควันระเบิด!", color: '#ff3e3e', life: 1.0 });
            } else if (t.type === 'stone') {
                score = Math.max(0, score - 5); combo = 0;
            } else {
                score += t.pts; combo++; showCombo();
                scorePopups.push({ x: t.x, y: t.y, text: `+${t.pts}`, color: '#f1c40f', life: 1.0 });
            }

            t.x = t.minX + Math.random() * (t.maxX - t.minX);
            break;
        }
    }
    if (!hit) combo = 0;
    updateUI();
});

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    if (shakeTimer > 0) { 
        ctx.translate((Math.random()-0.5)*7, (Math.random()-0.5)*7); 
        shakeTimer--; 
    }

    ctx.globalAlpha = 1.0; 

    // --- วาดเป้าหมาย ---
    targets.forEach(t => { 
        if (isGameStarted) {
            t.x += t.speed;
            if (t.x > t.maxX || t.x < t.minX) t.speed *= -1;
        }
        const img = images[t.type];
        if (img) {
            // *** แก้ไข: คำนวณความกว้างและสูงให้สมส่วน ไม่โดนบีบ ***
            const aspectRatio = img.width / img.height;
            let drawW = t.size;
            let drawH = t.size / aspectRatio;
            
            // ปรับตำแหน่งให้วาดกึ่งกลางตามสัดส่วนใหม่
            ctx.drawImage(img, t.x - drawW/2, t.y - drawH/2, drawW, drawH);
        }
    });

    // --- วาดควันลอยบัง ---
  // --- ส่วนวาดควันใน gameLoop ---
for (let i = smokes.length - 1; i >= 0; i--) {
        let s = smokes[i];
        ctx.save();
        ctx.globalAlpha = s.opacity;
        // ใช้ Gradient ให้ควันดูนุ่มนวลและเป็นก้อน
        let grad = ctx.createRadialGradient(s.x, s.y, s.size * 0.1, s.x, s.y, s.size);
        grad.addColorStop(0, 'rgba(230, 230, 230, 0.9)'); 
        grad.addColorStop(0.6, 'rgba(200, 200, 200, 0.4)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // อัปเดตตำแหน่งและการลอย
        s.x += s.vx; s.y += s.vy;
        s.size += s.growth; // ควันขยายตัว
        s.life -= 0.016;
        s.opacity = Math.max(0, s.life / 6.0); // จางลงช้าๆ
        
        // ลบควันเมื่อหลุดขอบบนหรือจางสนิท
        if (s.life <= 0 || s.y + s.size < -50) smokes.splice(i, 1);
    }
    ctx.globalAlpha = 1.0;
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i]; ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size); p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= 0.03;
        if (p.life <= 0) particles.splice(i, 1);
    }

    ctx.globalAlpha = 1.0;
    if (images.gun) {
        const h = canvas.height * 0.45; 
        const w = (images.gun.width / images.gun.height) * h;
        ctx.drawImage(images.gun, mouseX - w/2, canvas.height - h + 30, w, h);
    }
    ctx.restore();

    for (let i = scorePopups.length - 1; i >= 0; i--) {
        let p = scorePopups[i]; ctx.fillStyle = p.color; ctx.font = "bold 24px Arial";
        ctx.textAlign = "center"; ctx.globalAlpha = p.life; ctx.fillText(p.text, p.x, p.y);
        p.y -= 1; p.life -= 0.02; if (p.life <= 0) scorePopups.splice(i, 1);
    }

    if (!isGameOver) requestAnimationFrame(gameLoop);
}

function startCountdown() {
    const countdownEl = document.getElementById('countdown');
    let count = 3;
    document.getElementById('start-menu').classList.add('hidden');
    countdownEl.classList.remove('hidden');
    const interval = setInterval(() => {
        if (count > 0) {
            countdownEl.innerText = count; playSfx('tick');
            triggerPulse(countdownEl); count--;
        } else if (count === 0) {
            countdownEl.innerText = "เริ่ม!"; playSfx('start');
            triggerPulse(countdownEl); count--;
        } else {
            clearInterval(interval); countdownEl.classList.add('hidden'); actualStart(); 
        }
    }, 1000);
}

function triggerPulse(el) { el.classList.remove('pulse-animation'); void el.offsetWidth; el.classList.add('pulse-animation'); }

function actualStart() {
    isGameStarted = true; score = 0; ammo = 10; timeLeft = 60; isGameOver = false;
    sounds.bgMusic.currentTime = 0; sounds.bgMusic.play().catch(() => {});
    updateUI();
    gameTimer = setInterval(() => { if (timeLeft > 0) { timeLeft--; updateUI(); } else endGame(); }, 1000);
}

function spawnStaticTargets() {
    targets = [];
    const shelfY = [canvas.height * 0.35, canvas.height * 0.58];
    const typePool = ['big', 'small', 'small', 'gold', 'gold', 'blue', 'blue', 'red', 'red', 'stone', 'stone', 'smoke_bomb'];
    shelfY.forEach((baseY) => {
        const startX = canvas.width * 0.25, spacing = canvas.width * 0.045;
        let shuffledTypes = [...typePool].sort(() => Math.random() - 0.5);
        let directionMap = { 'big': 1, 'small': 1, 'gold': 1, 'blue': 1, 'red': 1, 'stone': 1, 'smoke_bomb': 1 };
        for (let i = 0; i < shuffledTypes.length; i++) {
            const type = shuffledTypes[i];
            let pts, size, yOffset = 0, speedMult = 1;
            switch(type) {
                case 'gold': pts = 50; size = canvas.height * 0.05; yOffset = canvas.height * 0.029; speedMult = 2.0; break;
                case 'stone': pts = -5; size = canvas.height * 0.14; speedMult = 1.5; break;
                case 'blue': pts = 25; size = canvas.height * 0.08; yOffset = canvas.height * 0.025; speedMult = 1.5; break;
                case 'red': pts = 10; size = canvas.height * 0.10; yOffset = canvas.height * 0.015; speedMult = 1.1; break;
                case 'small': pts = 15; size = canvas.height * 0.07; yOffset = canvas.height * 0.025; speedMult = 1.3; break;
                case 'big': pts = 5; size = canvas.height * 0.12; speedMult = 1.0; break;
                case 'smoke_bomb': pts = 0; size = canvas.height * 0.04; speedMult = 1.0; yOffset = -canvas.height * 0.01;break; 
            }
            const finalDir = directionMap[type]; directionMap[type] *= -1;
            targets.push({ type, pts, size, x: startX + (i * spacing), y: baseY + yOffset, speed: (6.0 * finalDir) * speedMult, minX: canvas.width * 0.24, maxX: canvas.width * 0.76 });
        }
    });
}

function updateUI() {
    document.getElementById('score').innerText = score;
    document.getElementById('time').innerText = timeLeft;
    document.getElementById('ammo').innerText = ammo;
}

function showCombo() {
    const el = document.getElementById('combo-alert');
    if (el && combo >= 3) { el.innerText = `COMBO x${combo}`; setTimeout(() => el.innerText = '', 700); }
}

function endGame() {
    isGameOver = true; clearInterval(gameTimer); sounds.bgMusic.pause();
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('final-score').innerText = score;
}

document.getElementById('start-btn').addEventListener('click', startCountdown);
window.addEventListener('keydown', (e) => { if (e.code === 'Space') { ammo = 10; playSfx('reload'); updateUI(); } });