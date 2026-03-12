import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

/* MAP */

import FestivalMapScene from "./FestivalMapScene";

/* MINI GAMES */

import FishScoopingScene from "./FishScooping/FishScoopingScene";
import HorseDeliveryScene from "./HorseDelivery/HorseDeliveryScene";
import WorshipScene from "./WorshipBooth/WorshipBoothScene";

import BoxingGameScene from "./BoxingGame/BoxingGameScene";
import CookingGameScene from "./CookingGame/CookingGameScene";
import BalloonShootScene from "./BalloonShoot/BalloonShootScene";
import DollGameScene from "./DollGame/DollGameScene";
import FlowerGameScene from "./FlowerGame/FlowerGameScene";
import HauntedHouseScene from "./HauntedHouse/HauntedHouseScene";
import TugOfWarScene from "./TugOfWar/TugOfWarScene";

export default function GameContainer({
  roomCode,
  player,
  wsRef,
  onGameEnd,
}) {

  const gameRef = useRef(null);
  const containerRef = useRef(null);

  const currentRoundIdRef = useRef(null);
  const onGameEndRef = useRef(onGameEnd);
  const startedRef = useRef(false);

  /* =========================
     KEEP CALLBACK UPDATED
  ========================= */

  useEffect(() => {
    onGameEndRef.current = onGameEnd;
  }, [onGameEnd]);

  /* =========================
     START MINI GAME
  ========================= */

  const startMiniGame = (gameKey) => {

    if (!gameRef.current) return;

    const game = gameRef.current;

    if (!game.scene.keys[gameKey]) {
      console.warn("Scene not found:", gameKey);
      return;
    }

    const roundId =
      currentRoundIdRef.current ?? "solo-mode";

    const backToMap = () => {

      startedRef.current = false;

      if (!gameRef.current) return;

      gameRef.current.scene.stop(gameKey);

      gameRef.current.scene.start("FestivalMapScene", {
        roomCode,
        player,
        currentRound: roundId,
        onEnterGame: startMiniGame
      });

    };

    console.log("🎮 Start game:", gameKey);

    game.scene.start(gameKey, {

      roomCode,
      player,
      roundId,

      onGameEnd: (result) => {

        console.log("🏁 Game finished:", result);

        onGameEndRef.current?.(result);

        backToMap();

      }

    });

  };

  /* =========================
     LISTEN WEBSOCKET EVENTS
  ========================= */

  useEffect(() => {

    if (!wsRef?.current) return;

    const socket = wsRef.current;

    const originalHandler = socket.onMessage;

    const handleWS = (msg) => {

      originalHandler?.(msg);

      if (!msg?.type) return;

      if (
        msg.type === "round_start" ||
        msg.type === "game_start"
      ) {

        if (startedRef.current) return;

        startedRef.current = true;

        const roundId =
          msg.round_id ?? "FishScoopingScene";

        currentRoundIdRef.current = roundId;

        startMiniGame(roundId);

      }

    };

    socket.onMessage = handleWS;

    return () => {
      socket.onMessage = originalHandler || null;
    };

  }, [wsRef]);

  /* =========================
     INIT PHASER
  ========================= */

  useEffect(() => {

    if (gameRef.current) return;
    if (!containerRef.current) return;

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
          debug: false
        }
      },

      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },

      scene: [

        FestivalMapScene,

        FishScoopingScene,
        HorseDeliveryScene,
        WorshipScene,

        BoxingGameScene,
        CookingGameScene,
        BalloonShootScene,
        DollGameScene,
        FlowerGameScene,
        HauntedHouseScene,
        TugOfWarScene

      ]

    };

    const game = new Phaser.Game(config);

    gameRef.current = game;

    /* START MAP */

    game.scene.start("FestivalMapScene", {

      roomCode,
      player,

      currentRound: currentRoundIdRef.current,

      onEnterGame: startMiniGame

    });

    /* CLEANUP */

    return () => {

      if (gameRef.current) {

        gameRef.current.destroy(true);

        gameRef.current = null;

      }

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
        width: "100%",
        maxWidth: 900,
        aspectRatio: "4 / 3",
        margin: "0 auto",
        borderRadius: 16,
        overflow: "hidden",
        background: "#000",
        boxShadow: "0 12px 32px rgba(0,0,0,0.45)"
      }}
    />

  );

}