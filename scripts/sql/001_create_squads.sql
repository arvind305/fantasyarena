-- 001_create_squads.sql
-- Team roster table for tournament squads

CREATE TABLE IF NOT EXISTS squads (
    squad_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL DEFAULT 't20wc_2026',
    team_code TEXT NOT NULL,              -- e.g., 'IND', 'AUS', 'PAK'
    team_name TEXT NOT NULL,              -- e.g., 'India', 'Australia'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, team_code)
);
