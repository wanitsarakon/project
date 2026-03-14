import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import GameContainer from "../games/GameContainer";
import { FESTIVAL_BOOTHS } from "../games/FestivalMapScene";
import { createRoomSocket } from "../websocket/wsClient";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
const TOTAL_GAMES = FESTIVAL_BOOTHS.length;

function RewardBar({ prizes }) {
  return (
    <div
      style={{
        width: "min(760px, calc(100vw - 32px))",
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

      {prizes?.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {prizes.map((prize, index) => (
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
}

export default function FestivalMap({
  roomCode,
  player,
  mode = "solo",
  onLeave,
  onShowSummary,
}) {
  const isHost = player?.isHost === true;

  const [roomMeta, setRoomMeta] = useState({
    mode,
    prizes: [],
    name: "",
    status: "playing",
  });
  const [scores, setScores] = useState({});
  const [teamMembers, setTeamMembers] = useState([]);
  const [progressData, setProgressData] = useState({
    all_completed: false,
    players: [],
    me: null,
    sequence: FESTIVAL_BOOTHS.map((booth) => booth.scene),
  });
  const [submittingGame, setSubmittingGame] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const wsRef = useRef(null);
  const mountedRef = useRef(false);
  const summaryShownRef = useRef(false);

  const safeSet = useCallback((fn) => {
    if (mountedRef.current) fn();
  }, []);

  const loadSummary = useCallback(async () => {
    if (!roomCode || summaryShownRef.current) return;

    summaryShownRef.current = true;

    try {
      const res = await fetch(`${API_BASE}/rooms/${roomCode}/summary`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "summary load failed");
      }
      onShowSummary?.(data);
    } catch (err) {
      console.error("loadSummary error:", err);
      summaryShownRef.current = false;
    }
  }, [onShowSummary, roomCode]);

  const loadRoom = useCallback(async () => {
    if (!roomCode) return;

    try {
      const res = await fetch(`${API_BASE}/rooms/${roomCode}`);
      if (!res.ok) return;

      const data = await res.json();
      const players = Array.isArray(data?.players) ? data.players : [];
      const nextScores = {};

      players.forEach((entry) => {
        nextScores[entry?.id] = entry?.total_score ?? entry?.score ?? 0;
      });

      safeSet(() => {
        setScores(nextScores);
        setRoomMeta({
          mode: data?.mode ?? mode,
          prizes: Array.isArray(data?.prizes) ? data.prizes : [],
          name: data?.name ?? "Thai Festival Room",
          status: data?.status ?? "playing",
        });
      });

      if ((data?.mode ?? mode) === "team" && player?.id) {
        const me = players.find((entry) => entry?.id === player.id);
        if (me?.team) {
          safeSet(() =>
            setTeamMembers(
              players
                .filter((entry) => entry?.team === me.team)
                .map((entry) => ({
                  id: entry?.id,
                  name: entry?.name ?? "player",
                  team: entry?.team ?? "",
                })),
            ),
          );
        } else {
          safeSet(() => setTeamMembers([]));
        }
      } else {
        safeSet(() => setTeamMembers([]));
      }

      if ((data?.status ?? "playing") === "finished") {
        loadSummary();
      }
    } catch (err) {
      console.error("loadRoom error:", err);
    }
  }, [loadSummary, mode, player?.id, roomCode, safeSet]);

  const loadProgress = useCallback(async () => {
    if (!roomCode) return;

    const query = player?.id ? `?player_id=${player.id}` : "";

    try {
      const res = await fetch(`${API_BASE}/rooms/${roomCode}/progress${query}`);
      if (!res.ok) return;

      const data = await res.json();
      safeSet(() => setProgressData(data));

      if ((data?.status ?? roomMeta.status) === "finished") {
        loadSummary();
      }
    } catch (err) {
      console.error("loadProgress error:", err);
    }
  }, [loadSummary, player?.id, roomCode, roomMeta.status, safeSet]);

  useEffect(() => {
    mountedRef.current = true;
    summaryShownRef.current = false;

    loadRoom();
    loadProgress();

    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [loadProgress, loadRoom]);

  useEffect(() => {
    if (!roomCode || !player?.id || wsRef.current) return undefined;

    const socket = createRoomSocket(roomCode, () => {}, {
      playerId: player.id,
      mode,
    });

    wsRef.current = socket;

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [mode, player?.id, roomCode]);

  useEffect(() => {
    if (!wsRef.current || typeof wsRef.current.subscribe !== "function") {
      return undefined;
    }

    return wsRef.current.subscribe((msg) => {
      if (!msg?.type) return;

      if (
        msg.type === "room_update" ||
        msg.type === "progress_update" ||
        msg.type === "player_disconnect" ||
        msg.type === "score_update" ||
        msg.type === "game_start"
      ) {
        loadRoom();
        loadProgress();
      }

      if (msg.type === "game_finished") {
        loadSummary();
      }
    });
  }, [loadProgress, loadRoom, loadSummary]);

  const meProgress = progressData?.me ?? null;
  const completedGames = Array.isArray(meProgress?.completed_games)
    ? meProgress.completed_games
    : [];
  const unlockedGames = Array.isArray(meProgress?.unlocked_games)
    ? meProgress.unlocked_games
    : [];

  const boothStates = useMemo(() => {
    const nextStates = {};
    FESTIVAL_BOOTHS.forEach((booth) => {
      if (completedGames.includes(booth.scene)) {
        nextStates[booth.scene] = "completed";
      } else if (unlockedGames.includes(booth.scene)) {
        nextStates[booth.scene] = "unlocked";
      } else {
        nextStates[booth.scene] = "locked";
      }
    });
    return nextStates;
  }, [completedGames, unlockedGames]);

  const playerStatuses = Array.isArray(progressData?.players)
    ? progressData.players.filter((entry) => entry?.is_host !== true)
    : [];
  const completedPlayers = playerStatuses.filter((entry) => entry?.done).length;

  const teamStandings = useMemo(() => {
    if ((roomMeta.mode !== "team" && mode !== "team") || playerStatuses.length === 0) {
      return [];
    }

    const grouped = new Map();
    playerStatuses.forEach((entry) => {
      const teamKey = entry?.team || "unassigned";
      if (!grouped.has(teamKey)) {
        grouped.set(teamKey, {
          team: teamKey,
          totalScore: 0,
          completedPlayers: 0,
          members: [],
        });
      }

      const bucket = grouped.get(teamKey);
      bucket.totalScore += entry?.total_score ?? 0;
      bucket.completedPlayers += entry?.done ? 1 : 0;
      bucket.members.push(entry);
    });

    return [...grouped.values()].sort((a, b) => {
      if (b.totalScore === a.totalScore) {
        return String(a.team).localeCompare(String(b.team));
      }
      return b.totalScore - a.totalScore;
    });
  }, [mode, playerStatuses, roomMeta.mode]);

  const myTeamScore = useMemo(() => {
    if (teamMembers.length === 0) return 0;
    return teamMembers.reduce((sum, entry) => sum + (scores[entry?.id] || 0), 0);
  }, [scores, teamMembers]);

  const submitBoothResult = useCallback(
    async (result) => {
      if (!player?.id || !result?.gameKey || submittingGame) return;

      safeSet(() => setSubmittingGame(true));

      try {
        const res = await fetch(`${API_BASE}/rooms/${roomCode}/games/${result.gameKey}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            player_id: player.id,
            score: Math.max(0, Math.floor(result?.score ?? 0)),
            meta: {
              won: result?.won ?? null,
              ...(result?.meta && typeof result.meta === "object" ? result.meta : {}),
            },
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error || "submit game failed");
        }

        loadRoom();
        loadProgress();
      } catch (err) {
        console.error("submitBoothResult error:", err);
        alert(err?.message || "ส่งคะแนนเกมไม่สำเร็จ");
      } finally {
        safeSet(() => setSubmittingGame(false));
      }
    },
    [loadProgress, loadRoom, player?.id, roomCode, safeSet, submittingGame],
  );

  const finalizeGame = useCallback(async () => {
    if (!isHost || !player?.id || finalizing) return;

    safeSet(() => setFinalizing(true));

    try {
      const res = await fetch(`${API_BASE}/rooms/${roomCode}/finalize?player_id=${player.id}`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "finalize failed");
      }

      if (data?.summary) {
        onShowSummary?.(data.summary);
      } else {
        loadSummary();
      }
    } catch (err) {
      console.error("finalizeGame error:", err);
      alert(err?.message || "สรุปผู้ชนะไม่สำเร็จ");
    } finally {
      safeSet(() => setFinalizing(false));
    }
  }, [finalizing, isHost, loadSummary, onShowSummary, player?.id, roomCode, safeSet]);

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
          gap: 18,
        }}
      >
        <RewardBar prizes={roomMeta.prizes} />

        <div
          style={{
            width: "min(920px, calc(100vw - 32px))",
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
            หน้าควบคุม Host
          </div>

          <div
            style={{
              color: "#7a4a1f",
              fontSize: 18,
              marginBottom: 14,
            }}
          >
            รอให้ผู้เล่นทุกคนเล่นครบทุกซุ้ม แล้วค่อยกดสรุปผู้ชนะ
          </div>

          <div
            style={{
              background: "#fff4df",
              borderRadius: 16,
              padding: 14,
              color: "#5b2c00",
              marginBottom: 18,
              fontWeight: 600,
            }}
          >
            ผู้เล่นที่เล่นครบแล้ว {completedPlayers} / {playerStatuses.length}
          </div>

          {teamStandings.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
                textAlign: "left",
                marginBottom: 18,
              }}
            >
              {teamStandings.map((entry) => (
                <div
                  key={`team-${entry.team}`}
                  style={{
                    background: "#f5f0ff",
                    border: "2px solid #9b7cff",
                    borderRadius: 18,
                    padding: 14,
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#44206b", marginBottom: 6 }}>
                    ทีม {entry.team}
                  </div>
                  <div style={{ color: "#5e3b86", marginBottom: 4 }}>
                    คะแนนรวมทีม {entry.totalScore}
                  </div>
                  <div style={{ color: "#5e3b86" }}>
                    สมาชิกที่เล่นครบ {entry.completedPlayers} / {entry.members.length}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
              textAlign: "left",
              marginBottom: 18,
            }}
          >
            {playerStatuses.map((entry) => (
              <div
                key={entry?.player_id}
                style={{
                  background: entry?.done ? "#e7fff0" : "#fff9ef",
                  border: `2px solid ${entry?.done ? "#38a169" : "#f0c36d"}`,
                  borderRadius: 18,
                  padding: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    marginBottom: 8,
                    fontWeight: 700,
                    color: "#4d2a0d",
                  }}
                >
                  <span>
                    {entry?.name || "player"}
                    {entry?.team ? ` • ทีม ${entry.team}` : ""}
                  </span>
                  <span>{entry?.connected ? "ออนไลน์" : "ออฟไลน์"}</span>
                </div>
                <div style={{ color: "#6b3d16", marginBottom: 4 }}>
                  เล่นแล้ว {entry?.completed ?? 0} / {TOTAL_GAMES}
                </div>
                <div style={{ color: "#6b3d16", marginBottom: 4 }}>
                  คะแนนรวม {entry?.total_score ?? 0}
                </div>
                <div style={{ color: "#6b3d16" }}>
                  {entry?.done
                    ? "เล่นครบทุกซุ้มแล้ว"
                    : `ซุ้มถัดไป: ${entry?.next_game_key || "-"}`}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={finalizeGame}
            disabled={!progressData?.all_completed || finalizing}
            style={{
              padding: "14px 32px",
              borderRadius: 24,
              border: "none",
              background:
                !progressData?.all_completed || finalizing ? "#c8a97f" : "#27ae60",
              color: "#fff",
              fontSize: 18,
              fontFamily: "Kanit",
              cursor:
                !progressData?.all_completed || finalizing ? "default" : "pointer",
            }}
          >
            {finalizing
              ? "กำลังสรุปผล..."
              : progressData?.all_completed
                ? "สรุปผู้ชนะ"
                : "รอให้ผู้เล่นครบก่อน"}
          </button>
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
        allowRoundEvents={false}
        mapData={{ boothStates }}
        onGameEnd={submitBoothResult}
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
        <header style={{ textAlign: "center", pointerEvents: "auto" }}>
          <div
            style={{
              fontSize: 30,
              fontWeight: "bold",
              color: "#fff3cb",
              textShadow: "0 4px 18px rgba(0,0,0,0.6)",
            }}
          >
            แผนที่ซุ้มเกม
          </div>

          <div
            style={{
              fontSize: 16,
              color: "#ffe5a8",
              textShadow: "0 2px 10px rgba(0,0,0,0.55)",
            }}
          >
            เล่นให้ครบทีละซุ้มเพื่อปลดล็อกซุ้มถัดไป
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
          <RewardBar prizes={roomMeta.prizes} />
        </div>
      </div>

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
        <div style={{ fontWeight: 600, marginBottom: 8 }}>ความคืบหน้าของคุณ</div>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span>เล่นครบแล้ว</span>
          <strong>
            {meProgress?.completed ?? 0} / {TOTAL_GAMES}
          </strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span>คะแนนรวม</span>
          <strong>{scores[player?.id] || 0}</strong>
        </div>
        <div style={{ color: "#6b3d16" }}>
          {meProgress?.done
            ? "คุณเล่นครบทุกเกมแล้ว รอ Host ประกาศผลได้เลย"
            : `ซุ้มถัดไป: ${meProgress?.next_game_key || "-"}`}
        </div>
      </div>

      {(roomMeta.mode === "team" || mode === "team") && teamMembers?.length > 0 && (
        <div
          style={{
            position: "absolute",
            right: 16,
            bottom: 88,
            width: "min(360px, calc(100vw - 32px))",
            background: "rgba(255,255,255,0.92)",
            borderRadius: 16,
            padding: 14,
            boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
            zIndex: 20,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>ทีมของคุณ</div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "0 0 8px",
              marginBottom: 6,
              borderBottom: "1px solid rgba(107,61,22,0.15)",
              fontWeight: 700,
              color: "#6b3d16",
            }}
          >
            <span>คะแนนรวมทีม</span>
            <span>{myTeamScore}</span>
          </div>

          {teamMembers.map((entry) => (
            <div
              key={entry?.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "4px 0",
              }}
            >
              <span>
                {entry?.name}
                {entry?.id === player?.id && " (คุณ)"}
              </span>
              <span>{scores[entry?.id] || 0}</span>
            </div>
          ))}
        </div>
      )}

      {submittingGame && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(8,10,18,0.52)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 25,
            color: "#fff5d7",
            fontSize: 28,
            fontWeight: 700,
            textShadow: "0 2px 10px rgba(0,0,0,0.5)",
          }}
        >
          กำลังบันทึกคะแนน...
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
