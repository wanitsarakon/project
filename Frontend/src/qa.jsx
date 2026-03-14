import React from "react";
import ReactDOM from "react-dom/client";
import GameContainer from "./games/GameContainer";
import "./styles.css";

function QAApp() {
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
