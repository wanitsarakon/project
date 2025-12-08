import React, { useState } from "react";
// ถ้าคุณ import styles แบบ global ใน main.jsx แล้ว ไม่จำเป็นต้อง import ที่นี่อีก
// import "../styles.css";

export default function Home({ onEnter }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("player"); // default player
  const [roomInput, setRoomInput] = useState("");
  const [loading, setLoading] = useState(false);

  const apiBase = "http://localhost:8080";

  const handleOk = async () => {
    if (!name.trim()) {
      alert("กรุณากรอกชื่อ");
      return;
    }

    setLoading(true);
    try {
      if (role === "host") {
        const res = await fetch(`${apiBase}/rooms`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "ซุ้มงานวัด",
            mode: "team", // หรือ "solo"
            host_name: name,
            max_players: 8,
          }),
        });

        // พยายาม parse JSON แต่ถ้าไม่ใช่ JSON ให้ fallback
        let data;
        try {
          data = await res.json();
        } catch {
          data = {};
        }

        if (!res.ok) {
          alert("สร้างห้องไม่สำเร็จ: " + (data.error || res.status));
          return;
        }

        // ถ้า backend ส่ง room_code
        const roomCode = data.room_code || data.room || "";
        onEnter("host", name, roomCode, { id: data.host_id || null, name });
      } else {
        if (!roomInput.trim()) {
          alert("กรุณากรอกรหัสห้องเพื่อเข้าร่วม");
          return;
        }

        const res = await fetch(`${apiBase}/rooms/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, room_code: roomInput.trim() }),
        });

        let data;
        try {
          data = await res.json();
        } catch {
          data = {};
        }

        if (!res.ok) {
          alert("เข้าห้องไม่สำเร็จ: " + (data.error || res.status));
          return;
        }

        onEnter("player", name, roomInput.trim(), { id: data.player_id, name });
      }
    } catch (e) {
      console.error(e);
      alert("ไม่สามารถติดต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-root">
      <div className="panel">
        <h1 className="title">เกมงานวัด</h1>

        <input
          className="name-input"
          placeholder="ชื่อของคุณ"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="role-row">
          <button
            className={`role-btn ${role === "host" ? "active" : ""}`}
            onClick={() => setRole("host")}
            type="button"
            disabled={loading}
          >
            Host
          </button>
          <button
            className={`role-btn ${role === "player" ? "active" : ""}`}
            onClick={() => setRole("player")}
            type="button"
            disabled={loading}
          >
            Player
          </button>
        </div>

        {role === "player" && (
          <input
            className="room-input"
            placeholder="กรอกรหัสห้อง (ถ้ามี)"
            value={roomInput}
            onChange={(e) => setRoomInput(e.target.value)}
            disabled={loading}
          />
        )}

        <button
          className="confirm-btn"
          onClick={handleOk}
          disabled={loading}
        >
          {loading ? "กำลังประมวลผล..." : "ตกลง"}
        </button>
      </div>
    </div>
  );
}
