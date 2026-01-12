-- =========================================
-- INITIAL SCHEMA
-- Thai Festival Game System
-- Production-aligned with Backend
-- =========================================

BEGIN;

-- =========================
-- ROOMS
-- =========================
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,

  code VARCHAR(8) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  mode VARCHAR(10) NOT NULL CHECK (mode IN ('solo','team')),

  prize TEXT,
  max_players INT NOT NULL DEFAULT 8 CHECK (max_players > 0),

  host_player_id INT,                    -- 🔑 host ปัจจุบัน
  room_password TEXT,                    -- 🔒 NULL = public

  status VARCHAR(20) NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting','playing','ended')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);

-- =========================
-- PLAYERS
-- =========================
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,

  room_id INT NOT NULL
    REFERENCES rooms(id)
    ON DELETE CASCADE,

  name TEXT NOT NULL,

  is_host BOOLEAN NOT NULL DEFAULT false,
  team VARCHAR(20) CHECK (team IN ('red','blue')),

  total_score INT NOT NULL DEFAULT 0 CHECK (total_score >= 0),

  connected BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- ❗ กันชื่อซ้ำในห้องเดียว
  CONSTRAINT uq_players_room_name UNIQUE (room_id, name)
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_players_roomid ON players(room_id);
CREATE INDEX IF NOT EXISTS idx_players_connected ON players(connected);
CREATE INDEX IF NOT EXISTS idx_players_last_seen ON players(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_players_room_connected ON players(room_id, connected);

-- =========================
-- ROUNDS
-- =========================
CREATE TABLE IF NOT EXISTS rounds (
  id SERIAL PRIMARY KEY,

  room_id INT NOT NULL
    REFERENCES rooms(id)
    ON DELETE CASCADE,

  -- 🔑 0-based index (ตรง backend)
  round_index INT NOT NULL CHECK (round_index >= 0),

  game_key VARCHAR(50) NOT NULL,

  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','ended')),

  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- ❗ ห้องเดียว ห้ามมี round_index ซ้ำ
  CONSTRAINT uq_round_room_index UNIQUE (room_id, round_index)
);

CREATE INDEX IF NOT EXISTS idx_rounds_roomid ON rounds(room_id);
CREATE INDEX IF NOT EXISTS idx_rounds_status ON rounds(status);

-- =========================
-- MINI GAME RESULTS
-- =========================
CREATE TABLE IF NOT EXISTS mini_game_results (
  id SERIAL PRIMARY KEY,

  round_id INT NOT NULL
    REFERENCES rounds(id)
    ON DELETE CASCADE,

  player_id INT NOT NULL
    REFERENCES players(id)
    ON DELETE CASCADE,

  game_key VARCHAR(50) NOT NULL,
  score INT NOT NULL DEFAULT 0 CHECK (score >= 0),

  meta JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- ❗ 1 player ส่งผลได้ครั้งเดียวต่อรอบ
  CONSTRAINT uq_result_round_player UNIQUE (round_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_results_round ON mini_game_results(round_id);
CREATE INDEX IF NOT EXISTS idx_results_player ON mini_game_results(player_id);

COMMIT;
