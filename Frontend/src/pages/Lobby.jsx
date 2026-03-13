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
  const startedRef = useRef(false);
  const isMeHostRef = useRef(false);

  /* =========================
     SAFE STATE UPDATE
  ========================= */

  const safeSet = useCallback((fn) => {
    if (mountedRef.current) fn();
  }, []);

  /* =========================
     LOAD ROOM DATA
  ========================= */

  const loadRoom = useCallback(async () => {

    if (!roomCode) return;

    try {

      const res = await fetch(
        `${API_BASE}/rooms/${roomCode}`
      );

      if (!res.ok) throw new Error("room load failed");

      const data = await res.json();

      const list = Array.isArray(data?.players)
        ? data.players
        : [];

      safeSet(() =>
        setPlayers(
          list.map((p) => ({
            id: p?.id,
            name: p?.name ?? "player",
            isHost: p?.is_host === true,
            connected: p?.connected !== false,
            total_score: p?.score ?? 0,
          }))
        )
      );

    } catch (err) {

      console.error("❌ loadRoom failed", err);

    }

  }, [roomCode, safeSet]);

  /* =========================
     WS MESSAGE HANDLER
  ========================= */

  const handleMessage = useCallback(
    (msg) => {

      if (!mountedRef.current) return;
      if (!msg?.type) return;

      switch (msg.type) {

        case "player_join":

          safeSet(() =>
            setPlayers((prev) => {

              const exists = prev.find(
                (p) => p?.id === msg?.player?.id
              );

              if (exists) {

                return prev.map((p) =>
                  p?.id === msg?.player?.id
                    ? { ...p, connected: true }
                    : p
                );

              }

              return [
                ...prev,
                {
                  id: msg?.player?.id,
                  name: msg?.player?.name ?? "player",
                  isHost: msg?.player?.is_host === true,
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
                p?.id === msg?.player_id
                  ? { ...p, connected: false }
                  : p
              )
            )
          );

          break;

        case "game_start":

          console.log("🎮 GAME START EVENT");

          if (startedRef.current) return;

          startedRef.current = true;

          safeSet(() => setGameStarted(true));
          onStartGame?.();

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
      wsRef.current = null;

    };

  }, [loadRoom]);

  /* =========================
     CONNECT WEBSOCKET
  ========================= */

  useEffect(() => {

    if (!player?.id) return;
    if (!roomCode) return;
    if (wsRef.current) return;

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

  const isMeHost = player
    ? players.some(
        (p) => p?.id === player.id && p?.isHost
      )
    : false;

  useEffect(() => {
    isMeHostRef.current = isMeHost;
  }, [isMeHost]);

  /* =========================
     START GAME
  ========================= */

  const startGame = async () => {

    if (!player?.id) return;
    if (!isMeHost) return;
    if (starting) return;

    setStarting(true);

    try {

      const res = await fetch(
        `${API_BASE}/rooms/${roomCode}/start?player_id=${player.id}`,
        { method: "POST" }
      );

      if (!res.ok) {

        const text = await res.text();
        console.error(text);

        throw new Error("start failed");

      }

    } catch (err) {

      console.error("❌ startGame error", err);

      alert("เริ่มเกมไม่สำเร็จ");

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

        {/* PLAYER INFO */}

        <div className="lobby-me">

          คุณ: <b>{player?.name ?? "player"}</b>

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

            {players?.map((p) => (

              <li
                key={p?.id ?? Math.random()}
                className={`player-item ${
                  p?.isHost ? "host" : ""
                }`}
              >

                <span>

                  {p?.connected ? "🟢" : "🔴"}{" "}
                  {p?.name}

                  {p?.isHost && " ⭐"}

                </span>

                <span className="score">

                  {p?.total_score ?? 0}

                </span>

              </li>

            ))}

          </ul>

        </div>

        {/* HOST BUTTON */}

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

        {/* HOST WAIT */}

        {isMeHost && gameStarted && (

          <div className="host-wait">
            ⏳ เกมเริ่มแล้ว <br />
            ผู้เล่นกำลังเล่นมินิเกม
          </div>

        )}

        {/* PLAYER WAIT */}

        {!isMeHost && !gameStarted && (

          <div className="player-wait">
            ⏳ รอ Host เริ่มเกม
          </div>

        )}

        {/* LEAVE */}

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
