# Betting System Specification

> Version: 2.0
> Last Updated: 2026-02-08
> Status: Pending Implementation
> Reference: `scoring-engine/models.ts` for type definitions

## Overview

This document defines the complete betting system for the Fantasy Sports Game. All bet types, scoring logic, and admin controls are specified here.

---

## Per-Match Bets

These bets are available for each match. Default configuration includes bets 1, 2, 3 (at least 1 player), and 4 (at least 1 side bet). Runners are optional.

### 1. Match Winner

**Description:** Predict which team will win the match.

**Options:**
- Team A
- Team B
- Super Over (match ends in a tie, decided by super over)

**Scoring:**
| Prediction | Outcome | Points |
|------------|---------|--------|
| Correct team | Team wins | x |
| Wrong team | Team loses | 0 |
| Super Over | Super over occurs | 5x |
| Super Over | No super over | 0 |

**Admin Controls:**
- `x` value (base points) - configurable per match

---

### 2. Total Runs

**Description:** Predict the combined total runs scored by both teams, including super over runs if applicable.

**Input:** Numeric value (integer)

**Scoring:**
| Absolute Difference | Points |
|---------------------|--------|
| Exact (0) | 5x |
| 1 | x |
| 2-5 | 0.5x |
| 6-10 | 0.25x |
| 11-15 | 0.1x |
| >15 | 0 |

**Admin Controls:**
- `x` value (base points) - configurable per match

---

### 3. Player Picks

**Description:** Select players from the playing teams. Each selected player earns points based on their in-match performance multiplied by the slot's multiplier.

**Mechanics:**
- User selects a team first, then picks a player from that team's squad (11-15 players)
- Admin defines how many player slots are available (0 to N)
- Each slot has an admin-defined multiplier
- Multipliers are typically in descending order (e.g., 100x, 90x, 70x, ... 2x)

**Scoring:**
```
User Points = Player's Performance Points × Slot Multiplier
```

**Player Performance Points** (defined in `scoring-engine/models.ts`):

| Stat | Points |
|------|--------|
| Runs scored | 1 point per run |
| Each 4 | 10 points |
| Each 6 | 20 points |
| Strike Rate | Exact SR converted to points (e.g., SR 150 = 150 pts) |
| Each catch | 5 points |
| Each run out | 5 points |
| Each stumping | 5 points |
| Each wicket | 20 points |
| Economy ≤6 | 100 points |
| Economy >6 and ≤8 | 50 points |
| Economy >8 and ≤10 | 25 points |
| Economy >10 | 0 points |
| Century (100+ runs) | +200 bonus |
| 5-wicket haul | +200 bonus |
| Hat-trick | +200 bonus |
| Man of the Match | +200 bonus |

**UI Flow:**
1. Show team selector (Team A / Team B)
2. Show dropdown of players from selected team only (11-15 players)
3. Display the multiplier for each slot clearly

**Admin Controls:**
- Number of player slots (0 = disabled)
- Multiplier for each slot
- Can create "chaos" by adjusting multipliers at different tournament stages

**Example Configuration:**
| Slot | Multiplier |
|------|------------|
| 1 | 100x |
| 2 | 90x |
| 3 | 70x |
| 4 | 50x |
| 5 | 30x |
| 6 | 20x |
| 7 | 15x |
| 8 | 10x |
| 9 | 5x |
| 10 | 3x |
| 11 | 2x |

---

### 4. Side Bets

**Description:** Additional prediction questions with multiple choice answers. Can have positive or negative point values.

**Format:**
- Question text
- 4-5 answer options
- Points for correct answer: +x
- Points for wrong answer: 0 or -x (admin choice)

**Admin Controls:**
- Number of side bets per match (1 or more)
- Question text and options
- Points for correct answer
- Points for wrong answer (can be negative)

**Examples:**

1. **Yes/No Questions:**
   - "Will a century be scored in this match?" → Yes / No
   - "Will the number of wides be >10 in this match?" → Yes / No
   - "Will the number of wides be >10 in the first 8 overs of the first innings?" → Yes / No

2. **Multiple Choice Questions:**
   - "Who will be the Man of the Match?"
     - Top 3 batsmen from either side
     - Batsmen 4-6 from either side
     - Batsmen 7-11 from either side

   - "Who will give lesser runs in the game (both sides)?"
     - Spinners
     - Pacers

   - "How many runs will be scored in the powerplay of the first innings?"
     - ≤30
     - 31-50
     - 51-80
     - 81-100
     - >100

