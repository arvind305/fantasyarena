# Implementation Plan: Complete Betting System

> Created: 2026-02-08
> Status: Ready for Implementation
> Reference: `docs/BETTING_SYSTEM_SPEC.md`

---

## Overview

This document outlines the complete implementation plan for the Fantasy Sports Game betting system, including the user-facing betting screen, admin dashboard, and all supporting backend infrastructure.

---

## Phase 1: Database Schema

### 1.1 New Tables Required

#### `squads` - Team Player Rosters
```sql
CREATE TABLE squads (
  squad_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,              -- e.g., 't20wc_2026'
  team_code TEXT NOT NULL,             -- e.g., 'IND', 'AUS', 'PAK'
  team_name TEXT NOT NULL,             -- e.g., 'India', 'Australia'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, team_code)
);
```

#### `players` - Player Master Data
```sql
CREATE TABLE players (
  player_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id UUID REFERENCES squads(squad_id),
  player_name TEXT NOT NULL,
  player_role TEXT,                    -- 'BAT', 'BOWL', 'ALL', 'WK'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `match_config` - Per-Match Admin Configuration
```sql
CREATE TABLE match_config (
  config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id TEXT NOT NULL UNIQUE,       -- e.g., 'wc_m1'
  event_id TEXT NOT NULL,

  -- Match Winner Config
  winner_base_points INT DEFAULT 1000,
  super_over_multiplier DECIMAL DEFAULT 5,

  -- Total Runs Config
  total_runs_base_points INT DEFAULT 1000,

  -- Player Slots Config
  player_slots_enabled BOOLEAN DEFAULT true,
  player_slot_count INT DEFAULT 3,     -- How many players user can pick

  -- Runners Config
  runners_enabled BOOLEAN DEFAULT false,
  runner_count INT DEFAULT 0,

  -- Timing
  lock_time TIMESTAMPTZ,               -- When betting closes

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `player_slots` - Slot Multiplier Configuration
```sql
CREATE TABLE player_slots (
  slot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id TEXT NOT NULL,
  slot_number INT NOT NULL,            -- 1, 2, 3, etc.
  multiplier DECIMAL NOT NULL,         -- 100, 90, 70, etc.
  is_enabled BOOLEAN DEFAULT true,
  UNIQUE(match_id, slot_number)
);
```

#### `side_bets` - Side Bet Definitions
```sql
CREATE TABLE side_bets (
  side_bet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,              -- ["Yes", "No"] or ["≤30", "31-50", ...]
  correct_answer TEXT,                 -- Set after match
  points_correct INT NOT NULL,         -- +500
  points_wrong INT DEFAULT 0,          -- 0 or -200 (negative allowed)
  display_order INT DEFAULT 0,
  status TEXT DEFAULT 'OPEN',          -- OPEN, CLOSED, SCORED
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `player_match_stats` - Player Performance Data
```sql
CREATE TABLE player_match_stats (
  stat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id TEXT NOT NULL,
  player_id UUID REFERENCES players(player_id),

  -- Batting
  runs INT DEFAULT 0,
  balls_faced INT DEFAULT 0,
  fours INT DEFAULT 0,
  sixes INT DEFAULT 0,
  strike_rate DECIMAL DEFAULT 0,

  -- Bowling
  wickets INT DEFAULT 0,
  overs_bowled DECIMAL DEFAULT 0,
  runs_conceded INT DEFAULT 0,
  economy_rate DECIMAL DEFAULT 0,

  -- Fielding
  catches INT DEFAULT 0,
  run_outs INT DEFAULT 0,
  stumpings INT DEFAULT 0,

  -- Bonuses
  is_man_of_match BOOLEAN DEFAULT false,
  has_century BOOLEAN DEFAULT false,
  has_five_wicket_haul BOOLEAN DEFAULT false,
  has_hat_trick BOOLEAN DEFAULT false,

  -- Calculated
  total_fantasy_points INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);
```

#### `long_term_bets_config` - Tournament-Level Bet Configuration
```sql
CREATE TABLE long_term_bets_config (
  config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,

  -- Points for each bet type
  winner_points INT DEFAULT 5000,
  finalist_points INT DEFAULT 2000,    -- Per correct team
  final_four_points INT DEFAULT 1000,  -- Per correct team
  orange_cap_points INT DEFAULT 3000,  -- Per correct pick
  purple_cap_points INT DEFAULT 3000,  -- Per correct pick

  -- Lock timing
  lock_time TIMESTAMPTZ,
  is_locked BOOLEAN DEFAULT false,

  -- Change cost (% of total points)
  change_cost_percent DECIMAL DEFAULT 10,
  allow_changes BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `long_term_bets` - User Long-Term Predictions
```sql
CREATE TABLE long_term_bets (
  bet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,

  -- Predictions (stored as JSON arrays)
  winner_team TEXT,                    -- Single team code
  finalist_teams JSONB,                -- ["IND", "AUS"]
  final_four_teams JSONB,              -- ["IND", "AUS", "ENG", "PAK"]
  orange_cap_players JSONB,            -- [player_id, player_id]
  purple_cap_players JSONB,            -- [player_id, player_id]

  -- Scoring
  is_scored BOOLEAN DEFAULT false,
  total_points INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);
```

#### Update `bets` Table - Add New Fields
```sql
ALTER TABLE bets ADD COLUMN IF NOT EXISTS player_picks JSONB DEFAULT '[]';
-- Format: [{"slot": 1, "player_id": "uuid", "team": "IND"}, ...]

ALTER TABLE bets ADD COLUMN IF NOT EXISTS runner_picks JSONB DEFAULT '[]';
-- Format: [{"user_id": "...", "display_name": "..."}, ...]

ALTER TABLE bets ADD COLUMN IF NOT EXISTS side_bet_answers JSONB DEFAULT '{}';
-- Format: {"side_bet_id_1": "Yes", "side_bet_id_2": "31-50", ...}

ALTER TABLE bets ADD COLUMN IF NOT EXISTS player_pick_points INT DEFAULT 0;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS runner_points INT DEFAULT 0;
ALTER TABLE bets ADD COLUMN IF NOT EXISTS side_bet_points INT DEFAULT 0;
```

### 1.2 Database Indexes
```sql
CREATE INDEX idx_players_squad ON players(squad_id);
CREATE INDEX idx_player_slots_match ON player_slots(match_id);
CREATE INDEX idx_side_bets_match ON side_bets(match_id);
CREATE INDEX idx_player_stats_match ON player_match_stats(match_id);
CREATE INDEX idx_long_term_bets_event_user ON long_term_bets(event_id, user_id);
```

### 1.3 RLS Policies
```sql
-- Players/Squads: Public read
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read squads" ON squads FOR SELECT USING (true);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read players" ON players FOR SELECT USING (true);

-- Match config: Public read
ALTER TABLE match_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read match_config" ON match_config FOR SELECT USING (true);

-- Side bets: Public read
ALTER TABLE side_bets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read side_bets" ON side_bets FOR SELECT USING (true);

-- Player stats: Public read
ALTER TABLE player_match_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read player_stats" ON player_match_stats FOR SELECT USING (true);

-- Long term bets: Users see own, admin sees all
ALTER TABLE long_term_bets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own long_term_bets" ON long_term_bets
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users insert own long_term_bets" ON long_term_bets
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users update own long_term_bets" ON long_term_bets
  FOR UPDATE USING (auth.uid()::text = user_id);
```

---

## Phase 2: Backend / Supabase Functions

### 2.1 Player Performance Scoring Function
```sql
CREATE OR REPLACE FUNCTION calculate_player_fantasy_points(p_stat_id UUID)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_stat player_match_stats%ROWTYPE;
  v_points INT := 0;
BEGIN
  SELECT * INTO v_stat FROM player_match_stats WHERE stat_id = p_stat_id;

  -- Batting
  v_points := v_points + v_stat.runs;                    -- 1 per run
  v_points := v_points + (v_stat.fours * 10);            -- 10 per 4
  v_points := v_points + (v_stat.sixes * 20);            -- 20 per 6
  v_points := v_points + ROUND(v_stat.strike_rate);      -- SR directly

  -- Bowling
  v_points := v_points + (v_stat.wickets * 20);          -- 20 per wicket

  -- Economy (only if bowled)
  IF v_stat.overs_bowled > 0 THEN
    IF v_stat.economy_rate <= 6 THEN
      v_points := v_points + 100;
    ELSIF v_stat.economy_rate <= 8 THEN
      v_points := v_points + 50;
    ELSIF v_stat.economy_rate <= 10 THEN
      v_points := v_points + 25;
    -- >10 = 0 points
    END IF;
  END IF;

  -- Fielding
  v_points := v_points + (v_stat.catches * 5);
  v_points := v_points + (v_stat.run_outs * 5);
  v_points := v_points + (v_stat.stumpings * 5);

  -- Bonuses
  IF v_stat.has_century THEN v_points := v_points + 200; END IF;
  IF v_stat.has_five_wicket_haul THEN v_points := v_points + 200; END IF;
  IF v_stat.has_hat_trick THEN v_points := v_points + 200; END IF;
  IF v_stat.is_man_of_match THEN v_points := v_points + 200; END IF;

  -- Update the record
  UPDATE player_match_stats SET total_fantasy_points = v_points WHERE stat_id = p_stat_id;

  RETURN v_points;
END;
$$;
```

### 2.2 Updated Match Scoring Function
```sql
CREATE OR REPLACE FUNCTION calculate_match_scores_v2(p_match_id TEXT, p_event_id TEXT DEFAULT 't20wc_2026')
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_bet RECORD;
  v_config match_config%ROWTYPE;
  v_question RECORD;
  v_side_bet RECORD;
  v_player_pick JSONB;
  v_runner_pick JSONB;
  v_player_stats player_match_stats%ROWTYPE;
  v_runner_bet bets%ROWTYPE;

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
  v_total_points INT := 0;
BEGIN
  -- Get match config
  SELECT * INTO v_config FROM match_config WHERE match_id = p_match_id;

  -- Process each bet
  FOR v_bet IN
    SELECT * FROM bets WHERE match_id = p_match_id
  LOOP
    v_winner_points := 0;
    v_total_runs_points := 0;
    v_player_pick_points := 0;
    v_side_bet_points := 0;
    v_runner_points := 0;

    -- 1. WINNER SCORING
    FOR v_question IN
      SELECT * FROM match_questions
      WHERE match_id = p_match_id AND kind = 'WINNER' AND correct_answer IS NOT NULL
    LOOP
      IF v_bet.answers ->> v_question.question_id = v_question.correct_answer THEN
        -- Check if super over prediction
        IF v_question.correct_answer LIKE '%super_over%' THEN
          v_winner_points := COALESCE(v_config.winner_base_points, v_question.points) *
                            COALESCE(v_config.super_over_multiplier, 5);
        ELSE
          v_winner_points := COALESCE(v_config.winner_base_points, v_question.points);
        END IF;
      END IF;
    END LOOP;

    -- 2. TOTAL RUNS SCORING
    FOR v_question IN
      SELECT * FROM match_questions
      WHERE match_id = p_match_id AND kind = 'TOTAL_RUNS' AND correct_answer IS NOT NULL
    LOOP
      v_base_points := COALESCE(v_config.total_runs_base_points, v_question.points);
      v_distance := ABS((v_bet.answers ->> v_question.question_id)::INT - v_question.correct_answer::INT);

      IF v_distance = 0 THEN
        v_total_runs_points := v_base_points * 5;
      ELSIF v_distance = 1 THEN
        v_total_runs_points := v_base_points;
      ELSIF v_distance <= 5 THEN
        v_total_runs_points := ROUND(v_base_points * 0.5);
      ELSIF v_distance <= 10 THEN
        v_total_runs_points := ROUND(v_base_points * 0.25);
      ELSIF v_distance <= 15 THEN
        v_total_runs_points := ROUND(v_base_points * 0.1);
      ELSE
        v_total_runs_points := 0;
      END IF;
    END LOOP;

    -- 3. PLAYER PICKS SCORING
    IF v_bet.player_picks IS NOT NULL AND jsonb_array_length(v_bet.player_picks) > 0 THEN
      FOR v_player_pick IN SELECT * FROM jsonb_array_elements(v_bet.player_picks)
      LOOP
        v_slot_num := (v_player_pick ->> 'slot')::INT;
        v_player_id := (v_player_pick ->> 'player_id')::UUID;

        -- Get slot multiplier
        SELECT multiplier INTO v_multiplier
        FROM player_slots
        WHERE match_id = p_match_id AND slot_number = v_slot_num;

        -- Get player stats
        SELECT * INTO v_player_stats
        FROM player_match_stats
        WHERE match_id = p_match_id AND player_id = v_player_id;

        IF v_player_stats IS NOT NULL AND v_multiplier IS NOT NULL THEN
          v_player_pick_points := v_player_pick_points +
            ROUND(v_player_stats.total_fantasy_points * v_multiplier);
        END IF;
      END LOOP;
    END IF;

    -- 4. SIDE BETS SCORING
    FOR v_side_bet IN
      SELECT * FROM side_bets
      WHERE match_id = p_match_id AND correct_answer IS NOT NULL
    LOOP
      IF v_bet.side_bet_answers ->> v_side_bet.side_bet_id::TEXT IS NOT NULL THEN
        IF v_bet.side_bet_answers ->> v_side_bet.side_bet_id::TEXT = v_side_bet.correct_answer THEN
          v_side_bet_points := v_side_bet_points + v_side_bet.points_correct;
        ELSE
          v_side_bet_points := v_side_bet_points + v_side_bet.points_wrong;
        END IF;
      END IF;
    END LOOP;

    -- 5. RUNNER SCORING
    IF v_bet.runner_picks IS NOT NULL AND jsonb_array_length(v_bet.runner_picks) > 0 THEN
      FOR v_runner_pick IN SELECT * FROM jsonb_array_elements(v_bet.runner_picks)
      LOOP
        -- Get runner's bet for this match
        SELECT * INTO v_runner_bet
        FROM bets
        WHERE match_id = p_match_id
          AND user_id = v_runner_pick ->> 'user_id';

        IF v_runner_bet IS NOT NULL THEN
          -- Add runner's total score (already calculated)
          v_runner_points := v_runner_points + COALESCE(v_runner_bet.score, 0);
        END IF;
        -- If runner didn't bet, v_runner_points stays 0
      END LOOP;
    END IF;

    -- Calculate total score
    v_score := v_winner_points + v_total_runs_points + v_player_pick_points +
               v_side_bet_points + v_runner_points;

    -- Update bet record
    UPDATE bets SET
      score = v_score,
      player_pick_points = v_player_pick_points,
      runner_points = v_runner_points,
      side_bet_points = v_side_bet_points,
      is_locked = true,
      locked_at = COALESCE(locked_at, NOW())
    WHERE bet_id = v_bet.bet_id;

    v_bets_scored := v_bets_scored + 1;
    v_total_points := v_total_points + v_score;

    -- Update leaderboard
    -- (Same leaderboard logic as before)
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'betsScored', v_bets_scored,
    'totalPoints', v_total_points
  );
END;
$$;
```

### 2.3 API Endpoints Needed

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/squads/:eventId` | GET | Get all teams and players for event |
| `/api/match/:matchId/config` | GET | Get match configuration |
| `/api/match/:matchId/side-bets` | GET | Get side bets for match |
| `/api/match/:matchId/slots` | GET | Get player slot config for match |
| `/api/users/search` | GET | Search users for runner selection |
| `/api/long-term/:eventId` | GET/POST | Get/Save long-term bets |
| `/api/admin/match/:matchId/config` | POST/PUT | Create/Update match config |
| `/api/admin/match/:matchId/side-bets` | POST/PUT/DELETE | Manage side bets |
| `/api/admin/match/:matchId/slots` | POST/PUT | Configure player slots |
| `/api/admin/match/:matchId/player-stats` | POST | Enter player stats |
| `/api/admin/match/:matchId/score` | POST | Trigger scoring |
| `/api/admin/long-term/config` | POST/PUT | Configure long-term bets |

---

## Phase 3: Frontend - Betting Screen

### 3.1 Component Structure
```
ui/src/pages/Match.js (update existing)
├── components/betting/
│   ├── MatchWinnerBet.js       -- Team A / Team B / Super Over
│   ├── TotalRunsBet.js         -- Numeric input with helper
│   ├── PlayerPicksSection.js   -- Container for player slots
│   │   ├── PlayerSlot.js       -- Single slot with team/player dropdowns
│   │   └── PlayerDropdown.js   -- Player selector for a team
│   ├── SideBetsSection.js      -- Container for side bets
│   │   └── SideBetQuestion.js  -- Single side bet with options
│   ├── RunnerPicksSection.js   -- Container for runner selection
│   │   └── RunnerPicker.js     -- User search/select
│   └── BetSummary.js           -- Summary of all selections
```

### 3.2 MatchWinnerBet Component
```jsx
// Options: Team A, Team B, Super Over
// Display team flags/names
// Highlight selected option
// Show base points value
```

### 3.3 TotalRunsBet Component
```jsx
// Numeric input (0-600 reasonable range)
// Show scoring tiers as reference
// +/- buttons for easy adjustment
// Validation (positive integer only)
```

### 3.4 PlayerPicksSection Component
```jsx
// For each enabled slot (1 to N):
//   - Show slot number and multiplier (e.g., "Slot 1: 100x")
//   - Team selector dropdown (Team A / Team B)
//   - Player dropdown (filtered by selected team)
//   - Show player role badge (BAT/BOWL/ALL/WK)
// Prevent duplicate player selection across slots
// Show "No players available" if all picked
```

### 3.5 SideBetsSection Component
```jsx
// For each side bet in match:
//   - Question text
//   - Radio/button options
//   - Show points for correct (+500)
//   - Show points for wrong (0 or -200) with warning color
// Visual indicator for answered vs unanswered
```

### 3.6 RunnerPicksSection Component
```jsx
// Only show if runners enabled for match
// Search input to find users
//   - Search by name
//   - Show from "Your Groups" section
//   - Show from "Global" section
// Selected runners list with remove option
// Warning: "If runner doesn't bet, you get 0 points from them"
// Max runners indicator (e.g., "1 of 2 selected")
```

### 3.7 BetSummary Component
```jsx
// Collapsible summary showing:
//   - Winner selection
//   - Total runs prediction
//   - Player picks with multipliers
//   - Side bet answers
//   - Runners selected
// "Submit Bet" button
// Validation warnings for incomplete sections
```

### 3.8 State Management
```javascript
// useBet hook or context
const betState = {
  matchId: string,

  // Winner
  winnerPrediction: 'teamA' | 'teamB' | 'super_over' | null,

  // Total Runs
  totalRunsPrediction: number | null,

  // Player Picks
  playerPicks: [
    { slot: 1, team: 'IND', playerId: 'uuid', playerName: 'Virat Kohli' },
    { slot: 2, team: 'AUS', playerId: 'uuid', playerName: 'Pat Cummins' },
  ],

  // Side Bets
  sideBetAnswers: {
    'side_bet_id_1': 'Yes',
    'side_bet_id_2': '51-80',
  },

  // Runners
  runnerPicks: [
    { userId: '...', displayName: 'John Doe' },
  ],

  // Metadata
  isSubmitting: boolean,
  isLocked: boolean,
  errors: string[],
};
```

---

## Phase 4: Frontend - Admin Dashboard

### 4.1 Admin Route Structure
```
ui/src/pages/admin/
├── AdminDashboard.js           -- Main admin landing
├── MatchList.js                -- List all matches
├── MatchConfig.js              -- Configure a single match
│   ├── tabs/
│   │   ├── BasicSettings.js    -- Winner/Total runs points
│   │   ├── PlayerSlots.js      -- Slot count and multipliers
│   │   ├── SideBets.js         -- Create/edit side bets
│   │   ├── RunnerSettings.js   -- Enable/configure runners
│   │   └── PlayerStats.js      -- Enter player stats after match
├── LongTermConfig.js           -- Tournament-level bet config
├── ScoreMatch.js               -- Enter results and trigger scoring
└── components/
    ├── AdminNav.js             -- Admin navigation
    ├── PointsInput.js          -- Reusable points input
    ├── MultiplierInput.js      -- Reusable multiplier input
    └── PlayerStatsForm.js      -- Form for entering player stats
```

### 4.2 MatchConfig - BasicSettings Tab
```jsx
// Match info display (teams, date, time)
// Winner base points input (default 1000)
// Super over multiplier input (default 5x)
// Total runs base points input (default 1000)
// Lock time picker
// Save button
```

### 4.3 MatchConfig - PlayerSlots Tab
```jsx
// Toggle: Enable player picks (yes/no)
// Number of slots input (1-11)
// For each slot:
//   - Slot number (readonly)
//   - Multiplier input (default descending: 100, 90, 70...)
//   - Enable/disable toggle
// "Apply Template" button (preset multipliers)
// Save button
```

### 4.4 MatchConfig - SideBets Tab
```jsx
// List of existing side bets
// "Add Side Bet" button
// For each side bet:
//   - Question text input
//   - Options list (add/remove)
//   - Points for correct input
//   - Points for wrong input (can be negative)
//   - Delete button
// Drag to reorder
// Save button
```

### 4.5 MatchConfig - RunnerSettings Tab
```jsx
// Toggle: Enable runners (yes/no)
// Number of runners allowed (1-3)
// Save button
```

### 4.6 MatchConfig - PlayerStats Tab
```jsx
// Only visible after match is complete
// Two sections: Team A players, Team B players
// For each player who played:
//   - Name (readonly)
//   - Runs, Balls Faced, 4s, 6s
//   - Wickets, Overs, Runs Conceded
//   - Catches, Run Outs, Stumpings
//   - Checkboxes: MoM, Century, 5-fer, Hat-trick
//   - Calculated fantasy points (readonly, auto-calculated)
// "Calculate All Points" button
// Save button
```

### 4.7 ScoreMatch Page
```jsx
// Select match from dropdown
// Show match status
// Enter correct answers:
//   - Winner: Team A / Team B / Super Over
//   - Total Runs: number
//   - Side bet answers (for each)
// "Save Results" button
// "Calculate Scores" button (triggers scoring function)
// Show scoring results (bets scored, total points)
```

### 4.8 LongTermConfig Page
```jsx
// Event selector
// Points configuration:
//   - Winner points
//   - Finalist points (per team)
//   - Final 4 points (per team)
//   - Orange cap points (per pick)
//   - Purple cap points (per pick)
// Lock time picker
// Lock/Unlock toggle button
// Change settings:
//   - Allow changes toggle
//   - Change cost percentage input
// Save button
```

### 4.9 Admin Authentication
```jsx
// Check if user is admin (stored in users table or env config)
// Redirect non-admins to home
// Admin user IDs stored in ADMIN_USER_IDS env variable
```

---

## Phase 5: Frontend - Long-Term Bets Page

### 5.1 Component Structure
```
ui/src/pages/LongTermBets.js
├── components/long-term/
│   ├── TournamentWinner.js     -- Single team picker
│   ├── Finalists.js            -- Two team picker
│   ├── FinalFour.js            -- Four team picker
│   ├── OrangeCap.js            -- Two player picker
│   ├── PurpleCap.js            -- Two player picker
│   └── LongTermSummary.js      -- Summary and submit
```

### 5.2 Team Picker Components
```jsx
// Dropdown or card-based selection
// Show team flag and name
// Prevent duplicate selection
// Show selected count (e.g., "2 of 4 selected")
// Clear selection button
```

### 5.3 Player Picker Components (Orange/Purple Cap)
```jsx
// Search input
// Filter by team (optional)
// Show player name, team, role
// Select up to 2 players
// Prevent duplicates
```

### 5.4 Lock State Handling
```jsx
// If locked:
//   - Show all selections as read-only
//   - Show "Locked" badge with lock time
//   - Hide submit button
// If unlocked:
//   - Show editable form
//   - Show time until lock
//   - Show submit button
// If changes allowed with cost:
//   - Show "Edit" button
//   - Show cost warning before editing
```

---

## Phase 6: Data Seeding

### 6.1 Squad Data
```javascript
// scripts/seed-squads.js
// Seed all 20 teams for T20 WC 2026
// Include full squad (15 players per team)
// Player roles: BAT, BOWL, ALL, WK
```

### 6.2 Match Config Defaults
```javascript
// scripts/seed-match-config.js
// Create match_config entries for all 55 matches
// Default values:
//   - winner_base_points: 1000
//   - super_over_multiplier: 5
//   - total_runs_base_points: 1000
//   - player_slots_enabled: true
//   - player_slot_count: 3
//   - runners_enabled: false
```

### 6.3 Default Slot Multipliers
```javascript
// For 3-slot default:
// Slot 1: 100x
// Slot 2: 70x
// Slot 3: 40x

// For 11-slot full:
// Slot 1: 100x, 2: 90x, 3: 70x, 4: 50x, 5: 30x
// Slot 6: 20x, 7: 15x, 8: 10x, 9: 5x, 10: 3x, 11: 2x
```

---

## Phase 7: Testing

### 7.1 Unit Tests
- Player fantasy points calculation
- Total runs proximity scoring
- Side bet scoring (positive/negative)
- Runner points aggregation

### 7.2 Integration Tests
- Full match scoring flow
- Bet submission with all bet types
- Admin configuration saves correctly
- Lock timing enforcement

### 7.3 E2E Tests
- User places complete bet
- Admin configures match
- Admin enters results
- Scoring runs correctly
- Leaderboard updates

---

## File Summary

### New Files to Create

**Database:**
- `scripts/sql/001_create_squads.sql`
- `scripts/sql/002_create_players.sql`
- `scripts/sql/003_create_match_config.sql`
- `scripts/sql/004_create_player_slots.sql`
- `scripts/sql/005_create_side_bets.sql`
- `scripts/sql/006_create_player_match_stats.sql`
- `scripts/sql/007_create_long_term_tables.sql`
- `scripts/sql/008_alter_bets_table.sql`
- `scripts/sql/009_create_indexes.sql`
- `scripts/sql/010_create_rls_policies.sql`
- `scripts/sql/011_create_scoring_functions.sql`

**Seeding:**
- `scripts/seed-squads.js`
- `scripts/seed-match-config.js`

**Frontend - Betting Components:**
- `ui/src/components/betting/MatchWinnerBet.js`
- `ui/src/components/betting/TotalRunsBet.js`
- `ui/src/components/betting/PlayerPicksSection.js`
- `ui/src/components/betting/PlayerSlot.js`
- `ui/src/components/betting/PlayerDropdown.js`
- `ui/src/components/betting/SideBetsSection.js`
- `ui/src/components/betting/SideBetQuestion.js`
- `ui/src/components/betting/RunnerPicksSection.js`
- `ui/src/components/betting/RunnerPicker.js`
- `ui/src/components/betting/BetSummary.js`
- `ui/src/hooks/useBet.js`
- `ui/src/hooks/useMatchConfig.js`

**Frontend - Admin:**
- `ui/src/pages/admin/AdminDashboard.js`
- `ui/src/pages/admin/MatchList.js`
- `ui/src/pages/admin/MatchConfig.js`
- `ui/src/pages/admin/tabs/BasicSettings.js`
- `ui/src/pages/admin/tabs/PlayerSlots.js`
- `ui/src/pages/admin/tabs/SideBets.js`
- `ui/src/pages/admin/tabs/RunnerSettings.js`
- `ui/src/pages/admin/tabs/PlayerStats.js`
- `ui/src/pages/admin/LongTermConfig.js`
- `ui/src/pages/admin/ScoreMatch.js`
- `ui/src/components/admin/AdminNav.js`
- `ui/src/components/admin/PointsInput.js`
- `ui/src/components/admin/MultiplierInput.js`
- `ui/src/components/admin/PlayerStatsForm.js`
- `ui/src/hooks/useAdmin.js`

**Frontend - Long-Term Bets:**
- `ui/src/pages/LongTermBets.js`
- `ui/src/components/long-term/TournamentWinner.js`
- `ui/src/components/long-term/Finalists.js`
- `ui/src/components/long-term/FinalFour.js`
- `ui/src/components/long-term/OrangeCap.js`
- `ui/src/components/long-term/PurpleCap.js`
- `ui/src/components/long-term/LongTermSummary.js`
- `ui/src/hooks/useLongTermBets.js`

**Files to Update:**
- `ui/src/pages/Match.js` - Integrate new betting components
- `ui/src/App.js` - Add admin and long-term routes
- `ui/src/lib/supabase.js` - Add new table queries
- `scoring-engine/models.ts` - Already updated

---

## Execution Order

1. **Database First** - Create all tables, indexes, RLS policies
2. **Seeding** - Seed squads and default match configs
3. **Backend Functions** - Create scoring functions
4. **Frontend - Betting** - Build betting components
5. **Frontend - Admin** - Build admin dashboard
6. **Frontend - Long-Term** - Build long-term bets page
7. **Integration** - Connect everything, test end-to-end
8. **Polish** - Error handling, loading states, edge cases

---

## Estimated Scope

| Phase | Components | Complexity |
|-------|------------|------------|
| Phase 1: Database | 11 SQL files | Medium |
| Phase 2: Backend | 2 functions, API setup | Medium |
| Phase 3: Betting UI | 12 components | High |
| Phase 4: Admin UI | 15 components | High |
| Phase 5: Long-Term UI | 7 components | Medium |
| Phase 6: Seeding | 2 scripts | Low |
| Phase 7: Testing | Unit + E2E | Medium |

---

## Success Criteria

1. User can place a complete bet with all bet types
2. Admin can configure matches with custom settings
3. Admin can enter player stats and results
4. Scoring calculates correctly for all bet types
5. Leaderboard reflects accurate totals
6. Long-term bets work with lock/unlock
7. Mobile-responsive UI
8. No data loss, proper error handling
