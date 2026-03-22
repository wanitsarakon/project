import React, { useEffect, useRef, useState } from "react";
import GameContainer from "./games/GameContainer";
import { FESTIVAL_BOOTHS } from "./games/FestivalMapScene";

import Home from "./pages/Home";
import Host from "./pages/Host";
import RoomList from "./pages/RoomList";
import Lobby from "./pages/Lobby";
import FestivalMap from "./pages/FestivalMap";
import SummaryPage from "./pages/SummaryPage";

const DEBUG_SCENE_ALIASES = {
  "festival-map": "FestivalMapScene",
  festival: "FestivalMapScene",
  fish: "FishScoopingScene",
  horse: "HorseDeliveryScene",
  boxing: "BoxingGameScene",
  cooking: "CookingGameScene",
  balloon: "BalloonShootScene",
  doll: "DollGameScene",
  flower: "FlowerGameScene",
  haunted: "HauntedHouseScene",
  tug: "TugOfWarScene",
  worship: "WorshipBoothScene",
};

const FESTIVAL_BGM_STOP_EVENT = "festival-bgm-stop";

export default function App() {

  const [view, setView] = useState("home");
  const [session, setSession] = useState(null);
  const [summary, setSummary] = useState(null);
  const [miniGameActive, setMiniGameActive] = useState(false);
  const bgmRef = useRef(null);
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const debugScene = searchParams?.get("scene") ?? "";
  const resolvedDebugScene = DEBUG_SCENE_ALIASES[debugScene] ?? debugScene;
  const isMiniGamePreview =
    Boolean(resolvedDebugScene) && resolvedDebugScene !== "FestivalMapScene";

  useEffect(() => {
    if (!bgmRef.current) {
      const audio = new Audio("/assets/festival-bgm.mp3");
      audio.loop = true;
      audio.volume = 0.32;
      bgmRef.current = audio;
    }

    const audio = bgmRef.current;
    const shouldPlay = !miniGameActive && !isMiniGamePreview;

    const tryPlay = () => {
      if (!shouldPlay) return;
      const promise = audio.play();
      if (promise?.catch) promise.catch(() => {});
    };
    const stopImmediately = () => {
      audio.pause();
    };

    if (shouldPlay) {
      tryPlay();
    } else {
      stopImmediately();
    }

    window.addEventListener("pointerdown", tryPlay, { passive: true });
    window.addEventListener("keydown", tryPlay);
    window.addEventListener(FESTIVAL_BGM_STOP_EVENT, stopImmediately);

    return () => {
      window.removeEventListener("pointerdown", tryPlay);
      window.removeEventListener("keydown", tryPlay);
      window.removeEventListener(FESTIVAL_BGM_STOP_EVENT, stopImmediately);
    };
  }, [isMiniGamePreview, miniGameActive]);

  useEffect(() => () => {
    if (bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current.currentTime = 0;
    }
  }, []);

  if (resolvedDebugScene === "FestivalMapScene") {
    return (
      <FestivalMapPreview />
    );
  }

  if (resolvedDebugScene) {
    return (
      <MiniGamePreview sceneKey={resolvedDebugScene} />
    );
  }

  /* =========================
     NAV HELPERS
  ========================= */

  const goHome = () => {
    setMiniGameActive(false);
    setSession(null);
    setSummary(null);
    setView("home");
  };

  const goLobby = (roomCode, player) => {

    if (!roomCode || !player) {
      console.error("❌ Invalid lobby data", { roomCode, player });
      return;
    }

    setSession({ roomCode, player });
    setSummary(null);
    setMiniGameActive(false);
    setView("lobby");

  };

  const leaveRoom = () => {

    if (!session?.player?.name) {
      goHome();
      return;
    }

    const { player } = session;

    setSession({ player: { name: player.name } });
    setMiniGameActive(false);
    setView(player.isHost ? "host" : "roomlist");

  };

  /* =========================
     HOME
  ========================= */

  if (view === "home") {

    return (
      <Home
        onSelect={(role, name) => {

          const player = { name };

          setSession({ player });

          if (role === "host") {
            setView("host");
          } else {
            setView("roomlist");
          }

        }}
      />
    );

  }

  /* =========================
     HOST
  ========================= */

  if (view === "host") {

    if (!session?.player) return null;

    return (
      <Host
        host={session.player}
        onCreateRoom={(roomCode, playerFromBackend) =>
          goLobby(roomCode, playerFromBackend)
        }
        onBack={goHome}
      />
    );

  }

  /* =========================
     ROOM LIST
  ========================= */

  if (view === "roomlist") {

    if (!session?.player) return null;

    return (
      <RoomList
        player={session.player}
        onJoin={(roomCode, playerFromBackend) =>
          goLobby(roomCode, playerFromBackend)
        }
        onBack={goHome}
      />
    );

  }

  /* =========================
     LOBBY
  ========================= */

  if (view === "lobby") {

    if (!session?.player?.id || !session?.roomCode) {
      goHome();
      return null;
    }

    return (
      <Lobby
        roomCode={session.roomCode}
        player={session.player}
        onLeave={leaveRoom}
        onStartGame={() => setView("festival-map")}
      />
    );

  }

  /* =========================
     FESTIVAL MAP
  ========================= */

  if (view === "festival-map") {

    if (!session?.player?.id || !session?.roomCode) {
      goHome();
      return null;
    }

    return (
      <FestivalMap
        roomCode={session.roomCode}
        player={session.player}
        onLeave={leaveRoom}
        onShowSummary={(data) => {
          setMiniGameActive(false);
          setSummary(data);
          setView("summary");
        }}
        onMiniGameChange={setMiniGameActive}
      />
    );

  }

  if (view === "summary") {

    if (!session?.player?.id || !session?.roomCode) {
      goHome();
      return null;
    }

    return (
      <SummaryPage
        roomCode={session.roomCode}
        player={session.player}
        summary={summary}
        onExit={goHome}
      />
    );

  }

  return null;

}

function MiniGamePreview({ sceneKey }) {
  useEffect(() => {
    const kickOff = window.setInterval(() => {
      if (!window.__festivalDebug?.startMiniGame) return;
      window.__festivalDebug.startMiniGame(sceneKey);
      window.clearInterval(kickOff);
    }, 250);

    return () => window.clearInterval(kickOff);
  }, [sceneKey]);

  return (
    <GameContainer
      roomCode="preview-room"
      player={{ id: "preview-player", name: "Preview Player" }}
      wsRef={{ current: null }}
      allowRoundEvents={false}
      mapData={{
        boothStates: Object.fromEntries(FESTIVAL_BOOTHS.map((booth) => [booth.scene, "unlocked"])),
      }}
      onGameEnd={() => {}}
      onGameStart={() => {}}
    />
  );
}

function FestivalMapPreview() {
  const previewBoothStates = Object.fromEntries(
    FESTIVAL_BOOTHS.map((booth, index) => [booth.scene, index === 0 ? "unlocked" : "locked"]),
  );

  return (
    <GameContainer
      roomCode="preview-room"
      player={{ id: "preview-player", name: "Preview Player" }}
      wsRef={{ current: null }}
      allowRoundEvents={false}
      mapData={{
        boothStates: previewBoothStates,
      }}
      onGameEnd={() => {}}
      onGameStart={() => {}}
    />
  );
}
