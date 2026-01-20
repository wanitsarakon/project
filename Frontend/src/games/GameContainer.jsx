import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

import FestivalMapScene from "../games/FestivalMapScene";
import DollShootScene from "./DollShooting/DollShootScene";

export default function GameContainer({
  roomCode,
  player,
  wsRef,
  onGameEnd,
}) {
  const gameRef = useRef(null);
  const containerRef = useRef(null);

  // ⭐ เก็บ round ปัจจุบัน (สำคัญมาก)
  const currentRoundIdRef = useRef(null);

  // 🔒 กัน stale closure
  const onGameEndRef = useRef(onGameEnd);
  useEffect(() => {
    onGameEndRef.current = onGameEnd;
  }, [onGameEnd]);

  /* =========================
     LISTEN ROUND START (WS)
  ========================= */
  useEffect(() => {
    if (!wsRef?.current) return;

    const handleWS = (msg) => {
      if (msg?.type === "round_start") {
        currentRoundIdRef.current = msg.round_id;
        console.log("🎯 round started:", msg.round_id);
      }
    };

    wsRef.current.onMessage = handleWS;

    return () => {
      if (wsRef.current?.onMessage === handleWS) {
        wsRef.current.onMessage = null;
      }
    };
  }, [wsRef]);

  /* =========================
     INIT PHASER (ONCE)
  ========================= */
  useEffect(() => {
    if (gameRef.current || !containerRef.current) return;

    const config = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 800,
      height: 600,
      backgroundColor: "#000",
      scale: {
        mode: Phaser.Scale.NONE,
      },
      scene: [FestivalMapScene, DollShootScene],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    /* =========================
       🎮 ENTER GAME HANDLER
    ========================= */
    const handleEnterGame = (gameKey) => {
      if (!gameRef.current) return;

      const roundId = currentRoundIdRef.current;
      if (!roundId) {
        console.warn("❌ no active round");
        return;
      }

      switch (gameKey) {
        case "SHOOT": {
          game.scene.start("DollShootScene", {
            roomCode,
            player,
            roundId, // ⭐ ส่งเข้า MiniGame
            onGameEnd: (result) => {
              onGameEndRef.current?.(result);

              // 🔁 กลับ Map
              game.scene.start("FestivalMapScene", {
                roomCode,
                player,
              });
            },
          });
          break;
        }

        default:
          console.warn(
            "[GameContainer] Unknown gameKey:",
            gameKey
          );
      }
    };

    // 📡 ฟัง event จาก Phaser
    game.events.on("enter-game", handleEnterGame);

    /* =========================
       ▶️ START FESTIVAL MAP
    ========================= */
    game.scene.start("FestivalMapScene", {
      roomCode,
      player,
    });


    

    /* =========================
       🧹 CLEANUP
    ========================= */
    return () => {
      if (!gameRef.current) return;

      game.events.off("enter-game", handleEnterGame);
      gameRef.current.destroy(true);
      gameRef.current = null;
    };
  }, []); // ❗ สร้าง Phaser แค่ครั้งเดียว

  /* =========================
     RENDER
  ========================= */
  return (
    <div
      ref={containerRef}
      id="phaser-root"
      style={{
        width: 800,
        height: 600,
        margin: "0 auto",
        borderRadius: 16,
        overflow: "hidden",
        background: "#000",
        boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
      }}
    />
  );
}
