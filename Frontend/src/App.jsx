import React, { useEffect, useState } from "react";
import Home from "./pages/Home";
import Host from "./pages/Host";
import RoomList from "./pages/RoomList";
import Lobby from "./pages/Lobby";

/*
view:
- home
- host
- roomlist
- lobby
*/

const STORAGE_KEY = "thai-festival-session";
const ENABLE_RESTORE_SESSION = false; // เปิดเฉพาะ production

export default function App() {
  const [view, setView] = useState("home");
  const [session, setSession] = useState(null);
  // session shape:
  // {
  //   player: { id?, name },
  //   roomCode?,
  //   isHost
  // }

  /* =========================
     Restore session (OPTIONAL)
  ========================= */
  useEffect(() => {
    if (!ENABLE_RESTORE_SESSION) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (parsed?.player?.id && parsed?.roomCode) {
        setSession(parsed);
        setView("lobby");
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  /* =========================
     Persist session
  ========================= */
  useEffect(() => {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  /* =========================
     Navigation helpers
  ========================= */
  const goHome = () => {
    setSession(null);
    setView("home");
  };

  const goLobby = (roomCode, playerWithId, isHost) => {
    if (!playerWithId?.id) {
      console.error("❌ player.id missing");
      return;
    }

    setSession({
      player: playerWithId,
      roomCode,
      isHost,
    });
    setView("lobby");
  };

  const leaveLobby = () => {
    if (!session?.player) {
      goHome();
      return;
    }

    const { player, isHost } = session;

    // ออกจากห้อง → ล้าง roomCode แต่เก็บตัวตน
    setSession({
      player: { name: player.name },
      isHost,
    });

    setView(isHost ? "host" : "roomlist");
  };

  /* =========================
     RENDER
  ========================= */

  // 🏠 HOME
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

  // 🧑‍💼 HOST
  if (view === "host") {
    if (!session?.player) return goHome();

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

  // 🎮 ROOM LIST
  if (view === "roomlist") {
    if (!session?.player) return goHome();

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

  // 🏟 LOBBY
  if (view === "lobby") {
    if (!session?.player?.id || !session?.roomCode) {
      goHome();
      return null;
    }

    return (
      <Lobby
        roomCode={session.roomCode}
        player={session.player}
        onLeave={leaveLobby}
      />
    );
  }

  return null;
}
