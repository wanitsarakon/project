import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";

export default function SummaryPage({
  roomCode,
  player,
  summary,
  onExit,
}) {
  const [countdown, setCountdown] = useState(20);
  const exitingRef = useRef(false);
  const timerRef = useRef(null);

  const triggerExit = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    onExit?.();
  }, [onExit]);

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

  const mode = summary?.mode ?? "solo";
  const prizes = Array.isArray(summary?.prizes)
    ? summary.prizes
    : [];
  const results = Array.isArray(summary?.results)
    ? summary.results
    : [];
  const podium = Array.isArray(summary?.podium)
    ? summary.podium
    : [];
  const teams = Array.isArray(summary?.teams)
    ? summary.teams
    : [];

  const sortedResults = useMemo(
    () =>
      [...results].sort((a, b) => {
        if ((b?.total_score ?? 0) === (a?.total_score ?? 0)) {
          return (a?.player_id ?? 0) - (b?.player_id ?? 0);
        }
        return (b?.total_score ?? 0) - (a?.total_score ?? 0);
      }),
    [results]
  );

  const rankIcon = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "🎯";
  };

  return (
    <div className="home-root">
      <div className="summary-shell">
        <div className="summary-hero">
          <div className="summary-kicker">
            ห้อง {roomCode}
          </div>
          <h1 className="summary-title">
            สรุปผลผู้ชนะ
          </h1>
          <div className="summary-subtitle">
            {summary?.room_name || "Thai Festival Room"}
          </div>
        </div>

        <div className="summary-grid">
          <section className="summary-panel">
            <div className="summary-panel-title">
              Podium
            </div>

            {podium.length > 0 ? (
              <div className="summary-podium">
                {podium.map((entry, index) => {
                  const rank = index + 1;
                  const mine =
                    mode === "team"
                      ? entry?.members?.some(
                          (member) =>
                            member?.player_id === player?.id
                        )
                      : entry?.player_id === player?.id;

                  return (
                    <div
                      key={`podium-${rank}-${entry?.team || entry?.player_id || index}`}
                      className={`summary-podium-card rank-${rank}${
                        mine ? " mine" : ""
                      }`}
                    >
                      <div className="summary-rank">
                        {rankIcon(rank)} อันดับ {rank}
                      </div>
                      <div className="summary-winner">
                        {mode === "team"
                          ? `ทีม ${entry?.team || "-"}`
                          : entry?.name || "ผู้เล่น"}
                      </div>
                      <div className="summary-score">
                        {entry?.total_score ?? 0} คะแนน
                      </div>
                      {entry?.prize && (
                        <div className="summary-prize-badge">
                          {entry.prize}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="summary-empty">
                ยังไม่มีข้อมูลผู้ชนะ
              </div>
            )}
          </section>

          <section className="summary-panel">
            <div className="summary-panel-title">
              ของรางวัล
            </div>

            {prizes.length > 0 ? (
              <div className="summary-prizes">
                {prizes.map((prize, index) => (
                  <div
                    key={`${prize}-${index}`}
                    className="summary-prize-row"
                  >
                    <span>อันดับ {index + 1}</span>
                    <strong>{prize}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="summary-empty">
                ห้องนี้ยังไม่ได้ตั้งของรางวัล
              </div>
            )}
          </section>
        </div>

        <section className="summary-panel">
          <div className="summary-panel-title">
            ตารางคะแนนทั้งหมด
          </div>

          {mode === "team" ? (
            <div className="summary-table">
              {teams.map((teamEntry, index) => (
                <div
                  key={`team-${teamEntry?.team || index}`}
                  className="summary-table-row"
                >
                  <div>
                    <strong>
                      {rankIcon(index + 1)} ทีม{" "}
                      {teamEntry?.team || "-"}
                    </strong>
                    <div className="summary-row-sub">
                      {(teamEntry?.members || [])
                        .map((member) =>
                          member?.player_id === player?.id
                            ? `${member?.name} (คุณ)`
                            : member?.name
                        )
                        .join(", ")}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div>{teamEntry?.total_score ?? 0}</div>
                    {teamEntry?.prize && (
                      <div className="summary-row-sub">
                        {teamEntry.prize}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="summary-table">
              {sortedResults.map((result, index) => (
                <div
                  key={result?.player_id || index}
                  className={`summary-table-row${
                    result?.player_id === player?.id ? " mine" : ""
                  }`}
                >
                  <div>
                    <strong>
                      {rankIcon(index + 1)} {result?.name || "ผู้เล่น"}
                      {result?.player_id === player?.id
                        ? " (คุณ)"
                        : ""}
                    </strong>
                    <div className="summary-row-sub">
                      {result?.prize || "ไม่มีรางวัล"}
                    </div>
                  </div>
                  <div>{result?.total_score ?? 0}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="summary-footer">
          ห้องจะปิดอัตโนมัติใน {countdown} วินาที
        </div>

        <button
          className="confirm-btn"
          onClick={triggerExit}
        >
          กลับหน้าแรก
        </button>
      </div>
    </div>
  );
}
