import React, { useEffect, useRef, useState } from "react";
import GameContainer from "../games/GameContainer";
import { createRoomSocket } from "../websocket/wsClient";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function FestivalMap({
  roomCode,
  player,
  mode = "solo", // solo | team
  onLeave,
}) {
  /* =========================
     STATE
  ========================= */
  const [team, setTeam] = useState([]);        // [{ id, name }]
  const [scores, setScores] = useState({});   // { [playerId]: totalScore }

  const wsRef = useRef(null);

  /* =========================
     LOAD TEAM FROM SERVER
  ========================= */
  const loadTeamFromServer = async () => {
    if (mode !== "team") return;

    try {
      const res = await fetch(`${API_BASE}/rooms/${roomCode}`);
      const data = await res.json();

      if (!data?.players) return;

      const me = data.players.find((p) => p.id === player.id);
      if (!me?.team) return;

      const myTeam = data.players.filter(
        (p) => p.team === me.team
      );

      setTeam(
        myTeam.map((p) => ({
          id: p.id,
          name: p.name,
        }))
      );

      const scoreMap = {};
      myTeam.forEach((p) => {
        scoreMap[p.id] = p.score || p.total_score || 0;
      });
      setScores(scoreMap);
    } catch (err) {
      console.error("❌ loadTeamFromServer:", err);
    }
  };

  /* =========================
     WEBSOCKET
  ========================= */
  useEffect(() => {
    if (!roomCode || !player?.id) return;

    const socket = createRoomSocket(
      roomCode,
      () => {}, // default handler ไม่ใช้
      {
        playerId: player.id,
        mode,

        // 👥 TEAM UPDATE
        onTeamUpdate: () => {
          loadTeamFromServer();
        },

        // 🏆 SCORE UPDATE
        onScoreUpdate: ({ player_id, score }) => {
          setScores((prev) => ({
            ...prev,
            [player_id]: (prev[player_id] || 0) + score,
          }));
        },
      }
    );

    wsRef.current = socket;

    // โหลดทีมครั้งแรก
    loadTeamFromServer();

    return () => {
      socket.close();
      wsRef.current = null;
    };
  }, [roomCode, player.id, mode]);

  /* =========================
     UI
  ========================= */
  return (
    <div
      className="festival-map-root"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #fbe7c6 0%, #ffd89c 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px 16px",
        boxSizing: "border-box",
      }}
    >
      {/* =====================
          🎪 HEADER
      ===================== */}
      <header style={{ marginBottom: 12, textAlign: "center" }}>
        <div
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: "#5b2c00",
            fontFamily: "Kanit",
            textShadow: "0 2px 4px rgba(0,0,0,0.25)",
          }}
        >
          🎪 Festival Map
        </div>

        <div
          style={{
            marginTop: 4,
            fontSize: 16,
            color: "#7a4a1f",
            fontFamily: "Kanit",
            opacity: 0.85,
          }}
        >
          {mode === "team" ? "โหมดทีม" : "โหมดเดี่ยว"}
        </div>
      </header>

      {/* =====================
          👥 TEAM PANEL
      ===================== */}
      {mode === "team" && team.length > 0 && (
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            background: "rgba(255,255,255,0.95)",
            borderRadius: 16,
            padding: "12px 16px",
            marginBottom: 14,
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            fontFamily: "Kanit",
          }}
        >
          <div
            style={{
              fontWeight: 600,
              marginBottom: 8,
              color: "#5b2c00",
              fontSize: 16,
            }}
          >
            👥 ทีมของคุณ
          </div>

          {team.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 15,
                padding: "4px 0",
                borderBottom: "1px dashed #e0caa5",
              }}
            >
              <span>
                {p.name}
                {p.id === player.id && " (คุณ)"}
              </span>
              <span style={{ fontWeight: 600 }}>
                {scores[p.id] || 0} คะแนน
              </span>
            </div>
          ))}
        </div>
      )}

      {/* =====================
          🗺️ MAP (PHASER)
      ===================== */}
      <GameContainer
        roomCode={roomCode}
        player={player}
        wsRef={wsRef}
        onGameEnd={() => {
          // คะแนนจะ update ผ่าน WS อัตโนมัติ
        }}
      />

      {/* =====================
          🚪 EXIT
      ===================== */}
      <button
        onClick={onLeave}
        style={{
          marginTop: 18,
          padding: "14px 30px",
          borderRadius: 22,
          border: "none",
          background: "#e74c3c",
          color: "#fff",
          fontSize: 18,
          fontFamily: "Kanit",
          cursor: "pointer",
          boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
        }}
      >
        ออกจากห้อง
      </button>
    </div>
  );
}
