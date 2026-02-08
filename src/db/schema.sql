-- Fantasy Sports Game Database Schema
-- Supabase PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Groups table: Stores fantasy game groups
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    join_code VARCHAR(20) UNIQUE NOT NULL,
    created_by UUID NOT NULL,
    event_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members table: Stores members of each group
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    score INTEGER DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Bets table: Stores user predictions/bets for matches
CREATE TABLE IF NOT EXISTS bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bet_id VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    match_id VARCHAR(100) NOT NULL,
    answers JSONB DEFAULT '{}',
    is_locked BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    locked_at TIMESTAMPTZ,
    score INTEGER DEFAULT 0
);

-- Match questions table: Stores questions for each match
CREATE TABLE IF NOT EXISTS match_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id VARCHAR(100) UNIQUE NOT NULL,
    match_id VARCHAR(100) NOT NULL,
    section VARCHAR(50) NOT NULL,
    kind VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    points_wrong INTEGER DEFAULT 0,
    options JSONB DEFAULT '[]',
    slot JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active',
    sort_order INTEGER DEFAULT 0,
    disabled BOOLEAN DEFAULT FALSE
);

-- Match configs table: Stores configuration for each match
CREATE TABLE IF NOT EXISTS match_configs (
    match_id VARCHAR(100) PRIMARY KEY,
    config JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leaderboard table: Stores player rankings and scores
CREATE TABLE IF NOT EXISTS leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    total_score INTEGER DEFAULT 0,
    matches_played INTEGER DEFAULT 0,
    last_match_score INTEGER DEFAULT 0,
    rank INTEGER DEFAULT 0,
    previous_rank INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Match results table: Stores final results of matches
CREATE TABLE IF NOT EXISTS match_results (
    match_id VARCHAR(100) PRIMARY KEY,
    winner VARCHAR(100),
    total_runs INTEGER DEFAULT 0,
    player_stats JSONB DEFAULT '{}',
    side_bet_answers JSONB DEFAULT '{}',
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    man_of_match VARCHAR(255)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Groups indexes
CREATE INDEX IF NOT EXISTS idx_groups_event_id ON groups(event_id);
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);
CREATE INDEX IF NOT EXISTS idx_groups_join_code ON groups(join_code);

-- Group members indexes
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_score ON group_members(score DESC);

-- Bets indexes
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_match_id ON bets(match_id);
CREATE INDEX IF NOT EXISTS idx_bets_user_match ON bets(user_id, match_id);
CREATE INDEX IF NOT EXISTS idx_bets_is_locked ON bets(is_locked);

-- Match questions indexes
CREATE INDEX IF NOT EXISTS idx_match_questions_match_id ON match_questions(match_id);
CREATE INDEX IF NOT EXISTS idx_match_questions_section ON match_questions(section);
CREATE INDEX IF NOT EXISTS idx_match_questions_status ON match_questions(status);
CREATE INDEX IF NOT EXISTS idx_match_questions_sort_order ON match_questions(match_id, sort_order);

-- Leaderboard indexes
CREATE INDEX IF NOT EXISTS idx_leaderboard_event_id ON leaderboard(event_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard(event_id, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_total_score ON leaderboard(event_id, total_score DESC);

-- Match results indexes
CREATE INDEX IF NOT EXISTS idx_match_results_winner ON match_results(winner);
CREATE INDEX IF NOT EXISTS idx_match_results_completed_at ON match_results(completed_at);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;

-- Groups policies
CREATE POLICY "Groups are viewable by authenticated users"
    ON groups FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create groups"
    ON groups FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update their groups"
    ON groups FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups"
    ON groups FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- Group members policies
CREATE POLICY "Group members are viewable by authenticated users"
    ON group_members FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can join groups"
    ON group_members FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own membership"
    ON group_members FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
    ON group_members FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Bets policies
CREATE POLICY "Users can view their own bets"
    ON bets FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view locked bets of others"
    ON bets FOR SELECT
    TO authenticated
    USING (is_locked = true);

CREATE POLICY "Users can create their own bets"
    ON bets FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own unlocked bets"
    ON bets FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id AND is_locked = false);

-- Match questions policies
CREATE POLICY "Match questions are viewable by authenticated users"
    ON match_questions FOR SELECT
    TO authenticated
    USING (true);

-- Match configs policies
CREATE POLICY "Match configs are viewable by authenticated users"
    ON match_configs FOR SELECT
    TO authenticated
    USING (true);

-- Leaderboard policies
CREATE POLICY "Leaderboard is viewable by everyone"
    ON leaderboard FOR SELECT
    TO authenticated
    USING (true);

-- Match results policies
CREATE POLICY "Match results are viewable by everyone"
    ON match_results FOR SELECT
    TO authenticated
    USING (true);

-- =====================================================
-- REALTIME
-- =====================================================

-- Enable realtime for leaderboard table
ALTER PUBLICATION supabase_realtime ADD TABLE leaderboard;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update leaderboard rankings
CREATE OR REPLACE FUNCTION update_leaderboard_ranks(p_event_id VARCHAR)
RETURNS VOID AS $$
BEGIN
    -- Store previous ranks
    UPDATE leaderboard
    SET previous_rank = rank
    WHERE event_id = p_event_id;

    -- Update ranks based on total_score
    WITH ranked AS (
        SELECT
            id,
            ROW_NUMBER() OVER (ORDER BY total_score DESC, matches_played DESC) as new_rank
        FROM leaderboard
        WHERE event_id = p_event_id
    )
    UPDATE leaderboard l
    SET rank = r.new_rank,
        updated_at = NOW()
    FROM ranked r
    WHERE l.id = r.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update member scores in a group
CREATE OR REPLACE FUNCTION update_group_member_score(
    p_group_id UUID,
    p_user_id UUID,
    p_score_delta INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE group_members
    SET score = score + p_score_delta
    WHERE group_id = p_group_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_match_configs_updated_at
    BEFORE UPDATE ON match_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_leaderboard_updated_at
    BEFORE UPDATE ON leaderboard
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
