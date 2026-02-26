const moves = [
    { id: 1, imgColor: "images/ท่ามวยสี1.png", imgShadow: "images/ท่ามวยเงา1.png", imgName: "images/ป้าย11.png" },
    { id: 2, imgColor: "images/ท่ามวยสี2.png", imgShadow: "images/ท่ามวยเงา2.png", imgName: "images/ป้าย2.png" },
    { id: 3, imgColor: "images/ท่ามวยสี3.png", imgShadow: "images/ท่ามวยเงา3.png", imgName: "images/ป้าย3.png" },
    { id: 4, imgColor: "images/ท่ามวยสี4.png", imgShadow: "images/ท่ามวยเงา4.png", imgName: "images/ป้าย4.png" },
    { id: 5, imgColor: "images/ท่ามวยสี5.png", imgShadow: "images/ท่ามวยเงา5.png", imgName: "images/ป้าย6.png" }
];
const decoys = [
    { id: 99, imgName: "images/ป้ายหลอก1.png" },
    { id: 100, imgName: "images/ป้ายหลอก2.png" }
];
let timeLeft = 20;
let playTime = 15;
let isPlaying = false;
let timerInterval;

const introText = "สวัสดีขอรับ! จำท่ามวยและชื่อให้แม่นภายใน 20 วินาที แล้วลากชื่อวางที่เงาให้ถูกนะ!";
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
function playBGM() {
    const bgm = document.getElementById('bgMusic');
    if (bgm) {
        bgm.volume = 0.4; // ปรับความดัง 40% เพื่อไม่ให้กลบเสียงอื่น
        bgm.play().catch(e => console.log("BGM blocked by browser"));
    }
}

function stopBGM() {
    const bgm = document.getElementById('bgMusic');
    if (bgm) {
        bgm.pause();
        bgm.currentTime = 0;
    }
}
function playNPCSound() {
    const audio = document.getElementById('npcAudio');
    if (audio) {
        audio.currentTime = 0; // เริ่มใหม่ทุกครั้งที่เรียก
        // เล่นเสียงทันที
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log("Autoplay ถูกบล็อกโดยเบราว์เซอร์: เสียงจะเล่นหลังจากการโต้ตอบครั้งแรก");
                // วิธีแก้สำรอง: ให้เล่นเสียงเมื่อมีการขยับเมาส์หรือคลิกครั้งแรกในหน้าจอ
                document.addEventListener('mousedown', () => {
                    audio.play();
                }, { once: true });
            });
        }
    }
}

function typeWriter(text, elementId, speed, shouldPlaySound = false) {
    let i = 0;
    const element = document.getElementById(elementId);
    if (!element) return;
    element.innerHTML = ""; 

    if (shouldPlaySound) playNPCSound(); // เรียกใช้เสียงทันทีที่เริ่มพิมพ์

    function typing() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(typing, speed);
        }
    }
    typing();
}

function initGame() {
    // ... (ส่วนการสร้างบอร์ดเดิมของคุณ) ...
    const board = document.getElementById('board');
    if (!board) return;
    board.innerHTML = '';
    
    moves.forEach(move => {
        const container = document.createElement('div');
        container.className = 'card-container';
        container.dataset.slotId = move.id; 
        const imgBox = document.createElement('div');
        imgBox.className = 'image-box';
        imgBox.innerHTML = `<img src="${move.imgShadow}" id="img-display-${move.id}" class="real-img">`;
        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone';
        dropZone.addEventListener('drop', drop);
        dropZone.addEventListener('dragover', allowDrop);
        container.appendChild(imgBox);
        container.appendChild(dropZone);
        board.appendChild(container);
    });

    const deck = document.getElementById('deck');
    deck.innerHTML = ''; 
    deck.addEventListener('drop', drop);
    deck.addEventListener('dragover', allowDrop);
    deck.style.display = 'none';

    // เรียกใช้ Typewriter ทันทีที่โหลดหน้าจอ โดยตั้งค่าเป็น true เพื่อเล่นเสียง
    typeWriter(introText, "npcSpeech", 100, true); 
}


function startGame() {
    // ซ่อนหน้าจอเริ่ม
    document.getElementById('startScreen').style.display = 'none';
    
    // หยุดเสียง NPC ทันทีที่กดปุ่ม
    const audio = document.getElementById('npcAudio');
    if(audio) {
        audio.pause();
        audio.currentTime = 0; // รีเซ็ตเสียงให้กลับไปจุดเริ่มต้น
    }
    
    // เริ่มนับถอยหลัง 3 2 1
    startCountdown();
}

