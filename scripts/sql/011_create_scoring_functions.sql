-- 011_create_scoring_functions.sql
-- Updated scoring functions for the complete betting system

-- =====================================================
-- FUNCTION: Calculate player fantasy points from stats
-- =====================================================
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

    IF v_stat IS NULL THEN
        RETURN 0;
    END IF;

    -- Batting: 1 point per run
    v_points := v_points + COALESCE(v_stat.runs, 0);

    -- Fours: 10 points each
    v_points := v_points + (COALESCE(v_stat.fours, 0) * 10);

    -- Sixes: 20 points each
    v_points := v_points + (COALESCE(v_stat.sixes, 0) * 20);

    -- Strike Rate: SR value directly as points (rounded)
    IF COALESCE(v_stat.balls_faced, 0) > 0 THEN
        v_points := v_points + ROUND(COALESCE(v_stat.strike_rate, 0))::INT;
    END IF;

    -- Wickets: 20 points each
    v_points := v_points + (COALESCE(v_stat.wickets, 0) * 20);

    -- Economy Rate (only if bowled at least 1 over)
    IF COALESCE(v_stat.overs_bowled, 0) > 0 THEN
        IF v_stat.economy_rate <= 6 THEN
            v_points := v_points + 100;
        ELSIF v_stat.economy_rate <= 8 THEN
            v_points := v_points + 50;
        ELSIF v_stat.economy_rate <= 10 THEN
            v_points := v_points + 25;
        -- Economy > 10 = 0 points
        END IF;
    END IF;

    -- Fielding: 5 points each
    v_points := v_points + (COALESCE(v_stat.catches, 0) * 5);
    v_points := v_points + (COALESCE(v_stat.run_outs, 0) * 5);
    v_points := v_points + (COALESCE(v_stat.stumpings, 0) * 5);

    -- Bonuses: 200 points each
    IF v_stat.has_century THEN v_points := v_points + 200; END IF;
    IF v_stat.has_five_wicket_haul THEN v_points := v_points + 200; END IF;
    IF v_stat.has_hat_trick THEN v_points := v_points + 200; END IF;
    IF v_stat.is_man_of_match THEN v_points := v_points + 200; END IF;

    -- Update the record with calculated points
    UPDATE player_match_stats
    SET total_fantasy_points = v_points
    WHERE stat_id = p_stat_id;

    RETURN v_points;
END;
$$;

-- =====================================================
-- FUNCTION: Calculate all player fantasy points for a match
-- =====================================================
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
    FOR v_stat IN
        SELECT stat_id FROM player_match_stats WHERE match_id = p_match_id
    LOOP
        v_pts := calculate_player_fantasy_points(v_stat.stat_id);
        v_count := v_count + 1;
        v_total := v_total + v_pts;
    END LOOP;

    RETURN json_build_object(
        'success', true,
        'playersScored', v_count,
        'totalFantasyPoints', v_total
    );
END;
$$;

-- =====================================================
-- FUNCTION: Complete match scoring (v2)
-- Scores WINNER, TOTAL_RUNS, PLAYER_PICKS, SIDE_BETS, RUNNERS
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
                    -- The correct_answer should already be set on the question
                    -- via admin, or we derive from match_results.winner
                    IF v_match_result.winner IS NOT NULL THEN
                        -- Check if user's option matches the winner
                        -- Options are stored as [{optionId, label}]
                        -- We need to check if the selected optionId maps to the winner
                        DECLARE
                            v_opt JSONB;
                            v_is_correct BOOLEAN := false;
                            v_is_super_over BOOLEAN := false;
                        BEGIN
                            -- Check each option to find what the user picked
                            FOR v_opt IN SELECT * FROM jsonb_array_elements(v_question.options)
                            LOOP
                                IF v_opt ->> 'optionId' = v_user_answer THEN
                                    -- Check if this option matches the winner
                                    IF v_opt ->> 'optionId' = v_match_result.winner
                                       OR v_opt ->> 'label' = v_match_result.winner
                                       OR v_opt ->> 'referenceId' = v_match_result.winner THEN
                                        v_is_correct := true;
                                    END IF;
                                    -- Check for super over
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
    -- 5. RUNNER SCORING (second pass — all own scores are now set)
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
        -- Get display name
        SELECT display_name INTO v_user_display_name
        FROM leaderboard
        WHERE user_id = v_bet.user_id AND event_id = p_event_id;

        IF v_user_display_name IS NULL THEN
            -- Try user_profiles table
            SELECT display_name INTO v_user_display_name
            FROM user_profiles
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
-- FUNCTION: Score long-term bets for an event
-- =====================================================
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

    FOR v_bet IN
        SELECT * FROM long_term_bets WHERE event_id = p_event_id AND is_scored = false
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

        -- Update the bet
        UPDATE long_term_bets SET
            is_scored = true,
            total_points = v_points,
            points_breakdown = v_breakdown,
            updated_at = NOW()
        WHERE bet_id = v_bet.bet_id;

        -- Update leaderboard
        UPDATE leaderboard SET
            total_score = total_score + v_points,
            updated_at = NOW()
        WHERE user_id = v_bet.user_id::UUID AND event_id = p_event_id;

        v_bets_scored := v_bets_scored + 1;
        v_total_points := v_total_points + v_points;
    END LOOP;

    -- Re-rank leaderboard
    PERFORM update_leaderboard_ranks(p_event_id);

    RETURN json_build_object(
        'success', true,
        'betsScored', v_bets_scored,
        'totalPoints', v_total_points
    );
END;
$$;

-- =====================================================
-- TRIGGER: Auto-update updated_at on match_config
-- =====================================================
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
    FOR EACH ROW
    EXECUTE FUNCTION update_match_config_timestamp();

-- Trigger for long_term_bets_config
DROP TRIGGER IF EXISTS update_ltc_updated_at ON long_term_bets_config;
CREATE TRIGGER update_ltc_updated_at
    BEFORE UPDATE ON long_term_bets_config
    FOR EACH ROW
    EXECUTE FUNCTION update_match_config_timestamp();

-- Trigger for long_term_bets
DROP TRIGGER IF EXISTS update_lt_updated_at ON long_term_bets;
CREATE TRIGGER update_lt_updated_at
    BEFORE UPDATE ON long_term_bets
    FOR EACH ROW
    EXECUTE FUNCTION update_match_config_timestamp();
