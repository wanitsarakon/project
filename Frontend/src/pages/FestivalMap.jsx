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
  onShowSummary,
}) {
  const isHost = player?.isHost === true;

  const [team, setTeam] = useState([]);
  const [scores, setScores] = useState({});
  const [roomMeta, setRoomMeta] = useState({
    mode,
    prizes: [],
    name: "",
  });
  const [roundInfo, setRoundInfo] = useState({
    currentRound: 0,
    totalRounds: 0,
    currentGame: null,
    running: false,
  });
  const [startingRound, setStartingRound] = useState(false);

  const wsRef = useRef(null);
  const mountedRef = useRef(false);
  const summaryShownRef = useRef(false);

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
        scoreMap[p?.id] = p?.total_score ?? p?.score ?? 0;
      });

      safeSet(() => {
        setScores(scoreMap);
        setRoomMeta({
          mode: data?.mode ?? mode,
          prizes: Array.isArray(data?.prizes) ? data.prizes : [],
          name: data?.name ?? "Thai Festival Room",
        });
      });

      if ((data?.mode ?? mode) === "team" && player?.id) {
        const me = data.players.find((p) => p?.id === player.id);
        if (me?.team) {
          const myTeam = data.players.filter((p) => p?.team === me.team);
          safeSet(() =>
            setTeam(
              myTeam.map((p) => ({
                id: p?.id,
                name: p?.name ?? "player",
              })),
            ),
          );
        }
      }
    } catch (err) {
      console.error("loadScoresFromServer:", err);
    }
  }, [mode, player?.id, roomCode, safeSet]);

  const loadSummary = useCallback(async () => {
    if (!roomCode || summaryShownRef.current) return;

    summaryShownRef.current = true;

    try {
      const res = await fetch(`${API_BASE}/rooms/${roomCode}/summary`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "summary load failed");
      }
      onShowSummary?.(data);
    } catch (err) {
      console.error("loadSummary error:", err);
      summaryShownRef.current = false;
    }
  }, [onShowSummary, roomCode]);

  const submitScore = useCallback(
    async ({ roundId, score, meta = null }) => {
      if (!roundId || !player?.id) return;

      try {
        const res = await fetch(`${API_BASE}/rounds/${roundId}/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            player_id: player.id,
            score: Math.max(0, Math.floor(score || 0)),
            meta,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error("submitScore failed:", data);
        }
      } catch (err) {
        console.error("submitScore error:", err);
      }
    },
    [player?.id],
  );

  useEffect(() => {
    mountedRef.current = true;
    summaryShownRef.current = false;

    if (!roomCode || !player?.id) {
      return () => {
        mountedRef.current = false;
      };
    }

    if (wsRef.current) return undefined;

    const socket = createRoomSocket(roomCode, () => {}, {
      playerId: player.id,
      mode,
      onTeamUpdate: loadScoresFromServer,
      onScoreUpdate: ({ player_id, score }) => {
        safeSet(() =>
          setScores((prev) => ({
            ...prev,
            [player_id]: (prev[player_id] || 0) + score,
          })),
        );
      },
    });

    wsRef.current = socket;
    loadScoresFromServer();

    return () => {
      mountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [loadScoresFromServer, mode, player?.id, roomCode, safeSet]);

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
        loadScoresFromServer();
        if (msg.game_finished) {
          loadSummary();
        }
      }

      if (msg.type === "game_finished") {
        loadSummary();
      }

      if (msg.type === "room_update") {
        loadScoresFromServer();
      }
    });
  }, [loadScoresFromServer, loadSummary, safeSet]);

  const startNextRound = useCallback(async () => {
    if (!isHost || !roomCode || startingRound) return;

    setStartingRound(true);

    try {
      const res = await fetch(
        `${API_BASE}/rooms/${roomCode}/round/start?player_id=${player.id}`,
        { method: "POST" },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "start round failed");
      }
    } catch (err) {
      console.error("startNextRound:", err);
      alert(err?.message || "เริ่มรอบไม่สำเร็จ");
      safeSet(() => setStartingRound(false));
    }
  }, [isHost, player?.id, roomCode, safeSet, startingRound]);

  const rewardBar = (
    <div
      style={{
        width: "min(720px, calc(100vw - 32px))",
        background: "rgba(17,13,11,0.7)",
        borderRadius: 20,
        padding: 16,
        boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
        backdropFilter: "blur(10px)",
        color: "#fff6df",
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 18,
          color: "#ffe2a3",
          marginBottom: 8,
        }}
      >
        ของรางวัลประจำห้อง
      </div>
      {roomMeta.prizes?.length ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          {roomMeta.prizes.map((prize, index) => (
            <div
              key={`${prize}-${index}`}
              style={{
                padding: "8px 12px",
                borderRadius: 999,
                background: "rgba(255,244,223,0.96)",
                color: "#5b2c00",
                fontWeight: 600,
              }}
            >
              #{index + 1} {prize}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: "#ffe2a3" }}>ยังไม่ได้ตั้งของรางวัล</div>
      )}
    </div>
  );

  if (isHost) {
    return (
      <div
        style={{
          minHeight: "100vh",
          width: "100vw",
          background:
            "radial-gradient(circle at top, #1a2558 0%, #0b1231 58%, #060916 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          textAlign: "center",
          fontFamily: "Kanit",
        }}
      >
        {rewardBar}

        <div
          style={{
            width: "min(520px, calc(100vw - 32px))",
            background: "rgba(255,255,255,0.94)",
            borderRadius: 24,
            padding: 28,
            boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
            marginTop: 18,
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
            {roundInfo.totalRounds ? ` / ${roundInfo.totalRounds}` : ""}
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
        width: "100vw",
        background: "#050812",
        position: "relative",
        overflow: "hidden",
        fontFamily: "Kanit",
      }}
    >
      <GameContainer
        roomCode={roomCode}
        player={player}
        wsRef={wsRef}
        onGameEnd={(result) => {
          submitScore({
            roundId: result?.roundId,
            score: result?.score ?? 0,
            meta: {
              game: result?.game || result?.gameKey || null,
              won: result?.won ?? null,
              ...(result?.meta && typeof result.meta === "object"
                ? result.meta
                : {}),
            },
          });
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          right: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        <header
          style={{
            textAlign: "center",
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              fontSize: 30,
              fontWeight: "bold",
              color: "#fff3cb",
              textShadow: "0 4px 18px rgba(0,0,0,0.6)",
            }}
          >
            Festival Map
          </div>

          <div
            style={{
              fontSize: 16,
              color: "#ffe5a8",
              textShadow: "0 2px 10px rgba(0,0,0,0.55)",
            }}
          >
            {roundInfo.running
              ? `รอบ ${roundInfo.currentRound}${
                  roundInfo.totalRounds ? ` / ${roundInfo.totalRounds}` : ""
                } : ${roundInfo.currentGame || "-"}`
              : "รอ Host เริ่มรอบถัดไป"}
          </div>
        </header>

        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            pointerEvents: "auto",
          }}
        >
          {rewardBar}
        </div>
      </div>

      {(roomMeta.mode === "team" || mode === "team") && team?.length > 0 && (
        <div
          style={{
            position: "absolute",
            left: 16,
            bottom: 88,
            width: "min(420px, calc(100vw - 32px))",
            background: "rgba(255,255,255,0.92)",
            borderRadius: 16,
            padding: 14,
            boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
            zIndex: 20,
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

              <span>{scores[p?.id] || 0}</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onLeave}
        style={{
          position: "absolute",
          right: 16,
          bottom: 16,
          padding: "14px 32px",
          borderRadius: 24,
          border: "none",
          background: "#e74c3c",
          color: "#fff",
          fontSize: 18,
          cursor: "pointer",
          zIndex: 20,
        }}
      >
        ออกจากห้อง
      </button>
    </div>
  );
}
