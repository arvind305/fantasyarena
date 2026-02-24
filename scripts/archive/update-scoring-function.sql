-- Updated TOTAL_RUNS scoring logic
--
-- The admin sets a BASE POINTS value for the question. Scoring tiers are
-- percentages of this base, with exact match getting a 5x bonus.
--
-- Scoring tiers (based on absolute difference from actual):
-- - Exact (0):   500% of base points (5x bonus for perfect prediction)
-- - Diff 1:      100% of base points (the base value)
-- - Diff 2-5:    50% of base points
-- - Diff 6-10:   25% of base points
-- - Diff 11-15:  10% of base points
-- - Diff > 15:   0 points

CREATE OR REPLACE FUNCTION calculate_match_scores(p_match_id TEXT, p_event_id TEXT DEFAULT 't20wc_2026')
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_bet RECORD;
  v_question RECORD;
  v_user_answer TEXT;
  v_score INT;
  v_correct INT;
  v_total INT;
  v_display_name TEXT;
  v_bets_scored INT := 0;
  v_total_points INT := 0;
  v_distance INT;
  v_question_points INT;
  v_base_points INT;
BEGIN
  FOR v_bet IN
    SELECT b.user_id, b.answers, b.bet_id
    FROM bets b
    WHERE b.match_id = p_match_id
  LOOP
    v_score := 0;
    v_correct := 0;
    v_total := 0;

    FOR v_question IN
      SELECT q.question_id, q.correct_answer, q.points, q.kind
      FROM match_questions q
      WHERE q.match_id = p_match_id
        AND q.correct_answer IS NOT NULL
    LOOP
      v_total := v_total + 1;
      v_user_answer := v_bet.answers ->> v_question.question_id;
      v_question_points := 0;
      v_base_points := COALESCE(v_question.points, 1000);

      IF v_user_answer IS NOT NULL THEN
        IF v_question.kind = 'TOTAL_RUNS' THEN
          -- Proximity-based scoring for TOTAL_RUNS
          -- Base points is what admin sets; tiers are percentages of base
          v_distance := ABS(v_user_answer::INT - v_question.correct_answer::INT);

          IF v_distance = 0 THEN
            -- Exact match: 500% (5x bonus)
            v_question_points := v_base_points * 5;
            v_correct := v_correct + 1;
          ELSIF v_distance = 1 THEN
            -- Off by 1: 100% (base value)
            v_question_points := v_base_points;
          ELSIF v_distance <= 5 THEN
            -- Off by 2-5: 50%
            v_question_points := ROUND(v_base_points * 0.5);
          ELSIF v_distance <= 10 THEN
            -- Off by 6-10: 25%
            v_question_points := ROUND(v_base_points * 0.25);
          ELSIF v_distance <= 15 THEN
            -- Off by 11-15: 10%
            v_question_points := ROUND(v_base_points * 0.1);
          ELSE
            -- Off by more than 15: 0%
            v_question_points := 0;
          END IF;
        ELSE
          -- Exact match for other question types (WINNER, etc.)
          IF v_user_answer = v_question.correct_answer THEN
            v_question_points := v_base_points;
            v_correct := v_correct + 1;
          END IF;
        END IF;
      END IF;

      v_score := v_score + v_question_points;
    END LOOP;

    UPDATE bets
    SET score = v_score, is_locked = true, locked_at = COALESCE(locked_at, NOW())
    WHERE bet_id = v_bet.bet_id;

    v_bets_scored := v_bets_scored + 1;
    v_total_points := v_total_points + v_score;

    SELECT COALESCE(u.display_name, 'User ' || LEFT(v_bet.user_id, 8))
    INTO v_display_name FROM users u WHERE u.user_id = v_bet.user_id;
    IF v_display_name IS NULL THEN v_display_name := 'User ' || LEFT(v_bet.user_id, 8); END IF;

    INSERT INTO leaderboard (event_id, user_id, display_name, total_score, matches_played, last_match_score, rank, previous_rank)
    VALUES (p_event_id, v_bet.user_id, v_display_name, v_score, 1, v_score, 0, 0)
    ON CONFLICT (event_id, user_id) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      previous_rank = leaderboard.rank,
      total_score = leaderboard.total_score + EXCLUDED.last_match_score,
      matches_played = leaderboard.matches_played + 1,
      last_match_score = EXCLUDED.last_match_score,
      updated_at = NOW();
  END LOOP;

  WITH ranked AS (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_score DESC) as new_rank
    FROM leaderboard WHERE event_id = p_event_id
  )
  UPDATE leaderboard lb SET rank = ranked.new_rank
  FROM ranked WHERE lb.user_id = ranked.user_id AND lb.event_id = p_event_id;

  RETURN json_build_object('success', true, 'betsScored', v_bets_scored, 'totalPoints', v_total_points);
END;
$$;
