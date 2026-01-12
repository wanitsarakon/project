import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

/* =========================
   Error Boundary (Minimal)
========================= */
class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("❌ Uncaught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: 24,
            textAlign: "center",
            fontFamily: "sans-serif",
          }}
        >
          <h2>⚠️ เกิดข้อผิดพลาด</h2>
          <p>กรุณารีเฟรชหน้า หรือกลับมาใหม่อีกครั้ง</p>
        </div>
      );
    }

    return this.props.children;
  }
}

/* =========================
   Find root element
========================= */
const container = document.getElementById("root");

if (!container) {
  throw new Error(
    "❌ Root element with id 'root' was not found in index.html"
  );
}

/* =========================
   Create root (React 18)
========================= */
const root = createRoot(container);

/* =========================
   Render App
   ❗ ไม่ใช้ StrictMode เพราะ:
   - WebSocket reconnect
   - useEffect double-run ใน dev
========================= */
root.render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
