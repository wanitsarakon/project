import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// ป้องกันกรณี root element หาไม่เจอ (จะช่วย debug ได้ง่ายขึ้น)
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element with id 'root' was not found in index.html");
}

// start app
createRoot(rootElement).render(<App />);
