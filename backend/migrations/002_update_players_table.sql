-- =========================================
-- 002_update_players_and_rooms.sql
-- Heartbeat / Reconnect / Host Transfer
-- Backend-aligned (v5.5)
-- Production-safe & Idempotent
-- =========================================

BEGIN;

-- =====================================================
-- 🔥 HEARTBEAT / RECONNECT
-- =====================================================

-- last_seen_at (เผื่อ schema เก่ามาก)
ALTER TABLE players
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ
NOT NULL DEFAULT NOW();

-- =====================================================
-- 🔍 INDEXES (CRITICAL – USED BY BACKEND)
-- =====================================================

-- heartbeat cleanup
CREATE INDEX IF NOT EXISTS idx_players_last_seen
ON players(last_seen_at);

-- online/offline check
CREATE INDEX IF NOT EXISTS idx_players_connected
ON players(connected);

-- room + connected lookup (used everywhere)
CREATE INDEX IF NOT EXISTS idx_players_room_connected
ON players(room_id, connected);

-- host lookup / transfer
CREATE INDEX IF NOT EXISTS idx_players_room_host
ON players(room_id, is_host);

-- =====================================================
-- 👑 HOST TRANSFER SUPPORT
-- =====================================================

-- rooms.host_player_id (canonical host)
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS host_player_id INT;

-- sync host_player_id จาก players.is_host
UPDATE rooms r
SET host_player_id = p.id
FROM players p
WHERE p.room_id = r.id
  AND p.is_host = true
  AND r.host_player_id IS NULL;

-- (optional but recommended) index host_player_id
CREATE INDEX IF NOT EXISTS idx_rooms_host_player
ON rooms(host_player_id);

-- =====================================================
-- 🧹 RESET STALE STATE (SAFE FOR DEPLOY / RESTART)
-- =====================================================

-- 1️⃣ mark stale players (> 2 นาที) offline
UPDATE players
SET connected = false
WHERE connected = true
  AND last_seen_at < NOW() - INTERVAL '2 minutes';

-- 2️⃣ reset rooms stuck in playing state
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
