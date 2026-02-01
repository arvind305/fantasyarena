# DOMAIN MODEL AND DATA CONTRACTS

**Status:** Constitutional-level authority
**Version:** 1.0
**Sport (initial):** Cricket (IPL T20) — model is sport-agnostic by design

---

## 1. CORE ENTITIES

### Tournament / Event

| Field | Type | Description |
|-------|------|-------------|
| eventId | string | Canonical identifier |
| name | string | Display name (e.g. "IPL 2025") |
| sport | string | Sport identifier (e.g. "cricket") |
| format | string | Format identifier (e.g. "t20") |
| season | string | Season or year |
| status | enum | UPCOMING / ACTIVE / COMPLETED / CANCELLED |
| startDate | datetime | Tournament start |
| endDate | datetime | Tournament end |
| rulesetVersion | string | Governing ruleset for scoring |

- **External Source Owned:** YES (schedule, name, dates)
- **System Generated:** YES (eventId, status transitions)
- **User Generated:** NO

---

### Team

| Field | Type | Description |
|-------|------|-------------|
| teamId | string | Canonical identifier, stable across seasons |
| name | string | Official team name |
| shortName | string | Abbreviation (e.g. "CSK") |
| sport | string | Sport identifier |
| logoUrl | string | Team logo asset reference |

- **External Source Owned:** YES
- **System Generated:** NO
- **User Generated:** NO

---

### Player

| Field | Type | Description |
|-------|------|-------------|
| playerId | string | Canonical identifier, stable across tournaments |
| name | string | Display name |
| role | string | Primary role (e.g. BAT, BOWL, AR, WK) |
| nationality | string | Country of origin |

- **External Source Owned:** YES
- **System Generated:** NO
- **User Generated:** NO

---

### Match

| Field | Type | Description |
|-------|------|-------------|
| matchId | string | Canonical identifier |
| eventId | string | Parent tournament |
| teamA | TeamId | First team |
| teamB | TeamId | Second team |
| scheduledTime | datetime | Scheduled start |
| venue | string | Ground / stadium |
| status | enum | UPCOMING / LIVE / COMPLETED / ABANDONED / NO_RESULT |
| isAbandoned | boolean | Whether match was abandoned |
| includesSuperOver | boolean | Whether a super over occurred |
| bettingLockedAt | datetime | Exact time bets were frozen |

- **External Source Owned:** YES (schedule, teams, venue, result status)
- **System Generated:** YES (matchId, bettingLockedAt, status transitions)
- **User Generated:** NO

---

### Squad

The squad is the **match-specific roster** — the set of players a team has selected for a particular match. This is NOT the franchise roster; it is the playing XI plus substitutes as declared for a specific match.

| Field | Type | Description |
|-------|------|-------------|
| matchId | string | The match this squad is for |
| teamId | string | The team this squad belongs to |
| playerIds | PlayerId[] | Ordered list of player IDs in the squad |
| playingXI | PlayerId[] | Confirmed playing XI (subset of playerIds) |
| lastUpdatedAt | datetime | When the squad was last ingested/updated |
| isFinal | boolean | Whether the squad is confirmed (toss done) |

- **External Source Owned:** YES
- **System Generated:** NO (ingested, not invented)
- **User Generated:** NO

---

### User

| Field | Type | Description |
|-------|------|-------------|
| userId | string | Canonical identifier |
| displayName | string | Chosen display name |
| email | string | Authentication identity |
| avatarUrl | string | Profile image |
| createdAt | datetime | Registration timestamp |

- **External Source Owned:** NO
- **System Generated:** YES (userId, createdAt)
- **User Generated:** YES (displayName, email, avatar)

---

### Group

A group is a **leaderboard overlay**. It does not affect scoring. It is a social container.

| Field | Type | Description |
|-------|------|-------------|
| groupId | string | Canonical identifier |
| name | string | Group display name |
| joinCode | string | Shareable code for joining |
| createdBy | UserId | Creator |
| memberIds | UserId[] | Current members |
| eventId | string | Tournament scope |
| createdAt | datetime | Creation timestamp |

- **External Source Owned:** NO
- **System Generated:** YES (groupId, joinCode)
- **User Generated:** YES (name, membership)

---

### BettingQuestion

A betting question is a **parameterized prompt** attached to a match or tournament. The system generates questions; admins may configure which question templates are active per match.

