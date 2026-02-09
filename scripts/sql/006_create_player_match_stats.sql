-- 006_create_player_match_stats.sql
-- Player performance data per match for fantasy scoring

CREATE TABLE IF NOT EXISTS player_match_stats (
    stat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id VARCHAR(100) NOT NULL,
    player_id UUID NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,

    -- Batting
    runs INT DEFAULT 0,
    balls_faced INT DEFAULT 0,
    fours INT DEFAULT 0,
    sixes INT DEFAULT 0,
    strike_rate DECIMAL(10,2) DEFAULT 0,

    -- Bowling
    wickets INT DEFAULT 0,
    overs_bowled DECIMAL(5,1) DEFAULT 0,
    runs_conceded INT DEFAULT 0,
    economy_rate DECIMAL(10,2) DEFAULT 0,

    -- Fielding
    catches INT DEFAULT 0,
    run_outs INT DEFAULT 0,
    stumpings INT DEFAULT 0,

    -- Bonuses
    is_man_of_match BOOLEAN DEFAULT false,
    has_century BOOLEAN DEFAULT false,
    has_five_wicket_haul BOOLEAN DEFAULT false,
    has_hat_trick BOOLEAN DEFAULT false,

    -- Calculated total
    total_fantasy_points INT DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(match_id, player_id)
);
