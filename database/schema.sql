CREATE TABLE IF NOT EXISTS trainers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  experience INTEGER NOT NULL DEFAULT 0 CHECK (experience >= 0 AND experience < 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pokemon (
  id SERIAL PRIMARY KEY,
  trainer_id INTEGER NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  life_point INTEGER NOT NULL CHECK (life_point >= 0),
  max_life_point INTEGER NOT NULL CHECK (max_life_point > 0),
  CHECK (life_point <= max_life_point)
);

CREATE TABLE IF NOT EXISTS attacks (
  id SERIAL PRIMARY KEY,
  pokemon_id INTEGER NOT NULL REFERENCES pokemon(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  damage INTEGER NOT NULL CHECK (damage > 0),
  usage_limit INTEGER NOT NULL CHECK (usage_limit > 0),
  usage_count INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  CHECK (usage_count <= usage_limit),
  UNIQUE (pokemon_id, name)
);

CREATE UNIQUE INDEX IF NOT EXISTS attacks_pokemon_name_ci_unique_idx
  ON attacks (pokemon_id, LOWER(name));