| Field | Type | Description |
|-------|------|-------------|
| questionId | string | Canonical identifier |
| matchId | string (nullable) | Null for long-term / tournament-level questions |
| eventId | string | Parent tournament |
| type | enum | MATCH_WINNER / TOSS_WINNER / TOP_SCORER / PLAYER_PERFORMANCE / MILESTONE / CUSTOM |
| text | string | Human-readable question |
| optionType | enum | TEAM_PICK / PLAYER_PICK / NUMERIC / YES_NO / MULTIPLE_CHOICE |
| options | BettingOption[] | Valid answer set |
| status | enum | DRAFT / OPEN / LOCKED / RESOLVED |
| correctOptionId | string (nullable) | Set after resolution |
| resolvedAt | datetime (nullable) | When outcome was determined |
| createdAt | datetime | When question was created |

- **External Source Owned:** NO (but options may derive from external data)
- **System Generated:** YES
- **User Generated:** NO (admin may select templates, but does not author free-form)

---

### BettingOption

| Field | Type | Description |
|-------|------|-------------|
| optionId | string | Canonical identifier |
| questionId | string | Parent question |
| label | string | Display text |
| referenceType | enum (nullable) | PLAYER / TEAM / NUMERIC_RANGE / NONE |
| referenceId | string (nullable) | PlayerId or TeamId if applicable |

- **External Source Owned:** Partially (player/team references come from external data)
- **System Generated:** YES
- **User Generated:** NO

---

### UserBet

A user bet is a **single atomic submission** for a match. It may contain answers to multiple questions, player picks across slots, and a match result prediction.

| Field | Type | Description |
|-------|------|-------------|
| betId | string | Canonical identifier |
| userId | string | Who placed the bet |
| matchId | string | Which match |
| matchResultPrediction | enum (nullable) | TEAM_A / TEAM_B / SUPER_OVER |
| totalRunsPrediction | number (nullable) | Predicted total runs |
| playerPicks | PlayerPick[] | Slot-assigned player selections |
| runnerPicks | RunnerPick[] | Proxy user selections |
| sideBetAnswers | SideBetAnswer[] | Answers to side-bet questions |
| isLocked | boolean | Whether this bet is frozen |
| submittedAt | datetime | Submission timestamp |
| lockedAt | datetime (nullable) | When bet was frozen |
| score | number (nullable) | Computed after match resolution |

**Sub-types:**

- **PlayerPick:** `{ playerId: PlayerId, slotNumber: SlotId (1-11) }`
- **RunnerPick:** `{ runnerUserId: UserId }`
- **SideBetAnswer:** `{ sideBetId: QuestionId, selectedOption: OptionId }`

- **External Source Owned:** NO
- **System Generated:** YES (betId, isLocked, lockedAt, score)
- **User Generated:** YES (all predictions and picks)

---

### LongTermBet

| Field | Type | Description |
|-------|------|-------------|
| longTermBetId | string | Canonical identifier |
| userId | string | Who placed the bet |
| eventId | string | Tournament scope |
| questionId | string | Which long-term question |
| selectedOptionId | string | Chosen answer |
| submittedAt | datetime | Submission timestamp |
| isLocked | boolean | Locked once tournament begins |
| isResolved | boolean | Whether outcome is known |
| isCorrect | boolean (nullable) | Whether prediction was right |

- **External Source Owned:** NO
- **System Generated:** YES (longTermBetId, lock/resolve status)
- **User Generated:** YES (selection)

---

## 2. RELATIONSHIPS

- **Tournament → Teams:** A tournament contains a fixed set of participating teams. Teams are registered to the tournament via external source ingestion.
- **Team → Players:** A team has a franchise roster of players for a given tournament/season. This roster is externally sourced.
- **Match → Tournament:** Every match belongs to exactly one tournament (match.eventId → tournament.eventId).
- **Match → Teams:** Every match has exactly two teams: teamA and teamB.
- **Squad → Match + Team:** A squad is the intersection of one team and one match. There are exactly two squads per match.
- **Squad → Players:** A squad contains a subset of the team's franchise roster. The playing XI is a further subset of the squad.
- **BettingQuestion → Match:** A match-level question is scoped to one match. A tournament-level question has matchId = null.
- **BettingQuestion → BettingOptions:** Each question has a closed set of valid options.
- **BettingOption → Player or Team:** Options of type PLAYER_PICK reference a playerId; options of type TEAM_PICK reference a teamId. Referenced players MUST be members of one of the two squads for that match.
- **UserBet → Match + User:** A user bet is scoped to one match and one user. A user has at most one bet per match.
- **UserBet.playerPicks → Players:** Each player pick references a playerId that MUST exist in one of the two match squads.
- **UserBet.runnerPicks → Users:** Each runner pick references another userId within the same group context.
- **LongTermBet → Tournament + User + Question:** Scoped to one tournament-level question and one user.
- **User → Groups:** Many-to-many. A user may belong to multiple groups.
- **Group → Tournament:** A group is scoped to one tournament.
- **Leaderboard:** Derived view. Leaderboards are computed by aggregating UserBet.score across matches, optionally filtered by Group.memberIds. Leaderboards are NOT stored entities — they are computed on read.

