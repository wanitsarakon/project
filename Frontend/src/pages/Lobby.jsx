import React, { useEffect, useRef, useState } from "react";
import { createRoomSocket } from "../websocket/wsClient";

export default function Lobby({ roomCode, player, isHost }) {
  const [players, setPlayers] = useState([]);
  const [logs, setLogs] = useState([]);
  const wsRef = useRef(null);

  /* =========================
     Helper: log
  ========================= */
  const addLog = (type, text) => {
    setLogs((prev) => [
      ...prev,
      {
        type,
        text,
        ts: new Date().toLocaleTimeString(),
      },
    ]);
  };

  /* =========================
     Load initial room state
  ========================= */
  useEffect(() => {
    fetch(`http://localhost:8080/rooms/${roomCode}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.players) {
          setPlayers(
            data.players.map((p) => ({
              id: p.id,
              name: p.name,
              team: p.team || null,
              total_score: p.score ?? p.total_score ?? 0,
              connected: true,
              isHost: p.isHost || false,
            }))
          );
        }
      })
      .catch(() => {
        addLog("error", "ไม่สามารถโหลดข้อมูลห้องได้");
      });
  }, [roomCode]);

  /* =========================
     WebSocket
  ========================= */
  useEffect(() => {
    wsRef.current = createRoomSocket(
      roomCode,
      handleMessage,
      { debug: true }
    );

    addLog("system", "กำลังเชื่อมต่อ WebSocket...");

    return () => {
      wsRef.current?.close();
      addLog("system", "ปิดการเชื่อมต่อ WebSocket");
    };
    // eslint-disable-next-line
  }, [roomCode]);

  /* =========================
     Handle WS messages
  ========================= */
  const handleMessage = (msg) => {
    console.log("WS message:", msg);

    switch (msg.type) {
      case "player_join": {
        const id = msg.player_id ?? msg.id;
        if (!id) return;

        setPlayers((prev) => {
          if (prev.find((p) => p.id === id)) return prev;
          return [
            ...prev,
            {
              id,
              name: msg.name || "Unknown",
              team: msg.team || null,
              total_score: 0,
              connected: true,
              isHost: false,
            },
          ];
        });

        addLog("player", `${msg.name} เข้าร่วมห้อง`);
        break;
      }

      case "score_update": {
        if (!msg.player_id) return;

        setPlayers((prev) =>
          prev.map((p) =>
            p.id === msg.player_id
              ? {
                  ...p,
                  total_score:
                    (p.total_score || 0) + (msg.score || 0),
                }
              : p
          )
        );

        addLog(
          "score",
          `ผู้เล่น ${msg.player_id} ได้ +${msg.score} คะแนน`
        );
        break;
      }

      case "player_disconnect": {
        if (!msg.player_id) return;

        setPlayers((prev) =>
          prev.map((p) =>
            p.id === msg.player_id
              ? { ...p, connected: false }
              : p
          )
        );

        addLog("system", `ผู้เล่น ${msg.player_id} หลุดการเชื่อมต่อ`);
        break;
      }

      case "room_start": {
        addLog("system", "🎮 เกมเริ่มแล้ว!");
        break;
      }

      default:
        addLog("unknown", JSON.stringify(msg));
    }
  };

  /* =========================
     Host action
  ========================= */
  const startGame = async () => {
    try {
      await fetch(`http://localhost:8080/rooms/${roomCode}/start`, {
        method: "POST",
      });
      addLog("system", "Host กดเริ่มเกม");
    } catch {
      addLog("error", "เริ่มเกมไม่สำเร็จ");
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h2>🎪 Lobby ห้อง {roomCode}</h2>

      <div style={{ marginBottom: 12 }}>
        คุณ: <b>{player?.name}</b> {isHost && "(Host)"}
      </div>

      <h3>👥 ผู้เล่น ({players.length})</h3>
      <ul>
        {players.map((p) => (
          <li key={p.id}>
            {p.connected ? "🟢" : "🔴"}{" "}
            <b>{p.name}</b>
            {p.isHost && " ⭐"}
            {p.team && ` (${p.team})`} — คะแนน: {p.total_score}
          </li>
        ))}
      </ul>

      {isHost && (
        <button
          onClick={startGame}
          style={{
            marginTop: 20,
            padding: "12px 24px",
            fontSize: 16,
            background: "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          ▶ Start Game
        </button>
      )}

      <hr style={{ margin: "20px 0" }} />

      <h4>📡 Event Log (Realtime)</h4>
      <ul style={{ fontSize: 13, color: "#555" }}>
        {logs.map((l, i) => (
          <li key={i}>
            [{l.ts}] [{l.type}] {l.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
