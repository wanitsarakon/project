const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    actualBalloonWidth = (window.innerWidth * 0.73 - window.innerWidth * 0.29) / 10;
    actualBalloonHeight = (window.innerHeight * 0.58 - window.innerHeight * 0.25) / 4;
}
window.addEventListener('resize', resize);

// --- Assets & Variables ---
const bgImg = new Image(); bgImg.src = '/static/image/bg.png';
const auntieImg = new Image(); auntieImg.src = '/static/image/auntie.png';
const auntieBalloonImg = new Image(); auntieBalloonImg.src = '/static/image/auntie_balloon.png'; 
const auntieMadImg = new Image(); auntieMadImg.src = '/static/image/auntie_mad.png'; 
const auntieBalloonMadImg = new Image(); auntieBalloonMadImg.src = '/static/image/auntie_balloon_mad.png'; 

const dartImg = new Image(); dartImg.src = '/static/image/dart.png'; 
const handImg = new Image(); handImg.src = '/static/image/hand.png'; 

// --- Sound Assets ---
const sounds = {
    pop: new Audio('/static/audio/pop.mp3'),
    shoot: new Audio('/static/audio/shoot.mp3'),
    hitShield: new Audio('/static/audio/hit_shield.mp3'),
    stun: new Audio('/static/audio/stun.mp3'),
    lightning: new Audio('/static/audio/lightning.mp3'),
    bgm: new Audio('/static/audio/bgm.mp3'),
    timeStop: new Audio('/static/audio/timestop.mp3'),
    explosion: new Audio('/static/audio/explosion.mp3'),
    count: new Audio('/static/audio/count.mp3'),
    start: new Audio('/static/audio/start.mp3'),
    rain: new Audio('/static/audio/rain.mp3')
};
sounds.bgm.loop = true;
sounds.bgm.volume = 0.4;
sounds.rain.loop = true;
sounds.rain.volume = 0.5;

function playSfx(audio) {
    const s = audio.cloneNode();
    s.volume = 0.6;
    s.play();
}

const images = { 
    RED: new Image(), YELLOW: new Image(), BLUE: new Image(), PURPLE: new Image(), 
    GREEN: new Image(), GOLD: new Image(), RAINBOW: new Image(), TRAP: new Image(),
    FREEZE: new Image() 
};
images.RED.src = '/static/image/red_balloon.png'; images.YELLOW.src = '/static/image/yellow_balloon.png';
images.BLUE.src = '/static/image/blue_balloon.png'; images.PURPLE.src = '/static/image/purple_balloon.png';
images.GREEN.src = '/static/image/green_balloon.png'; images.GOLD.src = '/static/image/gold_balloon.png';
images.RAINBOW.src = '/static/image/rainbow_balloon.png'; 
images.TRAP.src = '/static/image/black_balloon.png';
images.FREEZE.src = '/static/image/frozen_balloon.png'; 

const SCORE_VALUES = { RED: 10, YELLOW: 10, BLUE: 10, GREEN: 30, PURPLE: 50, GOLD: 150, RAINBOW: 200, TRAP: 0, FREEZE: 20 };

let totalScore = 0, timeLeft = 60, gameActive = false; 
let power = 0, isCharging = false, powerDirection = 1, comboCount = 0, wind = 0, darts = [];
let balloonOffset = 0, balloonDirection = 1, screenShake = 0;
let rainParticles = [], popParticles = [];
let comboTexts = []; 
let shieldRotation = 0, flagWave = 0;
let auntieStunTimer = 0, auntieSpeech = "", doubleScoreTimer = 0; 
let stormWarningTimer = 0; 
let lightningStrike = null, lightningFlash = 0;
let countdownValue = 3;
let isCountingDown = false;
let difficultyMultiplier = 1;
const MAX_DIFFICULTY = 2.2;
let handX = 0, handAutoDir = 1, handSpeed = 3.5, handTilt = 0;    
let isReloading = false, balloons = [];
let actualBalloonWidth, actualBalloonHeight;
const groundLevel = window.innerHeight * 0.85; 

