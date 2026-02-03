import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

import FestivalMapScene from "../games/FestivalMapScene";
import FishScoopingScene from "./FishScooping/FishScoopingScene";

export default function GameContainer({
  roomCode,
  player,
  wsRef,
  onGameEnd,
}) {
  const gameRef = useRef(null);
  const containerRef = useRef(null);

  // 🎯 current round id (จาก backend)
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

    const socket = wsRef.current;
    const originalHandler = socket.onMessage;

    const handleWS = (msg) => {
      // ส่งต่อ handler เดิมก่อน
      originalHandler?.(msg);

      if (msg?.type === "round_start") {
        currentRoundIdRef.current = msg.round_id;
        console.log("🎯 round started:", msg.round_id);
      }
    };

    socket.onMessage = handleWS;

    return () => {
      socket.onMessage = originalHandler || null;
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

      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0 },
          debug: false,
        },
      },

      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },

      scene: [
        FestivalMapScene,
        FishScoopingScene,
      ],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    /* =========================
       🎮 ENTER GAME HANDLER
    ========================= */
    const handleEnterGame = ({ gameKey }) => {
      if (!gameRef.current) return;

      const roundId =
        currentRoundIdRef.current ?? "solo-mode";

      const backToMap = () => {
        if (!gameRef.current) return;

        game.scene.start("FestivalMapScene", {
          roomCode,
          player,
          currentRound: roundId,
          onEnterGame: handleEnterGame,
        });
      };

      switch (gameKey) {
        case "FishScoopingScene":
          game.scene.start("FishScoopingScene", {
            roomCode,
            player,
            roundId,
            onGameEnd: (result) => {
              onGameEndRef.current?.(result);
              backToMap();
            },
          });
          break;

        default:
          console.warn(
            "[GameContainer] Unknown gameKey:",
            gameKey
          );
      }
    };

    /* =========================
       ▶️ START FESTIVAL MAP
    ========================= */
    game.scene.start("FestivalMapScene", {
      roomCode,
      player,
      currentRound: currentRoundIdRef.current,
      onEnterGame: handleEnterGame,
    });

    /* =========================
       🧹 CLEANUP
    ========================= */
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []); // ❗ ต้องเป็น [] เท่านั้น

  /* =========================
     RENDER
  ========================= */
  return (
    <div
      ref={containerRef}
      id="phaser-root"
      style={{
        width: "100%",
        maxWidth: 900,
        aspectRatio: "4 / 3",
        margin: "0 auto",
        borderRadius: 16,
        overflow: "hidden",
        background: "#000",
        boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
      }}
    />
  );
}
