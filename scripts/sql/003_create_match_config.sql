-- 003_create_match_config.sql
-- Per-match admin configuration for the expanded betting system

CREATE TABLE IF NOT EXISTS match_config (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id VARCHAR(100) NOT NULL UNIQUE,
    event_id TEXT NOT NULL DEFAULT 't20wc_2026',

    -- Match Winner Config
    winner_base_points INT DEFAULT 1000,
    super_over_multiplier DECIMAL(5,2) DEFAULT 5,

    -- Total Runs Config
    total_runs_base_points INT DEFAULT 1000,

    -- Player Slots Config
    player_slots_enabled BOOLEAN DEFAULT true,
    player_slot_count INT DEFAULT 3,

    -- Runners Config
    runners_enabled BOOLEAN DEFAULT false,
    runner_count INT DEFAULT 0,

    -- Timing
    lock_time TIMESTAMPTZ,

    -- Match teams (for convenience)
    team_a TEXT,
    team_b TEXT,

    -- Status
    status TEXT DEFAULT 'DRAFT',          -- DRAFT, OPEN, LOCKED, SCORED

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
