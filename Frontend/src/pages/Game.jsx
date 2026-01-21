import React, { useCallback, useEffect, useRef } from "react";
import GameContainer from "../games/GameContainer";
import { createRoomSocket } from "../websocket/wsClient";

/**
 * Game = Mini Game Wrapper
 * - ถูกเรียกจาก Festival Map
 * - จบแล้วต้องกลับ Festival Map เสมอ
 */
export default function Game({
  roomCode,
  player,
  onExit,    // ⬅ ออกจากมินิเกมเอง
  onFinish,  // 🏁 มินิเกมจบ
}) {
  const wsRef = useRef(null);
  const finishedRef = useRef(false);

  /* =========================
     OPEN WS (GAME SCOPE)
     - 1 mini game = 1 socket
  ========================= */
  useEffect(() => {
    if (!roomCode || !player?.id) return;

    finishedRef.current = false;

    // 🔒 ปิด socket เก่าถ้ามี
    try {
      wsRef.current?.close();
    } catch {}
    wsRef.current = null;

    wsRef.current = createRoomSocket(
      roomCode,
      () => {
        // 🎮 mini game ไม่ต้องฟัง lobby event
      },
      {
        playerId: player.id,
        debug: false,
      }
    );

    return () => {
      // cleanup: ปิด WS ถ้ายังไม่ปิด
      try {
        wsRef.current?.close();
      } catch {}
      wsRef.current = null;
    };
  }, [roomCode, player?.id]);

  /* =========================
     SAFE CLOSE WS (ONCE)
  ========================= */
  const closeSocketOnce = () => {
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }
  };

  /* =========================
     MINI GAME END (ONCE)
  ========================= */
  const handleGameEnd = useCallback(
    (result) => {
      if (finishedRef.current) return;
      finishedRef.current = true;

      console.log("🎮 Mini game result:", result);

      closeSocketOnce();
      onFinish?.(result);
    },
    [onFinish]
  );

  /* =========================
     MANUAL EXIT
     → Festival Map
  ========================= */
  const handleExit = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    closeSocketOnce();
    onExit?.();
  }, [onExit]);

  /* =========================
     GUARD
  ========================= */
  if (!roomCode || !player?.id) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p>⚠️ ข้อมูลเกมไม่ครบ</p>
        <button onClick={onExit}>กลับหน้าซุ้มเกม</button>
      </div>
    );
  }

  /* =========================
     UI
  ========================= */
  return (
    <div className="game-root">
      <GameContainer
        roomCode={roomCode}
        player={player}
        wsRef={wsRef}             // ✅ WS เดียวตลอดมินิเกม
        onGameEnd={handleGameEnd} // ✅ จบเกมครั้งเดียว
      />

      {/* Manual Exit */}
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <button
          onClick={handleExit}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
          }}
        >
          ⬅ กลับหน้าซุ้มเกม
        </button>
      </div>
    </div>
  );
}
