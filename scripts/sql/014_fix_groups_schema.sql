-- 014_fix_groups_schema.sql
-- Fix: Groups table schema uses UUID columns for user IDs,
-- but the app uses Google OAuth string IDs (not UUIDs).
-- Also adds a trigger to sync group_members.score from leaderboard.
--
-- Run this in Supabase Dashboard > SQL Editor.
-- Safe to run multiple times.

-- =====================================================
-- FIX 1: ALTER columns from UUID to TEXT
-- The app uses Google OAuth sub IDs (numeric strings), not UUIDs.
-- =====================================================

-- Drop the FK constraint from group_members -> groups(id)
-- so we can change group_members.group_id to reference groups(group_id)
DO $$ BEGIN
    -- Drop FK if it exists (constraint name may vary)
    ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_group_id_fkey;
EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore if constraint doesn't exist
END $$;

-- Drop the unique constraint on (group_id, user_id) temporarily
DO $$ BEGIN
    ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_group_id_user_id_key;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Change column types to TEXT (safe: UUID -> TEXT is always compatible)
ALTER TABLE groups ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE group_members ALTER COLUMN group_id TYPE TEXT;
ALTER TABLE group_members ALTER COLUMN user_id TYPE TEXT;

-- Re-add unique constraint
DO $$ BEGIN
    ALTER TABLE group_members ADD CONSTRAINT group_members_group_id_user_id_key UNIQUE (group_id, user_id);
EXCEPTION WHEN duplicate_object THEN
    NULL; -- Already exists
END $$;

-- =====================================================
-- FIX 2: Sync group_members.score from leaderboard
-- Creates a function + trigger so scores auto-update
-- whenever the leaderboard is updated (after scoring).
-- =====================================================

CREATE OR REPLACE FUNCTION sync_group_member_scores()
RETURNS TRIGGER AS $$
BEGIN
    -- When a leaderboard row is updated, sync its total_score
    -- to all group_members rows with the same user_id
    UPDATE group_members
    SET score = NEW.total_score
    WHERE user_id = NEW.user_id::TEXT;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_sync_group_scores ON leaderboard;

-- Create trigger: fires after every leaderboard INSERT or UPDATE
CREATE TRIGGER trg_sync_group_scores
    AFTER INSERT OR UPDATE OF total_score ON leaderboard
    FOR EACH ROW
    EXECUTE FUNCTION sync_group_member_scores();

-- Backfill: sync all existing group_members scores from leaderboard now
UPDATE group_members gm
SET score = COALESCE(lb.total_score, 0)
FROM leaderboard lb
WHERE gm.user_id = lb.user_id::TEXT;

COMMENT ON FUNCTION sync_group_member_scores IS 'Auto-sync group member scores from leaderboard whenever scores are updated. Triggered after scoring.';
