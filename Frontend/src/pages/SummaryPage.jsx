import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";

/**
 * SummaryPage
 *
 * props:
 * - roomCode
 * - player        { id, name, team? }
 * - results       [{ player_id, name, total_score, team? }]
 * - mode          "solo" | "team"
 * - isHost
 * - onExit        () => void
 */

export default function SummaryPage({
  roomCode,
  player,
  results = [],
  mode = "solo",
  isHost = false,
  onExit,
}) {
  /* =========================
     STATE / REFS
  ========================= */
  const [countdown, setCountdown] = useState(15);
  const exitingRef = useRef(false);
  const timerRef = useRef(null);

  /* =========================
     EXIT (SAFE)
  ========================= */
  const triggerExit = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    onExit?.();
  }, [onExit]);

  /* =========================
     COUNTDOWN
  ========================= */
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          triggerExit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [triggerExit]);

  /* =========================
     SOLO RESULT
  ========================= */
  const soloResults = useMemo(() => {
    if (!Array.isArray(results)) return [];

    return [...results]
      .map((r) => ({
        player_id: r.player_id,
        name: r.name || "ผู้เล่น",
        score: r.total_score ?? 0,
      }))
      .sort((a, b) => b.score - a.score)
      .map((r, i) => ({
        ...r,
        rank: i + 1,
      }));
  }, [results]);

  /* =========================
     TEAM RESULT
  ========================= */
  const teamResults = useMemo(() => {
    if (!Array.isArray(results)) return [];

    const map = {}; // team => { team, total, members[] }

    results.forEach((p) => {
      if (!p.team) return;

      if (!map[p.team]) {
        map[p.team] = {
          team: p.team,
          total: 0,
          members: [],
        };
      }

      map[p.team].total += p.total_score ?? 0;
      map[p.team].members.push({
        id: p.player_id,
        name: p.name,
        score: p.total_score ?? 0,
      });
    });

    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .map((t, i) => ({
        ...t,
        rank: i + 1,
      }));
  }, [results]);

  /* =========================
     HELPERS
  ========================= */
  const rankEmoji = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "🎮";
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="summary-root">
      <div className="panel">
        <h2>🏆 สรุปผลการแข่งขัน</h2>
        <div style={{ fontSize: 13, color: "#666" }}>
          ห้อง {roomCode}
        </div>

        <hr />

        {/* =========================
            SOLO MODE
        ========================= */}
        {mode === "solo" && (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {soloResults.map((r) => {
              const me = r.player_id === player?.id;

              return (
                <li
                  key={r.player_id}
                  style={{
                    marginBottom: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: me ? "#fff3cd" : "#fff",
                    border: me
                      ? "2px solid #f1c40f"
                      : "none",
                  }}
                >
                  <b>
                    {rankEmoji(r.rank)} อันดับ {r.rank} —{" "}
                    {r.name}
                    {me && " (คุณ)"}
                  </b>
                  <div>คะแนน: {r.score}</div>
                </li>
              );
            })}
          </ul>
        )}

        {/* =========================
            TEAM MODE
        ========================= */}
        {mode === "team" && (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {teamResults.map((t) => {
              const isMyTeam = t.team === player?.team;

              return (
                <li
                  key={t.team}
                  style={{
                    marginBottom: 14,
                    padding: "12px",
                    borderRadius: 12,
                    background: isMyTeam
                      ? "#e8f8f5"
                      : "#fff",
                    border: isMyTeam
                      ? "2px solid #1abc9c"
                      : "none",
                  }}
                >
                  <div style={{ fontSize: 17, fontWeight: "bold" }}>
                    {rankEmoji(t.rank)} ทีม {t.team} — อันดับ{" "}
                    {t.rank}
                  </div>

                  <div style={{ marginBottom: 6 }}>
                    คะแนนรวมทีม:{" "}
                    <b>{t.total}</b>
                  </div>

                  <div style={{ fontSize: 14 }}>
                    {t.members.map((m) => (
                      <div key={m.id}>
                        • {m.name} ({m.score})
                        {m.id === player?.id && " ← คุณ"}
                      </div>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* =========================
            FOOTER
        ========================= */}
        <div
          style={{
            marginTop: 16,
            fontSize: 13,
            color: "#777",
            textAlign: "center",
          }}
        >
          ⏳ ห้องจะปิดอัตโนมัติใน {countdown} วินาที
        </div>

        <button
          className="confirm-btn"
          style={{ marginTop: 14 }}
          onClick={triggerExit}
        >
          🚪 ออกจากห้อง
        </button>

        {isHost && (
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "#999",
              textAlign: "center",
            }}
          >
            (Host ไม่ต้องกดอะไร ห้องจะปิดอัตโนมัติ)
          </div>
        )}
      </div>
    </div>
  );
}
