-- =========================================
-- 002_update_players_and_rooms.sql
-- Heartbeat / Reconnect / Host Transfer
-- Production-safe & Idempotent
-- =========================================

BEGIN;

-- =========================
-- 🔥 HEARTBEAT / RECONNECT
-- =========================
-- เก็บเวลาล่าสุดที่ client ยัง online
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

-- ใช้ตอน query ห้อง + transfer host
CREATE INDEX IF NOT EXISTS idx_players_room_connected
ON players(room_id, connected);

-- =========================
-- 👑 HOST TRANSFER SUPPORT
-- =========================
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS host_player_id INT;

-- initial sync host_player_id (safe)
UPDATE rooms r
SET host_player_id = p.id
FROM players p
WHERE p.room_id = r.id
  AND p.is_host = true
  AND r.host_player_id IS NULL;

-- (Optional FK – เปิดใช้เมื่อมั่นใจเรื่อง delete order)
-- ALTER TABLE rooms
-- ADD CONSTRAINT fk_rooms_host_player
-- FOREIGN KEY (host_player_id)
-- REFERENCES players(id)
-- ON DELETE SET NULL;

-- =========================
-- 🧹 RESET STALE STATE (SAFE)
-- ใช้ตอน deploy / restart server
-- =========================

-- 1️⃣ mark player ที่ stale เท่านั้น (เช่น > 2 นาที)
UPDATE players
SET connected = false
WHERE connected = true
  AND last_seen_at < NOW() - INTERVAL '2 minutes';

-- 2️⃣ reset ห้องที่ค้างผิดปกติจริง
-- playing แต่ไม่มี player online เลย
UPDATE rooms r
SET status = 'waiting'
WHERE r.status = 'playing'
  AND NOT EXISTS (
    SELECT 1 FROM players p
    WHERE p.room_id = r.id
      AND p.connected = true
  );

COMMIT;
