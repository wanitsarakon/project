import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  PLAYER_NAME_ALLOWED_MESSAGE,
  PLAYER_NAME_MAX_LENGTH,
  hasUnsupportedPlayerNameChars,
  sanitizePlayerNameInput,
  validatePlayerName,
} from "../utils/playerName";

export default function Home({ onSelect }) {
  const [step, setStep] = useState("landing");
  const [name, setName] = useState("");
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef(null);

  useEffect(() => {
    if (step !== "form") {
      setError("");
      return undefined;
    }

    const timerId = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(timerId);
  }, [step]);

  const handleNameChange = useCallback((event) => {
    const rawValue = event.target.value;
    setName(sanitizePlayerNameInput(rawValue));

    if (hasUnsupportedPlayerNameChars(rawValue)) {
      setError(PLAYER_NAME_ALLOWED_MESSAGE);
      return;
    }

    setError((current) => (current === PLAYER_NAME_ALLOWED_MESSAGE ? "" : current));
  }, []);

  const handleConfirm = useCallback(() => {
    if (loading) return;

    const validation = validatePlayerName(name);

    if (!validation.valid) {
      setError(validation.error);
      inputRef.current?.focus();
      return;
    }

    if (!role) {
      setError("กรุณาเลือก Host หรือ Player");
      return;
    }

    setLoading(true);
    setError("");
    onSelect(role, validation.normalizedName);
    setLoading(false);
  }, [loading, name, onSelect, role]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key !== "Enter") return;
      if (loading || step !== "form") return;
      handleConfirm();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleConfirm, loading, step]);

  return (
    <div
      className={`home-root ${step === "landing" ? "home-root-landing" : "home-root-entry"}`}
    >
      {step === "landing" ? (
        <section className="landing-stage landing-stage-minimal">
          <button
            type="button"
            className="enter-btn temple-enter-btn landing-start-only"
            onClick={() => setStep("form")}
          >
            <span className="enter-btn-arrow">▶</span>
            เริ่มเกม
          </button>
        </section>
      ) : (
        <section className="festival-form-shell">
          <div className="landing-string-light string-top" />
          <div className="landing-string-light string-mid" />

          <div className="festival-form-card" role="main">
            <h2 className="festival-form-title">กรอกชื่อ + เลือกบทบาท</h2>

            <div className="festival-input-wrap">
              <input
                ref={inputRef}
                className="festival-name-input"
                placeholder="กรอกชื่อ"
                value={name}
                maxLength={PLAYER_NAME_MAX_LENGTH}
                disabled={loading}
                onChange={handleNameChange}
              />
            </div>

            <div className="festival-input-note">
              {PLAYER_NAME_ALLOWED_MESSAGE}
            </div>

            {error && <div className="festival-error-box home-form-error">{error}</div>}

            <p className="festival-form-hint">
              เลือกบทบาทเพื่อกำหนดว่าจะเป็นผู้สร้างห้องหรือผู้เข้าแข่งขัน
            </p>

            <div className="festival-role-grid">
              <button
                type="button"
                className={`festival-role-card host-card ${role === "host" ? "active" : ""}`}
                onClick={() => {
                  setRole("host");
                  setError((current) =>
                    current === "กรุณาเลือก Host หรือ Player" ? "" : current,
                  );
                }}
                disabled={loading}
              >
                <span className="festival-role-copy">
                  <strong>เจ้าภาพแข่งขัน</strong>
                  <span>Host</span>
                </span>
              </button>

              <button
                type="button"
                className={`festival-role-card player-card ${role === "player" ? "active" : ""}`}
                onClick={() => {
                  setRole("player");
                  setError((current) =>
                    current === "กรุณาเลือก Host หรือ Player" ? "" : current,
                  );
                }}
                disabled={loading}
              >
                <span className="festival-role-copy">
                  <strong>ผู้เข้าแข่งขัน</strong>
                  <span>Player</span>
                </span>
              </button>
            </div>

            <div className="festival-form-actions">
              <button
                type="button"
                className="confirm-btn festival-confirm-btn"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? "กำลังดำเนินการ..." : "ยืนยัน"}
              </button>

              <button
                type="button"
                className="back-btn festival-back-btn"
                onClick={() => setStep("landing")}
                disabled={loading}
              >
                ← กลับไปหน้าแรก
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
