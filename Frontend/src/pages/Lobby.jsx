import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getFestivalBoothsBySceneKeys } from "../games/festivalBooths";
import { createRoomSocket } from "../websocket/wsClient";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:18082";

function isTransientFetchError(err) {
  const message = String(err?.message || "");
  return message.includes("Failed to fetch") || message.includes("NetworkError");
}

export default function Lobby({
  roomCode,
  player,
  initialSelectedBooths = [],
  onLeave,
  onStartGame,
}) {
  const [players, setPlayers] = useState([]);
  const [starting, setStarting] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [savingPrizes, setSavingPrizes] = useState(false);
  const [prizeEditorLocked, setPrizeEditorLocked] = useState(false);
  const [roomMeta, setRoomMeta] = useState({
    name: "",
    mode: "solo",
    prizes: [],
    selectedBooths: initialSelectedBooths,
    status: "waiting",
  });
  const [prizeDraft, setPrizeDraft] = useState([]);

  const wsRef = useRef(null);
  const mountedRef = useRef(false);
  const startedRef = useRef(false);

  const safeSet = useCallback((fn) => {
    if (mountedRef.current) fn();
  }, []);

  const loadRoom = useCallback(async () => {
    if (!roomCode) return;

    try {
      const res = await fetch(`${API_BASE}/rooms/${roomCode}`);
      if (!res.ok) throw new Error("room load failed");

      const data = await res.json();
      const list = Array.isArray(data?.players) ? data.players : [];
      const nextPrizes = Array.isArray(data?.prizes) ? data.prizes : [];

      safeSet(() => {
        setPlayers(
          list.map((entry) => ({
            id: entry?.id,
            name: entry?.name ?? "player",
            isHost: entry?.is_host === true,
            connected: entry?.connected !== false,
            totalScore: entry?.score ?? 0,
          })),
        );
        setRoomMeta((prev) => ({
          name: data?.name ?? "Thai Festival Room",
          mode: data?.mode ?? "solo",
          prizes: nextPrizes,
          selectedBooths: Array.isArray(data?.selected_booths) && data.selected_booths.length > 0
            ? data.selected_booths
            : prev.selectedBooths,
          status: data?.status ?? "waiting",
        }));
        setPrizeDraft(nextPrizes);
      });
    } catch (err) {
      if (!isTransientFetchError(err)) {
        console.error("loadRoom failed", err);
      }
    }
  }, [roomCode, safeSet]);

  const handleMessage = useCallback((msg) => {
    if (!mountedRef.current || !msg?.type) return;

    switch (msg.type) {
      case "player_join":
      case "player_disconnect":
      case "room_update":
        loadRoom();
        break;
      case "game_start":
        if (startedRef.current) return;
        startedRef.current = true;
        safeSet(() => setGameStarted(true));
        onStartGame?.();
        break;
      default:
        break;
    }
  }, [loadRoom, onStartGame, safeSet]);

  useEffect(() => {
    mountedRef.current = true;
    startedRef.current = false;
    setGameStarted(false);
    loadRoom();

    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [loadRoom]);

  useEffect(() => {
    if (!Array.isArray(initialSelectedBooths) || initialSelectedBooths.length === 0) return;

    setRoomMeta((prev) => (
      prev.selectedBooths.length > 0
        ? prev
        : {
            ...prev,
            selectedBooths: initialSelectedBooths,
          }
    ));
  }, [initialSelectedBooths]);

  useEffect(() => {
    if (!roomCode) return undefined;

    const intervalId = window.setInterval(() => {
      loadRoom();
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadRoom, roomCode]);

  useEffect(() => {
    if (!player?.id || !roomCode || wsRef.current) return undefined;

    wsRef.current = createRoomSocket(roomCode, handleMessage, {
      playerId: player.id,
    });

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [handleMessage, player?.id, roomCode]);

  useEffect(() => {
    if (roomMeta.status !== "playing") return;
    if (startedRef.current) return;
    startedRef.current = true;
    safeSet(() => setGameStarted(true));
    onStartGame?.();
  }, [onStartGame, roomMeta.status, safeSet]);

  const isMeHost = player
    ? players.some((entry) => entry?.id === player.id && entry?.isHost)
    : false;

  const unlockPrizeEditor = useCallback(() => {
    if (savingPrizes) return;
    setPrizeEditorLocked(false);
  }, [savingPrizes]);

  const startGame = async () => {
    if (!player?.id || !isMeHost || starting) return;

    setStarting(true);

    try {
      const res = await fetch(`${API_BASE}/rooms/${roomCode}/start?player_id=${player.id}`, {
        method: "POST",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "start failed");
      }

      safeSet(() => {
        setRoomMeta((prev) => ({ ...prev, status: "playing" }));
      });
    } catch (err) {
      console.error("startGame error", err);
      alert("เริ่มเกมไม่สำเร็จ");
    } finally {
      safeSet(() => setStarting(false));
    }
  };

  const savePrizes = async () => {
    if (!isMeHost || !player?.id || savingPrizes || prizeEditorLocked) return;

    setSavingPrizes(true);

    try {
      const normalizedPrizes = prizeDraft.map((item) => String(item || "").trim()).filter(Boolean);
      const res = await fetch(`${API_BASE}/rooms/${roomCode}/prizes?player_id=${player.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prizes: normalizedPrizes,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "save prizes failed");
      }

      safeSet(() => {
        const nextPrizes = Array.isArray(data?.prizes) ? data.prizes : [];
        setRoomMeta((prev) => ({
          ...prev,
          prizes: nextPrizes,
        }));
        setPrizeDraft(nextPrizes);
        setPrizeEditorLocked(true);
      });
      loadRoom();
    } catch (err) {
      console.error("savePrizes error", err);
      alert(err?.message || "บันทึกรางวัลไม่สำเร็จ");
    } finally {
      safeSet(() => setSavingPrizes(false));
    }
  };

  const handlePrizeChange = useCallback((index, value) => {
    setPrizeEditorLocked(false);
    setPrizeDraft((prev) => prev.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }, []);

  const removePrize = useCallback((index) => {
    setPrizeEditorLocked(false);
    setPrizeDraft((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }, []);

  const addPrize = useCallback(() => {
    setPrizeEditorLocked(false);
    setPrizeDraft((prev) => [...prev, ""]);
  }, []);

  const selectedBoothCards = useMemo(
    () => (
      roomMeta.selectedBooths.length > 0
        ? getFestivalBoothsBySceneKeys(roomMeta.selectedBooths)
        : []
    ),
    [roomMeta.selectedBooths],
  );

  return (
    <div className="home-root home-root-entry">
      <section className="festival-page-shell">
        <div className="landing-string-light string-top" />
        <div className="landing-string-light string-mid" />

        <div className="festival-page-card lobby-card-theme">
          <div className="festival-page-kicker">Lobby</div>
          <h1 className="festival-page-title">ห้อง {roomCode}</h1>
          <p className="festival-page-subtitle">
            คุณคือ <strong>{player?.name ?? "player"}</strong>
            {isMeHost ? " • Host" : ""}
          </p>

          <div className="festival-info-grid">
            <div className="festival-info-box">
              <div className="festival-section-label">ชื่อห้อง</div>
              <div>{roomMeta.name || "Thai Festival Room"}</div>
            </div>
            <div className="festival-info-box">
              <div className="festival-section-label">โหมด</div>
              <div>{roomMeta.mode === "team" ? "ทีม" : "เดี่ยว"}</div>
            </div>
          </div>

          <div className="festival-section">
            <div className="festival-section-label">ซุ้มที่ Host เลือกสำหรับรอบนี้</div>

            {selectedBoothCards.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                {selectedBoothCards.map((booth, index) => (
                  <div
                    key={booth.scene}
                    className="festival-info-box"
                    style={{
                      minWidth: 148,
                      padding: "10px 14px",
                      borderRadius: 18,
                    }}
                  >
                    <div className="festival-section-label" style={{ marginBottom: 4 }}>
                      ซุ้ม {index + 1}
                    </div>
                    <div>{booth.label}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="festival-helper-text">กำลังโหลดข้อมูลซุ้มที่ host เลือก...</div>
            )}
          </div>

          <div className="festival-section">
            <div className="festival-section-label">ของรางวัล</div>

            {isMeHost && !gameStarted ? (
              <>
                {prizeDraft.length === 0 && (
                  <div className="festival-helper-text">
                    ยังไม่ได้ตั้งของรางวัล กดเพิ่มรางวัลเพื่อใส่รายการเอง
                  </div>
                )}

                <div className="festival-prize-list">
                  {prizeDraft.map((prize, index) => (
                    <div key={`prize-${index}`} className="festival-prize-row">
                      <span className="festival-prize-rank">{index + 1}</span>
                      <input
                        className="festival-prize-input"
                        value={prize}
                        placeholder={`รางวัลอันดับ ${index + 1}`}
                        onChange={(event) => handlePrizeChange(index, event.target.value)}
                        disabled={savingPrizes || prizeEditorLocked}
                      />
                      <button
                        type="button"
                        className={`festival-mini-btn ${prizeEditorLocked ? "edit" : ""}`}
                        onClick={() => {
                          if (prizeEditorLocked) {
                            unlockPrizeEditor();
                            return;
                          }
                          removePrize(index);
                        }}
                        disabled={savingPrizes}
                      >
                        {prizeEditorLocked ? "แก้ไข" : "ลบ"}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="festival-form-actions row">
                  <button
                    type="button"
                    className="festival-mini-btn add"
                    onClick={addPrize}
                    disabled={savingPrizes || prizeEditorLocked || prizeDraft.length >= 10}
                  >
                    เพิ่มรางวัล
                  </button>
                  <button
                    type="button"
                    className={`festival-primary-btn small ${prizeEditorLocked ? "saved" : ""}`}
                    onClick={savePrizes}
                    disabled={savingPrizes || prizeEditorLocked}
                  >
                    {savingPrizes
                      ? "กำลังบันทึก..."
                      : prizeEditorLocked
                        ? "บันทึกเรียบร้อย"
                        : "บันทึกรางวัล"}
                  </button>
                </div>
              </>
            ) : roomMeta.prizes?.length > 0 ? (
              <div className="festival-prize-view">
                {roomMeta.prizes.map((prize, index) => (
                  <div key={`${prize}-${index}`} className="festival-prize-view-item">
                    อันดับ {index + 1}: {prize}
                  </div>
                ))}
              </div>
            ) : (
              <div className="festival-helper-text">ยังไม่ได้ตั้งของรางวัล</div>
            )}
          </div>

          <div className="festival-section">
            <div className="festival-section-label">ผู้เล่นในห้อง</div>
            <div className="festival-player-list">
              {players.map((entry) => (
                <div
                  key={entry?.id}
                  className={`festival-player-row ${entry?.isHost ? "host" : ""}`}
                >
                  <span>
                    {entry?.connected ? "ออนไลน์" : "ออฟไลน์"} • {entry?.name}
                    {entry?.isHost ? " ⭐" : ""}
                  </span>
                  <strong>{entry?.totalScore ?? 0}</strong>
                </div>
              ))}
            </div>
          </div>

          {isMeHost && !gameStarted && (
            <button type="button" className="festival-primary-btn" onClick={startGame} disabled={starting}>
              {starting ? "กำลังเริ่มเกม..." : "เริ่มเกม"}
            </button>
          )}

          {isMeHost && gameStarted && (
            <div className="festival-helper-text">เกมเริ่มแล้ว ระบบกำลังพาผู้เล่นเข้าสู่แผนที่</div>
          )}

          {!isMeHost && !gameStarted && (
            <div className="festival-helper-text">รอ Host เริ่มเกม</div>
          )}

          <button type="button" className="festival-secondary-link" onClick={onLeave}>
            ออกจากห้อง
          </button>
        </div>
      </section>
    </div>
  );
}
