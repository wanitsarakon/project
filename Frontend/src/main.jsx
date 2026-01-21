import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

/* =========================
   Root Error Boundary
   (Production-Safe)
========================= */
class RootErrorBoundary extends React.Component {
  static displayName = "RootErrorBoundary";

  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorId: 0, // ใช้ reset boundary
    };
  }

  static getDerivedStateFromError(_error) {
    // 🔒 ไม่ expose error detail กับผู้ใช้
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // 🧠 production: ต่อ Sentry / LogRocket ได้ตรงนี้
    console.error("❌ Uncaught error:", error, info);
  }

  handleReload = () => {
    // 🔁 hard reload (clean)
    window.location.reload();
  };

  handleRecover = () => {
    // ♻️ soft recover (reset React tree)
    this.setState((s) => ({
      hasError: false,
      errorId: s.errorId + 1,
    }));
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
            เกิดข้อผิดพลาดที่ไม่คาดคิด
            <br />
            คุณสามารถลองกู้คืน หรือรีเฟรชหน้าใหม่
          </p>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={this.handleRecover}
              style={{
                marginTop: 16,
                padding: "10px 18px",
                borderRadius: 10,
                border: "1px solid #ccc",
                cursor: "pointer",
                background: "#fff",
                fontSize: 15,
              }}
            >
              ♻️ ลองกู้คืน
            </button>

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
                fontSize: 15,
              }}
            >
              🔄 รีเฟรชหน้า
            </button>
          </div>
        </div>
      );
    }

    // key ใช้ reset tree เมื่อ recover
    return (
      <React.Fragment key={this.state.errorId}>
        {this.props.children}
      </React.Fragment>
    );
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
