import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FESTIVAL_BOOTHS,
  FESTIVAL_WORSHIP_SCENE,
  getSelectableFestivalBooths,
  normalizeFestivalBoothSequence,
} from "../games/festivalBooths";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:18082";
const SELECTABLE_BOOTHS = getSelectableFestivalBooths();
const DEFAULT_SELECTED_BOOTHS = SELECTABLE_BOOTHS.map((booth) => booth.scene);

function toFriendlyError(err) {
  const message = String(err?.message || "");
  if (message === "Failed to fetch" || /fetch/i.test(message)) {
    return "ยังเชื่อมต่อ backend ไม่ได้ กรุณาเปิด backend ที่พอร์ต 18082 แล้วลองใหม่";
  }
  return message || "สร้างห้องไม่สำเร็จ กรุณาลองใหม่";
}

export default function Host({
  host,
  onCreateRoom,
  onBack,
}) {
  const [loading, setLoading] = useState(false);
  const [roomCode, setRoomCode] = useState(null);
  const [createdPlayer, setCreatedPlayer] = useState(null);
  const [error, setError] = useState(null);

  const [mode, setMode] = useState("solo");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  const [prizes, setPrizes] = useState([]);
  const [selectedBooths, setSelectedBooths] = useState(DEFAULT_SELECTED_BOOTHS);

  const passwordRef = useRef(null);
  const mountedRef = useRef(false);
  const creatingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isPrivate) {
      window.setTimeout(() => passwordRef.current?.focus(), 0);
    } else {
      setPassword("");
    }
    setError(null);
  }, [isPrivate]);

  const normalize = useCallback((value = "") => String(value).replace(/\s+/g, " ").trim(), []);

  const safeSet = useCallback((fn) => {
    if (mountedRef.current) fn();
  }, []);

  const selectedBoothSequence = useMemo(
    () => (selectedBooths.length > 0
      ? normalizeFestivalBoothSequence(selectedBooths)
      : [FESTIVAL_WORSHIP_SCENE]),
    [selectedBooths],
  );

  const selectedBoothCards = useMemo(() => {
    const sceneSet = new Set(selectedBoothSequence);
    return FESTIVAL_BOOTHS.filter((booth) => sceneSet.has(booth.scene));
  }, [selectedBoothSequence]);

  const toggleBooth = useCallback((sceneKey) => {
    setSelectedBooths((prev) => (
      prev.includes(sceneKey)
        ? prev.filter((item) => item !== sceneKey)
        : [...prev, sceneKey]
    ));
    setError(null);
  }, []);

  const selectAllBooths = useCallback(() => {
    setSelectedBooths(DEFAULT_SELECTED_BOOTHS);
    setError(null);
  }, []);

  const createRoom = useCallback(async () => {
    if (loading || roomCode || creatingRef.current) return;

    const hostName = normalize(host?.name);
    if (!hostName) {
      setError("ไม่พบข้อมูลชื่อเจ้าภาพ");
      return;
    }

    if (typeof maxPlayers !== "number" || maxPlayers < 1 || maxPlayers > 100) {
      setError("จำนวนผู้เล่นต้องอยู่ระหว่าง 1 ถึง 100 คน");
      return;
    }

    if (selectedBooths.length === 0) {
      setError("กรุณาเลือกอย่างน้อย 1 ซุ้มก่อนสร้างห้อง");
      return;
    }

    const cleanPassword = normalize(password);
    if (isPrivate && cleanPassword.length < 4) {
      setError("รหัสห้องต้องมีอย่างน้อย 4 ตัวอักษร");
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
          prizes: prizes.map((item) => normalize(item)).filter(Boolean),
          room_password: isPrivate ? cleanPassword : null,
          selected_booths: selectedBoothSequence,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "สร้างห้องไม่สำเร็จ");
      }

      safeSet(() => {
        setRoomCode(data.room_code);
        setCreatedPlayer({
          ...data.player,
          isHost: true,
        });
      });
    } catch (err) {
      safeSet(() => setError(toFriendlyError(err)));
    } finally {
      creatingRef.current = false;
      safeSet(() => setLoading(false));
    }
  }, [
    host,
    isPrivate,
    loading,
    maxPlayers,
    mode,
    normalize,
    password,
    prizes,
    roomCode,
    safeSet,
    selectedBoothSequence,
    selectedBooths.length,
  ]);

  const enterLobby = useCallback(() => {
    if (!roomCode || !createdPlayer || loading) return;
    onCreateRoom?.(roomCode, createdPlayer, {
      selectedBooths: selectedBoothSequence,
    });
  }, [createdPlayer, loading, onCreateRoom, roomCode, selectedBoothSequence]);

  return (
   <div className="home-root is-form">
     <section className="festival-form-shell">
        <div className="landing-string-light string-top" />
        <div className="landing-string-light string-mid" />

        <div className="festival-page-card host-page-card">
          <div className="festival-page-kicker">Host Setup</div>
          <h1 className="festival-page-title">สร้างห้องแข่งขัน</h1>
          <p className="festival-page-subtitle">ตั้งค่าห้องและเลือกซุ้มที่จะใช้ในการแข่งขันรอบนี้</p>

          <div className="host-page-content">
            <div className="festival-info-chip">
              ชื่อเจ้าภาพ: <strong>{host?.name || "-"}</strong>
            </div>

            {error && <div className="festival-error-box">{error}</div>}

            {!roomCode ? (
              <>
                <div className="festival-section">
                  <div className="festival-section-label">โหมดการเล่น</div>
                  <div className="festival-choice-row">
                    <button
                      type="button"
                      className={`festival-choice-pill ${mode === "solo" ? "active" : ""}`}
                      onClick={() => !loading && setMode("solo")}
                      disabled={loading}
                    >
                      เดี่ยว
                    </button>
                    <button
                      type="button"
                      className={`festival-choice-pill ${mode === "team" ? "active" : ""}`}
                      onClick={() => !loading && setMode("team")}
                      disabled={loading}
                    >
                      ทีม
                    </button>
                  </div>
                </div>

                <div className="festival-section">
                  <div className="festival-section-label">จำนวนผู้เล่นสูงสุด</div>
                  <input
                    className="festival-room-input"
                    type="text"
                    inputMode="numeric"
                    value={maxPlayers}
                    onChange={(event) => {
                      if (loading) return;
                      const value = event.target.value.replace(/\D/g, "");
                      if (!value) return;
                      setMaxPlayers(Math.min(100, Math.max(1, Number(value))));
                    }}
                    disabled={loading}
                  />
                </div>

                <div className="festival-section">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div className="festival-section-label">เลือกซุ้มเกมรอบนี้</div>
                      <div className="festival-helper-text">
                        ซุ้มไหว้พระขอพรจะถูกปิดท้ายให้อัตโนมัติเสมอ
                      </div>
                    </div>

                    <button
                      type="button"
                      className="festival-mini-btn add"
                      onClick={selectAllBooths}
                      disabled={loading}
                    >
                      เลือกทุกซุ้ม
                    </button>
                  </div>

                  <div className="festival-choice-row" style={{ marginTop: 12, flexWrap: "wrap" }}>
                    {SELECTABLE_BOOTHS.map((booth) => {
                      const isActive = selectedBooths.includes(booth.scene);
                      return (
                        <button
                          key={booth.scene}
                          type="button"
                          className={`festival-choice-pill ${isActive ? "active" : ""}`}
                          onClick={() => !loading && toggleBooth(booth.scene)}
                          disabled={loading}
                          style={{
                            minWidth: 132,
                            justifyContent: "center",
                            opacity: isActive ? 1 : 0.72,
                          }}
                        >
                          {booth.label}
                        </button>
                      );
                    })}
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      padding: "12px 14px",
                      borderRadius: 18,
                      border: "2px solid rgba(255, 214, 132, 0.28)",
                      background: "rgba(73, 35, 14, 0.34)",
                    }}
                  >
                    <div className="festival-section-label" style={{ marginBottom: 8 }}>
                      ลำดับซุ้มที่จะเล่น
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      {selectedBoothCards.map((booth, index) => (
                        <div
                          key={booth.scene}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 999,
                            background: booth.scene === FESTIVAL_WORSHIP_SCENE
                              ? "rgba(255, 235, 172, 0.18)"
                              : "rgba(255,255,255,0.08)",
                            border: booth.scene === FESTIVAL_WORSHIP_SCENE
                              ? "1px solid rgba(255, 224, 126, 0.56)"
                              : "1px solid rgba(255,255,255,0.12)",
                            color: "#fff1c9",
                            fontSize: 14,
                            fontWeight: 700,
                          }}
                        >
                          {index + 1}. {booth.label}
                          {booth.scene === FESTIVAL_WORSHIP_SCENE ? " (ปิดท้ายเสมอ)" : ""}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="festival-section">
                  <label className="festival-checkbox-row">
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(event) => !loading && setIsPrivate(event.target.checked)}
                      disabled={loading}
                    />
                    ห้องส่วนตัว
                  </label>

                  {isPrivate && (
                    <input
                      ref={passwordRef}
                      className="festival-room-input"
                      placeholder="ตั้งรหัสห้อง"
                      value={password}
                      onChange={(event) => !loading && setPassword(event.target.value)}
                      disabled={loading}
                    />
                  )}
                </div>

                <div className="festival-section">
                  <div className="festival-section-label">ของรางวัล (ไม่บังคับ)</div>

                  {prizes.length === 0 && (
                    <div className="festival-helper-text">
                      ยังไม่ได้ตั้งของรางวัล กดเพิ่มรางวัลเพื่อใส่รายการเอง
                    </div>
                  )}

                  <div
                    className={`festival-prize-list host-prize-list ${
                      prizes.length > 3 ? "host-prize-list-scroll" : ""
                    }`}
                  >
                    {prizes.map((prize, index) => (
                      <div key={`prize-${index}`} className="festival-prize-row">
                        <span className="festival-prize-rank">{index + 1}</span>
                        <input
                          className="festival-prize-input"
                          placeholder={`รางวัลอันดับ ${index + 1}`}
                          value={prize}
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            setPrizes((prev) =>
                              prev.map((item, itemIndex) =>
                                itemIndex === index ? nextValue : item,
                              ),
                            );
                          }}
                          disabled={loading}
                        />
                        <button
                          type="button"
                          className="festival-mini-btn"
                          onClick={() =>
                            setPrizes((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
                          }
                          disabled={loading}
                        >
                          ลบ
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="festival-mini-btn add"
                    onClick={() => setPrizes((prev) => [...prev, ""])}
                    disabled={loading || prizes.length >= 10}
                  >
                    เพิ่มรางวัล
                  </button>
                </div>

                <button type="button" className="festival-primary-btn" onClick={createRoom} disabled={loading}>
                  {loading ? "กำลังสร้างห้อง..." : "สร้างห้อง"}
                </button>
              </>
            ) : (
              <div className="festival-created-box">
                <div className="festival-section-label">เลขที่ห้อง</div>
                <div className="festival-room-code">{roomCode}</div>
                <div className="festival-helper-text" style={{ marginBottom: 14 }}>
                  รอบนี้จะใช้ทั้งหมด {selectedBoothSequence.length} ซุ้ม
                </div>
                <button type="button" className="festival-primary-btn" onClick={enterLobby}>
                  เข้าสู่ Lobby
                </button>
              </div>
            )}
          </div>

          <button type="button" className="festival-secondary-link" onClick={onBack} disabled={loading}>
            ← ย้อนกลับ
          </button>
        </div>
      </section>
    </div>
  );
}
