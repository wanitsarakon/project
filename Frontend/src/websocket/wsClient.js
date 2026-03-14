export function createRoomSocket(roomCode, onMessage, options = {}) {

  const apiBase =
    import.meta.env.VITE_API_URL || null;

  const derivedUrlBase = (() => {
    if (!apiBase) {
      return window.location.protocol === "https:"
        ? `wss://${window.location.host}`
        : "ws://localhost:8080";
    }

    try {
      const parsed = new URL(apiBase, window.location.origin);
      const protocol =
        parsed.protocol === "https:" ? "wss:" : "ws:";
      return `${protocol}//${parsed.host}`;
    } catch {
      return window.location.protocol === "https:"
        ? `wss://${window.location.host}`
        : "ws://localhost:8080";
    }
  })();

  const {
    playerId = null,
    mode = "solo",

    urlBase = derivedUrlBase,

    reconnectDelay = 1000,
    heartbeatInterval = 15000,
    debug = false,

    onOpen,
    onTeamUpdate,
    onScoreUpdate,

  } = options;

  let ws = null;
  let heartbeatTimer = null;
  let reconnectTimer = null;

  let connecting = false;
  let destroyed = false;

  let instanceId = 0;
  let activeInstanceId = 0;

  let joined = false;
  const listeners = new Set();

  if (typeof onMessage === "function") {
    listeners.add(onMessage);
  }

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

      if (!joined) {

        safeSend({
          type: "join",
          player_id: playerId,
          mode,
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
      ) return;

      let data;

      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      if (!data?.type) return;

      debug && console.log("📩 WS message:", data);

      /* TEAM UPDATE */

      if (
        data.type === "TEAM_UPDATE" ||
        data.type === "team_update"
      ) {
        onTeamUpdate?.();
      }

      /* SCORE UPDATE */

      if (
        data.type === "SCORE_UPDATE" ||
        data.type === "score_update"
      ) {
        if (
          typeof data.player_id !== "undefined" &&
          typeof data.score === "number"
        ) {
          onScoreUpdate?.(data);
        }
      }

      /* ALWAYS PASS TO DEFAULT HANDLER */

      listeners.forEach((listener) => {
        try {
          listener?.(data);
        } catch (err) {
          console.error("WS listener error:", err);
        }
      });

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
      /* handled by onclose */
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
    ) return;

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
          ws.send(JSON.stringify({ type: "ping" }));
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

    if (
      destroyed ||
      ws?.readyState !== WebSocket.OPEN
    ) return;

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

  /* INIT */

  connect();

  /* =========================
     PUBLIC API
  ========================= */

  return {

    send: safeSend,

    subscribe(listener) {

      if (typeof listener !== "function") {
        return () => {};
      }

      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };

    },

    unsubscribe(listener) {
      listeners.delete(listener);
    },

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
