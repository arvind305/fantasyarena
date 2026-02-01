# PRODUCT SPEC — Universal Event-Based Prediction Game

## 1. Product Vision
A private, non-monetary, event-based prediction and scoring platform that supports any sport or competitive event. The game emphasizes engagement, volatility, transparency, and social competition through shared matches and optional closed user groups.

## 2. Core Concepts
- **Event**: A real-world contest (match, race, game, stage)
- **Ruleset**: Sport-specific scoring + bet definitions (e.g., Cricket_T20_v1)
- **Prediction Set**: Predefined bets for an event
- **Group**: Leaderboard overlay only (no separate events)
- **Global Group**: Default group for all users

## 3. User Roles
- Admin: Creates events, configures rulesets, defines bets
- User: Places predictions, joins groups, views analytics

## 4. Event Lifecycle
UPCOMING → LIVE → COMPLETED → ARCHIVED

## 5. Betting Model
- Match/Event Result
- Quantitative Predictions
- Entity Picks (players, teams, drivers)
- Side Bets
- Long-term Tournament Bets

## 6. Groups
- Users may belong to multiple groups
- Groups affect only leaderboard views
- No impact on scoring logic

## 7. UX Principles
- One primary action: Place Predictions
- Everything else is read-only or secondary
- Mobile-first, fast entry, no clutter

## 8. Analytics
- User-level transparency
- Group comparisons
- Event and tournament summaries

## 9. Extensibility
- New sports added via new Rulesets
- No frontend rewrite required
- Admin-configured bet schemas

END OF PRODUCT SPEC
