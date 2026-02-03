import React, { useEffect, useRef, useState, useCallback } from "react";
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
     ROLE
  ========================= */
  const isHost = player?.isHost === true;

  /* =========================
     STATE (PLAYER ONLY)
  ========================= */
  const [team, setTeam] = useState([]);
  const [scores, setScores] = useState({});

  const wsRef = useRef(null);
  const mountedRef = useRef(false);

  /* =========================
     SAFE SET
  ========================= */
  const safeSet = useCallback((fn) => {
    if (mountedRef.current) fn();
  }, []);

  /* =========================
     LOAD TEAM (TEAM MODE)
  ========================= */
  const loadTeamFromServer = useCallback(async () => {
    if (mode !== "team") return;

    try {
      const res = await fetch(
        `${API_BASE}/rooms/${roomCode}`
      );
      if (!res.ok) return;

      const data = await res.json();
      if (!Array.isArray(data?.players)) return;

      const me = data.players.find(
        (p) => p.id === player.id
      );
      if (!me?.team) return;

      const myTeam = data.players.filter(
        (p) => p.team === me.team
      );

      safeSet(() => {
        setTeam(
          myTeam.map((p) => ({
            id: p.id,
            name: p.name,
          }))
        );

        const scoreMap = {};
        myTeam.forEach((p) => {
          scoreMap[p.id] =
            p.total_score ?? p.score ?? 0;
        });
        setScores(scoreMap);
      });
    } catch (err) {
      console.error("❌ loadTeamFromServer:", err);
    }
  }, [mode, roomCode, player.id, safeSet]);

  /* =========================
     WEBSOCKET (PLAYER ONLY)
  ========================= */
  useEffect(() => {
    mountedRef.current = true;

    if (
      isHost ||
      !roomCode ||
      !player?.id
    ) {
      return () => {
        mountedRef.current = false;
      };
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
          safeSet(() =>
            setScores((prev) => ({
              ...prev,
              [player_id]:
                (prev[player_id] || 0) + score,
            }))
          );
        },
      }
    );

    wsRef.current = socket;
    loadTeamFromServer();

    return () => {
      mountedRef.current = false;
      socket?.close();
      wsRef.current = null;
    };
  }, [
    roomCode,
    player?.id,
    mode,
    isHost,
    loadTeamFromServer,
    safeSet,
  ]);

  /* =========================
     HOST VIEW (CONTROLLER)
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
            fontSize: 30,
            fontWeight: "bold",
            color: "#5b2c00",
            marginBottom: 12,
          }}
        >
          🎪 รอบกำลังดำเนินอยู่
        </div>

        <div
          style={{
            fontSize: 18,
            color: "#7a4a1f",
            marginBottom: 24,
          }}
        >
          Host ไม่ต้องเข้าเล่น <br />
          กำลังรอผู้เล่นทำมินิเกม
        </div>

        <button
          onClick={onLeave}
          style={{
            padding: "14px 32px",
            borderRadius: 24,
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
     PLAYER VIEW
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
        fontFamily: "Kanit",
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
            padding: 14,
            marginBottom: 14,
            boxShadow:
              "0 8px 20px rgba(0,0,0,0.15)",
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
                padding: "4px 0",
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
          // คะแนน sync ผ่าน WS
        }}
      />

      {/* ===== EXIT ===== */}
      <button
        onClick={onLeave}
        style={{
          marginTop: 18,
          padding: "14px 32px",
          borderRadius: 24,
          border: "none",
          background: "#e74c3c",
          color: "#fff",
          fontSize: 18,
          cursor: "pointer",
        }}
      >
        ออกจากห้อง
      </button>
    </div>
  );
}
