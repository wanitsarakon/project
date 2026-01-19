/**
 * 🎪 GAMES CONFIG (Thai Festival Mini Games)
 *
 * ใช้ร่วมกันทั้ง:
 * - FestivalMap (หน้าซุ้มเกม)
 * - Mini Game Loader
 * - Summary / Winner
 * - Backend round logic (อนาคต)
 */

export const GAMES = [
  {
    key: "fishing",
    name: "เกมตักปลา",
    order: 1,
    icon: "🐟",
    description: "ตักปลาให้ได้มากที่สุดภายในเวลาที่กำหนด",
    scene: "FishingScene",          // Phaser Scene (อนาคต)
    enabled: true,
  },
  {
    key: "horse",
    name: "เกมขี่ม้า",
    order: 2,
    icon: "🐎",
    description: "หมุนม้าให้หยุดในตำแหน่งที่แม่นยำ",
    scene: "HorseScene",
    enabled: true,
  },
  {
    key: "shooting",
    name: "เกมยิงตุ๊กตา",
    order: 3,
    icon: "🎯",
    description: "ยิงเป้าให้โดนเพื่อสะสมคะแนน",
    scene: "DollShootScene",
    enabled: true,
  },
  {
    key: "cotton",
    name: "เกมทำสายไหมลูกชุบ",
    order: 4,
    icon: "🍭",
    description: "หมุนสายไหมให้สวยและเร็วที่สุด",
    scene: "CottonCandyScene",
    enabled: true,
  },
  {
    key: "pray",
    name: "จุดไหว้พระขอพร",
    order: 5,
    icon: "🙏",
    description: "เสี่ยงเซียมซีเพื่อรับแต้มพิเศษ",
    scene: "PrayScene",
    enabled: true,
  },
];

/* =========================
   🔧 HELPERS (OPTIONAL)
   ใช้แล้วชีวิตง่ายขึ้นมาก
========================= */

/** เรียงเกมตามลำดับ */
export const getOrderedGames = () =>
  GAMES.filter((g) => g.enabled).sort(
    (a, b) => a.order - b.order
  );

/** หาเกมจาก key */
export const getGameByKey = (key) =>
  GAMES.find((g) => g.key === key);

/** เกมถัดไป */
export const getNextGame = (currentKey) => {
  const ordered = getOrderedGames();
  const idx = ordered.findIndex(
    (g) => g.key === currentKey
  );
  return idx >= 0 && idx < ordered.length - 1
    ? ordered[idx + 1]
    : null;
};

/** เกมแรก */
export const getFirstGame = () =>
  getOrderedGames()[0] || null;
