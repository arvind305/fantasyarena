-- 005_create_side_bets.sql
-- Side bet definitions per match

CREATE TABLE IF NOT EXISTS side_bets (
    side_bet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id VARCHAR(100) NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]',    -- ["Yes", "No"] or ["<=30", "31-50", ...]
    correct_answer TEXT,                    -- Set after match by admin
    points_correct INT NOT NULL DEFAULT 500,
    points_wrong INT DEFAULT 0,            -- 0 or negative (e.g., -200)
    display_order INT DEFAULT 0,
    status TEXT DEFAULT 'OPEN',            -- OPEN, CLOSED, SCORED
    created_at TIMESTAMPTZ DEFAULT NOW()
);
