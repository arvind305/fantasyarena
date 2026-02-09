-- 010_create_rls_policies.sql
-- Row Level Security policies for new tables

-- =====================================================
-- SQUADS: Public read (everyone can see team rosters)
-- =====================================================
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read squads"
    ON squads FOR SELECT
    USING (true);

CREATE POLICY "Service role manages squads"
    ON squads FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- PLAYERS: Public read (everyone can see players)
-- =====================================================
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read players"
    ON players FOR SELECT
    USING (true);

CREATE POLICY "Service role manages players"
    ON players FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- MATCH_CONFIG: Public read, admin write via service role
-- =====================================================
ALTER TABLE match_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read match_config"
    ON match_config FOR SELECT
    USING (true);

CREATE POLICY "Service role manages match_config"
    ON match_config FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Authenticated users can also update (admin check done in app)
CREATE POLICY "Authenticated update match_config"
    ON match_config FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated insert match_config"
    ON match_config FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- =====================================================
-- PLAYER_SLOTS: Public read
-- =====================================================
ALTER TABLE player_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read player_slots"
    ON player_slots FOR SELECT
    USING (true);

CREATE POLICY "Service role manages player_slots"
    ON player_slots FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated manage player_slots"
    ON player_slots FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- SIDE_BETS: Public read, admin manages
-- =====================================================
ALTER TABLE side_bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read side_bets"
    ON side_bets FOR SELECT
    USING (true);

CREATE POLICY "Service role manages side_bets"
    ON side_bets FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated manage side_bets"
    ON side_bets FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- PLAYER_MATCH_STATS: Public read
-- =====================================================
ALTER TABLE player_match_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read player_match_stats"
    ON player_match_stats FOR SELECT
    USING (true);

CREATE POLICY "Service role manages player_match_stats"
    ON player_match_stats FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated manage player_match_stats"
    ON player_match_stats FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- LONG_TERM_BETS_CONFIG: Public read
-- =====================================================
ALTER TABLE long_term_bets_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read long_term_bets_config"
    ON long_term_bets_config FOR SELECT
    USING (true);

CREATE POLICY "Service role manages long_term_bets_config"
    ON long_term_bets_config FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated manage long_term_bets_config"
    ON long_term_bets_config FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- LONG_TERM_BETS: Users see all (for transparency), write own
-- =====================================================
ALTER TABLE long_term_bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read long_term_bets"
    ON long_term_bets FOR SELECT
    USING (true);

CREATE POLICY "Users insert own long_term_bets"
    ON long_term_bets FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users update own long_term_bets"
    ON long_term_bets FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Service role manages long_term_bets"
    ON long_term_bets FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
