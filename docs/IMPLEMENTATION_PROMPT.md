# Implementation Prompt for New Thread

Copy and paste this entire prompt into a new Claude Code session to begin implementation.

---

## PROMPT START

I need you to implement the complete betting system for my Fantasy Sports Game (T20 World Cup 2026). This is a comprehensive implementation that includes database schema, backend functions, user betting UI, admin dashboard, and long-term bets page.

### Project Context

- **Stack:** React 18 + TailwindCSS frontend, Supabase (PostgreSQL) backend
- **Hosting:** Vercel for frontend, Supabase for backend
- **Auth:** Google OAuth via Google Identity Services
- **Current State:** Basic betting with WINNER and TOTAL_RUNS only. Need to expand to full system.

### Critical Reference Documents

Read these files FIRST before any implementation:

1. `docs/BETTING_SYSTEM_SPEC.md` - Complete specification of all bet types, scoring logic, admin controls
2. `docs/IMPLEMENTATION_PLAN.md` - Detailed implementation plan with database schema, components, phases
3. `scoring-engine/models.ts` - TypeScript type definitions and scoring rules

### Implementation Requirements

#### Phase 1: Database Schema (Do First)

Create all SQL files in `scripts/sql/` directory:

1. `001_create_squads.sql` - Team roster table
2. `002_create_players.sql` - Player master data
3. `003_create_match_config.sql` - Per-match admin configuration
4. `004_create_player_slots.sql` - Slot multiplier configuration
5. `005_create_side_bets.sql` - Side bet definitions
6. `006_create_player_match_stats.sql` - Player performance data
7. `007_create_long_term_tables.sql` - Long-term bets config and user bets
8. `008_alter_bets_table.sql` - Add new columns to existing bets table
9. `009_create_indexes.sql` - Performance indexes
10. `010_create_rls_policies.sql` - Row Level Security policies
11. `011_create_scoring_functions.sql` - Updated scoring functions

After creating files, provide me the SQL to run in Supabase SQL Editor.

#### Phase 2: Data Seeding

Create seeding scripts:

1. `scripts/seed-squads.js` - Seed all 20 T20 WC 2026 teams with 15 players each
2. `scripts/seed-match-config.js` - Create default match_config for all 55 matches

Use the existing match data from `ui/public/data/t20wc_2026.json`.

#### Phase 3: Frontend - Betting Components

Create in `ui/src/components/betting/`:

1. `MatchWinnerBet.js` - Team A / Team B / Super Over selection
2. `TotalRunsBet.js` - Numeric input with scoring tier reference
3. `PlayerPicksSection.js` - Container for player slot picks
4. `PlayerSlot.js` - Single slot with team dropdown → player dropdown
5. `PlayerDropdown.js` - Filterable player selector
6. `SideBetsSection.js` - Container for side bet questions
7. `SideBetQuestion.js` - Single side bet with options
8. `RunnerPicksSection.js` - Runner selection (if enabled)
9. `RunnerPicker.js` - User search and select
10. `BetSummary.js` - Summary of all selections with submit

Create hooks in `ui/src/hooks/`:

1. `useBet.js` - State management for bet form
2. `useMatchConfig.js` - Fetch match configuration

Update `ui/src/pages/Match.js` to use new components.

#### Phase 4: Frontend - Admin Dashboard

Create in `ui/src/pages/admin/`:

1. `AdminDashboard.js` - Main admin landing page
2. `MatchList.js` - List all matches with status
3. `MatchConfig.js` - Configure a single match (tabbed interface)
4. `tabs/BasicSettings.js` - Winner/Total runs points config
5. `tabs/PlayerSlots.js` - Slot count and multipliers
6. `tabs/SideBets.js` - Create/edit/delete side bets
7. `tabs/RunnerSettings.js` - Enable/configure runners
8. `tabs/PlayerStats.js` - Enter player stats after match
9. `LongTermConfig.js` - Tournament-level bet configuration
10. `ScoreMatch.js` - Enter results and trigger scoring

Create admin components in `ui/src/components/admin/`:

