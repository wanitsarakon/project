import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * SummaryPage
 *
 * props:
 * - roomCode
 * - player        { id, name }
 * - results       [{ player_id, name, score, rank, prize }]
 * - isHost
 * - onExit        () => void
 */

export default function SummaryPage({
  roomCode,
  player,
  results = [],
  isHost = false,
  onExit,
}) {
  const [countdown, setCountdown] = useState(15); // ⏳ ควรตรง backend
  const exitingRef = useRef(false);
  const timerRef = useRef(null);

  /* =========================
     Normalize + Sort results
  ========================= */
  const sortedResults = useMemo(() => {
    if (!Array.isArray(results) || results.length === 0) return [];

    // ถ้า backend ไม่ส่ง rank → sort ตาม score
    const hasRank = results.every((r) => r.rank != null);

    const list = [...results].map((r) => ({
      player_id: r.player_id,
      name: r.name || "ผู้เล่น",
      score: r.score ?? r.total_score ?? 0,
      rank: r.rank,
      prize: r.prize,
    }));

    if (hasRank) {
      return list.sort((a, b) => a.rank - b.rank);
    }

    return list
      .sort((a, b) => b.score - a.score)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }, [results]);

  /* =========================
     Auto countdown
  ========================= */
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          triggerExit();
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
    };
    // eslint-disable-next-line
  }, []);

  /* =========================
     Exit (ONCE)
  ========================= */
  const triggerExit = () => {
    if (exitingRef.current) return;
    exitingRef.current = true;

    clearInterval(timerRef.current);
    onExit?.();
  };

  /* =========================
     Helpers
  ========================= */
  const isMe = (r) => r.player_id === player?.id;

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
        <h2 style={{ marginBottom: 4 }}>🏆 สรุปผลการแข่งขัน</h2>

        <div style={{ fontSize: 13, color: "#666" }}>
          ห้อง {roomCode}
        </div>

        <hr />

        {/* =========================
            RESULT LIST
        ========================= */}
        {sortedResults.length === 0 ? (
          <p style={{ textAlign: "center", color: "#777" }}>
            😴 ไม่มีข้อมูลผลการแข่งขัน
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {sortedResults.map((r) => {
              const me = isMe(r);

              return (
                <li
                  key={r.player_id}
                  style={{
                    marginBottom: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: me ? "#fff3cd" : "#fff",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                    border: me ? "2px solid #f1c40f" : "none",
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: "bold" }}>
                    {rankEmoji(r.rank)} อันดับ {r.rank} — {r.name}
                    {me && " (คุณ)"}
                  </div>

                  <div style={{ fontSize: 14 }}>
                    คะแนน: <b>{r.score}</b>
                  </div>

                  {r.prize && (
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      🎁 {r.prize}
                    </div>
                  )}
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
          disabled={exitingRef.current}
        >
          🚪 ออกจากห้อง
        </button>

        {isHost && (
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: "#999",
              textAlign: "center",
            }}
          >
            (Host ไม่ต้องกดอะไร ห้องจะถูกปิดอัตโนมัติ)
          </div>
        )}
      </div>
    </div>
  );
}
