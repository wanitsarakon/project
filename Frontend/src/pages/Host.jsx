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
  const [mode, setMode] = useState("solo"); // solo | team
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");

  /* =========================
     REFS (lifecycle guards)
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

      if (!data?.room_code || !data?.player?.id) {
        throw new Error("invalid server response");
      }

      if (!mountedRef.current) return;

      setRoomCode(data.room_code);
      setCreatedPlayer(data.player);
    } catch (err) {
      console.error("❌ createRoom error:", err);
      if (mountedRef.current) {
        setError("❌ สร้างห้องไม่สำเร็จ กรุณาลองใหม่");
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
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
  const enterLobby = useCallback(() => {
    if (!roomCode || !createdPlayer || loading) return;
    onCreateRoom(roomCode, createdPlayer);
  }, [roomCode, createdPlayer, loading, onCreateRoom]);

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

        {/* =====================
            SETTINGS
        ===================== */}
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

            {/* Max players */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 6 }}>
                👥 จำนวนผู้เล่นสูงสุด
              </div>

              <select
                value={maxPlayers}
                onChange={(e) =>
                  !loading &&
                  setMaxPlayers(Number(e.target.value))
                }
                disabled={loading}
              >
                {[4, 6, 8, 10, 12].map((n) => (
                  <option key={n} value={n}>
                    {n} คน
                  </option>
                ))}
              </select>
            </div>

            {/* Private room */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) =>
                    !loading &&
                    setIsPrivate(e.target.checked)
                  }
                  style={{ marginRight: 6 }}
                  disabled={loading}
                />
                🔒 ห้องส่วนตัว (ต้องใส่รหัส)
              </label>
            </div>

            {isPrivate && (
              <input
                ref={passwordRef}
                className="room-input"
                placeholder="ตั้งรหัสห้อง (อย่างน้อย 4 ตัว)"
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
              {loading
                ? "⏳ กำลังสร้างห้อง..."
                : "➕ สร้างห้อง"}
            </button>
          </>
        )}

        {/* =====================
            ROOM CREATED
        ===================== */}
        {roomCode && (
          <div style={{ marginTop: 18, textAlign: "center" }}>
            <p>🎟 เลขที่ห้อง</p>

            <div
              style={{
                fontSize: 32,
                fontWeight: "bold",
                letterSpacing: 4,
                marginBottom: 10,
              }}
            >
              {roomCode}
            </div>

            <p style={{ fontSize: 14, color: "#555" }}>
              โหมด: {mode} | ผู้เล่นสูงสุด: {maxPlayers}
            </p>

            {isPrivate && (
              <p style={{ fontSize: 13, color: "#777" }}>
                🔒 ห้องส่วนตัว
              </p>
            )}

            <button
              className="confirm-btn"
              onClick={enterLobby}
            >
              ▶ เข้าสู่ Lobby
            </button>
          </div>
        )}

        {/* Back */}
        <button
          onClick={onBack}
          disabled={loading}
          style={{
            marginTop: 16,
            background: "transparent",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            color: "#555",
          }}
        >
          ← ย้อนกลับ
        </button>
      </div>
    </div>
  );
}
