-- Create users table to store user profiles
-- Run this in Supabase SQL Editor

-- 1. Create the users table
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  email TEXT,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_sign_in TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. Enable RLS but allow all authenticated operations (using service role in backend)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 4. Allow anyone to read users (for leaderboard display names)
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

-- 5. Allow inserts (for sign-in registration)
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (true);

-- 6. Allow updates (for profile updates)
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (true);

-- 7. Create or replace function to update leaderboard display names from users table
CREATE OR REPLACE FUNCTION sync_leaderboard_display_names()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE leaderboard lb
  SET display_name = u.display_name
  FROM users u
  WHERE lb.user_id = u.user_id
    AND (lb.display_name IS NULL OR lb.display_name != u.display_name);
END;
$$;

-- 8. Update calculate_match_scores to use display name from users table
-- (This modifies the existing function)
CREATE OR REPLACE FUNCTION calculate_match_scores(p_match_id TEXT, p_event_id TEXT DEFAULT 't20wc_2026')
RETURNS TABLE(user_id TEXT, match_score INT, questions_correct INT, total_questions INT)
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
BEGIN
  -- Loop through all bets for this match
  FOR v_bet IN
    SELECT b.user_id, b.answers, b.bet_id
    FROM bets b
    WHERE b.match_id = p_match_id
  LOOP
    v_score := 0;
    v_correct := 0;
    v_total := 0;

    -- Loop through all questions for this match that have correct answers
    FOR v_question IN
      SELECT q.question_id, q.correct_answer, q.points
      FROM match_questions q
      WHERE q.match_id = p_match_id
        AND q.correct_answer IS NOT NULL
    LOOP
      v_total := v_total + 1;

      -- Get user's answer for this question
      v_user_answer := v_bet.answers ->> v_question.question_id;

      -- Check if answer is correct
      IF v_user_answer IS NOT NULL AND v_user_answer = v_question.correct_answer THEN
        v_score := v_score + COALESCE(v_question.points, 100);
        v_correct := v_correct + 1;
      END IF;
    END LOOP;

    -- Update the bet with the score
    UPDATE bets
    SET score = v_score,
        is_locked = true,
        locked_at = COALESCE(locked_at, NOW())
    WHERE bet_id = v_bet.bet_id;

    -- Get display name from users table, fallback to truncated user_id
    SELECT COALESCE(u.display_name, 'User ' || LEFT(v_bet.user_id, 8))
    INTO v_display_name
    FROM users u
    WHERE u.user_id = v_bet.user_id;

    IF v_display_name IS NULL THEN
      v_display_name := 'User ' || LEFT(v_bet.user_id, 8);
    END IF;

    -- Upsert leaderboard entry
    INSERT INTO leaderboard (event_id, user_id, display_name, total_score, matches_played, last_match_score, rank, previous_rank)
    VALUES (p_event_id, v_bet.user_id, v_display_name, v_score, 1, v_score, 0, 0)
    ON CONFLICT (event_id, user_id) DO UPDATE SET
      display_name = EXCLUDED.display_name,
      previous_rank = leaderboard.rank,
      total_score = leaderboard.total_score + EXCLUDED.last_match_score,
      matches_played = leaderboard.matches_played + 1,
      last_match_score = EXCLUDED.last_match_score,
      updated_at = NOW();

    -- Return the result for this user
    user_id := v_bet.user_id;
    match_score := v_score;
    questions_correct := v_correct;
    total_questions := v_total;
    RETURN NEXT;
  END LOOP;

  -- Update ranks after all scores are in
  PERFORM update_leaderboard_ranks(p_event_id);

  RETURN;
END;
$$;

-- 9. Grant execute permissions
GRANT EXECUTE ON FUNCTION sync_leaderboard_display_names() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION calculate_match_scores(TEXT, TEXT) TO authenticated, anon, service_role;
