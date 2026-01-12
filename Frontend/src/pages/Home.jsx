import React, { useCallback, useEffect, useRef, useState } from "react";

export default function Home({ onSelect }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState(null); // "host" | "player"
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);

  /* =========================
     Lifecycle
  ========================= */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* =========================
     Helpers
  ========================= */
  const normalizeName = (value) =>
    value.replace(/\s+/g, " ").trim();

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
      // ส่งให้ parent ควบคุม flow ต่อ (API / route / WS)
      await onSelect(role, normalizedName);
    } finally {
      setLoading(false);
    }
  }, [loading, name, role, onSelect]);

  /* =========================
     Keyboard
  ========================= */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter") {
        handleConfirm();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleConfirm]);

  /* =========================
     UI
  ========================= */
  return (
    <div className="home-root">
      <div className="panel">
        <h1 className="title">🎪 เกมงานวัด</h1>

        {/* Name */}
        <input
          ref={inputRef}
          className="name-input"
          placeholder="ชื่อของคุณ"
          value={name}
          maxLength={20}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />

        {/* Role selection */}
        <div className="role-row">
          <button
            type="button"
            className={`role-btn ${role === "host" ? "active" : ""}`}
            onClick={() => setRole("host")}
            disabled={loading}
          >
            🧑‍💼 Host
          </button>

          <button
            type="button"
            className={`role-btn ${role === "player" ? "active" : ""}`}
            onClick={() => setRole("player")}
            disabled={loading}
          >
            🎮 Player
          </button>
        </div>

        {/* Hint */}
        {!role && !loading && (
          <p className="hint-text">
            👆 กรุณาเลือกบทบาทก่อน
          </p>
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
