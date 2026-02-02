function startFirstRoom() {
    console.log("กำลังเข้าสู่ห้อง Living Room...");
    
    // เอฟเฟกต์หน้าจอวูบดำก่อนเปลี่ยนห้อง
    document.body.style.transition = "1s";
    document.body.style.backgroundColor = "black";
    document.getElementById('lobby-container').style.opacity = "0";

    setTimeout(() => {
        // เปลี่ยนหน้าไปยัง URL ของเกมห้องแรก
        window.location.href = "living-room.html"; 
    }, 1000);
}