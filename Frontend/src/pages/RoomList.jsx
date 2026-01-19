import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { createRoomSocket } from "../websocket/wsClient";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function RoomList({ player, onJoin, onBack }) {
  /* =========================
     STATE
  ========================= */
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningRoomCode, setJoiningRoomCode] = useState(null);
  const [error, setError] = useState(null);

  /* =========================
     REFS
  ========================= */
  const wsRef = useRef(null);
  const mountedRef = useRef(false);

  /* =========================
     Helpers
  ========================= */
  const normalizeName = (v = "") =>
    v.replace(/\s+/g, " ").trim();

  /* =========================
     Load rooms (REST)
  ========================= */
  const loadRooms = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/rooms`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!mountedRef.current) return;

      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ loadRooms error:", err);
      mountedRef.current &&
        setError("❌ โหลดรายการห้องไม่สำเร็จ");
    } finally {
      mountedRef.current && setLoading(false);
    }
  }, []);

  /* =========================
     MOUNT / UNMOUNT
  ========================= */
  useEffect(() => {
    mountedRef.current = true;
    loadRooms();

    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [loadRooms]);

  /* =========================
     GLOBAL WS (ROOM UPDATE)
  ========================= */
  useEffect(() => {
    if (!mountedRef.current) return;

    wsRef.current = createRoomSocket(
      "global",
      (msg) => {
        if (!mountedRef.current) return;
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
     JOIN ROOM
  ========================= */
  const joinRoom = async (room) => {
    if (
      !mountedRef.current ||
      joiningRoomCode !== null
    )
      return;

    if (room.status !== "waiting") {
      alert("⛔ เกมเริ่มไปแล้ว");
      return;
    }

    if (room.player_count >= room.max_players) {
      alert("👥 ห้องเต็มแล้ว");
      return;
    }

    const cleanName = normalizeName(player?.name);
    if (!cleanName) {
      alert("❌ ชื่อผู้เล่นไม่ถูกต้อง");
      return;
    }

    setJoiningRoomCode(room.code);

    try {
      const res = await fetch(
        `${API_BASE}/rooms/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            room_code: room.code,
            name: cleanName,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.error || "Join failed"
        );
      }

      // ✅ เข้า lobby
      onJoin(room.code, {
        id: data.player_id,
        name: cleanName,
      });
    } catch (err) {
      console.error("❌ joinRoom error:", err);
      alert("เข้าห้องไม่สำเร็จ\n" + err.message);
    } finally {
      mountedRef.current &&
        setJoiningRoomCode(null);
    }
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
          onClick={loadRooms}
          disabled={loading}
        >
          🔄 รีเฟรชรายการห้อง
        </button>

        {loading && <p>⏳ กำลังโหลด...</p>}
        {error && (
          <p style={{ color: "red" }}>{error}</p>
        )}

        {!loading &&
          !error &&
          rooms.length === 0 && (
            <p>😴 ยังไม่มีห้อง</p>
          )}

        {!loading &&
          rooms.map((room) => {
            const started =
              room.status !== "waiting";
            const full =
              room.player_count >=
              room.max_players;
            const joiningThis =
              joiningRoomCode === room.code;

            const disabled =
              started ||
              full ||
              joiningRoomCode !== null;

            return (
              <div
                key={room.code}
                className="room-card"
                style={{
                  opacity: disabled ? 0.6 : 1,
                }}
              >
                <b>
                  🏠{" "}
                  {room.name ||
                    "Thai Festival Room"}
                </b>
                <div>รหัส: {room.code}</div>
                <div>
                  👥 {room.player_count} /{" "}
                  {room.max_players}
                </div>

                {started && (
                  <div style={{ color: "#c0392b" }}>
                    ⛔ เกมเริ่มแล้ว
                  </div>
                )}

                {full && !started && (
                  <div style={{ color: "#e67e22" }}>
                    👥 ห้องเต็ม
                  </div>
                )}

                <button
                  disabled={disabled}
                  onClick={() => joinRoom(room)}
                >
                  {joiningThis
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
          style={{ marginTop: 16 }}
          onClick={onBack}
          disabled={joiningRoomCode !== null}
        >
          ← กลับหน้าแรก
        </button>
      </div>
    </div>
  );
}
