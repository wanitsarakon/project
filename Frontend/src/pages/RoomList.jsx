import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createRoomSocket } from "../websocket/wsClient";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:18082";

export default function RoomList({
  player,
  onJoin,
  onBack,
}) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningRoomCode, setJoiningRoomCode] = useState(null);
  const [error, setError] = useState(null);
  const [roomSearch, setRoomSearch] = useState("");

  const wsRef = useRef(null);
  const mountedRef = useRef(false);
  const joiningRef = useRef(false);

  const normalizeName = useCallback((value = "") => String(value).replace(/\s+/g, " ").trim(), []);

  const safeSet = useCallback((fn) => {
    if (mountedRef.current) fn();
  }, []);

  const loadRooms = useCallback(async () => {
    safeSet(() => {
      setLoading(true);
      setError(null);
    });

    try {
      const res = await fetch(`${API_BASE}/rooms`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      safeSet(() => setRooms(Array.isArray(data) ? data : []));
    } catch (err) {
      console.error("loadRooms error:", err);
      safeSet(() => setError("โหลดรายการห้องไม่สำเร็จ"));
    } finally {
      safeSet(() => setLoading(false));
    }
  }, [safeSet]);

  useEffect(() => {
    mountedRef.current = true;
    loadRooms();

    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [loadRooms]);

  useEffect(() => {
    if (!mountedRef.current) return undefined;

    wsRef.current?.close();
    wsRef.current = createRoomSocket(
      "global",
      (msg) => {
        if (msg?.type === "room_update" && mountedRef.current) {
          loadRooms();
        }
      },
      { debug: false },
    );

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [loadRooms]);

  const joinRoom = useCallback(async (room) => {
    if (joiningRef.current || !mountedRef.current) return;

    if (room.status !== "waiting") {
      alert("ห้องนี้เริ่มเกมไปแล้ว");
      return;
    }

    if (room.player_count >= room.max_players) {
      alert("ห้องนี้เต็มแล้ว");
      return;
    }

    const cleanName = normalizeName(player?.name);
    if (!cleanName) {
      alert("ชื่อผู้เล่นไม่ถูกต้อง");
      return;
    }

    joiningRef.current = true;
    safeSet(() => setJoiningRoomCode(room.code));

    try {
      const res = await fetch(`${API_BASE}/rooms/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_code: room.code,
          name: cleanName,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "join failed");
      }

      const backendPlayer = data.player;
      if (!backendPlayer?.id) {
        throw new Error("invalid player data");
      }

      onJoin?.(room.code, {
        id: backendPlayer.id,
        name: backendPlayer.name,
        isHost: backendPlayer.is_host === true,
      });
    } catch (err) {
      console.error("joinRoom error:", err);
      alert(`เข้าห้องไม่สำเร็จ\n${err?.message || ""}`);
    } finally {
      joiningRef.current = false;
      safeSet(() => setJoiningRoomCode(null));
    }
  }, [normalizeName, onJoin, player?.name, safeSet]);

  const filteredRooms = useMemo(() => {
    const query = roomSearch.trim();
    if (!query) return rooms;
    return rooms.filter((room) => String(room?.code ?? "").includes(query));
  }, [roomSearch, rooms]);

  return (
    <div className="home-root">
      <section className="festival-page-shell">
        <div className="landing-string-light string-top" />
        <div className="landing-string-light string-mid" />

        <div className="festival-page-card">
          <div className="festival-page-kicker">Room List</div>
          <h1 className="festival-page-title">เลือกห้องแข่งขัน</h1>
          <p className="festival-page-subtitle">
            ผู้เล่น: <strong>{player?.name}</strong>
          </p>

          <div className="festival-room-toolbar">
            <div className="festival-room-search">
              <input
                className="festival-room-search-input"
                type="text"
                inputMode="numeric"
                placeholder="ค้นหาด้วยเลขห้อง"
                value={roomSearch}
                onChange={(event) => setRoomSearch(event.target.value.replace(/[^\d]/g, ""))}
              />
            </div>

            <button className="festival-mini-btn add" onClick={loadRooms} disabled={loading}>
              รีเฟรชรายการห้อง
            </button>
          </div>

          {loading && <div className="festival-helper-text">กำลังโหลดรายการห้อง...</div>}
          {error && <div className="festival-error-box">{error}</div>}
          {!loading && !error && rooms.length === 0 && (
            <div className="festival-helper-text">ยังไม่มีห้องที่เปิดรออยู่</div>
          )}
          {!loading && !error && rooms.length > 0 && filteredRooms.length === 0 && (
            <div className="festival-helper-text">ไม่พบห้องที่ตรงกับเลขห้องนี้</div>
          )}

          <div className="festival-room-list">
            {filteredRooms.map((room) => {
              const started = room.status !== "waiting";
              const full = room.player_count >= room.max_players;
              const joiningThis = joiningRoomCode === room.code;
              const disabled = started || full || joiningRoomCode !== null;

              return (
                <div key={room.code} className={`festival-room-card ${disabled ? "disabled" : ""}`}>
                  <div className="festival-room-head">
                    <strong>{room.name || "Thai Festival Room"}</strong>
                    <span>{room.mode === "team" ? "ทีม" : "เดี่ยว"}</span>
                  </div>

                  <div className="festival-room-meta">รหัสห้อง: {room.code}</div>
                  <div className="festival-room-meta">
                    ผู้เล่น {room.player_count} / {room.max_players}
                  </div>

                  <button
                    className="festival-primary-btn small"
                    disabled={disabled}
                    onClick={() => joinRoom(room)}
                  >
                    {joiningThis
                      ? "กำลังเข้าห้อง..."
                      : started
                        ? "เริ่มเกมแล้ว"
                        : full
                          ? "ห้องเต็ม"
                          : "เข้าร่วม"}
                  </button>
                </div>
              );
            })}
          </div>

          <button
            className="festival-secondary-link"
            onClick={onBack}
            disabled={joiningRoomCode !== null}
          >
            ← กลับหน้าแรก
          </button>
        </div>
      </section>
    </div>
  );
}
