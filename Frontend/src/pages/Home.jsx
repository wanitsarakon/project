import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export default function Home({ onSelect }) {
  const [step, setStep] = useState("landing"); // landing | form
  const [name, setName] = useState("");
  const [role, setRole] = useState(null); // host | player
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);

  /* =========================
     Focus input เมื่อเข้า form
  ========================= */
  useEffect(() => {
    if (step === "form") {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [step]);

  /* =========================
     Helpers
  ========================= */
  const normalizeName = useCallback((value) => {
    return value.replace(/\s+/g, " ").trim();
  }, []);

  /* =========================
     Submit
  ========================= */
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

  /* =========================
     Keyboard (Enter)
  ========================= */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Enter") return;
      if (loading) return;
      if (step !== "form") return;
      handleConfirm();
    };

    window.addEventListener("keydown", onKeyDown);
    return () =>
      window.removeEventListener("keydown", onKeyDown);
  }, [handleConfirm, loading, step]);

  /* =========================
     UI
  ========================= */
  return (
    <div className="home-root">
      {/* ===== PANEL กลาง ===== */}
      <div className="ui-panel">
        {/* ================= LANDING ================= */}
        {step === "landing" && (
          <div className="landing">
            <h1 className="landing-title">
              🎉 Temple fair
              <span>mini-game 2D website</span>
            </h1>

            <p className="landing-subtitle">
              เรียนเชิญเข้าสู่งานวัดชิงรางวัล
            </p>

            <button
              className="enter-btn"
              onClick={() => setStep("form")}
            >
              ▶ เข้าสู่เกม
            </button>
          </div>
        )}

        {/* ================= FORM ================= */}
        {step === "form" && (
          <div role="main">
            <h2 className="form-title">เริ่มเล่นเกม</h2>

            <input
              ref={inputRef}
              className="name-input"
              placeholder="ชื่อของคุณ"
              value={name}
              maxLength={20}
              disabled={loading}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="role-row">
              <button
                className={`role-btn ${
                  role === "host" ? "active" : ""
                }`}
                onClick={() => setRole("host")}
                disabled={loading}
              >
                🧑‍💼 Host
              </button>

              <button
                className={`role-btn ${
                  role === "player" ? "active" : ""
                }`}
                onClick={() => setRole("player")}
                disabled={loading}
              >
                🎮 Player
              </button>
            </div>

            <button
              className="confirm-btn"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading
                ? "⏳ กำลังดำเนินการ..."
                : "ตกลง"}
            </button>

            <button
              className="back-btn"
              onClick={() => setStep("landing")}
              disabled={loading}
            >
              ← กลับ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