async function startCountdown() {
    // 1. เปลี่ยนชื่อ ID ให้มีขีดตาม CSS
    const overlay = document.getElementById('countdown-overlay');
    const numberDisplay = document.getElementById('countdown-text');
    
    const count321 = document.getElementById('countdownAudio');
    const startGo = document.getElementById('startGo');
    
    overlay.style.display = 'flex';

    if (count321) {
        count321.currentTime = 0;
        count321.play().catch(e => console.log("Audio blocked"));
    }

    for (let i = 3; i > 0; i--) {
        numberDisplay.innerText = i;
        
        // 2. สั่งให้เล่น Animation ซ้ำทุกครั้งที่เปลี่ยนเลข
        numberDisplay.style.animation = 'none';
        void numberDisplay.offsetWidth; // บังคับรีเฟรชแอนิเมชัน
        numberDisplay.style.animation = 'countBounce 0.5s ease-out forwards';
        
        await wait(1000);
    }

    if (startGo) startGo.play();
    numberDisplay.innerText = "เริ่ม!";
    
    // ใส่แอนิเมชันให้คำว่าเริ่มด้วย
    numberDisplay.style.animation = 'none';
    void numberDisplay.offsetWidth;
    numberDisplay.style.animation = 'countBounce 0.5s ease-out forwards';

    await wait(800); 
    overlay.style.display = 'none';
    playBGM(); 
    actualStartGame(); 
}function actualStartGame() {
    moves.forEach(move => {
        const img = document.getElementById(`img-display-${move.id}`);
        if(img) img.src = move.imgColor;
        const container = document.querySelector(`[data-slot-id="${move.id}"]`);
        const dropZone = container.querySelector('.drop-zone');
        dropZone.innerHTML = '';
        const nameCard = createNameCard(move);
        dropZone.appendChild(nameCard);
    });
    startMemorizeTimer();
}

function createNameCard(move) {
    const card = document.createElement('img');
    card.src = move.imgName;
    card.className = 'name-card-img';
    card.id = `card-${move.id}`;
    card.dataset.id = move.id;
    card.setAttribute('draggable', 'false');
    card.addEventListener('dragstart', drag);
    return card;
}
async function triggerMidGameShuffle() {
    const instruction = document.getElementById('instruction');
    const board = document.getElementById('board');
    const containers = Array.from(board.querySelectorAll('.card-container'));

    // แจ้งเตือนผู้เล่น
    instruction.innerText = "⚠️ ระวัง! ท่ามวยสลับตำแหน่ง!";
    instruction.style.filter = "drop-shadow(0 0 10px #ff0000)"; // เพิ่มแสงสีแดงเตือน

    // ใส่ Effect สั่นเล็กน้อยก่อนสลับ
    board.style.animation = "shake 0.5s";
    await wait(500);
    board.style.animation = "";

    // สลับตำแหน่งใน DOM (สลับที่ Container)
    containers.sort(() => Math.random() - 0.5);
    containers.forEach(container => board.appendChild(container));

    // เอฟเฟกต์แฟลชสีขาวตอนสลับเสร็จ
    board.style.backgroundColor = "rgba(255,255,255,0.3)";
    await wait(100);
    board.style.backgroundColor = "transparent";
}
function startMemorizeTimer() {
    timeLeft = 20;
    // แก้บรรทัดล่างนี้
    document.getElementById('timer').innerText = "เวลา:" + timeLeft; 
    document.getElementById('instruction').innerText = "ช่วงจดจำ: จำรูปท่าและชื่อให้แม่น!";
    document.getElementById('instruction').style.color = "#ffd700";
    
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        // และแก้บรรทัดนี้ด้วย
        document.getElementById('timer').innerText = "เวลา:" + timeLeft; 
        if(timeLeft <= 0) {
            clearInterval(timerInterval);
            animateShuffle(); 
        }
    }, 1000);
}

async function animateShuffle() {
    document.getElementById('instruction').innerText = "กำลังสลับไพ่...";
    const board = document.getElementById('board');
    const containers = Array.from(board.querySelectorAll('.card-container'));
    containers.forEach(c => {
        const dropZone = c.querySelector('.drop-zone');
        dropZone.style.opacity = '0';
        dropZone.innerHTML = ''; 
    });
    const boardRect = board.getBoundingClientRect();
    const boardCenterX = boardRect.left + boardRect.width / 2;
    const boardCenterY = boardRect.top + boardRect.height / 2;
    containers.forEach((container, index) => {
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const moveX = boardCenterX - centerX;
        const moveY = boardCenterY - centerY;
        const randomRotate = (Math.random() * 10) - 5; 
        container.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
        container.style.zIndex = index + 10;
        setTimeout(() => {
            container.style.transform = `translate(${moveX}px, ${moveY}px) rotate(${randomRotate}deg)`;
        }, index * 150);
    });
    await wait(500 + (containers.length * 150));
    moves.forEach(move => {
        const img = document.getElementById(`img-display-${move.id}`);
        if(img) img.src = move.imgShadow;
    });
    containers.forEach(c => {
        c.style.transition = 'none'; 
        c.style.transform = ''; 
        c.style.zIndex = '';
    });
    containers.sort(() => Math.random() - 0.5);
    containers.forEach(container => board.appendChild(container));
    containers.forEach(container => {
        const destRect = container.getBoundingClientRect();
        const destCenterX = destRect.left + destRect.width / 2;
        const destCenterY = destRect.top + destRect.height / 2;
        const startX = boardCenterX - destCenterX;
        const startY = boardCenterY - destCenterY;
        container.style.transform = `translate(${startX}px, ${startY}px)`;
    });
    document.body.offsetHeight;
    containers.forEach((container, index) => {
        container.style.transition = 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
        container.querySelector('.drop-zone').style.opacity = '1';
        setTimeout(() => {
            container.style.transform = ''; 
        }, index * 150);
    });
    await wait(600 + (containers.length * 150));
    containers.forEach(c => {
        c.style.transition = '';
        c.style.transform = '';
    });
    startGameplay();
}

