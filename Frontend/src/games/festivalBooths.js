export const FESTIVAL_WORSHIP_SCENE = "WorshipBoothScene";

export const FESTIVAL_BOOTHS = [
  { key: "fish", label: "เกมตักปลา", subtitle: "ช้อนปลาไวให้ได้มากที่สุด", scene: "FishScoopingScene", texture: "/assets/booth-fish.png", accent: 0x57d2ff, trim: 0x0e778b, awningAlt: 0xfff4d8 },
  { key: "horse", label: "เกมขี่ม้า", subtitle: "วิ่งฝ่างานวัดกลางคืน เก็บของส่งให้ไว", scene: "HorseDeliveryScene", texture: "/assets/booth-horse.png", accent: 0xffc75c, trim: 0x9e5a12, awningAlt: 0xfff2d2 },
  { key: "boxing", label: "เกมจำท่ามวย", subtitle: "จับจังหวะแล้วตอบให้ถูก", scene: "BoxingGameScene", texture: "/assets/booth-boxing.png", accent: 0xff8f84, trim: 0xc24736, awningAlt: 0xffece9 },
  { key: "cooking", label: "เกมสอนทำขนมลูกชุบ", subtitle: "ทำตามสูตรให้ครบทุกขั้นตอน", scene: "CookingGameScene", texture: "/assets/booth-cooking.png", accent: 0xffc772, trim: 0xd06f1c, awningAlt: 0xfff1d8 },
  { key: "balloon", label: "เกมปาโป่ง", subtitle: "เล็งดี ยิงไว ทำคอมโบให้ต่อเนื่อง", scene: "BalloonShootScene", texture: "/assets/booth-balloon.png", accent: 0xff78cf, trim: 0xc33479, awningAlt: 0xffedf9 },
  { key: "doll", label: "เกมยิงตุ๊กตา", subtitle: "เล็งเป้าให้แม่น คว้ารางวัลกลับบ้าน", scene: "DollGameScene", texture: "/assets/booth-doll.png", accent: 0x9fc6ff, trim: 0x4167c4, awningAlt: 0xedf4ff },
  { key: "flower", label: "เกมร้อยมาลัย", subtitle: "ร้อยพวงมาลัยตามใจลูกค้า", scene: "FlowerGameScene", texture: "/assets/booth-flower.png", accent: 0xffa9c6, trim: 0xc4507d, awningAlt: 0xffeef4 },
  { key: "haunted", label: "เกมบ้านผีสิง", subtitle: "ช่วยวิญญาณให้พบของที่ตามหา", scene: "HauntedHouseScene", texture: "/assets/booth-haunted.png", accent: 0xbda7ff, trim: 0x6241bd, awningAlt: 0xf2eeff },
  { key: "tug", label: "เกมชักเย่อ", subtitle: "ดวลแรงใจให้ทีมเป็นผู้ชนะ", scene: "TugOfWarScene", texture: "/assets/booth-tug.png", accent: 0x8cf2b0, trim: 0x199653, awningAlt: 0xeaffef },
  { key: "worship", label: "เกมไหว้พระขอพร", subtitle: "พิธีปิดท้าย เสี่ยงเซียมซีรับพรกลับบ้าน", scene: "WorshipBoothScene", texture: "/assets/booth-worship.png", accent: 0xffec9e, trim: 0xb78019, awningAlt: 0xfff8e1 },
];

const BOOTH_MAP = new Map(FESTIVAL_BOOTHS.map((booth) => [booth.scene, booth]));
const SELECTABLE_BOOTHS = FESTIVAL_BOOTHS.filter((booth) => booth.scene !== FESTIVAL_WORSHIP_SCENE);

export function getDefaultFestivalBoothSequence() {
  return FESTIVAL_BOOTHS.map((booth) => booth.scene);
}

export function getSelectableFestivalBooths() {
  return SELECTABLE_BOOTHS;
}

export function normalizeFestivalBoothSequence(sequence) {
  if (!Array.isArray(sequence)) {
    return getDefaultFestivalBoothSequence();
  }

  const selected = new Set(sequence);
  const ordered = SELECTABLE_BOOTHS
    .filter((booth) => selected.has(booth.scene))
    .map((booth) => booth.scene);

  if (ordered.length === 0 && !selected.has(FESTIVAL_WORSHIP_SCENE)) {
    return [];
  }

  return [...ordered, FESTIVAL_WORSHIP_SCENE];
}

export function getFestivalBoothsBySceneKeys(sequence) {
  const normalized = normalizeFestivalBoothSequence(sequence);
  return normalized
    .map((scene) => BOOTH_MAP.get(scene))
    .filter(Boolean);
}
