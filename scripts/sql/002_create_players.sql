-- 002_create_players.sql
-- Player master data linked to squads

CREATE TABLE IF NOT EXISTS players (
    player_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES squads(squad_id) ON DELETE CASCADE,
    player_name TEXT NOT NULL,
    player_role TEXT,                      -- 'BAT', 'BOWL', 'AR', 'WK'
    is_captain BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
