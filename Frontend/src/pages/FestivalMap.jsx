import React, { useEffect, useRef, useState } from "react";
import GameContainer from "../games/GameContainer";
import { createRoomSocket } from "../websocket/wsClient";

const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function FestivalMap({
  roomCode,
  player,
  mode = "solo",
  onLeave,
}) {
  /* =========================
     HOST GUARD (IMPORTANT)
     Host = Controller, not Player
  ========================= */
  const isHost = player?.isHost === true;

  /* =========================
     STATE (PLAYER ONLY)
  ========================= */
  const [team, setTeam] = useState([]);
  const [scores, setScores] = useState({});

  const wsRef = useRef(null);

  /* =========================
     LOAD TEAM (TEAM MODE)
  ========================= */
  const loadTeamFromServer = async () => {
    if (mode !== "team") return;

    try {
      const res = await fetch(
        `${API_BASE}/rooms/${roomCode}`
      );
      const data = await res.json();

      if (!data?.players) return;

      const me = data.players.find(
        (p) => p.id === player.id
      );
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
        scoreMap[p.id] =
          p.score ?? p.total_score ?? 0;
      });
      setScores(scoreMap);
    } catch (err) {
      console.error("❌ loadTeamFromServer:", err);
    }
  };

  /* =========================
     WEBSOCKET (PLAYER ONLY)
  ========================= */
  useEffect(() => {
    if (
      isHost || // ❌ Host ไม่ต้องมี WS เกม
      !roomCode ||
      !player?.id
    ) {
      return;
    }

    const socket = createRoomSocket(
      roomCode,
      () => {},
      {
        playerId: player.id,
        mode,

        onTeamUpdate: () => {
          loadTeamFromServer();
        },

        onScoreUpdate: ({
          player_id,
          score,
        }) => {
          setScores((prev) => ({
            ...prev,
            [player_id]:
              (prev[player_id] || 0) + score,
          }));
        },
      }
    );

    wsRef.current = socket;
    loadTeamFromServer();

    return () => {
      socket.close();
      wsRef.current = null;
    };
  }, [roomCode, player?.id, mode, isHost]);

  /* =========================
     HOST VIEW (WAITING)
  ========================= */
  if (isHost) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(180deg, #fbe7c6 0%, #ffd89c 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          textAlign: "center",
          fontFamily: "Kanit",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: "#5b2c00",
            marginBottom: 12,
          }}
        >
          🎪 เกมเริ่มแล้ว
        </div>

        <div
          style={{
            fontSize: 18,
            color: "#7a4a1f",
            marginBottom: 24,
          }}
        >
          ⏳ ผู้เล่นกำลังเล่นมินิเกมอยู่
        </div>

        <button
          onClick={onLeave}
          style={{
            padding: "14px 30px",
            borderRadius: 22,
            border: "none",
            background: "#e74c3c",
            color: "#fff",
            fontSize: 18,
            fontFamily: "Kanit",
            cursor: "pointer",
          }}
        >
          ออกจากห้อง
        </button>
      </div>
    );
  }

  /* =========================
     PLAYER VIEW (FESTIVAL MAP)
  ========================= */
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #fbe7c6 0%, #ffd89c 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px 16px",
      }}
    >
      {/* ===== HEADER ===== */}
      <header
        style={{
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: "#5b2c00",
            fontFamily: "Kanit",
          }}
        >
          🎪 Festival Map
        </div>
        <div
          style={{
            fontSize: 16,
            color: "#7a4a1f",
          }}
        >
          {mode === "team"
            ? "โหมดทีม"
            : "โหมดเดี่ยว"}
        </div>
      </header>

      {/* ===== TEAM PANEL ===== */}
      {mode === "team" && team.length > 0 && (
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            background: "#fff",
            borderRadius: 16,
            padding: 12,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            👥 ทีมของคุณ
          </div>

          {team.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
              }}
            >
              <span>
                {p.name}
                {p.id === player.id &&
                  " (คุณ)"}
              </span>
              <span>
                {scores[p.id] || 0}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* =====================
          🗺️ PHASER GAME
      ===================== */}
      <GameContainer
        roomCode={roomCode}
        player={player}
        wsRef={wsRef}
        onGameEnd={() => {
          // score update ผ่าน WS
        }}
      />

      {/* ===== EXIT ROOM ===== */}
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
        }}
      >
        ออกจากห้อง
      </button>
    </div>
  );
}
