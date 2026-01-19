/**
 * createRoomSocket (ULTRA HARDENED – PRODUCTION FINAL++)
 *
 * ✅ reconnect-safe
 * ✅ heartbeat-safe (Gin + Gorilla WS)
 * ✅ React / Phaser unmount-safe
 * ✅ StrictMode-safe
 * ✅ race-condition proof
 * ✅ no zombie socket
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

  /* =========================
     INTERNAL STATE
  ========================= */
  let ws = null;
  let heartbeatTimer = null;
  let reconnectTimer = null;

  let connecting = false;
  let destroyed = false;

  // 🔐 instance guard (StrictMode / race safe)
  let instanceId = 0;
  let activeInstanceId = 0;

  /* =========================
     CONNECT
  ========================= */
  const connect = () => {
    if (connecting || destroyed) return;

    connecting = true;
    instanceId += 1;

    const myInstanceId = instanceId;
    activeInstanceId = myInstanceId;

    let url = `${urlBase}/ws/${roomCode}`;
    if (playerId != null) {
      url += `?player_id=${encodeURIComponent(playerId)}`;
    }

    debug && console.log("🔌 WS connecting:", url);

    let socket;
    try {
      socket = new WebSocket(url);
    } catch (err) {
      connecting = false;
      debug && console.error("❌ WS create failed:", err);
      scheduleReconnect(myInstanceId);
      return;
    }

    ws = socket;

    /* ---------- OPEN ---------- */
    socket.onopen = () => {
      if (destroyed || myInstanceId !== activeInstanceId) {
        safeClose(socket);
        return;
      }

      connecting = false;
      debug && console.log("✅ WS connected:", roomCode);
      startHeartbeat(myInstanceId);
    };

    /* ---------- MESSAGE ---------- */
    socket.onmessage = (event) => {
      if (
        destroyed ||
        myInstanceId !== activeInstanceId ||
        typeof event?.data !== "string"
      )
        return;

      try {
        const data = JSON.parse(event.data);
        if (data?.type) {
          onMessage?.(data);
        }
      } catch {
        // ignore non-JSON (ping frame from backend)
      }
    };

    /* ---------- ERROR ---------- */
    socket.onerror = (err) => {
      debug && console.error("❌ WS error:", err);
      // let onclose handle reconnect
    };

    /* ---------- CLOSE ---------- */
    socket.onclose = () => {
      if (myInstanceId !== activeInstanceId) return;

      debug && console.log("❌ WS closed:", roomCode);
      cleanup(false);

      if (!destroyed) {
        scheduleReconnect(myInstanceId);
      }
    };
  };

  /* =========================
     RECONNECT
  ========================= */
  const scheduleReconnect = (fromInstance) => {
    if (
      destroyed ||
      reconnectTimer ||
      fromInstance !== activeInstanceId
    )
      return;

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;

      if (!destroyed && fromInstance === activeInstanceId) {
        connect();
      }
    }, reconnectDelay);
  };

  /* =========================
     HEARTBEAT (TEXT PING)
     - backend updates last_seen_at
  ========================= */
  const startHeartbeat = (fromInstance) => {
    stopHeartbeat();

    heartbeatTimer = setInterval(() => {
      if (
        destroyed ||
        fromInstance !== activeInstanceId
      ) {
        stopHeartbeat();
        return;
      }

      if (ws?.readyState === WebSocket.OPEN) {
        try {
          ws.send("ping"); // backend readPump handles this
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
     CLEANUP (HARD)
  ========================= */
  const cleanup = (closeSocket = true) => {
    stopHeartbeat();

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    if (closeSocket && ws) {
      safeClose(ws);
    }

    ws = null;
    connecting = false;
  };

  const safeClose = (socket) => {
    try {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      socket.close();
    } catch {}
  };

  /* =========================
     INIT
  ========================= */
  connect();

  /* =========================
     PUBLIC API
  ========================= */
  return {
    send(data) {
      if (
        destroyed ||
        ws?.readyState !== WebSocket.OPEN
      )
        return;

      try {
        ws.send(JSON.stringify(data));
      } catch {}
    },

    close() {
      if (destroyed) return;
      destroyed = true;
      activeInstanceId = -1; // 🔒 block reconnect forever
      cleanup(true);
    },

    reconnect() {
      if (destroyed) return;
      cleanup(true);
      connect();
    },

    get ready() {
      return ws?.readyState === WebSocket.OPEN;
    },
  };
}