let auntie = { 
    x: -500, y: groundLevel, 
    baseHeight: 550, 
    width: 0, height: 0, 
    direction: 1, speed: 2.5, walkCycle: 0, isActive: false, 
    appearanceCount: 0,
    currentType: 1
};

const getStartX = () => window.innerWidth / 2;
const getStartY = () => window.innerHeight - 80;

function createFloatingText(x, y, text, color = "#ffffff", isBonus = false) {
    comboTexts.push({ x: x, y: y, text: text, color: color, opacity: 1.0, scale: isBonus ? 1.5 : 1.0, isBonus: isBonus });
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath(); ctx.moveTo(x + radius, y); ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius); ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height); ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x + radius, y + radius); ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
}

function drawSpeechBubble(ctx, x, y, text, position = "top") {
    if (!text) return;
    ctx.font = "bold 20px Tahoma";
    const padding = 15; const metrics = ctx.measureText(text);
    const bw = metrics.width + (padding * 2); const bh = 20 + (padding * 2);
    let bx, by;
    if (position === "side") {
        bx = x + (auntie.width / 2) + 50; by = y + (auntie.height / 4);     
    } else {
        bx = x + (auntie.width / 2) - (bw / 2); by = y - bh - 10; 
    }
    ctx.save(); ctx.shadowBlur = 8; ctx.fillStyle = "white"; ctx.strokeStyle = "black"; ctx.lineWidth = 2;
    roundRect(ctx, bx, by, bw, bh, 15); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    if (position === "side") {
        ctx.moveTo(bx, by + 15); ctx.lineTo(bx - 20, by + bh/2); ctx.lineTo(bx, by + bh - 15);
    } else {
        ctx.moveTo(bx + (bw/2) - 12, by + bh); ctx.lineTo(bx + (bw/2), by + bh + 15); ctx.lineTo(bx + (bw/2) + 12, by + bh);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ff4444"; ctx.textAlign = "center"; ctx.fillText(text, bx + (bw/2), by + padding + 18); ctx.restore();
}

function createPopParticles(x, y, color) {
    const colorMap = { RED: '#ff4d4d', YELLOW: '#fffa65', BLUE: '#32ff7e', PURPLE: '#7158e2', GREEN: '#32ff7e', GOLD: '#facd3b', RAINBOW: '#ffffff', TRAP: '#000000', FREEZE: '#a0e9ff' };
    for (let i = 0; i < 20; i++) {
        let pColor = color === 'RAINBOW' ? `hsl(${Math.random() * 360}, 100%, 70%)` : (colorMap[color] || '#fff');
        popParticles.push({
            x: x, y: y, vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12,
            size: Math.random() * 4 + 1, color: pColor, life: 1.0, gravity: 0.15, friction: 0.96 
        });
    }
}

function triggerLightning() {
    const activeBalloons = balloons.filter(b => b.active);
    if (activeBalloons.length === 0) return;

    const targetIdx = Math.floor(Math.random() * activeBalloons.length);
    const targetBalloon = activeBalloons[targetIdx];
    const realIdx = balloons.indexOf(targetBalloon);
    const row = Math.floor(realIdx / 10);
    
    const targetX = targetBalloon.freezeTimer > 0 
        ? targetBalloon.frozenX 
        : targetBalloon.x + (row % 2 === 0 ? balloonOffset : -balloonDirection * balloonOffset);
    const targetY = targetBalloon.y;

    let segments = [];
    let curY = 0;
    let curX = targetX + (Math.random() - 0.5) * 100;
    
    let safetyCounter = 0;
    while(curY < targetY && safetyCounter < 50) {
        safetyCounter++;
        let nextY = curY + Math.random() * 30 + 15;
        if (nextY > targetY) nextY = targetY;
        let nextX = curX + (Math.random() - 0.5) * 50;
        if (nextY === targetY) nextX = targetX;

        segments.push({x1: curX, y1: curY, x2: nextX, y2: nextY});
        curX = nextX; curY = nextY;
    }

    playSfx(sounds.lightning);
    lightningStrike = { segments: segments, timer: 12 };
    lightningFlash = 5; 
    screenShake = 12;

    targetBalloon.active = false;
    createPopParticles(targetX, targetY, targetBalloon.color);
    createFloatingText(targetX, targetY, "MISS!", "#9e9e9e"); 
}

function generateBalloons() {
    balloons = [];
    resize();
    const wallTop = window.innerHeight * 0.25, wallLeft = window.innerWidth * 0.29;
    let balloonPool = [];
    balloonPool.push({ color: 'RAINBOW', isTrap: false, forcedHP: 3 }); 
    for(let i = 0; i < 4; i++) balloonPool.push({ color: 'GOLD', isTrap: false, forcedHP: 2 });
    for(let i = 0; i < 2; i++) balloonPool.push({ color: 'FREEZE', isTrap: false, forcedHP: 1 });
    let trapCount = Math.floor(Math.random() * 3) + 4; 
    for(let i = 0; i < trapCount; i++) balloonPool.push({ color: 'TRAP', isTrap: true, forcedHP: 1 });
    const baseColors = ['RED', 'YELLOW', 'BLUE', 'GREEN', 'PURPLE'];
    while((balloonPool.length) < 40) {
        let hp = Math.random() < 0.15 ? 2 : 1;
        balloonPool.push({ color: baseColors[Math.floor(Math.random() * baseColors.length)], isTrap: false, forcedHP: hp });
    }
    for (let i = balloonPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [balloonPool[i], balloonPool[j]] = [balloonPool[j], balloonPool[i]];
    }
    let index = 0;
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 10; col++) {
            let item = balloonPool[index++];
            balloons.push({ 
                x: wallLeft + (col * actualBalloonWidth) + (actualBalloonWidth / 2), 
                y: wallTop + (row * actualBalloonHeight) + (actualBalloonHeight / 2), 
                color: item.color, originalColor: item.color, 
                radius: actualBalloonWidth / 2, active: true, 
                hp: item.forcedHP, gapSize: 0.6, isTrap: item.isTrap,
                freezeTimer: 0, frozenX: 0 
            });
        }
    }
}

