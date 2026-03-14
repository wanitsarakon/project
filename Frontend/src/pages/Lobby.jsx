import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { createRoomSocket } from "../websocket/wsClient";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

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
      const list = Array.isArray(data?.players)
        ? data.players
        : [];
      const nextPrizes = Array.isArray(data?.prizes)
        ? data.prizes
        : [];

      safeSet(() => {
        setPlayers(
          list.map((p) => ({
            id: p?.id,
            name: p?.name ?? "player",
            isHost: p?.is_host === true,
            connected: p?.connected !== false,
            total_score: p?.score ?? 0,
          }))
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

  const handleMessage = useCallback(
    (msg) => {
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
    },
    [loadRoom, onStartGame, safeSet]
  );

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
    if (!player?.id || !roomCode || wsRef.current) return;

    wsRef.current = createRoomSocket(
      roomCode,
      handleMessage,
      { playerId: player.id }
    );

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [roomCode, player?.id, handleMessage]);

  const isMeHost = player
    ? players.some(
        (p) => p?.id === player.id && p?.isHost
      )
    : false;

  const startGame = async () => {
    if (!player?.id || !isMeHost || starting) return;

    setStarting(true);

    try {
      const res = await fetch(
        `${API_BASE}/rooms/${roomCode}/start?player_id=${player.id}`,
        { method: "POST" }
      );

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
      const res = await fetch(
        `${API_BASE}/rooms/${roomCode}/prizes?player_id=${player.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prizes: prizeDraft
              .map((item) => String(item || "").trim())
              .filter(Boolean),
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "save prizes failed");
      }

      safeSet(() =>
        setRoomMeta((prev) => ({
          ...prev,
          prizes: Array.isArray(data?.prizes) ? data.prizes : [],
        }))
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
      <div className="ui-panel lobby-panel">
        <h2 className="lobby-title">
          Lobby ห้อง {roomCode}
        </h2>

        <div className="lobby-me">
          คุณ: <b>{player?.name ?? "player"}</b>
          {isMeHost && (
            <span className="host-badge">
              HOST
            </span>
          )}
        </div>

        <div className="lobby-card">
          <div className="lobby-card-title">
            ข้อมูลห้อง
          </div>
          <div>ชื่อห้อง: {roomMeta.name || "Thai Festival Room"}</div>
          <div>
            โหมด: {roomMeta.mode === "team" ? "ทีม" : "เดี่ยว"}
          </div>
        </div>

        <div className="lobby-card">
          <div className="lobby-card-title">
            ของรางวัล
          </div>

          {isMeHost && !gameStarted ? (
            <>
              {prizeDraft.length === 0 && (
                <div style={{ color: "#ffe2a3", marginBottom: 12 }}>
                  ยังไม่ได้ตั้งของรางวัล กด "เพิ่มรางวัล" เพื่อเพิ่มรายการเอง
                </div>
              )}

              {prizeDraft.map((prize, index) => (
                <div
                  key={`prize-${index}`}
                  className="lobby-prize-row"
                >
                  <span className="lobby-prize-rank">
                    {index + 1}
                  </span>
                  <input
                    className="room-input"
                    style={{ width: "100%", margin: 0 }}
                    value={prize}
                    placeholder={`รางวัลอันดับ ${index + 1}`}
                    onChange={(e) =>
                      setPrizeDraft((prev) =>
                        prev.map((item, i) =>
                          i === index ? e.target.value : item
                        )
                      )
                    }
                    disabled={savingPrizes}
                  />
                  {prizeDraft.length > 0 && (
                    <button
                      className="role-btn"
                      style={{ padding: "10px 14px" }}
                      onClick={() =>
                        setPrizeDraft((prev) =>
                          prev.filter((_, i) => i !== index)
                        )
                      }
                      disabled={savingPrizes}
                    >
                      ลบ
                    </button>
                  )}
                </div>
              ))}

              <div className="lobby-prize-actions">
                <button
                  className="role-btn"
                  onClick={() =>
                    setPrizeDraft((prev) => [...prev, ""])
                  }
                  disabled={savingPrizes || prizeDraft.length >= 10}
                >
                  เพิ่มรางวัล
                </button>
                <button
                  className="confirm-btn"
                  style={{ marginTop: 0 }}
                  onClick={savePrizes}
                  disabled={savingPrizes}
                >
                  {savingPrizes ? "กำลังบันทึก..." : "บันทึกรางวัล"}
                </button>
              </div>
            </>
          ) : roomMeta.prizes?.length > 0 ? (
            <ul className="lobby-prize-list">
              {roomMeta.prizes.map((prize, index) => (
                <li key={`${prize}-${index}`}>
                  อันดับ {index + 1}: {prize}
                </li>
              ))}
            </ul>
          ) : (
            <div>ยังไม่ได้ตั้งของรางวัล</div>
          )}
        </div>

        <div className="player-section">
          <h3>ผู้เล่น</h3>

          <ul className="player-list">
            {players?.map((p) => (
              <li
                key={p?.id ?? Math.random()}
                className={`player-item ${
                  p?.isHost ? "host" : ""
                }`}
              >
                <span>
                  {p?.connected ? "🟢" : "🔴"} {p?.name}
                  {p?.isHost && " ⭐"}
                </span>
                <span className="score">
                  {p?.total_score ?? 0}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {isMeHost && !gameStarted && (
          <button
            className="start-btn big"
            onClick={startGame}
            disabled={starting}
          >
            {starting ? "กำลังเริ่มเกม..." : "เริ่มเกม"}
          </button>
        )}

        {isMeHost && gameStarted && (
          <div className="host-wait">
            เกมเริ่มแล้ว
            <br />
            ระบบกำลังพาผู้เล่นเข้าสู่รอบแข่งขัน
          </div>
        )}

        {!isMeHost && !gameStarted && (
          <div className="player-wait">
            รอ Host เริ่มเกม
          </div>
        )}

        <button
          className="back-btn"
          onClick={onLeave}
        >
          ออกจากห้อง
        </button>
      </div>
    </div>
  );
}
