import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { createRoomSocket } from "../websocket/wsClient";

<<<<<<< Updated upstream
const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8080";
=======
const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:18082";
const DUPLICATE_NAME_MESSAGE = "มีชื่อซ้ำในห้องนี้ กรุณาเปลี่ยนชื่อใหม่";
const PRIVATE_ROOM_REQUIRED_MESSAGE = "ห้องนี้ตั้งรหัสไว้ กรุณากรอกรหัสห้องก่อนเข้าร่วม";
const INVALID_ROOM_PASSWORD_MESSAGE = "รหัสห้องไม่ถูกต้อง กรุณาลองอีกครั้ง";

function createEmptyDuplicateDialog() {
  return {
    open: false,
    room: null,
    draft: "",
    error: "",
  };
}
>>>>>>> Stashed changes

function createEmptyPasswordDialog() {
  return {
    open: false,
    room: null,
    requestedName: "",
    draft: "",
    error: "",
  };
}

export default function RoomList({
  player,
  onJoin,
  onBack,
}) {
  /* =========================
     STATE
  ========================= */
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningRoomCode, setJoiningRoomCode] =
    useState(null);
  const [error, setError] = useState(null);
<<<<<<< Updated upstream
=======
  const [roomSearch, setRoomSearch] = useState("");
  const [playerName, setPlayerName] = useState(() => normalizePlayerName(player?.name ?? ""));
  const [duplicateDialog, setDuplicateDialog] = useState(createEmptyDuplicateDialog);
  const [passwordDialog, setPasswordDialog] = useState(createEmptyPasswordDialog);
>>>>>>> Stashed changes

  /* =========================
     REFS (GUARDS)
  ========================= */
  const wsRef = useRef(null);
  const mountedRef = useRef(false);
  const joiningRef = useRef(false);
<<<<<<< Updated upstream

  /* =========================
     HELPERS
  ========================= */
  const normalizeName = useCallback(
    (v = "") =>
      String(v).replace(/\s+/g, " ").trim(),
    []
  );
=======
  const duplicateInputRef = useRef(null);
  const passwordInputRef = useRef(null);
>>>>>>> Stashed changes

  const safeSet = useCallback((fn) => {
    if (mountedRef.current) fn();
  }, []);

<<<<<<< Updated upstream
  /* =========================
     LOAD ROOMS (REST)
  ========================= */
=======
  const getComparableName = useCallback(
    (value = "") => normalizePlayerName(value).toLowerCase(),
    [],
  );
  const normalizeRoomPassword = useCallback((value = "") => String(value).trim(), []);

