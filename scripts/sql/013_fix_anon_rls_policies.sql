-- 013_fix_anon_rls_policies.sql
-- Fix: Add anon role write policies for all tables the frontend writes to.
--
-- Background: The app uses Google OAuth via GIS, NOT Supabase Auth.
-- This means the Supabase client connects with the anon key (anon role),
-- NOT the authenticated role. All existing write policies only grant to
-- authenticated/service_role, so frontend writes are silently blocked.
--
-- Run this in Supabase Dashboard > SQL Editor.
-- Safe to run multiple times (uses DROP IF EXISTS before each CREATE).

-- =====================================================
-- ADMIN-WRITABLE TABLES (admin check done in app code)
-- =====================================================

-- match_config: Admin updates config, inserts new configs
DROP POLICY IF EXISTS "Anon manage match_config" ON match_config;
CREATE POLICY "Anon manage match_config"
    ON match_config FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- side_bets: Admin sets correct_answer during scoring
DROP POLICY IF EXISTS "Anon manage side_bets" ON side_bets;
CREATE POLICY "Anon manage side_bets"
    ON side_bets FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- player_slots: Admin manages slot multipliers
DROP POLICY IF EXISTS "Anon manage player_slots" ON player_slots;
CREATE POLICY "Anon manage player_slots"
    ON player_slots FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- player_match_stats: Admin enters player stats after match
DROP POLICY IF EXISTS "Anon manage player_match_stats" ON player_match_stats;
CREATE POLICY "Anon manage player_match_stats"
    ON player_match_stats FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- long_term_bets_config: Admin manages tournament bet config
DROP POLICY IF EXISTS "Anon manage long_term_bets_config" ON long_term_bets_config;
CREATE POLICY "Anon manage long_term_bets_config"
    ON long_term_bets_config FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- USER-WRITABLE TABLES
-- =====================================================

-- long_term_bets: Users submit tournament predictions
DROP POLICY IF EXISTS "Anon insert long_term_bets" ON long_term_bets;
CREATE POLICY "Anon insert long_term_bets"
    ON long_term_bets FOR INSERT
    TO anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Anon update long_term_bets" ON long_term_bets;
CREATE POLICY "Anon update long_term_bets"
    ON long_term_bets FOR UPDATE
    TO anon
    USING (true);

-- =====================================================
-- TABLES THAT MAY NOT HAVE RLS ENABLED YET
-- Enable RLS + add policies for each.
-- =====================================================

-- match_results: Admin saves match outcomes
DO $$ BEGIN
    ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DROP POLICY IF EXISTS "Public read match_results" ON match_results;
CREATE POLICY "Public read match_results"
    ON match_results FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Anon manage match_results" ON match_results;
CREATE POLICY "Anon manage match_results"
    ON match_results FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages match_results" ON match_results;
CREATE POLICY "Service role manages match_results"
    ON match_results FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- match_questions: Admin manages questions
DO $$ BEGIN
    ALTER TABLE match_questions ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DROP POLICY IF EXISTS "Public read match_questions" ON match_questions;
CREATE POLICY "Public read match_questions"
    ON match_questions FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Anon manage match_questions" ON match_questions;
CREATE POLICY "Anon manage match_questions"
    ON match_questions FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages match_questions" ON match_questions;
CREATE POLICY "Service role manages match_questions"
    ON match_questions FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- users: Frontend saves user profile on sign-in
DROP POLICY IF EXISTS "Anon manage users" ON users;
CREATE POLICY "Anon manage users"
    ON users FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- leaderboard: Scoring RPC updates, frontend reads
DO $$ BEGIN
    ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DROP POLICY IF EXISTS "Public read leaderboard" ON leaderboard;
CREATE POLICY "Public read leaderboard"
    ON leaderboard FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Anon manage leaderboard" ON leaderboard;
CREATE POLICY "Anon manage leaderboard"
    ON leaderboard FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages leaderboard" ON leaderboard;
CREATE POLICY "Service role manages leaderboard"
    ON leaderboard FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- bets: Users submit/update bets, admin locks
DO $$ BEGIN
    ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DROP POLICY IF EXISTS "Public read bets" ON bets;
CREATE POLICY "Public read bets"
    ON bets FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Anon manage bets" ON bets;
CREATE POLICY "Anon manage bets"
    ON bets FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages bets" ON bets;
CREATE POLICY "Service role manages bets"
    ON bets FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- groups: Users create groups
DO $$ BEGIN
    ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DROP POLICY IF EXISTS "Public read groups" ON groups;
CREATE POLICY "Public read groups"
    ON groups FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Anon manage groups" ON groups;
CREATE POLICY "Anon manage groups"
    ON groups FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages groups" ON groups;
CREATE POLICY "Service role manages groups"
    ON groups FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- group_members: Users join groups
DO $$ BEGIN
    ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DROP POLICY IF EXISTS "Public read group_members" ON group_members;
CREATE POLICY "Public read group_members"
    ON group_members FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Anon manage group_members" ON group_members;
CREATE POLICY "Anon manage group_members"
    ON group_members FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages group_members" ON group_members;
CREATE POLICY "Service role manages group_members"
    ON group_members FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- FIX: Add unique constraint on bets(user_id, match_id)
-- Safety net to prevent duplicate bets per user per match.
-- =====================================================
DO $$ BEGIN
    ALTER TABLE bets ADD CONSTRAINT bets_user_match_unique UNIQUE (user_id, match_id);
EXCEPTION WHEN duplicate_table THEN
    NULL;
WHEN duplicate_object THEN
    NULL;
END $$;

-- =====================================================
-- FUNCTION PERMISSIONS
-- =====================================================

-- Ensure anon can execute the scoring RPC
GRANT EXECUTE ON FUNCTION calculate_match_scores(TEXT, TEXT) TO anon;
