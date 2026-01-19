import { useEffect, useRef } from "react";
import Phaser from "phaser";
import DollScene from "./DollShooting/DollScene";

export default function GameContainer({
  roomCode,
  player,
  wsRef,
  onGameEnd,
}) {
  const gameRef = useRef(null);
  const containerRef = useRef(null);
  const onGameEndRef = useRef(onGameEnd);

  /* =========================
     Keep latest callback (SAFE)
  ========================= */
  useEffect(() => {
    onGameEndRef.current = onGameEnd;
  }, [onGameEnd]);

  /* =========================
     Create Phaser (ONCE)
  ========================= */
  useEffect(() => {
    if (gameRef.current || !containerRef.current) return;

    const config = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 800,
      height: 600,
      backgroundColor: "#1b1b1b",
      physics: {
        default: "arcade",
        arcade: {
          debug: false,
        },
      },
      scene: [DollScene], // ✅ ใช้ class ตรง ๆ
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // ❗ สำคัญ: start scene หลังสร้าง game เสร็จ
    game.scene.start("DollShootScene", {
      roomCode,
      player,
      wsRef, // 🔥 ส่ง WS ref จาก Game.jsx
      onGameEnd: (result) => {
        onGameEndRef.current?.(result);
      },
    });

    /* =========================
       CLEANUP (UNMOUNT SAFE)
    ========================= */
    return () => {
      if (gameRef.current) {
        try {
          gameRef.current.destroy(true);
        } catch {}
        gameRef.current = null;
      }
    };
    // ❗ create once only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: 800,
        height: 600,
        margin: "0 auto",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        background: "#000",
      }}
    />
  );
}