1. `AdminNav.js` - Admin navigation sidebar
2. `PointsInput.js` - Reusable points input component
3. `MultiplierInput.js` - Reusable multiplier input
4. `PlayerStatsForm.js` - Form for entering player stats

Create `ui/src/hooks/useAdmin.js` for admin state management.

Add admin routes to `ui/src/App.js`:
- `/admin` - Dashboard
- `/admin/matches` - Match list
- `/admin/match/:matchId` - Match config
- `/admin/long-term` - Long-term config
- `/admin/score/:matchId` - Score entry

Protect admin routes - only allow users in ADMIN_USER_IDS env variable.

#### Phase 5: Frontend - Long-Term Bets

Create `ui/src/pages/LongTermBets.js` as main page.

Create in `ui/src/components/long-term/`:

1. `TournamentWinner.js` - Single team picker
2. `Finalists.js` - Two team picker
3. `FinalFour.js` - Four team picker
4. `OrangeCap.js` - Two player picker (top run scorer)
5. `PurpleCap.js` - Two player picker (top wicket taker)
6. `LongTermSummary.js` - Summary and submit button

Create `ui/src/hooks/useLongTermBets.js` for state management.

Add route `/long-term` to `ui/src/App.js`.

#### Phase 6: Styling Requirements

- Use existing TailwindCSS classes from the project
- Follow the dark theme already established (gray-800, gray-900 backgrounds)
- Use the existing `card` class for containers
- Mobile-first responsive design
- Use existing color scheme: blue-500 for primary, green-400 for success, red-400 for errors

#### Phase 7: Key Business Rules

1. **Bet Locking:** All bets lock when match starts (first ball). Use `lock_time` from match_config.

2. **Player Pick Validation:**
   - Cannot pick same player in multiple slots
   - Player dropdown shows only players from selected team
   - Shows 11-15 players per team from squads table

3. **Runner Validation:**
   - Can pick from own group OR global leaderboard
   - Cannot pick yourself as runner
   - If runner doesn't bet, their contribution is 0

4. **Side Bet Scoring:**
   - Correct answer: +points_correct
   - Wrong answer: +points_wrong (can be negative)

5. **Player Fantasy Points (from models.ts):**
   - Runs: 1 pt each
   - Fours: 10 pts each
   - Sixes: 20 pts each
   - Strike Rate: SR value as points (rounded)
   - Wickets: 20 pts each
   - Economy ≤6: 100 pts
   - Economy 6-8: 50 pts
   - Economy 8-10: 25 pts
   - Economy >10: 0 pts
   - Catches/Runouts/Stumpings: 5 pts each
   - Century/5-fer/Hat-trick/MoM: +200 bonus each

6. **Total Runs Scoring:**
   - Exact: 5x base
   - Diff 1: 1x base
   - Diff 2-5: 0.5x base
   - Diff 6-10: 0.25x base
   - Diff 11-15: 0.1x base
   - Diff >15: 0

7. **Match Winner Scoring:**
   - Correct: x points (base)
   - Super Over correct: 5x points
   - Wrong: 0

### Execution Instructions

1. Start with Phase 1 (Database). Create all SQL files, then give me the combined SQL to run.
2. After I confirm DB is ready, proceed to Phase 2 (Seeding).
3. After seeding, implement Phase 3 (Betting UI).
4. Then Phase 4 (Admin UI).
5. Then Phase 5 (Long-Term Bets).
6. After each phase, ask me to test and confirm before moving on.

### What I Need From You

1. Complete, working code for each file - no placeholders, no TODOs
2. Proper error handling and loading states
3. Mobile-responsive design
4. All Supabase queries with proper error handling
5. Clear file paths for each file you create
6. SQL that I can run directly in Supabase SQL Editor

### My Environment

- Working directory: `D:\Fantasy sports game`
- Frontend: `ui/` directory
- Scripts: `scripts/` directory
- Scoring engine: `scoring-engine/` directory
- Supabase project URL: Already configured in `ui/src/lib/supabase.js`

### Start Now

Begin with Phase 1: Database Schema. Read the IMPLEMENTATION_PLAN.md first, then create all 11 SQL files. After creating the files, provide me a single combined SQL script I can run in Supabase.

---

## PROMPT END
