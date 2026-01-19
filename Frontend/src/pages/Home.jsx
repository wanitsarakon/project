import React, { useCallback, useEffect, useRef, useState } from "react";

export default function Home({ onSelect }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState(null); // "host" | "player"
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);
  const aliveRef = useRef(true);

  /* =========================
     Lifecycle
  ========================= */
  useEffect(() => {
    aliveRef.current = true;
    inputRef.current?.focus();

    return () => {
      aliveRef.current = false;
    };
  }, []);

  /* =========================
     Helpers
  ========================= */
  const normalizeName = useCallback((value) => {
    return value.replace(/\s+/g, " ").trim();
  }, []);

  /* =========================
     Submit
  ========================= */
  const handleConfirm = useCallback(async () => {
    if (loading) return;

    const normalizedName = normalizeName(name);

    if (!normalizedName) {
      alert("กรุณากรอกชื่อ");
      return;
    }

    if (normalizedName.length > 20) {
      alert("ชื่อยาวเกินไป (ไม่เกิน 20 ตัวอักษร)");
      return;
    }

    if (!role) {
      alert("กรุณาเลือก Host หรือ Player");
      return;
    }

    try {
      setLoading(true);
      await onSelect(role, normalizedName);
    } finally {
      if (aliveRef.current) {
        setLoading(false);
      }
    }
  }, [loading, name, role, onSelect, normalizeName]);

  /* =========================
     Keyboard
  ========================= */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Enter") return;
      if (loading) return;

      // ป้องกัน Enter จาก input ที่ไม่ใช่ชื่อ
      if (
        document.activeElement &&
        document.activeElement.tagName === "TEXTAREA"
      ) {
        return;
      }

      handleConfirm();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleConfirm, loading]);

  /* =========================
     UI
  ========================= */
  return (
    <div className="home-root">
      <div className="panel" role="main">
        <h1 className="title">🎪 เกมงานวัด</h1>

        {/* Name */}
        <input
          ref={inputRef}
          className="name-input"
          placeholder="ชื่อของคุณ"
          value={name}
          maxLength={20}
          disabled={loading}
          aria-label="ชื่อผู้เล่น"
          onChange={(e) => setName(e.target.value)}
        />

        {/* Role selection */}
        <div className="role-row">
          <button
            type="button"
            className={`role-btn ${role === "host" ? "active" : ""}`}
            onClick={() => !loading && setRole("host")}
            disabled={loading}
            aria-pressed={role === "host"}
          >
            🧑‍💼 Host
          </button>

          <button
            type="button"
            className={`role-btn ${role === "player" ? "active" : ""}`}
            onClick={() => !loading && setRole("player")}
            disabled={loading}
            aria-pressed={role === "player"}
          >
            🎮 Player
          </button>
        </div>

        {/* Hint */}
        {!role && !loading && (
          <p className="hint-text">👆 กรุณาเลือกบทบาทก่อน</p>
        )}

        {/* Confirm */}
        <button
          className="confirm-btn"
          onClick={handleConfirm}
          disabled={loading}
          style={{ marginTop: 16 }}
        >
          {loading ? "⏳ กำลังดำเนินการ..." : "ตกลง"}
        </button>
      </div>
    </div>
  );
}
