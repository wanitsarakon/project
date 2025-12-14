import React, { useEffect, useState } from "react";
import Home from "./pages/Home";
import Lobby from "./pages/Lobby";

/*
Session structure:
{
  roomCode: string,
  player: { id?, name },
  isHost: boolean
}
*/

export default function App() {
  const [session, setSession] = useState(null);

  /* =========================
     Restore session (refresh-safe)
  ========================= */
  useEffect(() => {
    const saved = localStorage.getItem("thai-festival-session");
    if (saved) {
      try {
        setSession(JSON.parse(saved));
      } catch {
        localStorage.removeItem("thai-festival-session");
      }
    }
  }, []);

  /* =========================
     Save session
  ========================= */
  useEffect(() => {
    if (session) {
      localStorage.setItem(
        "thai-festival-session",
        JSON.stringify(session)
      );
    } else {
      localStorage.removeItem("thai-festival-session");
    }
  }, [session]);

  /* =========================
     Leave room (future use)
  ========================= */
  const clearSession = () => {
    setSession(null);
  };

  /* =========================
     Render
  ========================= */

  // ถ้ามี session → เข้า Lobby
  if (session) {
    return (
      <Lobby
        roomCode={session.roomCode}
        player={session.player}
        isHost={session.isHost}
        onLeave={clearSession} // เผื่อทำปุ่มออก
      />
    );
  }

  // ยังไม่มี session → หน้า Home
  return (
    <Home
      onEnter={(role, name, createdRoomCode, playerObj) => {
        setSession({
          roomCode: createdRoomCode,
          isHost: role === "host",
          player: playerObj || { name },
        });
      }}
    />
  );
}
