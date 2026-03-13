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
  const [prizes, setPrizes] = useState([
    "ตุ๊กตาตัวใหญ่",
    "ชุดขนมไทย",
    "พวงกุญแจงานวัด",
  ]);

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
          prizes: prizes
            .map((item) => normalize(item))
            .filter(Boolean),
          room_password: isPrivate ? cleanPassword : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "สร้างห้องไม่สำเร็จ");
      }

      setSafeState(() => {
        setRoomCode(data.room_code);
        setCreatedPlayer({
          ...data.player,
          isHost: true,
        });
      });
    } catch (err) {
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
      {/* ✅ PANEL กลาง (แก้ปัญหามองไม่เห็น) */}
      <div className="ui-panel">
        <h2 className="form-title">🧑‍💼 Host</h2>

        <p style={{ color: "#fff", marginBottom: 12 }}>
          ชื่อ: <b>{host?.name || "-"}</b>
        </p>

        {error && (
          <p style={{ color: "#ffb3b3", marginBottom: 12 }}>
            {error}
          </p>
        )}

        {!roomCode && (
          <>
            {/* MODE */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: "#fff", marginBottom: 6 }}>
                🎮 โหมดการเล่น
              </div>

              <div className="role-row">
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
                >
                  ทีม (Team)
                </button>
              </div>
            </div>

            {/* MAX PLAYERS */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: "#fff", marginBottom: 6 }}>
                👥 จำนวนผู้เล่นสูงสุด (1–100)
              </div>

              <input
                className="room-input"
                type="text"
                inputMode="numeric"
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
              />
            </div>

            {/* PRIVATE */}
            <div
              style={{
                marginBottom: 12,
                color: "#fff",
              }}
            >
              <label>
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) =>
                    !loading && setIsPrivate(e.target.checked)
                  }
                  disabled={loading}
                />{" "}
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

            <div style={{ marginTop: 18, textAlign: "left" }}>
              <div style={{ color: "#fff", marginBottom: 8 }}>
                🏆 ของรางวัลตามอันดับ
              </div>

              {prizes.map((prize, index) => (
                <div
                  key={`prize-${index}`}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      minWidth: 28,
                      color: "#ffd966",
                      fontWeight: 700,
                    }}
                  >
                    {index + 1}
                  </span>
                  <input
                    className="room-input"
                    style={{ width: "100%", margin: 0 }}
                    placeholder={`รางวัลอันดับ ${index + 1}`}
                    value={prize}
                    onChange={(e) =>
                      setPrizes((prev) =>
                        prev.map((item, i) =>
                          i === index ? e.target.value : item
                        )
                      )
                    }
                    disabled={loading}
                  />
                  {prizes.length > 1 && (
                    <button
                      type="button"
                      className="role-btn"
                      style={{ padding: "10px 14px" }}
                      onClick={() =>
                        setPrizes((prev) =>
                          prev.filter((_, i) => i !== index)
                        )
                      }
                      disabled={loading}
                    >
                      ลบ
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="role-btn"
                style={{ marginTop: 6 }}
                onClick={() =>
                  setPrizes((prev) => [...prev, ""])
                }
                disabled={loading || prizes.length >= 10}
              >
                เพิ่มรางวัล
              </button>
            </div>

            <button
              className="confirm-btn"
              onClick={createRoom}
              disabled={loading}
            >
              {loading
                ? "⏳ กำลังสร้างห้อง..."
                : "➕ สร้างห้อง"}
            </button>
          </>
        )}

        {roomCode && (
          <div style={{ marginTop: 18, textAlign: "center" }}>
            <p style={{ color: "#fff" }}>🎟 เลขที่ห้อง</p>
            <div
              style={{
                fontSize: 32,
                fontWeight: "bold",
                color: "#ffd966",
              }}
            >
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
          className="back-btn"
          onClick={onBack}
          disabled={loading}
        >
          ← ย้อนกลับ
        </button>
      </div>
    </div>
  );
}
