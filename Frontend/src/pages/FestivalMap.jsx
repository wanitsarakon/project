import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import GameContainer from "../games/GameContainer";
import { FESTIVAL_BOOTHS } from "../games/FestivalMapScene";
import { createRoomSocket } from "../websocket/wsClient";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:18082";
const TOTAL_GAMES = FESTIVAL_BOOTHS.length;

function fmtTeamName(team) {
  if (!team) return "ยังไม่จัดทีม";
  return `ทีม ${team}`;
}

function BottomPrizeBar({ prizes }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        justifyContent: "center",
      }}
    >
      {prizes?.length ? (
        prizes.map((prize, index) => (
          <div
            key={`${prize}-${index}`}
            style={{
              minWidth: 132,
              padding: "10px 14px",
              borderRadius: 16,
              border: "2px solid rgba(255,218,118,0.72)",
              background:
                "linear-gradient(180deg, rgba(93,49,11,0.92) 0%, rgba(52,25,8,0.94) 100%)",
              color: "#fff1c2",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 13, opacity: 0.85 }}>อันดับ {index + 1}</div>
            <div style={{ fontWeight: 700, lineHeight: 1.25 }}>{prize}</div>
          </div>
        ))
      ) : (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 16,
            border: "2px dashed rgba(255,218,118,0.4)",
            color: "#ffe6ac",
          }}
        >
          ห้องนี้ยังไม่ได้ตั้งของรางวัล
        </div>
      )}
    </div>
  );
}

