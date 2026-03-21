import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export default function Home({ onSelect }) {
  const [step, setStep] = useState("landing");
  const [name, setName] = useState("");
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    if (step === "form") {
      window.setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [step]);

  const normalizeName = useCallback((value) => value.replace(/\s+/g, " ").trim(), []);

  const handleConfirm = useCallback(() => {
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

    setLoading(true);
    onSelect(role, normalizedName);
    setLoading(false);
  }, [loading, name, role, onSelect, normalizeName]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Enter") return;
      if (loading || step !== "form") return;
      handleConfirm();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleConfirm, loading, step]);

  return (
    <div className={`home-root ${step === "landing" ? "home-root-landing" : ""}`}>
      {step === "landing" ? (
        <section className="landing-stage landing-stage-minimal">
          <button
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
                maxLength={20}
                disabled={loading}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <p className="festival-form-hint">
              เลือกบทบาทเพื่อกำหนดว่าจะเป็นผู้สร้างห้องหรือผู้เข้าแข่งขัน
            </p>

            <div className="festival-role-grid">
              <button
                className={`festival-role-card host-card ${role === "host" ? "active" : ""}`}
                onClick={() => setRole("host")}
                disabled={loading}
              >
                <span className="festival-role-copy">
                  <strong>เจ้าภาพแข่งขัน</strong>
                  <span>Host</span>
                </span>
              </button>

              <button
                className={`festival-role-card player-card ${role === "player" ? "active" : ""}`}
                onClick={() => setRole("player")}
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
                className="confirm-btn festival-confirm-btn"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? "กำลังดำเนินการ..." : "ยืนยัน"}
              </button>

              <button
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