>>>>>>> Stashed changes
  const loadRooms = useCallback(async () => {
    safeSet(() => {
      setLoading(true);
      setError(null);
    });

    try {
      const res = await fetch(
        `${API_BASE}/rooms`
      );
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      safeSet(() =>
        setRooms(Array.isArray(data) ? data : [])
      );
    } catch (err) {
      console.error("❌ loadRooms error:", err);
      safeSet(() =>
        setError("❌ โหลดรายการห้องไม่สำเร็จ")
      );
    } finally {
      safeSet(() => setLoading(false));
    }
  }, [safeSet]);

  /* =========================
     MOUNT / UNMOUNT
  ========================= */
  useEffect(() => {
    mountedRef.current = true;
    loadRooms();

    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [loadRooms]);

  /* =========================
     GLOBAL WS (ROOM UPDATE)
  ========================= */
  useEffect(() => {
<<<<<<< Updated upstream
    if (!mountedRef.current) return;
=======
    setPlayerName(normalizePlayerName(player?.name ?? ""));
  }, [player?.name]);

  useEffect(() => {
    if (!duplicateDialog.open) return undefined;

    const timerId = window.setTimeout(() => duplicateInputRef.current?.focus(), 60);
    return () => window.clearTimeout(timerId);
  }, [duplicateDialog.open]);

  useEffect(() => {
    if (!passwordDialog.open) return undefined;

    const timerId = window.setTimeout(() => passwordInputRef.current?.focus(), 60);
    return () => window.clearTimeout(timerId);
  }, [passwordDialog.open]);

  useEffect(() => {
    if (!mountedRef.current) return undefined;
>>>>>>> Stashed changes

    wsRef.current?.close();
    wsRef.current = null;

    wsRef.current = createRoomSocket(
      "global",
      (msg) => {
        if (
          msg?.type === "room_update" &&
          mountedRef.current
        ) {
          loadRooms();
        }
      },
      { debug: false }
    );

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [loadRooms]);

<<<<<<< Updated upstream
  /* =========================
     JOIN ROOM (FIXED)
  ========================= */
  const joinRoom = useCallback(
    async (room) => {
      if (
        joiningRef.current ||
        !mountedRef.current
      )
        return;
=======
  const openDuplicateDialog = useCallback((room, attemptedName, message = DUPLICATE_NAME_MESSAGE) => {
    safeSet(() => {
      setPasswordDialog(createEmptyPasswordDialog());
      setDuplicateDialog({
        open: true,
        room,
        draft: attemptedName,
        error: message,
      });
    });
  }, [safeSet]);

  const openPasswordDialog = useCallback((
    room,
    requestedName,
    passwordDraft = "",
    message = PRIVATE_ROOM_REQUIRED_MESSAGE,
  ) => {
    safeSet(() => {
      setDuplicateDialog(createEmptyDuplicateDialog());
      setPasswordDialog({
        open: true,
        room,
        requestedName,
        draft: passwordDraft,
        error: message,
      });
    });
  }, [safeSet]);
>>>>>>> Stashed changes

      if (room.status !== "waiting") {
        alert("⛔ เกมเริ่มไปแล้ว");
        return;
      }

      if (room.player_count >= room.max_players) {
        alert("👥 ห้องเต็มแล้ว");
        return;
      }

      const cleanName = normalizeName(
        player?.name
      );
      if (!cleanName) {
        alert("❌ ชื่อผู้เล่นไม่ถูกต้อง");
        return;
      }

<<<<<<< Updated upstream
      joiningRef.current = true;
      safeSet(() => setJoiningRoomCode(room.code));
=======
  const joinRoom = useCallback(async (room, requestedName = playerName, providedPassword = "") => {
    if (joiningRef.current || !mountedRef.current) return;
>>>>>>> Stashed changes

      try {
        const res = await fetch(
          `${API_BASE}/rooms/join`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              room_code: room.code,
              name: cleanName,
            }),
          }
        );

<<<<<<< Updated upstream
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data?.error || "Join failed"
          );
        }

        // ✅ FIX สำคัญ: ใช้ player จาก backend ตรง ๆ
        const backendPlayer = data.player;
        if (!backendPlayer?.id) {
          throw new Error(
            "Invalid player data from server"
          );
        }

        onJoin?.(room.code, {
          id: backendPlayer.id,
          name: backendPlayer.name,
          isHost:
            backendPlayer.is_host === true,
        });
      } catch (err) {
        console.error("❌ joinRoom error:", err);
        alert(
          "เข้าห้องไม่สำเร็จ\n" +
            (err?.message || "")
        );
      } finally {
        joiningRef.current = false;
        safeSet(() =>
          setJoiningRoomCode(null)
        );
      }
    },
    [player, normalizeName, onJoin, safeSet]
  );
