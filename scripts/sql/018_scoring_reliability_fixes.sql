-- 018_scoring_reliability_fixes.sql
-- SCORING RELIABILITY FIXES — Phase 2 of the technical audit
--
-- This migration fixes 5 scoring bugs:
--   1. Runner scoring accumulation bug (overwrites instead of summing)
--   2. Leaderboard erases long-term bet points on match scoring
--   3. Side bet double-counting when both side_bets and match_questions have entries
--   4. Long-term scoring is not idempotent (filters is_scored=false, increments leaderboard)
--   5. Invalid UUID in player_picks crashes entire RPC
--
-- SAFE TO RE-RUN: Uses CREATE OR REPLACE.
-- SUPERSEDES: 017_fix_player_picks_scoring.sql (for calculate_match_scores)
--             011_create_scoring_functions.sql (for calculate_long_term_scores)

-- =====================================================
-- FUNCTION: calculate_match_scores (fixes #1, #2, #3, #5)
-- =====================================================
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
    v_runner_pick JSONB;
    v_match_result match_results%ROWTYPE;

    v_score INT;
    v_winner_points INT;
    v_total_runs_points INT;
    v_player_pick_points INT;
    v_side_bet_points INT;
    v_runner_points INT;
    v_single_runner_score INT;  -- FIX #1: separate variable for each runner

    v_distance INT;
    v_base_points INT;

    v_bets_scored INT := 0;
    v_total_points_all INT := 0;

    v_user_display_name TEXT;

    v_has_side_bets BOOLEAN;  -- FIX #3: guard for double-counting
BEGIN
    -- Get match config (use defaults if not configured)
    SELECT * INTO v_config FROM match_config WHERE match_id = p_match_id;

    -- Get match results
    SELECT * INTO v_match_result FROM match_results WHERE match_id = p_match_id;

    IF v_match_result IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'No match results found');
    END IF;

    -- FIX #3: Check if side_bets table has entries for this match
    SELECT EXISTS(
        SELECT 1 FROM side_bets WHERE match_id = p_match_id AND correct_answer IS NOT NULL
    ) INTO v_has_side_bets;

    -- First pass: score all bets EXCEPT runner points
    FOR v_bet IN
        SELECT * FROM bets WHERE match_id = p_match_id
    LOOP
        v_winner_points := 0;
        v_total_runs_points := 0;
        v_player_pick_points := 0;
        v_side_bet_points := 0;
        v_runner_points := 0;

        -- =========================================
        -- 1. WINNER SCORING (from match_questions)
        -- =========================================
        FOR v_question IN
            SELECT * FROM match_questions
            WHERE match_id = p_match_id AND kind = 'WINNER' AND status != 'disabled'
        LOOP
            IF v_bet.answers ? v_question.question_id THEN
                DECLARE
                    v_user_answer TEXT;
                    v_correct_answer TEXT;
                    v_winner_base INT;
                BEGIN
                    v_user_answer := v_bet.answers ->> v_question.question_id;
                    v_winner_base := COALESCE(v_config.winner_base_points, v_question.points);

                    IF v_match_result.winner IS NOT NULL THEN
                        DECLARE
                            v_opt JSONB;
                            v_is_correct BOOLEAN := false;
                            v_is_super_over BOOLEAN := false;
                            v_opt_id TEXT;
                            v_opt_id_normalized TEXT;
                            v_user_answer_normalized TEXT;
                            v_winner_normalized TEXT;
                        BEGIN
                            v_user_answer_normalized := REPLACE(LOWER(v_user_answer), '_', '');
                            v_winner_normalized := REPLACE(LOWER(v_match_result.winner), '_', '');

                            FOR v_opt IN SELECT * FROM jsonb_array_elements(v_question.options)
                            LOOP
                                v_opt_id := v_opt ->> 'optionId';
                                v_opt_id_normalized := REPLACE(LOWER(v_opt_id), '_', '');

                                IF v_opt_id_normalized = v_user_answer_normalized THEN
                                    IF v_opt_id_normalized = v_winner_normalized
                                       OR REPLACE(LOWER(COALESCE(v_opt ->> 'label', '')), '_', '') = v_winner_normalized
                                       OR REPLACE(LOWER(COALESCE(v_opt ->> 'referenceId', '')), '_', '') = v_winner_normalized THEN
                                        v_is_correct := true;
                                    END IF;
                                    IF v_opt_id_normalized LIKE '%superover%'
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
                            ELSE
                                -- Wrong answer: apply penalty (default 0 for backward compat)
                                v_winner_points := COALESCE(v_config.winner_wrong_points, 0);
                            END IF;
                        END;
                    END IF;
                END;
            END IF;
        END LOOP;

        -- =========================================
        -- 2. TOTAL RUNS SCORING (from match_questions)
        -- =========================================
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

        -- =========================================
        -- 3. PLAYER PICKS SCORING (single aggregate query)
        --    FIX #5: UUID validation filter added
        -- =========================================
        IF v_bet.player_picks IS NOT NULL AND v_bet.player_picks != '[]'::JSONB THEN
            SELECT COALESCE(SUM(
                ROUND(pms.total_fantasy_points * ps.multiplier)::INT
            ), 0)
            INTO v_player_pick_points
            FROM jsonb_array_elements(v_bet.player_picks) AS pick
            JOIN player_slots ps
                ON ps.match_id = p_match_id
                AND ps.slot_number = (pick ->> 'slot')::INT
                AND ps.is_enabled = true
            JOIN player_match_stats pms
                ON pms.match_id = p_match_id
                AND pms.player_id = (pick ->> 'player_id')::UUID
            WHERE (pick ->> 'player_id') ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
        END IF;

        -- =========================================
        -- 4. SIDE BETS SCORING
        --    FIX #3: Only one source of side bets is used
        -- =========================================

        -- Loop A: Score from side_bets table (V2 format)
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

        -- Loop B: Score from match_questions (V1 format)
        -- FIX #3: ONLY if no side_bets exist for this match (prevents double-counting)
        IF NOT v_has_side_bets THEN
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
        END IF;

        -- Calculate own total (without runners)
        v_score := v_winner_points + v_total_runs_points + v_player_pick_points + v_side_bet_points;

        -- Update bet with own score (runner points added in second pass)
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

    -- =========================================
    -- 5. RUNNER SCORING (second pass — all own scores are now set)
    --    FIX #1: Use separate variable, accumulate instead of overwrite
    -- =========================================
    FOR v_bet IN
        SELECT * FROM bets WHERE match_id = p_match_id
    LOOP
        v_runner_points := 0;

        IF v_bet.runner_picks IS NOT NULL AND v_bet.runner_picks != '[]'::JSONB THEN
            FOR v_runner_pick IN SELECT * FROM jsonb_array_elements(v_bet.runner_picks)
            LOOP
                -- FIX #1: SELECT INTO separate variable, then accumulate
                SELECT score INTO v_single_runner_score
                FROM bets
                WHERE match_id = p_match_id
                  AND user_id::TEXT = v_runner_pick ->> 'user_id'
                LIMIT 1;

                v_runner_points := v_runner_points + COALESCE(v_single_runner_score, 0);
            END LOOP;
        END IF;

        IF v_runner_points > 0 THEN
            UPDATE bets SET
                runner_points = v_runner_points,
                score = score + v_runner_points
            WHERE bet_id = v_bet.bet_id;
        END IF;
    END LOOP;

    -- =========================================
    -- 6. UPDATE LEADERBOARD (IDEMPOTENT — recalculates from bet scores)
    --    FIX #2: Include long-term bet points in total
    -- =========================================
    FOR v_bet IN
        SELECT b.user_id, b.score
        FROM bets b
        WHERE b.match_id = p_match_id
    LOOP
        DECLARE
            v_user_total INT;
            v_user_matches INT;
            v_long_term_total INT;
        BEGIN
            -- Sum all match bet scores
            SELECT COALESCE(SUM(score), 0), COUNT(*)
            INTO v_user_total, v_user_matches
            FROM bets
            WHERE user_id = v_bet.user_id AND score IS NOT NULL;

            -- FIX #2: Add long-term bet points
            SELECT COALESCE(SUM(total_points), 0)
            INTO v_long_term_total
            FROM long_term_bets
            WHERE user_id = v_bet.user_id::TEXT AND is_scored = true;

            v_user_total := v_user_total + v_long_term_total;

            SELECT display_name INTO v_user_display_name
            FROM leaderboard
            WHERE user_id = v_bet.user_id AND event_id = p_event_id;

            IF v_user_display_name IS NULL THEN
                SELECT display_name INTO v_user_display_name
                FROM users
                WHERE user_id = v_bet.user_id::TEXT;
            END IF;

            INSERT INTO leaderboard (event_id, user_id, display_name, total_score, matches_played, last_match_score)
            VALUES (p_event_id, v_bet.user_id, COALESCE(v_user_display_name, 'Player'), v_user_total, v_user_matches, v_bet.score)
            ON CONFLICT (event_id, user_id)
            DO UPDATE SET
                total_score = EXCLUDED.total_score,
                matches_played = EXCLUDED.matches_played,
                last_match_score = EXCLUDED.last_match_score,
                updated_at = NOW();
        END;

        v_total_points_all := v_total_points_all + COALESCE(v_bet.score, 0);
    END LOOP;

    PERFORM update_leaderboard_ranks(p_event_id);

    UPDATE match_config SET status = 'SCORED', updated_at = NOW()
    WHERE match_id = p_match_id;

    RETURN json_build_object(
        'success', true,
        'betsScored', v_bets_scored,
        'totalPoints', v_total_points_all
    );
