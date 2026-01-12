/**
 * createRoomSocket (PRODUCTION FINAL)
 *
 * ✅ reconnect-safe
 * ✅ heartbeat (text ping)
 * ✅ player_id support
 * ✅ Gin + Gorilla WS compatible
 * ✅ no double-close / no leak
 */

export function createRoomSocket(roomCode, onMessage, options = {}) {
  const {
    playerId = null,
    urlBase =
      window.location.protocol === "https:"
        ? `wss://${window.location.host}`
        : "ws://localhost:8080",
    reconnectDelay = 2000,
    heartbeatInterval = 30000,
    debug = false,
  } = options;

  let ws = null;
  let heartbeatTimer = null;
  let reconnectTimer = null;

  let shouldReconnect = true;
  let manuallyClosed = false;
  let connecting = false;
  let destroyed = false;

  /* =========================
     CONNECT
  ========================= */
  const connect = () => {
    if (connecting || ws || destroyed) return;

    connecting = true;
    manuallyClosed = false;

    let url = `${urlBase}/ws/${roomCode}`;
    if (playerId) {
      url += `?player_id=${encodeURIComponent(playerId)}`;
    }

    debug && console.log("🔌 WS connecting:", url);

    try {
      ws = new WebSocket(url);
    } catch (err) {
      connecting = false;
      debug && console.error("❌ WS create failed:", err);
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      connecting = false;
      debug && console.log("✅ WS connected:", roomCode);
      startHeartbeat();
    };

    ws.onmessage = (event) => {
      if (!event?.data) return;

      // backend pong อาจเป็น binary / empty
      if (event.data === "pong") return;

      try {
        const data =
          typeof event.data === "string"
            ? JSON.parse(event.data)
            : null;

        if (data?.type) {
          onMessage?.(data);
        }
      } catch {
        debug && console.warn("⚠️ WS non-JSON:", event.data);
      }
    };

    ws.onclose = () => {
      debug && console.log("❌ WS closed:", roomCode);
      cleanup(false);

      if (!manuallyClosed && shouldReconnect && !destroyed) {
        scheduleReconnect();
      }
    };

    ws.onerror = (err) => {
      debug && console.error("❌ WS error:", err);
    };
  };

  /* =========================
     RECONNECT
  ========================= */
  const scheduleReconnect = () => {
    if (reconnectTimer || destroyed || !shouldReconnect) return;

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      ws = null;
      connect();
    }, reconnectDelay);
  };

  /* =========================
     HEARTBEAT
  ========================= */
  const startHeartbeat = () => {
    stopHeartbeat();

    heartbeatTimer = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        try {
          ws.send("ping"); // backend update last_seen_at
        } catch {}
      }
    }, heartbeatInterval);
  };

  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  /* =========================
     CLEANUP (internal)
  ========================= */
  const cleanup = (closeSocket = true) => {
    stopHeartbeat();

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (closeSocket && ws) {
      try {
        ws.close();
      } catch {}
    }

    ws = null;
    connecting = false;
  };

  /* =========================
     PUBLIC API
  ========================= */
  connect();

  return {
    send(data) {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    },

    close() {
      destroyed = true;
      shouldReconnect = false;
      manuallyClosed = true;
      cleanup(true);
    },

    reconnect() {
      destroyed = false;
      shouldReconnect = true;
      manuallyClosed = false;
      cleanup(true);
      connect();
    },

    get ready() {
      return ws?.readyState === WebSocket.OPEN;
    },
  };
}
