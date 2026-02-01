MVP_T20WC_SCOPE.md
Purpose

This document defines the Minimum Playable Tournament (MPT) scope for the T20 World Cup launch of the sports prediction platform.

The goal is to ship a fully playable, stable, and fair prediction game that:

Runs end-to-end without manual intervention

Uses external match/team/player data

Enforces all constitutional invariants

Avoids feature creep, UI churn, and rule ambiguity

Anything not explicitly included here is out of scope for T20 WC launch.

1. Core User Promise (Non-Negotiable)

A logged-in user can:

See today's and upcoming T20 WC matches

Open a match before first ball

Submit predictions using predefined questions

Have predictions lock automatically at match start

See results after match completion

View global and group leaderboards

If any of the above breaks, the release is blocked.

2. In-Scope Features (Must Ship)
2.1 Authentication & Identity

Google OAuth login

User display name (editable)

Logged-out users:

Can browse everything

Cannot submit or edit bets

2.2 Tournament & Match Discovery

Single active tournament: T20 World Cup

Home page shows:

Today's matches (primary)

Upcoming matches (secondary)

Match status: UPCOMING / LIVE / COMPLETED

Match data sourced from external ingestion only

No admin-created matches

2.3 Match Betting (Core Gameplay)

For each match:

Betting screen opens from match card

Questions are predefined by admin config

Supported question types:

TEAM_PICK

PLAYER_PICK (from match squads only)

NUMERIC_RANGE (e.g., total runs)

BINARY / MULTI_OPTION side bets

Inputs are selection-only:

Dropdowns

Radio buttons

No free-text fields

2.4 Locking & Integrity

Bets editable until first ball

All bets lock atomically

UI reads lock state from API only

No partial locks

No post-lock edits

2.5 Scoring & Resolution

Match resolution after COMPLETED

If match is ABANDONED:

All scores = 0

Match ignored in leaderboard totals

Scoring strictly follows Constitution rules

Leaderboards are deterministic and reproducible

2.6 Leaderboards

Global leaderboard (default)

Group leaderboards (CUGs)

Same underlying scores

No group-specific scoring rules

2.7 Groups (CUGs)

Any user can:

Create a group

Become group admin

Invite others via link or join code

Groups affect leaderboard views only

Users can belong to multiple groups

Global group always exists

2.8 Long-Term Bets

Tournament-level predictions:

Winner

Finalists

Top performers (as defined)

Lock deadline:

Before a pre-defined match number / timestamp

One-time submission

No edits after lock

3. Read-Only (Nice-to-Have, Allowed if Stable)

These features may ship only if they do not delay core gameplay:

Teams list page

Team detail page:

Squad list

Basic team metadata

Players list

Player profile page:

Photo (if available)

Basic bio

Tournament stats (if ingested safely)

Rules / FAQ / About pages

These are informational only and must never affect betting or scoring.

4. Explicitly Out of Scope (Do NOT Build Now)

The following are hard deferred until after T20 WC:

❌ Admin UI for rule editing

❌ Admin ability to change scoring mid-tournament

❌ Paid features or real-money anything

❌ Live ball-by-ball visualizations

❌ In-match betting

❌ Notifications / emails / push

❌ Custom tournaments by users

❌ Multi-sport switching UI

❌ Editable past bets

❌ Advanced analytics dashboards

If it's not listed in Section 2, it does not ship.

5. Data & Automation Guarantees

All teams, players, matches, squads:

Come from external data providers

Flow through ExternalDataAdapter

No hardcoded sports data in UI

Engine must function in:

Simulation mode

Shadow (real-data) mode

Swapping adapters must require zero UI changes

6. Failure Handling Rules

Missing external data:

Match hidden from betting

Partial squads:

PLAYER_PICK questions disabled

Data ambiguities:

Logged as warnings

Never crash the system

If invariant violation occurs:

Match is skipped

Platform continues safely

7. Definition of "Launch Ready"

The app is considered T20 WC ready when:

A fresh user can:

Log in

Submit bets for today's match

See themselves on leaderboard after completion

Zero invariant violations

No client-side assumptions about rules

External ingestion runs unattended

No manual DB edits required during tournament

8. Post-Launch (Explicitly Not Now)

After T20 WC:

Multi-sport expansion

Advanced admin tooling

Historical analytics

UX polish

Performance optimizations

These are intentionally excluded from this scope.

End of MVP_T20WC_SCOPE
