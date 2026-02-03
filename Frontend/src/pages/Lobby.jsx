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
  /* =========================
     STATE
  ========================= */
  const [players, setPlayers] = useState([]);
  const [starting, setStarting] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  /* =========================
     REFS
  ========================= */
  const wsRef = useRef(null);
  const mountedRef = useRef(false);
  const leavingRef = useRef(false);
  const startedRef = useRef(false);
  const isMeHostRef = useRef(false);

  /* =========================
     SAFE SET
  ========================= */
  const safeSet = useCallback((fn) => {
    if (mountedRef.current) fn();
  }, []);

  /* =========================
     LOAD ROOM
  ========================= */
  const loadRoom = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/rooms/${roomCode}`
      );
      if (!res.ok) throw new Error();

      const data = await res.json();

      safeSet(() =>
        setPlayers(
          Array.isArray(data.players)
            ? data.players.map((p) => ({
                id: p.id,
                name: p.name,
                isHost: p.is_host === true,
                connected: p.connected !== false,
                total_score: p.total_score ?? 0,
              }))
            : []
        )
      );
    } catch (err) {
      console.error("❌ loadRoom failed", err);
    }
  }, [roomCode, safeSet]);

  /* =========================
     WS MESSAGE
  ========================= */
  const handleMessage = useCallback(
    (msg) => {
      if (!mountedRef.current || !msg?.type) return;

      switch (msg.type) {
        case "player_join":
          safeSet(() =>
            setPlayers((prev) => {
              const exists = prev.find(
                (p) => p.id === msg.player.id
              );
              if (exists) {
                return prev.map((p) =>
                  p.id === msg.player.id
                    ? { ...p, connected: true }
                    : p
                );
              }
              return [
                ...prev,
                {
                  id: msg.player.id,
                  name: msg.player.name,
                  isHost: msg.player.is_host,
                  connected: true,
                  total_score: 0,
                },
              ];
            })
          );
          break;

        case "player_disconnect":
          safeSet(() =>
            setPlayers((prev) =>
              prev.map((p) =>
                p.id === msg.player_id
                  ? { ...p, connected: false }
                  : p
              )
            )
          );
          break;

        case "game_start":
          if (startedRef.current) return;
          startedRef.current = true;

          if (isMeHostRef.current) {
            safeSet(() => setGameStarted(true));
          } else {
            onStartGame?.();
          }
          break;

        default:
          break;
      }
    },
    [onStartGame, safeSet]
  );

  /* =========================
     MOUNT
  ========================= */
  useEffect(() => {
    mountedRef.current = true;
    startedRef.current = false;
    setGameStarted(false);

    loadRoom();

    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
    };
  }, [loadRoom]);

  /* =========================
     WS CONNECT
  ========================= */
  useEffect(() => {
    if (!player?.id || wsRef.current) return;

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

  /* =========================
     HOST CHECK
  ========================= */
  const isMeHost = players.some(
    (p) => p.id === player.id && p.isHost
  );

  useEffect(() => {
    isMeHostRef.current = isMeHost;
  }, [isMeHost]);

  /* =========================
     START GAME
  ========================= */
  const startGame = async () => {
    if (!isMeHost || starting) return;

    setStarting(true);
    try {
      const res = await fetch(
        `${API_BASE}/rooms/${roomCode}/start`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error();
    } catch {
      alert("❌ เริ่มเกมไม่สำเร็จ");
    } finally {
      safeSet(() => setStarting(false));
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="home-root">
      <div className="ui-panel lobby-panel">
        <h2 className="lobby-title">
          🎪 Lobby ห้อง {roomCode}
        </h2>

        {/* HOST BADGE */}
        <div className="lobby-me">
          คุณ: <b>{player.name}</b>
          {isMeHost && (
            <span className="host-badge">
              HOST
            </span>
          )}
        </div>

        {/* PLAYER LIST */}
        <div className="player-section">
          <h3>👥 ผู้เล่น</h3>
          <ul className="player-list">
            {players.map((p) => (
              <li
                key={p.id}
                className={`player-item ${
                  p.isHost ? "host" : ""
                }`}
              >
                <span>
                  {p.connected ? "🟢" : "🔴"}{" "}
                  {p.name}
                  {p.isHost && " ⭐"}
                </span>
                <span className="score">
                  {p.total_score}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* HOST CONTROL */}
        {isMeHost && !gameStarted && (
          <button
            className="start-btn big"
            onClick={startGame}
            disabled={starting}
          >
            {starting
              ? "⏳ กำลังเริ่มเกม..."
              : "▶ เริ่มเกม"}
          </button>
        )}

        {/* HOST WAITING */}
        {isMeHost && gameStarted && (
          <div className="host-wait">
            ⏳ เกมเริ่มแล้ว <br />
            ผู้เล่นกำลังเล่นมินิเกม
          </div>
        )}

        {/* PLAYER WAITING */}
        {!isMeHost && !gameStarted && (
          <div className="player-wait">
            ⏳ รอ Host เริ่มเกม
          </div>
        )}

        <button
          className="back-btn"
          onClick={onLeave}
        >
          ← ออกจากห้อง
        </button>
      </div>
    </div>
  );
}
