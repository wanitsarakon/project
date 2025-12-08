import React, { useEffect, useState } from "react";

export default function Lobby({ roomCode, player, isHost }) {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8080/ws/${roomCode}`);
    ws.onopen = () => setEvents((e) => [...e, { type: "system", text: "connected to ws" }]);
    ws.onmessage = (ev) => {
      try {
        const d = JSON.parse(ev.data);
        setEvents((prev) => [...prev, d]);
      } catch (err) {
        setEvents((e) => [...e, { type: "raw", text: ev.data }]);
      }
    };
    ws.onclose = () => setEvents((e) => [...e, { type: "system", text: "ws closed" }]);
    return () => ws.close();
  }, [roomCode]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Lobby — ห้อง {roomCode}</h2>
      <div>คุณ: {player?.name} {isHost ? "(Host)" : ""}</div>
      <div style={{ marginTop: 12 }}>
        <h4>Events (เรียลไทม์)</h4>
        <ul>
          {events.map((ev, i) => (
            <li key={i}>{typeof ev === "string" ? ev : JSON.stringify(ev)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