function update() {
    if (!gameActive && !isCountingDown) return;
    if (isCountingDown) return; 

    let isFrozenActive = balloons.some(b => b.freezeTimer > 0);

    if (isCharging) {
        if (powerDirection === 1) {
            power += 2.0; 
            if (power >= 100) { power = 100; powerDirection = -1; }
        } else {
            power -= 2.0; 
            if (power <= 0) { power = 0; powerDirection = 1; }
        }
    } else if (power > 0) {
        power -= 1.5;
        if (power < 0) power = 0;
    }

    if (screenShake > 0) screenShake *= 0.9;
    if (lightningFlash > 0) lightningFlash--;
    if (doubleScoreTimer > 0) {
        doubleScoreTimer -= 1/60; 
        if (doubleScoreTimer < 0) doubleScoreTimer = 0;
    }

    if (timeLeft < 30 && !isFrozenActive && Math.random() < 0.003) {
        triggerLightning();
    }

    let currentHandSpeed = handSpeed * (1 + (totalScore / 2000) * 0.1);
    handX += currentHandSpeed * handAutoDir;
    let targetTilt = handAutoDir * 0.25; 
    handTilt += (targetTilt - handTilt) * 0.05;
    if (Math.abs(handX) > window.innerWidth * 0.28) handAutoDir *= -1;

    darts.forEach(dart => {
        if (dart.active) {
            dart.vx *= 0.995; dart.vx += wind * 0.04; dart.vy += 0.15; dart.x += dart.vx; dart.y += dart.vy;
            
            if (auntie.isActive && auntieStunTimer <= 0) {
                const hPadding = auntie.width * 0.2;
                if (dart.x > auntie.x + hPadding && dart.x < auntie.x + auntie.width - hPadding && dart.y > auntie.y && dart.y < auntie.y + auntie.height) {
                    playSfx(sounds.stun);
                    dart.active = false; comboCount = 0; auntieStunTimer = 45; 
                    auntieSpeech = (auntie.currentType === 1) ? "หยุดเดี๋ยวนี้นะ!" : "ลูกโป่งยายหายหมด!";
                }
            }

            balloons.forEach((b, idx) => {
                if (b.active && dart.active) {
                    let row = Math.floor(idx / 10);
                    let currentX = b.freezeTimer > 0 ? b.frozenX : b.x + (row % 2 === 0 ? balloonOffset : -balloonDirection * balloonOffset);
                    let dist = Math.hypot(dart.x - currentX, dart.y - b.y);
                    
                    if (dist < b.radius * 1.3) {
                        let hitAngle = (Math.atan2(dart.y - b.y, dart.x - currentX) + Math.PI * 2) % (Math.PI * 2);
                        let gapStart = shieldRotation % (Math.PI * 2);
                        let gapEnd = (gapStart + b.gapSize) % (Math.PI * 2);
                        
                        let hitGap = (gapStart < gapEnd) ? (hitAngle > gapStart && hitAngle < gapEnd) : (hitAngle > gapStart || hitAngle < gapEnd);
                        
                        if (b.hp > 1 && !hitGap) { 
                            playSfx(sounds.hitShield);
                            b.hp--; dart.active = false; screenShake = 7; comboCount = 0; return; 
                        } 
                        
                        if (b.isTrap) {
                            playSfx(sounds.explosion);
                        } else {
                            playSfx(sounds.pop);
                        }

                        b.active = false; dart.active = false;
                        createPopParticles(currentX, b.y, b.color);

                        if (b.color === 'FREEZE' && !isFrozenActive) {
                            playSfx(sounds.timeStop);
                            screenShake = 10; createFloatingText(currentX, b.y, "TIME STOP!", "#a0e9ff", true);
                            balloons.forEach(otherB => { 
                                if (otherB.active) { 
                                    otherB.freezeTimer = 180; otherB.color = 'FREEZE'; 
                                    let oRow = Math.floor(balloons.indexOf(otherB) / 10); 
                                    otherB.frozenX = otherB.x + (oRow % 2 === 0 ? balloonOffset : -balloonDirection * balloonOffset);
                                } 
                            });
                            return;
                        }

                        if (b.isTrap) {
                            screenShake = 20; comboCount = 0; createFloatingText(currentX, b.y, "BOOM!", "#000000", true);
                            balloons.forEach(o => { if (o.active && Math.hypot(o.x - currentX, o.y - b.y) < 80) o.active = false; });
                            return;
                        }

                        comboCount++;
                        let finalScore = ((SCORE_VALUES[b.color] || 10) * (comboCount >= 5 ? comboCount : 1)) * (doubleScoreTimer > 0 ? 2 : 1);
                        totalScore += finalScore;
                        createFloatingText(currentX, b.y, `+${finalScore}`, doubleScoreTimer > 0 ? "#FFD700" : "#ffffff");
                        if (b.color === 'RAINBOW') {
                             doubleScoreTimer = 10;
                             createFloatingText(currentX, b.y - 40, "DOUBLE SCORE!", "#FFD700", true);
                        }
                    }
                }
            });
            if (dart.y > canvas.height || dart.x > canvas.width || dart.x < 0) { dart.active = false; comboCount = 0; }
        }
    });

    if (!isFrozenActive) {
        difficultyMultiplier = Math.min(MAX_DIFFICULTY, 1 + (totalScore / 1500) * 0.05 + comboCount * 0.015);
        flagWave += 0.1;
        shieldRotation += ((timeLeft <= 30 ? 0.08 : 0.04) * difficultyMultiplier); 
        balloonOffset += ((timeLeft <= 30 ? 6.5 : 4.0) * difficultyMultiplier) * balloonDirection;
        if (Math.abs(balloonOffset) > 85) balloonDirection *= -1;

        if (timeLeft <= 30) {
            if (sounds.rain.paused) sounds.rain.play();
            for (let i = 0; i < 2; i++) {
                rainParticles.push({
                    x: Math.random() * canvas.width, y: -20,
                    speed: 15 + Math.random() * 10, len: 15 + Math.random() * 20,
                    opacity: 0.1 + Math.random() * 0.3
                });
            }
        } else {
            if (!sounds.rain.paused) {
                sounds.rain.pause();
                sounds.rain.currentTime = 0;
            }
        }
// ค้นหาและวางทับส่วนจัดการ Auntie ในฟังก์ชัน update()
if (!auntie.isActive && (timeLeft === 50 || timeLeft === 25)) {
    auntie.isActive = true; 
    auntie.appearanceCount++; 
    auntie.speed = 2.5; 
    
    // กำหนดประเภท
    if (timeLeft === 25) {
        auntie.currentType = 2; 
    } else {
        auntie.currentType = (auntie.appearanceCount % 2 === 1) ? 1 : 2;
    }

    auntie.direction = Math.random() > 0.5 ? 1 : -1;
    auntie.x = auntie.direction === 1 ? -400 : window.innerWidth + 400;
    auntie.walkCycle = 0; // รีเซ็ตจังหวะเดินทุกครั้งที่เริ่มใหม่
}

if (auntie.isActive) {
    if (auntieStunTimer <= 0) {
        // เคลื่อนที่
        auntie.x += (auntie.speed * difficultyMultiplier) * auntie.direction;
        
        // --- แก้ไขจังหวะการเดินตรงนี้ ---
        if (auntie.currentType === 1) {
            auntie.walkCycle += 0.15; // ยายปกติให้เพิ่มค่าเพื่อโยกตัว
        } else {
            auntie.walkCycle = 0; // ยายรถเข็นให้เป็น 0 เพื่อให้นิ่ง
        }
    }

    // คำนวณตำแหน่ง Y และขนาด (คงเดิมตามระบบเกมคุณ)
    auntie.y = groundLevel - (auntie.baseHeight * 0.8) - (auntie.currentType === 2 ? 70 : 0); 
   // --- ส่วนที่แก้ไขเพื่อปรับขนาดแยกกัน ---
if (auntie.currentType === 1) {
    // ปรับขนาดยายคนแรกที่นี่ (เช่น 1.2 คือใหญ่ขึ้น 20%)
    auntie.height = auntie.baseHeight * 1.13; 
} else {
    // ขนาดยายรถเข็น (Type 2) ให้เป็น 1.3 เท่าเดิมตามโค้ดคุณ
    auntie.height = auntie.baseHeight * 1.3; 
}

// บรรทัดนี้คงเดิมเพื่อคำนวณความกว้างให้สัมพันธ์กับรูปภาพ
let imgForRef = (auntie.currentType === 1) ? auntieImg : auntieBalloonImg;
auntie.width = auntie.height * (imgForRef.width / imgForRef.height || 1);
    // เช็คขอบจอเพื่อปิดตัวตน
    if ((auntie.direction === 1 && auntie.x > window.innerWidth + auntie.width) || 
        (auntie.direction === -1 && auntie.x < -auntie.width)) {
        auntie.isActive = false;
    }
}

    }
    if (lightningStrike) { lightningStrike.timer--; if (lightningStrike.timer <= 0) lightningStrike = null; }
    if (auntieStunTimer > 0) auntieStunTimer--;
    if (stormWarningTimer > 0) stormWarningTimer--;
    if (timeLeft === 33 && stormWarningTimer <= 0) stormWarningTimer = 180;

    popParticles.forEach((p, i) => { p.vx *= p.friction; p.vy *= p.friction; p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.life -= 0.02; if (p.life <= 0) popParticles.splice(i, 1); });
    rainParticles.forEach((r, i) => { r.y += r.speed; r.x += wind * 2; if (r.y > canvas.height) rainParticles.splice(i, 1); });
    comboTexts.forEach((t, i) => { t.y -= 1.5; t.opacity -= 0.02; if (t.opacity <= 0) comboTexts.splice(i, 1); });
    balloons.forEach(b => { if (b.freezeTimer > 0) { b.freezeTimer--; if (b.freezeTimer <= 0) b.color = b.originalColor; } });
}

