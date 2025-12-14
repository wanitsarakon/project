-- backend/migrations/001_create_tables.sql

CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  code VARCHAR(8) UNIQUE NOT NULL,
  name TEXT,
  mode VARCHAR(10) NOT NULL,
  prize TEXT,
  max_players INT DEFAULT 8,
  host_player_id INT,
  status VARCHAR(20) DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  room_id INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_host BOOLEAN DEFAULT false,
  team VARCHAR(10),
  score INT DEFAULT 0,
  connected BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rounds (
  id SERIAL PRIMARY KEY,
  room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
  round_index INT,
  game_key VARCHAR(50),
  status VARCHAR(20),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS mini_game_results (
  id SERIAL PRIMARY KEY,
  round_id INT REFERENCES rounds(id) ON DELETE CASCADE,
  player_id INT REFERENCES players(id) ON DELETE CASCADE,
  game_key VARCHAR(50),
  score INT,
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_players_roomid ON players(room_id);



SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'players'
ORDER BY ordinal_position;

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS team VARCHAR(20);

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS total_score INTEGER DEFAULT 0;

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS connected BOOLEAN DEFAULT FALSE;

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS is_host BOOLEAN DEFAULT FALSE;


SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'players'
ORDER BY ordinal_position;

