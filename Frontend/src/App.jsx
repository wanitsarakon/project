import React, { useState } from "react";

import Home from "./pages/Home";
import Host from "./pages/Host";
import RoomList from "./pages/RoomList";
import Lobby from "./pages/Lobby";
import FestivalMap from "./pages/FestivalMap";
import Game from "./pages/Game";

export default function App() {
  const [view, setView] = useState("home");

  /**
   * session = context ของห้อง
   */
  const [session, setSession] = useState(null);

  /**
   * 🔑 เกมที่กำลังจะเล่น (จาก Festival Map)
   */
  const [currentGame, setCurrentGame] = useState(null);

  /* =========================
     NAV HELPERS
  ========================= */

  const goHome = () => {
    setSession(null);
    setCurrentGame(null);
    setView("home");
  };

  const goLobby = (roomCode, playerWithId, isHost) => {
    if (!roomCode || !playerWithId?.id) {
      console.error("❌ Invalid lobby data", {
        roomCode,
        playerWithId,
      });
      goHome();
      return;
    }

    setSession({
      roomCode,
      player: playerWithId,
      isHost,
    });

    setView("lobby");
  };

  const leaveRoom = () => {
    if (!session?.player) {
      goHome();
      return;
    }

    const { player, isHost } = session;

    setSession({
      player: { name: player.name },
      isHost,
    });

    setCurrentGame(null);
    setView(isHost ? "host" : "roomlist");
  };

  /* =========================
     HOME
  ========================= */
  if (view === "home") {
    return (
      <Home
        onSelect={(role, name) => {
          const player = { name };

          if (role === "host") {
            setSession({ player, isHost: true });
            setView("host");
          } else {
            setSession({ player, isHost: false });
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
        onCreateRoom={(roomCode, playerWithId) =>
          goLobby(roomCode, playerWithId, true)
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
        onJoin={(roomCode, playerWithId) =>
          goLobby(roomCode, playerWithId, false)
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
        onStartGame={() => {
          setCurrentGame(null);
          setView("festival-map");
        }}
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
        /**
         * 🔥 เลือกซุ้ม → ระบุเกม
         */
        onEnterGame={(gameKey) => {
          setCurrentGame(gameKey);
          setView("game");
        }}
        onLeave={leaveRoom}
      />
    );
  }

  /* =========================
     GAME
  ========================= */
  if (view === "game") {
    if (
      !session?.player?.id ||
      !session?.roomCode ||
      !currentGame
    ) {
      setView("festival-map");
      return null;
    }

    return (
      <Game
        roomCode={session.roomCode}
        player={session.player}
        gameKey={currentGame}
        onExit={() => setView("festival-map")}
        onFinish={(result) => {
          console.log("🏁 Game finished:", result);
          setView("festival-map");
        }}
      />
    );
  }

  /* =========================
     FALLBACK
  ========================= */
  return (
    <div style={{ padding: 24, textAlign: "center" }}>
      <p>⚠️ Invalid state</p>
      <button onClick={goHome}>กลับหน้าแรก</button>
    </div>
  );
}
