-- =========================================
-- 002_update_players_and_rooms.sql
-- Heartbeat / Reconnect / Host Transfer
-- Backend-aligned (v5.5)
-- Production-safe & Idempotent
-- =========================================

BEGIN;

-- =========================
-- 🔥 HEARTBEAT / RECONNECT
-- =========================
-- เก็บเวลาล่าสุดที่ client ยัง online
-- (เผื่อ schema เก่าที่ยังไม่มี)
ALTER TABLE players
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ
NOT NULL DEFAULT NOW();

-- =========================
-- 🔍 INDEXES (CRITICAL)
-- =========================

-- ใช้กับ AutoCleanup + heartbeat
CREATE INDEX IF NOT EXISTS idx_players_last_seen
ON players(last_seen_at);

-- เช็ค online/offline เร็ว
CREATE INDEX IF NOT EXISTS idx_players_connected
ON players(connected);

-- ใช้ตอน query ห้อง + host transfer
CREATE INDEX IF NOT EXISTS idx_players_room_connected
ON players(room_id, connected);

-- =========================
-- 👑 HOST TRANSFER SUPPORT
-- =========================

-- เผื่อ schema เก่าที่ยังไม่มี
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS host_player_id INT;

-- sync host_player_id จาก players.is_host
-- (เฉพาะกรณีที่ยังเป็น NULL)
UPDATE rooms r
SET host_player_id = p.id
FROM players p
WHERE p.room_id = r.id
  AND p.is_host = true
  AND r.host_player_id IS NULL;

-- =========================
-- 🧹 RESET STALE STATE (SAFE)
-- ใช้ตอน deploy / restart server
-- =========================

-- 1️⃣ mark player stale (> 2 นาที) เป็น offline
UPDATE players
SET connected = false
WHERE connected = true
  AND last_seen_at < NOW() - INTERVAL '2 minutes';

-- 2️⃣ reset ห้องที่ค้างผิดปกติ
-- playing แต่ไม่มี player online เลย
UPDATE rooms r
SET status = 'waiting'
WHERE r.status = 'playing'
  AND NOT EXISTS (
    SELECT 1
    FROM players p
    WHERE p.room_id = r.id
      AND p.connected = true
  );

COMMIT;
