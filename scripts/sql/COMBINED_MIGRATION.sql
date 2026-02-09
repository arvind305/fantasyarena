-- =====================================================
-- COMBINED MIGRATION: Complete Betting System
-- Run this entire script in Supabase SQL Editor
-- =====================================================
-- Created: 2026-02-09
-- Description: Creates all new tables, indexes, RLS policies,
--              and scoring functions for the expanded betting system.
-- =====================================================

BEGIN;

-- =====================================================
-- 001: SQUADS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS squads (
    squad_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL DEFAULT 't20wc_2026',
    team_code TEXT NOT NULL,
    team_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, team_code)
);

-- =====================================================
-- 002: PLAYERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS players (
    player_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES squads(squad_id) ON DELETE CASCADE,
    player_name TEXT NOT NULL,
    player_role TEXT,
    is_captain BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 003: MATCH CONFIG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS match_config (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id VARCHAR(100) NOT NULL UNIQUE,
    event_id TEXT NOT NULL DEFAULT 't20wc_2026',
    winner_base_points INT DEFAULT 1000,
    super_over_multiplier DECIMAL(5,2) DEFAULT 5,
    total_runs_base_points INT DEFAULT 1000,
    player_slots_enabled BOOLEAN DEFAULT true,
    player_slot_count INT DEFAULT 3,
    runners_enabled BOOLEAN DEFAULT false,
    runner_count INT DEFAULT 0,
    lock_time TIMESTAMPTZ,
    team_a TEXT,
    team_b TEXT,
    status TEXT DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 004: PLAYER SLOTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS player_slots (
    slot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id VARCHAR(100) NOT NULL,
    slot_number INT NOT NULL,
    multiplier DECIMAL(10,2) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    UNIQUE(match_id, slot_number)
);

-- =====================================================
-- 005: SIDE BETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS side_bets (
    side_bet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id VARCHAR(100) NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]',
    correct_answer TEXT,
    points_correct INT NOT NULL DEFAULT 500,
    points_wrong INT DEFAULT 0,
    display_order INT DEFAULT 0,
    status TEXT DEFAULT 'OPEN',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 006: PLAYER MATCH STATS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS player_match_stats (
    stat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id VARCHAR(100) NOT NULL,
    player_id UUID NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    runs INT DEFAULT 0,
    balls_faced INT DEFAULT 0,
    fours INT DEFAULT 0,
    sixes INT DEFAULT 0,
    strike_rate DECIMAL(10,2) DEFAULT 0,
    wickets INT DEFAULT 0,
    overs_bowled DECIMAL(5,1) DEFAULT 0,
    runs_conceded INT DEFAULT 0,
    economy_rate DECIMAL(10,2) DEFAULT 0,
    catches INT DEFAULT 0,
    run_outs INT DEFAULT 0,
    stumpings INT DEFAULT 0,
    is_man_of_match BOOLEAN DEFAULT false,
    has_century BOOLEAN DEFAULT false,
    has_five_wicket_haul BOOLEAN DEFAULT false,
    has_hat_trick BOOLEAN DEFAULT false,
    total_fantasy_points INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(match_id, player_id)
);

-- =====================================================
-- 007: LONG-TERM BETS TABLES
-- =====================================================
CREATE TABLE IF NOT EXISTS long_term_bets_config (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL UNIQUE,
    winner_points INT DEFAULT 5000,
    finalist_points INT DEFAULT 2000,
    final_four_points INT DEFAULT 1000,
    orange_cap_points INT DEFAULT 3000,
    purple_cap_points INT DEFAULT 3000,
    lock_time TIMESTAMPTZ,
    is_locked BOOLEAN DEFAULT false,
    change_cost_percent DECIMAL(5,2) DEFAULT 10,
    allow_changes BOOLEAN DEFAULT false,
    actual_winner TEXT,
    actual_finalists JSONB,
    actual_final_four JSONB,
    actual_orange_cap TEXT,
    actual_purple_cap TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS long_term_bets (
    bet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    winner_team TEXT,
    finalist_teams JSONB,
    final_four_teams JSONB,
    orange_cap_players JSONB,
    purple_cap_players JSONB,
    is_scored BOOLEAN DEFAULT false,
    total_points INT DEFAULT 0,
    points_breakdown JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- =====================================================
-- 008: ALTER BETS TABLE
-- =====================================================
ALTER TABLE bets ADD COLUMN IF NOT EXISTS player_picks JSONB DEFAULT '[]';
ALTER TABLE bets ADD COLUMN IF NOT EXISTS runner_picks JSONB DEFAULT '[]';
ALTER TABLE bets ADD COLUMN IF NOT EXISTS side_bet_answers JSONB DEFAULT '{}';
ALTER TABLE bets ADD COLUMN IF NOT EXISTS winner_points INT DEFAULT 0;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS total_runs_points INT DEFAULT 0;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS player_pick_points INT DEFAULT 0;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS runner_points INT DEFAULT 0;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS side_bet_points INT DEFAULT 0;

-- =====================================================
-- 009: INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_players_squad ON players(squad_id);
CREATE INDEX IF NOT EXISTS idx_players_role ON players(player_role);
CREATE INDEX IF NOT EXISTS idx_players_active ON players(is_active);
CREATE INDEX IF NOT EXISTS idx_player_slots_match ON player_slots(match_id);
CREATE INDEX IF NOT EXISTS idx_player_slots_match_slot ON player_slots(match_id, slot_number);
CREATE INDEX IF NOT EXISTS idx_side_bets_match ON side_bets(match_id);
CREATE INDEX IF NOT EXISTS idx_side_bets_status ON side_bets(status);
CREATE INDEX IF NOT EXISTS idx_side_bets_match_order ON side_bets(match_id, display_order);
CREATE INDEX IF NOT EXISTS idx_player_stats_match ON player_match_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_player ON player_match_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_match_player ON player_match_stats(match_id, player_id);
CREATE INDEX IF NOT EXISTS idx_long_term_bets_event ON long_term_bets(event_id);
CREATE INDEX IF NOT EXISTS idx_long_term_bets_user ON long_term_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_long_term_bets_event_user ON long_term_bets(event_id, user_id);
CREATE INDEX IF NOT EXISTS idx_match_config_event ON match_config(event_id);
CREATE INDEX IF NOT EXISTS idx_match_config_status ON match_config(status);

-- =====================================================
-- 010: ROW LEVEL SECURITY
-- =====================================================

-- SQUADS
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Public read squads" ON squads FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Service role manages squads" ON squads FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- PLAYERS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Public read players" ON players FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Service role manages players" ON players FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- MATCH_CONFIG
ALTER TABLE match_config ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Public read match_config" ON match_config FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Service role manages match_config" ON match_config FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Authenticated update match_config" ON match_config FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Authenticated insert match_config" ON match_config FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- PLAYER_SLOTS
ALTER TABLE player_slots ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Public read player_slots" ON player_slots FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Authenticated manage player_slots" ON player_slots FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- SIDE_BETS
ALTER TABLE side_bets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Public read side_bets" ON side_bets FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Authenticated manage side_bets" ON side_bets FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- PLAYER_MATCH_STATS
ALTER TABLE player_match_stats ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Public read player_match_stats" ON player_match_stats FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Authenticated manage player_match_stats" ON player_match_stats FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- LONG_TERM_BETS_CONFIG
ALTER TABLE long_term_bets_config ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Public read long_term_bets_config" ON long_term_bets_config FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Authenticated manage long_term_bets_config" ON long_term_bets_config FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- LONG_TERM_BETS
ALTER TABLE long_term_bets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Public read long_term_bets" ON long_term_bets FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Users insert own long_term_bets" ON long_term_bets FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
    CREATE POLICY "Users update own long_term_bets" ON long_term_bets FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- 011: SCORING FUNCTIONS
-- =====================================================

-- Calculate player fantasy points from stats
CREATE OR REPLACE FUNCTION calculate_player_fantasy_points(p_stat_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stat player_match_stats%ROWTYPE;
    v_points INT := 0;
BEGIN
    SELECT * INTO v_stat FROM player_match_stats WHERE stat_id = p_stat_id;
    IF v_stat IS NULL THEN RETURN 0; END IF;

    v_points := v_points + COALESCE(v_stat.runs, 0);
    v_points := v_points + (COALESCE(v_stat.fours, 0) * 10);
    v_points := v_points + (COALESCE(v_stat.sixes, 0) * 20);
    IF COALESCE(v_stat.balls_faced, 0) > 0 THEN
        v_points := v_points + ROUND(COALESCE(v_stat.strike_rate, 0))::INT;
    END IF;
    v_points := v_points + (COALESCE(v_stat.wickets, 0) * 20);
    IF COALESCE(v_stat.overs_bowled, 0) > 0 THEN
        IF v_stat.economy_rate <= 6 THEN v_points := v_points + 100;
        ELSIF v_stat.economy_rate <= 8 THEN v_points := v_points + 50;
        ELSIF v_stat.economy_rate <= 10 THEN v_points := v_points + 25;
        END IF;
    END IF;
    v_points := v_points + (COALESCE(v_stat.catches, 0) * 5);
    v_points := v_points + (COALESCE(v_stat.run_outs, 0) * 5);
    v_points := v_points + (COALESCE(v_stat.stumpings, 0) * 5);
    IF v_stat.has_century THEN v_points := v_points + 200; END IF;
    IF v_stat.has_five_wicket_haul THEN v_points := v_points + 200; END IF;
    IF v_stat.has_hat_trick THEN v_points := v_points + 200; END IF;
    IF v_stat.is_man_of_match THEN v_points := v_points + 200; END IF;

    UPDATE player_match_stats SET total_fantasy_points = v_points WHERE stat_id = p_stat_id;
    RETURN v_points;
END;
$$;

-- Calculate all player fantasy points for a match
CREATE OR REPLACE FUNCTION calculate_all_player_points(p_match_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stat RECORD;
    v_count INT := 0;
    v_total INT := 0;
    v_pts INT;
BEGIN
    FOR v_stat IN SELECT stat_id FROM player_match_stats WHERE match_id = p_match_id
    LOOP
        v_pts := calculate_player_fantasy_points(v_stat.stat_id);
        v_count := v_count + 1;
        v_total := v_total + v_pts;
    END LOOP;

    RETURN json_build_object('success', true, 'playersScored', v_count, 'totalFantasyPoints', v_total);
END;
$$;

-- Complete match scoring function (v2)
CREATE OR REPLACE FUNCTION calculate_match_scores(p_match_id TEXT, p_event_id TEXT DEFAULT 't20wc_2026')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_bet RECORD;
    v_config match_config%ROWTYPE;
    v_question RECORD;
    v_side_bet RECORD;
    v_player_pick JSONB;
    v_runner_pick JSONB;
    v_player_stats player_match_stats%ROWTYPE;
    v_match_result match_results%ROWTYPE;

    v_score INT;
    v_winner_points INT;
    v_total_runs_points INT;
    v_player_pick_points INT;
    v_side_bet_points INT;
    v_runner_points INT;

    v_distance INT;
    v_base_points INT;
    v_multiplier DECIMAL;
    v_slot_num INT;
    v_player_id UUID;

    v_bets_scored INT := 0;
    v_total_points_all INT := 0;
    v_user_display_name TEXT;
BEGIN
    SELECT * INTO v_config FROM match_config WHERE match_id = p_match_id;
    SELECT * INTO v_match_result FROM match_results WHERE match_id = p_match_id;

    IF v_match_result IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'No match results found');
    END IF;

    -- FIRST PASS: Score all bets (own points only)
    FOR v_bet IN SELECT * FROM bets WHERE match_id = p_match_id
    LOOP
        v_winner_points := 0;
        v_total_runs_points := 0;
        v_player_pick_points := 0;
        v_side_bet_points := 0;

        -- 1. WINNER SCORING
        FOR v_question IN
            SELECT * FROM match_questions
            WHERE match_id = p_match_id AND kind = 'WINNER' AND status != 'disabled'
        LOOP
            IF v_bet.answers ? v_question.question_id THEN
                DECLARE
                    v_user_answer TEXT;
                    v_winner_base INT;
                    v_opt JSONB;
                    v_is_correct BOOLEAN := false;
                    v_is_super_over BOOLEAN := false;
                BEGIN
                    v_user_answer := v_bet.answers ->> v_question.question_id;
                    v_winner_base := COALESCE(v_config.winner_base_points, v_question.points);

                    IF v_match_result.winner IS NOT NULL THEN
                        FOR v_opt IN SELECT * FROM jsonb_array_elements(v_question.options)
                        LOOP
                            IF v_opt ->> 'optionId' = v_user_answer THEN
                                IF v_opt ->> 'optionId' = v_match_result.winner
                                   OR v_opt ->> 'label' = v_match_result.winner
                                   OR v_opt ->> 'referenceId' = v_match_result.winner THEN
                                    v_is_correct := true;
                                END IF;
                                IF LOWER(v_opt ->> 'optionId') LIKE '%super%over%'
                                   OR LOWER(v_opt ->> 'label') LIKE '%super%over%' THEN
                                    v_is_super_over := true;
                                END IF;
                            END IF;
                        END LOOP;

                        IF v_is_correct THEN
                            IF v_is_super_over THEN
                                v_winner_points := v_winner_base * COALESCE(v_config.super_over_multiplier, 5)::INT;
                            ELSE
                                v_winner_points := v_winner_base;
                            END IF;
                        END IF;
                    END IF;
                END;
            END IF;
        END LOOP;

        -- 2. TOTAL RUNS SCORING
        FOR v_question IN
            SELECT * FROM match_questions
            WHERE match_id = p_match_id AND kind = 'TOTAL_RUNS' AND status != 'disabled'
        LOOP
            IF v_bet.answers ? v_question.question_id THEN
                DECLARE
                    v_user_runs TEXT;
                    v_actual_runs INT;
                    v_runs_base INT;
                BEGIN
                    v_user_runs := v_bet.answers ->> v_question.question_id;
                    v_actual_runs := COALESCE(v_match_result.total_runs, 0);
                    v_runs_base := COALESCE(v_config.total_runs_base_points, v_question.points);

                    IF v_user_runs IS NOT NULL AND v_user_runs ~ '^\d+$' THEN
                        v_distance := ABS(v_user_runs::INT - v_actual_runs);
                        IF v_distance = 0 THEN
                            v_total_runs_points := v_runs_base * 5;
                        ELSIF v_distance = 1 THEN
                            v_total_runs_points := v_runs_base;
                        ELSIF v_distance <= 5 THEN
                            v_total_runs_points := ROUND(v_runs_base * 0.5)::INT;
                        ELSIF v_distance <= 10 THEN
                            v_total_runs_points := ROUND(v_runs_base * 0.25)::INT;
                        ELSIF v_distance <= 15 THEN
                            v_total_runs_points := ROUND(v_runs_base * 0.1)::INT;
                        ELSE
                            v_total_runs_points := 0;
                        END IF;
                    END IF;
                END;
            END IF;
        END LOOP;

        -- 3. PLAYER PICKS SCORING
        IF v_bet.player_picks IS NOT NULL AND v_bet.player_picks != '[]'::JSONB THEN
            FOR v_player_pick IN SELECT * FROM jsonb_array_elements(v_bet.player_picks)
            LOOP
                v_slot_num := (v_player_pick ->> 'slot')::INT;
                BEGIN
                    v_player_id := (v_player_pick ->> 'player_id')::UUID;
                EXCEPTION WHEN OTHERS THEN
                    v_player_id := NULL;
                END;

                IF v_player_id IS NOT NULL THEN
                    SELECT multiplier INTO v_multiplier
                    FROM player_slots
                    WHERE match_id = p_match_id AND slot_number = v_slot_num AND is_enabled = true;

                    SELECT * INTO v_player_stats
                    FROM player_match_stats
                    WHERE match_id = p_match_id AND player_id = v_player_id;

                    IF v_player_stats IS NOT NULL AND v_multiplier IS NOT NULL THEN
                        v_player_pick_points := v_player_pick_points +
                            ROUND(v_player_stats.total_fantasy_points * v_multiplier)::INT;
                    END IF;
                END IF;
            END LOOP;
        END IF;

        -- 4. SIDE BETS SCORING (from side_bets table)
        FOR v_side_bet IN
            SELECT * FROM side_bets
            WHERE match_id = p_match_id AND correct_answer IS NOT NULL
        LOOP
            IF v_bet.side_bet_answers IS NOT NULL
               AND v_bet.side_bet_answers ? v_side_bet.side_bet_id::TEXT THEN
                IF v_bet.side_bet_answers ->> v_side_bet.side_bet_id::TEXT = v_side_bet.correct_answer THEN
                    v_side_bet_points := v_side_bet_points + v_side_bet.points_correct;
                ELSE
                    v_side_bet_points := v_side_bet_points + COALESCE(v_side_bet.points_wrong, 0);
                END IF;
            END IF;
        END LOOP;

        -- Also score SIDE section from match_questions (backward compat)
        FOR v_question IN
            SELECT * FROM match_questions
            WHERE match_id = p_match_id AND section = 'SIDE' AND status != 'disabled'
        LOOP
            IF v_bet.answers ? v_question.question_id THEN
                DECLARE
                    v_sb_user_answer TEXT;
                    v_sb_correct TEXT;
                BEGIN
                    v_sb_user_answer := v_bet.answers ->> v_question.question_id;
                    v_sb_correct := v_match_result.side_bet_answers ->> v_question.question_id;

                    IF v_sb_correct IS NOT NULL AND v_sb_user_answer IS NOT NULL THEN
                        IF v_sb_user_answer = v_sb_correct THEN
                            v_side_bet_points := v_side_bet_points + COALESCE(v_question.points, 0);
                        ELSE
                            v_side_bet_points := v_side_bet_points + COALESCE(v_question.points_wrong, 0);
                        END IF;
                    END IF;
                END;
            END IF;
        END LOOP;

        v_score := v_winner_points + v_total_runs_points + v_player_pick_points + v_side_bet_points;

        UPDATE bets SET
            score = v_score,
            winner_points = v_winner_points,
            total_runs_points = v_total_runs_points,
            player_pick_points = v_player_pick_points,
            side_bet_points = v_side_bet_points,
            runner_points = 0,
            is_locked = true,
            locked_at = COALESCE(locked_at, NOW())
        WHERE bet_id = v_bet.bet_id;

        v_bets_scored := v_bets_scored + 1;
    END LOOP;

    -- SECOND PASS: Runner scoring (all own scores now set)
    FOR v_bet IN SELECT * FROM bets WHERE match_id = p_match_id
    LOOP
        v_runner_points := 0;
        IF v_bet.runner_picks IS NOT NULL AND v_bet.runner_picks != '[]'::JSONB THEN
            FOR v_runner_pick IN SELECT * FROM jsonb_array_elements(v_bet.runner_picks)
            LOOP
                DECLARE v_r_score INT := 0;
                BEGIN
                    SELECT score INTO v_r_score
                    FROM bets
                    WHERE match_id = p_match_id
                      AND user_id::TEXT = v_runner_pick ->> 'user_id'
                    LIMIT 1;
                    v_runner_points := v_runner_points + COALESCE(v_r_score, 0);
                END;
            END LOOP;
        END IF;

        IF v_runner_points != 0 THEN
            UPDATE bets SET
                runner_points = v_runner_points,
                score = score + v_runner_points
            WHERE bet_id = v_bet.bet_id;
        END IF;
    END LOOP;

    -- UPDATE LEADERBOARD
    FOR v_bet IN SELECT user_id, score FROM bets WHERE match_id = p_match_id
    LOOP
        v_user_display_name := NULL;
        SELECT display_name INTO v_user_display_name FROM leaderboard WHERE user_id = v_bet.user_id AND event_id = p_event_id;
        IF v_user_display_name IS NULL THEN
            BEGIN
                SELECT display_name INTO v_user_display_name FROM user_profiles WHERE user_id = v_bet.user_id::TEXT;
            EXCEPTION WHEN OTHERS THEN
                v_user_display_name := 'Player';
            END;
        END IF;

        INSERT INTO leaderboard (event_id, user_id, display_name, total_score, matches_played, last_match_score)
        VALUES (p_event_id, v_bet.user_id, COALESCE(v_user_display_name, 'Player'), COALESCE(v_bet.score, 0), 1, COALESCE(v_bet.score, 0))
        ON CONFLICT (event_id, user_id)
        DO UPDATE SET
            total_score = leaderboard.total_score + EXCLUDED.last_match_score,
            matches_played = leaderboard.matches_played + 1,
            last_match_score = EXCLUDED.last_match_score,
            updated_at = NOW();

        v_total_points_all := v_total_points_all + COALESCE(v_bet.score, 0);
    END LOOP;

    PERFORM update_leaderboard_ranks(p_event_id);

    UPDATE match_config SET status = 'SCORED', updated_at = NOW() WHERE match_id = p_match_id;

    RETURN json_build_object('success', true, 'betsScored', v_bets_scored, 'totalPoints', v_total_points_all);
END;
$$;

-- Long-term scoring function
CREATE OR REPLACE FUNCTION calculate_long_term_scores(p_event_id TEXT DEFAULT 't20wc_2026')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_config long_term_bets_config%ROWTYPE;
    v_bet RECORD;
    v_points INT;
    v_breakdown JSONB;
    v_bets_scored INT := 0;
    v_total_points INT := 0;
    v_team TEXT;
    v_player TEXT;
BEGIN
    SELECT * INTO v_config FROM long_term_bets_config WHERE event_id = p_event_id;
    IF v_config IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'No long-term config found');
    END IF;

    FOR v_bet IN SELECT * FROM long_term_bets WHERE event_id = p_event_id AND is_scored = false
    LOOP
        v_points := 0;
        v_breakdown := '{}'::JSONB;

        -- Winner
        IF v_bet.winner_team IS NOT NULL AND v_config.actual_winner IS NOT NULL THEN
            IF UPPER(v_bet.winner_team) = UPPER(v_config.actual_winner) THEN
                v_points := v_points + COALESCE(v_config.winner_points, 0);
                v_breakdown := v_breakdown || jsonb_build_object('winner', v_config.winner_points);
            ELSE
                v_breakdown := v_breakdown || jsonb_build_object('winner', 0);
            END IF;
        END IF;

        -- Finalists
        IF v_bet.finalist_teams IS NOT NULL AND v_config.actual_finalists IS NOT NULL THEN
            DECLARE v_finalist_pts INT := 0;
            BEGIN
                FOR v_team IN SELECT jsonb_array_elements_text(v_bet.finalist_teams)
                LOOP
                    IF v_config.actual_finalists @> to_jsonb(UPPER(v_team)) THEN
                        v_finalist_pts := v_finalist_pts + COALESCE(v_config.finalist_points, 0);
                    END IF;
                END LOOP;
                v_points := v_points + v_finalist_pts;
                v_breakdown := v_breakdown || jsonb_build_object('finalists', v_finalist_pts);
            END;
        END IF;

        -- Final Four
        IF v_bet.final_four_teams IS NOT NULL AND v_config.actual_final_four IS NOT NULL THEN
            DECLARE v_f4_pts INT := 0;
            BEGIN
                FOR v_team IN SELECT jsonb_array_elements_text(v_bet.final_four_teams)
                LOOP
                    IF v_config.actual_final_four @> to_jsonb(UPPER(v_team)) THEN
                        v_f4_pts := v_f4_pts + COALESCE(v_config.final_four_points, 0);
                    END IF;
                END LOOP;
                v_points := v_points + v_f4_pts;
                v_breakdown := v_breakdown || jsonb_build_object('final_four', v_f4_pts);
            END;
        END IF;

        -- Orange Cap
        IF v_bet.orange_cap_players IS NOT NULL AND v_config.actual_orange_cap IS NOT NULL THEN
            DECLARE v_oc_pts INT := 0;
            BEGIN
                FOR v_player IN SELECT jsonb_array_elements_text(v_bet.orange_cap_players)
                LOOP
                    IF v_player = v_config.actual_orange_cap THEN
                        v_oc_pts := v_oc_pts + COALESCE(v_config.orange_cap_points, 0);
                    END IF;
                END LOOP;
                v_points := v_points + v_oc_pts;
                v_breakdown := v_breakdown || jsonb_build_object('orange_cap', v_oc_pts);
            END;
        END IF;

        -- Purple Cap
        IF v_bet.purple_cap_players IS NOT NULL AND v_config.actual_purple_cap IS NOT NULL THEN
            DECLARE v_pc_pts INT := 0;
            BEGIN
                FOR v_player IN SELECT jsonb_array_elements_text(v_bet.purple_cap_players)
                LOOP
                    IF v_player = v_config.actual_purple_cap THEN
                        v_pc_pts := v_pc_pts + COALESCE(v_config.purple_cap_points, 0);
                    END IF;
                END LOOP;
                v_points := v_points + v_pc_pts;
                v_breakdown := v_breakdown || jsonb_build_object('purple_cap', v_pc_pts);
            END;
        END IF;

        UPDATE long_term_bets SET
            is_scored = true,
            total_points = v_points,
            points_breakdown = v_breakdown,
            updated_at = NOW()
        WHERE bet_id = v_bet.bet_id;

        UPDATE leaderboard SET
            total_score = total_score + v_points,
            updated_at = NOW()
        WHERE user_id = v_bet.user_id::UUID AND event_id = p_event_id;

        v_bets_scored := v_bets_scored + 1;
        v_total_points := v_total_points + v_points;
    END LOOP;

    PERFORM update_leaderboard_ranks(p_event_id);

    RETURN json_build_object('success', true, 'betsScored', v_bets_scored, 'totalPoints', v_total_points);
END;
$$;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_match_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_match_config_updated_at ON match_config;
CREATE TRIGGER update_match_config_updated_at
    BEFORE UPDATE ON match_config
    FOR EACH ROW EXECUTE FUNCTION update_match_config_timestamp();

DROP TRIGGER IF EXISTS update_ltc_updated_at ON long_term_bets_config;
CREATE TRIGGER update_ltc_updated_at
    BEFORE UPDATE ON long_term_bets_config
    FOR EACH ROW EXECUTE FUNCTION update_match_config_timestamp();

DROP TRIGGER IF EXISTS update_lt_updated_at ON long_term_bets;
CREATE TRIGGER update_lt_updated_at
    BEFORE UPDATE ON long_term_bets
    FOR EACH ROW EXECUTE FUNCTION update_match_config_timestamp();

COMMIT;

-- =====================================================
-- VERIFICATION: Check all tables were created
-- =====================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'squads', 'players', 'match_config', 'player_slots',
    'side_bets', 'player_match_stats', 'long_term_bets_config',
    'long_term_bets'
)
ORDER BY table_name;
