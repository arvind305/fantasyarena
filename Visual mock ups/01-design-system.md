# IPL Fantasy Betting Game — Design System v1.0

> **Batch 1 of 7** | Design System, Layout Grid, Navigation Structure

---

## 1. COLOR SYSTEM

### 1.1 Background Layers (Dark Mode Primary)

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-base` | `#0A0A0B` | App background, deepest layer |
| `bg-surface` | `#141416` | Card backgrounds, panels |
| `bg-elevated` | `#1C1C1F` | Modals, dropdowns, hover states |
| `bg-subtle` | `#242428` | Input fields, inactive tabs |

### 1.2 Primary Accent — Electric Cyan

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-400` | `#00E5FF` | Primary CTAs, active states |
| `primary-500` | `#00B8D4` | Hover states, links |
| `primary-600` | `#0097A7` | Pressed states |
| `primary-glow` | `rgba(0,229,255,0.15)` | Glow effects, focus rings |

### 1.3 Secondary Accent — Multiplier Orange

| Token | Hex | Usage |
|-------|-----|-------|
| `orange-400` | `#FF9100` | Multiplier badges, volatility indicators |
| `orange-500` | `#FF6D00` | Hover on multiplier elements |
| `orange-glow` | `rgba(255,145,0,0.2)` | Multiplier slot backgrounds |

### 1.4 Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `success-400` | `#00E676` | Positive points, wins, correct bets |
| `success-bg` | `rgba(0,230,118,0.1)` | Success backgrounds |
| `error-400` | `#FF5252` | Negative points, losses, errors |
| `error-bg` | `rgba(255,82,82,0.1)` | Error backgrounds |
| `warning-400` | `#FFD740` | Warnings, incomplete bets |

### 1.5 Text Hierarchy

| Token | Hex | Usage |
|-------|-----|-------|
| `text-primary` | `#FFFFFF` | Headlines, primary content |
| `text-secondary` | `#A1A1AA` | Supporting text, labels |
| `text-muted` | `#71717A` | Disabled, timestamps |
| `text-inverse` | `#0A0A0B` | Text on light backgrounds |

### 1.6 Team Colors (IPL)

```
CSK:  #FCCA06 (Yellow)     MI:   #004BA0 (Blue)
RCB:  #EC1C24 (Red)        KKR:  #3A225D (Purple)
DC:   #004C93 (Blue)       PBKS: #ED1B24 (Red)
RR:   #EA1A85 (Pink)       SRH:  #FF822A (Orange)
GT:   #1C1C1C (Dark)       LSG:  #A72056 (Maroon)
```

---

## 1.7 RULE FREEZE PRINCIPLE (CRITICAL)

**Once betting opens for a match, the following are immutable:**

| Frozen Element | Cannot Change |
|----------------|---------------|
| Multipliers | Slot values (20×, 18×, etc.) |
| Scoring rules | Point values for runs, wickets, etc. |
| Bet structures | Available bet types, player count |
| Side bet definitions | Question text, options, point values |
| Runner configuration | Count, percentage |

**Enforcement:**
- Admin changes to any frozen element apply **only to future matches**
- Current match configuration is snapshotted at betting open
- Users MUST see exact applicable rules before submitting

**UI Implications:**
- Display "Rules locked for this match" indicator once betting opens
- Show timestamp of rule lock
- Any rule display must reflect the frozen state, not current admin config

