import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createRoomSocket } from "../websocket/wsClient";
import {
  PLAYER_NAME_ALLOWED_MESSAGE,
  PLAYER_NAME_MAX_LENGTH,
  hasUnsupportedPlayerNameChars,
  normalizePlayerName,
  sanitizePlayerNameInput,
  validatePlayerName,
} from "../utils/playerName";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:18082";
const DUPLICATE_NAME_MESSAGE = "มีชื่อซ้ำในห้องนี้ กรุณาเปลี่ยนชื่อใหม่";

function createEmptyDuplicateDialog() {
  return {
    open: false,
    room: null,
    draft: "",
    error: "",
  };
}

export default function RoomList({
  player,
  onJoin,
  onBack,
}) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningRoomCode, setJoiningRoomCode] = useState(null);
  const [error, setError] = useState(null);
  const [roomSearch, setRoomSearch] = useState("");
  const [playerName, setPlayerName] = useState(() => normalizePlayerName(player?.name ?? ""));
  const [duplicateDialog, setDuplicateDialog] = useState(createEmptyDuplicateDialog);

  const wsRef = useRef(null);
  const mountedRef = useRef(false);
  const joiningRef = useRef(false);
  const duplicateInputRef = useRef(null);

  const safeSet = useCallback((fn) => {
    if (mountedRef.current) fn();
  }, []);

  const getComparableName = useCallback(
    (value = "") => normalizePlayerName(value).toLowerCase(),
    [],
  );

  const loadRooms = useCallback(async () => {
    safeSet(() => {
      setLoading(true);
      setError(null);
    });

    try {
      const res = await fetch(`${API_BASE}/rooms`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      safeSet(() => setRooms(Array.isArray(data) ? data : []));
    } catch (err) {
      console.error("loadRooms error:", err);
      safeSet(() => setError("โหลดรายการห้องไม่สำเร็จ"));
    } finally {
      safeSet(() => setLoading(false));
    }
  }, [safeSet]);

  useEffect(() => {
    mountedRef.current = true;
    loadRooms();

    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [loadRooms]);

  useEffect(() => {
    setPlayerName(normalizePlayerName(player?.name ?? ""));
  }, [player?.name]);

  useEffect(() => {
    if (!duplicateDialog.open) return undefined;

    const timerId = window.setTimeout(() => duplicateInputRef.current?.focus(), 60);
    return () => window.clearTimeout(timerId);
  }, [duplicateDialog.open]);

  useEffect(() => {
    if (!mountedRef.current) return undefined;

    wsRef.current?.close();
    wsRef.current = createRoomSocket(
      "global",
      (msg) => {
        if (msg?.type === "room_update" && mountedRef.current) {
          loadRooms();
        }
      },
      { debug: false },
    );

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [loadRooms]);

  const openDuplicateDialog = useCallback((room, attemptedName, message = DUPLICATE_NAME_MESSAGE) => {
    safeSet(() =>
      setDuplicateDialog({
        open: true,
        room,
        draft: attemptedName,
        error: message,
      }),
    );
  }, [safeSet]);

  const roomHasDuplicateName = useCallback(async (roomCode, requestedName) => {
    try {
      const res = await fetch(`${API_BASE}/rooms/${roomCode}`);
      if (!res.ok) {
        return false;
      }

      const data = await res.json().catch(() => ({}));
      const players = Array.isArray(data?.players) ? data.players : [];
      const requestedNameKey = getComparableName(requestedName);

      return players.some((entry) => getComparableName(entry?.name) === requestedNameKey);
    } catch (err) {
      console.error("roomHasDuplicateName error:", err);
      return false;
    }
  }, [getComparableName]);

  const joinRoom = useCallback(async (room, requestedName = playerName) => {
    if (joiningRef.current || !mountedRef.current) return;

    if (room.status !== "waiting") {
      alert("ห้องนี้เริ่มเกมไปแล้ว");
      return;
    }

    if (room.player_count >= room.max_players) {
      alert("ห้องนี้เต็มแล้ว");
      return;
    }

    const validation = validatePlayerName(requestedName);
    if (!validation.valid) {
      const nextDraft = sanitizePlayerNameInput(requestedName);

      if (duplicateDialog.open) {
        safeSet(() =>
          setDuplicateDialog((prev) => ({
            ...prev,
            draft: nextDraft,
            error: validation.error,
          })),
        );
      } else {
        alert(validation.error);
      }
      return;
    }

    const cleanName = validation.normalizedName;

    if (await roomHasDuplicateName(room.code, cleanName)) {
      openDuplicateDialog(room, cleanName, DUPLICATE_NAME_MESSAGE);
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
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409 || data?.code === "duplicate_name") {
          openDuplicateDialog(room, cleanName, DUPLICATE_NAME_MESSAGE);
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
      });

      onJoin?.(room.code, {
        id: backendPlayer.id,
        name: backendPlayer.name,
        isHost: backendPlayer.is_host === true,
      });
    } catch (err) {
      console.error("joinRoom error:", err);
      alert(`เข้าห้องไม่สำเร็จ\n${err?.message || ""}`);
    } finally {
      joiningRef.current = false;
      safeSet(() => setJoiningRoomCode(null));
    }
  }, [duplicateDialog.open, onJoin, openDuplicateDialog, playerName, roomHasDuplicateName, safeSet]);

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

  const filteredRooms = useMemo(() => {
    const query = roomSearch.trim();
    if (!query) return rooms;
    return rooms.filter((room) => String(room?.code ?? "").includes(query));
  }, [roomSearch, rooms]);

  return (
    <div className="home-root home-root-entry">
      <section className="festival-page-shell">
        <div className="landing-string-light string-top" />
        <div className="landing-string-light string-mid" />

        <div className="festival-page-card">
          <div className="festival-page-kicker">Room List</div>
          <h1 className="festival-page-title">เลือกห้องแข่งขัน</h1>
          <p className="festival-page-subtitle">
            ผู้เล่น: <strong>{playerName || "-"}</strong>
          </p>
          <div className="festival-input-note">
            {PLAYER_NAME_ALLOWED_MESSAGE}
          </div>

          <div className="festival-room-toolbar">
            <div className="festival-room-search">
              <input
                className="festival-room-search-input"
                type="text"
                inputMode="numeric"
                placeholder="ค้นหาด้วยเลขห้อง"
                value={roomSearch}
                onChange={(event) => setRoomSearch(event.target.value.replace(/[^\d]/g, ""))}
              />
            </div>

            <button type="button" className="festival-mini-btn add" onClick={loadRooms} disabled={loading}>
              รีเฟรชรายการห้อง
            </button>
          </div>

          {loading && <div className="festival-helper-text">กำลังโหลดรายการห้อง...</div>}
          {error && <div className="festival-error-box">{error}</div>}
          {!loading && !error && rooms.length === 0 && (
            <div className="festival-helper-text">ยังไม่มีห้องที่เปิดรออยู่</div>
          )}
          {!loading && !error && rooms.length > 0 && filteredRooms.length === 0 && (
            <div className="festival-helper-text">ไม่พบห้องที่ตรงกับเลขห้องนี้</div>
          )}

          <div className="festival-room-list">
            {filteredRooms.map((room) => {
              const started = room.status !== "waiting";
              const full = room.player_count >= room.max_players;
              const joiningThis = joiningRoomCode === room.code;
              const disabled = started || full || joiningRoomCode !== null;

              return (
                <div key={room.code} className={`festival-room-card ${disabled ? "disabled" : ""}`}>
                  <div className="festival-room-head">
                    <strong>{room.name || "Thai Festival Room"}</strong>
                    <span>{room.mode === "team" ? "ทีม" : "เดี่ยว"}</span>
                  </div>

                  <div className="festival-room-meta">รหัสห้อง: {room.code}</div>
                  <div className="festival-room-meta">
                    ผู้เล่น {room.player_count} / {room.max_players}
                  </div>

                  <button
                    type="button"
                    className="festival-primary-btn small"
                    disabled={disabled}
                    onClick={() => joinRoom(room)}
                  >
                    {joiningThis
                      ? "กำลังเข้าห้อง..."
                      : started
                        ? "เริ่มเกมแล้ว"
                        : full
                          ? "ห้องเต็ม"
                          : "เข้าร่วม"}
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="festival-secondary-link"
            onClick={onBack}
            disabled={joiningRoomCode !== null}
          >
            ← กลับหน้าแรก
          </button>
        </div>
      </section>

      {duplicateDialog.open && (
        <div className="festival-modal-backdrop">
          <form className="festival-modal-card" onSubmit={submitDuplicateName}>
            <div className="festival-page-kicker">Duplicate Name</div>
            <h2 className="festival-modal-title">มีชื่อซ้ำในห้อง</h2>
            <p className="festival-modal-copy">
              ห้อง {duplicateDialog.room?.code} มีผู้ใช้ชื่อนี้อยู่แล้ว กรุณาเปลี่ยนชื่อใหม่ก่อนเข้าร่วม
            </p>

            <div className="festival-input-wrap festival-modal-input-wrap">
              <input
                ref={duplicateInputRef}
                className="festival-name-input"
                placeholder="กรอกชื่อใหม่"
                value={duplicateDialog.draft}
                maxLength={PLAYER_NAME_MAX_LENGTH}
                disabled={joiningRoomCode !== null}
                onChange={handleDuplicateNameChange}
              />
            </div>

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
    </div>
  );
}
