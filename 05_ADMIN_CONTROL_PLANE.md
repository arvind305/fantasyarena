ADMIN_CONTROL_PLANE.md
Purpose & Scope

The Admin Control Plane is a restricted, internal-only interface for observing, validating, and intervening in the platform without violating domain invariants.

It exists to:

Ensure operational correctness

Handle real-world data anomalies

Provide auditability and recovery

Support live events without destabilising the game

This plane is not user-facing and never exposes or mutates user bets directly.

Core Principles

Read-first, mutate-last

All admin actions are observable before they are executable.

Invariant-preserving

No admin action may violate any invariant defined in DOMAIN_MODEL_AND_DATA_CONTRACTS.md.

Explicit over implicit

Every admin mutation is explicit, logged, and replayable.

Idempotent by design

Repeating an admin action must not change outcomes after first successful execution.

Engine-trusting

Admin actions request transitions; the engine enforces legality.

Access Model
Role	Access
Super Admin	Full read + gated write
Operator	Read-only
Developer (local)	Read + simulation controls

Authentication is out-of-band (not part of user auth).
No admin endpoint is accessible from the public UI bundle.

Control Plane Modules
1. System Overview Dashboard (Read-only)
Purpose

Single-pane visibility into platform health and active events.

Displays

Active tournaments (count, status)

Matches by status:

UPCOMING

LIVE

COMPLETED

ABANDONED

External feed health:

Last ingest timestamp

Provider name

Warning count (non-fatal)

Engine state:

Invariant check status

Last recompute timestamp

Guarantees

No user-identifying data

No betting data visible

2. Match Control Panel
View (Read-only)

For a selected match:

matchId

tournamentId

Teams (teamA, teamB)

scheduledTime

currentStatus

bettingLockedAt

includesSuperOver

isAbandoned

squad finalization status

question counts by status:

DRAFT / OPEN / LOCKED / RESOLVED

Derived indicators

"Safe to go LIVE"

"Squads incomplete"

"Betting lock mismatch"

"External feed stale"

Actions (Gated)
A. Force External Re-Ingest

Re-fetches match, squads, and metadata from provider

Allowed only when:

matchStatus ∈ {UPCOMING, LIVE}

Engine behavior:

Applies normalization

Rejects illegal transitions

Emits warnings only (never throws)

B. Mark Match as ABANDONED

Sets:

match.isAbandoned = true

match.status = COMPLETED

Effects:

All questions auto-resolve to null

All bets score = 0

Leaderboards unchanged

Allowed only once

Irreversible

C. Trigger Manual Status Transition

Used only if provider is delayed.

From	To
UPCOMING	LIVE
LIVE	COMPLETED

Engine enforces:

No backward transitions

Squad finalization before LIVE

Atomic bet + question locking

3. Squad & Roster Inspector
View

Team roster (if available)

Match squad (playing XI)

Delta view:

Missing players

Extra players

Role mismatches

Warnings (non-fatal)

Squad player not in roster

Duplicate playerId

Missing role mapping

No manual editing allowed

Squads are externally owned.

4. Betting Question Inspector
View

For each question:

questionId

matchId

type (PLAYER_PICK, TEAM_PICK, etc.)

status

option list (IDs only, no labels)

correctOptionId (only visible post-resolution)

resolvedAt

Read-only metrics

Number of bets submitted

Distribution count per option (counts only)

Explicitly hidden

Individual user answers

User identities

5. Bet Integrity Monitor (Read-only)
Purpose

Detect systemic issues without exposing answers.

Metrics

Bets per match

Bets per question

% completion rate

Lock compliance (late submission attempts)

Alerts

Bets attempted after lock

Missing bets on resolved matches

Option ID mismatches

6. Leaderboard Reconciliation Panel
View

Global leaderboard

Group leaderboards

Tournament totals

Action: Recompute Leaderboards

Fully deterministic recomputation

Idempotent

Allowed anytime

No data mutation beyond recalculated aggregates

7. External Ingestion Diagnostics
View

Per provider:

Field mapping coverage

Unmapped enums (e.g., roles, statuses)

Missing entities

Data freshness SLA

Output

Warnings only

Never blocks match lifecycle

8. Audit Log (Mandatory)

Every admin action logs:

adminUserId

timestamp

actionType

target entity IDs

before snapshot hash

after snapshot hash

Audit logs are:

Append-only

Immutable

Replay-safe

Explicit Prohibitions

The Admin Control Plane must never:

Edit or override user bets

Change question content after OPEN

Insert or delete players, teams, or matches

Alter scores manually

Bypass engine validation

Expose user answers or PII

Violations here are system integrity breaches.

Failure Modes & Handling
Scenario	Handling
External feed incomplete	Warn + continue
Squad missing	Block LIVE transition
Provider status ambiguous	Manual status override allowed
Stat correction after COMPLETED	Correction window + recompute
Duplicate ingestion	Idempotent no-op
Non-Goals (Deliberate)

The Admin Control Plane is not:

A CMS

A data editing UI

A support dashboard

A BI system

A real-time analytics console

Summary

The Admin Control Plane is the operational conscience of the platform.

It:

Observes without leaking

Intervenes without breaking

Repairs without rewriting history

Trusts the engine

Documents every action

Without this plane, scale is fragile.
With it, the system is event-ready, provider-agnostic, and operator-safe.