---

## 3. CRITICAL INVARIANTS (NON-NEGOTIABLE)

### Match Integrity
1. A match always has exactly two teams.
2. A match has exactly two squads — one per team.
3. Match status transitions are strictly ordered: UPCOMING → LIVE → COMPLETED | ABANDONED | NO_RESULT. No backward transitions.
4. A match cannot transition to LIVE without both squads having isFinal = true.

### Squad Integrity
5. Squad playerIds MUST be a subset of the team's franchise roster for that tournament.
6. PlayingXI MUST be a subset of the squad's playerIds.
7. Squad data is sourced externally. The system never invents squad members.
8. Squads may update before the match starts (before betting locks). After bettingLockedAt, squad changes trigger re-validation — see section 5.

### Betting Questions
9. Betting questions are immutable once status = OPEN. Text, type, and options cannot change.
10. PLAYER_PICK options for a match-level question MUST reference only players in the union of that match's two squads.
11. TEAM_PICK options for a match-level question MUST reference only teamA or teamB of that match.
12. A question transitions OPEN → LOCKED atomically when the match goes LIVE.
13. A question can only be RESOLVED after the match is COMPLETED or ABANDONED.
14. correctOptionId must reference a valid optionId belonging to that question.

### User Bets
15. Bets lock atomically at first ball (match status → LIVE). No bet modifications after lock.
16. A user may submit at most one bet per match.
17. All playerPicks in a UserBet MUST reference players present in the union of the two match squads.
18. All playerPicks must map to distinct players — no duplicate playerId in a single bet.
19. Slot numbers in playerPicks must be unique integers in range [1, 11].
20. A bet cannot be submitted without user authentication.
21. A bet cannot be submitted for a match whose status is not UPCOMING.
22. sideBetAnswers must reference valid questionIds with status OPEN and valid optionIds within those questions.

### Long-Term Bets
23. Long-term bets lock when the tournament status transitions to ACTIVE.
24. A user may submit at most one answer per long-term question.

### Scoring
25. Scoring is deterministic: identical inputs always produce identical scores.
26. Scoring is governed by a versioned ruleset (constitutionVersion). The ruleset version is stamped on every score output.
27. Slot multipliers are applied after base score computation — never before.
28. A player earns zero base score if they did not participate (bat or bowl or field) in the match.
29. Score recalculation never changes the ruleset retroactively — a match scored under v1.0 stays v1.0.

### Groups & Leaderboards
30. Groups are leaderboard overlays only. Group membership never affects bet scoring.
31. Leaderboards are derived views, not stored state. They are always recomputable from UserBet scores.
32. A user's score in a group leaderboard is identical to their score in the global leaderboard — groups only filter, never modify.

### Identity
33. Player IDs are stable across tournaments and seasons. The same human player retains the same playerId.
34. Team IDs are stable across seasons.
35. All references use canonical IDs, never display names.

---

## 4. DATA CONTRACTS (WHAT THE UI CAN ASSUME)

### Match API
- GET /match/{matchId} always returns: matchId, eventId, teamA (full team object), teamB (full team object), scheduledTime, status, isAbandoned, includesSuperOver.
- Squads are included in the match response when available. If squads are not yet announced, the squads field is an empty array — never null, never absent.
- teamA and teamB are never null. A match always has both.

### Betting Questions API
- GET /match/{matchId}/questions returns an array of BettingQuestion objects.
- Every question includes its full options array inline. Options are never fetched separately.
- Options with referenceType = PLAYER always include a valid playerId that exists in the match squads.
- Options with referenceType = TEAM always include a valid teamId matching teamA or teamB.
- The options array is never empty for an OPEN question.
- Questions with status = LOCKED or RESOLVED are still returned (for display) but the UI must treat them as read-only.

### User Bets API
- POST /match/{matchId}/bets is the sole mutation endpoint. The server validates all invariants (squad membership, slot uniqueness, question validity) and rejects invalid submissions with structured error responses.
- GET /match/{matchId}/bets/{userId} returns the full UserBet or 404 if no bet exists.
- The server — not the client — enforces lock timing.

### Teams & Players API
- GET /teams returns all teams for the active tournament.
- GET /players returns all players, filterable server-side by teamId, role, etc.
- GET /players/{playerId} returns full player profile including stats history.
- Player IDs are stable. The UI may cache playerId → name mappings within a session.

