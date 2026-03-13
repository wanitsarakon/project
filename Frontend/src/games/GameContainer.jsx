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
  allowRoundEvents = true,
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
      currentRoundIdRef.current ?? null;

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
        const activeScene =
          gameRef.current?.scene?.keys?.[gameKey];

        try {
          if (
            activeScene &&
            typeof activeScene._removeOverlay === "function"
          ) {
            activeScene._removeOverlay();
          }
          if (
            activeScene &&
            typeof activeScene.shutdown === "function"
          ) {
            activeScene.shutdown();
          }
        } catch (err) {
          console.warn("Scene end cleanup failed:", gameKey, err);
        }

        console.log("🏁 Game finished:", result);

        onGameEndRef.current?.({
          ...result,
          roundId,
          gameKey,
        });

        backToMap();

      }

    });

  };

  /* =========================
     LISTEN WEBSOCKET EVENTS
  ========================= */

  useEffect(() => {

    if (!allowRoundEvents) return;
    if (!wsRef) return;

    let detach = null;

    const handleWS = (msg) => {

      if (!msg?.type) return;

      const shouldStart =
        msg.type === "round_start" ||
        (msg.type === "enter_game" &&
          msg.player_id === player?.id);

      if (shouldStart) {

        if (startedRef.current) return;

        const sceneKey = msg.game_key;
        if (!sceneKey) return;

        startedRef.current = true;

        currentRoundIdRef.current =
          msg.round_id ?? null;

        startMiniGame(sceneKey);

      }

    };

    const attach = () => {
      if (detach || !wsRef?.current) return;

      const socket = wsRef.current;

      if (typeof socket.subscribe === "function") {
        detach = socket.subscribe(handleWS);
      }
    };

    attach();

    const retryTimer = window.setInterval(() => {
      attach();
    }, 200);

    return () => {
      window.clearInterval(retryTimer);
      detach?.();
      detach = null;
    };

  }, [allowRoundEvents, player?.id, wsRef]);

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

    if (typeof window !== "undefined") {
      window.__festivalDebug = {
        game,
        startMiniGame,
        resetToMap: () => {
          if (!gameRef.current) return;
          gameRef.current.scene.scenes.forEach((scene) => {
            if (scene.scene.key !== "FestivalMapScene") {
              gameRef.current.scene.stop(scene.scene.key);
            }
          });
          gameRef.current.scene.start("FestivalMapScene", {
            roomCode,
            player,
            currentRound: currentRoundIdRef.current,
            onEnterGame: startMiniGame,
          });
        },
      };
    }

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
        gameRef.current.scene.scenes.forEach((scene) => {
          try {
            if (typeof scene._removeOverlay === "function") {
              scene._removeOverlay();
            }
            if (typeof scene.shutdown === "function") {
              scene.shutdown();
            }
          } catch (err) {
            console.warn("Scene cleanup failed:", scene?.scene?.key, err);
          }
        });

        gameRef.current.destroy(true);

        gameRef.current = null;

      }

      if (typeof window !== "undefined") {
        delete window.__festivalDebug;
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
