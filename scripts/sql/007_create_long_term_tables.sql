-- 007_create_long_term_tables.sql
-- Long-term tournament bets configuration and user bets

-- Config table: tournament-level bet settings
CREATE TABLE IF NOT EXISTS long_term_bets_config (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL UNIQUE,

    -- Points for each bet type
    winner_points INT DEFAULT 5000,
    finalist_points INT DEFAULT 2000,      -- Per correct team
    final_four_points INT DEFAULT 1000,    -- Per correct team
    orange_cap_points INT DEFAULT 3000,    -- Per correct pick
    purple_cap_points INT DEFAULT 3000,    -- Per correct pick

    -- Lock timing
    lock_time TIMESTAMPTZ,
    is_locked BOOLEAN DEFAULT false,

    -- Change cost (% of total points)
    change_cost_percent DECIMAL(5,2) DEFAULT 10,
    allow_changes BOOLEAN DEFAULT false,

    -- Actual results (set by admin after tournament)
    actual_winner TEXT,
    actual_finalists JSONB,                -- ["IND", "AUS"]
    actual_final_four JSONB,               -- ["IND", "AUS", "ENG", "PAK"]
    actual_orange_cap TEXT,                -- player_id
    actual_purple_cap TEXT,                -- player_id

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User long-term predictions
CREATE TABLE IF NOT EXISTS long_term_bets (
    bet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,

    -- Predictions
    winner_team TEXT,                      -- Single team code e.g., 'IND'
    finalist_teams JSONB,                  -- ["IND", "AUS"]
    final_four_teams JSONB,                -- ["IND", "AUS", "ENG", "PAK"]
    orange_cap_players JSONB,              -- ["player_id_1", "player_id_2"]
    purple_cap_players JSONB,              -- ["player_id_1", "player_id_2"]

    -- Scoring
    is_scored BOOLEAN DEFAULT false,
    total_points INT DEFAULT 0,
    points_breakdown JSONB DEFAULT '{}',   -- detailed scoring per category

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);
