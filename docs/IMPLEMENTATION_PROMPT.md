# Handoff Prompt — Fantasy Sports Game (T20 World Cup 2026)

Copy everything below into a new Claude Code session to continue work.

---

## PROMPT START

I'm building a Fantasy Sports Game for the T20 World Cup 2026 (Feb-Mar 2026). The tournament is **already underway** — 7 matches scored, 8 active users, bets flowing in. I need help with the remaining tasks listed below.

### Stack
- **Frontend:** React 18 + TailwindCSS (`ui/` directory)
- **Backend:** Supabase (PostgreSQL) — tables, RPC functions, RLS policies
- **Auth:** Google OAuth via Google Identity Services
- **Hosting:** Vercel (production: `fantasyarena-two.vercel.app`)
- **Deploy:** `vercel --prod` from project root (Vercel project root is `ui/`)

### Key Files to Read First
1. `docs/BETTING_SYSTEM_SPEC.md` — Complete betting spec (all bet types, scoring tiers, admin controls)
2. `docs/IMPLEMENTATION_PLAN.md` — Full implementation plan with DB schema, components, phases
3. `scoring-engine/models.ts` — Type definitions and player scoring formula
4. `scripts/sql/012_fix_duplicate_scoring_function.sql` — The canonical scoring RPC function
5. `ui/src/api.js` — All API functions (Supabase queries, mock fallbacks)
6. `ui/src/config.js` — Engine mode (simulation/shadow/live), admin email config
7. `data/side-bet-templates.json` — Side bet template bank (25 T20 cricket templates)

### Project Architecture
- Routes in `ui/src/index.js` (NOT App.js)
- API layer in `ui/src/api.js` — mode-based (simulation/shadow/live)
- Supabase client in `ui/src/lib/supabase.js`
- Admin check via `getAdminEmail()` from `ui/src/config.js`
- Static match data in `ui/public/data/t20wc_2026.json`
- 55 matches, 20 teams, 300 players seeded in DB

### Database Tables (all exist and are populated)
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `bets` | User match bets | user_id, match_id, answers (JSONB), player_picks, runner_picks, side_bet_answers, score, winner_points, total_runs_points, player_pick_points, side_bet_points, runner_points |
| `match_questions` | Per-match questions | question_id, match_id, section (STANDARD/SIDE), kind (WINNER/TOTAL_RUNS/PLAYER_PICK), correct_answer |
| `match_config` | Per-match admin config | match_id (e.g. "wc_m1"), winner_base_points, total_runs_base_points, super_over_multiplier, lock_time, status (DRAFT/OPEN/LOCKED/SCORED), team_a, team_b |
| `match_results` | Match outcomes | match_id, winner, total_runs, player_stats (JSONB), side_bet_answers (JSONB), man_of_match |
| `player_slots` | Slot multipliers | match_id, slot_number, multiplier, is_enabled |
| `side_bets` | Side bet definitions | match_id, question_text, options (JSONB), correct_answer, points_correct, points_wrong, status |
| `squads` | Team rosters (20 teams) | squad_id, team_code, team_name, event_id |
| `players` | Player data (300 players) | player_id, squad_id, player_name, player_role (BAT/BOWL/ALL/WK) |
| `player_match_stats` | Per-match player stats | match_id, player_id, runs, wickets, catches, etc., total_fantasy_points |
| `leaderboard` | Global rankings | user_id, event_id, total_score, matches_played, display_name, rank |
| `long_term_bets_config` | Tournament bet config | event_id, winner_points, finalist_points, final_four_points, lock_time, is_locked |
| `long_term_bets` | User tournament predictions | user_id, event_id, winner_team, finalist_teams, final_four_teams, orange_cap_players, purple_cap_players |
| `users` | Google profile data | user_id, display_name, email, avatar_url (saved on each sign-in via `ui/src/lib/userProfile.js`) |

### Match ID Format
All match IDs use prefix `wc_m` followed by number: `wc_m1`, `wc_m2`, ..., `wc_m55`. Consistent everywhere.

### Current State
- **8 users:** Arvind (9200pts), Tanay (8050), Sukant (7000), Shashank (5100), Unknown (4000), Vatsal (3350), Siddharth (2350), Aditi (2000)
- **7 matches scored:** wc_m1 through wc_m7
- **All 55 matches OPEN** (or LOCKED/SCORED if past). Frontend auto-locks via `lock_time` check (line 117 of MatchBetting.js: `new Date(lockTime) <= new Date()`)
- **All 55 matches have 4 default side bets** from template bank
- **Admin can customize side bets** per match via MatchConfig → Side Bets tab → "Pick from Template Bank" or edit existing

