-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
-- SUPERSEDED — DO NOT APPLY
-- This file has been replaced by 018_scoring_reliability_fixes.sql
-- Applying this file will REINTRODUCE BUGS that have been fixed
-- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
--
-- fix_superover_scoring.sql
-- Fix: Normalize "superover" / "super_over" before comparing option IDs in winner scoring
--
-- PROBLEM:
--   match_questions options use "superover" (no underscore): opt_wc_m13_winner_superover
--   match_results.winner may use "super_over" (with underscore): opt_wc_m13_winner_super_over
--   Some bets may also have the underscore variant from fix-bet-formats.js
--
--   The RPC does exact string comparison on two critical lines:
--     1. v_opt.optionId = v_user_answer  (finding the user's selected option)
--     2. v_opt.optionId = v_match_result.winner  (checking if option matches the winner)
--   Both fail when the underscore format differs.
--
-- FIX APPROACH:
--   Use REPLACE(string, '_', '') to strip underscores before comparing, so both
--   "superover" and "super_over" normalize to "superover".
--   We also normalize the user answer and match_result.winner the same way.
--   This only affects the comparison — no data is modified.
--
-- ALSO FIXES:
--   The existing match_results.winner for wc_m13 ("opt_wc_m13_winner_super_over")
--   and any future results that might be saved with the underscore variant.
--   Plus any bets with underscore variant answers.
--
-- NOTE: This does NOT re-score any already-scored matches.
--       After applying this, if wc_m13 needs re-scoring, you must:
--       1. Reset the bet scores for that match
--       2. Reset the leaderboard (using fix-leaderboard.js)
--       3. Re-trigger scoring
--
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- =====================================================
-- PART 1: Fix the RPC to normalize before comparing
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
    v_player_pick JSONB;
    v_runner_pick JSONB;
    v_player_stats player_match_stats%ROWTYPE;
    v_runner_bet RECORD;
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
    -- Get match config (use defaults if not configured)
    SELECT * INTO v_config FROM match_config WHERE match_id = p_match_id;

    -- Get match results
    SELECT * INTO v_match_result FROM match_results WHERE match_id = p_match_id;

    IF v_match_result IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'No match results found');
    END IF;

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
            -- Get the user's answer for this question
            IF v_bet.answers ? v_question.question_id THEN
                DECLARE
                    v_user_answer TEXT;
                    v_correct_answer TEXT;
                    v_winner_base INT;
                BEGIN
                    v_user_answer := v_bet.answers ->> v_question.question_id;
                    v_winner_base := COALESCE(v_config.winner_base_points, v_question.points);

                    -- Determine correct answer from match_results
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
                            -- Pre-normalize: strip underscores for comparison
                            v_user_answer_normalized := REPLACE(LOWER(v_user_answer), '_', '');
                            v_winner_normalized := REPLACE(LOWER(v_match_result.winner), '_', '');

                            -- Check each option to find what the user picked
                            FOR v_opt IN SELECT * FROM jsonb_array_elements(v_question.options)
                            LOOP
                                v_opt_id := v_opt ->> 'optionId';
                                v_opt_id_normalized := REPLACE(LOWER(v_opt_id), '_', '');

                                -- FIX: Compare with underscores stripped
                                -- This handles both "superover" and "super_over" variants
                                IF v_opt_id_normalized = v_user_answer_normalized THEN
                                    -- Check if this option matches the winner
                                    -- FIX: Also normalize before comparing with match_result.winner
                                    IF v_opt_id_normalized = v_winner_normalized
                                       OR REPLACE(LOWER(COALESCE(v_opt ->> 'label', '')), '_', '') = v_winner_normalized
                                       OR REPLACE(LOWER(COALESCE(v_opt ->> 'referenceId', '')), '_', '') = v_winner_normalized THEN
                                        v_is_correct := true;
                                    END IF;
                                    -- Check for super over
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
        -- 3. PLAYER PICKS SCORING
        -- =========================================
        IF v_bet.player_picks IS NOT NULL AND v_bet.player_picks != '[]'::JSONB THEN
            FOR v_player_pick IN SELECT * FROM jsonb_array_elements(v_bet.player_picks)
            LOOP
                v_slot_num := (v_player_pick ->> 'slot')::INT;

                -- Try UUID first, fall back to text player_id
                BEGIN
                    v_player_id := (v_player_pick ->> 'player_id')::UUID;
                EXCEPTION WHEN OTHERS THEN
                    v_player_id := NULL;
                END;

                IF v_player_id IS NOT NULL THEN
                    -- Get slot multiplier
                    SELECT multiplier INTO v_multiplier
                    FROM player_slots
                    WHERE match_id = p_match_id AND slot_number = v_slot_num AND is_enabled = true;

                    -- Get player stats for this match
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

        -- =========================================
        -- 4. SIDE BETS SCORING
        -- =========================================
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

        -- Also score side bets from match_questions (SIDE section)
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
                    -- Get correct answer from match_results side_bet_answers
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
    -- 5. RUNNER SCORING (second pass -- all own scores are now set)
    -- =========================================
    FOR v_bet IN
        SELECT * FROM bets WHERE match_id = p_match_id
    LOOP
        v_runner_points := 0;

        IF v_bet.runner_picks IS NOT NULL AND v_bet.runner_picks != '[]'::JSONB THEN
            FOR v_runner_pick IN SELECT * FROM jsonb_array_elements(v_bet.runner_picks)
            LOOP
                -- Get runner's own score for this match (already calculated above)
                SELECT score INTO v_runner_points
                FROM bets
                WHERE match_id = p_match_id
                  AND user_id::TEXT = v_runner_pick ->> 'user_id'
                LIMIT 1;

                -- If runner didn't bet, their contribution is 0
                v_runner_points := COALESCE(v_runner_points, 0);
            END LOOP;
        END IF;

        -- Update final score including runners
        IF v_runner_points > 0 THEN
            UPDATE bets SET
                runner_points = v_runner_points,
                score = score + v_runner_points
            WHERE bet_id = v_bet.bet_id;
        END IF;
    END LOOP;

    -- =========================================
    -- 6. UPDATE LEADERBOARD
    -- =========================================
    FOR v_bet IN
        SELECT b.user_id, b.score, b.bet_id
        FROM bets b
        WHERE b.match_id = p_match_id
    LOOP
        -- Get display name from existing leaderboard entry
        SELECT display_name INTO v_user_display_name
        FROM leaderboard
        WHERE user_id = v_bet.user_id AND event_id = p_event_id;

        IF v_user_display_name IS NULL THEN
            -- Fall back to users table
            SELECT display_name INTO v_user_display_name
            FROM users
            WHERE user_id = v_bet.user_id::TEXT;
        END IF;

        -- Upsert leaderboard entry
        INSERT INTO leaderboard (event_id, user_id, display_name, total_score, matches_played, last_match_score)
        VALUES (p_event_id, v_bet.user_id, COALESCE(v_user_display_name, 'Player'), v_bet.score, 1, v_bet.score)
        ON CONFLICT (event_id, user_id)
        DO UPDATE SET
            total_score = leaderboard.total_score + EXCLUDED.last_match_score,
            matches_played = leaderboard.matches_played + 1,
            last_match_score = EXCLUDED.last_match_score,
            updated_at = NOW();

        v_total_points_all := v_total_points_all + COALESCE(v_bet.score, 0);
    END LOOP;

    -- Update leaderboard rankings
    PERFORM update_leaderboard_ranks(p_event_id);

    -- Update match config status
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
-- PART 2: Fix existing data inconsistencies (optional)
-- Uncomment and run these if you want to normalize the
-- data itself instead of (or in addition to) the RPC fix.
-- =====================================================

-- Fix match_results.winner: normalize "super_over" to "superover"
-- to match the match_questions option IDs
/*
UPDATE match_results
SET winner = REPLACE(winner, 'super_over', 'superover')
WHERE winner LIKE '%super\_over%';
*/

-- Fix bets.answers: normalize any "super_over" values to "superover"
-- This is trickier because answers is JSONB with question_id keys
/*
UPDATE bets
SET answers = (
    SELECT jsonb_object_agg(
        key,
        CASE
            WHEN value::text LIKE '%super\_over%'
            THEN to_jsonb(REPLACE(value::text, 'super_over', 'superover'))
            ELSE value
        END
    )
    FROM jsonb_each(answers)
)
WHERE answers::text LIKE '%super\_over%';
*/
