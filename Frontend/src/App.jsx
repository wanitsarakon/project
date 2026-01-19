import React, { useState, useRef } from "react";

import Home from "./pages/Home";
import Host from "./pages/Host";
import RoomList from "./pages/RoomList";
import Lobby from "./pages/Lobby";
import FestivalMap from "./pages/FestivalMap";
import Game from "./pages/Game";

/*
VIEWS:
- home
- host
- roomlist
- lobby
- festival-map
- game
*/

export default function App() {
  const [view, setView] = useState("home");

  /**
   * session = ข้อมูลที่ต้องอยู่ตลอด lifecycle ของ "ห้อง"
   * ❗ ห้ามล้างตอนเข้า game / festival-map
   * ❗ ล้างเฉพาะตอนออกจากห้องจริง ๆ
   */
  const [session, setSession] = useState(null);

  /* =========================
     NAV HELPERS
  ========================= */

  const goHome = () => {
    setSession(null);
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

  /**
   * ❌ ใช้เฉพาะ “ออกจากห้อง”
   * ❌ ห้ามใช้ตอนจบเกม
   */
  const leaveRoom = () => {
    if (!session?.player) {
      goHome();
      return;
    }

    const { player, isHost } = session;

    // เก็บชื่อไว้ (UX) แต่ล้าง room context
    setSession({
      player: { name: player.name },
      isHost,
    });

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
        /**
         * ✅ Host กด Start
         * → ทุกคนไป Festival Map
         */
        onStartGame={() => setView("festival-map")}
      />
    );
  }

  /* =========================
     FESTIVAL MAP (หน้าซุ้มเกม)
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
         * ▶ Host เริ่มเกมถัดไป
         * → เข้า Mini Game
         */
        onEnterGame={() => setView("game")}
      />
    );
  }

  /* =========================
     GAME (Mini Game จริง)
  ========================= */
  if (view === "game") {
    if (!session?.player?.id || !session?.roomCode) {
      goHome();
      return null;
    }

    return (
      <Game
        roomCode={session.roomCode}
        player={session.player}
        /**
         * ⬅ ออกจากเกมเอง
         * → กลับ Festival Map
         */
        onExit={() => setView("festival-map")}
        /**
         * 🏁 Mini Game จบ
         * → กลับ Festival Map
         */
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