### How Locking Works
The frontend checks `lock_time` directly — if `new Date(lockTime) <= new Date()`, betting is blocked. The DB `status` column is secondary/cosmetic. All future matches are set to OPEN so they appear for betting; they auto-lock on the frontend when `lock_time` arrives (= match start time in IST). No cron job needed for locking.

### How Side Bets Work
All 55 matches have 4 default side bets auto-populated from `data/side-bet-templates.json`. Admin can:
- Swap/add/remove via MatchConfig → Side Bets tab
- Use "Pick from Template Bank" to browse 25 templates by category
- `scripts/rotate-side-bets.js` can rotate templates for upcoming matches (only if no users have answered yet)

### Scoring Flow (working end-to-end)
1. Users place bets before lock_time (match start)
2. After match: Admin enters results in ScoreMatch page (`/admin/score/:matchId`) — winner, total runs, side bet correct answers
3. Admin clicks "Calculate Scores" → calls `calculate_match_scores` RPC
4. RPC scores all bets (WINNER, TOTAL_RUNS, PLAYER_PICKS, SIDE_BETS, RUNNERS in 2 passes), updates leaderboard
5. Optionally: Enter player stats in MatchConfig → Player Stats tab for player pick scoring

### Existing Admin Pages & Routes
```
/admin/dashboard    → AdminDashboardV2.js
/admin/matches      → MatchList.js
/admin/match/:id    → MatchConfig.js (tabs: Basic, Slots, Side Bets w/ template bank, Runners, Stats)
/admin/long-term    → LongTermConfig.js
/admin/score/:id    → ScoreMatch.js
```

### Existing Frontend Routes
```
/                  → Home
/play              → Play (match list for betting)
/match/:matchId    → MatchBetting.js (V1/V2 dual mode)
/long-term-bets    → LongTermBets.js
/leaderboard       → Leaderboard.js (3 tabs: Overall, Today, By Match)
/stats             → Stats.js (3 tabs: Overview, Bet History, Breakdowns)
/schedule          → Match schedule
/teams             → Teams listing
/players           → Players listing
/groups            → Groups
/profile           → User profile
/rules             → Game rules
```

---

## TASKS TO COMPLETE (Priority Order)

### 1. HIGH: Stats Page — Overview & Bet History Tabs Read from localStorage (Should Read Supabase)

**Problem:** The `OverviewTab` and `BetHistoryTab` in `ui/src/pages/Stats.js` read bets from `localStorage` key `betting_arena_state`. This is the pre-Supabase storage and is now stale/empty for most users.

**Fix:** Update both tabs to fetch from Supabase `bets` table:
```js
// Follow the pattern already used by BreakdownsTab (line 76-92 of Stats.js):
const { data } = await supabase
  .from("bets")
  .select("match_id, score, winner_points, total_runs_points, player_pick_points, side_bet_points, runner_points, answers, created_at, is_locked")
  .eq("user_id", identity.userId);
```
- `OverviewTab`: Calculate matchesPlayed, betsSubmitted, pendingCount, scoredCount from Supabase data
- `BetHistoryTab`: Show bet cards with match info, answers, and scores. Join with match data from `apiGetMatches()` for team names/dates
- Remove all `localStorage.getItem("betting_arena_state")` references

### 2. HIGH: Verify V2 Betting Flow End-to-End

**Context:** `ui/src/pages/MatchBetting.js` has V1 (legacy) and V2 (new) modes. V2 activates when `match_config` exists in Supabase (which it does for all 55 matches now).

**Test & Fix:**
- Open a match page (e.g. `/match/wc_m10`) and verify:
  - Winner bet shows team options correctly
  - Total runs input works
  - Player picks: team selector shows teams, player dropdown shows squad from `players` table
  - Side bets: questions from `side_bets` table display with options
  - BetSummary shows all selections
  - Submit saves to Supabase `bets` table with all fields (answers, player_picks, side_bet_answers)
- Files to check: `ui/src/hooks/useBet.js`, `ui/src/api.js` (apiSubmitBetV2), all components in `ui/src/components/betting/`

### 3. HIGH: Side Bet Scoring — Ensure ScoreMatch Page Supports Side Bet Answers

**Context:** When admin scores a match, they need to set correct answers for side bets too. Check that `/admin/score/:matchId` (ScoreMatch.js):
- Loads existing side bets for the match
- Shows each side bet question with its options as radio buttons
- Saves correct_answer to `side_bets` table AND `match_results.side_bet_answers`
- The scoring RPC reads both `side_bets.correct_answer` AND `match_results.side_bet_answers` (see lines 213-250 of `scripts/sql/012_fix_duplicate_scoring_function.sql`)