function PlayerBottomHud({
  player,
  roomMeta,
  meProgress,
  completedGames,
  currentScore,
  myTeamScore,
  teamMembers,
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: 8,
        transform: "translateX(-50%)",
        width: "min(1080px, calc(100vw - 28px))",
        padding: 12,
        borderRadius: 22,
        border: "2px solid rgba(255,221,133,0.82)",
        background:
          "linear-gradient(180deg, rgba(78,35,12,0.9) 0%, rgba(44,21,9,0.92) 55%, rgba(26,13,6,0.94) 100%)",
        boxShadow: "0 10px 24px rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,255,255,0.16)",
        zIndex: 20,
        color: "#fff4d6",
        pointerEvents: "none",
      }}
    >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 0.9fr 1fr",
            gap: 10,
            alignItems: "stretch",
          }}
      >
        <div
          style={{
            borderRadius: 16,
            padding: 12,
            background: "rgba(255,223,146,0.08)",
            border: "1px solid rgba(255,224,140,0.24)",
          }}
        >
          <div style={{ fontSize: 13, color: "#ffd88c", marginBottom: 6 }}>ผู้เล่น</div>
          <div style={{ fontSize: 21, fontWeight: 800, lineHeight: 1.05 }}>
            {player?.name || "ผู้เล่น"}
          </div>
          <div style={{ color: "#ffe7b5", marginTop: 4, fontSize: 15 }}>
            {roomMeta.mode === "team" ? fmtTeamName(meProgress?.team) : "โหมดเดี่ยว"}
          </div>
        </div>

        <div
          style={{
            borderRadius: 16,
            padding: 12,
            background: "rgba(255,223,146,0.08)",
            border: "1px solid rgba(255,224,140,0.24)",
          }}
        >
          <div style={{ fontSize: 13, color: "#ffd88c", marginBottom: 6 }}>คะแนนปัจจุบัน</div>
          <div style={{ fontSize: 25, fontWeight: 800, lineHeight: 1 }}>{currentScore}</div>
          <div style={{ color: "#ffe7b5", marginTop: 6, fontSize: 15 }}>
            เล่นแล้ว {completedGames.length} / {TOTAL_GAMES} เกม
          </div>
          <div style={{ color: "#ffd88c", marginTop: 2, fontSize: 14 }}>
            {meProgress?.done
              ? "เล่นครบทุกซุ้มแล้ว รอ Host สรุปผล"
              : `ซุ้มถัดไป: ${meProgress?.next_game_key || "-"}`}
          </div>
        </div>

        <div
          style={{
            borderRadius: 16,
            padding: 12,
            background: "rgba(255,223,146,0.08)",
            border: "1px solid rgba(255,224,140,0.24)",
          }}
        >
          <div style={{ fontSize: 13, color: "#ffd88c", marginBottom: 8 }}>ของรางวัล</div>
          <BottomPrizeBar prizes={roomMeta.prizes} />
        </div>
      </div>

      {roomMeta.mode === "team" && teamMembers.length > 0 && (
        <div
          style={{
            marginTop: 10,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
          }}
        >
          <div
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              background: "rgba(255,241,198,0.12)",
              border: "1px solid rgba(255,224,140,0.24)",
              color: "#fff0c0",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            คะแนนรวมทีม {myTeamScore}
          </div>

          {teamMembers.map((entry) => (
            <div
              key={entry.id}
              style={{
                padding: "7px 11px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,224,140,0.18)",
                color: "#ffe9bb",
                fontSize: 13,
              }}
            >
              {entry.name}
              {entry.id === player?.id ? " (คุณ)" : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HostMonitor({ roomMeta, playerStatuses, completedPlayers, progressData, teamStandings, onFinalize, finalizing, onLeave }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background:
          "radial-gradient(circle at top, #251036 0%, #121730 45%, #080d1b 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        fontFamily: "Kanit",
      }}
    >
      <div
        style={{
          width: "min(1180px, calc(100vw - 24px))",
          borderRadius: 30,
          border: "3px solid rgba(255,219,125,0.84)",
          background:
            "linear-gradient(180deg, rgba(57,27,12,0.96) 0%, rgba(26,12,8,0.98) 100%)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.42)",
          color: "#fff2cf",
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 18,
            alignItems: "flex-start",
            flexWrap: "wrap",
            marginBottom: 18,
          }}
        >
          <div>
            <div style={{ fontSize: 16, color: "#ffd88c", marginBottom: 6 }}>Host Monitor</div>
            <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.05 }}>รอผู้เล่นเคลียร์ทุกซุ้ม</div>
            <div style={{ color: "#ffe7b8", marginTop: 8 }}>
              เล่นครบแล้ว {completedPlayers} / {playerStatuses.length} คน
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={onFinalize}
              disabled={!progressData?.all_completed || finalizing}
              style={{
                padding: "14px 24px",
                borderRadius: 999,
                border: "none",
                background:
                  !progressData?.all_completed || finalizing
                    ? "#8c6b40"
                    : "linear-gradient(180deg, #38c96a 0%, #159249 100%)",
                color: "#fff",
                fontFamily: "Kanit",
                fontSize: 18,
                fontWeight: 700,
                cursor: !progressData?.all_completed || finalizing ? "default" : "pointer",
              }}
            >
              {finalizing
                ? "กำลังสรุปผล..."
                : progressData?.all_completed
                  ? "สรุปผู้ชนะ"
                  : "รอผู้เล่นให้ครบก่อน"}
            </button>

            <button
              onClick={onLeave}
              style={{
                padding: "14px 24px",
                borderRadius: 999,
                border: "none",
                background: "linear-gradient(180deg, #ff725f 0%, #d94432 100%)",
                color: "#fff",
                fontFamily: "Kanit",
                fontSize: 18,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ออกจากห้อง
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          <div
            style={{
              borderRadius: 22,
              padding: 16,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,219,125,0.2)",
            }}
          >
            <div style={{ fontSize: 14, color: "#ffd88c", marginBottom: 10 }}>ข้อมูลห้อง</div>
            <div style={{ marginBottom: 6 }}>ชื่อห้อง: {roomMeta.name || "Thai Festival Room"}</div>
            <div style={{ marginBottom: 6 }}>โหมด: {roomMeta.mode === "team" ? "ทีม" : "เดี่ยว"}</div>
            <div>ของรางวัล: {roomMeta.prizes?.length || 0} รายการ</div>
          </div>

          <div
            style={{
              borderRadius: 22,
              padding: 16,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,219,125,0.2)",
            }}
          >
            <div style={{ fontSize: 14, color: "#ffd88c", marginBottom: 10 }}>ของรางวัล</div>
            <BottomPrizeBar prizes={roomMeta.prizes} />
          </div>

          {teamStandings.length > 0 ? (
            <div
              style={{
                borderRadius: 22,
                padding: 16,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,219,125,0.2)",
              }}
            >
              <div style={{ fontSize: 14, color: "#ffd88c", marginBottom: 10 }}>คะแนนรวมทีม</div>
              <div style={{ display: "grid", gap: 10 }}>
                {teamStandings.map((entry) => (
                  <div
                    key={entry.team}
                    style={{
                      borderRadius: 16,
                      padding: 12,
                      background: "rgba(255,233,174,0.08)",
                      border: "1px solid rgba(255,219,125,0.2)",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>
                      {fmtTeamName(entry.team)} • {entry.totalScore} คะแนน
                    </div>
                    <div style={{ color: "#ffe7b8", marginTop: 4 }}>
                      สมาชิกที่เล่นครบ {entry.completedPlayers} / {entry.members.length}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              style={{
                borderRadius: 22,
                padding: 16,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,219,125,0.2)",
              }}
            >
              <div style={{ fontSize: 14, color: "#ffd88c", marginBottom: 10 }}>สถานะภาพรวม</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>
                {completedPlayers} / {playerStatuses.length}
              </div>
              <div style={{ color: "#ffe7b8", marginTop: 6 }}>ผู้เล่นที่เคลียร์ครบทุกซุ้มแล้ว</div>
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 14,
          }}
        >
          {playerStatuses.map((entry) => (
            <div
              key={entry.player_id}
              style={{
                borderRadius: 20,
                padding: 16,
                background: entry.done ? "rgba(49,167,97,0.16)" : "rgba(255,255,255,0.06)",
                border: `2px solid ${entry.done ? "rgba(87,232,144,0.5)" : "rgba(255,219,125,0.16)"}`,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 20 }}>
                {entry.name}
                {entry.team ? ` • ${fmtTeamName(entry.team)}` : ""}
              </div>
              <div style={{ color: "#ffe7b8", marginTop: 6 }}>
                สถานะ: {entry.connected ? "ออนไลน์" : "ออฟไลน์"}
              </div>
              <div style={{ color: "#ffe7b8", marginTop: 4 }}>
                ความคืบหน้า {entry.completed} / {TOTAL_GAMES}
              </div>
              <div style={{ color: "#ffe7b8", marginTop: 4 }}>
                คะแนนรวม {entry.total_score ?? 0}
              </div>
              <div style={{ color: "#ffd88c", marginTop: 8 }}>
                {entry.done ? "เล่นครบทุกเกมแล้ว" : `ซุ้มถัดไป: ${entry.next_game_key || "-"}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FestivalMap({
  roomCode,
  player,
  mode = "solo",
  onLeave,
  onShowSummary,
  onMiniGameChange,
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
  const [activeMiniGame, setActiveMiniGame] = useState(null);

  const wsRef = useRef(null);
  const mountedRef = useRef(false);
  const summaryShownRef = useRef(false);

  const safeSet = useCallback((fn) => {
    if (mountedRef.current) fn();
  }, []);

  useEffect(() => {
    onMiniGameChange?.(Boolean(activeMiniGame));
  }, [activeMiniGame, onMiniGameChange]);

  useEffect(() => () => {
    onMiniGameChange?.(false);
  }, [onMiniGameChange]);

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
          safeSet(() => setTeamMembers(
            players
              .filter((entry) => entry?.team === me.team)
              .map((entry) => ({
                id: entry?.id,
                name: entry?.name ?? "player",
                team: entry?.team ?? "",
              })),
          ));
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
    if (!roomCode) return undefined;

    const intervalId = window.setInterval(() => {
      loadRoom();
      loadProgress();
    }, 12000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadProgress, loadRoom, roomCode]);

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
        msg.type === "room_update"
        || msg.type === "progress_update"
        || msg.type === "player_disconnect"
        || msg.type === "score_update"
        || msg.type === "game_start"
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

      setActiveMiniGame(null);
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
      <HostMonitor
        roomMeta={roomMeta}
        playerStatuses={playerStatuses}
        completedPlayers={completedPlayers}
        progressData={progressData}
        teamStandings={teamStandings}
        onFinalize={finalizeGame}
        finalizing={finalizing}
        onLeave={onLeave}
      />
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
        onGameStart={setActiveMiniGame}
        onGameEnd={submitBoothResult}
      />

      {!activeMiniGame && (
        <>
          <div
            style={{
              position: "absolute",
              top: 16,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 20,
              width: "min(880px, calc(100vw - 24px))",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              padding: "12px 18px",
              borderRadius: 999,
              border: "2px solid rgba(255,221,133,0.72)",
              background: "rgba(39,17,8,0.62)",
              color: "#fff0c0",
              boxShadow: "0 12px 28px rgba(0,0,0,0.28)",
              backdropFilter: "blur(10px)",
              pointerEvents: "none",
            }}
          >
            <div>
              <div style={{ fontSize: 14, color: "#ffd88c" }}>แผนที่ซุ้มเกม</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>
                เล่นเรียงทีละซุ้มเพื่อปลดล็อกด่านถัดไป
              </div>
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                background: "rgba(255,240,202,0.1)",
                color: "#ffecc2",
                whiteSpace: "nowrap",
              }}
            >
              ความคืบหน้า {completedGames.length} / {TOTAL_GAMES}
            </div>
          </div>

          <PlayerBottomHud
            player={player}
            roomMeta={roomMeta}
            meProgress={meProgress}
            completedGames={completedGames}
            currentScore={scores[player?.id] || 0}
            myTeamScore={myTeamScore}
            teamMembers={teamMembers}
          />

          <button
            onClick={onLeave}
            style={{
              position: "absolute",
              right: 18,
              top: 92,
              padding: "12px 18px",
              borderRadius: 999,
              border: "2px solid rgba(255,221,133,0.66)",
              background: "rgba(130,28,24,0.78)",
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              zIndex: 20,
            }}
          >
            ออกจากห้อง
          </button>
        </>
      )}

      {submittingGame && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(8,10,18,0.56)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 30,
            color: "#fff5d7",
            fontSize: 28,
            fontWeight: 700,
            textShadow: "0 2px 10px rgba(0,0,0,0.5)",
          }}
        >
          กำลังบันทึกคะแนน...
        </div>
      )}
    </div>
  );
}