=======
    const cleanName = validation.normalizedName;
    const cleanPassword = normalizeRoomPassword(providedPassword);

    const { hasDuplicate, roomData } = await roomHasDuplicateName(room.code, cleanName);

    if (hasDuplicate) {
      openDuplicateDialog(room, cleanName, DUPLICATE_NAME_MESSAGE);
      return;
    }

    const roomIsPrivate = room?.is_private === true || roomData?.is_private === true;
    if (roomIsPrivate && !cleanPassword) {
      openPasswordDialog(room, cleanName, "", PRIVATE_ROOM_REQUIRED_MESSAGE);
      return;
    }

    joiningRef.current = true;
    safeSet(() => setJoiningRoomCode(room.code));

    try {
      const res = await fetch(`${API_BASE}/rooms/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_code: room.code,
          name: cleanName,
          room_password: roomIsPrivate ? cleanPassword : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409 || data?.code === "duplicate_name") {
          openDuplicateDialog(room, cleanName, DUPLICATE_NAME_MESSAGE);
          return;
        }

        if (res.status === 403 && (data?.code === "password_required" || data?.code === "invalid_room_password")) {
          openPasswordDialog(
            room,
            cleanName,
            cleanPassword,
            data?.code === "invalid_room_password"
              ? INVALID_ROOM_PASSWORD_MESSAGE
              : PRIVATE_ROOM_REQUIRED_MESSAGE,
          );
          return;
        }

        throw new Error(data?.error || "join failed");
      }

      const backendPlayer = data.player;
      if (!backendPlayer?.id) {
        throw new Error("invalid player data");
      }

      safeSet(() => {
        setPlayerName(cleanName);
        setDuplicateDialog(createEmptyDuplicateDialog());
        setPasswordDialog(createEmptyPasswordDialog());
      });

      onJoin?.(
        room.code,
        {
          id: backendPlayer.id,
          name: backendPlayer.name,
          isHost: backendPlayer.is_host === true,
        },
        {
          selectedBooths: Array.isArray(roomData?.selected_booths)
            ? roomData.selected_booths
            : [],
        },
      );
    } catch (err) {
      console.error("joinRoom error:", err);
      alert(`เข้าห้องไม่สำเร็จ\n${err?.message || ""}`);
    } finally {
      joiningRef.current = false;
      safeSet(() => setJoiningRoomCode(null));
    }
  }, [
    duplicateDialog.open,
    normalizeRoomPassword,
    onJoin,
    openDuplicateDialog,
    openPasswordDialog,
    playerName,
    roomHasDuplicateName,
    safeSet,
  ]);

  const handleDuplicateNameChange = useCallback((event) => {
    const rawValue = event.target.value;
    const nextDraft = sanitizePlayerNameInput(rawValue);

    setDuplicateDialog((prev) => ({
      ...prev,
      draft: nextDraft,
      error: hasUnsupportedPlayerNameChars(rawValue)
        ? PLAYER_NAME_ALLOWED_MESSAGE
        : "",
    }));
  }, []);

  const submitDuplicateName = useCallback((event) => {
    event.preventDefault();

    if (!duplicateDialog.room) return;
    joinRoom(duplicateDialog.room, duplicateDialog.draft);
  }, [duplicateDialog.draft, duplicateDialog.room, joinRoom]);

  const handlePasswordChange = useCallback((event) => {
    setPasswordDialog((prev) => ({
      ...prev,
      draft: event.target.value,
      error: "",
    }));
  }, []);

  const submitPassword = useCallback((event) => {
    event.preventDefault();

    if (!passwordDialog.room) return;
    joinRoom(
      passwordDialog.room,
      passwordDialog.requestedName || playerName,
      passwordDialog.draft,
    );
  }, [joinRoom, passwordDialog.draft, passwordDialog.requestedName, passwordDialog.room, playerName]);

  const filteredRooms = useMemo(() => {
    const query = roomSearch.trim();
    if (!query) return rooms;
    return rooms.filter((room) => String(room?.code ?? "").includes(query));
  }, [roomSearch, rooms]);
>>>>>>> Stashed changes

  /* =========================
     UI
  ========================= */
  return (
    <div className="home-root">
      <div className="panel">
        <h2>🎮 เลือกห้อง</h2>

        <p>
          ผู้เล่น: <b>{player.name}</b>
        </p>

        <button
          onClick={loadRooms}
          disabled={loading}
        >
          🔄 รีเฟรชรายการห้อง
        </button>

        {loading && <p>⏳ กำลังโหลด...</p>}
        {error && (
          <p style={{ color: "red" }}>
            {error}
          </p>
        )}

        {!loading &&
          !error &&
          rooms.length === 0 && (
            <p>😴 ยังไม่มีห้อง</p>
          )}

        {!loading &&
          rooms.map((room) => {
            const started =
              room.status !== "waiting";
            const full =
              room.player_count >=
              room.max_players;
            const joiningThis =
              joiningRoomCode === room.code;

<<<<<<< Updated upstream
            const disabled =
              started ||
              full ||
              joiningRoomCode !== null;

            return (
              <div
                key={room.code}
                className="room-card"
                style={{
                  opacity: disabled ? 0.6 : 1,
                }}
              >
                <b>
                  🏠{" "}
                  {room.name ||
                    "Thai Festival Room"}
                </b>
=======
              return (
                <div key={room.code} className={`festival-room-card ${disabled ? "disabled" : ""}`}>
                  <div className="festival-room-head">
                    <strong>{room.name || "Thai Festival Room"}</strong>
                    <div className="festival-room-labels">
                      <span>{room.mode === "team" ? "ทีม" : "เดี่ยว"}</span>
                      {room.is_private && (
                        <span className="festival-room-badge">Private</span>
                      )}
                    </div>
                  </div>

                  <div className="festival-room-meta">รหัสห้อง: {room.code}</div>
                  <div className="festival-room-meta">
                    ผู้เล่น {room.player_count} / {room.max_players}
                  </div>
                  <div className="festival-room-meta">
                    {room.is_private ? "ต้องใส่รหัสห้องก่อนเข้า" : "ห้องสาธารณะ"}
                  </div>
>>>>>>> Stashed changes

                <div>รหัส: {room.code}</div>

                <div>
                  👥 {room.player_count} /{" "}
                  {room.max_players}
                </div>

                {started && (
                  <div
                    style={{
                      color: "#c0392b",
                    }}
                  >
                    ⛔ เกมเริ่มแล้ว
                  </div>
                )}

                {full && !started && (
                  <div
                    style={{
                      color: "#e67e22",
                    }}
                  >
                    👥 ห้องเต็ม
                  </div>
                )}

                <button
                  disabled={disabled}
                  onClick={() =>
                    joinRoom(room)
                  }
                >
                  {joiningThis
                    ? "⏳ กำลังเข้า..."
                    : started
                    ? "เกมเริ่มแล้ว"
                    : full
                    ? "ห้องเต็ม"
                    : "เข้าร่วม"}
                </button>
              </div>
            );
          })}

<<<<<<< Updated upstream
        <button
          style={{ marginTop: 16 }}
          onClick={onBack}
          disabled={
            joiningRoomCode !== null
          }
        >
          ← กลับหน้าแรก
        </button>
      </div>
=======
            <div className="festival-input-note">
              {PLAYER_NAME_ALLOWED_MESSAGE}
            </div>

            {duplicateDialog.error && (
              <div className="festival-error-box festival-modal-error">{duplicateDialog.error}</div>
            )}

            <div className="festival-form-actions row festival-modal-actions">
              <button
                type="submit"
                className="festival-primary-btn small"
                disabled={joiningRoomCode !== null}
              >
                {joiningRoomCode !== null ? "กำลังเข้าห้อง..." : "เปลี่ยนชื่อและเข้าห้อง"}
              </button>

              <button
                type="button"
                className="festival-mini-btn"
                onClick={() => setDuplicateDialog(createEmptyDuplicateDialog())}
                disabled={joiningRoomCode !== null}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}

      {passwordDialog.open && (
        <div className="festival-modal-backdrop">
          <form className="festival-modal-card" onSubmit={submitPassword}>
            <div className="festival-page-kicker">Private Room</div>
            <h2 className="festival-modal-title">กรอกรหัสห้อง</h2>
            <p className="festival-modal-copy">
              ห้อง {passwordDialog.room?.code} เป็นห้องส่วนตัว กรุณาใส่รหัสที่โฮสต์ตั้งไว้ก่อนเข้าร่วม
            </p>

            <div className="festival-input-wrap festival-modal-input-wrap">
              <input
                ref={passwordInputRef}
                className="festival-name-input"
                type="password"
                autoComplete="off"
                placeholder="กรอกรหัสห้อง"
                value={passwordDialog.draft}
                maxLength={64}
                disabled={joiningRoomCode !== null}
                onChange={handlePasswordChange}
              />
            </div>

            <div className="festival-input-note">
              ใช้รหัสเดียวกับที่โฮสต์ตั้งไว้ตอนสร้างห้อง
            </div>

            {passwordDialog.error && (
              <div className="festival-error-box festival-modal-error">{passwordDialog.error}</div>
            )}

            <div className="festival-form-actions row festival-modal-actions">
              <button
                type="submit"
                className="festival-primary-btn small"
                disabled={joiningRoomCode !== null}
              >
                {joiningRoomCode !== null ? "กำลังเข้าห้อง..." : "ยืนยันและเข้าห้อง"}
              </button>

              <button
                type="button"
                className="festival-mini-btn"
                onClick={() => setPasswordDialog(createEmptyPasswordDialog())}
                disabled={joiningRoomCode !== null}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}
>>>>>>> Stashed changes
    </div>
  );
}