```
┌─────────────────────────────────────────────────────────────────┐
│  ✓ RULES LOCKED                                                 │
│  ─────────────                                                  │
│  Multipliers, scoring, and bet structures for this match       │
│  were locked on Apr 15, 2024 at 2:00 PM IST.                   │
│                                                                 │
│  What you see is what applies. No changes possible.            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. TYPOGRAPHY

### 2.1 Font Stack

```css
--font-display: 'Inter', -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', monospace;
```

### 2.2 Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| `display-xl` | 48px | 700 | 1.1 | Hero numbers, total points |
| `display-lg` | 36px | 700 | 1.2 | Page titles |
| `heading-lg` | 24px | 600 | 1.3 | Section headers |
| `heading-md` | 20px | 600 | 1.4 | Card titles |
| `heading-sm` | 16px | 600 | 1.4 | Subsection headers |
| `body-lg` | 16px | 400 | 1.5 | Primary body text |
| `body-md` | 14px | 400 | 1.5 | Secondary text, table rows |
| `body-sm` | 12px | 400 | 1.4 | Captions, timestamps |
| `label` | 11px | 500 | 1.2 | Badges, tags, uppercase |

### 2.3 Special Number Treatment

```css
/* For all point values, multipliers, and stats */
.stat-number {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

/* Multiplier badges */
.multiplier {
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--orange-400);
}
```

### 2.4 Large Number Formatting (Lakhs)

Points can reach lakhs (1,00,000+) over a tournament. Typography and layout must accommodate this.

**Formatting Rules:**
| Range | Format | Example |
|-------|--------|---------|
| < 1,000 | Full number | `847` |
| 1,000 – 99,999 | Comma-separated | `12,450` |
| 1,00,000+ | Lakh notation | `1.24L` or `1,24,500` |

**Recommended:** Use Indian comma notation (1,24,500) in detailed views; use abbreviated notation (1.24L) in compact spaces like leaderboards.

**Typography for Large Numbers:**
```
HERO DISPLAY (Total Points):
┌─────────────────────────────────────────┐
│                                         │
│          1,24,850                       │  font: 48px mono, weight: 700
│            pts                          │  letter-spacing: -0.02em
│                                         │  min-width: 200px (prevents layout shift)
└─────────────────────────────────────────┘

LEADERBOARD ROW:
┌─────────────────────────────────────────────────────────────────┐
│  #3  │  Spiff           │  1,24,850 pts  │  ▲ +2,450          │
│      │                  │  right-align   │  delta emphasis     │
└─────────────────────────────────────────────────────────────────┘
```

**Delta Emphasis (Point Changes):**
```
POSITIVE DELTA:              NEGATIVE DELTA:
┌─────────────────┐          ┌─────────────────┐
│  ▲ +12,450      │          │  ▼ -3,200       │
│  ───────────    │          │  ───────────    │
│  success-400    │          │  error-400      │
│  bg: success-bg │          │  bg: error-bg   │
│  font: 14px     │          │  arrow animates │
│  weight: 600    │          │  in from top    │
└─────────────────┘          └─────────────────┘

LARGE DELTA (>10,000):
┌─────────────────┐
│  ▲▲ +24,500     │  Double arrow for emphasis
│  ═══════════    │  Subtle scale animation (1.05×)
│  + glow effect  │  Used for multiplier-boosted scores
└─────────────────┘
```

**Layout Considerations:**
- All point columns: `min-width: 120px` to prevent layout shift
- Right-align all numbers in tables
- Use tabular-nums to ensure digit alignment
- Reserve space for 7 digits + commas (1,00,00,000 = crore edge case)

---

## 3. SPACING SYSTEM

### 3.1 Base Unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight gaps, icon padding |
| `space-2` | 8px | Inline spacing, small gaps |
| `space-3` | 12px | Component internal padding |
| `space-4` | 16px | Standard padding, card gaps |
| `space-5` | 20px | Section gaps |
| `space-6` | 24px | Card padding |
| `space-8` | 32px | Section separation |
| `space-10` | 40px | Major section breaks |
| `space-12` | 48px | Page section margins |
| `space-16` | 64px | Hero spacing |

---

## 4. LAYOUT GRID

### 4.1 Container Specs (Desktop-First: 1440px)

```
┌─────────────────────────────────────────────────────────────────┐
│                        VIEWPORT: 1440px                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              CONTENT CONTAINER: 1280px                   │   │
│  │   80px margin │ 1280px content │ 80px margin            │   │
│  │                                                          │   │
│  │   12-COLUMN GRID                                        │   │
│  │   Column: 88px | Gutter: 24px                           │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Responsive Breakpoints

| Breakpoint | Width | Columns | Behavior |
|------------|-------|---------|----------|
| Desktop XL | ≥1440px | 12 | Full experience |
| Desktop | 1280-1439px | 12 | Reduced margins |
| Tablet | 768-1279px | 8 | Stacked layouts |
| Mobile | <768px | 4 | Single column |

