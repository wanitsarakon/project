-- =========================================
-- FINAL SCHEMA (PRODUCTION)
-- Thai Festival Game System
-- Backend + Frontend aligned (v5.5 FIXED)
-- =========================================

BEGIN;

-- =====================================================
-- ROOMS
-- =====================================================
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,

  code VARCHAR(8) UNIQUE NOT NULL,
  name TEXT NOT NULL,

  mode VARCHAR(10) NOT NULL
    CHECK (mode IN ('solo','team')),

  prize TEXT,

  max_players INT NOT NULL DEFAULT 8
    CHECK (max_players > 0 AND max_players <= 100),

  -- ⭐ Backend Source of Truth: Host
  host_player_id INT,

  room_password TEXT, -- NULL = public

  status VARCHAR(20) NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting','playing','finished')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rooms_code
  ON rooms(code);

CREATE INDEX IF NOT EXISTS idx_rooms_status
  ON rooms(status);

CREATE INDEX IF NOT EXISTS idx_rooms_mode
  ON rooms(mode);

-- =====================================================
-- PLAYERS
-- =====================================================
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,

  room_id INT NOT NULL
    REFERENCES rooms(id)
    ON DELETE CASCADE,

  name TEXT NOT NULL,

  -- ⭐ Host flag (DB = Source of Truth)
  is_host BOOLEAN NOT NULL DEFAULT false,

  -- team mode (nullable for solo)
  team VARCHAR(20)
    CHECK (team IN ('red','blue','green','yellow')),

  total_score INT NOT NULL DEFAULT 0
    CHECK (total_score >= 0),

  connected BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_players_room_name
    UNIQUE (room_id, name)
);

CREATE INDEX IF NOT EXISTS idx_players_roomid
  ON players(room_id);

CREATE INDEX IF NOT EXISTS idx_players_connected
  ON players(connected);

CREATE INDEX IF NOT EXISTS idx_players_room_connected
  ON players(room_id, connected);

CREATE INDEX IF NOT EXISTS idx_players_last_seen
  ON players(last_seen_at);

CREATE INDEX IF NOT EXISTS idx_players_room_host
  ON players(room_id, is_host);

CREATE INDEX IF NOT EXISTS idx_players_team
  ON players(team);

-- =====================================================
-- ⭐ FK: rooms.host_player_id → players.id
-- (Host may disconnect → SET NULL)
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_rooms_host_player'
  ) THEN
    ALTER TABLE rooms
      ADD CONSTRAINT fk_rooms_host_player
      FOREIGN KEY (host_player_id)
      REFERENCES players(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rooms_host_player
  ON rooms(host_player_id);

-- =====================================================
-- ROUNDS
-- =====================================================
CREATE TABLE IF NOT EXISTS rounds (
  id SERIAL PRIMARY KEY,

  room_id INT NOT NULL
    REFERENCES rooms(id)
    ON DELETE CASCADE,

  round_index INT NOT NULL
    CHECK (round_index >= 1),

  -- IMPORTANT: must match frontend gameKey exactly
  game_key VARCHAR(50) NOT NULL,

  status VARCHAR(20) NOT NULL DEFAULT 'playing'
    CHECK (status IN ('playing','finished')),

  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,

  CONSTRAINT uq_round_room_index
    UNIQUE (room_id, round_index)
);

CREATE INDEX IF NOT EXISTS idx_rounds_roomid
  ON rounds(room_id);

CREATE INDEX IF NOT EXISTS idx_rounds_status
  ON rounds(status);

CREATE INDEX IF NOT EXISTS idx_rounds_game_key
  ON rounds(game_key);

-- =====================================================
-- MINI GAME RESULTS
-- =====================================================
CREATE TABLE IF NOT EXISTS mini_game_results (
  id SERIAL PRIMARY KEY,

  round_id INT NOT NULL
    REFERENCES rounds(id)
    ON DELETE CASCADE,

  player_id INT NOT NULL
    REFERENCES players(id)
    ON DELETE CASCADE,

  game_key VARCHAR(50) NOT NULL,

  score INT NOT NULL DEFAULT 0
    CHECK (score >= 0),

  meta JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_result_round_player
    UNIQUE (round_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_results_round
  ON mini_game_results(round_id);

CREATE INDEX IF NOT EXISTS idx_results_player
  ON mini_game_results(player_id);

CREATE INDEX IF NOT EXISTS idx_results_game_key
  ON mini_game_results(game_key);

COMMIT;
