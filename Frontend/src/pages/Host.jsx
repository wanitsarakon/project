import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function Host({
  host,
  onCreateRoom,
  onBack,
}) {
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
     REFS
  ========================= */
  const passwordRef = useRef(null);
  const mountedRef = useRef(false);
  const creatingRef = useRef(false);

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
      setTimeout(() => passwordRef.current?.focus(), 0);
    } else {
      setPassword("");
    }
    setError(null);
  }, [isPrivate]);

  /* =========================
     HELPERS
  ========================= */
  const normalize = useCallback(
    (v = "") => String(v).replace(/\s+/g, " ").trim(),
    []
  );

  const setSafeState = useCallback((fn) => {
    if (mountedRef.current) fn();
  }, []);

  /* =========================
     CREATE ROOM
  ========================= */
  const createRoom = useCallback(async () => {
    if (loading || roomCode || creatingRef.current) return;

    const hostName = normalize(host?.name);
    if (!hostName) {
      setError("ไม่พบข้อมูล Host");
      return;
    }

    if (
      typeof maxPlayers !== "number" ||
      maxPlayers < 1 ||
      maxPlayers > 100
    ) {
      setError("จำนวนผู้เล่นต้องอยู่ระหว่าง 1 ถึง 100 คน");
      return;
    }

    const cleanPassword = normalize(password);
    if (isPrivate && cleanPassword.length < 4) {
      setError("รหัสห้องต้องอย่างน้อย 4 ตัวอักษร");
      return;
    }

    creatingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Thai Festival Room",
          mode,
          host_name: hostName,
          max_players: maxPlayers,
          room_password: isPrivate ? cleanPassword : null,
        }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        throw new Error("Invalid server response");
      }

      if (!res.ok) {
        throw new Error(data?.error || "สร้างห้องไม่สำเร็จ");
      }

      setSafeState(() => {
        setRoomCode(data.room_code);
        setCreatedPlayer({
          ...data.player,
          isHost: true, // ⭐ สำคัญมาก
        });
      });
    } catch (err) {
      console.error("❌ createRoom error:", err);
      setSafeState(() =>
        setError(
          err?.message ||
            "❌ สร้างห้องไม่สำเร็จ กรุณาลองใหม่"
        )
      );
    } finally {
      creatingRef.current = false;
      setSafeState(() => setLoading(false));
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
    setSafeState,
  ]);

  /* =========================
     ENTER LOBBY
  ========================= */
  const enterLobby = useCallback(() => {
    if (!roomCode || !createdPlayer || loading) return;
    onCreateRoom?.(roomCode, createdPlayer);
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

        {!roomCode && (
          <>
            {/* MODE */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 6 }}>
                🎮 โหมดการเล่น
              </div>

              <button
                className={`role-btn ${mode === "solo" ? "active" : ""}`}
                onClick={() => !loading && setMode("solo")}
                disabled={loading}
              >
                เดี่ยว (Solo)
              </button>

              <button
                className={`role-btn ${mode === "team" ? "active" : ""}`}
                onClick={() => !loading && setMode("team")}
                disabled={loading}
                style={{ marginLeft: 8 }}
              >
                ทีม (Team)
              </button>
            </div>

            {/* MAX PLAYERS */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 6 }}>
                👥 จำนวนผู้เล่นสูงสุด (1–100)
              </div>

              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={maxPlayers}
                onChange={(e) => {
                  if (loading) return;
                  const v = e.target.value.replace(/\D/g, "");
                  if (!v) return;
                  setMaxPlayers(
                    Math.min(100, Math.max(1, Number(v)))
                  );
                }}
                disabled={loading}
                className="room-input"
                style={{ width: 120, textAlign: "center" }}
              />
            </div>

            {/* PRIVATE ROOM */}
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

            <button
              className="confirm-btn"
              onClick={enterLobby}
              style={{ marginTop: 12 }}
            >
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