### 4.3 Common Layout Patterns

```
DASHBOARD LAYOUT (3-9 split):
┌──────────┬─────────────────────────────────┐
│ Sidebar  │         Main Content            │
│ 3 cols   │           9 cols                │
│ 280px    │           968px                 │
└──────────┴─────────────────────────────────┘

BETTING PAGE LAYOUT (8-4 split):
┌─────────────────────────────┬──────────────┐
│     Player Selection        │   Summary    │
│         8 cols              │   4 cols     │
│         824px               │   424px      │
└─────────────────────────────┴──────────────┘

LEADERBOARD LAYOUT (centered 8 cols):
┌────────┬───────────────────────────┬───────┐
│ 2 cols │    Leaderboard 8 cols    │ 2 cols│
│  gap   │         824px             │  gap  │
└────────┴───────────────────────────┴───────┘
```

---

## 5. NAVIGATION STRUCTURE

### 5.1 Primary Navigation (Left Sidebar)

```
┌─────────────────────────────────────────────┐
│  ┌─────────┐                                │
│  │  LOGO   │  IPL Fantasy                   │
│  └─────────┘                                │
│─────────────────────────────────────────────│
│                                             │
│  🏠  Dashboard                   ← active   │
│  🎯  Today's Match                          │
│  📊  Leaderboard                            │
│  👥  My Groups                              │
│  📈  Analytics                              │
│                                             │
│─────────────────────────────────────────────│
│  TEAMS                                      │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│  │CSK │ │MI  │ │RCB │ │KKR │ │... │       │
│  └────┘ └────┘ └────┘ └────┘ └────┘       │
│─────────────────────────────────────────────│
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  👤 User Avatar                      │   │
│  │     Display Name                     │   │
│  │     Rank #12 • 4,250 pts            │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ⚙️  Settings                               │
│  🚪  Logout                                 │
│                                             │
│─────────────────────────────────────────────│
│  ADMIN ← (conditional)                      │
│  🔧  Admin Panel                            │
└─────────────────────────────────────────────┘
```

**Sidebar Specs:**
- Width: 280px (collapsible to 72px)
- Position: Fixed left
- Background: `bg-surface`
- Border-right: 1px `#27272A`

### 5.2 Top Bar (Contextual)

```
┌─────────────────────────────────────────────────────────────────┐
│  Page Title              │ Search 🔍 │ Notifications 🔔 │ Help ❓│
│  Breadcrumb path         │           │                   │       │
└─────────────────────────────────────────────────────────────────┘
```

**Top Bar Specs:**
- Height: 64px
- Background: `bg-base`
- Border-bottom: 1px `#27272A`
- Sticky on scroll

### 5.3 Navigation Hierarchy

```
Level 1 (Sidebar)
├── Dashboard (Home)
├── Today's Match
│   └── Level 2: Match Detail → Betting / Live / Results
├── Leaderboard
│   └── Level 2: Tabs → Global / Group
├── My Groups
│   └── Level 2: Group Detail
├── Analytics (User Profile)
├── Teams
│   └── Level 2: Team Detail
│       └── Level 3: Player Detail
└── Admin Panel (conditional)
    └── Level 2: Match Admin / User Admin / Logs
```

### 5.4 Mobile Navigation (Bottom Tab Bar)

```
┌─────────────────────────────────────────────────────────────────┐
│   🏠        │   🎯        │   📊        │   👤        │   ⋮     │
│  Home      │  Match      │  Ranks      │  Profile    │  More   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. COMPONENT LIBRARY (Key Components)

### 6.1 Cards

```
STANDARD CARD
┌─────────────────────────────────────────┐
│                                         │  Border-radius: 12px
│   Card Content                          │  Background: bg-surface
│                                         │  Border: 1px #27272A
│                                         │  Padding: 24px
│                                         │  Shadow: 0 4px 24px rgba(0,0,0,0.3)
└─────────────────────────────────────────┘

