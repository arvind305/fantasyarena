# FRONTEND_PAGE_STRUCTURE.md

## Access Rules (Global)
- **Guest (Not Logged In):**
  - Can view all public pages: Home, Events, Matches, Teams, Players, Leaderboards (read-only), Rules/Constitution.
  - Cannot place or submit any bets.
- **Logged-in User (Google Auth):**
  - Can place bets, join/create groups, view personal analytics.
  - Display Name: user-defined (shown on leaderboards & groups).
  - Account Name: derived from Google login (non-editable).

---

## Global Navigation (Low-click Design)
- Home
- Events / Matches
- Long-term Bets
- Teams
- Players
- Leaderboards
- Groups
- Profile (Analytics & Settings)
- Login / Logout

---

## 1. Home Page
**Purpose:** Daily entry point and context.
- Today’s Matches (clearly separated by time if multiple)
- Upcoming Matches (next 3–5)
- Ongoing Tournament/Event summary
- Head-to-head or recent performance snapshot for today’s teams
- CTA:
  - Logged out: “Login to Play”
  - Logged in: “Go to Today’s Match”

---

## 2. Event / Match Betting Page (Core Screen)
**Access:** Logged-in users only for betting
- Match Header:
  - Teams, date, time, venue
  - Countdown to first ball
- Betting Questions:
  - Pre-defined questions only
  - Inputs strictly controlled:
    - Dropdowns for players (auto-filtered to match squads)
    - Dropdowns / radio buttons for outcomes
  - No free-text inputs
- Submit Bets:
  - Bets editable until first ball
  - Auto-lock at match start
- Status Indicators:
  - Editable / Locked
  - Submitted timestamp

---

## 3. Long-term Bets Page
**Purpose:** Tournament-wide or multi-match bets
- List of long-term bet questions
- Clear lock deadline (date & time)
- One-time submit and lock
- Visible confirmation once locked

---

## 4. Teams Section
- Teams List (per tournament/event)
- Team Detail Page:
  - Team overview
  - Squad list
  - Team stats (event-specific + historical)
- Player links from squad

---

## 5. Players Section
- Players List (filterable by team/event)
- Player Profile Page:
  - Photo
  - Role & bio
  - Event-specific stats
  - Historical performance in same tournament
  - Recent form summary

---

## 6. Leaderboards
- Global Leaderboard
- Tournament/Event Leaderboard
- Group-specific Leaderboards
- Filters:
  - Match-wise
  - Event-wise

---

## 7. Groups
**Purpose:** Private competition among friends
- My Groups (quick access)
- Create Group:
  - Creator becomes Admin
  - Generates invite link & unique code
- Join Group:
  - Via invite link or code
- Group Page:
  - Members list
  - Group leaderboard
  - Admin controls (remove users, regenerate invite)

---

## 8. Profile & Analytics
- Display Name management
- Betting Analytics:
  - Performance across matches
  - Performance across bet types
  - Win/loss trends
- Groups overview
- Logout

---

## 9. Static Pages
- Rules / Constitution
- FAQs
- About

---

## Notes for UI Build
- Betting flow must be **single-screen, minimal-scroll**
- Dropdown data must be **system-driven** (no inconsistencies)
- Emphasis on:
  - Speed
  - Clarity
  - Zero error betting
