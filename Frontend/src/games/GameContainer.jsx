import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

import FestivalMapScene from "../games/FestivalMapScene";
import DollShootScene from "./DollShooting/DollShootScene";
import FishScoopingScene from "./FishScooping/FishScoopingScene";

export default function GameContainer({
  roomCode,
  player,
  wsRef,
  onGameEnd,
}) {
  const gameRef = useRef(null);
  const containerRef = useRef(null);

  // ⭐ round ปัจจุบันจาก WS
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

    const prevHandler = wsRef.current.onMessage;

    const handleWS = (msg) => {
      prevHandler?.(msg);

      if (msg?.type === "round_start") {
        currentRoundIdRef.current = msg.round_id;
        console.log("🎯 round started:", msg.round_id);
      }
    };

    wsRef.current.onMessage = handleWS;

    return () => {
      if (wsRef.current) {
        wsRef.current.onMessage = prevHandler || null;
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

      // ✅🔥 สำคัญที่สุด — ต้องมี physics
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0 },
          debug: false,
        },
      },

      scale: {
        mode: Phaser.Scale.NONE,
      },

      scene: [
        FestivalMapScene,
        DollShootScene,
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

      console.log("🎮 Enter game:", gameKey, "round:", roundId);

      const backToMap = () => {
        game.scene.start("FestivalMapScene", {
          roomCode,
          player,
          onEnterGame: handleEnterGame,
        });
      };

      switch (gameKey) {
        case "FishScoopingScene": {
          game.scene.start("FishScoopingScene", {
            roomCode,
            player,
            roundId,
            wsRef,
            onGameEnd: (result) => {
              onGameEndRef.current?.(result);
              backToMap();
            },
          });
          break;
        }

        case "SHOOT": {
          game.scene.start("DollShootScene", {
            roomCode,
            player,
            roundId,
            wsRef,
            onGameEnd: (result) => {
              onGameEndRef.current?.(result);
              backToMap();
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

    /* =========================
       ▶️ START FESTIVAL MAP
    ========================= */
    game.scene.start("FestivalMapScene", {
      roomCode,
      player,
      onEnterGame: handleEnterGame,
    });

    /* =========================
       🧹 CLEANUP
    ========================= */
    return () => {
      if (!gameRef.current) return;

      gameRef.current.destroy(true);
      gameRef.current = null;
    };
  }, []);

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