### 4. MEDIUM: Teams & Players Pages — Connect to Supabase

**Problem:** `ui/src/pages/Teams.js` and `ui/src/pages/Players.js` use mock engine (`apiGetTeams()`, `apiGetPlayers()`). These return dummy data.

**Fix:**
- Teams page: Fetch from `squads` table (`SELECT * FROM squads WHERE event_id = 't20wc_2026'`), display 20 teams with team_code and team_name
- Team detail page: Fetch players for that squad (`SELECT * FROM players WHERE squad_id = ?`)
- Players page: Fetch from `players` table joined with `squads` for team info
- Player detail: Show player_name, player_role, team, and any `player_match_stats` for matches they've played

### 5. MEDIUM: Long-Term Bets — Test & Fix End-to-End

**Context:** Components built in `ui/src/components/long-term/` and `ui/src/pages/LongTermBets.js`. Uses `ui/src/hooks/useLongTermBets.js`.

**Test & Fix:**
- Verify config loads from `long_term_bets_config` table (event_id = 't20wc_2026')
- Team pickers (TournamentWinner, Finalists, FinalFour) show 20 teams from `squads`
- Player pickers (OrangeCap, PurpleCap) show players from `players` table
- Submit saves to `long_term_bets` table
- Existing submission loads correctly on revisit
- Lock state respects `is_locked` and `lock_time` from config
- LongTermSummary shows correct checklist and submit button

### 6. MEDIUM: Groups — Verify End-to-End

**Context:** Group functionality uses `groups` and `group_members` tables. API functions in `ui/src/api.js` (lines 611-793).

**Test & Fix:**
- Create group → saves to `groups` table with join_code
- Join group via code → adds to `group_members`
- Group detail page shows members with display names and scores
- Group leaderboard sorts by score correctly

### 7. MEDIUM: Profile Page Enhancement

**Current:** `ui/src/pages/Profile.js` is minimal.

**Add:**
- Display user's rank and total points from `leaderboard` table
- Display name editing → updates `leaderboard.display_name` and `users.display_name`
- Recent bet history (last 5 matches with scores)
- Link to Stats page for full breakdown

### 8. LOW: Vercel Cron for Status Updates (Optional)

**Context:** The frontend handles locking via `lock_time`, so a cron job isn't critical. But the DB `status` column should still be updated for admin visibility.

**Option A — Vercel Cron:**
- Create `ui/api/cron/update-matches.js` as a serverless function
- Add to `vercel.json`: `{ "crons": [{ "path": "/api/cron/update-matches", "schedule": "0 * * * *" }] }`
- Function logic: same as `scripts/open-matches.js` (set past OPEN matches to LOCKED, update questions status)

**Option B — Admin Button:**
- Add a "Sync Match Statuses" button to AdminDashboardV2.js that runs the open/lock logic on demand

### 9. LOW: Mobile Responsiveness Audit

Review on mobile devices:
- MatchBetting V2 (player picks + side bets UI must be usable)
- Leaderboard table
- Stats breakdowns bar charts
- Admin MatchConfig tabs (especially Side Bets tab with template picker)

---

## CRITICAL RULES

1. **ALL point values come from DB** — never hardcode. match_config stores base points, player_slots stores multipliers, side_bets stores correct/wrong points, long_term_bets_config stores tournament points.

2. **Match IDs use `wc_m` prefix** — e.g., `wc_m1`, `wc_m2`. Never use bare numbers.

3. **Admin email check** — uses `getAdminEmail()` from config.js. Compares with `user.email`.

4. **Deploy from project root** — `vercel --prod` from `D:\Fantasy sports game`, NOT from `ui/`. The `.vercel/project.json` at root points to the correct Vercel project.

5. **20 Teams in T20 WC 2026** — Groups: A(USA,PAK,IND,NAM,NED), B(ZIM,SL,AUS,OMAN,IRE), C(SCO,WI,ENG,ITA,NEP), D(NZ,RSA,UAE,AFG,CAN)

6. **Scoring RPC** — `calculate_match_scores(TEXT, TEXT)` — single canonical version in Supabase. Do NOT create additional overloads. The full function source is in `scripts/sql/012_fix_duplicate_scoring_function.sql`.

7. **Frontend locking** — MatchBetting.js checks `new Date(lockTime) <= new Date()` to block betting. Don't rely solely on DB status column.

8. **Side bets are pre-populated** — All 55 matches have 4 default side bets. Admin customizes via MatchConfig. Template bank at `data/side-bet-templates.json` has 25 templates across 8 categories.

---

## PROMPT END
