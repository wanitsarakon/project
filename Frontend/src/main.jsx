import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

/* =========================
   Root Error Boundary
   (Production-safe)
========================= */
class RootErrorBoundary extends React.Component {
  static displayName = "RootErrorBoundary";

  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError(_error) {
    // 🔒 ไม่ expose error detail กับผู้ใช้
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // 🧠 production สามารถต่อ Sentry / LogRocket / backend log ได้
    console.error("❌ Uncaught error:", error, info);
  }

  handleReload = () => {
    // 🔁 รีเฟรชแบบ clean
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
            textAlign: "center",
            fontFamily:
              "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            background: "#f8f9fa",
          }}
        >
          <h2 style={{ marginBottom: 8 }}>
            ⚠️ เกิดข้อผิดพลาด
          </h2>

          <p
            style={{
              color: "#555",
              maxWidth: 360,
              lineHeight: 1.5,
            }}
          >
            เกิดข้อผิดพลาดที่ไม่คาดคิด <br />
            กรุณารีเฟรชหน้า หรือกลับมาใหม่อีกครั้ง
          </p>

          <button
            onClick={this.handleReload}
            style={{
              marginTop: 16,
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background: "#ff7a00",
              color: "#fff",
              fontSize: 16,
            }}
          >
            🔄 รีเฟรชหน้า
          </button>
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
   Create React 18 Root
========================= */
const root = createRoot(container);

/* =========================
   Render App
   ❗ ไม่ใช้ StrictMode เพราะ:
   - WebSocket reconnect logic
   - Phaser lifecycle
   - useEffect double-run ใน dev
========================= */
root.render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
