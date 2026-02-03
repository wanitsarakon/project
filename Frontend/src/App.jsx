import React, { useState } from "react";

import Home from "./pages/Home";
import Host from "./pages/Host";
import RoomList from "./pages/RoomList";
import Lobby from "./pages/Lobby";
import FestivalMap from "./pages/FestivalMap";
import Game from "./pages/Game";

export default function App() {
  // ⭐ เริ่มที่ Home ทันที
  const [view, setView] = useState("home");

  /**
   * session = context ของห้อง
   * {
   *   roomCode,
   *   player: { id, name, isHost }
   * }
   */
  const [session, setSession] = useState(null);

  /**
   * 🔑 เกมที่กำลังเล่นอยู่
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

  const goLobby = (roomCode, player) => {
    if (!roomCode || !player) {
      console.error("❌ Invalid lobby data", { roomCode, player });
      return;
    }

    setSession({ roomCode, player });
    setView("lobby");
  };

  const leaveRoom = () => {
    if (!session?.player?.name) {
      goHome();
      return;
    }

    const { player } = session;
    setSession({ player: { name: player.name } });
    setCurrentGame(null);
    setView(player.isHost ? "host" : "roomlist");
  };

  /* =========================
     🏠 HOME (Landing + Select Role)
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
      console.warn("⚠️ Invalid lobby state", session);
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
        onFinish={() => setView("festival-map")}
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
