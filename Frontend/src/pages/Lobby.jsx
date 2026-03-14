import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { createRoomSocket } from "../websocket/wsClient";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:18082";

export default function Lobby({
  roomCode,
  player,
  onLeave,
  onStartGame,
}) {
  const [players, setPlayers] = useState([]);
  const [starting, setStarting] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [savingPrizes, setSavingPrizes] = useState(false);
  const [roomMeta, setRoomMeta] = useState({
    name: "",
    mode: "solo",
    prizes: [],
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
        setRoomMeta({
          name: data?.name ?? "Thai Festival Room",
          mode: data?.mode ?? "solo",
          prizes: nextPrizes,
        });
        setPrizeDraft(nextPrizes);
      });
    } catch (err) {
      console.error("loadRoom failed", err);
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
    if (!player?.id || !roomCode || wsRef.current) return undefined;

    wsRef.current = createRoomSocket(roomCode, handleMessage, {
      playerId: player.id,
    });

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [handleMessage, player?.id, roomCode]);

  const isMeHost = player
    ? players.some((entry) => entry?.id === player.id && entry?.isHost)
    : false;

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
    } catch (err) {
      console.error("startGame error", err);
      alert("เริ่มเกมไม่สำเร็จ");
    } finally {
      safeSet(() => setStarting(false));
    }
  };

  const savePrizes = async () => {
    if (!isMeHost || !player?.id || savingPrizes) return;

    setSavingPrizes(true);

    try {
      const res = await fetch(`${API_BASE}/rooms/${roomCode}/prizes?player_id=${player.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prizes: prizeDraft.map((item) => String(item || "").trim()).filter(Boolean),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "save prizes failed");
      }

      safeSet(() =>
        setRoomMeta((prev) => ({
          ...prev,
          prizes: Array.isArray(data?.prizes) ? data.prizes : [],
        })),
      );
      loadRoom();
    } catch (err) {
      console.error("savePrizes error", err);
      alert(err?.message || "บันทึกรางวัลไม่สำเร็จ");
    } finally {
      safeSet(() => setSavingPrizes(false));
    }
  };

  return (
    <div className="home-root">
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
                        onChange={(e) =>
                          setPrizeDraft((prev) =>
                            prev.map((item, i) => (i === index ? e.target.value : item)),
                          )
                        }
                        disabled={savingPrizes}
                      />
                      <button
                        className="festival-mini-btn"
                        onClick={() =>
                          setPrizeDraft((prev) => prev.filter((_, i) => i !== index))
                        }
                        disabled={savingPrizes}
                      >
                        ลบ
                      </button>
                    </div>
                  ))}
                </div>

                <div className="festival-form-actions row">
                  <button
                    className="festival-mini-btn add"
                    onClick={() => setPrizeDraft((prev) => [...prev, ""])}
                    disabled={savingPrizes || prizeDraft.length >= 10}
                  >
                    เพิ่มรางวัล
                  </button>
                  <button
                    className="festival-primary-btn small"
                    onClick={savePrizes}
                    disabled={savingPrizes}
                  >
                    {savingPrizes ? "กำลังบันทึก..." : "บันทึกรางวัล"}
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
            <button className="festival-primary-btn" onClick={startGame} disabled={starting}>
              {starting ? "กำลังเริ่มเกม..." : "เริ่มเกม"}
            </button>
          )}

          {isMeHost && gameStarted && (
            <div className="festival-helper-text">เกมเริ่มแล้ว ระบบกำลังพาผู้เล่นเข้าสู่แผนที่</div>
          )}

          {!isMeHost && !gameStarted && (
            <div className="festival-helper-text">รอ Host เริ่มเกม</div>
          )}

          <button className="festival-secondary-link" onClick={onLeave}>
            ออกจากห้อง
          </button>
        </div>
      </section>
    </div>
  );
}
