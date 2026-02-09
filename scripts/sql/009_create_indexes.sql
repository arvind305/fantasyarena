-- 009_create_indexes.sql
-- Performance indexes for new tables

-- Players indexes
CREATE INDEX IF NOT EXISTS idx_players_squad ON players(squad_id);
CREATE INDEX IF NOT EXISTS idx_players_role ON players(player_role);
CREATE INDEX IF NOT EXISTS idx_players_active ON players(is_active);

-- Player slots indexes
CREATE INDEX IF NOT EXISTS idx_player_slots_match ON player_slots(match_id);
CREATE INDEX IF NOT EXISTS idx_player_slots_match_slot ON player_slots(match_id, slot_number);

-- Side bets indexes
CREATE INDEX IF NOT EXISTS idx_side_bets_match ON side_bets(match_id);
CREATE INDEX IF NOT EXISTS idx_side_bets_status ON side_bets(status);
CREATE INDEX IF NOT EXISTS idx_side_bets_match_order ON side_bets(match_id, display_order);

-- Player match stats indexes
CREATE INDEX IF NOT EXISTS idx_player_stats_match ON player_match_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_player ON player_match_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_match_player ON player_match_stats(match_id, player_id);

-- Long-term bets indexes
CREATE INDEX IF NOT EXISTS idx_long_term_bets_event ON long_term_bets(event_id);
CREATE INDEX IF NOT EXISTS idx_long_term_bets_user ON long_term_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_long_term_bets_event_user ON long_term_bets(event_id, user_id);

-- Match config indexes
CREATE INDEX IF NOT EXISTS idx_match_config_event ON match_config(event_id);
CREATE INDEX IF NOT EXISTS idx_match_config_status ON match_config(status);