---

### 5. Runners

**Description:** Select other authenticated players whose match score will be added to yours.

**Mechanics:**
- Admin decides if runners are enabled for a match
- User can pick runners from their **group** OR the **global leaderboard**
- Runner's NET points for the match are added to user's NET points
- **Risk:** If the runner doesn't place a bet, their points = 0, which still gets added

**Scoring:**
```
User's Final Score = User's Own Points + Sum(Runner Points)
```

**Admin Controls:**
- Enable/disable runners per match
- Number of runners allowed (if enabled)

**Note:** This creates interesting social dynamics and strategy. Picking a runner who doesn't bet is a risk the user takes.

---

## Long-Term Bets (Separate Page)

These bets are made at the start of the tournament and cover tournament-wide predictions.

### Tournament Predictions

| Bet Type | Description | Picks Allowed |
|----------|-------------|---------------|
| Winning Team | Predict tournament winner | 1 team |
| Finalists | Predict the final 2 teams | 2 teams |
| Final 4 | Predict semi-finalists | 4 teams |
| Top Run Scorer | Predict Orange Cap winner | 2 players |
| Top Wicket Taker | Predict Purple Cap winner | 2 players |

**Scoring:**
- Correct prediction: x points (per correct pick)
- Wrong prediction: 0 points

**Admin Controls:**
- Points value (x) for each bet type
- Lock date/time (admin-defined, can be opened/closed at any point)
- Allow bet changes at a cost (% of user's total earned points)

**Lock Timing:** Admin-defined date and time. Admin can open and close betting at any point during the tournament.

---

## Admin Configuration Summary

| Setting | Scope | Description |
|---------|-------|-------------|
| Base Points (x) | Per match, per bet type | Point multiplier base |
| Player Slots | Per match | Number of players user can pick |
| Slot Multipliers | Per match | Multiplier for each player slot |
| Side Bet Count | Per match | Number of side bets |
| Side Bet Negative | Per side bet | Whether wrong answers lose points |
| Runners Enabled | Per match | Allow runner selection |
| Runner Count | Per match | How many runners allowed |
| Long-term Points | Tournament | Points for long-term predictions |
| Change Cost % | Tournament | Cost to modify long-term bets |

---

## Default Match Configuration

Every match should have at minimum:
1. **Match Winner** - Required
2. **Total Runs** - Required
3. **Player Picks** - At least 1 slot
4. **Side Bets** - At least 1

Runners are optional and added at admin discretion.

---

## Resolved Questions

1. **Player Performance Points:** Defined in `scoring-engine/models.ts` - see Section 3 above.

2. **Side Bet Examples:** See Section 4 above for 6 example types.

3. **Runner Scope:** Users can pick from their group OR the global leaderboard.

4. **Long-term Lock:** Admin-defined date/time, can be opened/closed at any point.

5. **Super Over Runs:** Always included in total runs prediction.

---

## Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Match Winner | Partial | Needs super over option, admin points config |
| Total Runs | Done | Scoring tiers implemented (5x, 1x, 0.5x, 0.25x, 0.1x, 0) |
| Player Picks | Not Started | Requires player data, squad dropdowns, multiplier UI |
| Side Bets | Not Started | Requires admin UI for question creation |
| Runners | Not Started | Requires user picker from group/global |
| Long-term Bets | Not Started | Separate page needed |
| Admin Dashboard | Not Started | Central control panel needed |
| Player Performance Scoring | Done | models.ts updated with SR and 4-tier economy |

---

## Architecture Notes

### Data Flow
1. Admin creates match with question configuration
2. Users place bets before lock time (first ball)
3. Match completes, admin enters results/stats
4. Scoring engine calculates points per bet
5. Leaderboard updates

### Key Tables Needed
- `match_questions` - Per-match bet configuration
- `player_slots` - Slot multipliers per match
- `side_bets` - Side bet definitions
- `player_stats` - Player performance data per match
- `squads` - Team squad lists (11-15 players)
- `long_term_bets` - Tournament-level predictions
- `long_term_config` - Lock times, point values

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2026-02-08 | Complete rewrite with full bet specifications, player scoring, side bet examples, runner rules |
| 1.0 | 2026-02-01 | Initial MVP with WINNER and TOTAL_RUNS only |