END;
$$;


-- =====================================================
-- FUNCTION: calculate_long_term_scores (FIX #4 — IDEMPOTENT)
-- =====================================================
-- REPLACES: 011_create_scoring_functions.sql version
-- KEY CHANGE: Processes ALL bets (not just is_scored=false),
--   OVERWRITES total_points (not increments),
--   RECALCULATES leaderboard from SUM (not increments).
--
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

    -- FIX #4: Process ALL bets, not just is_scored = false
    FOR v_bet IN
        SELECT * FROM long_term_bets WHERE event_id = p_event_id
    LOOP
        v_points := 0;
        v_breakdown := '{}'::JSONB;

        -- 1. Tournament Winner
        IF v_bet.winner_team IS NOT NULL AND v_config.actual_winner IS NOT NULL THEN
            IF UPPER(v_bet.winner_team) = UPPER(v_config.actual_winner) THEN
                v_points := v_points + COALESCE(v_config.winner_points, 0);
                v_breakdown := v_breakdown || jsonb_build_object('winner', v_config.winner_points);
            ELSE
                v_breakdown := v_breakdown || jsonb_build_object('winner', 0);
            END IF;
        END IF;

        -- 2. Finalists (per correct team)
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

        -- 3. Final Four (per correct team)
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

        -- 4. Orange Cap (per correct pick)
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

        -- 5. Purple Cap (per correct pick)
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

        -- FIX #4: OVERWRITE total_points (not increment)
        UPDATE long_term_bets SET
            is_scored = true,
            total_points = v_points,
            points_breakdown = v_breakdown,
            updated_at = NOW()
        WHERE bet_id = v_bet.bet_id;

        v_bets_scored := v_bets_scored + 1;
        v_total_points := v_total_points + v_points;
    END LOOP;

    -- FIX #4: RECALCULATE leaderboard from source data (not increment)
    -- Update all leaderboard entries that have long-term bets
    UPDATE leaderboard lb
    SET total_score = COALESCE(
        (SELECT SUM(score) FROM bets WHERE user_id = lb.user_id AND score IS NOT NULL), 0
    ) + COALESCE(
        (SELECT SUM(total_points) FROM long_term_bets WHERE user_id = lb.user_id::TEXT AND is_scored = true), 0
    ),
    updated_at = NOW()
    WHERE event_id = p_event_id
    AND EXISTS (SELECT 1 FROM long_term_bets WHERE user_id = lb.user_id::TEXT AND event_id = p_event_id);

    -- Re-rank leaderboard
    PERFORM update_leaderboard_ranks(p_event_id);

    RETURN json_build_object(
        'success', true,
        'betsScored', v_bets_scored,
        'totalPoints', v_total_points
    );
END;
$$;
