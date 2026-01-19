import React, { useEffect, useRef, useState } from "react";
import { createRoomSocket } from "../websocket/wsClient";
import { GAMES } from "../constants/games";

export default function FestivalMap({
  roomCode,
  player,
  onEnterGame,
}) {
  const wsRef = useRef(null);
  const [currentRound, setCurrentRound] = useState(1);

  /* =========================
     WEBSOCKET
  ========================= */
  useEffect(() => {
    wsRef.current = createRoomSocket(
      roomCode,
      (msg) => {
        if (!msg?.type) return;

        switch (msg.type) {
          case "round_update":
            setCurrentRound(msg.current_round);
            break;

          case "round_start":
            onEnterGame?.();
            break;

          case "game_finish":
            // อนาคตไป summary
            break;

          default:
            break;
        }
      },
      { playerId: player.id }
    );

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [roomCode, player.id, onEnterGame]);

  /* =========================
     HOST ACTION
  ========================= */
  const startNextGame = () => {
    wsRef.current?.send({
      type: "round_start",
      round: currentRound,
    });
  };

  const isHost = player.isHost;

  /* =========================
     UI
  ========================= */
  return (
    <div className="festival-map-root">
      <h2>🎪 งานวัด</h2>

      <div className="map">
        {GAMES.map((g) => {
          const status =
            g.order < currentRound
              ? "done"
              : g.order === currentRound
              ? "current"
              : "locked";

          return (
            <div
              key={g.key}
              className={`stall ${status}`}
            >
              <div className="order">
                {g.order}
              </div>
              <div className="name">
                {g.name}
              </div>
            </div>
          );
        })}
      </div>

      {isHost && (
        <button onClick={startNextGame}>
          ▶ เริ่มเกมที่ {currentRound}
        </button>
      )}
    </div>
  );
}
