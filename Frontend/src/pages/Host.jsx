import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function Host({ host, onCreateRoom, onBack }) {
  /* =========================
     STATE
  ========================= */
  const [loading, setLoading] = useState(false);
  const [roomCode, setRoomCode] = useState(null);
  const [createdPlayer, setCreatedPlayer] = useState(null);
  const [error, setError] = useState(null);

  /* =========================
     ROOM SETTINGS
  ========================= */
  const [mode, setMode] = useState("solo");
  const [maxPlayers, setMaxPlayers] = useState(8); // ⌨️ พิมพ์อย่างเดียว
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");

  /* =========================
     REFS
  ========================= */
  const passwordRef = useRef(null);
  const mountedRef = useRef(false);

  /* =========================
     LIFECYCLE
  ========================= */
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* =========================
     PRIVATE ROOM EFFECT
  ========================= */
  useEffect(() => {
    if (isPrivate) {
      passwordRef.current?.focus();
    } else {
      setPassword("");
    }
    setError(null);
  }, [isPrivate]);

  /* =========================
     HELPERS
  ========================= */
  const normalize = useCallback(
    (v = "") => v.replace(/\s+/g, " ").trim(),
    []
  );

  /* =========================
     CREATE ROOM
  ========================= */
  const createRoom = useCallback(async () => {
    if (loading || roomCode) return;

    if (!host?.name) {
      setError("ไม่พบข้อมูล Host");
      return;
    }

    if (maxPlayers < 1 || maxPlayers > 100) {
      setError("จำนวนผู้เล่นต้องอยู่ระหว่าง 1 ถึง 100 คน");
      return;
    }

    const cleanPassword = normalize(password);

    if (isPrivate && cleanPassword.length < 4) {
      setError("รหัสห้องต้องอย่างน้อย 4 ตัวอักษร");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Thai Festival Room",
          mode,
          host_name: host.name,
          max_players: maxPlayers,
          room_password: isPrivate ? cleanPassword : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "create room failed");
      }

      setRoomCode(data.room_code);
      setCreatedPlayer(data.player);
    } catch {
      if (mountedRef.current) {
        setError("❌ สร้างห้องไม่สำเร็จ กรุณาลองใหม่");
      }
    } finally {
      mountedRef.current && setLoading(false);
    }
  }, [
    loading,
    roomCode,
    host,
    mode,
    maxPlayers,
    isPrivate,
    password,
    normalize,
  ]);

  /* =========================
     ENTER LOBBY
  ========================= */
  const enterLobby = () => {
    if (!roomCode || !createdPlayer || loading) return;
    onCreateRoom(roomCode, createdPlayer);
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="home-root">
      <div className="panel">
        <h2>🧑‍💼 Host</h2>

        <p>
          ชื่อ: <b>{host?.name || "-"}</b>
        </p>

        {error && (
          <p style={{ color: "red", marginBottom: 12 }}>
            {error}
          </p>
        )}

        {!roomCode && (
          <>
            {/* Mode */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 6 }}>
                🎮 โหมดการเล่น
              </div>

              <button
                className={`role-btn ${
                  mode === "solo" ? "active" : ""
                }`}
                onClick={() => !loading && setMode("solo")}
                disabled={loading}
              >
                เดี่ยว (Solo)
              </button>

              <button
                className={`role-btn ${
                  mode === "team" ? "active" : ""
                }`}
                onClick={() => !loading && setMode("team")}
                disabled={loading}
                style={{ marginLeft: 8 }}
              >
                ทีม (Team)
              </button>
            </div>

            {/* Max players (INPUT ONLY) */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 6 }}>
                👥 จำนวนผู้เล่นสูงสุด (พิมพ์ 1–100)
              </div>

              <input
                type="text"                 // ⛔ ไม่ใช้ number
                inputMode="numeric"         // 📱 mobile keypad
                pattern="[0-9]*"
                value={maxPlayers}
                onChange={(e) => {
                  if (loading) return;
                  const v = e.target.value.replace(/\D/g, "");
                  if (v === "") return setMaxPlayers("");
                  const n = Math.min(100, Math.max(1, Number(v)));
                  setMaxPlayers(n);
                }}
                onWheel={(e) => e.currentTarget.blur()} // ⛔ scroll
                disabled={loading}
                className="room-input"
                style={{ width: 120, textAlign: "center" }}
                placeholder="1–100"
              />
            </div>

            {/* Private room */}
            <div style={{ marginBottom: 12 }}>
              <label>
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) =>
                    !loading && setIsPrivate(e.target.checked)
                  }
                  disabled={loading}
                />
                🔒 ห้องส่วนตัว
              </label>
            </div>

            {isPrivate && (
              <input
                ref={passwordRef}
                className="room-input"
                placeholder="ตั้งรหัสห้อง (≥ 4 ตัว)"
                value={password}
                onChange={(e) =>
                  !loading && setPassword(e.target.value)
                }
                disabled={loading}
              />
            )}

            <button
              className="confirm-btn"
              onClick={createRoom}
              disabled={loading}
              style={{ marginTop: 16 }}
            >
              {loading ? "⏳ กำลังสร้างห้อง..." : "➕ สร้างห้อง"}
            </button>
          </>
        )}

        {roomCode && (
          <div style={{ marginTop: 18, textAlign: "center" }}>
            <p>🎟 เลขที่ห้อง</p>
            <div style={{ fontSize: 32, fontWeight: "bold" }}>
              {roomCode}
            </div>

            <p style={{ fontSize: 14 }}>
              โหมด: {mode} | ผู้เล่นสูงสุด: {maxPlayers}
            </p>

            <button className="confirm-btn" onClick={enterLobby}>
              ▶ เข้าสู่ Lobby
            </button>
          </div>
        )}

        <button
          onClick={onBack}
          disabled={loading}
          style={{
            marginTop: 16,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#555",
          }}
        >
          ← ย้อนกลับ
        </button>
      </div>
    </div>
  );
}
