import React, { useCallback, useEffect, useRef, useState } from "react";
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

  const isHost = player?.isHost === true;

  const [team, setTeam] = useState([]);
  const [scores, setScores] = useState({});
  const [roundInfo, setRoundInfo] = useState({
    currentRound: 0,
    totalRounds: 0,
    currentGame: null,
    running: false,
  });
  const [startingRound, setStartingRound] = useState(false);

  const wsRef = useRef(null);
  const mountedRef = useRef(false);

  const safeSet = useCallback((fn) => {
    if (mountedRef.current) fn();
  }, []);

  const loadScoresFromServer = useCallback(async () => {

    if (!roomCode) return;

    try {

      const res = await fetch(`${API_BASE}/rooms/${roomCode}`);
      if (!res.ok) return;

      const data = await res.json();
      if (!Array.isArray(data?.players)) return;

      const scoreMap = {};
      data.players.forEach((p) => {
        scoreMap[p?.id] =
          p?.total_score ?? p?.score ?? 0;
      });

      safeSet(() => setScores(scoreMap));

      if (mode === "team" && player?.id) {
        const me = data.players.find(
          (p) => p?.id === player.id
        );

        if (me?.team) {
          const myTeam = data.players.filter(
            (p) => p?.team === me.team
          );

          safeSet(() =>
            setTeam(
              myTeam.map((p) => ({
                id: p?.id,
                name: p?.name ?? "player",
              }))
            )
          );
        }
      }

    } catch (err) {

      console.error("❌ loadScoresFromServer:", err);

    }

  }, [mode, player?.id, roomCode, safeSet]);

  const submitScore = useCallback(async ({
    roundId,
    score,
    meta = null,
  }) => {

    if (!roundId || !player?.id) return;

    try {

      const res = await fetch(
        `${API_BASE}/rounds/${roundId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            player_id: player.id,
            score: Math.max(0, Math.floor(score || 0)),
            meta,
          }),
        }
      );

      if (!res.ok) {
        const data =
          await res.json().catch(() => ({}));
        console.error("❌ submitScore failed:", data);
      }

    } catch (err) {

      console.error("❌ submitScore error:", err);

    }

  }, [player?.id]);

  useEffect(() => {

    mountedRef.current = true;

    if (!roomCode || !player?.id) {
      return () => {
        mountedRef.current = false;
      };
    }

    if (wsRef.current) return undefined;

    const socket = createRoomSocket(
      roomCode,
      () => {},
      {
        playerId: player.id,
        mode,
        onTeamUpdate: loadScoresFromServer,
        onScoreUpdate: ({ player_id, score }) => {
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
    loadScoresFromServer();

    return () => {

      mountedRef.current = false;

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

    };

  }, [
    loadScoresFromServer,
    mode,
    player?.id,
    roomCode,
    safeSet,
  ]);

  useEffect(() => {

    if (!wsRef.current) return undefined;

    const socket = wsRef.current;

    if (typeof socket.subscribe !== "function") {
      return undefined;
    }

    return socket.subscribe((msg) => {

      if (!msg?.type) return;

      if (msg.type === "round_start") {
        safeSet(() => {
          setRoundInfo({
            currentRound: msg.round ?? 0,
            totalRounds: msg.total_rounds ?? 0,
            currentGame: msg.game_key ?? null,
            running: true,
          });
          setStartingRound(false);
        });
      }

      if (msg.type === "round_end") {
        safeSet(() => {
          setRoundInfo((prev) => ({
            ...prev,
            running: false,
          }));
          setStartingRound(false);
        });
      }

    });

  }, [safeSet]);

  const startNextRound = useCallback(async () => {

    if (!isHost || !roomCode || startingRound) return;

    setStartingRound(true);

    try {

      const res = await fetch(
        `${API_BASE}/rooms/${roomCode}/round/start?player_id=${player.id}`,
        { method: "POST" }
      );

      if (!res.ok) {
        const data =
          await res.json().catch(() => ({}));
        throw new Error(
          data?.error || "start round failed"
        );
      }

    } catch (err) {

      console.error("❌ startNextRound:", err);
      alert(err?.message || "เริ่มรอบไม่สำเร็จ");
      safeSet(() => setStartingRound(false));

    }

  }, [isHost, player?.id, roomCode, safeSet, startingRound]);

  if (isHost) {

    return (

      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(180deg,#fbe7c6 0%,#ffd89c 100%)",
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
            width: "100%",
            maxWidth: 520,
            background: "rgba(255,255,255,0.94)",
            borderRadius: 24,
            padding: 28,
            boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
          }}
        >

          <div
            style={{
              fontSize: 32,
              fontWeight: "bold",
              color: "#5b2c00",
              marginBottom: 8,
            }}
          >
            Host Control
          </div>

          <div
            style={{
              color: "#7a4a1f",
              fontSize: 18,
              marginBottom: 16,
            }}
          >
            {roundInfo.running
              ? `กำลังเล่น ${roundInfo.currentGame || "-"}`
              : "พร้อมเริ่มรอบถัดไป"}
          </div>

          <div
            style={{
              background: "#fff4df",
              borderRadius: 16,
              padding: 14,
              color: "#5b2c00",
              marginBottom: 18,
            }}
          >
            รอบปัจจุบัน: {roundInfo.currentRound || 0}
            {roundInfo.totalRounds
              ? ` / ${roundInfo.totalRounds}`
              : ""}
          </div>

          <button
            onClick={startNextRound}
            disabled={startingRound || roundInfo.running}
            style={{
              padding: "14px 32px",
              borderRadius: 24,
              border: "none",
              background:
                startingRound || roundInfo.running
                  ? "#c8a97f"
                  : "#27ae60",
              color: "#fff",
              fontSize: 18,
              fontFamily: "Kanit",
              cursor:
                startingRound || roundInfo.running
                  ? "default"
                  : "pointer",
            }}
          >
            {startingRound
              ? "กำลังเริ่มรอบ..."
              : roundInfo.running
              ? "รอผู้เล่นจบรอบ"
              : "เริ่มรอบถัดไป"}
          </button>

        </div>

        <button
          onClick={onLeave}
          style={{
            marginTop: 20,
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

  return (

    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#fbe7c6 0%,#ffd89c 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px 16px",
        fontFamily: "Kanit",
      }}
    >

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
          {roundInfo.running
            ? `รอบ ${roundInfo.currentRound}${roundInfo.totalRounds ? ` / ${roundInfo.totalRounds}` : ""} : ${roundInfo.currentGame || "-"}`
            : "รอ Host เริ่มรอบถัดไป"}
        </div>

      </header>

      {mode === "team" && team?.length > 0 && (

        <div
          style={{
            width: "100%",
            maxWidth: 480,
            background: "#fff",
            borderRadius: 16,
            padding: 14,
            marginBottom: 14,
            boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
          }}
        >

          <div
            style={{
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            ทีมของคุณ
          </div>

          {team.map((p) => (

            <div
              key={p?.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "4px 0",
              }}
            >

              <span>
                {p?.name}
                {p?.id === player?.id && " (คุณ)"}
              </span>

              <span>
                {scores[p?.id] || 0}
              </span>

            </div>

          ))}

        </div>

      )}

      <GameContainer
        roomCode={roomCode}
        player={player}
        wsRef={wsRef}
        onGameEnd={(result) => {

          console.log("🎮 Mini game finished:", result);

          submitScore({
            roundId: result?.roundId,
            score: result?.score ?? 0,
            meta: {
              game: result?.game || result?.gameKey || null,
              won: result?.won ?? null,
            },
          });

        }}
      />

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
