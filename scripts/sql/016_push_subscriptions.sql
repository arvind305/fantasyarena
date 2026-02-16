-- 016: Push notification subscriptions and notification log
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_push_subs_user ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_push" ON push_subscriptions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_push" ON push_subscriptions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_delete_push" ON push_subscriptions FOR DELETE TO anon USING (true);

CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id VARCHAR(100) NOT NULL,
  reminder_type VARCHAR(10) NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, reminder_type)
);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_notif" ON notification_log FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_notif" ON notification_log FOR INSERT TO anon WITH CHECK (true);