### Leaderboard API
- GET /leaderboard?scope={global|group}&scopeId={id} returns a ranked list.
- Leaderboard entries include: rank, userId, displayName, totalScore, matchesPlayed.
- Rankings are always computed server-side. The UI never sorts or re-ranks.

### Long-Term Bets API
- GET /events/{eventId}/long-term-bets returns all long-term questions with options.
- Submission and lock rules are enforced server-side.

### General Contracts
- All IDs are opaque strings. The UI must never parse, construct, or derive meaning from ID formats.
- All timestamps are ISO 8601 UTC.
- Display names are presentation-only. IDs are canonical for all lookups, comparisons, and references.
- All list endpoints return arrays — empty array for no results, never null.
- Error responses use structured JSON with an `error` field containing a machine-readable code and a `message` field containing a human-readable description.

---

## 5. EXTERNAL DATA INGESTION ASSUMPTIONS

### What External Systems Must Provide
- **Tournament metadata:** Name, dates, participating teams, format.
- **Team rosters:** Full franchise roster per team per tournament.
- **Match schedule:** All matches with teams, dates, venues.
- **Squad announcements:** Per-match squads and playing XI, ideally at toss time.
- **Live match status:** First ball event (triggers bet lock), match completion, abandonment.
- **Player match stats:** Full scorecard data after match — runs, wickets, catches, etc.
- **Man of the Match:** Award designation.
- **Match result:** Winner, super over occurrence, abandonment, no-result.

### Finality Rules
- **Tournament metadata:** Final once ingested. Updates (e.g. date changes) overwrite.
- **Team rosters:** Updateable until tournament starts. After that, additions only (mid-season trades/replacements).
- **Match schedule:** Updateable until 24 hours before match. Rescheduling overwrites scheduledTime.
- **Squads:** Updateable until betting locks (first ball). After lock, squad changes do NOT invalidate existing bets — see below.
- **Player stats:** Considered provisional for 2 hours after match completion. After that, final.
- **Match result:** Considered final when status = COMPLETED and stats are finalized.

### Late Squad Changes (After Betting Lock)
If a squad changes after bets are locked (e.g. concussion substitute):
- Existing bets remain valid and unchanged.
- If a user picked a player who is replaced out, that player scores zero (no participation).
- The replacement player is not retroactively inserted into any bet.
- This is by design: the user accepted risk when picking.

### Abandoned Matches
- Match status → ABANDONED.
- All bets for that match are voided: score = 0 for all users.
- Side bets and match-winner predictions are also voided.
- The match does not count toward leaderboard totals (matchesPlayed is not incremented).

### No-Result Matches
- Treated identically to abandoned for scoring purposes.

### Player Stats Ingestion Checkpoints
- **Innings break:** Partial stats checkpoint (batting complete for one innings).
- **Match end:** Full stats ingestion.
- **Post-match correction window:** 2-hour window for stat corrections from official sources.
- **Finalization:** After correction window, stats are frozen. Scores are computed and cached.

---

## 6. WHAT THE UI MUST NEVER DO

1. **Filter players by team for betting options.** The server provides the valid option set. The UI renders it. Period.
2. **Validate whether a player belongs to a squad.** The server enforces squad membership in bet submission.
3. **Determine whether betting is open or closed.** The server returns question/match status. The UI reads status, never computes it.
4. **Compute or re-compute scores.** Scores are server-provided. The UI displays them.
5. **Sort or re-rank leaderboard entries.** Rankings are server-computed. The UI preserves server order.
6. **Allow free-text player input.** All player references must use server-provided option sets with canonical IDs.
7. **Guess or infer squad composition.** If the server hasn't provided squad data, the UI shows "Squad not yet announced."
8. **Construct player IDs, match IDs, or any canonical identifier.** IDs are opaque and server-assigned.
9. **Cache and reuse stale squad data across matches.** Squads are match-specific. Previous match squads are irrelevant.
10. **Make scoring assumptions based on display text.** Multiplier values, point rules, and scoring tiers are server-governed.
11. **Determine match result or winner.** The server declares outcomes.
12. **Implement bet locking logic.** The server enforces lock timing. The UI should poll or subscribe to status changes.
13. **Modify, amend, or delete a submitted bet.** Bet mutation is a server-side concern. If allowed (pre-lock), it is a server endpoint, not a client-side operation.

---

## 7. FUTURE SPORT EXTENSIBILITY

### Sport-Agnostic Architecture

The domain model is parameterized by **sport** and **format** at the Tournament level. All sport-specific logic lives in:

