-- 008_alter_bets_table.sql
-- Add new columns to the existing bets table for expanded bet types

-- Player picks: [{slot: 1, player_id: "uuid", team: "IND", player_name: "..."}, ...]
ALTER TABLE bets ADD COLUMN IF NOT EXISTS player_picks JSONB DEFAULT '[]';

-- Runner picks: [{user_id: "...", display_name: "..."}, ...]
ALTER TABLE bets ADD COLUMN IF NOT EXISTS runner_picks JSONB DEFAULT '[]';

-- Side bet answers: {"side_bet_id_1": "Yes", "side_bet_id_2": "31-50", ...}
ALTER TABLE bets ADD COLUMN IF NOT EXISTS side_bet_answers JSONB DEFAULT '{}';

-- Detailed points breakdown
ALTER TABLE bets ADD COLUMN IF NOT EXISTS winner_points INT DEFAULT 0;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS total_runs_points INT DEFAULT 0;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS player_pick_points INT DEFAULT 0;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS runner_points INT DEFAULT 0;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS side_bet_points INT DEFAULT 0;