ELEVATED CARD (hover/active)
┌─────────────────────────────────────────┐
│                                         │  Background: bg-elevated
│   Elevated Content                      │  Border: 1px primary-400
│                                         │  Shadow: 0 8px 32px rgba(0,229,255,0.1)
└─────────────────────────────────────────┘
```

### 6.2 Player Card

```
┌───────────────────────────────────────┐
│  ┌─────────┐                          │
│  │ PLAYER  │  Player Name             │
│  │  PHOTO  │  Team Badge • Role       │
│  │  64x64  │                          │
│  └─────────┘  ──────────────────────  │
│                                       │
│  Last 3: 45 • 12 • 78*               │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │ 🏏 Avg: 34.5  │ ⚡ SR: 142.3   │ │
│  └─────────────────────────────────┘ │
│                                       │
│  ┌─────────────────────────────────┐ │
│  │     SLOT 3  •  12× MULTIPLIER  │ │ ← Orange bg-glow
│  └─────────────────────────────────┘ │
└───────────────────────────────────────┘
```

### 6.3 Multiplier Badge

```
Standard:     ┌────────┐
              │  12×   │  bg: orange-glow, text: orange-400
              └────────┘  font: mono, weight: 700

High Value:   ┌────────┐
              │  20×   │  + animated pulse glow
              └────────┘

Low Value:    ┌────────┐
              │   3×   │  muted orange, no glow
              └────────┘
```

### 6.3.1 Multiplier Visual Hierarchy (CRITICAL)

**Multipliers are first-class visual elements.** They must ALWAYS be:
- More visually prominent than player names
- More prominent than secondary stats (avg, SR, form)
- Visible without scrolling or interaction
- Never truncated, hidden, or de-emphasized

```
VISUAL WEIGHT HIERARCHY (descending):

1. MULTIPLIER BADGE        ← Largest, brightest, orange glow
   ┌─────────────────┐
   │     20×         │     font: 32px mono, weight: 800
   └─────────────────┘     always above or beside player photo

2. SLOT NUMBER             ← Clear position indicator
   "Slot 1"                 font: 14px, uppercase, muted

3. PLAYER NAME             ← Secondary to multiplier
   "Virat Kohli"           font: 16px, weight: 600

4. TEAM + ROLE             ← Tertiary
   "RCB • Batter"          font: 12px, text-muted

5. STATS                   ← Smallest, on-demand
   "Avg: 34.5 | SR: 142"   font: 12px, text-secondary
```

**Player Card with Multiplier Dominance:**
```
┌─────────────────────────────────────────────┐
│  ┌─────────────────────────────────────┐   │
│  │            20×                      │   │  ← DOMINANT
│  │     ════════════════════           │   │     orange-glow bg
│  │     pulsing glow effect            │   │     32px mono bold
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌────────┐   SLOT 1                       │
│  │ PHOTO  │   ──────────────────────────   │
│  │ 56x56  │   Virat Kohli                  │  ← secondary
│  └────────┘   RCB • Batter                 │  ← tertiary
│                                             │
│  Last 3: 45 • 12 • 78*    Avg: 34.5       │  ← smallest
└─────────────────────────────────────────────┘
```

**Rationale:** Users make slot decisions based on multiplier value first. The multiplier determines risk/reward; the player is the variable. Design must reflect this mental model.

### 6.4 Points Display

```
Positive:     ┌──────────────┐
              │  +2,450 pts  │  text: success-400, bg: success-bg
              └──────────────┘

Negative:     ┌──────────────┐
              │   -180 pts   │  text: error-400, bg: error-bg
              └──────────────┘

Neutral:      ┌──────────────┐
              │   1,200 pts  │  text: text-primary
              └──────────────┘
```

### 6.5 Buttons

```
PRIMARY CTA:
┌─────────────────────────────────┐
│        SUBMIT BETS              │  bg: primary-400
│                                 │  text: text-inverse
└─────────────────────────────────┘  height: 48px, radius: 8px
                                     hover: primary-500 + shadow

SECONDARY:
┌─────────────────────────────────┐
│        View Details             │  bg: transparent
│                                 │  border: 1px primary-400
└─────────────────────────────────┘  text: primary-400