- **Rulesets:** Scoring formulas, stat definitions, and point allocations are versioned per sport. Cricket has its batting/bowling/fielding breakdown; football would have goals/assists/clean-sheets; etc.
- **Stat schemas:** PlayerMatchStats is sport-specific. The system defines a stat schema per sport. The scoring engine consumes stats through the schema contract, not through hardcoded field names.
- **Question templates:** BettingQuestion types and option generation logic are sport-specific. Cricket has "top scorer" and "hat-trick"; football has "first goal scorer" and "clean sheet."

### Non-Player-Based Bet Types

The BettingQuestion.optionType enum supports:
- TEAM_PICK — already in model
- NUMERIC — total runs, total goals, margin of victory
- YES_NO — will there be a super over, will there be a red card
- MULTIPLE_CHOICE — generic multi-option (e.g. "which half will have more goals")

These require no player reference and work for any sport.

### Different Match Structures

- **Two-team matches (cricket, football, basketball):** teamA + teamB as modeled.
- **Solo competitions (tennis, golf):** Model as teamA = player-as-team, teamB = opponent-as-team. Squad = single player.
- **Multi-participant (F1, marathons):** Model as a tournament-level event rather than a match. Betting questions attach to the event, not to a two-team match. The Match entity may be replaced or extended with a "CompetitionRound" entity.
- **Multi-leg matches (tennis sets, test cricket days):** The Match entity represents the full match. Intermediate states are ingested as stat checkpoints, not separate matches.

### Tournament vs League Formats

- **Knockout tournaments:** Matches have round metadata (quarter-final, semi-final, etc.).
- **Round-robin leagues:** Matches have matchday/week metadata.
- **Hybrid (e.g. IPL — group stage + playoffs):** The Tournament entity supports phases. Matches are tagged with phase identifiers.
- **Seasonal leagues (Premier League):** Tournament.season distinguishes years. Team and player IDs remain stable across seasons.

### Adding a New Sport (Process)

1. Define a new stat schema for PlayerMatchStats.
2. Define a new scoring ruleset (constitutional document) with base scores and multipliers.
3. Define question templates and option generation rules.
4. Register the sport identifier.
5. No changes to User, Group, Bet, or Leaderboard entities — these are sport-agnostic.

---

## 8. OPEN QUESTIONS / AMBIGUITIES

1. **Runner Picks scope:** The current model includes RunnerPick (proxy scoring from another user). It is unclear whether runner picks are scoped within a group or globally. If globally, any authenticated user could be a runner. If group-scoped, the valid runner set is the group's memberIds. **This must be decided.**

2. **Bet editability window:** Can a user edit their bet before lock? The current model stores a single UserBet per user per match. If edits are allowed, should the system overwrite the existing bet or maintain an audit trail of submissions? **This must be decided.**

3. **Slot count rigidity:** The current model assumes exactly 11 player picks (slots 1-11), which maps to cricket's playing XI. For other sports, the slot count would differ (e.g. 11 for football, 5 for basketball starting lineup, 1 for tennis). **Slot count should be parameterized per sport/format in the ruleset.**

4. **Super Over prediction mechanics:** matchResultPrediction includes SUPER_OVER as an option. Does predicting SUPER_OVER mean "there will be a super over" (binary prediction) or "the super over winner"? If the latter, it conflicts with TEAM_A / TEAM_B since super over has a winner too. **Semantics must be clarified.**

5. **Match-winner scoring:** The UserBet includes matchResultPrediction but the scoring rules in the Constitution do not define points for correct match-winner prediction. **Point allocation for match/toss winner predictions must be defined.**

6. **Total runs prediction scoring:** How is totalRunsPrediction scored? Exact match bonus? Proximity-based? Bucket-based? **The scoring formula for numeric predictions must be specified.**

7. **Player replacement policy during a match:** If a player is retired hurt or a concussion substitute comes in, do their stats count? The external source will provide stats for both. This is likely handled naturally (both score based on their stats), but edge cases (e.g. super-sub rules) may need explicit handling. **Confirm that stats-as-reported is sufficient.**

8. **Multi-group leaderboard consistency:** If a user belongs to 3 groups, their score is identical in all 3. But what if groups have different tournament scopes in the future? **Confirm that groups are always single-tournament scoped.**

9. **Long-term bet scoring weight:** How do long-term bet scores contribute to the overall leaderboard? Are they added to match scores? Separate leaderboard? Weighted differently? **Integration with overall scoring must be defined.**

10. **External data source SLA:** What happens if the external data source is unavailable or delayed? Is there a fallback? Manual entry? The system's correctness depends on timely external data. **Degradation policy must be defined.**
