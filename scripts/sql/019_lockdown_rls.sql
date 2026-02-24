-- 019_lockdown_rls.sql — Lock down all RLS policies
--
-- CRITICAL SECURITY FIX: Changes all anon policies from "can do everything"
-- to "can only read". All writes must go through Vercel serverless functions
-- using the service_role key after server-side identity verification.
--
-- DO NOT APPLY until the server-side API gateway is deployed and tested.
-- After applying, verify: attempt a direct anon INSERT on leaderboard — should be denied.

-- Step 1: Drop all existing permissive policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Step 2: Create read-only policies for anon on safe tables
CREATE POLICY "anon_read_match_config" ON match_config FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_match_questions" ON match_questions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_match_results" ON match_results FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_player_slots" ON player_slots FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_side_bets" ON side_bets FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_squads" ON squads FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_players" ON players FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_player_match_stats" ON player_match_stats FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_leaderboard" ON leaderboard FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_users" ON users FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_long_term_bets_config" ON long_term_bets_config FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_groups" ON groups FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_group_members" ON group_members FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_notification_log" ON notification_log FOR SELECT TO anon USING (true);

-- Bets: anon can read all bets (post-lock visibility handled by UI)
CREATE POLICY "anon_read_bets" ON bets FOR SELECT TO anon USING (true);

-- Long-term bets: anon can read
CREATE POLICY "anon_read_long_term_bets" ON long_term_bets FOR SELECT TO anon USING (true);

-- Push subscriptions: NO public read (contains crypto keys)
-- Only service_role can read/write push_subscriptions

-- Step 3: Revoke EXECUTE on scoring functions from anon
-- These should only be callable by service_role (via admin API)
DO $$
BEGIN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION calculate_match_scores(TEXT, TEXT) FROM anon';
EXCEPTION WHEN undefined_function THEN NULL;
END $$;
DO $$
BEGIN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION calculate_long_term_scores(TEXT) FROM anon';
EXCEPTION WHEN undefined_function THEN NULL;
END $$;

-- Step 4: Add bet lock enforcement trigger
-- Prevents writes to bets table when match is not OPEN or past lock_time
CREATE OR REPLACE FUNCTION enforce_bet_lock()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow service_role to bypass (for scoring updates)
    IF current_setting('role', true) = 'service_role' THEN
        RETURN NEW;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM match_config
        WHERE match_id = NEW.match_id
        AND status = 'OPEN'
        AND lock_time > NOW()
    ) THEN
        RAISE EXCEPTION 'Betting is closed for this match';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_bet_lock ON bets;
CREATE TRIGGER trg_enforce_bet_lock
    BEFORE INSERT OR UPDATE ON bets
    FOR EACH ROW
    EXECUTE FUNCTION enforce_bet_lock();