function startGameplay() {
    isPlaying = true;
    playTime = 15;
    document.getElementById('instruction').innerText = "ระวังป้ายหลอก! ลากป้ายที่ถูกต้องวางที่รูปเงา!";
    document.getElementById('instruction').style.color = ""; 
    
    const deck = document.getElementById('deck');
    deck.style.display = 'flex';
    deck.innerHTML = ''; 

    // รวมการ์ดจริง 5 ใบ + การ์ดหลอก 2 ใบ เป็น 7 ใบ
    const allCardsData = [...moves, ...decoys];
    
    // สลับตำแหน่งการ์ดทั้งหมด
    allCardsData.sort(() => Math.random() - 0.5);

    allCardsData.forEach(move => {
        const card = createNameCard(move);
        card.setAttribute('draggable', 'true');
        deck.appendChild(card);
    });

    updateProgress();
    startPlayTimer();
}
let hasShuffledMidGame = false;

function startPlayTimer() {
    if (timerInterval) clearInterval(timerInterval);
    hasShuffledMidGame = false; // รีเซ็ตสถานะทุกครั้งที่เริ่มเล่นใหม่
    
    document.getElementById('timer').innerText = "เวลา:" + playTime;
    timerInterval = setInterval(() => {
        playTime--;
        document.getElementById('timer').innerText = "เวลา:" + playTime;

        // --- เพิ่มระบบสลับการ์ดตอน 5 วินาทีสุดท้าย ---
        if (playTime === 5 && !hasShuffledMidGame) {
            triggerMidGameShuffle();
            hasShuffledMidGame = true;
        }
        // ---------------------------------------

        if (playTime <= 0) {
            clearInterval(timerInterval);
            checkAnswer(true);
        }
    }, 1000);
}

function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData("text", ev.target.id); }

function drop(ev) {
    ev.preventDefault();
    if(!isPlaying) return;
    var data = ev.dataTransfer.getData("text");
    var draggedElement = document.getElementById(data);
    if (!draggedElement) return;
    let targetZone = ev.target.closest('.drop-zone') || ev.target.closest('.deck-area');
    if (targetZone) {
        if (targetZone.classList.contains('deck-area')) {
            targetZone.appendChild(draggedElement);
        } else if (targetZone.children.length === 0) {
            targetZone.appendChild(draggedElement);
        }
        updateProgress();
    }
}

function updateProgress() {
    let placedCount = 0;
    document.querySelectorAll('.drop-zone').forEach(zone => {
        if(zone.children.length > 0) placedCount++;
    });
    document.getElementById('placedCount').innerText = placedCount;
    document.getElementById('progressFill').style.width = `${(placedCount/5)*100}%`;
    if(placedCount === 5 && isPlaying) {
        setTimeout(() => { checkAnswer(false); }, 500);
    }
}

async function checkAnswer(isTimeUp = false) {
    clearInterval(timerInterval);
    isPlaying = false; 
    
    // หยุดเพลงพื้นหลังเมื่อจบเกม
    stopBGM();

    document.querySelectorAll('.name-card-img').forEach(c => c.setAttribute('draggable', 'false'));
    const containers = document.querySelectorAll('.card-container');
    let score = 0;

    containers.forEach(container => {
        const correctId = parseInt(container.dataset.slotId);
        const dropZone = container.querySelector('.drop-zone');
        let isCorrect = false;
        
        if(dropZone.children.length > 0) {
            const answerId = parseInt(dropZone.children[0].dataset.id);
            if(answerId === correctId) {
                score += 10;
                isCorrect = true;
            }
        }
        
        // แสดงผลลัพธ์ ถูก/ผิด บนการ์ด
        container.classList.remove('correct-box', 'wrong-box');
        container.classList.add(isCorrect ? 'correct-box' : 'wrong-box');
        
        // เผยรูปสีจริง
        const img = container.querySelector('.real-img');
        const moveData = moves.find(m => m.id === correctId);
        if(img && moveData) img.src = moveData.imgColor;
    });

    document.getElementById('score').innerText = `คะแนน:${score}`;

    // แสดงหน้าจอสรุปผล
    setTimeout(() => {
        const modal = document.getElementById('resultModal');
        const scoreDisplay = document.getElementById('finalScore');
        
        if (modal && scoreDisplay) {
            scoreDisplay.innerText = score; // ใส่ตัวเลขคะแนน
            modal.style.display = 'flex';   // เปิด Modal
        }
    }, 800);

    document.getElementById('deck').style.display = 'none';
}

// เรียกใช้งานฟังก์ชันเริ่มเกมครั้งแรก
initGame();