function draw() {
    ctx.save();
    if (screenShake > 0.1) ctx.translate(Math.random() * screenShake - screenShake/2, Math.random() * screenShake - screenShake/2);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (bgImg.complete) {
        if (timeLeft <= 30 && !isCountingDown) ctx.filter = `brightness(45%) contrast(1.1)`; 
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height); ctx.filter = "none";
    }

    balloons.forEach((b, idx) => {
        if (b.active) {
            let row = Math.floor(idx / 10);
            let currentX = b.freezeTimer > 0 ? b.frozenX : b.x + (row % 2 === 0 ? balloonOffset : -balloonOffset);
            ctx.save();
            if (images[b.color].complete) {
                if (b.hp > 1) { 
                    ctx.beginPath(); ctx.arc(currentX, b.y, b.radius * 1.35, shieldRotation + b.gapSize, shieldRotation, false); 
                    ctx.strokeStyle = (b.hp === 3) ? "white" : "Cyan"; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.stroke(); 
                }
                ctx.drawImage(images[b.color], currentX - actualBalloonWidth/2, b.y - actualBalloonHeight/2, actualBalloonWidth, actualBalloonHeight);
            }
            ctx.restore();
        }
    });
// ค้นหาส่วนที่วาด Countdown ในฟังก์ชัน draw(

    if (gameActive && comboCount >= 5) {
        ctx.save();
        ctx.textAlign = "center";
        let comboSize = 40 + (Math.min(comboCount, 20) * 2);
        ctx.font = `bold ${comboSize}px Kanit`;
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ff4444";
        
        let comboGrad = ctx.createLinearGradient(0, 40, 0, 100);
        comboGrad.addColorStop(0, "#ff0000");
        comboGrad.addColorStop(1, "#ffaa00");
        
        ctx.fillStyle = comboGrad;
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        
        let shake = Math.sin(Date.now() / 50) * 3;
        ctx.strokeText(`${comboCount} COMBO!`, canvas.width / 2 + shake, 180);
        ctx.fillText(`${comboCount} COMBO!`, canvas.width / 2 + shake, 180);
        ctx.restore();
    }

    if (stormWarningTimer > 0) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(0, canvas.height/2 - 80, canvas.width, 160);

        ctx.font = "bold 80px Kanit";
        let pulse = Math.sin(Date.now() / 150) * 10;
        ctx.shadowBlur = 20 + pulse;
        ctx.shadowColor = "red";
        
        let grad = ctx.createLinearGradient(0, canvas.height/2 - 40, 0, canvas.height/2 + 40);
        grad.addColorStop(0, "#FF0000");
        grad.addColorStop(1, "#FFFF00");
        ctx.fillStyle = grad;
        
        ctx.fillText("⚠️ พายุกำลังเข้าระวัง!!!!! ⚠️", canvas.width / 2, canvas.height / 2 + 20);
        ctx.restore();
    }

    if (doubleScoreTimer > 0) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = "bold 40px Kanit";
        let pulse = Math.sin(Date.now() / 100) * 5;
        ctx.shadowBlur = 15 + pulse;
        ctx.shadowColor = "gold";
        
        let grad = ctx.createLinearGradient(0, 80, 0, 130);
        grad.addColorStop(0, "#FFF700");
        grad.addColorStop(1, "#FFA200");
        ctx.fillStyle = grad;
        
        ctx.fillText(`✨ GOLDEN TIME: ${Math.ceil(doubleScoreTimer)}s (x2 SCORE) ✨`, canvas.width / 2, 110);
        ctx.restore();
    }

    if (lightningStrike) {
        ctx.save(); ctx.strokeStyle = "rgba(255, 255, 255, 0.9)"; ctx.lineWidth = 4; ctx.shadowBlur = 20; ctx.shadowColor = "cyan";
        ctx.beginPath(); lightningStrike.segments.forEach(s => { ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); });
        ctx.stroke(); ctx.restore();
    }

    if (lightningFlash > 0) {
        ctx.save(); ctx.fillStyle = `rgba(255, 255, 255, ${lightningFlash * 0.15})`; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.restore();
    }

    ctx.save(); ctx.lineWidth = 1.5; rainParticles.forEach(r => { ctx.strokeStyle = `rgba(180, 200, 240, ${r.opacity})`; ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x + wind * 4, r.y + r.len); ctx.stroke(); }); ctx.restore();
    
    comboTexts.forEach(t => { 
        ctx.save(); 
        ctx.globalAlpha = t.opacity; 
        ctx.translate(t.x, t.y); 
        
        if (t.isBonus) {
            ctx.font = "bold 45px Kanit";
            ctx.shadowBlur = 15;
            ctx.shadowColor = "gold";
            ctx.scale(1.2, 1.2);
        } else {
            ctx.font = "bold 32px Kanit";
            ctx.shadowBlur = 5;
            ctx.shadowColor = "black";
        }
        
        ctx.textAlign = "center"; 
        ctx.fillStyle = t.color; 
        ctx.fillText(t.text, 0, 0); 
        ctx.restore(); 
    });

