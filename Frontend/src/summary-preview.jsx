import React from "react";
import ReactDOM from "react-dom/client";
import SummaryPage from "./pages/SummaryPage";
import "./styles.css";

const sampleSummary = {
  mode: "team",
  room_name: "Thai Festival Room",
  prizes: ["ตุ๊กตาตัวใหญ่", "ชุดขนมไทย", "พวงกุญแจงานวัด"],
  podium: [
    { rank: 1, name: "ทีม red", score: 990, prize: "ตุ๊กตาตัวใหญ่", team: "red" },
    { rank: 2, name: "ทีม blue", score: 360, prize: "ชุดขนมไทย", team: "blue" },
  ],
  teams: [
    {
      rank: 1,
      team: "red",
      score: 990,
      members: ["มิน", "โอ๊ต", "ฟ้า"],
      prize: "ตุ๊กตาตัวใหญ่",
    },
    {
      rank: 2,
      team: "blue",
      score: 360,
      members: ["นนท์", "ปริม"],
      prize: "ชุดขนมไทย",
    },
  ],
  results: [
    { rank: 1, name: "มิน", score: 420, team: "red" },
    { rank: 2, name: "โอ๊ต", score: 310, team: "red" },
    { rank: 3, name: "ฟ้า", score: 260, team: "red" },
    { rank: 4, name: "นนท์", score: 210, team: "blue" },
    { rank: 5, name: "ปริม", score: 150, team: "blue" },
  ],
};

function SummaryPreviewApp() {
  return (
    <SummaryPage
      roomCode="PREVIEW01"
      player={{ id: 1, name: "มิน", isHost: true, team: "red" }}
      summary={sampleSummary}
      onExit={() => {
        console.log("Summary preview exit");
      }}
    />
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<SummaryPreviewApp />);