GHOST:
┌─────────────────────────────────┐
│        Cancel                   │  bg: transparent
│                                 │  text: text-secondary
└─────────────────────────────────┘  hover: bg-subtle
```

### 6.6 Status Indicators

```
LIVE MATCH:      ● LIVE         (pulsing red dot + "LIVE" text)
BETTING OPEN:    ◉ Betting Open (green dot)
BETTING LOCKED:  ◉ Locked       (red dot)
UPCOMING:        ○ 2h 34m       (gray dot + countdown)
COMPLETED:       ✓ Final        (check mark)
```

### 6.7 Countdown Timer

```
┌─────────────────────────────────────────┐
│  BETTING CLOSES IN                      │
│                                         │
│    02 : 34 : 17                        │  font: display-xl, mono
│    hrs   min   sec                      │
│                                         │
│  ════════════════════════▓▓▓▓          │  progress bar
└─────────────────────────────────────────┘
```

---

## 7. ICONOGRAPHY

### 7.1 Icon Style
- Style: Outlined, 1.5px stroke
- Size: 20px default, 24px for nav
- Library: Lucide Icons (recommended)

### 7.2 Custom Icons Needed
- Cricket bat
- Cricket ball
- Wicket
- Six (boundary)
- Four (boundary)
- Multiplier lightning bolt
- Runner link symbol

---

## 8. ANIMATION & MICRO-INTERACTIONS

### 8.1 Transitions

| Type | Duration | Easing |
|------|----------|--------|
| Hover states | 150ms | ease-out |
| Page transitions | 300ms | ease-in-out |
| Modal open/close | 250ms | ease-out |
| Score updates | 400ms | spring |

### 8.2 Special Animations

```
SCORE JUMP:
- Number rapidly increments
- Green/red flash behind
- Subtle scale (1.0 → 1.1 → 1.0)

MULTIPLIER PULSE:
- Subtle glow pulse every 2s
- Orange ring expands and fades

LOCK INDICATOR:
- 🔓 → 🔒 with shake animation
- Red flash on container

