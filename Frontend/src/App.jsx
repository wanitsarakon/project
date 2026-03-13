import React, { useState } from "react";

import Home from "./pages/Home";
import Host from "./pages/Host";
import RoomList from "./pages/RoomList";
import Lobby from "./pages/Lobby";
import FestivalMap from "./pages/FestivalMap";
import SummaryPage from "./pages/SummaryPage";

export default function App() {

  const [view, setView] = useState("home");
  const [session, setSession] = useState(null);
  const [summary, setSummary] = useState(null);

  /* =========================
     NAV HELPERS
  ========================= */

  const goHome = () => {
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
    setView("lobby");

  };

  const leaveRoom = () => {

    if (!session?.player?.name) {
      goHome();
      return;
    }

    const { player } = session;

    setSession({ player: { name: player.name } });
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
          setSummary(data);
          setView("summary");
        }}
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
