import React, { useState } from "react";
import Home from "./pages/Home";
import Lobby from "./pages/Lobby";

export default function App() {
  const [roomCode, setRoomCode] = useState(null);
  const [player, setPlayer] = useState(null);
  const [isHost, setIsHost] = useState(false);

  // If roomCode set -> go to Lobby
  if (roomCode) {
    return <Lobby roomCode={roomCode} player={player} isHost={isHost} />;
  }
  return (
    <Home
      onEnter={(role, name, createdRoomCode, playerObj) => {
        setIsHost(role === "host");
        setRoomCode(createdRoomCode);
        setPlayer(playerObj || { name });
      }}
    />
  );
}
