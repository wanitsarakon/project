import FishScoopingScene from "./FishScoopingScene";

/**
 * FishScooping Game Entry
 * --------------------------------
 * ใช้สำหรับ register scene ใน GameContainer
 * GameContainer จะเป็นคนสร้าง Phaser.Game
 * และส่ง data เข้ามาที่ Scene ผ่าน scene.start()
 *
 * ห้ามใส่ logic เกมที่นี่
 */
export default {
  key: "FishScoopingScene",
  scene: FishScoopingScene,
};
