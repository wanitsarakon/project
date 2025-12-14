import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// =========================
// หา root element
// =========================
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "❌ Root element with id 'root' was not found in index.html"
  );
}

// =========================
// Start React App (React 18)
// =========================
createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
