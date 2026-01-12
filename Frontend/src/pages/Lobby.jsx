import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoomSocket } from "../websocket/wsClient";
import SummaryPage from "./SummaryPage";

export default function Lobby({ roomCode, player, onLeave }) {
  const [players, setPlayers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [summary, setSummary] = useState(null); // 🏆 END GAME

  const wsRef = useRef(null);
  const mountedRef = useRef(false);
  const leavingRef = useRef(false); // ⛔ กัน reconnect หลังออก

  /* =========================
     Helper: log (SAFE)
  ========================= */
  const addLog = useCallback((type, text) => {
    if (!mountedRef.current) return;
    setLogs((prev) => [
      ...prev,
      { type, text, ts: new Date().toLocaleTimeString() },
    ]);
  }, []);

  /* =========================
     Load room state (REST)
  ========================= */
  const loadRoom = useCallback(async () => {
    try {
      const res = await fetch(
        `http://localhost:8080/rooms/${roomCode}`
      );
      if (!res.ok) throw new Error();

      const data = await res.json();
      if (!mountedRef.current) return;

      setGameStarted(
        data.status === "started" || data.status === "playing"
      );

      if (Array.isArray(data.players)) {
        setPlayers(
          data.players.map((p) => ({
            id: p.id,
            name: p.name,
            isHost: p.isHost ?? p.is_host ?? false,
            connected: p.connected ?? true,
            total_score: p.score ?? p.total_score ?? 0,
          }))
        );
      }
    } catch {
      addLog("error", "❌ โหลดข้อมูลห้องไม่สำเร็จ");
    }
  }, [roomCode, addLog]);

  /* =========================
     WS handler (CORE)
  ========================= */
  const handleMessage = useCallback(
    (msg) => {
      if (!mountedRef.current || !msg?.type) return;

      switch (msg.type) {
        case "player_join":
          setPlayers((prev) => {
            const exists = prev.find((p) => p.id === msg.player_id);
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
          addLog("player", `${msg.name} เข้าร่วมห้อง`);
          break;

        case "player_disconnect":
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === msg.player_id
                ? { ...p, connected: false }
                : p
            )
          );
          addLog("system", "ผู้เล่นหลุดการเชื่อมต่อ");
          break;

        case "host_transfer":
          setPlayers((prev) =>
            prev.map((p) => ({
              ...p,
              isHost: p.id === msg.player_id,
            }))
          );
          addLog("system", "👑 Host ถูกโอนสิทธิ์");
          break;

        case "room_start":
        case "game_start":
          setGameStarted(true);
          addLog("system", "🎮 เกมเริ่มแล้ว!");
          break;

        case "score_update":
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === msg.player_id
                ? {
                    ...p,
                    total_score:
                      p.total_score + (msg.score || 0),
                  }
                : p
            )
          );
          break;

        /* 🏆 END GAME */
        case "game_summary":
          setSummary(msg.results || []);
          addLog("system", "🏆 เกมจบแล้ว");
          break;

        default:
          break;
      }
    },
    [addLog]
  );

  /* =========================
     Mount / Unmount
  ========================= */
  useEffect(() => {
    mountedRef.current = true;
    leavingRef.current = false;
    loadRoom();

    return () => {
      mountedRef.current = false;
    };
  }, [loadRoom]);

  /* =========================
     WebSocket (SAFE)
  ========================= */
  useEffect(() => {
    if (!player?.id || leavingRef.current) return;

    wsRef.current?.close();

    wsRef.current = createRoomSocket(
      roomCode,
      handleMessage,
      {
        playerId: player.id,
        debug: false,
      }
    );

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [roomCode, player.id, handleMessage]);

  /* =========================
     Host check
  ========================= */
  const isMeHost = players.some(
    (p) => p.id === player.id && p.isHost
  );

  /* =========================
     Start game (HOST)
  ========================= */
  const startGame = async () => {
    if (!isMeHost || gameStarted || starting) return;

    setStarting(true);
    try {
      const res = await fetch(
        `http://localhost:8080/rooms/${roomCode}/start`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error();

      addLog("system", "▶ Host เริ่มเกม");
    } catch {
      alert("❌ เริ่มเกมไม่สำเร็จ");
    } finally {
      if (mountedRef.current) setStarting(false);
    }
  };

  /* =========================
     Leave room (CLEAN)
  ========================= */
  const leaveRoom = () => {
    leavingRef.current = true;

    wsRef.current?.close();
    wsRef.current = null;

    setPlayers([]);
    setLogs([]);
    setSummary(null);

    onLeave();
  };

  /* =========================
     SUMMARY PAGE
  ========================= */
  if (summary) {
    return (
      <SummaryPage
        roomCode={roomCode}
        player={player}
        results={summary}
        isHost={isMeHost}
        onExit={leaveRoom}
      />
    );
  }

  /* =========================
     LOBBY UI
  ========================= */
  return (
    <div className="lobby-root">
      <h2>🎪 Lobby ห้อง {roomCode}</h2>

      <div>
        คุณ: <b>{player.name}</b> {isMeHost && "(Host)"}
      </div>

      {gameStarted && (
        <div style={{ color: "#c0392b", marginTop: 6 }}>
          🎮 เกมเริ่มแล้ว
        </div>
      )}

      <h3>👥 ผู้เล่น</h3>

      <ul>
        {players.map((p) => (
          <li key={p.id}>
            {p.connected ? "🟢" : "🔴"} <b>{p.name}</b>
            {p.isHost && " ⭐"} — {p.total_score} คะแนน
          </li>
        ))}
      </ul>

      {isMeHost && (
        <button
          className="start-btn"
          onClick={startGame}
          disabled={gameStarted || starting}
        >
          {starting ? "⏳ กำลังเริ่ม..." : "▶ Start Game"}
        </button>
      )}

      <hr />

      <h4>📡 Event Log</h4>
      <ul style={{ fontSize: 13 }}>
        {logs.map((l, i) => (
          <li key={i}>
            [{l.ts}] {l.text}
          </li>
        ))}
      </ul>

      <button
        onClick={leaveRoom}
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
  );
}
