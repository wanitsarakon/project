/**
 * 🎪 GAMES CONFIG (Thai Festival Mini Games)
 *
 * ใช้ร่วมกันทั้ง:
 * - FestivalMapScene
 * - GameContainer / Mini Game Loader
 * - Summary / Winner
 * - Backend round logic (อนาคต)
 */

/**
 * ⚠️ RULE:
 * - key = id กลาง (frontend + backend ต้องตรงกัน)
 * - scene = Phaser.Scene key
 * - order = ลำดับการเล่น
 */

export const GAMES = [
  {
    key: "fish",
    name: "เกมตักปลา",
    order: 1,
    icon: "🐟",
    description: "ตักปลาให้ได้มากที่สุดภายในเวลาที่กำหนด",
    scene: "FishScoopingScene", // ✅ ตรงกับของจริง
    enabled: true,
  },
  {
    key: "horse",
    name: "เกมขี่ม้า",
    order: 2,
    icon: "🐎",
    description: "หมุนม้าให้หยุดในตำแหน่งที่แม่นยำ",
    scene: "HorseScene",
    enabled: false, // ❗ ยังไม่ทำ
  },
  {
    key: "shoot",
    name: "เกมยิงตุ๊กตา",
    order: 3,
    icon: "🎯",
    description: "ยิงเป้าให้โดนเพื่อสะสมคะแนน",
    scene: "DollShootScene",
    enabled: false,
  },
  {
    key: "cotton",
    name: "เกมทำสายไหมลูกชุบ",
    order: 4,
    icon: "🍭",
    description: "หมุนสายไหมให้สวยและเร็วที่สุด",
    scene: "CottonCandyScene",
    enabled: false,
  },
  {
    key: "pray",
    name: "จุดไหว้พระขอพร",
    order: 5,
    icon: "🙏",
    description: "เสี่ยงเซียมซีเพื่อรับแต้มพิเศษ",
    scene: "PrayScene",
    enabled: false,
  },

  {
    id:"tugofwar",
    name:"ชักกะเย่อ",
    scene:"TugOfWarScene"
  }
];

/* =========================
   🔧 HELPERS
========================= */

/** เกมที่เปิดใช้งาน + เรียงตาม order */
export const getOrderedGames = () =>
  GAMES
    .filter((g) => g.enabled)
    .sort((a, b) => a.order - b.order);

/** หาเกมจาก key (เฉพาะ enabled) */
export const getGameByKey = (key) =>
  GAMES.find((g) => g.key === key && g.enabled);

/** เกมถัดไปจาก key ปัจจุบัน */
export const getNextGame = (currentKey) => {
  const ordered = getOrderedGames();
  const idx = ordered.findIndex(
    (g) => g.key === currentKey
  );

  if (idx === -1) return null;
  return ordered[idx + 1] ?? null;
};

/** เกมแรกของงาน */
export const getFirstGame = () => {
  const ordered = getOrderedGames();
  return ordered.length > 0 ? ordered[0] : null;
};