RANK CHANGE:
- ↑ slides in from bottom (green)
- ↓ slides in from top (red)
```

---

## 9. ELEVATION & SHADOWS

| Level | Shadow | Usage |
|-------|--------|-------|
| 0 | none | Flat elements |
| 1 | `0 2px 8px rgba(0,0,0,0.2)` | Cards at rest |
| 2 | `0 4px 16px rgba(0,0,0,0.25)` | Hover cards |
| 3 | `0 8px 32px rgba(0,0,0,0.3)` | Modals, dropdowns |
| glow-primary | `0 0 24px rgba(0,229,255,0.2)` | Active selections |
| glow-orange | `0 0 24px rgba(255,145,0,0.25)` | Multiplier highlights |

---

## 10. RESPONSIVE BEHAVIOR

### 10.1 Component Adaptations

| Component | Desktop | Tablet | Mobile |
|-----------|---------|--------|--------|
| Sidebar | 280px fixed | 72px icons | Bottom tab |
| Player grid | 11 visible | 6 + scroll | 3 + scroll |
| Leaderboard | Full table | Condensed | Card list |
| Stats | Side-by-side | Stacked | Accordion |

### 10.2 Touch Targets
- Minimum: 44px × 44px
- Recommended: 48px × 48px

---

## 11. ACCESSIBILITY

### 11.1 Color Contrast
- All text meets WCAG AA (4.5:1 for body, 3:1 for large)
- Interactive elements have visible focus states
- Don't rely solely on color for meaning

### 11.2 Focus States
```css
:focus-visible {
  outline: 2px solid var(--primary-400);
  outline-offset: 2px;
}
```

---

## 12. DATA VISUALIZATION

### 12.1 Charts
- Line charts: Performance over time
- Bar charts: Match-by-match breakdown
- Donut charts: Point source distribution
- Colors: Use semantic colors + primary palette

### 12.2 Stat Tables
- Zebra striping: alternating `bg-surface` / `bg-base`
- Sortable columns indicated by icon
- Sticky headers on scroll
- Monospaced numbers for alignment

---

## 13. EMPTY & LOADING STATES

### 13.1 Skeleton Loading
```
┌─────────────────────────────────────────┐
│  ████████████                           │  Animated shimmer
│  ██████████████████████                 │  bg: linear-gradient
│  ████████████                           │
└─────────────────────────────────────────┘
```

### 13.2 Empty States
- Illustrated icon (muted)
- Clear message
- Action CTA if applicable

---

## 14. INFORMATION HIERARCHY (TRUST SIGNALS)

Since this is a "competitive real-money-adjacent game," trust is critical:

### 14.1 Always Visible
- Current betting window status (open/locked)
- All multipliers (before betting)
- User's current rank + points
- Audit timestamps on admin actions

### 14.2 Progressive Disclosure
- Side bet reveals (milestone-based)
- Detailed scoring breakdowns (expandable)
- Historical audit logs (on demand)

### 14.3 Confirmation Patterns
- Bet submission: Summary modal before confirm
- Destructive actions: Type-to-confirm

---

## 14A. SIDE BET DISCLOSURE TIMING (CRITICAL)

Side bets follow a strict reveal protocol aligned with the constitution:

### 14A.1 Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   SIDE BET LIFECYCLE                                                        │
│                                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐│
│   │   DEFINED   │───▶│   HIDDEN    │───▶│  REVEALED   │───▶│   SCORED    ││
│   │   by Admin  │    │  pre-match  │    │ at milestone│    │   final     ││
│   └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘│
│                                                                             │
│   Admin creates      Users see only     Revealed when      Points awarded  │
│   before betting     placeholder        event occurs       or deducted     │
│   opens                                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 14A.2 Display States

**Pre-Match (Hidden):**
```
┌─────────────────────────────────────┐
│  SIDE BETS                          │
│  ─────────                          │
│                                     │
│  🔒 3 side bets for this match     │
│                                     │
│  Revealed at match milestones.      │
│  You cannot bet on these in        │
│  advance.                           │
│                                     │
└─────────────────────────────────────┘
```

**During Match (Progressive Reveal):**
```
┌─────────────────────────────────────┐
│  SIDE BETS                          │
│  ─────────                          │
│                                     │
│  ✓ REVEALED: End of Powerplay      │
│    "Will RR score 50+ in PP?"      │
│    Answer: YES  │  +150 pts        │
│                                     │
│  🔒 2 more to be revealed...       │
│                                     │
└─────────────────────────────────────┘
```

### 14A.3 Rules

| Rule | Enforcement |
|------|-------------|
| No pre-match visibility | Side bet text hidden until milestone |
| No retroactive edits | Once revealed, answer is final |
| Milestone-aligned | Each reveal tied to scoring checkpoint |
| No early hints | Placeholder shows count only, no content |

---

## 14B. MOBILE BETTING CONSTRAINTS (CRITICAL)

On mobile viewports (<768px), the betting experience must preserve core usability:

### 14B.1 Non-Negotiable Requirements

| Requirement | Rationale |
|-------------|-----------|
| Multipliers always visible | Users must see slot value without interaction |
| No hidden multipliers | Never behind tabs, accordions, or tooltips |
| Vertical scroll acceptable | Natural mobile pattern |
| Horizontal scroll for slots | If needed, but multiplier visible in viewport |

### 14B.2 Mobile Slot Card (Compact)

```
┌─────────────────────────────────────┐
│                                     │
│  ┌─────────────────────────────┐   │
│  │  20×  │  SLOT 1             │   │   ← Multiplier FIRST, always visible
│  ├───────┴─────────────────────┤   │
│  │  ┌────┐                     │   │
│  │  │IMG │  V. Kohli           │   │
│  │  │32px│  RCB • Batter       │   │
│  │  └────┘                 ✕   │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘

Width: 100% (single column)
Multiplier: Left-aligned, 24px, orange-400
Player info: Condensed, secondary
```

### 14B.3 Mobile Grid Layout

```
MOBILE BETTING SCREEN (375px viewport):

