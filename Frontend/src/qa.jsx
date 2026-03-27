import React from "react";
import { useEffect } from "react";
import ReactDOM from "react-dom/client";
import GameContainer from "./games/GameContainer";
import "./styles.css";

function QAApp() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const scene = params.get("scene");
    if (!scene) return;

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      const debug = window.__festivalDebug;
      if (debug?.startMiniGame) {
        debug.startMiniGame(scene);
        window.clearInterval(timer);
      } else if (attempts > 50) {
        window.clearInterval(timer);
      }
    }, 200);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#120f08" }}>
      <GameContainer
        roomCode="QA0001"
        player={{ id: 1, name: "QA Tester", isHost: true }}
        wsRef={null}
        allowRoundEvents={false}
        onGameEnd={(result) => {
          console.log("QA mini game result:", result);
        }}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<QAApp />);