// วางทับส่วนวาด Auntie ในฟังก์ชัน draw() ของไฟล์ game.js
if (auntie.isActive) {
    ctx.save(); 
    // ย้ายจุดหมุนไปที่ฐานของคุณยาย
    ctx.translate(auntie.x + auntie.width/2, auntie.y + auntie.height); 
    
    // เลือกรูปภาพตามสถานะโกรธและประเภทของยาย
    let imgToDraw = (auntieStunTimer > 0) ? 
        (auntie.currentType === 1 ? auntieMadImg : auntieBalloonMadImg) : 
        (auntie.currentType === 1 ? auntieImg : auntieBalloonImg);

    if (imgToDraw.complete) {
        // หันหน้าซ้าย-ขวาตามทิศทางการเดิน
        if (auntie.direction === 1) ctx.scale(-1, 1);
        
        // --- เงื่อนไขการโยก: เฉพาะยายคนแรก (Type 1) และตอนที่ไม่โดนสตัน ---
        if (auntieStunTimer <= 0 && auntie.currentType === 1) {
            ctx.rotate(Math.sin(auntie.walkCycle) * 0.05);
        }
        
        // วาดตัวละคร
        ctx.drawImage(imgToDraw, -auntie.width/2, -auntie.height, auntie.width, auntie.height);
    }
    ctx.restore();

    // --- ส่วนของบทพูด (Speech Bubble) ---
    if (auntieStunTimer > 0) {
        // คำนวณตำแหน่ง X ใหม่: ถ้าเป็นยายรถเข็น (Type 2) ให้ขยับไปทางขวา 250 พิกเซล
        let bubbleX = auntie.x + (auntie.currentType === 2 ? 250 : 0);
        
        // เรียกใช้ฟังก์ชันวาดบทพูดโดยใช้ bubbleX
        drawSpeechBubble(
            ctx, 
            bubbleX, 
            auntie.y, 
            auntieSpeech, 
            auntie.currentType === 2 ? "side" : "top"
        );
    }
}
    const startX = canvas.width - 100, startY = 150;
    ctx.strokeStyle = "#5d4037"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(startX, startY + 80); ctx.stroke();
    ctx.fillStyle = (Math.abs(wind) > 1.5) ? "#ff4444" : "#ffcc00";
    ctx.beginPath(); ctx.moveTo(startX, startY); ctx.quadraticCurveTo(startX + wind*20, startY + 15 + Math.sin(flagWave)*10, startX + wind*20, startY + 30); ctx.lineTo(startX, startY + 40); ctx.fill();

    darts.forEach(dart => { if (dart.active) { ctx.save(); ctx.translate(dart.x, dart.y); ctx.rotate(Math.atan2(dart.vy, dart.vx) + Math.PI/2); if (dartImg.complete) { const ratio = dartImg.width / dartImg.height; ctx.drawImage(dartImg, -30*ratio, -30, 60*ratio, 60); } ctx.restore(); } });
    
    if (gameActive || isCountingDown) {
        let finalHandX = getStartX() + handX, finalHandY = getStartY();
        ctx.save(); ctx.translate(finalHandX, finalHandY); ctx.rotate(handTilt); 
        if (handImg.complete) { const hRatio = handImg.width / handImg.height; if (isReloading) ctx.globalAlpha = 0.4; ctx.drawImage(handImg, -125 * hRatio, -125, 250 * hRatio, 250); }
        ctx.restore();
    }

    document.getElementById('score').innerText = `${totalScore} (x${comboCount})`;
    document.getElementById('power-fill').style.height = power + '%';
    document.getElementById('wind-info').innerText = `เวลา: ${timeLeft}s | ลม: ${wind.toFixed(1)}`;
    ctx.restore();
}