┌─────────────────────────────────────┐
│  RR vs DC                    🔒 2:14│  ← Sticky header with countdown
├─────────────────────────────────────┤
│                                     │
│  YOUR SLOTS (scroll ↓)              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 20× │ SLOT 1 │ V. Kohli     │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 18× │ SLOT 2 │ + Add        │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 15× │ SLOT 3 │ R. Pant      │   │
│  └─────────────────────────────┘   │
│                                     │
│  ... vertical scroll continues ...  │
│                                     │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │  ← Sticky bottom bar
│  │  7/11  │   SUBMIT BETS      │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 14B.4 Forbidden Patterns (Mobile)

❌ Multipliers in collapsed accordion  
❌ Multipliers in tooltip on tap  
❌ Multipliers visible only after scroll  
❌ Horizontal-only slot carousel hiding values  
❌ "Show multipliers" toggle

---

---

## 15. ADMIN UI DESIGN PRINCIPLES

The Admin Panel serves a fundamentally different purpose than the player-facing UI. While the player UI embraces "chaotic fun" and visual excitement, the Admin UI must prioritize **clarity, auditability, and restraint**.

### 15.1 Core Principles

| Principle | Rationale |
|-----------|-----------|
| **Clarity over style** | Admins make consequential decisions. Every element must be unambiguous. |
| **Auditability first** | Every action must be logged, timestamped, and reversible where possible. |
| **Restraint over flair** | No animations, glows, or visual "excitement." Calm, neutral interface. |
| **Confirmation required** | Destructive or irreversible actions require explicit confirmation. |
| **Read-before-write** | Always show current state before allowing changes. |

### 15.2 Visual Treatment

```
ADMIN COLOR PALETTE (muted):
┌─────────────────────────────────────────┐
│  Background:    #0F0F10 (darker base)   │
│  Surface:       #18181B                 │
│  Accent:        #3B82F6 (blue, not cyan)│  ← Less "exciting" than player UI
│  Warning:       #F59E0B (amber)         │
│  Destructive:   #EF4444 (red)           │
└─────────────────────────────────────────┘
```

### 15.3 Admin-Specific Components

**Action Buttons (Tiered by Severity):**
```
SAFE ACTION:              CAUTION ACTION:           DESTRUCTIVE ACTION:
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  Save Draft     │       │  ⚠ Enable Bets  │       │  🗑 Delete Match │
│  ─────────────  │       │  ───────────────│       │  ───────────────│
│  gray bg        │       │  amber border   │       │  red bg         │
│  no emphasis    │       │  icon prefix    │       │  type-to-confirm│
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

**Audit Trail Display:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  CHANGE LOG                                                         │
├─────────────────────────────────────────────────────────────────────┤
│  2024-04-15 14:32:07  │  admin@email  │  Enabled multipliers       │
│  2024-04-15 14:30:22  │  admin@email  │  Set Slot 1 = 20×          │
│  2024-04-15 14:28:45  │  admin@email  │  Created Match #47         │
├─────────────────────────────────────────────────────────────────────┤
│  ← Older                                          Export CSV  ↓    │
└─────────────────────────────────────────────────────────────────────┘
```

### 15.4 Confirmation Patterns

**Standard Confirmation (Modal):**
```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️  Confirm Action                                              │
│  ───────────────────────────────────────────────────────────────│
│                                                                  │
│  You are about to LOCK BETTING for Match #47 (CSK vs MI).       │
│                                                                  │
│  This action:                                                    │
│  • Cannot be undone                                              │
│  • Will freeze all user bets                                     │
│  • Takes effect immediately                                      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Type "LOCK MATCH 47" to confirm                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│                              [ Cancel ]    [ Confirm Lock ]      │
└─────────────────────────────────────────────────────────────────┘
```

### 15.5 Admin UI ≠ Player UI

| Aspect | Player UI | Admin UI |
|--------|-----------|----------|
| Animations | Yes (score jumps, glows) | No (instant state changes) |
| Color saturation | High (cyan, orange) | Low (muted blue, gray) |
| Emphasis | Multipliers, points | Actions, timestamps |
| Tone | Exciting, competitive | Calm, professional |
| Error handling | Friendly messages | Technical details + logs |

---

**END OF DESIGN SYSTEM — BATCH 1**

---

*Ready for review. Upon approval, I'll proceed to Batch 2: Betting Day & Match Flow Screens.*
