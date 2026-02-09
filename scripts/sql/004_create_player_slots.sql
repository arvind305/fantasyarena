-- 004_create_player_slots.sql
-- Slot multiplier configuration per match

CREATE TABLE IF NOT EXISTS player_slots (
    slot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id VARCHAR(100) NOT NULL,
    slot_number INT NOT NULL,              -- 1, 2, 3, etc.
    multiplier DECIMAL(10,2) NOT NULL,     -- 100, 90, 70, etc.
    is_enabled BOOLEAN DEFAULT true,
    UNIQUE(match_id, slot_number)
);
