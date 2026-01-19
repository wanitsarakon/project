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
 * - เมื่อได้ game_start → ไป Festival Map
 */
export default function Lobby({
  roomCode,
  player,
  onLeave,
  onStartGame, // → Festival Map
}) {
  /* =========================
     STATE
  ========================= */
  const [players, setPlayers] = useState([]);
  const [starting, setStarting] = useState(false);

  /* =========================
     REFS (GUARDS)
  ========================= */
  const wsRef = useRef(null);
  const mountedRef = useRef(false);
  const leavingRef = useRef(false);
  const startedRef = useRef(false);

  /* =========================
     LOAD ROOM (ONCE)
  ========================= */
  const loadRoom = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/rooms/${roomCode}`
      );
      if (!res.ok) throw new Error();

      const data = await res.json();
      if (!mountedRef.current) return;

      setPlayers(
        Array.isArray(data.players)
          ? data.players.map((p) => ({
              id: p.id,
              name: p.name,
              isHost: p.is_host ?? false,
              connected: p.connected ?? true,
              total_score:
                p.score ?? p.total_score ?? 0,
            }))
          : []
      );
    } catch {
      console.error("❌ โหลดข้อมูลห้องไม่สำเร็จ");
    }
  }, [roomCode]);

  /* =========================
     WS MESSAGE HANDLER
  ========================= */
  const handleMessage = useCallback(
    (msg) => {
      if (!mountedRef.current || !msg?.type) return;

      switch (msg.type) {
        case "player_join":
          setPlayers((prev) => {
            const exists = prev.find(
              (p) => p.id === msg.player_id
            );
            if (exists) {
              return prev.map((p) =>
                p.id === msg.player_id
                  ? { ...p, connected: true }
                  : p
              );
            }
            return [
              ...prev,
              {
                id: msg.player_id,
                name: msg.name,
                connected: true,
                total_score: 0,
                isHost: false,
              },
            ];
          });
          break;

        case "player_disconnect":
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === msg.player_id
                ? { ...p, connected: false }
                : p
            )
          );
          break;

        case "host_transfer":
          setPlayers((prev) =>
            prev.map((p) => ({
              ...p,
              isHost: p.id === msg.player_id,
            }))
          );
          break;

        case "game_start":
          if (startedRef.current) return;
          startedRef.current = true;

          // ✅ แค่เปลี่ยนหน้า → Festival Map
          onStartGame?.();
          break;

        default:
          break;
      }
    },
    [onStartGame]
  );

  /* =========================
     MOUNT / UNMOUNT
  ========================= */
  useEffect(() => {
    mountedRef.current = true;
    leavingRef.current = false;
    startedRef.current = false;

    loadRoom();

    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [loadRoom]);

  /* =========================
     WS LIFECYCLE (ONCE)
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
  }, [roomCode, player.id, handleMessage]);

  /* =========================
     HOST CHECK
  ========================= */
  const isMeHost = players.some(
    (p) => p.id === player.id && p.isHost
  );

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
    } catch {
      alert("❌ เริ่มเกมไม่สำเร็จ");
    } finally {
      mountedRef.current && setStarting(false);
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

      <div>
        คุณ: <b>{player.name}</b>{" "}
        {isMeHost && "(Host)"}
      </div>

      <h3>👥 ผู้เล่น</h3>
      <ul>
        {players.map((p) => (
          <li key={p.id}>
            {p.connected ? "🟢" : "🔴"}{" "}
            <b>{p.name}</b>
            {p.isHost && " ⭐"} — {p.total_score}
          </li>
        ))}
      </ul>

      {isMeHost && (
        <button
          onClick={startGame}
          disabled={starting}
        >
          {starting
            ? "⏳ กำลังเริ่ม..."
            : "▶ Start"}
        </button>
      )}

      <button onClick={leaveRoom}>
        ← ออกจากห้อง
      </button>
    </div>
  );
}
