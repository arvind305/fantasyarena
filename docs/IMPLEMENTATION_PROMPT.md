# Handoff Prompt — Fantasy Sports Game (T20 World Cup 2026)

Copy everything below into a new Claude Code session to continue work.

---

## PROMPT START

I'm building a Fantasy Sports Game for the T20 World Cup 2026 (Feb-Mar 2026). The tournament is **already underway** — matches are being played and users are actively betting. I need help with remaining tasks.

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

### Match ID Format
All match IDs use prefix `wc_m` followed by number: `wc_m1`, `wc_m2`, ..., `wc_m55`. This is consistent across bets, match_config, match_questions, match_results, and side_bets.

### Current Users (4 active)
- Arvind Sridharan (admin) — 5000 pts
- Tanay Somani — 4950 pts
- Sukant Somani — 4000 pts
- Shashank — 2000 pts

### Scoring Flow (working end-to-end)
1. Admin opens matches via `scripts/open-matches.js` (rolling 3-day window)
2. Users place bets before lock_time (match start)
3. After match: Admin enters results in ScoreMatch page (`/admin/score/:matchId`)
4. Admin clicks "Calculate Scores" → calls `calculate_match_scores` RPC
5. RPC scores all bets (WINNER, TOTAL_RUNS, PLAYER_PICKS, SIDE_BETS, RUNNERS), updates leaderboard

### What's DONE
- **Phase 1 (DB Schema):** All 8 new tables created, indexes, RLS policies ✓
- **Phase 2 (Seeding):** 20 squads, 300 players, 55 match configs, 165 player slots seeded ✓
- **Phase 3 (Betting UI):** 10 betting components, 2 hooks (useBet, useMatchConfig) ✓
- **Phase 4 (Admin Dashboard):** MatchConfig (5 tabs), MatchList, ScoreMatch, AdminDashboardV2, LongTermConfig ✓
- **Phase 5 (Long-Term Bets):** 6 long-term components, useLongTermBets hook, LongTermBets.js rewritten ✓
- **Scoring:** Matches wc_m1, wc_m2, wc_m3 scored successfully ✓
- **Leaderboard:** Working with MatchLeaderboard component ✓
- **Stats page:** Rewritten with real BreakdownsTab (fetches scored bets from Supabase) ✓
- **Side bet template bank:** 25 T20 templates in `data/side-bet-templates.json`, integrated into admin MatchConfig ✓
- **Match opening script:** `scripts/open-matches.js` — opens matches for today+2 days, locks past matches ✓

### Existing Admin Pages & Routes
```
/admin/dashboard    → AdminDashboardV2.js
/admin/matches      → MatchList.js
/admin/match/:id    → MatchConfig.js (tabs: Basic, Slots, Side Bets, Runners, Stats)
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

## REMAINING OPEN TASKS (Priority Order)

### 1. CRITICAL: Score Remaining Matches as They Complete
Matches wc_m1 through wc_m3 are scored. As new matches complete during the tournament, admin needs to:
1. Go to `/admin/score/wc_mN`
2. Enter winner, total runs, side bet answers
3. Enter player stats in MatchConfig → Player Stats tab
4. Click "Calculate Scores"

No code changes needed — the flow works. But consider adding:
- **Batch scoring page** — score multiple matches at once
- **Auto-import stats** — fetch player stats from a cricket API instead of manual entry

### 2. HIGH: Stats Page — Bet History Tab Reads from localStorage
The `OverviewTab` and `BetHistoryTab` in `ui/src/pages/Stats.js` still read bets from `localStorage` (`betting_arena_state`). This was the pre-Supabase storage. They should be updated to:
- Fetch from Supabase `bets` table instead of localStorage
- Join with match data for display
- The `BreakdownsTab` already reads from Supabase correctly — follow its pattern

### 3. HIGH: Add Side Bets to Upcoming Matches
The side bet template bank is ready at `data/side-bet-templates.json` with 25 templates. Admin workflow:
1. Go to `/admin/match/wc_mN` → Side Bets tab
2. Click "Pick from Template Bank"
3. Select templates, adjust points if needed
4. Save

Consider automating: a script that adds a default set of 3-4 side bets to all OPEN matches that don't have any yet.

### 4. MEDIUM: MatchBetting.js V2 Mode Testing & Polish
`ui/src/pages/MatchBetting.js` has dual V1/V2 mode. V2 mode uses the new betting components (PlayerPicks, SideBets, Runners). Verify:
- V2 mode activates when match has `match_config` in Supabase
- Player picks dropdown shows correct team squads
- Side bets display correctly with options from `side_bets` table
- Runner picker works (if enabled for match)
- BetSummary shows all selections before submit
- `apiSubmitBetV2()` saves correctly to all bets columns

### 5. MEDIUM: Teams & Players Pages — Connect to Supabase
`ui/src/pages/Teams.js` and `ui/src/pages/Players.js` currently use mock engine data. They should:
- Fetch from Supabase `squads` and `players` tables
- Show real player data (name, role, team)
- Team detail page should show full squad

### 6. MEDIUM: Groups — Verify End-to-End
Groups use Supabase (`groups`, `group_members` tables). Verify:
- Creating a group works
- Joining via code works
- Group leaderboard shows correctly
- Group member list displays

### 7. LOW: Long-Term Bets — Test End-to-End
The components are built. Verify:
- Config loads from `long_term_bets_config`
- Team/player pickers show correct data from `squads`/`players` tables
- Submit saves to `long_term_bets` table
- Lock/unlock works based on admin config
- Edit with cost works when enabled

### 8. LOW: Profile Page Enhancement
`ui/src/pages/Profile.js` is minimal. Consider adding:
- Display name editing (saves to `leaderboard` table)
- Total points display
- Rank display
- Recent bet history summary

### 9. LOW: Cron Job for Match Opening
`scripts/open-matches.js` works but needs to be run manually. Set up:
- A Vercel cron job or GitHub Action to run it daily
- Or integrate the logic into the admin dashboard as a button

### 10. LOW: Mobile Responsiveness Audit
Review all pages on mobile devices. Key pages to check:
- MatchBetting (V2 with player picks + side bets)
- Leaderboard
- Stats breakdowns
- Admin MatchConfig tabs

---

## CRITICAL RULES

1. **ALL point values come from DB** — never hardcode. match_config stores base points, player_slots stores multipliers, side_bets stores correct/wrong points, long_term_bets_config stores tournament points.

2. **Match IDs use `wc_m` prefix** — e.g., `wc_m1`, `wc_m2`. Never use bare numbers.

3. **Admin email check** — uses `getAdminEmail()` from config.js. Compares with `user.email`.

4. **Deploy from project root** — `vercel --prod` from `D:\Fantasy sports game`, NOT from `ui/`. The `.vercel/project.json` at root points to the correct Vercel project.

5. **20 Teams in T20 WC 2026** — Groups: A(USA,PAK,IND,NAM,NED), B(ZIM,SL,AUS,OMAN,IRE), C(SCO,WI,ENG,ITA,NEP), D(NZ,RSA,UAE,AFG,CAN)

6. **Scoring RPC** — `calculate_match_scores(TEXT, TEXT)` — single canonical version in Supabase. Do NOT create additional overloads.

---

## PROMPT END
