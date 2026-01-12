import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoomSocket } from "../websocket/wsClient";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function RoomList({ player, onJoin, onBack }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningRoomCode, setJoiningRoomCode] = useState(null);
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  const aliveRef = useRef(true);

  /* =========================
     Load rooms
  ========================= */
  const loadRooms = useCallback(async () => {
    if (!aliveRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/rooms`);
      if (!res.ok) throw new Error();

      const data = await res.json();
      if (aliveRef.current) {
        setRooms(Array.isArray(data) ? data : []);
      }
    } catch {
      if (aliveRef.current) {
        setError("❌ โหลดรายการห้องไม่สำเร็จ");
      }
    } finally {
      if (aliveRef.current) {
        setLoading(false);
      }
    }
  }, []);

  /* =========================
     Mount / Unmount
  ========================= */
  useEffect(() => {
    aliveRef.current = true;
    loadRooms();

    return () => {
      aliveRef.current = false;
    };
  }, [loadRooms]);

  /* =========================
     Global WS (room list)
  ========================= */
  useEffect(() => {
    wsRef.current?.close();

    wsRef.current = createRoomSocket(
      "global",
      (msg) => {
        if (!aliveRef.current) return;
        if (msg?.type === "room_update") {
          loadRooms();
        }
      },
      { debug: false }
    );

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [loadRooms]);

  /* =========================
     Join room
  ========================= */
  const joinRoom = async (room) => {
    if (!aliveRef.current || joiningRoomCode) return;

    if (room.status !== "waiting") {
      alert("⛔ เกมเริ่มไปแล้ว ไม่สามารถเข้าร่วมได้");
      return;
    }

    if (room.player_count >= room.max_players) {
      alert("👥 ห้องเต็มแล้ว");
      return;
    }

    setJoiningRoomCode(room.code);

    try {
      const res = await fetch(`${API_BASE}/rooms/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: room.code,
          name: player.name,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "เข้าห้องไม่สำเร็จ");
      }

      onJoin(room.code, {
        id: data.player_id,
        name: player.name,
      });
    } catch (err) {
      alert("❌ เข้าห้องไม่สำเร็จ\n" + err.message);
    } finally {
      if (aliveRef.current) {
        setJoiningRoomCode(null);
      }
    }
  };

  /* =========================
     Back
  ========================= */
  const goBack = () => {
    wsRef.current?.close();
    onBack();
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="home-root">
      <div className="panel">
        <h2>🎮 เลือกห้อง</h2>

        <p>
          ผู้เล่น: <b>{player.name}</b>
        </p>

        <button
          style={{ marginBottom: 10 }}
          onClick={loadRooms}
          disabled={loading}
        >
          🔄 รีเฟรชรายการห้อง
        </button>

        {loading && <p>⏳ กำลังโหลดห้อง...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && !error && rooms.length === 0 && (
          <p>😴 ยังไม่มีห้องที่เปิดอยู่</p>
        )}

        {!loading &&
          rooms.map((room) => {
            const started = room.status !== "waiting";
            const full = room.player_count >= room.max_players;
            const joiningThisRoom = joiningRoomCode === room.code;
            const disabled = started || full || joiningThisRoom;

            return (
              <div
                key={room.code}
                style={{
                  marginTop: 12,
                  padding: 14,
                  borderRadius: 12,
                  background: "#fff",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                  opacity: disabled ? 0.6 : 1,
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: 16 }}>
                  🏠 {room.name || "Thai Festival Room"}
                </div>

                <div style={{ fontSize: 14, color: "#666" }}>
                  รหัสห้อง: {room.code}
                </div>

                <div style={{ fontSize: 13 }}>
                  โหมด: {room.mode || "solo"}
                </div>

                <div style={{ fontSize: 13, marginTop: 4 }}>
                  👥 ผู้เล่น:{" "}
                  <b>
                    {room.player_count} / {room.max_players}
                  </b>
                </div>

                {started && (
                  <div
                    style={{
                      color: "#c0392b",
                      fontSize: 13,
                      marginTop: 6,
                    }}
                  >
                    ⛔ เกมเริ่มไปแล้ว
                  </div>
                )}

                {full && !started && (
                  <div
                    style={{
                      color: "#e67e22",
                      fontSize: 13,
                      marginTop: 6,
                    }}
                  >
                    👥 ห้องเต็ม
                  </div>
                )}

                <button
                  className="confirm-btn"
                  style={{ marginTop: 10 }}
                  disabled={disabled}
                  onClick={() => joinRoom(room)}
                >
                  {joiningThisRoom
                    ? "⏳ กำลังเข้า..."
                    : started
                    ? "เกมเริ่มแล้ว"
                    : full
                    ? "ห้องเต็ม"
                    : "เข้าร่วม"}
                </button>
              </div>
            );
          })}

        <button
          style={{ marginTop: 20 }}
          onClick={goBack}
          disabled={joiningRoomCode !== null}
        >
          ← กลับหน้าแรก
        </button>
      </div>
    </div>
  );
}
