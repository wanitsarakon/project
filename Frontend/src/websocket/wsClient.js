/**
 * createRoomSocket (TEAM / SOLO READY)
 *
 * ✅ reconnect-safe
 * ✅ StrictMode-safe
 * ✅ heartbeat-safe
 * ✅ no duplicate JOIN
 * ✅ backend-aligned (signal-based)
 */

export function createRoomSocket(roomCode, onMessage, options = {}) {
  const {
    playerId = null,
    mode = "solo", // solo | team
    urlBase =
      window.location.protocol === "https:"
        ? `wss://${window.location.host}`
        : "ws://localhost:8080",
    reconnectDelay = 2000,
    heartbeatInterval = 30000,
    debug = false,

    // OPTIONAL CALLBACKS
    onOpen,
    onTeamUpdate,   // () => void   (signal only)
    onScoreUpdate,  // ({ player_id, score })
  } = options;

  /* =========================
     INTERNAL STATE
  ========================= */
  let ws = null;
  let heartbeatTimer = null;
  let reconnectTimer = null;

  let connecting = false;
  let destroyed = false;

  // StrictMode / race guard
  let instanceId = 0;
  let activeInstanceId = 0;

  // prevent duplicate JOIN
  let joined = false;

  /* =========================
     CONNECT
  ========================= */
  const connect = () => {
    if (connecting || destroyed) return;

    connecting = true;
    instanceId += 1;

    const myInstanceId = instanceId;
    activeInstanceId = myInstanceId;
    joined = false;

    let url = `${urlBase}/ws/${roomCode}`;
    if (playerId != null) {
      url += `?player_id=${encodeURIComponent(playerId)}`;
    }

    debug && console.log("🔌 WS connecting:", url);

    let socket;
    try {
      socket = new WebSocket(url);
    } catch {
      connecting = false;
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

      // JOIN once per connection
      if (!joined) {
        safeSend({
          type: "join",
          player_id: playerId,
          mode, // solo | team
        });
        joined = true;
      }

      onOpen?.();
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

      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      if (!data?.type) return;

      debug && console.log("📩 WS message:", data);

      switch (data.type) {
        /* =====================
           👥 TEAM UPDATE (SIGNAL)
        ===================== */
        case "TEAM_UPDATE":
        case "team_update":
          // ❗ backend ส่งมาเป็น signal เท่านั้น
          onTeamUpdate?.();
          break;

        /* =====================
           🏆 SCORE UPDATE
        ===================== */
        case "SCORE_UPDATE":
        case "score_update":
          onScoreUpdate?.(data);
          break;

        /* =====================
           📦 DEFAULT
        ===================== */
        default:
          onMessage?.(data);
      }
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

    socket.onerror = () => {
      // let onclose handle reconnect
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
     HEARTBEAT
  ========================= */
  const startHeartbeat = (fromInstance) => {
    stopHeartbeat();

    heartbeatTimer = setInterval(() => {
      if (destroyed || fromInstance !== activeInstanceId) {
        stopHeartbeat();
        return;
      }

      if (ws?.readyState === WebSocket.OPEN) {
        try {
          ws.send("ping");
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
     SAFE SEND
  ========================= */
  const safeSend = (data) => {
    if (destroyed || ws?.readyState !== WebSocket.OPEN) return;

    try {
      ws.send(JSON.stringify(data));
    } catch {}
  };

  /* =========================
     CLEANUP
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
    send: safeSend,

    close() {
      if (destroyed) return;
      destroyed = true;
      activeInstanceId = -1;
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
