import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { createRoomSocket } from "../websocket/wsClient";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

/**
 * Lobby
 * - แสดงผู้เล่น
 * - Host กด Start
 * - Host ไม่เข้าเกม แต่เห็นสถานะผู้เล่นกำลังเล่น
 * - Player เข้า Festival Map เมื่อเกมเริ่ม
 */
export default function Lobby({
  roomCode,
  player,
  onLeave,
  onStartGame, // → Festival Map (PLAYER ONLY)
}) {
  /* =========================
     STATE
  ========================= */
  const [players, setPlayers] = useState([]);
  const [starting, setStarting] = useState(false);
  const [gameStarted, setGameStarted] = useState(false); // ⭐ เพิ่ม

  /* =========================
     REFS (GUARDS)
  ========================= */
  const wsRef = useRef(null);
  const mountedRef = useRef(false);
  const leavingRef = useRef(false);
  const startedRef = useRef(false);

  /* =========================
     SAFE SET STATE
  ========================= */
  const safeSet = useCallback((fn) => {
    if (mountedRef.current) fn();
  }, []);

  /* =========================
     LOAD ROOM (HTTP)
     → Backend = Source of Truth
  ========================= */
  const loadRoom = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/rooms/${roomCode}`
      );
      if (!res.ok) throw new Error();

      const data = await res.json();
      if (!mountedRef.current) return;

      safeSet(() =>
        setPlayers(
          Array.isArray(data.players)
            ? data.players.map((p) => ({
                id: p.id,
                name: p.name,
                team: p.team ?? null,
                isHost: p.is_host === true,
                connected: p.connected !== false,
                total_score:
                  p.total_score ?? p.score ?? 0,
              }))
            : []
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
      if (!mountedRef.current || !msg?.type) return;

      switch (msg.type) {
        /* ===== PLAYER JOIN ===== */
        case "player_join": {
          const p = msg.player;
          if (!p) return;

          safeSet(() =>
            setPlayers((prev) => {
              const exists = prev.find(
                (x) => x.id === p.id
              );
              if (exists) {
                return prev.map((x) =>
                  x.id === p.id
                    ? { ...x, connected: true }
                    : x
                );
              }
              return [
                ...prev,
                {
                  id: p.id,
                  name: p.name,
                  isHost: p.is_host === true,
                  connected: true,
                  total_score: p.score ?? 0,
                },
              ];
            })
          );
          break;
        }

        /* ===== PLAYER DISCONNECT ===== */
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

        /* ===== HOST TRANSFER ===== */
        case "host_transfer":
          safeSet(() =>
            setPlayers((prev) =>
              prev.map((p) => ({
                ...p,
                isHost: p.id === msg.player_id,
              }))
            )
          );
          break;

        /* ===== GAME START ===== */
        case "game_start":
          if (startedRef.current) return;
          startedRef.current = true;

          // ⭐ แยกพฤติกรรม Host / Player
          if (isMeHostRef.current) {
            safeSet(() => setGameStarted(true));
          } else {
            onStartGame?.(); // PLAYER → Festival Map
          }
          break;

        default:
          break;
      }
    },
    [onStartGame, safeSet]
  );

  /* =========================
     MOUNT / UNMOUNT
  ========================= */
  useEffect(() => {
    mountedRef.current = true;
    leavingRef.current = false;
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
     WS CONNECT
  ========================= */
  useEffect(() => {
    if (
      !player?.id ||
      leavingRef.current ||
      wsRef.current
    )
      return;

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

  // ⭐ ใช้ ref กัน stale closure
  const isMeHostRef = useRef(false);
  useEffect(() => {
    isMeHostRef.current = isMeHost;
  }, [isMeHost]);

  /* =========================
     START GAME (HOST)
  ========================= */
  const startGame = async () => {
    if (
      !isMeHost ||
      starting ||
      startedRef.current
    )
      return;

    setStarting(true);
    try {
      const res = await fetch(
        `${API_BASE}/rooms/${roomCode}/start`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error();
    } catch (err) {
      console.error("❌ startGame error", err);
      alert("❌ เริ่มเกมไม่สำเร็จ");
    } finally {
      safeSet(() => setStarting(false));
    }
  };

  /* =========================
     LEAVE ROOM
  ========================= */
  const leaveRoom = () => {
    if (leavingRef.current) return;
    leavingRef.current = true;

    wsRef.current?.close();
    wsRef.current = null;

    onLeave?.();
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="lobby-root">
      <h2>🎪 Lobby ห้อง {roomCode}</h2>

      <div style={{ marginBottom: 8 }}>
        คุณ: <b>{player.name}</b>{" "}
        {isMeHost && "(Host)"}
      </div>

      <h3>👥 ผู้เล่น</h3>
      <ul>
        {players.map((p) => (
          <li key={p.id}>
            {p.connected ? "🟢" : "🔴"}{" "}
            <b>{p.name}</b>
            {p.isHost && " ⭐"} —{" "}
            {p.total_score}
          </li>
        ))}
      </ul>

      {/* ===== HOST CONTROL ===== */}
      {isMeHost && !gameStarted && (
        <button
          onClick={startGame}
          disabled={starting}
          style={{ marginTop: 12 }}
        >
          {starting
            ? "⏳ กำลังเริ่ม..."
            : "▶ Start"}
        </button>
      )}

      {/* ===== HOST WAITING STATE ===== */}
      {isMeHost && gameStarted && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 8,
            background: "#fff3cd",
            color: "#856404",
          }}
        >
          ⏳ เกมเริ่มแล้ว <br />
          ผู้เล่นกำลังเล่นมินิเกมอยู่
        </div>
      )}

      <button
        onClick={leaveRoom}
        style={{ marginTop: 16 }}
      >
        ← ออกจากห้อง
      </button>
    </div>
  );
}
