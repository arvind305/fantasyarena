-- Fantasy Sports Game - Admin Scoring Function
-- This function allows scoring bets from the admin panel.
-- It should be called with the service role key or from an Edge Function.

-- Drop existing function if exists
DROP FUNCTION IF EXISTS calculate_match_scores(VARCHAR, VARCHAR, JSONB);

-- Create the scoring function
CREATE OR REPLACE FUNCTION calculate_match_scores(
    p_match_id VARCHAR,
    p_event_id VARCHAR,
    p_match_result JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_bets_scored INTEGER := 0;
    v_total_points BIGINT := 0;
    v_bet RECORD;
    v_question RECORD;
    v_bet_score INTEGER;
    v_answer TEXT;
    v_correct_answer TEXT;
    v_match_result RECORD;
    v_result JSONB;
BEGIN
    -- Get match result from table or parameter
    IF p_match_result IS NOT NULL THEN
        v_match_result := p_match_result;
    ELSE
        SELECT * INTO v_match_result
        FROM match_results
        WHERE match_id = p_match_id;

        IF NOT FOUND THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Match results not found. Please save results first.'
            );
        END IF;
    END IF;

    -- Lock all bets for this match first
    UPDATE bets
    SET is_locked = true, locked_at = NOW()
    WHERE match_id = p_match_id AND is_locked = false;

    -- Process each locked bet
    FOR v_bet IN
        SELECT * FROM bets
        WHERE match_id = p_match_id AND is_locked = true
    LOOP
        v_bet_score := 0;

        -- Score each question
        FOR v_question IN
            SELECT * FROM match_questions
            WHERE match_id = p_match_id
              AND status = 'active'
              AND disabled = false
        LOOP
            -- Get user's answer for this question
            v_answer := v_bet.answers->>v_question.question_id;

            IF v_answer IS NOT NULL THEN
                -- Score based on question kind
                CASE v_question.kind
                    WHEN 'WINNER' THEN
                        -- Check if user picked the winner correctly
                        IF v_answer = v_match_result.winner THEN
                            v_bet_score := v_bet_score + COALESCE(v_question.points, 0);
                        END IF;

                    WHEN 'TOTAL_RUNS' THEN
                        -- Distance-based scoring
                        DECLARE
                            v_predicted INTEGER := v_answer::INTEGER;
                            v_actual INTEGER := COALESCE(v_match_result.total_runs, 0);
                            v_distance INTEGER := ABS(v_predicted - v_actual);
                            v_max_points INTEGER := COALESCE(v_question.points, 0);
                        BEGIN
                            IF v_distance = 0 THEN
                                v_bet_score := v_bet_score + v_max_points; -- 100%
                            ELSIF v_distance <= 10 THEN
                                v_bet_score := v_bet_score + (v_max_points * 75 / 100); -- 75%
                            ELSIF v_distance <= 25 THEN
                                v_bet_score := v_bet_score + (v_max_points * 50 / 100); -- 50%
                            ELSIF v_distance <= 50 THEN
                                v_bet_score := v_bet_score + (v_max_points * 25 / 100); -- 25%
                            -- Beyond 50 runs = 0 points
                            END IF;
                        END;

                    WHEN 'SIDE_BET' THEN
                        -- Check side bet answer
                        v_correct_answer := v_match_result.side_bet_answers->>v_question.question_id;
                        IF v_answer = v_correct_answer THEN
                            v_bet_score := v_bet_score + COALESCE(v_question.points, 0);
                        ELSE
                            -- Apply wrong points penalty if set
                            v_bet_score := v_bet_score + COALESCE(v_question.points_wrong, 0);
                        END IF;

                    ELSE
                        -- For other types (PLAYER_PICK), give base points for now
                        v_bet_score := v_bet_score + COALESCE(v_question.points, 0);
                END CASE;
            END IF;
        END LOOP;

        -- Update the bet with calculated score
        UPDATE bets
        SET score = v_bet_score
        WHERE bet_id = v_bet.bet_id;

        -- Update leaderboard
        INSERT INTO leaderboard (event_id, user_id, display_name, total_score, matches_played, last_match_score, rank, previous_rank)
        VALUES (p_event_id, v_bet.user_id, 'User ' || LEFT(v_bet.user_id::TEXT, 8), v_bet_score, 1, v_bet_score, 0, 0)
        ON CONFLICT (event_id, user_id) DO UPDATE
        SET
            total_score = leaderboard.total_score + EXCLUDED.last_match_score,
            matches_played = leaderboard.matches_played + 1,
            last_match_score = EXCLUDED.last_match_score,
            previous_rank = leaderboard.rank,
            updated_at = NOW();

        v_bets_scored := v_bets_scored + 1;
        v_total_points := v_total_points + v_bet_score;
    END LOOP;

    -- Recalculate ranks
    PERFORM update_leaderboard_ranks(p_event_id);

    -- Return result
    RETURN jsonb_build_object(
        'success', true,
        'betsScored', v_bets_scored,
        'totalPoints', v_total_points,
        'averageScore', CASE WHEN v_bets_scored > 0 THEN v_total_points / v_bets_scored ELSE 0 END
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (admin check should be done in app layer)
GRANT EXECUTE ON FUNCTION calculate_match_scores TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION calculate_match_scores IS 'Calculate and apply scores for all bets on a match. Should only be called by admin users.';
