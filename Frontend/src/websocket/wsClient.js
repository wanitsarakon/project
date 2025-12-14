/**
 * createRoomSocket
 * - รองรับ reconnect
 * - มี heartbeat (ping)
 * - safe JSON handling
 * - ใช้กับ Gin + Gorilla WebSocket ได้ตรง ๆ
 */
export function createRoomSocket(roomCode, onMessage, options = {}) {
  const {
    urlBase =
      window.location.protocol === "https:"
        ? "wss://" + window.location.host
        : "ws://localhost:8080",
    reconnectDelay = 2000,
    heartbeatInterval = 15000,
    debug = true,
  } = options;

  let ws = null;
  let heartbeatTimer = null;
  let reconnectTimer = null;
  let shouldReconnect = true;

  /* =========================
     CONNECT
  ========================= */
  const connect = () => {
    if (debug) console.log("🔌 WS connecting...");

    ws = new WebSocket(`${urlBase}/ws/${roomCode}`);

    ws.onopen = () => {
      if (debug) console.log("✅ WS connected");
      startHeartbeat();
    };

    ws.onmessage = (event) => {
      if (!event?.data) return;

      try {
        const data = JSON.parse(event.data);

        // ignore pong / ping echo if backend sends back
        if (data.type === "pong") return;

        onMessage && onMessage(data);
      } catch (err) {
        console.error("❌ WS JSON parse error:", err, event.data);
      }
    };

    ws.onerror = (err) => {
      console.error("❌ WS error:", err);
    };

    ws.onclose = (ev) => {
      if (debug)
        console.warn(
          `⚠️ WS closed (code=${ev.code}, reason=${ev.reason})`
        );

      stopHeartbeat();

      if (shouldReconnect) {
        reconnectTimer = setTimeout(() => {
          if (debug) console.log("🔄 WS reconnecting...");
          connect();
        }, reconnectDelay);
      }
    };
  };

  /* =========================
     HEARTBEAT
  ========================= */
  const startHeartbeat = () => {
    stopHeartbeat();
    heartbeatTimer = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "ping",
            ts: Date.now(),
          })
        );
      }
    }, heartbeatInterval);
  };

  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  /* =========================
     PUBLIC API
  ========================= */
  const send = (data) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      if (debug) console.warn("⚠️ WS not open, send skipped");
      return;
    }

    try {
      ws.send(JSON.stringify(data));
    } catch (err) {
      console.error("❌ WS send error:", err);
    }
  };

  const close = () => {
    shouldReconnect = false;
    stopHeartbeat();
    ws && ws.close();
  };

  // auto connect
  connect();

  return {
    send,
    close,
    get ready() {
      return ws?.readyState === WebSocket.OPEN;
    },
  };
}