window.addEventListener('keydown', (e) => { if (e.code === 'Space' && gameActive && !isReloading) { isCharging = true; e.preventDefault(); } });
window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' && gameActive && isCharging) {
        playSfx(sounds.shoot);
        let currentHandX = getStartX() + handX, currentHandY = getStartY();
        let finalAngle = (-Math.PI / 2) + handTilt; 
        const launchSpeed = (power * 0.25) + 2.5; 
        darts.push({ x: currentHandX, y: currentHandY - 130, vx: Math.cos(finalAngle) * launchSpeed, vy: Math.sin(finalAngle) * launchSpeed, active: true });
        isReloading = true; isCharging = false;
        wind = (Math.random() * 5 - 2.5); setTimeout(() => { isReloading = false; }, 450);
    }
});

function loop() { update(); draw(); requestAnimationFrame(loop); }

function initCountdown() {
    if (isCountingDown) return; 
    isCountingDown = true; 
    countdownValue = 3;

    const overlay = document.getElementById('countdown-overlay');
    const textEl = document.getElementById('countdown-text');

    if (overlay) overlay.style.display = 'flex';
    
    // ล้างค่าเก่าทิ้งทันทีป้องกันการซ้อน
    if (textEl) {
        textEl.innerText = ""; 
        textEl.innerText = countdownValue;
    }

    const playCleanSfx = (audio) => {
        if (!audio) return;
        audio.pause();
        audio.currentTime = 0;
        audio.play().catch(e => {});
    };

    if (sounds.count) playCleanSfx(sounds.count);

    const countdownInterval = setInterval(() => {
        countdownValue--;

        // บังคับ Animation เริ่มใหม่
        if (textEl) {
            textEl.style.animation = 'none';
            textEl.offsetHeight; 
            textEl.style.animation = null;
        }

        if (countdownValue > 0) {
            textEl.innerText = countdownValue;
            if (sounds.count) playCleanSfx(sounds.count);
        } else if (countdownValue === 0) {
            textEl.innerText = "เริ่ม!";
            if (sounds.start) playCleanSfx(sounds.start);
        } else {
            clearInterval(countdownInterval);
            if (overlay) overlay.style.display = 'none';
            
            isCountingDown = false; 
            gameActive = true; 
            
            if (sounds.bgm) {
                sounds.bgm.currentTime = 0;
                sounds.bgm.play();
            }
            startMainTimer();
        }
    }, 1000);
}
let mainTimerInterval = null;
function startMainTimer() {
    if (mainTimerInterval) clearInterval(mainTimerInterval);
    mainTimerInterval = setInterval(() => { 
        if (gameActive) { 
            timeLeft--; 
            if (timeLeft <= 0) { 
                gameActive = false; 
                clearInterval(mainTimerInterval); 
                sounds.bgm.pause();
                sounds.bgm.currentTime = 0;
                sounds.rain.pause();
                sounds.rain.currentTime = 0;
                showScoreScreen(); 
            } 
        } 
    }, 1000);
}
// ค้นหาฟังก์ชัน showScoreScreen ใน game.js แล้วเปลี่ยนเป็นแบบนี้
function showScoreScreen() {
    document.getElementById('ui-layer').classList.add('ui-hidden');
    document.getElementById('power-bar').classList.add('ui-hidden');
    document.getElementById('instruction').classList.add('ui-hidden');
    
    const scoreScreen = document.getElementById('score-screen');
    scoreScreen.classList.remove('ui-hidden');
    
    // แสดงคะแนนใน id="total-score" ที่เราสร้างไว้
    const finalScoreDisplay = document.getElementById('total-score');
    if (finalScoreDisplay) {
        finalScoreDisplay.innerText = totalScore.toLocaleString();
    }
}
resize(); 
generateBalloons(); 
loop();