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

const FESTIVAL_BGM_STOP_EVENT = "festival-bgm-stop";

export default function GameContainer({
  roomCode,
  player,
  wsRef,
  onGameEnd,
  onGameStart,
  allowRoundEvents = false,
  mapData = {},
}) {

  const gameRef = useRef(null);
  const containerRef = useRef(null);

  const currentRoundIdRef = useRef(null);
  const onGameEndRef = useRef(onGameEnd);
  const onGameStartRef = useRef(onGameStart);
  const startedRef = useRef(false);
  const mapDataRef = useRef(mapData);

  const installDebugHook = () => {
    if (typeof window === "undefined") return;
    if (!gameRef.current) return;

    window.__festivalDebug = {
      game: gameRef.current,
      startMiniGame,
      resetToMap: () => {
        if (!gameRef.current) return;
        gameRef.current.scene.scenes.forEach((scene) => {
          if (scene.scene.key !== "FestivalMapScene") {
            try {
              if (typeof scene._removeOverlay === "function") {
                scene._removeOverlay();
              }
              if (typeof scene.shutdown === "function") {
                scene.shutdown();
              }
            } catch (err) {
              console.warn("QA reset cleanup failed:", scene.scene.key, err);
            }
            gameRef.current.scene.stop(scene.scene.key);
          }
        });
        gameRef.current.scene.start("FestivalMapScene", {
          roomCode,
          player,
          currentRound: currentRoundIdRef.current,
          onEnterGame: startMiniGame,
          sequence: mapDataRef.current?.sequence ?? [],
          boothStates: mapDataRef.current?.boothStates ?? {},
        });
      },
    };
  };

  /* =========================
     KEEP CALLBACK UPDATED
  ========================= */

  useEffect(() => {
    onGameEndRef.current = onGameEnd;
  }, [onGameEnd]);

  useEffect(() => {
    onGameStartRef.current = onGameStart;
  }, [onGameStart]);

  useEffect(() => {
    mapDataRef.current = mapData;
    const mapScene = gameRef.current?.scene?.keys?.FestivalMapScene;
    if (mapScene && typeof mapScene.applyMapData === "function") {
      mapScene.applyMapData(mapData);
    }
    installDebugHook();
  }, [mapData]);

  useEffect(() => {
    const retryTimer = window.setInterval(() => {
      installDebugHook();
    }, 250);

    installDebugHook();

    return () => {
      window.clearInterval(retryTimer);
    };
  }, []);

  /* =========================
     START MINI GAME
  ========================= */

  const startMiniGame = (gameKey) => {

    if (!gameRef.current) return;

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(FESTIVAL_BGM_STOP_EVENT));
    }

    const game = gameRef.current;

    if (!game.scene.keys[gameKey]) {
      console.warn("Scene not found:", gameKey);
      return;
    }

    const roundId =
      currentRoundIdRef.current ?? null;

    game.scene.scenes.forEach((scene) => {
      const key = scene?.scene?.key;
      if (!key || key === gameKey) return;

      try {
        if (typeof scene._removeOverlay === "function") {
          scene._removeOverlay();
        }
        if (typeof scene.shutdown === "function" && key !== "FestivalMapScene") {
          scene.shutdown();
        }
      } catch (err) {
        console.warn("Scene cleanup before start failed:", key, err);
      }

      game.scene.stop(key);
    });

    const backToMap = () => {

      startedRef.current = false;

      if (!gameRef.current) return;

      gameRef.current.scene.stop(gameKey);

      gameRef.current.scene.start("FestivalMapScene", {
        roomCode,
        player,
        currentRound: roundId,
        onEnterGame: startMiniGame,
        sequence: mapDataRef.current?.sequence ?? [],
        boothStates: mapDataRef.current?.boothStates ?? {},
      });

    };

    console.log("🎮 Start game:", gameKey);

    onGameStartRef.current?.(gameKey);

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

    const getViewport = () => ({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const viewport = getViewport();

    const config = {

      type: Phaser.AUTO,

      parent: containerRef.current,

      width: viewport.width,
      height: viewport.height,

      backgroundColor: "#000",

      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },

      scale: {
        mode: Phaser.Scale.RESIZE,
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

    const handleResize = () => {
      if (!gameRef.current) return;
      const next = getViewport();
      gameRef.current.scale.resize(next.width, next.height);
    };
    window.addEventListener("resize", handleResize);

    installDebugHook();

    /* START MAP */

    game.scene.start("FestivalMapScene", {

      roomCode,
      player,

      currentRound: currentRoundIdRef.current,
      onEnterGame: startMiniGame,
      sequence: mapDataRef.current?.sequence ?? [],
      boothStates: mapDataRef.current?.boothStates ?? {},

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

      window.removeEventListener("resize", handleResize);

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
        width: "100vw",
        height: "100vh",
        margin: 0,
        borderRadius: 0,
        overflow: "hidden",
        background: "#000",
        boxShadow: "none"
      }}
    />

  );

}
