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
---

---

# IPL Fantasy Betting Game — Screen Designs

> **Batch 2 of 7** | Authentication, Dashboard, Betting Day & Match Flow Screens

---

## SCREEN A: AUTHENTICATION

### A.1 Google OAuth Login

**Purpose:** Single entry point. No email/password — Google only.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                              VIEWPORT: 1440 × 900                               │
│                                                                                 │
│         ┌───────────────────────────────────────────────────────────┐          │
│         │                                                           │          │
│         │                                                           │          │
│         │                    ┌─────────────┐                        │          │
│         │                    │             │                        │          │
│         │                    │    🏏 ⚡    │                        │          │
│         │                    │             │                        │          │
│         │                    └─────────────┘                        │          │
│         │                                                           │          │
│         │                   IPL FANTASY                             │          │
│         │                   ───────────────                         │          │
│         │                   Friends Betting League                  │          │
│         │                                                           │          │
│         │                                                           │          │
│         │         ┌───────────────────────────────────────┐        │          │
│         │         │                                       │        │          │
│         │         │   ┌─────┐  Continue with Google       │        │          │
│         │         │   │  G  │                             │        │          │
│         │         │   └─────┘                             │        │          │
│         │         │                                       │        │          │
│         │         └───────────────────────────────────────┘        │          │
│         │                                                           │          │
│         │                                                           │          │
│         │         ─────────────────────────────────────────         │          │
│         │                                                           │          │
│         │         Private game for invited friends only.            │          │
│         │         No real money. Just bragging rights.              │          │
│         │                                                           │          │
│         │                                                           │          │
│         └───────────────────────────────────────────────────────────┘          │
│                                                                                 │
│                                                                                 │
│              Background: Subtle animated gradient (dark blue → purple)          │
│              Card: bg-surface with subtle glow                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Component Specs:**
| Element | Spec |
|---------|------|
| Logo | 64px, custom icon |
| Title | `display-lg` (36px), weight 700 |
| Subtitle | `body-lg` (16px), text-secondary |
| Google Button | 48px height, white bg, 8px radius, shadow-1 |
| Footer text | `body-sm` (12px), text-muted |
| Card | 480px width, 24px padding, 16px radius |

**UX Notes:**
- Single CTA — no distractions
- Loads Google OAuth popup on click
- Error states appear as toast below button

---

### A.2 Display Name Selection (First-Time Only)

**Purpose:** Set nickname shown on leaderboards. Editable later.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│         ┌───────────────────────────────────────────────────────────┐          │
│         │                                                           │          │
│         │                                                           │          │
│         │                   Welcome, Spiff! 👋                      │          │
│         │                                                           │          │
│         │         ─────────────────────────────────────────         │          │
│         │                                                           │          │
│         │         Choose your display name                          │          │
│         │         This is how others will see you on leaderboards   │          │
│         │                                                           │          │
│         │         ┌───────────────────────────────────────┐        │          │
│         │         │  SpiffMaster_                         │        │          │
│         │         └───────────────────────────────────────┘        │          │
│         │           ✓ Available                                     │          │
│         │                                                           │          │
│         │         ┌───────────────────────────────────────┐        │          │
│         │         │         LET'S GO                      │        │          │
│         │         └───────────────────────────────────────┘        │          │
│         │                                                           │          │
│         │                                                           │          │
│         │         You can change this later in settings.           │          │
│         │                                                           │          │
│         └───────────────────────────────────────────────────────────┘          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Validation Rules:**
- 3-20 characters
- Alphanumeric + underscores only
- Real-time availability check
- Shows ✓ (green) or ✗ (red) with message

**States:**
```
AVAILABLE:     ✓ Available                    (success-400)
TAKEN:         ✗ Already taken                (error-400)
TOO SHORT:     ✗ Minimum 3 characters         (error-400)
INVALID:       ✗ Letters, numbers, _ only     (error-400)
CHECKING:      ◌ Checking...                  (text-muted, spinner)
```

---

## SCREEN B: HOME / DASHBOARD

**Purpose:** Landing page after login. Shows today's action + quick stats.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR (280px)              │  TOP BAR (64px)                                                          │
│ ─────────────────────────────┼──────────────────────────────────────────────────────────────────────────│
│                              │  Dashboard                              🔍    🔔 3    ❓                 │
│  ┌─────────────┐             │  Welcome back, SpiffMaster                                               │
│  │  🏏 IPL     │             ├──────────────────────────────────────────────────────────────────────────│
│  │  FANTASY    │             │                                                                          │
│  └─────────────┘             │  ┌─────────────────────────────────────────────────────────────────────┐ │
│                              │  │                                                                     │ │
│  ───────────────             │  │   YOUR STATS                                                        │ │
│                              │  │   ═══════════════════════════════════════════════════════════════   │ │
│  🏠 Dashboard    ◀──         │  │                                                                     │ │
│  🎯 Today's Match            │  │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐              │ │
│  📊 Leaderboard              │  │   │             │   │             │   │             │              │ │
│  👥 My Groups                │  │   │  1,24,850   │   │    #7       │   │    #3       │              │ │
│  📈 Analytics                │  │   │    pts      │   │   Global    │   │   Friends   │              │ │
│  ───────────────             │  │   │             │   │  ▲ 2 spots  │   │  ▼ 1 spot   │              │ │
│                              │  │   │ Total Pts   │   │    Rank     │   │ Group Rank  │              │ │
│  TEAMS                       │  │   └─────────────┘   └─────────────┘   └─────────────┘              │ │
│  ┌────┬────┬────┬────┐       │  │                                                                     │ │
│  │CSK │ MI │RCB │KKR │       │  └─────────────────────────────────────────────────────────────────────┘ │
│  ├────┼────┼────┼────┤       │                                                                          │
│  │ DC │PBK │ RR │SRH │       │  ┌─────────────────────────────────────────────────────────────────────┐ │
│  ├────┼────┼────┼────┤       │  │                                                                     │ │
│  │ GT │LSG │    │    │       │  │   🔴 LIVE NOW                                                       │ │
│  └────┴────┴────┴────┘       │  │   ═════════════════════════════════════════════════════════════    │ │
│                              │  │                                                                     │ │
│  ───────────────             │  │   ┌───────────────────────────────────────────────────────────┐    │ │
│                              │  │   │                                                           │    │ │
│  ┌─────────────────────┐     │  │   │   ┌──────┐                           ┌──────┐            │    │ │
│  │  👤 SpiffMaster     │     │  │   │   │ CSK  │    CSK  vs  MI            │  MI  │            │    │ │
│  │     #7 • 1,24,850   │     │  │   │   │ LOGO │    ───────────            │ LOGO │            │    │ │
│  │                     │     │  │   │   └──────┘    156/4 (14.2)           └──────┘            │    │ │
│  └─────────────────────┘     │  │   │                                                           │    │ │
│                              │  │   │   Your Points So Far:  +2,450  ▲                         │    │ │
│  ⚙️  Settings                │  │   │                                                           │    │ │
│  🚪 Logout                   │  │   │           ┌─────────────────────────────┐                │    │ │
│                              │  │   │           │      VIEW LIVE MATCH        │                │    │ │
│  ───────────────             │  │   │           └─────────────────────────────┘                │    │ │
│  🔧 Admin Panel              │  │   │                                                           │    │ │
│                              │  │   └───────────────────────────────────────────────────────────┘    │ │
│                              │  │                                                                     │ │
│                              │  └─────────────────────────────────────────────────────────────────────┘ │
│                              │                                                                          │
│                              │  ┌──────────────────────────────────┐ ┌──────────────────────────────┐  │
│                              │  │                                  │ │                              │  │
│                              │  │   UPCOMING TODAY                 │ │   BETTING OPEN               │  │
│                              │  │   ══════════════                 │ │   ════════════               │  │
│                              │  │                                  │ │                              │  │
│                              │  │   RR vs DC • 7:30 PM             │ │   ◉ RR vs DC                 │  │
│                              │  │   ┌─────────────────────────┐   │ │                              │  │
│                              │  │   │   Betting closes in     │   │ │   Closes in 2h 14m           │  │
│                              │  │   │      02:14:33           │   │ │                              │  │
│                              │  │   └─────────────────────────┘   │ │   ┌────────────────────────┐ │  │
│                              │  │                                  │ │   │     PLACE BETS         │ │  │
│                              │  │   ┌─────────────────────────┐   │ │   └────────────────────────┘ │  │
│                              │  │   │      PLACE BETS         │   │ │                              │  │
│                              │  │   └─────────────────────────┘   │ │   ⚠️ You have not bet yet    │  │
│                              │  │                                  │ │                              │  │
│                              │  └──────────────────────────────────┘ └──────────────────────────────┘  │
│                              │                                                                          │
│                              │  ┌─────────────────────────────────────────────────────────────────────┐ │
│                              │  │   RECENT RESULTS                                                    │ │
│                              │  │   ══════════════                                                    │ │
│                              │  │                                                                     │ │
│                              │  │   Yesterday    GT vs SRH     GT won     You: +3,200   Rank: #5→#7  │ │
│                              │  │   Apr 13       PBKS vs LSG   LSG won    You: -1,450   Rank: #4→#5  │ │
│                              │  │   Apr 12       KKR vs RCB    KKR won    You: +8,900   Rank: #6→#4  │ │
│                              │  │                                                                     │ │
│                              │  │                                        View All Results →          │ │
│                              │  └─────────────────────────────────────────────────────────────────────┘ │
│                              │                                                                          │
└──────────────────────────────┴──────────────────────────────────────────────────────────────────────────┘
```

**Layout Breakdown:**
- Sidebar: 280px fixed
- Content: 1160px (1440 - 280)
- Content padding: 32px
- Grid: Stats row (3 cards), Live match (full width), 2-col (Upcoming + Betting), Recent results (full width)

**Component Details:**

**Stats Cards (3-up):**
```
┌─────────────────────────────┐
│                             │   bg: bg-surface
│      1,24,850              │   number: display-xl (48px), mono
│         pts                 │   label: body-sm, text-muted
│                             │   
│      Total Points           │   height: 140px
│                             │   padding: 24px
└─────────────────────────────┘
```

**Live Match Card:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  🔴 LIVE NOW                                                        │  badge: pulsing red dot
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────┐                                         ┌──────┐         │  team logos: 48px
│  │ CSK  │    Chennai Super Kings                  │  MI  │         │
│  └──────┘          vs                             └──────┘         │  score: heading-lg (24px)
│           Mumbai Indians                                            │
│                                                                     │
│           156/4 (14.2 ov)                                          │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  Your Points:  ┌──────────────┐                                    │  points: success-400 bg
│                │  +2,450  ▲   │                                    │
│                └──────────────┘                                    │
│                                                                     │
│                    ┌───────────────────────┐                       │
│                    │    VIEW LIVE MATCH    │                       │  CTA: primary button
│                    └───────────────────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
```

**Betting Open Alert:**
```
┌─────────────────────────────────┐
│  ◉ BETTING OPEN                 │   status dot: success-400
│  ───────────────                │
│                                 │
│  RR vs DC                       │   teams: heading-md
│  Closes in 2h 14m               │   countdown: mono, warning-400
│                                 │
│  ┌───────────────────────────┐ │
│  │       PLACE BETS          │ │   CTA: primary
│  └───────────────────────────┘ │
│                                 │
│  ⚠️ You have not bet yet       │   warning: warning-400
└─────────────────────────────────┘
```

---

## SCREEN C: BETTING DAY — MATCH PAGE (CORE SCREEN)

**Purpose:** The primary interaction screen. Users select players, runners, side bets.

### C.1 Match Header

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                                                 │   │
│  │     ┌────────┐                                                        ┌────────┐               │   │
│  │     │        │                                                        │        │               │   │
│  │     │  RR    │              RAJASTHAN ROYALS                          │   DC   │               │   │
│  │     │  LOGO  │                    vs                                  │  LOGO  │               │   │
│  │     │  72px  │              DELHI CAPITALS                            │  72px  │               │   │
│  │     │        │                                                        │        │               │   │
│  │     └────────┘              ───────────────                           └────────┘               │   │
│  │                             Match #47 • Apr 15                                                  │   │
│  │                             Sawai Mansingh Stadium, Jaipur                                     │   │
│  │                                                                                                 │   │
│  │  ┌──────────────────────────────────────────────────────────────────────────────────────────┐  │   │
│  │  │                                                                                          │  │   │
│  │  │                           BETTING CLOSES IN                                              │  │   │
│  │  │                                                                                          │  │   │
│  │  │                         02 : 14 : 33                                                     │  │   │
│  │  │                         hrs   min   sec                                                  │  │   │
│  │  │                                                                                          │  │   │
│  │  │      ══════════════════════════════════════════════════▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓            │  │   │
│  │  │                                                                                          │  │   │
│  │  └──────────────────────────────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                                                 │   │
│  │     ◉ Betting Open                                         🔓 Locks at first ball              │   │
│  │                                                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Specs:**
- Team logos: 72px with team color ring
- Countdown: `display-lg` (36px), mono, primary-400
- Progress bar: 8px height, primary-400 fill
- Match info: `body-md`, text-secondary

---

### C.2 Main Betting Interface — Full Layout

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                         │
│   MATCH HEADER (as above)                                                                               │
│                                                                                                         │
├───────────────────────────────────────────────────────────────────────────────────┬─────────────────────┤
│                                                                                   │                     │
│   PLAYER SELECTION (8 cols = 824px)                                              │  BET SUMMARY        │
│   ═══════════════════════════════════════════════════════════════════════════    │  (4 cols = 424px)   │
│                                                                                   │  ═══════════════    │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │                     │
│   │                                                                         │   │  ┌─────────────────┐│
│   │   Select Players  │  RR Squad  │  DC Squad  │  All Players             │   │  │                 ││
│   │   ═══════════════════════════════════════════════════════════════════  │   │  │  MATCH RESULT   ││
│   │                                                                         │   │  │  ─────────────  ││
│   │   🔍 Search players...                              Filter by Role ▼   │   │  │                 ││
│   │                                                                         │   │  │  ○ RR Win       ││
│   │   QUICK FILTERS (optional helpers — do NOT auto-fill):                 │   │  │  ○ DC Win       ││
│   │   ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐            │   │  │  ○ Super Over   ││
│   │   │ Top Batters  │ │ Top Bowlers  │ │ High Risk/Reward ⚡│            │   │  │                 ││
│   │   └──────────────┘ └──────────────┘ └────────────────────┘            │   │  └─────────────────┘│
│   │                                                                         │   │                     │
│   └─────────────────────────────────────────────────────────────────────────┘   │  ┌─────────────────┐│
│   │   YOUR 11 SLOTS                                                          │ │                     │
│   │   ═══════════════                                                        │ │  ┌─────────────────┐│
│   │                                                                           │ │  │                 ││
│   │   Multipliers are FINAL. Choose players wisely.                          │ │  │  TOTAL RUNS     ││
│   │                                                                           │ │  │  ─────────────  ││
│   │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │ │  │                 ││
│   │   │             │ │             │ │             │ │             │       │ │  │  Predict total  ││
│   │   │    20×      │ │    18×      │ │    15×      │ │    12×      │       │ │  │  runs in match  ││
│   │   │   ═══════   │ │   ═══════   │ │   ═══════   │ │   ═══════   │       │ │  │                 ││
│   │   │             │ │             │ │             │ │             │       │ │  │  ┌───────────┐  ││
│   │   │   SLOT 1    │ │   SLOT 2    │ │   SLOT 3    │ │   SLOT 4    │       │ │  │  │    340    │  ││
│   │   │             │ │             │ │             │ │             │       │ │  │  └───────────┘  ││
│   │   │  ┌───────┐  │ │  ┌───────┐  │ │  ┌───────┐  │ │  ┌───────┐  │       │ │  │                 ││
│   │   │  │ EMPTY │  │ │  │ Virat │  │ │  │ EMPTY │  │ │  │ Pant  │  │       │ │  └─────────────────┘│
│   │   │  │+ Add  │  │ │  │ Kohli │  │ │  │+ Add  │  │ │  │       │  │       │ │                     │
│   │   │  └───────┘  │ │  │  RCB  │  │ │  └───────┘  │ │  │  DC   │  │       │ │  ┌─────────────────┐│
│   │   │             │ │  └───────┘  │ │             │ │  └───────┘  │       │ │  │                 ││
│   │   └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │ │  │  SIDE BETS      ││
│   │                                                                           │ │  │  ─────────────  ││
│   │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │ │  │                 ││
│   │   │             │ │             │ │             │ │             │       │ │  │  🔒 Revealed    ││
│   │   │    10×      │ │     8×      │ │     6×      │ │     5×      │       │ │  │     during      ││
│   │   │   ═══════   │ │   ═══════   │ │   ═══════   │ │   ═══════   │       │ │  │     match       ││
│   │   │             │ │             │ │             │ │             │       │ │  │                 ││
│   │   │   SLOT 5    │ │   SLOT 6    │ │   SLOT 7    │ │   SLOT 8    │       │ │  └─────────────────┘│
│   │   │             │ │             │ │             │ │             │       │ │                     │
│   │   │  ┌───────┐  │ │  ┌───────┐  │ │  ┌───────┐  │ │  ┌───────┐  │       │ │  ┌─────────────────┐│
│   │   │  │ EMPTY │  │ │  │ EMPTY │  │ │  │ EMPTY │  │ │  │ EMPTY │  │       │ │  │                 ││
│   │   │  │+ Add  │  │ │  │+ Add  │  │ │  │+ Add  │  │ │  │+ Add  │  │       │ │  │  RUNNERS        ││
│   │   │  └───────┘  │ │  └───────┘  │ │  └───────┘  │ │  └───────┘  │       │ │  │  ─────────────  ││
│   │   │             │ │             │ │             │ │             │       │ │  │                 ││
│   │   └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘       │ │  │  Pick up to 2   ││
│   │                                                                           │ │  │  runners        ││
│   │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                       │ │  │                 ││
│   │   │             │ │             │ │             │                       │ │  │  ┌───────────┐  ││
│   │   │     4×      │ │     3×      │ │     3×      │                       │ │  │  │  Select   │  ││
│   │   │   ═══════   │ │   ═══════   │ │   ═══════   │                       │ │  │  └───────────┘  ││
│   │   │             │ │             │ │             │                       │ │  │                 ││
│   │   │   SLOT 9    │ │   SLOT 10   │ │   SLOT 11   │                       │ │  │  50% of their   ││
│   │   │             │ │             │ │             │                       │ │  │  score added    ││
│   │   │  ┌───────┐  │ │  ┌───────┐  │ │  ┌───────┐  │                       │ │  │                 ││
│   │   │  │ EMPTY │  │ │  │ EMPTY │  │ │  │ EMPTY │  │                       │ │  └─────────────────┘│
│   │   │  │+ Add  │  │ │  │+ Add  │  │ │  │+ Add  │  │                       │ │                     │
│   │   │  └───────┘  │ │  └───────┘  │ │  └───────┘  │                       │ │  ═════════════════  │
│   │   │             │ │             │ │             │                       │ │                     │
│   │   └─────────────┘ └─────────────┘ └─────────────┘                       │ │  COMPLETION         │
│   │                                                                           │ │                     │
│   │   4 of 11 players selected                          Clear All           │ │  ███████░░░░  7/11  │
│   │                                                                           │ │                     │
│   │   └─────────────────────────────────────────────────────────────────────────────┘ │  ⚠️ 4 slots empty   │
│                                                                                   │                     │
│                                                                                   │  ┌─────────────────┐│
│                                                                                   │  │                 ││
│                                                                                   │  │  SUBMIT BETS    ││
│                                                                                   │  │                 ││
│                                                                                   │  └─────────────────┘│
│                                                                                   │                     │
│                                                                                   │  Empty slots = lower│
│                                                                                   │  exposure. This is  │
│                                                                                   │  a valid strategy.  │
│                                                                                   │                     │
└───────────────────────────────────────────────────────────────────────────────────┴─────────────────────┘
```

---

### C.3 Player Slot Card — Detailed States

**Empty Slot:**
```
┌─────────────────────────────────────┐
│                                     │
│           20×                       │   multiplier: 32px, mono, orange-400
│     ══════════════                  │   glow: orange-glow bg
│      pulse animation                │
│                                     │
│         SLOT 1                      │   slot label: 12px, uppercase, muted
│                                     │
│     ┌─────────────────────┐        │
│     │                     │        │   empty state: dashed border
│     │     +  ADD PLAYER   │        │   bg: bg-subtle
│     │                     │        │   hover: bg-elevated + primary border
│     │                     │        │
│     └─────────────────────┘        │
│                                     │
│     Tap to select                   │   hint: body-sm, text-muted
│                                     │
└─────────────────────────────────────┘

Border: 2px dashed #3F3F46
Background: bg-subtle
Hover: border becomes primary-400, bg becomes bg-elevated
```

**Filled Slot:**
```
┌─────────────────────────────────────┐
│                                     │
│           20×                       │   multiplier: DOMINANT
│     ══════════════                  │   always visible, always on top
│                                     │
│         SLOT 1                      │
│                                     │
│     ┌─────────────────────┐        │
│     │  ┌──────┐           │        │
│     │  │PHOTO │  V. Kohli │        │   player photo: 40px
│     │  │ 40px │  RCB      │        │   name: 14px, weight 600
│     │  └──────┘           │        │   team: 12px, text-muted
│     │                     │        │
│     │  Last 3: 45•12•78*  │        │   form: 12px, mono
│     │                     │        │
│     └─────────────────────┘        │
│                                 ✕   │   remove: icon button, top-right
│                                     │
└─────────────────────────────────────┘

Border: 1px solid primary-400
Background: bg-surface
Glow: primary-glow on selection
```

**High-Value Slot (20×, 18×, 15×):**
```
┌─────────────────────────────────────┐
│  ╔═══════════════════════════════╗ │   special border treatment
│  ║                               ║ │   double border, orange glow
│  ║          20×                  ║ │
│  ║    ════════════════          ║ │   animated pulse every 2s
│  ║    ✦ HIGH VALUE ✦            ║ │   "HIGH VALUE" badge
│  ║                               ║ │
│  ║        SLOT 1                 ║ │
│  ║                               ║ │
│  ║    ┌─────────────────────┐   ║ │
│  ║    │                     │   ║ │
│  ║    │     +  ADD PLAYER   │   ║ │
│  ║    │                     │   ║ │
│  ║    └─────────────────────┘   ║ │
│  ║                               ║ │
│  ╚═══════════════════════════════╝ │
└─────────────────────────────────────┘

Border: 2px solid orange-400
Shadow: 0 0 32px rgba(255,145,0,0.3)
Badge: "HIGH VALUE" in orange, small caps
```

---

### C.4 Player Selection Modal

**Triggered when:** User clicks "+ Add Player" on any slot

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                         │  │
│   │  SELECT PLAYER FOR SLOT 1                                    ✕ Close   │  │
│   │  ═════════════════════════════════════════════════════════════════════ │  │
│   │                                                                         │  │
│   │       ┌──────────────────────────────────────────────────────────┐    │  │
│   │       │          20×  MULTIPLIER                                 │    │  │
│   │       │     This slot multiplies player points by 20             │    │  │
│   │       └──────────────────────────────────────────────────────────┘    │  │
│   │                                                                         │  │
│   │  ┌───────────────────────────────────────────────────────────────────┐ │  │
│   │  │  🔍  Search players...                                            │ │  │
│   │  └───────────────────────────────────────────────────────────────────┘ │  │
│   │                                                                         │  │
│   │  Filter:   [ All ]  [ RR ]  [ DC ]  [ Batter ]  [ Bowler ]  [ AR ]    │  │
│   │                                                                         │  │
│   │  ───────────────────────────────────────────────────────────────────── │  │
│   │                                                                         │  │
│   │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│   │  │                                                                 │  │  │
│   │  │  ┌──────────────────────────────────────────────────────────┐  │  │  │
│   │  │  │  ┌──────┐                                                │  │  │  │
│   │  │  │  │PHOTO │   Virat Kohli                    ┌──────────┐ │  │  │  │
│   │  │  │  │ 48px │   RCB • Batter                   │  SELECT  │ │  │  │  │
│   │  │  │  └──────┘                                  └──────────┘ │  │  │  │
│   │  │  │             Avg: 42.3  │  SR: 138.5  │  Last 3: 45•67•23│  │  │  │
│   │  │  └──────────────────────────────────────────────────────────┘  │  │  │
│   │  │                                                                 │  │  │
│   │  │  ┌──────────────────────────────────────────────────────────┐  │  │  │
│   │  │  │  ┌──────┐                                                │  │  │  │
│   │  │  │  │PHOTO │   Sanju Samson                   ┌──────────┐ │  │  │  │
│   │  │  │  │ 48px │   RR • WK-Batter                 │  SELECT  │ │  │  │  │
│   │  │  │  └──────┘                                  └──────────┘ │  │  │  │
│   │  │  │             Avg: 34.1  │  SR: 145.2  │  Last 3: 89•12•56│  │  │  │
│   │  │  └──────────────────────────────────────────────────────────┘  │  │  │
│   │  │                                                                 │  │  │
│   │  │  ┌──────────────────────────────────────────────────────────┐  │  │  │
│   │  │  │  ┌──────┐                                    ALREADY     │  │  │  │
│   │  │  │  │PHOTO │   Rishabh Pant                    IN SLOT 4   │  │  │  │
│   │  │  │  │ 48px │   DC • WK-Batter                  (disabled)   │  │  │  │
│   │  │  │  └──────┘                                                │  │  │  │
│   │  │  │             Avg: 38.7  │  SR: 152.1  │  Last 3: 34•78•45│  │  │  │
│   │  │  └──────────────────────────────────────────────────────────┘  │  │  │
│   │  │                                                                 │  │  │
│   │  │                        ... more players ...                    │  │  │
│   │  │                                                                 │  │  │
│   │  └─────────────────────────────────────────────────────────────────┘  │  │
│   │                                                                         │  │
│   │  Showing 24 of 48 players                              Scroll for more │  │
│   │                                                                         │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│                              (backdrop: rgba(0,0,0,0.8))                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**States:**
- Default: Selectable
- Already selected (different slot): Disabled, shows "IN SLOT X"
- Hover: bg-elevated, border primary-400

---

### C.5 Runner Selection Section

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   RUNNERS                                                          ? Help   │
│   ════════                                                                  │
│                                                                             │
│   Pick up to 2 runners. You receive 50% of their final score.              │
│                                                                             │
│   ┌─────────────────────────────┐    ┌─────────────────────────────┐       │
│   │                             │    │                             │       │
│   │       RUNNER 1              │    │       RUNNER 2              │       │
│   │                             │    │                             │       │
│   │    ┌─────────────────┐     │    │    ┌─────────────────┐     │       │
│   │    │                 │     │    │    │                 │     │       │
│   │    │   RocketRaj     │     │    │    │   + SELECT      │     │       │
│   │    │   ✓ Selected    │     │    │    │                 │     │       │
│   │    │                 │     │    │    │                 │     │       │
│   │    └─────────────────┘     │    │    └─────────────────┘     │       │
│   │                             │    │                             │       │
│   │    You get 50% of their    │    │    Tap to select a user    │       │
│   │    multiplied points       │    │                             │       │
│   │                             │    │                             │       │
│   └─────────────────────────────┘    └─────────────────────────────┘       │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  ℹ️ RUNNER RULES                                                     │  │
│   │  • Runner must place a bet for this match to contribute points      │  │
│   │  • If runner has no bet or joins late → they contribute 0 points    │  │
│   │  • You receive 50% of their final multiplied score                  │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### C.6 Bet Summary Panel (Sticky Right Sidebar)

```
┌─────────────────────────────────┐
│                                 │
│   YOUR BETS                     │
│   ════════                      │
│                                 │
│   ┌───────────────────────────┐│
│   │  MATCH RESULT             ││
│   │  ─────────────            ││
│   │                           ││
│   │  ● RR Win                 ││  selected: primary-400 radio
│   │  ○ DC Win                 ││
│   │  ○ Super Over             ││
│   │                           ││
│   └───────────────────────────┘│
│                                 │
│   ┌───────────────────────────┐│
│   │  TOTAL RUNS               ││
│   │  ─────────────            ││
│   │                           ││
│   │  Your prediction:         ││
│   │  ┌───────────────────┐   ││
│   │  │       340         │   ││  input: mono, centered
│   │  └───────────────────┘   ││
│   │                           ││
│   │  - 10 ────●──── + 10     ││  stepper controls
│   │                           ││
│   └───────────────────────────┘│
│                                 │
│   ┌───────────────────────────┐│
│   │  SIDE BETS                ││
│   │  ─────────────            ││
│   │                           ││
│   │  🔒 Revealed during match ││  locked state
│   │                           ││
│   │  Side bets appear at      ││
│   │  milestone checkpoints    ││
│   │                           ││
│   └───────────────────────────┘│
│                                 │
│   ┌───────────────────────────┐│
│   │  RUNNERS                  ││
│   │  ─────────────            ││
│   │                           ││
│   │  1. RocketRaj     50%     ││
│   │  2. Not selected          ││
│   │                           ││
│   └───────────────────────────┘│
│                                 │
│   ═════════════════════════════│
│                                 │
│   PLAYERS SELECTED              │
│                                 │
│   ████████████░░░░░░  7/11     │  progress bar
│                                 │
│   ⚠️ 4 empty slots             │  warning: warning-400
│                                 │
│   ─────────────────────────────│
│                                 │
│   ┌───────────────────────────┐│
│   │                           ││
│   │      SUBMIT BETS          ││  primary CTA
│   │                           ││
│   └───────────────────────────┘│
│                                 │
│   Incomplete bets allowed      │  hint text
│   Edit until first ball        │
│                                 │
└─────────────────────────────────┘
```

---

### C.7 Bet Submission Confirmation Modal

**Triggered when:** User clicks "Submit Bets"

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                         │  │
│   │   CONFIRM YOUR BETS                                          ✕ Close   │  │
│   │   ═════════════════════════════════════════════════════════════════    │  │
│   │                                                                         │  │
│   │   RR vs DC • Match #47                                                  │  │
│   │                                                                         │  │
│   │   ┌─────────────────────────────────────────────────────────────────┐  │  │
│   │   │                                                                 │  │  │
│   │   │   MATCH RESULT         RR Win                                   │  │  │
│   │   │   TOTAL RUNS           340                                      │  │  │
│   │   │                                                                 │  │  │
│   │   └─────────────────────────────────────────────────────────────────┘  │  │
│   │                                                                         │  │
│   │   ┌─────────────────────────────────────────────────────────────────┐  │  │
│   │   │                                                                 │  │  │
│   │   │   PLAYER PICKS                                                  │  │  │
│   │   │                                                                 │  │  │
│   │   │   Slot 1  │  20×  │  Virat Kohli (RCB)                         │  │  │
│   │   │   Slot 2  │  18×  │  Sanju Samson (RR)                         │  │  │
│   │   │   Slot 3  │  15×  │  — empty —                                 │  │  │
│   │   │   Slot 4  │  12×  │  Rishabh Pant (DC)                         │  │  │
│   │   │   Slot 5  │  10×  │  — empty —                                 │  │  │
│   │   │   ...     │  ...  │  ...                                       │  │  │
│   │   │                                                                 │  │  │
│   │   │   ⚠️ 4 slots are empty                                          │  │  │
│   │   │                                                                 │  │  │
│   │   └─────────────────────────────────────────────────────────────────┘  │  │
│   │                                                                         │  │
│   │   ┌─────────────────────────────────────────────────────────────────┐  │  │
│   │   │                                                                 │  │  │
│   │   │   RUNNERS                                                       │  │  │
│   │   │                                                                 │  │  │
│   │   │   1. RocketRaj (50%)                                            │  │  │
│   │   │   2. — not selected —                                           │  │  │
│   │   │                                                                 │  │  │
│   │   └─────────────────────────────────────────────────────────────────┘  │  │
│   │                                                                         │  │
│   │   ─────────────────────────────────────────────────────────────────    │  │
│   │                                                                         │  │
│   │   You can edit these bets until the first ball is bowled.              │  │
│   │                                                                         │  │
│   │              ┌─────────────┐     ┌─────────────────────┐              │  │
│   │              │   GO BACK   │     │   CONFIRM & SUBMIT  │              │  │
│   │              │             │     │                     │              │  │
│   │              └─────────────┘     └─────────────────────┘              │  │
│   │                 secondary              primary                         │  │
│   │                                                                         │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### C.8 Post-Lock State (Betting Closed)

**When first ball is bowled, the entire betting interface transitions:**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                         │  │
│   │     🔒  BETTING LOCKED                                                  │  │
│   │     ══════════════════                                                  │  │
│   │                                                                         │  │
│   │     Match has started. Your bets are final.                            │  │
│   │                                                                         │  │
│   │                    ┌─────────────────────────┐                         │  │
│   │                    │    VIEW LIVE SCORING    │                         │  │
│   │                    └─────────────────────────┘                         │  │
│   │                                                                         │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   YOUR LOCKED BETS                                                              │
│   ════════════════                                                              │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                         │  │
│   │   All slots now display in read-only mode                              │  │
│   │   Grayed out, no hover effects, no interaction                         │  │
│   │                                                                         │  │
│   │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │  │
│   │   │   🔒 20×    │ │   🔒 18×    │ │   🔒 15×    │ │   🔒 12×    │     │  │
│   │   │   SLOT 1    │ │   SLOT 2    │ │   SLOT 3    │ │   SLOT 4    │     │  │
│   │   │   V. Kohli  │ │  S. Samson  │ │   EMPTY     │ │   R. Pant   │     │  │
│   │   └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘     │  │
│   │                                                                         │  │
│   │   ... remaining slots ...                                              │  │
│   │                                                                         │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

Visual changes:
- All interactive elements disabled
- Color desaturation (opacity 0.6)
- Lock icons (🔒) on each slot
- No hover states
- "View Live Scoring" becomes primary CTA
```

---

## SCREEN D: LONG-TERM BETS (Tournament Predictions)

**Shown:** Before Match 4 OR in dedicated section

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   TOURNAMENT PREDICTIONS                                             ? Help    │
│   ══════════════════════                                                        │
│                                                                                 │
│   Lock before Match #4 begins. These cannot be changed after.                  │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                         │  │
│   │   🏆 TOURNAMENT WINNER                                                  │  │
│   │   ────────────────────                                                  │  │
│   │                                                                         │  │
│   │   Select 1 team:                                                        │  │
│   │                                                                         │  │
│   │   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │  │
│   │   │ CSK  │ │  MI  │ │ RCB  │ │ KKR  │ │  DC  │ │ PBKS │ │  RR  │      │  │
│   │   │  ●   │ │  ○   │ │  ○   │ │  ○   │ │  ○   │ │  ○   │ │  ○   │      │  │
│   │   └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘      │  │
│   │   ┌──────┐ ┌──────┐ ┌──────┐                                           │  │
│   │   │ SRH  │ │  GT  │ │ LSG  │                                           │  │
│   │   │  ○   │ │  ○   │ │  ○   │                                           │  │
│   │   └──────┘ └──────┘ └──────┘                                           │  │
│   │                                                                         │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                         │  │
│   │   🥇🥈 FINALISTS                                                        │  │
│   │   ──────────────                                                        │  │
│   │                                                                         │  │
│   │   Select exactly 2 teams:                                               │  │
│   │                                                                         │  │
│   │   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ...                              │  │
│   │   │ CSK  │ │  MI  │ │ RCB  │ │ KKR  │                                  │  │
│   │   │  ✓   │ │  ✓   │ │      │ │      │       2 of 2 selected            │  │
│   │   └──────┘ └──────┘ └──────┘ └──────┘                                  │  │
│   │                                                                         │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                         │  │
│   │   🏅 TOP 4 TEAMS (any order)                                            │  │
│   │   ──────────────────────────                                            │  │
│   │                                                                         │  │
│   │   Select exactly 4 teams:                                               │  │
│   │                                                                         │  │
│   │   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ...                              │  │
│   │   │ CSK  │ │  MI  │ │ RCB  │ │ KKR  │                                  │  │
│   │   │  ✓   │ │  ✓   │ │  ✓   │ │  ✓   │       4 of 4 selected            │  │
│   │   └──────┘ └──────┘ └──────┘ └──────┘                                  │  │
│   │                                                                         │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ┌──────────────────────────────────┐  ┌──────────────────────────────────┐  │
│   │                                  │  │                                  │  │
│   │   🧡 ORANGE CAP                  │  │   💜 PURPLE CAP                  │  │
│   │   ──────────────                 │  │   ──────────────                 │  │
│   │                                  │  │                                  │  │
│   │   Select up to 3 players:        │  │   Select up to 3 players:        │  │
│   │                                  │  │                                  │  │
│   │   1. Virat Kohli        ✕       │  │   1. Jasprit Bumrah      ✕       │  │
│   │   2. Shubman Gill       ✕       │  │   2. Rashid Khan         ✕       │  │
│   │   3. + Add player               │  │   3. + Add player               │  │
│   │                                  │  │                                  │  │
│   └──────────────────────────────────┘  └──────────────────────────────────┘  │
│                                                                                 │
│   ═════════════════════════════════════════════════════════════════════════    │
│                                                                                 │
│   ⏰ Locks in: 2 days, 14 hours, 32 minutes                                     │
│                                                                                 │
│                         ┌─────────────────────────────┐                        │
│                         │    SAVE TOURNAMENT BETS     │                        │
│                         └─────────────────────────────┘                        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## INTERACTION FLOW SUMMARY

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                           BETTING DAY USER FLOW                                 │
│                                                                                 │
│   ┌─────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐  │
│   │         │      │             │      │             │      │             │  │
│   │  Login  │ ───▶ │  Dashboard  │ ───▶ │   Match     │ ───▶ │   Submit    │  │
│   │         │      │             │      │   Betting   │      │   Confirm   │  │
│   └─────────┘      └─────────────┘      └─────────────┘      └─────────────┘  │
│                           │                    │                    │          │
│                           │                    │                    │          │
│                           ▼                    ▼                    ▼          │
│                    ┌─────────────┐      ┌─────────────┐      ┌─────────────┐  │
│                    │   Check     │      │   Select    │      │   Edit      │  │
│                    │   Ranking   │      │   Players   │      │   Until     │  │
│                    │             │      │   Runners   │      │   Lock      │  │
│                    └─────────────┘      └─────────────┘      └─────────────┘  │
│                                                                     │          │
│                                                                     ▼          │
│                                                              ┌─────────────┐  │
│                                                              │  🔒 LOCKED  │  │
│                                                              │  First Ball │  │
│                                                              └─────────────┘  │
│                                                                     │          │
│                                                                     ▼          │
│                                                              ┌─────────────┐  │
│                                                              │    Live     │  │
│                                                              │   Scoring   │  │
│                                                              └─────────────┘  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## KEY UX DECISIONS

| Decision | Rationale |
|----------|-----------|
| Multiplier always dominant | Users pick slots for multiplier value, not player loyalty. Design reflects this. |
| Sticky bet summary | User always sees current state while browsing players. Reduces anxiety. |
| Confirmation modal | Bets are consequential. Summary before final commit builds trust. |
| Progress indicator | "7/11 players" creates urgency without forcing completion. |
| Empty slots = strategy | Framed as "lower exposure" choice, not an error. Respects user agency. |
| Quick filters (non-intrusive) | Help discovery without auto-filling. User intent preserved. |
| Runner rules explicit | Clear that no bet = 0 contribution. Prevents confusion and disputes. |
| Side bets hidden | Per constitution, revealed at milestones. Placeholder builds anticipation. |
| Lock transition is dramatic | Color desaturation + lock icons make finality unmistakable. |

---

**END OF BATCH 2**

---

*Ready for review. Upon approval, I'll proceed to Batch 3: Leaderboards & Live Scoring Views.*

---

---

# IPL Fantasy Betting Game — Screen Designs

> **Batch 3 of 7** | Live Scoring View & Leaderboards

---

## SCREEN D: LIVE MATCH SCORING VIEW

**Purpose:** Real-time score tracking during a match. Shows how user's bets are performing, checkpoint-by-checkpoint.

### D.1 Live Scoring — Full Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR        │  TOP BAR                                                                                       │
│ (collapsed)    │  RR vs DC • Live Scoring                                          🔍    🔔 3    ❓            │
│ 72px           │                                                                                                │
├────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
│                │                                                                                                │
│  🏠            │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│  🎯 ◀          │  │                                                                                        │   │
│  📊            │  │   ┌────────┐                                                    ┌────────┐             │   │
│  👥            │  │   │   RR   │              🔴 LIVE                               │   DC   │             │   │
│  📈            │  │   │  LOGO  │         ─────────────────                          │  LOGO  │             │   │
│                │  │   └────────┘                                                    └────────┘             │   │
│                │  │                                                                                        │   │
│                │  │                    RAJASTHAN ROYALS                                                    │   │
│                │  │                         167/4                                                          │   │
│                │  │                      (16.2 overs)                                                      │   │
│                │  │                                                                                        │   │
│                │  │   ──────────────────────────────────────────────────────────────────────────────────   │   │
│                │  │                                                                                        │   │
│                │  │   Current: Samson 67* (42)  •  Hetmyer 23* (14)                                       │   │
│                │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                │                                                                                                │
│                │  ┌──────────────────────────────────────────────┐  ┌──────────────────────────────────────┐   │
│                │  │                                              │  │                                      │   │
│                │  │   YOUR SCORE                                 │  │   CURRENT CHECKPOINT                │   │
│                │  │   ══════════                                 │  │   ══════════════════                │   │
│                │  │                                              │  │                                      │   │
│                │  │         ┌──────────────────────────┐        │  │   📍 End of 15 Overs                │   │
│                │  │         │                          │        │  │                                      │   │
│                │  │         │       +12,450            │        │  │   ┌────────────────────────────┐    │   │
│                │  │         │         pts              │        │  │   │ ██████████████░░░░░░░░░░░ │    │   │
│                │  │         │                          │        │  │   └────────────────────────────┘    │   │
│                │  │         │    ▲ +3,200 this over    │        │  │                                      │   │
│                │  │         │                          │        │  │   5 of 8 checkpoints complete       │   │
│                │  │         └──────────────────────────┘        │  │                                      │   │
│                │  │                                              │  │   Next: End of Innings 1            │   │
│                │  │   Rank: #4 (▲ 2)   Global: #12 (▲ 5)        │  │                                      │   │
│                │  │                                              │  │                                      │   │
│                │  └──────────────────────────────────────────────┘  └──────────────────────────────────────┘   │
│                │                                                                                                │
│                │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│                │  │                                                                                        │   │
│                │  │   PLAYER SCORES                                                        Sort: Slot ▼   │   │
│                │  │   ═════════════                                                                        │   │
│                │  │                                                                                        │   │
│                │  │   ┌────────────────────────────────────────────────────────────────────────────────┐  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │  SLOT │ MULT │ PLAYER          │ PERFORMANCE          │ BASE  │ FINAL        │  │   │
│                │  │   │  ═════╪══════╪═════════════════╪══════════════════════╪═══════╪══════════════ │  │   │
│                │  │   │       │      │                 │                      │       │              │  │   │
│                │  │   │   1   │ 20×  │ S. Samson 🟢    │ 67(42) 4×4 3×6       │  247  │ ┌─────────┐ │  │   │
│                │  │   │       │      │ RR • Batter     │ SR: 159.5            │  [?]  │ │ +4,940  │ │  │   │
│                │  │   │       │      │                 │                      │       │ └─────────┘ │  │   │
│                │  │   │───────┼──────┼─────────────────┼──────────────────────┼───────┼──────────────│  │   │
│                │  │   │   2   │ 18×  │ R. Pant 🟡      │ 34(28) 2×4 1×6       │   94  │ ┌─────────┐ │  │   │
│                │  │   │       │      │ DC • WK-Bat     │ SR: 121.4  OUT       │  [?]  │ │ +1,692  │ │  │   │
│                │  │   │       │      │                 │                      │       │ └─────────┘ │  │   │
│                │  │   │───────┼──────┼─────────────────┼──────────────────────┼───────┼──────────────│  │   │
│                │  │   │   3   │ 15×  │ Y. Chahal 🔵    │ 1-32 (3 ov)          │   63  │ ┌─────────┐ │  │   │
│                │  │   │       │      │ RR • Bowler     │ RPO: 10.67           │  [?]  │ │   +945  │ │  │   │
│                │  │   │       │      │                 │                      │       │ └─────────┘ │  │   │
│                │  │   │───────┼──────┼─────────────────┼──────────────────────┼───────┼──────────────│  │   │
│                │  │   │   4   │ 12×  │ — EMPTY —       │ —                    │   —   │      —      │  │   │
│                │  │   │       │      │                 │                      │       │              │  │   │
│                │  │   │───────┼──────┼─────────────────┼──────────────────────┼───────┼──────────────│  │   │
│                │  │   │  ...  │ ...  │ ...             │ ...                  │  ...  │     ...      │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │   [?] = Click to expand base score breakdown                                  │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   └────────────────────────────────────────────────────────────────────────────────┘  │   │
│                │  │                                                                                        │   │
│                │  │   TOTAL PLAYER POINTS:  +9,877 pts                                                    │   │
│                │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                │                                                                                                │
│                │  ┌──────────────────────────────────┐  ┌──────────────────────────────────────────────────┐   │
│                │  │                                  │  │                                                  │   │
│                │  │   RUNNERS                        │  │   SIDE BETS                                      │   │
│                │  │   ═══════                        │  │   ═════════                                      │   │
│                │  │                                  │  │                                                  │   │
│                │  │   1. RocketRaj                   │  │   ✓ REVEALED: End of Powerplay                  │   │
│                │  │      Their score: +8,200        │  │     "Will RR score 50+ in PP?"                  │   │
│                │  │      Your 50%:    +4,100        │  │     Answer: YES ✓                               │   │
│                │  │                     ─────        │  │     You picked: YES                             │   │
│                │  │                    ┌───────┐    │  │                           ┌───────────┐         │   │
│                │  │                    │+4,100 │    │  │                           │   +150    │         │   │
│                │  │                    └───────┘    │  │                           └───────────┘         │   │
│                │  │                                  │  │                                                  │   │
│                │  │   2. — Not selected —           │  │   🔒 2 more to be revealed at future milestones │   │
│                │  │                                  │  │                                                  │   │
│                │  └──────────────────────────────────┘  └──────────────────────────────────────────────────┘   │
│                │                                                                                                │
│                │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│                │  │                                                                                        │   │
│                │  │   MATCH-LEVEL BETS                                                                     │   │
│                │  │   ════════════════                                                                     │   │
│                │  │                                                                                        │   │
│                │  │   ┌────────────────────────────┐    ┌────────────────────────────────────────────┐    │   │
│                │  │   │                            │    │                                            │    │   │
│                │  │   │  MATCH RESULT              │    │  TOTAL RUNS PREDICTION                    │    │   │
│                │  │   │  Your pick: RR Win         │    │  Your pick: 340                           │    │   │
│                │  │   │                            │    │  Current total: 167 (1st innings)         │    │   │
│                │  │   │  Status: 🟡 Pending        │    │  Status: 🟡 Pending                       │    │   │
│                │  │   │                            │    │                                            │    │   │
│                │  │   └────────────────────────────┘    └────────────────────────────────────────────┘    │   │
│                │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                │                                                                                                │
└────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### D.2 Score Jump Animation (Component Detail)

When a player scores points, the score animates:

```
BEFORE:                         DURING:                         AFTER:
┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
│                 │            │   ╔═══════════╗ │            │                 │
│    +4,200       │   ───▶     │   ║  +4,940   ║ │   ───▶     │    +4,940       │
│                 │            │   ╚═══════════╝ │            │                 │
│                 │            │    ▲ +740      │            │                 │
│                 │            │   green flash   │            │                 │
└─────────────────┘            └─────────────────┘            └─────────────────┘

Animation: 400ms
1. Number rapidly increments (odometer effect)
2. Green flash behind (success-bg at 0.3 opacity)
3. Scale 1.0 → 1.1 → 1.0
4. Delta appears below briefly (+740)
```

---

### D.3 Player Status Indicators

```
🟢 CURRENTLY PLAYING     Player is batting/bowling right now
                         Pulsing green dot

🟡 PLAYED / WAITING      Has contributed, may contribute more
                         Static yellow dot

🔴 OUT / FINISHED        No more contributions possible
                         Static red dot
                         Score locked

⚪ NOT YET PLAYED        Hasn't batted/bowled yet
                         Gray dot
                         Score shows "—"
```

---

### D.3.1 Base Score Breakdown (Expandable/Tooltip)

The [?] icon next to BASE column opens an expandable breakdown showing exactly how points are calculated:

**Batter Example (S. Samson: 247 base pts):**
```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   BASE SCORE BREAKDOWN                                    ✕ Close  │
│   ════════════════════                                              │
│                                                                     │
│   S. Samson • RR • Batter                                          │
│   Performance: 67(42) 4×4 3×6 | SR: 159.5                          │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │  COMPONENT              │  CALCULATION         │  POINTS    │  │
│   │  ══════════════════════╪══════════════════════╪════════════ │  │
│   │  Runs                   │  67 × 1              │      67    │  │
│   │  Fours                  │  4 × 10              │      40    │  │
│   │  Sixes                  │  3 × 20              │      60    │  │
│   │  Strike Rate            │  SR 159.5 → pts      │      80    │  │
│   │  Century Bonus          │  (not applicable)    │       0    │  │
│   │  ─────────────────────────────────────────────────────────  │  │
│   │  TOTAL BASE                                    │     247    │  │
│   │  ─────────────────────────────────────────────────────────  │  │
│   │  Multiplier (Slot 1)    │  × 20                │            │  │
│   │  ─────────────────────────────────────────────────────────  │  │
│   │  FINAL SCORE                                   │   4,940    │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Bowler Example (Y. Chahal: 63 base pts):**
```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   BASE SCORE BREAKDOWN                                    ✕ Close  │
│   ════════════════════                                              │
│                                                                     │
│   Y. Chahal • RR • Bowler                                          │
│   Performance: 1-32 (3 ov) | RPO: 10.67                            │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │  COMPONENT              │  CALCULATION         │  POINTS    │  │
│   │  ══════════════════════╪══════════════════════╪════════════ │  │
│   │  Wickets                │  1 × 20              │      20    │  │
│   │  RPO Band               │  RPO > 8 → 25 pts    │      25    │  │
│   │  Catches                │  0 × 5               │       0    │  │
│   │  Run-outs               │  0 × 5               │       0    │  │
│   │  5-Wicket Bonus         │  (not applicable)    │       0    │  │
│   │  Hat-trick Bonus        │  (not applicable)    │       0    │  │
│   │  ─────────────────────────────────────────────────────────  │  │
│   │  Batting (if any)       │  18 runs             │      18    │  │
│   │  ─────────────────────────────────────────────────────────  │  │
│   │  TOTAL BASE                                    │      63    │  │
│   │  ─────────────────────────────────────────────────────────  │  │
│   │  Multiplier (Slot 3)    │  × 15                │            │  │
│   │  ─────────────────────────────────────────────────────────  │  │
│   │  FINAL SCORE                                   │     945    │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   RPO BANDS REFERENCE:                                             │
│   • RPO ≤ 6.0  → 100 pts                                           │
│   • RPO > 6.0 and ≤ 8.0 → 50 pts                                   │
│   • RPO > 8.0 → 25 pts                                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### D.3.2 Match Rules Snapshot (Recommended)

A collapsible panel showing the frozen rules for this specific match:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   📋 MATCH RULES SNAPSHOT                               ▼ Expand   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

EXPANDED:
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   📋 MATCH RULES SNAPSHOT                               ▲ Collapse │
│   ═══════════════════════                                           │
│                                                                     │
│   Rules locked: Apr 15, 2024 at 2:00 PM IST                        │
│                                                                     │
│   ┌────────────────────────┬────────────────────────────────────┐  │
│   │  Multipliers           │  ✓ Enabled (20× to 3×)             │  │
│   │  Runner Slots          │  2 runners, 50% transfer           │  │
│   │  Negative Scoring      │  ✗ Disabled                        │  │
│   │  Side Bets             │  3 configured                      │  │
│   │  Checkpoints           │  8 (standard T20)                  │  │
│   └────────────────────────┴────────────────────────────────────┘  │
│                                                                     │
│   Base scoring follows constitution (Section 4).                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### D.3.3 Runner Zero-State (When Runner Did Not Bet)

When a selected runner has not placed a bet for this match:

```
┌──────────────────────────────────┐
│                                  │
│   RUNNERS                        │
│   ═══════                        │
│                                  │
│   1. RocketRaj                   │
│      Their score: +8,200        │
│      Your 50%:    +4,100        │
│                    ─────        │
│                   ┌───────┐    │
│                   │+4,100 │    │
│                   └───────┘    │
│                                  │
│   2. SlowStarter                 │
│      ┌─────────────────────────┐│
│      │  ⚠️ NO BET PLACED        ││
│      │                         ││
│      │  SlowStarter did not    ││
│      │  submit bets for this   ││
│      │  match.                 ││
│      │                         ││
│      │  Contribution: 0 pts    ││
│      └─────────────────────────┘│
│                                  │
└──────────────────────────────────┘

Visual treatment:
- Warning icon (⚠️)
- Muted background (bg-subtle)
- Clear explanation text
- "0 pts" in text-muted
```

---

### D.4 Checkpoint Progress Component

**CRITICAL: Checkpoints are DYNAMIC, not fixed.**

Checkpoint count and labels are generated per match based on:
- Match format (T20, reduced overs due to rain, etc.)
- Admin configuration
- MoM timing (can be 8th, 9th, or merged with final checkpoint)

```
CHECKPOINT CONFIGURATION (per match):
┌─────────────────────────────────────────────────────────────────────────────┐
│  Match #47: RR vs DC                                                        │
│  Format: Standard T20 (20 overs per side)                                   │
│  Checkpoints configured: 8                                                  │
│                                                                             │
│  1. End of Powerplay (Innings 1)                                            │
│  2. End of 10 Overs (Innings 1)                                             │
│  3. End of Innings 1                                                        │
│  4. End of Powerplay (Innings 2)                                            │
│  5. End of 10 Overs (Innings 2)                                             │
│  6. End of 15 Overs (Innings 2)                                             │
│  7. End of Match                                                            │
│  8. Man of the Match                                                        │
└─────────────────────────────────────────────────────────────────────────────┘

REDUCED OVERS EXAMPLE (rain delay, 12 overs per side):
┌─────────────────────────────────────────────────────────────────────────────┐
│  Match #52: GT vs SRH (Rain-affected)                                       │
│  Format: 12 overs per side                                                  │
│  Checkpoints configured: 5                                                  │
│                                                                             │
│  1. End of Powerplay (Innings 1) — 4 overs                                  │
│  2. End of Innings 1                                                        │
│  3. End of Powerplay (Innings 2) — 4 overs                                  │
│  4. End of Match                                                            │
│  5. Man of the Match                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Visual Component (labels rendered from match config API):**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   MATCH CHECKPOINTS                                            5 of 8      │
│   ═════════════════                                                         │
│                                                                             │
│   ┌───────┐   ┌───────┐   ┌───────┐   ┌───────┐   ┌───────┐              │
│   │   ✓   │───│   ✓   │───│   ✓   │───│   ✓   │───│   ●   │───...       │
│   │       │   │       │   │       │   │       │   │       │              │
│   └───────┘   └───────┘   └───────┘   └───────┘   └───────┘              │
│    PP Inn1     10ov I1    End Inn1    PP Inn2     10ov I2                 │
│     +450       +1,200       +800       +2,100     current                  │
│                                                                             │
│   ⚠️ Labels are DYNAMIC — rendered from match configuration                 │
│   Never hardcode checkpoint names in UI code                               │
│                                                                             │
│   ✓ Complete (scored)   ● Current   ○ Pending                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Implementation Note:**
- UI must render checkpoint labels from API response
- Checkpoint count varies (typically 5-9 depending on match)
- MoM checkpoint may be separate or merged with final
- Abandoned matches have 0 checkpoints (not scored per constitution)

---

### D.5 Side Bet Reveal Moment

When a side bet is revealed at a milestone:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                         │  │
│   │   🎉 SIDE BET REVEALED!                                                 │  │
│   │   ═════════════════════                                                 │  │
│   │                                                                         │  │
│   │   Milestone: End of Powerplay (6 overs)                                │  │
│   │                                                                         │  │
│   │   ┌─────────────────────────────────────────────────────────────────┐  │  │
│   │   │                                                                 │  │  │
│   │   │   "Will RR score 50+ runs in the powerplay?"                   │  │  │
│   │   │                                                                 │  │  │
│   │   │   ┌───────────────────┐       ┌───────────────────┐            │  │  │
│   │   │   │                   │       │                   │            │  │  │
│   │   │   │       YES         │       │        NO         │            │  │  │
│   │   │   │                   │       │                   │            │  │  │
│   │   │   └───────────────────┘       └───────────────────┘            │  │  │
│   │   │                                                                 │  │  │
│   │   │   RR scored: 58/1 in powerplay                                 │  │  │
│   │   │                                                                 │  │  │
│   │   │   ══════════════════════════════════════════════════════════   │  │  │
│   │   │                                                                 │  │  │
│   │   │   Answer: YES ✓                                                │  │  │
│   │   │                                                                 │  │  │
│   │   │   Your pick: YES                     ┌─────────────────┐       │  │  │
│   │   │                                      │     +150 pts    │       │  │  │
│   │   │   Result: CORRECT ✓                  │   (success-400) │       │  │  │
│   │   │                                      └─────────────────┘       │  │  │
│   │   │                                                                 │  │  │
│   │   └─────────────────────────────────────────────────────────────────┘  │  │
│   │                                                                         │  │
│   │                        ┌─────────────────────────┐                     │  │
│   │                        │       CONTINUE          │                     │  │
│   │                        └─────────────────────────┘                     │  │
│   │                                                                         │  │
│   └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│                              (modal overlay)                                    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### D.6 Match Completed State

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                                          │  │
│  │   ┌────────┐                     MATCH COMPLETE                           ┌────────┐                    │  │
│  │   │   RR   │                    ═══════════════                           │   DC   │                    │  │
│  │   │  LOGO  │                                                              │  LOGO  │                    │  │
│  │   └────────┘                                                              └────────┘                    │  │
│  │                                                                                                          │  │
│  │                              RAJASTHAN ROYALS WON                                                        │  │
│  │                                 by 24 runs                                                               │  │
│  │                                                                                                          │  │
│  │                         RR: 187/5 (20 ov)  vs  DC: 163/8 (20 ov)                                        │  │
│  │                                                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                                 │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                                          │  │
│  │   YOUR FINAL SCORE                                                                                       │  │
│  │   ════════════════                                                                                       │  │
│  │                                                                                                          │  │
│  │   ┌───────────────────────────────────────────────────────────────────────────────────────────────────┐ │  │
│  │   │                                                                                                   │ │  │
│  │   │                                   +18,650 pts                                                     │ │  │
│  │   │                                   ═══════════                                                     │ │  │
│  │   │                                                                                                   │ │  │
│  │   │                              Rank: #3 (▲ 4 from start)                                           │ │  │
│  │   │                                                                                                   │ │  │
│  │   └───────────────────────────────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                                          │  │
│  │   ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐   │  │
│  │   │                                                                                                 │   │  │
│  │   │   BREAKDOWN                                                                                     │   │  │
│  │   │   ─────────                                                                                     │   │  │
│  │   │                                                                                                 │   │  │
│  │   │   ┌───────────────────────┐                                                                     │   │  │
│  │   │   │ ████████████████████  │  Player Points      +14,200  (76%)                                 │   │  │
│  │   │   │ ████████              │  Runner Points       +4,100  (22%)                                 │   │  │
│  │   │   │ █                     │  Side Bets            +150  (1%)                                   │   │  │
│  │   │   │ █                     │  Match Result         +200  (1%)                                   │   │  │
│  │   │   │                       │  Total Runs             +0  (missed by 12)                         │   │  │
│  │   │   └───────────────────────┘                                                                     │   │  │
│  │   │                                                                                                 │   │  │
│  │   └─────────────────────────────────────────────────────────────────────────────────────────────────┘   │  │
│  │                                                                                                          │  │
│  │   ┌────────────────────────────────────────┐    ┌────────────────────────────────────────┐              │  │
│  │   │                                        │    │                                        │              │  │
│  │   │   🏆 MAN OF THE MATCH                   │    │   📊 YOUR MVP                          │              │  │
│  │   │                                        │    │                                        │              │  │
│  │   │   Sanju Samson                         │    │   S. Samson                            │              │  │
│  │   │   89(52) 6×4 4×6                       │    │   Slot 1 × 20×                         │              │  │
│  │   │                                        │    │                                        │              │  │
│  │   │   Did you have him? YES ✓             │    │   Contributed: +7,800 pts              │              │  │
│  │   │   MoM Bonus: +200 → +4,000 (×20)      │    │   (42% of your total)                  │              │  │
│  │   │                                        │    │                                        │              │  │
│  │   └────────────────────────────────────────┘    └────────────────────────────────────────┘              │  │
│  │                                                                                                          │  │
│  │            ┌─────────────────────────────┐         ┌─────────────────────────────┐                      │  │
│  │            │     VIEW LEADERBOARD        │         │     VIEW FULL BREAKDOWN     │                      │  │
│  │            └─────────────────────────────┘         └─────────────────────────────┘                      │  │
│  │                                                                                                          │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## SCREEN E: LEADERBOARDS

### E.1 Global Leaderboard — Full Page

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR        │  TOP BAR                                                                                       │
│                │  Leaderboard                                                   🔍    🔔 3    ❓                │
├────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
│                │                                                                                                │
│  🏠            │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│  🎯            │  │                                                                                        │   │
│  📊 ◀          │  │   ┌─────────────────────────────────┐    ┌─────────────────────────────────┐          │   │
│  👥            │  │   │         GLOBAL                  │    │        FRIENDS GROUP            │          │   │
│  📈            │  │   │         ══════                  │    │        ═════════════            │          │   │
│                │  │   │      (selected)                 │    │                                 │          │   │
│                │  │   └─────────────────────────────────┘    └─────────────────────────────────┘          │   │
│                │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                │                                                                                                │
│                │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│                │  │                                                                                        │   │
│                │  │   YOUR POSITION                                                                        │   │
│                │  │   ═════════════                                                                        │   │
│                │  │                                                                                        │   │
│                │  │   ┌────────────────────────────────────────────────────────────────────────────────┐  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │    #7          SpiffMaster (You)              1,24,850 pts        ▲ 2         │  │   │
│                │  │   │    ────────────────────────────────────────────────────────────────────────   │  │   │
│                │  │   │    highlight row: bg-primary-glow, border-left: 4px primary-400               │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   └────────────────────────────────────────────────────────────────────────────────┘  │   │
│                │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                │                                                                                                │
│                │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│                │  │                                                                                        │   │
│                │  │   RANK │ USER               │ TOTAL POINTS      │ LAST MATCH    │ TREND              │   │
│                │  │   ═════╪════════════════════╪═══════════════════╪═══════════════╪════════════════════ │   │
│                │  │                                                                                        │   │
│                │  │   ┌────────────────────────────────────────────────────────────────────────────────┐  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │  🥇 1   CricketKing_99      1,52,340 pts       +18,200       ▲▲ 3  (streak)   │  │   │
│                │  │   │         ──────────────────────────────────────────────────────────────────── │  │   │
│                │  │   │         Crown icon, gold accent, top performer badge                         │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │  🥈 2   SixerQueen           1,48,920 pts       +12,450       ▲ 1             │  │   │
│                │  │   │         Silver accent                                                         │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │  🥉 3   BoundaryBoss         1,45,100 pts       +15,800       ─ 0             │  │   │
│                │  │   │         Bronze accent                                                         │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   ├────────────────────────────────────────────────────────────────────────────────┤  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │     4   WicketWizard         1,38,200 pts       +8,900        ▼ 2             │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │     5   RunMachine           1,35,450 pts       +11,200       ▲ 1             │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │     6   SpinDoctor           1,28,100 pts       +9,450        ─ 0             │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │ ▶  7   SpiffMaster (You)    1,24,850 pts       +18,650       ▲ 2             │  │   │
│                │  │   │        ═══════════════════════════════════════════════════════════════════   │  │   │
│                │  │   │        (highlighted row with glow)                                            │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │     8   PowerHitter          1,22,300 pts       +6,200        ▼ 1             │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │     8   FastBowlerFan        1,22,300 pts       +14,100       ▲ 4             │  │   │
│                │  │   │        (tied rank — both show #8, no asterisk needed)                         │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │     9   AllRounderAce        1,19,800 pts       +7,800        ▼ 3             │  │   │
│                │  │   │        (next rank is 9, NOT 10 — no skipped ranks per constitution)           │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │   ...                                                                          │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   └────────────────────────────────────────────────────────────────────────────────┘  │   │
│                │  │                                                                                        │   │
│                │  │   Showing 1-20 of 47 players                              ◀  1  2  3  ▶               │   │
│                │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                │                                                                                                │
│                │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│                │  │                                                                                        │   │
│                │  │   QUICK STATS                                                                          │   │
│                │  │   ═══════════                                                                          │   │
│                │  │                                                                                        │   │
│                │  │   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐          │   │
│                │  │   │               │  │               │  │               │  │               │          │   │
│                │  │   │  47           │  │  27,560       │  │  1,52,340     │  │  85,200       │          │   │
│                │  │   │  Players      │  │  Avg Points   │  │  Highest      │  │  Lowest       │          │   │
│                │  │   │               │  │               │  │               │  │               │          │   │
│                │  │   └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘          │   │
│                │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                │                                                                                                │
└────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### E.2 Group Leaderboard Tab

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                        │
│   ┌─────────────────────────────────┐    ┌─────────────────────────────────┐          │
│   │         GLOBAL                  │    │        FRIENDS GROUP            │          │
│   │                                 │    │        ═════════════            │          │
│   │                                 │    │         (selected)              │          │
│   └─────────────────────────────────┘    └─────────────────────────────────┘          │
│                                                                                        │
│   ┌────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                │  │
│   │   FRIENDS GROUP                                                 8 members     │  │
│   │   ═════════════                                                               │  │
│   │                                                                                │  │
│   │   Invite Code: FRND-2024-XYZ              [ Copy Link ]  [ Share ]           │  │
│   │                                                                                │  │
│   └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
│   ┌────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                │  │
│   │  RANK │ USER               │ TOTAL POINTS      │ LAST MATCH    │ TREND        │  │
│   │  ═════╪════════════════════╪═══════════════════╪═══════════════╪════════════  │  │
│   │                                                                                │  │
│   │  🥇 1   RocketRaj            98,450 pts          +12,200         ─ 0          │  │
│   │                                                                                │  │
│   │  🥈 2   SlamDunk             94,200 pts          +8,900          ▲ 1          │  │
│   │                                                                                │  │
│   │ ▶ 3   SpiffMaster (You)    1,24,850 pts         +18,650         ▲ 2          │  │
│   │       ════════════════════════════════════════════════════════════════       │  │
│   │                                                                                │  │
│   │    4   CoolCricket          88,100 pts          +6,450          ▼ 2          │  │
│   │                                                                                │  │
│   │   ...                                                                          │  │
│   │                                                                                │  │
│   └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### E.3 Leaderboard Row States

```
TOP 3 TREATMENT:
┌────────────────────────────────────────────────────────────────────────────────────┐
│  🥇 1   CricketKing_99      1,52,340 pts       +18,200       ▲▲ 3               │
│         ────────────────────────────────────────────────────────────────────────  │
│         bg: subtle gold gradient                                                   │
│         border-left: 4px gold                                                      │
│         crown icon                                                                 │
│         "3-match streak" badge if applicable                                       │
└────────────────────────────────────────────────────────────────────────────────────┘

YOUR ROW (always highlighted):
┌────────────────────────────────────────────────────────────────────────────────────┐
│ ▶ 7   SpiffMaster (You)    1,24,850 pts       +18,650       ▲ 2                 │
│       ══════════════════════════════════════════════════════════════════════════  │
│       bg: primary-glow (0.1)                                                       │
│       border-left: 4px primary-400                                                 │
│       "(You)" suffix in primary-400                                                │
│       pointer icon (▶) in left margin                                              │
└────────────────────────────────────────────────────────────────────────────────────┘

TIED RANK:
┌────────────────────────────────────────────────────────────────────────────────────┐
│     8   PowerHitter          1,22,300 pts       +6,200        ▼ 1               │
│     8   FastBowlerFan        1,22,300 pts       +14,100       ▲ 4               │
│        ───────────────────────────────────────────────────────────────────────── │
│        Both users show rank 8 (joint rank)                                        │
│        NO skipped ranks per constitution → next user is rank 9                   │
│                                                                                    │
│        Example sequence: 7, 8, 8, 9, 10, 11...                                   │
│        NOT: 7, 8, 8, 10, 11... (this would skip rank 9)                          │
└────────────────────────────────────────────────────────────────────────────────────┘

TREND INDICATORS:
▲ 1    = moved up 1 position (success-400)
▲▲ 3   = moved up 3+ positions (success-400, double arrow)
▼ 2    = moved down 2 positions (error-400)
─ 0    = no change (text-muted)
```

---

### E.4 Leaderboard — Mobile View

```
┌─────────────────────────────────────────┐
│  Leaderboard           Global ▼        │
├─────────────────────────────────────────┤
│                                         │
│  YOUR POSITION                          │
│  ┌─────────────────────────────────┐   │
│  │  #7  SpiffMaster                │   │
│  │      1,24,850 pts    ▲ 2       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ───────────────────────────────────   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🥇 CricketKing_99               │   │
│  │    1,52,340 pts       ▲▲ 3     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🥈 SixerQueen                   │   │
│  │    1,48,920 pts       ▲ 1      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🥉 BoundaryBoss                 │   │
│  │    1,45,100 pts       ─ 0      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  4  WicketWizard                │   │
│  │     1,38,200 pts      ▼ 2      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ... scroll for more ...               │
│                                         │
├─────────────────────────────────────────┤
│  🏠    │    🎯    │    📊    │    👤   │
│ Home   │  Match  │  Ranks  │ Profile │
└─────────────────────────────────────────┘

Mobile treatment:
- Card-based layout (not table)
- Points prominent, last match hidden
- Trend shown with icon only
- Sticky "Your Position" at top
```

---

## KEY UX DECISIONS — BATCH 3

| Decision | Rationale |
|----------|-----------|
| Score animation | Makes point accumulation feel rewarding and noticeable |
| Player status dots | Quick visual scan of who's contributing |
| Base score breakdown | Expandable [?] shows exactly how points calculated — removes ambiguity |
| Dynamic checkpoints | Labels from API, not hardcoded — supports rain delays, reduced overs |
| Match Rules Snapshot | Shows frozen config (multipliers, runners, negatives) — builds trust |
| Side bet reveal modal | Creates dramatic moments, aligned with constitution |
| Runner zero-state | Clear "NO BET PLACED" message when runner contributes 0 |
| Your row always highlighted | User never loses their position in dense leaderboard |
| Tied ranks (no skipping) | Both show same rank, next user gets sequential rank (8,8,9 not 8,8,10) |
| Large number formatting | Indian notation (1,24,850) for familiarity |
| Trend double-arrow | Distinguishes big moves (▲▲ 3+) from small ones |
| Mobile card layout | Tables don't work on small screens; cards preserve hierarchy |

---

**END OF BATCH 3**

---

*Ready for review. Upon approval, I'll proceed to Batch 4: User Profile & Analytics.*

---

---

# IPL Fantasy Betting Game — Screen Designs

> **Batch 4 of 7** | User Profile & Analytics

---

## SCREEN F: USER PROFILE & ANALYTICS

**Purpose:** Deep-dive into user's tournament performance. Data-rich but navigable. Supports both casual glancers and serious analysts.

### F.1 Profile Overview — Full Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR        │  TOP BAR                                                                                       │
│                │  My Analytics                                                   🔍    🔔 3    ❓                │
├────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
│                │                                                                                                │
│  🏠            │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│  🎯            │  │                                                                                        │   │
│  📊            │  │   PROFILE HEADER                                                                       │   │
│  👥            │  │   ══════════════                                                                       │   │
│  📈 ◀          │  │                                                                                        │   │
│                │  │   ┌──────────┐                                                                         │   │
│                │  │   │          │     SpiffMaster                                                         │   │
│                │  │   │  AVATAR  │     ════════════                                                        │   │
│                │  │   │   80px   │     Member since Mar 2024                                               │   │
│                │  │   │          │                                                                         │   │
│                │  │   └──────────┘     Groups: Friends League, Office Pool                                 │   │
│                │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                │                                                                                                │
│                │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│                │  │                                                                                        │   │
│                │  │   TOURNAMENT STATS                                                                     │   │
│                │  │   ════════════════                                                                     │   │
│                │  │                                                                                        │   │
│                │  │   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐     │   │
│                │  │   │                 │ │                 │ │                 │ │                 │     │   │
│                │  │   │    1,24,850     │ │       #7        │ │      32         │ │     3,902       │     │   │
│                │  │   │      pts        │ │    Global       │ │    Matches      │ │   Avg / Match   │     │   │
│                │  │   │                 │ │     Rank        │ │     Played      │ │                 │     │   │
│                │  │   │   Total Points  │ │    (of 47)      │ │                 │ │                 │     │   │
│                │  │   │                 │ │                 │ │                 │ │                 │     │   │
│                │  │   └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘     │   │
│                │  │                                                                                        │   │
│                │  │   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐     │   │
│                │  │   │                 │ │                 │ │                 │ │                 │     │   │
│                │  │   │    +18,650      │ │       #3        │ │      67%        │ │       4         │     │   │
│                │  │   │   Best Match    │ │    Best Rank    │ │  Side Bet Acc.  │ │  Top 5 Finishes │     │   │
│                │  │   │   (RR vs DC)    │ │   (Apr 12)      │ │   (12/18)       │ │                 │     │   │
│                │  │   │                 │ │                 │ │                 │ │                 │     │   │
│                │  │   └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘     │   │
│                │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                │                                                                                                │
│                │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│                │  │                                                                                        │   │
│                │  │   POINTS OVER TIME                                               Filter: All ▼        │   │
│                │  │   ════════════════                                                                     │   │
│                │  │                                                                                        │   │
│                │  │          Total Points                                                                  │   │
│                │  │     1,30,000 ┤                                                              ●          │   │
│                │  │              │                                                          ●───●          │   │
│                │  │     1,20,000 ┤                                                     ●────●              │   │
│                │  │              │                                               ●─────●                   │   │
│                │  │     1,10,000 ┤                                          ●────●                         │   │
│                │  │              │                                    ●─────●                              │   │
│                │  │     1,00,000 ┤                              ●─────●                                    │   │
│                │  │              │                         ●────●                                          │   │
│                │  │       90,000 ┤                    ●────●                                               │   │
│                │  │              │               ●────●                                                    │   │
│                │  │       80,000 ┤          ●────●                                                         │   │
│                │  │              │     ●────●                                                              │   │
│                │  │       70,000 ┤●────●                                                                   │   │
│                │  │              └──────────────────────────────────────────────────────────────────────   │   │
│                │  │                M1   M5   M10   M15   M20   M25   M30   M32                             │   │
│                │  │                                                                                        │   │
│                │  │   Hover on any point to see match details                                             │   │
│                │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                │                                                                                                │
└────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### F.2 Points Breakdown Section

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                            │
│   POINTS BREAKDOWN BY SOURCE                                                                               │
│   ══════════════════════════                                                                               │
│                                                                                                            │
│   ┌────────────────────────────────────────────────┐  ┌────────────────────────────────────────────────┐  │
│   │                                                │  │                                                │  │
│   │   DONUT CHART                                  │  │   BREAKDOWN TABLE                              │  │
│   │                                                │  │                                                │  │
│   │              ┌─────────────┐                   │  │   SOURCE            │  POINTS   │    %        │  │
│   │         ╱────│   PLAYER    │────╲              │  │   ═════════════════╪═══════════╪═════════════ │  │
│   │       ╱      │   POINTS    │      ╲            │  │                    │           │              │  │
│   │      │       │   72%       │       │           │  │   Player Points    │  89,892   │   72.0%     │  │
│   │      │       └─────────────┘       │           │  │   ████████████████████████████████            │  │
│   │      │   ┌───────┐     ┌───────┐   │           │  │                    │           │              │  │
│   │       ╲  │RUNNER │     │ SIDE  │  ╱            │  │   Runner Points    │  22,450   │   18.0%     │  │
│   │        ╲ │ 18%   │     │  6%   │ ╱             │  │   █████████████                               │  │
│   │         ╲└───────┘     └───────┘╱              │  │                    │           │              │  │
│   │          ╲   ┌─────────────┐   ╱               │  │   Side Bets        │   7,508   │    6.0%     │  │
│   │           ╲──│   MATCH     │──╱                │  │   ████                                        │  │
│   │              │    4%       │                   │  │                    │           │              │  │
│   │              └─────────────┘                   │  │   Match Bets       │   5,000   │    4.0%     │  │
│   │                                                │  │   ███                                         │  │
│   │                                                │  │                    │           │              │  │
│   │   Total: 1,24,850 pts                         │  │   TOTAL            │ 1,24,850  │  100.0%     │  │
│   │                                                │  │                    │           │              │  │
│   └────────────────────────────────────────────────┘  └────────────────────────────────────────────────┘  │
│                                                                                                            │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### F.3 Match-by-Match Performance Table

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                                    │
│   MATCH HISTORY                                                                      Filter ▼  │  Export CSV ↓   │
│   ═════════════                                                                                                    │
│                                                                                                                    │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                                            │  │
│   │  DATE    │ MATCH         │ RESULT    │ YOUR PTS  │ RANK  │ PLAYER PTS │ RUNNER │ SIDE  │ MATCH │ DELTA   │  │
│   │  ════════╪═══════════════╪═══════════╪═══════════╪═══════╪════════════╪════════╪═══════╪═══════╪═════════ │  │
│   │          │               │           │           │       │            │        │       │       │          │  │
│   │  Apr 15  │ RR vs DC      │ RR won    │  +18,650  │  #3   │   +14,200  │ +4,100 │  +150 │  +200 │  ▲▲ 4   │  │
│   │          │               │           │  ════════ │       │            │        │       │       │          │  │
│   │          │               │           │ best match│       │            │        │       │       │          │  │
│   │          │ Rules: Mult ✓ │ Neg ✗ │ Runner 50% │ Side 3                                        │          │  │
│   │          │               │           │           │       │            │        │       │       │          │  │
│   │  Apr 14  │ GT vs SRH     │ GT won    │   +3,200  │  #7   │    +2,800  │   +400 │    +0 │    +0 │  ▼ 2    │  │
│   │          │ Rules: Mult ✓ │ Neg ✗ │ Runner 50% │ Side 2                                        │          │  │
│   │          │               │           │           │       │            │        │       │       │          │  │
│   │  Apr 13  │ PBKS vs LSG   │ LSG won   │   -1,450  │  #5   │     -800   │  -400  │  -150 │  -100 │  ▼ 1    │  │
│   │          │               │           │  ════════ │       │            │        │       │       │          │  │
│   │          │               │           │ neg. score│       │                                     │          │  │
│   │          │ Rules: Mult ✓ │ Neg ✓ │ Runner 50% │ Side 3                                        │          │  │
│   │          │ ┌─────────────────────────────────────────────────────────────────────────────────┐│          │  │
│   │          │ │ ⓘ NEGATIVE SCORE BREAKDOWN:                                                     ││          │  │
│   │          │ │   Player underperformance: -800 (your picks scored below baseline)             ││          │  │
│   │          │ │   Runner drag: -400 (runner's negative score × 50%)                            ││          │  │
│   │          │ │   Side bet penalties: -150 (2 incorrect side bets)                             ││          │  │
│   │          │ │   Match bet penalty: -100 (wrong result pick)                                  ││          │  │
│   │          │ └─────────────────────────────────────────────────────────────────────────────────┘│          │  │
│   │          │               │           │           │       │            │        │       │       │          │  │
│   │  Apr 12  │ KKR vs RCB    │ KKR won   │   +8,900  │  #4   │    +7,200  │ +1,200 │  +300 │  +200 │  ▲ 2    │  │
│   │          │ Rules: Mult ✓ │ Neg ✗ │ Runner 50% │ Side 2                                        │          │  │
│   │          │               │           │           │       │            │        │       │       │          │  │
│   │  Apr 11  │ CSK vs MI     │ CSK won   │   +5,400  │  #6   │    +4,000  │   +900 │  +200 │  +300 │  ─ 0    │  │
│   │          │ Rules: Mult ✓ │ Neg ✗ │ Runner 50% │ Side 3                                        │          │  │
│   │          │               │           │           │       │            │        │       │       │          │  │
│   │  ...     │ ...           │ ...       │    ...    │  ...  │     ...    │  ...   │  ...  │  ...  │   ...   │  │
│   │          │               │           │           │       │            │        │       │       │          │  │
│   └────────────────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                                    │
│   RULES KEY: Mult = Multipliers │ Neg = Negative Scoring │ Runner % │ Side = Side Bet Count                      │
│                                                                                                                    │
│   Showing 1-10 of 32 matches                                                    ◀  1  2  3  4  ▶                  │
│                                                                                                                    │
│   Click any row to expand full match breakdown                                                                    │
│                                                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### F.4 Expanded Match Row (Drill-Down)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                                    │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                                            │  │
│   │  Apr 15  │ RR vs DC      │ RR won    │  +18,650  │  #3   │   +14,200  │ +4,100 │  +150 │  +200 │  ▲▲ 4   │  │
│   │                                                                                            ▲ Collapse     │  │
│   ├────────────────────────────────────────────────────────────────────────────────────────────────────────────┤  │
│   │                                                                                                            │  │
│   │   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐ │  │
│   │   │  📋 RULES APPLIED THIS MATCH                                                                        │ │  │
│   │   │  ───────────────────────────                                                                        │ │  │
│   │   │  Multipliers: ✓ Active (20× to 3×)  │  Negatives: ✗ Off  │  Runner: 50%  │  Side Bets: 3           │ │  │
│   │   │  Locked: Apr 15, 2024 at 2:00 PM IST                                                                │ │  │
│   │   └─────────────────────────────────────────────────────────────────────────────────────────────────────┘ │  │
│   │                                                                                                            │  │
│   │   YOUR PLAYER PICKS                                                                                        │  │
│   │   ─────────────────                                                                                        │  │
│   │                                                                                                            │  │
│   │   SLOT │ MULT │ PLAYER              │ PERFORMANCE           │ BASE  │ FINAL   │ % OF TOTAL              │  │
│   │   ═════╪══════╪═════════════════════╪═══════════════════════╪═══════╪═════════╪═════════════════════════ │  │
│   │     1  │ 20×  │ S. Samson (RR)      │ 89(52) 6×4 4×6, MoM   │   590 │  +11,800│ ████████████████  63%   │  │
│   │     2  │ 18×  │ R. Pant (DC)        │ 34(28) 2×4 1×6        │    94 │   +1,692│ ████  9%                │  │
│   │     3  │ 15×  │ — empty —           │ —                     │     — │       — │                          │  │
│   │     4  │ 12×  │ Y. Chahal (RR)      │ 2-28 (4ov)            │   118 │   +1,416│ ███  8%                  │  │
│   │     5  │ 10×  │ A. Patel (DC)       │ 1-32 (4ov)            │    63 │     +630│ █  3%                    │  │
│   │   ...  │ ...  │ ...                 │ ...                   │   ... │     ... │                          │  │
│   │                                                                                                            │  │
│   │   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐ │  │
│   │   │  💡 INSIGHT: You score 38% higher when picking RR batters in high-multiplier slots (1-3).          │ │  │
│   │   └─────────────────────────────────────────────────────────────────────────────────────────────────────┘ │  │
│   │                                                                                                            │  │
│   │   RUNNERS                                                                                                  │  │
│   │   ───────                                                                                                  │  │
│   │                                                                                                            │  │
│   │   1. RocketRaj      Their total: +8,200    Your 50%: +4,100   ██████████  22%                            │  │
│   │   2. — not selected —                                                                                      │  │
│   │                                                                                                            │  │
│   │   MATCH-LEVEL BETS                                                                                         │  │
│   │   ────────────────                                                                                         │  │
│   │                                                                                                            │  │
│   │   Match Result:  Your pick: RR Win ✓     Result: RR Won     +200 pts                                      │  │
│   │   Total Runs:    Your pick: 340          Actual: 352        +0 pts (missed by 12)                         │  │
│   │                                                                                                            │  │
│   │   SIDE BETS                                                                                                │  │
│   │   ─────────                                                                                                │  │
│   │                                                                                                            │  │
│   │   1. "Will RR score 50+ in PP?"     Your pick: Yes ✓    Answer: Yes    +150 pts                          │  │
│   │   2. "Will there be a Super Over?"  Your pick: No ✓     Answer: No     +0 pts (neutral)                  │  │
│   │   3. "MoM from RR?"                 Your pick: Yes ✓    Answer: Yes    +0 pts (neutral)                  │  │
│   │                                                                                                            │  │
│   └────────────────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### F.5 Player Contribution Analysis

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                            │
│   YOUR TOP CONTRIBUTORS                                    ☐ Compare with Group Avg    Sort: Total Pts ▼  │
│   ═════════════════════                                                                                    │
│                                                                                                            │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │  ⓘ ROI DEFINITION                                                                                   │ │
│   │  ROI = (Total Points from Player) ÷ (Expected Points if placed in avg slot with avg multiplier)    │ │
│   │  • ROI ≥ 1.5× = ▲▲ Excellent   • ROI 1.0–1.49× = ▲ Good   • ROI < 1.0× = ▼ Poor                   │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                            │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                                    │  │
│   │  RANK │ PLAYER              │ TIMES PICKED │ TOTAL PTS  │ AVG PTS    │ BEST SLOT │ ROI           │  │
│   │  ═════╪═════════════════════╪══════════════╪════════════╪════════════╪═══════════╪═══════════════ │  │
│   │       │                     │              │            │            │           │                │  │
│   │   1   │ S. Samson (RR)      │     8        │   +32,400  │   +4,050   │  Slot 1   │ ▲▲ 1.82×      │  │
│   │       │ ██████████████████████████████████████████████████████████████████████████               │  │
│   │       │                     │              │            │            │           │                │  │
│   │   2   │ V. Kohli (RCB)      │    12        │   +28,200  │   +2,350   │  Slot 2   │ ▲ 1.24×       │  │
│   │       │ ███████████████████████████████████████████████████████████                              │  │
│   │       │                     │              │            │            │           │                │  │
│   │   3   │ R. Pant (DC)        │    10        │   +18,900  │   +1,890   │  Slot 3   │ ▲ 1.15×       │  │
│   │       │ ██████████████████████████████████████████████                                           │  │
│   │       │                     │              │            │            │           │                │  │
│   │   4   │ J. Bumrah (MI)      │     6        │   +12,600  │   +2,100   │  Slot 1   │ ▲ 1.31×       │  │
│   │       │ █████████████████████████████████                                                        │  │
│   │       │                     │              │            │            │           │                │  │
│   │   5   │ M. Shami (GT)       │     4        │    -2,400  │    -600    │  Slot 5   │ ▼ 0.42×       │  │
│   │       │ ████████ (red bar for negative)                                                          │  │
│   │       │                     │              │            │            │           │                │  │
│   │  ...  │ ...                 │    ...       │     ...    │    ...     │   ...     │     ...       │  │
│   │       │                     │              │            │            │           │                │  │
│   └────────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                            │
│   Showing 18 unique players picked across 32 matches                                                      │
│                                                                                                            │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │  💡 INSIGHT: Your RR batter picks average 1.67× ROI vs 1.12× for other teams.                       │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                            │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### F.6 Runner Impact Analysis

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                            │
│   RUNNER PERFORMANCE                                                       ☐ Compare with Group Avg       │
│   ══════════════════                                                                                       │
│                                                                                                            │
│   ┌────────────────────────────────────────────────┐  ┌────────────────────────────────────────────────┐  │
│   │                                                │  │                                                │  │
│   │   OVERALL RUNNER STATS                         │  │   RUNNER BREAKDOWN                             │  │
│   │                                                │  │                                                │  │
│   │   ┌───────────────────────────────────────┐   │  │   RUNNER        │ TIMES │ PTS GAINED │ AVG    │  │
│   │   │                                       │   │  │   ════════════════╪═══════╪════════════╪═══════ │  │
│   │   │  Total Runner Points:   +22,450      │   │  │                  │       │            │        │  │
│   │   │  % of Total Score:      18.0%        │   │  │   RocketRaj      │  15   │  +14,200   │  +947  │  │
│   │   │  Matches with Runner:   28 / 32      │   │  │   ████████████████████████████████████          │  │
│   │   │  Best Runner Match:     +4,100       │   │  │                  │       │            │        │  │
│   │   │                                       │   │  │   SlamDunk       │   8   │   +5,600   │  +700  │  │
│   │   └───────────────────────────────────────┘   │  │   ██████████████████████                        │  │
│   │                                                │  │                  │       │            │        │  │
│   │   ┌───────────────────────────────────────┐   │  │   CoolCricket    │   5   │   +2,650   │  +530  │  │
│   │   │                                       │   │  │   █████████████                                 │  │
│   │   │  ⚠️ 4 matches had runner with no bet  │   │  │                  │       │            │        │  │
│   │   │     (contributed 0 points)            │   │  │                  │       │            │        │  │
│   │   │                                       │   │  │   --- Runners who didn't bet ---              │  │
│   │   └───────────────────────────────────────┘   │  │   SlowStarter    │   4   │      0     │    0   │  │
│   │                                                │  │   (no bet placed in those matches)             │  │
│   │                                                │  │                  │       │            │        │  │
│   └────────────────────────────────────────────────┘  └────────────────────────────────────────────────┘  │
│                                                                                                            │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │  💡 INSIGHT: RocketRaj contributes 63% of your runner points. Consider diversifying.                │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                            │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### F.7 Side Bet Accuracy

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                            │
│   SIDE BET PERFORMANCE                                                                                     │
│   ════════════════════                                                                                     │
│                                                                                                            │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                                     │ │
│   │   ACCURACY METER                                                                                    │ │
│   │                                                                                                     │ │
│   │   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐  │ │
│   │   │                                                                                             │  │ │
│   │   │                              67%                                                            │  │ │
│   │   │                          ═══════════                                                        │  │ │
│   │   │                          12 of 18 correct                                                   │  │ │
│   │   │                                                                                             │  │ │
│   │   │        ████████████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░                   │  │ │
│   │   │        ◀─────────── correct ────────────▶◀────── incorrect ──────▶                         │  │ │
│   │   │                                                                                             │  │ │
│   │   └─────────────────────────────────────────────────────────────────────────────────────────────┘  │ │
│   │                                                                                                     │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                            │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                                    │  │
│   │   SIDE BET │ MATCH        │ QUESTION                            │ YOUR PICK │ ANSWER │ RESULT   │  │
│   │   ═════════╪══════════════╪═════════════════════════════════════╪═══════════╪════════╪══════════ │  │
│   │            │              │                                     │           │        │           │  │
│   │      1     │ RR vs DC     │ Will RR score 50+ in PP?           │    Yes    │  Yes   │ ✓ +150   │  │
│   │      2     │ RR vs DC     │ Will there be a Super Over?        │    No     │  No    │ ✓ +0     │  │
│   │      3     │ RR vs DC     │ MoM from RR?                       │    Yes    │  Yes   │ ✓ +0     │  │
│   │      4     │ GT vs SRH    │ Will GT chase in <18 overs?        │    Yes    │  No    │ ✗ -50    │  │
│   │      5     │ PBKS vs LSG  │ Total sixes > 15?                  │    Yes    │  No    │ ✗ -100   │  │
│   │     ...    │ ...          │ ...                                 │   ...     │  ...   │   ...    │  │
│   │            │              │                                     │           │        │           │  │
│   │   TOTAL SIDE BET POINTS:  +7,508                                                                  │  │
│   │                                                                                                    │  │
│   └────────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                            │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### F.8 Rank History Chart

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                            │
│   RANK PROGRESSION                                                                                         │
│   ════════════════                                                                                         │
│                                                                                                            │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                                     │ │
│   │       Rank                                                                                          │ │
│   │         1 ┤                                                                                         │ │
│   │           │                                                                                         │ │
│   │         5 ┤              ●                                           ●                              │ │
│   │           │           ●─────●                                    ●───────●                          │ │
│   │        10 ┤      ●────●           ●────●────●                ●───●                                  │ │
│   │           │  ●───●                          ────●────●───●───●                                      │ │
│   │        15 ┤                                                                                         │ │
│   │           │                                                                                         │ │
│   │        20 ┤                                                                                         │ │
│   │           └──────────────────────────────────────────────────────────────────────────────────────   │ │
│   │             M1   M5   M10   M15   M20   M25   M30   M32                                             │ │
│   │                                                                                                     │ │
│   │   Best Rank: #3 (Apr 12)      Worst Rank: #12 (Apr 3)      Current: #7                             │ │
│   │                                                                                                     │ │
│   │   Note: Lower is better (Y-axis inverted)                                                          │ │
│   │                                                                                                     │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                            │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │  ⓘ RANKING RULES (per constitution)                                                                 │ │
│   │  • Ranks reflect relative performance within a fixed pool of 47 players                            │ │
│   │  • Tied scores = joint rank (e.g., two users at #8 means next user is #9, not #10)                │ │
│   │  • No skipped ranks at any point                                                                    │ │
│   │  • Rank changes occur after each match is fully scored (including MoM)                             │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                            │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### F.9 Tournament Predictions Status

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                            │
│   TOURNAMENT PREDICTIONS                                                               Locked: Apr 2      │
│   ══════════════════════                                                                                   │
│                                                                                                            │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │  ⓘ SCORING RULES                                                                                    │ │
│   │  • Tournament Winner: All-or-nothing (+5,000 if correct, +0 if wrong)                              │ │
│   │  • Finalists: Per-slot partial credit (+2,000 per correct team in final)                           │ │
│   │  • Top 4 Teams: Per-slot partial credit (+500 per correct team in Top 4)                           │ │
│   │  • Orange/Purple Cap: Any-of-3 rule (+1,000 if ANY of your 3 picks wins the cap)                   │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                            │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                                    │  │
│   │   PREDICTION        │ YOUR PICKS                      │ STATUS          │ POTENTIAL POINTS       │  │
│   │   ══════════════════╪═════════════════════════════════╪═════════════════╪════════════════════════ │  │
│   │                     │                                 │                 │                         │  │
│   │   Tournament Winner │ CSK                             │ 🟡 In Progress  │ +5,000 if correct      │  │
│   │   (all-or-nothing)  │                                 │ (CSK in Top 4)  │ (0 if wrong)           │  │
│   │                     │                                 │                 │                         │  │
│   │   Finalists         │ CSK, MI                         │ 🟡 In Progress  │ +2,000 × correct picks │  │
│   │   (partial credit)  │                                 │ (both in Top 4) │ Max: +4,000            │  │
│   │                     │                                 │                 │                         │  │
│   │   Top 4 Teams       │ CSK, MI, RR, KKR                │ 🟡 In Progress  │ +500 × correct picks   │  │
│   │   (partial credit)  │                                 │ (3/4 currently) │ Current est: +1,500    │  │
│   │                     │                                 │                 │ Max: +2,000            │  │
│   │                     │                                 │                 │                         │  │
│   │   Orange Cap        │ 1. V. Kohli                     │ 🟢 Looking Good │ +1,000 if any correct  │  │
│   │   (any-of-3)        │ 2. S. Gill                      │ (Kohli #2)      │ (0 if all wrong)       │  │
│   │                     │ 3. R. Pant                      │                 │                         │  │
│   │                     │                                 │                 │                         │  │
│   │   Purple Cap        │ 1. J. Bumrah                    │ 🔴 At Risk      │ +1,000 if any correct  │  │
│   │   (any-of-3)        │ 2. R. Chahal                    │ (Bumrah #5)     │ (0 if all wrong)       │  │
│   │                     │ 3. M. Shami                     │                 │                         │  │
│   │                     │                                 │                 │                         │  │
│   └────────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                            │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │  POTENTIAL TOTAL: +1,500 (locked in) to +13,000 (all correct)                                       │ │
│   │  Tournament predictions will be scored after the final match.                                       │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                            │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### F.10 Mobile Analytics View

```
┌─────────────────────────────────────────┐
│  My Analytics               Settings ⚙️ │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │       SpiffMaster               │   │
│  │       ════════════              │   │
│  │       Rank #7 • 1,24,850 pts   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  QUICK STATS                    │   │
│  │  ───────────                    │   │
│  │                                 │   │
│  │  32 matches │ 3,902 avg │ 67%  │   │
│  │  played       per match   side  │   │
│  │                           acc.  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  POINTS BREAKDOWN               │   │
│  │  ────────────────               │   │
│  │                                 │   │
│  │  Players  ██████████████  72%  │   │
│  │  Runners  █████  18%           │   │
│  │  Side     ██  6%               │   │
│  │  Match    █  4%                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  TOP CONTRIBUTORS               │   │
│  │  ────────────────               │   │
│  │                                 │   │
│  │  1. S. Samson    +32,400       │   │
│  │  2. V. Kohli     +28,200       │   │
│  │  3. R. Pant      +18,900       │   │
│  │                                 │   │
│  │         View All →             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  MATCH HISTORY                  │   │
│  │  ─────────────                  │   │
│  │                                 │   │
│  │  Apr 15 │ RR vs DC │ +18,650 ▲ │   │
│  │  Apr 14 │ GT vs SRH│  +3,200 ▼ │   │
│  │  Apr 13 │ PBKS/LSG │  -1,450 ▼ │   │
│  │                                 │   │
│  │         View All →             │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  🏠    │    🎯    │    📊    │    👤   │
│ Home   │  Match  │  Ranks  │ Profile │
└─────────────────────────────────────────┘

Mobile approach:
- Stacked cards
- Abbreviated stats
- "View All" links for full data
- No complex charts (simplified bars)
- Export available in full view only
```

---

## KEY UX DECISIONS — BATCH 4

| Decision | Rationale |
|----------|-----------|
| Donut + table combo | Visual overview + precise numbers for different user needs |
| Expandable match rows | Dense summary with drill-down preserves scanability |
| Rules Applied per match | Context for comparing matches with different rule configurations |
| Negative score breakdown | Explicit explanation prevents confusion about point deductions |
| ROI deterministic (≥1.5×/1.0-1.49×/<1.0×) | Removes subjectivity; users can self-evaluate picks |
| Compare with Group Avg toggle | Contextualizes individual performance against peers |
| Insight callouts | Actionable observations without overwhelming the interface |
| Runner no-bet callout | Explicit about zero-contribution matches |
| Rank chart with constitution note | Clarifies tied-rank and no-skip rules |
| Tournament partial credit explicit | Prevents assumption errors about scoring model |
| Export CSV | Power users want to analyze in spreadsheets |
| Mobile simplified | Core stats visible; complex analysis on desktop |

---

**END OF BATCH 4**

---

*Ready for review. Upon approval, I'll proceed to Batch 5: Team & Player Pages.*

---

---

# IPL Fantasy Betting Game — Screen Designs

> **Batch 5 of 7** | Team & Player Pages

---

## SCREEN G: TEAM PAGES

**Purpose:** Reference pages for IPL teams. Shows squad, recent form, and user's historical performance picking this team's players.

### G.1 Team Page — Full Layout

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR        │  TOP BAR                                                                                       │
│                │  Teams › Chennai Super Kings                                   🔍    🔔 3    ❓                │
├────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
│                │                                                                                                │
│  🏠            │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│  🎯            │  │                                                                                        │   │
│  📊            │  │   TEAM HEADER                                                                          │   │
│  👥            │  │   ═══════════                                                                          │   │
│  📈            │  │                                                                                        │   │
│  ───────────   │  │   ┌────────────┐                                                                       │   │
│  TEAMS ◀       │  │   │            │     CHENNAI SUPER KINGS                                               │   │
│  ┌────┬────┐   │  │   │    CSK     │     ═════════════════════                                             │   │
│  │CSK │ MI │   │  │   │    LOGO    │     Est. 2008 • 5× Champions                                          │   │
│  ├────┼────┤   │  │   │    96px    │     Home: M.A. Chidambaram Stadium, Chennai                           │   │
│  │RCB │KKR │   │  │   │            │                                                                       │   │
│  ├────┼────┤   │  │   └────────────┘     Captain: MS Dhoni                                                 │   │
│  │ DC │PBK │   │  │                                                                                        │   │
│  ├────┼────┤   │  │   Team Color Bar: ████████████████████████████████████████████████████████            │   │
│  │ RR │SRH │   │  │                   #FCCA06 (CSK Yellow)                                                 │   │
│  ├────┼────┤   │  │                                                                                        │   │
│  │ GT │LSG │   │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│  └────┴────┘   │                                                                                                │
│                │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│                │  │                                                                                        │   │
│                │  │   TOURNAMENT STATS                                                                     │   │
│                │  │   ════════════════                                                                     │   │
│                │  │                                                                                        │   │
│                │  │   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐     │   │
│                │  │   │                 │ │                 │ │                 │ │                 │     │   │
│                │  │   │      #2         │ │    8W - 4L      │ │     +0.82       │ │  Qualified ✓    │     │   │
│                │  │   │   Position      │ │    Win-Loss     │ │      NRR        │ │   Playoffs      │     │   │
│                │  │   │                 │ │                 │ │                 │ │                 │     │   │
│                │  │   └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘     │   │
│                │  │                                                                                        │   │
│                │  │   RECENT FORM                                                                          │   │
│                │  │   ───────────                                                                          │   │
│                │  │   ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                                                       │   │
│                │  │   │ W │ │ W │ │ L │ │ W │ │ W │   Last 5 matches                                      │   │
│                │  │   └───┘ └───┘ └───┘ └───┘ └───┘                                                       │   │
│                │  │   green  green red   green green                                                       │   │
│                │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                │                                                                                                │
│                │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│                │  │                                                                                        │   │
│                │  │   YOUR PERFORMANCE WITH CSK PLAYERS                                                    │   │
│                │  │   ═════════════════════════════════                                                    │   │
│                │  │                                                                                        │   │
│                │  │   ┌───────────────────────────────────────────────────────────────────────────────┐   │   │
│                │  │   │                                                                               │   │   │
│                │  │   │  Times picked CSK players:   42 (across all slots, all matches)              │   │   │
│                │  │   │  Total points from CSK:      +28,400                                          │   │   │
│                │  │   │  Avg points per pick:        +676                                             │   │   │
│                │  │   │  ROI vs league avg:          ▲ 1.18× (Good)                                  │   │   │
│                │  │   │                                                                               │   │   │
│                │  │   │  Best CSK pick:              R. Jadeja (+4,200 in Slot 2 vs MI)              │   │   │
│                │  │   │  Worst CSK pick:             D. Chahar (-320 in Slot 8 vs RR)                │   │   │
│                │  │   │                                                                               │   │   │
│                │  │   └───────────────────────────────────────────────────────────────────────────────┘   │   │
│                │  │                                                                                        │   │
│                │  │   ┌─────────────────────────────────────────────────────────────────────────────────┐ │   │
│                │  │   │  💡 INSIGHT: You pick CSK batters 2.3× more often than CSK bowlers.             │ │   │
│                │  │   │     Consider balancing — CSK bowlers have 1.24× avg ROI this season.            │ │   │
│                │  │   └─────────────────────────────────────────────────────────────────────────────────┘ │   │
│                │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                │                                                                                                │
└────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### G.2 Team Squad Section

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                                │
│   SQUAD                                                               Filter: All ▼    Sort: Fantasy Pts ▼   │
│   ═════                                                                                                        │
│                                                                                                                │
│   ┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                                       │  │
│   │   BATTERS (7)                                                                                         │  │
│   │   ───────────                                                                                         │  │
│   │                                                                                                       │  │
│   │   ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐    │  │
│   │   │ ┌────┐              │ │ ┌────┐              │ │ ┌────┐              │ │ ┌────┐              │    │  │
│   │   │ │IMG │ R. Gaikwad   │ │ │IMG │ D. Conway    │ │ │IMG │ A. Rahane    │ │ │IMG │ S. Dube      │    │  │
│   │   │ │48px│ Batter       │ │ │48px│ Batter       │ │ │48px│ Batter       │ │ │48px│ Batter-AR    │    │  │
│   │   │ └────┘              │ │ └────┘              │ │ └────┘              │ │ └────┘              │    │  │
│   │   │                     │ │                     │ │                     │ │                     │    │  │
│   │   │ Runs: 412 │ SR: 138 │ │ Runs: 356 │ SR: 142 │ │ Runs: 289 │ SR: 125 │ │ Runs: 245 │ SR: 156 │    │  │
│   │   │ Fantasy: 4,820 pts  │ │ Fantasy: 4,210 pts  │ │ Fantasy: 3,450 pts  │ │ Fantasy: 3,120 pts  │    │  │
│   │   │                     │ │                     │ │                     │ │                     │    │  │
│   │   │ Your picks: 6×      │ │ Your picks: 4×      │ │ Your picks: 2×      │ │ Your picks: 5×      │    │  │
│   │   │ Your ROI: ▲ 1.34×  │ │ Your ROI: ▲ 1.12×  │ │ Your ROI: ▼ 0.87×  │ │ Your ROI: ▲ 1.45×  │    │  │
│   │   │                     │ │                     │ │                     │ │                     │    │  │
│   │   │   [ View Profile ]  │ │   [ View Profile ]  │ │   [ View Profile ]  │ │   [ View Profile ]  │    │  │
│   │   └─────────────────────┘ └─────────────────────┘ └─────────────────────┘ └─────────────────────┘    │  │
│   │                                                                                                       │  │
│   └───────────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                                │
│   ┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                                       │  │
│   │   BOWLERS (6)                                                                                         │  │
│   │   ───────────                                                                                         │  │
│   │                                                                                                       │  │
│   │   ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐    │  │
│   │   │ ┌────┐              │ │ ┌────┐              │ │ ┌────┐              │ │ ┌────┐              │    │  │
│   │   │ │IMG │ D. Chahar    │ │ │IMG │ T. Deshpande │ │ │IMG │ M. Pathirana │ │ │IMG │ M. Theekshana│    │  │
│   │   │ │48px│ Fast Bowler  │ │ │48px│ Fast Bowler  │ │ │48px│ Fast Bowler  │ │ │48px│ Spinner      │    │  │
│   │   │ └────┘              │ │ └────┘              │ │ └────┘              │ │ └────┘              │    │  │
│   │   │                     │ │                     │ │                     │ │                     │    │  │
│   │   │ Wkts: 14 │ RPO: 8.2 │ │ Wkts: 11 │ RPO: 8.8 │ │ Wkts: 10 │ RPO: 7.9 │ │ Wkts: 8 │ RPO: 7.4  │    │  │
│   │   │ Fantasy: 3,890 pts  │ │ Fantasy: 2,950 pts  │ │ Fantasy: 3,120 pts  │ │ Fantasy: 2,680 pts  │    │  │
│   │   │                     │ │                     │ │                     │ │                     │    │  │
│   │   │ Your picks: 3×      │ │ Your picks: 1×      │ │ Your picks: 4×      │ │ Your picks: 2×      │    │  │
│   │   │ Your ROI: ▼ 0.78×  │ │ Your ROI: ▲ 1.05×  │ │ Your ROI: ▲ 1.28×  │ │ Your ROI: ▲ 1.15×  │    │  │
│   │   │                     │ │                     │ │                     │ │                     │    │  │
│   │   │   [ View Profile ]  │ │   [ View Profile ]  │ │   [ View Profile ]  │ │   [ View Profile ]  │    │  │
│   │   └─────────────────────┘ └─────────────────────┘ └─────────────────────┘ └─────────────────────┘    │  │
│   │                                                                                                       │  │
│   └───────────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                                │
│   ┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                                       │  │
│   │   ALL-ROUNDERS (3)                                                                                    │  │
│   │   ────────────────                                                                                    │  │
│   │                                                                                                       │  │
│   │   ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐                            │  │
│   │   │ ┌────┐              │ │ ┌────┐              │ │ ┌────┐              │                            │  │
│   │   │ │IMG │ R. Jadeja    │ │ │IMG │ M. Ali       │ │ │IMG │ MS Dhoni     │                            │  │
│   │   │ │48px│ All-Rounder  │ │ │48px│ All-Rounder  │ │ │48px│ WK-Batter    │                            │  │
│   │   │ └────┘              │ │ └────┘              │ │ └────┘   (C)        │                            │  │
│   │   │                     │ │                     │ │                     │                            │  │
│   │   │ Runs: 234 │ Wkts: 8 │ │ Runs: 189 │ Wkts: 5 │ │ Runs: 156 │ Ct: 12 │                            │  │
│   │   │ Fantasy: 5,120 pts  │ │ Fantasy: 3,450 pts  │ │ Fantasy: 2,890 pts  │                            │  │
│   │   │                     │ │                     │ │                     │                            │  │
│   │   │ Your picks: 8×      │ │ Your picks: 3×      │ │ Your picks: 4×      │                            │  │
│   │   │ Your ROI: ▲▲ 1.56× │ │ Your ROI: ▲ 1.22×  │ │ Your ROI: ▲ 1.08×  │                            │  │
│   │   │                     │ │                     │ │                     │                            │  │
│   │   │   [ View Profile ]  │ │   [ View Profile ]  │ │   [ View Profile ]  │                            │  │
│   │   └─────────────────────┘ └─────────────────────┘ └─────────────────────┘                            │  │
│   │                                                                                                       │  │
│   └───────────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                                │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### G.3 Team Match Schedule

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                            │
│   MATCH SCHEDULE                                                                                           │
│   ══════════════                                                                                           │
│                                                                                                            │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                                     │ │
│   │   UPCOMING                                                                                          │ │
│   │   ────────                                                                                          │ │
│   │                                                                                                     │ │
│   │   ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │ │
│   │   │  Apr 18  │  CSK vs RCB  │  7:30 PM  │  Chepauk  │  ◉ Betting Open  │  [ Place Bets ]       │ │ │
│   │   └──────────────────────────────────────────────────────────────────────────────────────────────┘ │ │
│   │                                                                                                     │ │
│   │   ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │ │
│   │   │  Apr 22  │  MI vs CSK   │  7:30 PM  │  Wankhede │  ○ Upcoming      │  2 days away          │ │ │
│   │   └──────────────────────────────────────────────────────────────────────────────────────────────┘ │ │
│   │                                                                                                     │ │
│   │   ┌──────────────────────────────────────────────────────────────────────────────────────────────┐ │ │
│   │   │  Apr 26  │  CSK vs GT   │  7:30 PM  │  Chepauk  │  ○ Upcoming      │  6 days away          │ │ │
│   │   └──────────────────────────────────────────────────────────────────────────────────────────────┘ │ │
│   │                                                                                                     │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                            │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                                     │ │
│   │   PAST MATCHES (completed only — abandoned/no-result excluded)                                      │ │
│   │   ────────────                                                                                      │ │
│   │                                                                                                     │ │
│   │   DATE   │ MATCH        │ RESULT          │ YOUR PTS FROM CSK │ TOP CSK PERFORMER                  │ │
│   │   ═══════╪══════════════╪═════════════════╪═══════════════════╪════════════════════════════════════ │ │
│   │   Apr 15 │ CSK vs DC    │ CSK won by 24   │ +3,400            │ R. Jadeja: 245 base (+2,940 @ 12×) │ │
│   │   Apr 12 │ RR vs CSK    │ RR won by 8     │ +1,200            │ R. Gaikwad: 156 base               │ │
│   │   Apr 8  │ CSK vs MI    │ CSK won by 6    │ +4,800            │ D. Conway: 312 base (+4,680 @ 15×) │ │
│   │   Apr 4  │ KKR vs CSK   │ KKR won by 12   │ +890              │ M. Pathirana: 89 base              │ │
│   │   ...    │ ...          │ ...             │ ...               │ ...                                │ │
│   │                                                                                                     │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                            │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## SCREEN H: PLAYER PAGES

**Purpose:** Deep-dive into individual player stats, fantasy performance, and user's historical results with this player.

### H.1 Player Page — Full Layout

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR        │  TOP BAR                                                                                       │
│                │  Teams › CSK › Ravindra Jadeja                                 🔍    🔔 3    ❓                │
├────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
│                │                                                                                                │
│                │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│                │  │                                                                                        │   │
│                │  │   PLAYER HEADER                                                                        │   │
│                │  │   ═════════════                                                                        │   │
│                │  │                                                                                        │   │
│                │  │   ┌────────────────┐                                                                   │   │
│                │  │   │                │     RAVINDRA JADEJA                                               │   │
│                │  │   │   PLAYER       │     ════════════════                                              │   │
│                │  │   │    PHOTO       │     Chennai Super Kings • All-Rounder                             │   │
│                │  │   │    120px       │                                                                   │   │
│                │  │   │                │     🇮🇳 India  │  Left-hand bat  │  Left-arm orthodox            │   │
│                │  │   │                │                                                                   │   │
│                │  │   └────────────────┘     IPL Career: 234 matches │ 2,692 runs │ 150 wickets            │   │
│                │  │                                                                                        │   │
│                │  │   Team Color Accent: ████ CSK Yellow                                                   │   │
│                │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                │                                                                                                │
│                │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│                │  │                                                                                        │   │
│                │  │   IPL 2024 STATS                                                                       │   │
│                │  │   ══════════════                                                                       │   │
│                │  │                                                                                        │   │
│                │  │   ┌────────────────────────────────────┐  ┌────────────────────────────────────┐      │   │
│                │  │   │                                    │  │                                    │      │   │
│                │  │   │   BATTING                          │  │   BOWLING                          │      │   │
│                │  │   │   ───────                          │  │   ───────                          │      │   │
│                │  │   │                                    │  │                                    │      │   │
│                │  │   │   Matches:     12                  │  │   Overs:      42                   │      │   │
│                │  │   │   Runs:        234                 │  │   Wickets:    8                    │      │   │
│                │  │   │   Highest:     62*                 │  │   Best:       3/24                 │      │   │
│                │  │   │   Average:     29.25               │  │   Average:    28.5                 │      │   │
│                │  │   │   SR:          142.68              │  │   Economy:    7.82                 │      │   │
│                │  │   │   4s:          18  │  6s: 12      │  │   RPO Band:   ▲ 50 pts/match      │      │   │
│                │  │   │                                    │  │                                    │      │   │
│                │  │   └────────────────────────────────────┘  └────────────────────────────────────┘      │   │
│                │  │                                                                                        │   │
│                │  │   ┌─────────────────────────────────────────────────────────────────────────────────┐ │   │
│                │  │   │                                                                                 │ │   │
│                │  │   │   FANTASY PERFORMANCE                                                           │ │   │
│                │  │   │                                                                                 │ │   │
│                │  │   │   Total Base Points:   5,120 pts (this season)                                 │ │   │
│                │  │   │   Avg Base / Match:    427 pts                                                 │ │   │
│                │  │   │   League Rank:         #8 (All-Rounders)                                       │ │   │
│                │  │   │                                                                                 │ │   │
│                │  │   │   ┌──────────────────────────────────────────────────────────────────────────┐ │ │   │
│                │  │   │   │  BASE SCORE FORMULA (this player):                                       │ │ │   │
│                │  │   │   │  Batting: Runs(1×) + 4s(10×) + 6s(20×) + SR(as pts) + Century(+200)     │ │ │   │
│                │  │   │   │  Bowling: Wickets(20×) + RPO band* + 5-fer(+200) + Hat-trick(+200)      │ │ │   │
│                │  │   │   │  Fielding: Catches/Stumpings(5×) + MoM(+200)                            │ │ │   │
│                │  │   │   │                                                                          │ │ │   │
│                │  │   │   │  *RPO Bands: ≤6.0 → 100 pts │ >6.0 to ≤8.0 → 50 pts │ >8.0 → 25 pts    │ │ │   │
│                │  │   │   │                                                                          │ │ │   │
│                │  │   │   │  ⓘ Any participation (≥1 ball faced or bowled) is fully scored.         │ │ │   │
│                │  │   │   │    No minimum overs/balls required. Abandoned matches excluded.         │ │ │   │
│                │  │   │   └──────────────────────────────────────────────────────────────────────────┘ │ │   │
│                │  │   │                                                                                 │ │   │
│                │  │   └─────────────────────────────────────────────────────────────────────────────────┘ │   │
│                │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                │                                                                                                │
└────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### H.2 Player Match-by-Match Performance

**Note:** Abandoned or No-Result matches do not appear in this table and are excluded from all statistics.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                                │
│   MATCH-BY-MATCH                                                                      RPO Bands: ≤6→100 │     │
│   ══════════════                                                                      >6-≤8→50 │ >8→25       │
│                                                                                                                │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                                         │ │
│   │  DATE   │ VS    │ BATTING           │ BOWLING         │ FIELDING │ BASE PTS │ YOUR PICK?             │ │
│   │  ═══════╪═══════╪═══════════════════╪═════════════════╪══════════╪══════════╪════════════════════════ │ │
│   │         │       │                   │                 │          │          │                         │ │
│   │  Apr 15 │  DC   │ 48(32) 3×4 2×6   │ 2-24 (4 ov)     │ 1 catch  │   438    │ ✓ Slot 2 (12×) +5,256  │ │
│   │         │       │ SR: 150.0         │ RPO: 6.0 → 100  │          │          │   ▲▲ Great pick        │ │
│   │         │       │ Rules: Mult ✓ Neg ✗                                                                │ │
│   │         │       │                   │                 │          │          │                         │ │
│   │  Apr 12 │  RR   │ 12(14) 1×4       │ 1-38 (4 ov)     │ —        │   142    │ ✗ Not picked           │ │
│   │         │       │ SR: 85.7          │ RPO: 9.5 → 25   │          │          │   Would have been +1,704│ │
│   │         │       │ Rules: Mult ✓ Neg ✗                                      │   in your empty Slot 4  │ │
│   │         │       │                   │                 │          │          │                         │ │
│   │  Apr 8  │  MI   │ 62*(38) 5×4 3×6  │ 0-32 (3 ov)     │ 2 catches│   512    │ ✓ Slot 1 (20×) +10,240 │ │
│   │         │       │ SR: 163.2, 100!   │ RPO: 10.67 → 25 │          │          │   ▲▲ Season best       │ │
│   │         │       │ Rules: Mult ✓ Neg ✗                                                                │ │
│   │         │       │                   │                 │          │          │                         │ │
│   │  Apr 4  │  KKR  │ 8(12)             │ 2-28 (4 ov)     │ 1 catch  │   198    │ ✓ Slot 6 (8×) +1,584   │ │
│   │         │       │ SR: 66.7          │ RPO: 7.0 → 50   │          │          │   ▲ Decent pick        │ │
│   │         │       │ Rules: Mult ✓ Neg ✓ (negatives active)                                             │ │
│   │         │       │                   │                 │          │          │                         │ │
│   │  ...    │ ...   │ ...               │ ...             │ ...      │ ...      │ ...                     │ │
│   │         │       │                   │                 │          │          │                         │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                                │
│   Showing 12 completed matches this season (abandoned/no-result excluded)                                     │
│                                                                                                                │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### H.3 Your History with This Player

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                            │
│   YOUR HISTORY WITH R. JADEJA                                                                              │
│   ═══════════════════════════                                                                              │
│                                                                                                            │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                                    │  │
│   │   SUMMARY                                                                                          │  │
│   │   ───────                                                                                          │  │
│   │                                                                                                    │  │
│   │   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐                 │  │
│   │   │                 │ │                 │ │                 │ │                 │                 │  │
│   │   │       8         │ │   +18,420       │ │    +2,303       │ │   ▲▲ 1.56×     │                 │  │
│   │   │   Times Picked  │ │   Total Pts     │ │   Avg / Pick    │ │      ROI        │                 │  │
│   │   │   (of 12 games) │ │                 │ │                 │ │   (Excellent)   │                 │  │
│   │   │                 │ │                 │ │                 │ │                 │                 │  │
│   │   └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘                 │  │
│   │                                                                                                    │  │
│   └────────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                            │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                                    │  │
│   │   SLOT DISTRIBUTION                                                                                │  │
│   │   ─────────────────                                                                                │  │
│   │                                                                                                    │  │
│   │   Slot 1 (20×)  ██████████████████████████  3 picks  │  +14,520 total  │  Avg: +4,840            │  │
│   │   Slot 2 (18×)  █████████████████  2 picks           │  +7,200 total   │  Avg: +3,600            │  │
│   │   Slot 4 (12×)  ████████  1 pick                     │  +1,200 total   │  Avg: +1,200            │  │
│   │   Slot 6 (8×)   ████████  1 pick                     │  +1,584 total   │  Avg: +1,584            │  │
│   │   Slot 8 (5×)   ████████  1 pick                     │  -84 total      │  Avg: -84 (neg match)   │  │
│   │                                                                                                    │  │
│   │   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐ │  │
│   │   │  💡 INSIGHT: Jadeja performs best in high-multiplier slots for you.                         │ │  │
│   │   │     Avg ROI in Slots 1-3: 1.82×  vs  Slots 4+: 0.94×                                       │ │  │
│   │   └─────────────────────────────────────────────────────────────────────────────────────────────┘ │  │
│   │                                                                                                    │  │
│   └────────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                            │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                                    │  │
│   │   MISSED OPPORTUNITIES                                                                             │  │
│   │   ────────────────────                                                                             │  │
│   │                                                                                                    │  │
│   │   Matches where you didn't pick Jadeja but had empty slots:                                       │  │
│   │                                                                                                    │  │
│   │   ┌──────────────────────────────────────────────────────────────────────────────────────────┐   │  │
│   │   │  Apr 12 vs RR  │  His base: 142 pts  │  Your empty: Slot 4 (12×)  │  Missed: +1,704 pts │   │  │
│   │   └──────────────────────────────────────────────────────────────────────────────────────────┘   │  │
│   │                                                                                                    │  │
│   │   ┌──────────────────────────────────────────────────────────────────────────────────────────┐   │  │
│   │   │  Apr 1 vs SRH  │  His base: 312 pts  │  Your empty: Slot 3 (15×)  │  Missed: +4,680 pts │   │  │
│   │   └──────────────────────────────────────────────────────────────────────────────────────────┘   │  │
│   │                                                                                                    │  │
│   │   Total missed points from Jadeja: +6,384 pts                                                     │  │
│   │                                                                                                    │  │
│   └────────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                            │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### H.4 Player Performance Chart

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                            │
│   PERFORMANCE TREND                                                           View: Base Pts ▼            │
│   ═════════════════                                                                                        │
│                                                                                                            │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                                     │ │
│   │       Base Pts                                                                                      │ │
│   │       600 ┤                                              ●                                          │ │
│   │           │                                              │                                          │ │
│   │       500 ┤                     ●────────────────────────●                                          │ │
│   │           │                    ╱                                                                    │ │
│   │       400 ┤              ●────●                                           ●                         │ │
│   │           │             ╱                                                 │                         │ │
│   │       300 ┤      ●─────●                                          ●───────●                         │ │
│   │           │     ╱                                                ╱                                  │ │
│   │       200 ┤●───●                                        ●───────●                                   │ │
│   │           │                                            ╱                                            │ │
│   │       100 ┤                                     ●──────●                                            │ │
│   │           └──────────────────────────────────────────────────────────────────────────────────────   │ │
│   │             M1    M2    M3    M4    M5    M6    M7    M8    M9   M10   M11   M12                    │ │
│   │                                                                                                     │ │
│   │   ● You picked     ○ You didn't pick     (Abandoned/no-result matches excluded from chart)         │ │
│   │                                                                                                     │ │
│   │   Season Avg: 427 pts │ Your Picks Avg: 445 pts │ When Not Picked: 398 pts                         │ │
│   │                                                                                                     │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                            │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### H.5 Teams Page — Mobile View

```
┌─────────────────────────────────────────┐
│  Teams › CSK                      ← ⋮   │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  ┌──────┐                       │   │
│  │  │ CSK  │  Chennai Super Kings  │   │
│  │  │ Logo │  #2 │ 8W-4L │ +0.82  │   │
│  │  └──────┘                       │   │
│  │                                 │   │
│  │  Form: W W L W W               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  YOUR STATS WITH CSK            │   │
│  │  ───────────────────            │   │
│  │                                 │   │
│  │  Picks: 42  │  Pts: +28,400    │   │
│  │  ROI: ▲ 1.18×                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  SQUAD                          │   │
│  │  ─────                          │   │
│  │                                 │   │
│  │  ┌───────────────────────────┐ │   │
│  │  │ R. Gaikwad    │ Batter    │ │   │
│  │  │ 4,820 pts     │ ROI 1.34× │ │   │
│  │  └───────────────────────────┘ │   │
│  │                                 │   │
│  │  ┌───────────────────────────┐ │   │
│  │  │ R. Jadeja     │ All-Round │ │   │
│  │  │ 5,120 pts     │ ROI 1.56× │ │   │
│  │  └───────────────────────────┘ │   │
│  │                                 │   │
│  │  ┌───────────────────────────┐ │   │
│  │  │ D. Conway     │ Batter    │ │   │
│  │  │ 4,210 pts     │ ROI 1.12× │ │   │
│  │  └───────────────────────────┘ │   │
│  │                                 │   │
│  │         View All (16) →        │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  🏠    │    🎯    │    📊    │    👤   │
│ Home   │  Match  │  Ranks  │ Profile │
└─────────────────────────────────────────┘
```

---

### H.6 Player Page — Mobile View

```
┌─────────────────────────────────────────┐
│  Teams › CSK › R. Jadeja          ← ⋮   │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  ┌──────────┐                   │   │
│  │  │  PLAYER  │  Ravindra Jadeja  │   │
│  │  │  PHOTO   │  CSK • All-Rounder│   │
│  │  │   64px   │                   │   │
│  │  └──────────┘                   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  IPL 2024 STATS                 │   │
│  │  ──────────────                 │   │
│  │                                 │   │
│  │  BAT: 234 runs │ SR: 142.7     │   │
│  │  BOWL: 8 wkts  │ RPO: 7.82     │   │
│  │  Fantasy: 5,120 pts (#8 AR)    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  YOUR HISTORY                   │   │
│  │  ────────────                   │   │
│  │                                 │   │
│  │  Picks: 8/12  │  Pts: +18,420  │   │
│  │  Avg: +2,303  │  ROI: ▲▲ 1.56× │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  RECENT MATCHES                 │   │
│  │  ──────────────                 │   │
│  │                                 │   │
│  │  Apr 15 │ DC │ 438 pts │ ✓ +5,256│  │
│  │  Apr 12 │ RR │ 142 pts │ ✗ missed│  │
│  │  Apr 8  │ MI │ 512 pts │ ✓+10,240│  │
│  │                                 │   │
│  │         View All (12) →        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  💡 Best in Slots 1-3          │   │
│  │     (ROI 1.82× vs 0.94× in 4+) │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  🏠    │    🎯    │    📊    │    👤   │
│ Home   │  Match  │  Ranks  │ Profile │
└─────────────────────────────────────────┘
```

---

## KEY UX DECISIONS — BATCH 5

| Decision | Rationale |
|----------|-----------|
| Team pages show user's performance | Not just reference data — personalized to show ROI with team's players |
| Squad grouped by role | Batters/Bowlers/All-Rounders matches mental model |
| Player fantasy rank within role | Contextualizes player value (e.g., "#8 All-Rounder") |
| Base score formula shown | Transparency about how points are calculated — constitution-accurate |
| RPO bands explicit | ≤6→100, >6-≤8→50, >8→25 shown wherever RPO appears |
| ≥1 ball = valid participation | Clarifies no minimum threshold — prevents scoring disputes |
| Abandoned matches excluded | Not shown in tables, charts, or stats — per constitution |
| Rules snapshot per match row | Shows Mult/Neg status for each historical match |
| "Missed Opportunities" section | Retrospective learning without blame — shows empty slot cost |
| Slot distribution analysis | Reveals if user under/over-values player in certain slots |
| Performance chart with pick overlay | Visualizes whether user picks align with performance peaks |
| Insight callouts | Actionable ("Jadeja better in high slots") without overwhelming |
| Mobile: compressed stats, "View All" | Preserves core info, defers detail to full page |

---

**END OF BATCH 5**

---

*Ready for review. Upon approval, I'll proceed to Batch 6: Groups & Social.*

---

---

# IPL Fantasy Betting Game — Screen Designs

> **Batch 6 of 7** | Groups & Social

---

## SCREEN I: GROUPS

**Purpose:** Private leaderboards and social competition. Groups are the core social unit — users compete with friends, family, or colleagues.

### I.1 My Groups — Overview Page

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR        │  TOP BAR                                                                                       │
│                │  My Groups                                                      🔍    🔔 3    ❓                │
├────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
│                │                                                                                                │
│  🏠            │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│  🎯            │  │                                                                                        │   │
│  📊            │  │   MY GROUPS                                                          + Create Group   │   │
│  👥 ◀          │  │   ═════════                                                                            │   │
│  📈            │  │                                                                                        │   │
│                │  │   You are a member of 3 groups (+ Global Leaderboard)                                 │   │
│                │  │                                                                                        │   │
│                │  │   ┌─────────────────────────────────────────────────────────────────────────────────┐ │   │
│                │  │   │  ⓘ GROUP TYPES                                                                   │ │   │
│                │  │   │  • Global Leaderboard: All users are automatically part of this (cannot leave) │ │   │
│                │  │   │  • Private Groups: Require invite code or link to join                         │ │   │
│                │  │   │  • Public Groups: Discoverable by any user (if enabled by admin)               │ │   │
│                │  │   └─────────────────────────────────────────────────────────────────────────────────┘ │   │
│                │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                │                                                                                                │
│                │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│                │  │                                                                                        │   │
│                │  │   ┌────────────────────────────────────────────────────────────────────────────────┐  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │   FRIENDS LEAGUE                                                    ★ Admin   │  │   │
│                │  │   │   ════════════════                                                             │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │   8 members  │  Created: Mar 2024  │  Code: FRND-2024-XYZ                     │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │   ┌─────────────────────────────────────────────────────────────────────────┐ │  │   │
│                │  │   │   │                                                                         │ │  │   │
│                │  │   │   │   YOUR RANK: #3 of 8                          ▲ 1 from last match      │ │  │   │
│                │  │   │   │                                                                         │ │  │   │
│                │  │   │   │   Leader: RocketRaj (98,450 pts)                                       │ │  │   │
│                │  │   │   │   Your points: 1,24,850 pts                                            │ │  │   │
│                │  │   │   │   Gap to #1: 26,400 pts                                                │ │  │   │
│                │  │   │   │                                                                         │ │  │   │
│                │  │   │   └─────────────────────────────────────────────────────────────────────────┘ │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │   ┌───────────────────────┐    ┌───────────────────────┐                     │  │   │
│                │  │   │   │   View Leaderboard    │    │   Group Settings ⚙️   │                     │  │   │
│                │  │   │   └───────────────────────┘    └───────────────────────┘                     │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   └────────────────────────────────────────────────────────────────────────────────┘  │   │
│                │  │                                                                                        │   │
│                │  │   ┌────────────────────────────────────────────────────────────────────────────────┐  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │   OFFICE POOL                                                                  │  │   │
│                │  │   │   ═══════════                                                                  │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │   12 members  │  Created: Mar 2024  │  Code: OFFC-2024-ABC                    │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │   YOUR RANK: #5 of 12                          ▼ 2 from last match            │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │   Leader: BossMan (1,12,300 pts)      Gap to #1: 12,550 pts                   │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │   ┌───────────────────────┐    ┌───────────────────────┐                     │  │   │
│                │  │   │   │   View Leaderboard    │    │   Leave Group         │                     │  │   │
│                │  │   │   └───────────────────────┘    └───────────────────────┘                     │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   └────────────────────────────────────────────────────────────────────────────────┘  │   │
│                │  │                                                                                        │   │
│                │  │   ┌────────────────────────────────────────────────────────────────────────────────┐  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │   CRICKET FANATICS                                                             │  │   │
│                │  │   │   ═════════════════                                                            │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │   24 members  │  Created: Feb 2024  │  Code: CRKT-2024-FAN                    │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │   YOUR RANK: #7 of 24                          ─ 0 from last match            │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │   ┌───────────────────────┐    ┌───────────────────────┐                     │  │   │
│                │  │   │   │   View Leaderboard    │    │   Leave Group         │                     │  │   │
│                │  │   │   └───────────────────────┘    └───────────────────────┘                     │  │   │
│                │  │   │                                                                                │  │   │
│                │  │   └────────────────────────────────────────────────────────────────────────────────┘  │   │
│                │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                │                                                                                                │
│                │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│                │  │                                                                                        │   │
│                │  │   JOIN A GROUP                                                                         │   │
│                │  │   ════════════                                                                         │   │
│                │  │                                                                                        │   │
│                │  │   Have an invite code? Enter it below to join a group.                                │   │
│                │  │                                                                                        │   │
│                │  │   ┌──────────────────────────────────────────┐    ┌───────────────────┐               │   │
│                │  │   │  Enter code (e.g., FRND-2024-XYZ)       │    │   Join Group      │               │   │
│                │  │   └──────────────────────────────────────────┘    └───────────────────┘               │   │
│                │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                │                                                                                                │
└────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### I.2 Create Group Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│   CREATE A NEW GROUP                                                          ✕ Close  │
│   ══════════════════                                                                    │
│                                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                 │  │
│   │   GROUP NAME                                                                    │  │
│   │   ──────────                                                                    │  │
│   │                                                                                 │  │
│   │   ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│   │   │  Fantasy Legends                                                        │  │  │
│   │   └─────────────────────────────────────────────────────────────────────────┘  │  │
│   │                                                                                 │  │
│   │   3-30 characters, alphanumeric and spaces only                                │  │
│   │                                                                                 │  │
│   └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                 │  │
│   │   GROUP PRIVACY                                                                 │  │
│   │   ─────────────                                                                 │  │
│   │                                                                                 │  │
│   │   ○ Private (invite code only)     — Recommended for friends/family            │  │
│   │   ○ Public (anyone can join)       — Open to all users                         │  │
│   │                                                                                 │  │
│   └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                 │  │
│   │   ⓘ GROUP RULES                                                                 │  │
│   │                                                                                 │  │
│   │   • You will be the admin of this group                                        │  │
│   │   • Admins can remove members and delete the group                            │  │
│   │   • Scoring rules follow the global constitution (cannot be customized)       │  │
│   │   • All members see the same leaderboard                                       │  │
│   │                                                                                 │  │
│   │   ⚠️ ADMIN LIMITATIONS (important):                                             │  │
│   │   Group admins CANNOT:                                                         │  │
│   │   • Modify scoring, multipliers, or rules                                      │  │
│   │   • Reset or alter any member's scores                                         │  │
│   │   • Create group-specific bonuses or penalties                                 │  │
│   │   • Influence match outcomes in any way                                        │  │
│   │                                                                                 │  │
│   └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│                              ┌─────────────────────────────┐                           │
│                              │       CREATE GROUP          │                           │
│                              └─────────────────────────────┘                           │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

**Post-Creation Confirmation:**

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│   ✓ GROUP CREATED!                                                                      │
│   ════════════════                                                                      │
│                                                                                         │
│   Fantasy Legends is ready. Share the invite code with friends!                        │
│                                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                 │  │
│   │                           FLEG-2024-QRS                                        │  │
│   │                           ═════════════                                        │  │
│   │                                                                                 │  │
│   │   ┌───────────────────┐    ┌───────────────────┐    ┌───────────────────┐     │  │
│   │   │    Copy Code      │    │   Share Link      │    │  Share WhatsApp   │     │  │
│   │   └───────────────────┘    └───────────────────┘    └───────────────────┘     │  │
│   │                                                                                 │  │
│   │   Link: https://iplbets.app/join/FLEG-2024-QRS                                │  │
│   │                                                                                 │  │
│   └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│                              ┌─────────────────────────────┐                           │
│                              │     GO TO GROUP             │                           │
│                              └─────────────────────────────┘                           │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### I.3 Group Detail Page — Leaderboard

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR        │  TOP BAR                                                                                       │
│                │  My Groups › Friends League                                    🔍    🔔 3    ❓                │
├────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
│                │                                                                                                │
│                │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│                │  │                                                                                        │   │
│                │  │   FRIENDS LEAGUE                                                           ★ Admin    │   │
│                │  │   ════════════════                                                                     │   │
│                │  │                                                                                        │   │
│                │  │   8 members  │  Code: FRND-2024-XYZ  │  Created: Mar 15, 2024                         │   │
│                │  │                                                                                        │   │
│                │  │   ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐                   │   │
│                │  │   │   Invite Members  │ │   Group Settings  │ │   Group Analytics │                   │   │
│                │  │   └───────────────────┘ └───────────────────┘ └───────────────────┘                   │   │
│                │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                │                                                                                                │
│                │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│                │  │                                                                                        │   │
│                │  │   GROUP LEADERBOARD                                                                    │   │
│                │  │   ═════════════════                                                                    │   │
│                │  │                                                                                        │   │
│                │  │   ┌────────────────────────────────────────────────────────────────────────────────┐  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │  RANK │ MEMBER            │ TOTAL POINTS   │ LAST MATCH   │ TREND             │  │   │
│                │  │   │  ═════╪═══════════════════╪════════════════╪══════════════╪═══════════════════ │  │   │
│                │  │   │       │                   │                │              │                    │  │   │
│                │  │   │  🥇 1 │ RocketRaj         │   98,450 pts   │   +8,200     │ ─ 0  (leader)     │  │   │
│                │  │   │       │ ████████████████████████████████████████████████████████████████████ │  │   │
│                │  │   │       │                   │                │              │                    │  │   │
│                │  │   │  🥈 2 │ SlamDunk          │   94,200 pts   │   +6,450     │ ▲ 1               │  │   │
│                │  │   │       │ ██████████████████████████████████████████████████████████████       │  │   │
│                │  │   │       │                   │                │              │                    │  │   │
│                │  │   │ ▶ 3  │ SpiffMaster (You) │ 1,24,850 pts   │  +18,650     │ ▲ 1               │  │   │
│                │  │   │       │ ════════════════════════════════════════════════════════════════════ │  │   │
│                │  │   │       │ (highlighted row)                                                     │  │   │
│                │  │   │       │                   │                │              │                    │  │   │
│                │  │   │  🥉 4 │ CoolCricket       │   88,100 pts   │   +4,200     │ ▼ 2               │  │   │
│                │  │   │       │ ████████████████████████████████████████████████████               │  │   │
│                │  │   │       │                   │                │              │                    │  │   │
│                │  │   │    5  │ BattingBeast      │   82,400 pts   │   +5,100     │ ─ 0               │  │   │
│                │  │   │       │                   │                │              │                    │  │   │
│                │  │   │    6  │ SpinMaster        │   78,900 pts   │   +3,800     │ ▲ 1               │  │   │
│                │  │   │       │                   │                │              │                    │  │   │
│                │  │   │    7  │ PowerPlay         │   72,300 pts   │   +2,450     │ ▼ 1               │  │   │
│                │  │   │       │                   │                │              │                    │  │   │
│                │  │   │    8  │ SlowStarter       │   65,100 pts   │   +1,200     │ ─ 0               │  │   │
│                │  │   │       │                   │                │              │                    │  │   │
│                │  │   └────────────────────────────────────────────────────────────────────────────────┘  │   │
│                │  │                                                                                        │   │
│                │  │   ┌─────────────────────────────────────────────────────────────────────────────────┐ │   │
│                │  │   │  ⓘ RANKING RULES                                                                 │ │   │
│                │  │   │  • Tied scores = joint rank (next user is rank+1, no skipped ranks)            │ │   │
│                │  │   │  • Group rankings are independent of global rankings                            │ │   │
│                │  │   │  • Same scoring rules apply to all groups (per constitution)                   │ │   │
│                │  │   └─────────────────────────────────────────────────────────────────────────────────┘ │   │
│                │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                │                                                                                                │
│                │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│                │  │                                                                                        │   │
│                │  │   RECENT ACTIVITY                                                                      │   │
│                │  │   ═══════════════                                                                      │   │
│                │  │                                                                                        │   │
│                │  │   ┌────────────────────────────────────────────────────────────────────────────────┐  │   │
│                │  │   │  2h ago   │  SpiffMaster jumped from #4 to #3 after RR vs DC                  │  │   │
│                │  │   │  5h ago   │  SlamDunk overtook CoolCricket for #2                             │  │   │
│                │  │   │  1d ago   │  PowerPlay joined the group                                        │  │   │
│                │  │   │  2d ago   │  RocketRaj extended lead with +12,200 pts                          │  │   │
│                │  │   └────────────────────────────────────────────────────────────────────────────────┘  │   │
│                │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                │                                                                                                │
└────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### I.4 Group Settings (Admin View)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│   GROUP SETTINGS — FRIENDS LEAGUE                                             ✕ Close  │
│   ═══════════════════════════════                                                       │
│                                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                 │  │
│   │   GROUP INFO                                                                    │  │
│   │   ──────────                                                                    │  │
│   │                                                                                 │  │
│   │   Name:     Friends League                                         [ Edit ]   │  │
│   │   Code:     FRND-2024-XYZ                                         [ Regenerate ]│  │
│   │   Privacy:  Private                                                            │  │
│   │   Created:  Mar 15, 2024                                                       │  │
│   │                                                                                 │  │
│   └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                 │  │
│   │   INVITE LINK                                                                   │  │
│   │   ───────────                                                                   │  │
│   │                                                                                 │  │
│   │   https://iplbets.app/join/FRND-2024-XYZ                                       │  │
│   │                                                                                 │  │
│   │   ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐         │  │
│   │   │    Copy Link      │  │  Share WhatsApp   │  │   QR Code         │         │  │
│   │   └───────────────────┘  └───────────────────┘  └───────────────────┘         │  │
│   │                                                                                 │  │
│   └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                 │  │
│   │   MEMBERS (8)                                                                   │  │
│   │   ───────────                                                                   │  │
│   │                                                                                 │  │
│   │   ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│   │   │  SpiffMaster (You)     │  Admin  │  Joined Mar 15    │                   │ │  │
│   │   │  RocketRaj             │  Member │  Joined Mar 15    │  [ Remove ]       │ │  │
│   │   │  SlamDunk              │  Member │  Joined Mar 16    │  [ Remove ]       │ │  │
│   │   │  CoolCricket           │  Member │  Joined Mar 16    │  [ Remove ]       │ │  │
│   │   │  BattingBeast          │  Member │  Joined Mar 17    │  [ Remove ]       │ │  │
│   │   │  SpinMaster            │  Member │  Joined Mar 18    │  [ Remove ]       │ │  │
│   │   │  PowerPlay             │  Member │  Joined Apr 14    │  [ Remove ]       │ │  │
│   │   │  SlowStarter           │  Member │  Joined Mar 20    │  [ Remove ]       │ │  │
│   │   └──────────────────────────────────────────────────────────────────────────┘ │  │
│   │                                                                                 │  │
│   │   ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│   │   │  ⚠️ REMOVING A MEMBER:                                                   │  │  │
│   │   │  • Removes them from historical AND future group leaderboards           │  │  │
│   │   │  • Does NOT alter any other member's scores or rankings                 │  │  │
│   │   │  • Does NOT recalculate past match scores — only the view changes      │  │  │
│   │   │  • Their global points remain unaffected                                │  │  │
│   │   └─────────────────────────────────────────────────────────────────────────┘  │  │
│   │                                                                                 │  │
│   └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                 │  │
│   │   DANGER ZONE                                                                   │  │
│   │   ───────────                                                                   │  │
│   │                                                                                 │  │
│   │   ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│   │   │                                                                         │  │  │
│   │   │   Delete Group                                                          │  │  │
│   │   │                                                                         │  │  │
│   │   │   This will permanently delete "Friends League" and remove all         │  │  │
│   │   │   members. This action cannot be undone.                               │  │  │
│   │   │                                                                         │  │  │
│   │   │                    ┌─────────────────────────────┐                     │  │  │
│   │   │                    │   Delete Group (Caution)    │                     │  │  │
│   │   │                    └─────────────────────────────┘                     │  │  │
│   │   │                      red button, destructive                            │  │  │
│   │   │                                                                         │  │  │
│   │   └─────────────────────────────────────────────────────────────────────────┘  │  │
│   │                                                                                 │  │
│   └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### I.5 Group Analytics

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                            │
│   GROUP ANALYTICS — FRIENDS LEAGUE                                                                         │
│   ════════════════════════════════                                                                         │
│                                                                                                            │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                                     │ │
│   │   GROUP STATS                                                                                       │ │
│   │   ───────────                                                                                       │ │
│   │                                                                                                     │ │
│   │   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐                  │ │
│   │   │                 │ │                 │ │                 │ │                 │                  │ │
│   │   │  7,04,300       │ │    88,038       │ │      32         │ │    RocketRaj    │                  │ │
│   │   │  Total Pts      │ │  Avg / Member   │ │   Matches       │ │   Most Wins     │                  │ │
│   │   │  (all members)  │ │                 │ │   Played        │ │   (#1 finish)   │                  │ │
│   │   │                 │ │                 │ │                 │ │      12×        │                  │ │
│   │   └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘                  │ │
│   │                                                                                                     │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                            │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                                     │ │
│   │   POINTS OVER TIME (Group Comparison)                                                               │ │
│   │   ───────────────────────────────────                                                               │ │
│   │                                                                                                     │ │
│   │       Pts                                                                                           │ │
│   │   1,00,000 ┤                                                      ━━━ RocketRaj                    │ │
│   │            │                                              ●━━━━━━●                                  │ │
│   │    90,000 ┤                                       ●━━━━━━●       ●━━━━━━● SlamDunk                 │ │
│   │            │                               ●━━━━━●       ─────────────────────── SpiffMaster(You) │ │
│   │    80,000 ┤                        ●━━━━━●                                                          │ │
│   │            │                ●━━━━━●                                                                 │ │
│   │    70,000 ┤         ●━━━━●                                                                          │ │
│   │            │  ●━━━━●                                                                                │ │
│   │    60,000 ┤●                                                                                        │ │
│   │            └─────────────────────────────────────────────────────────────────────────────────────   │ │
│   │              M1   M5   M10   M15   M20   M25   M30   M32                                            │ │
│   │                                                                                                     │ │
│   │   You can compare up to 4 members. Select members above to add/remove from chart.                  │ │
│   │                                                                                                     │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                            │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                                     │ │
│   │   HEAD-TO-HEAD COMPARISON                                                                           │ │
│   │   ───────────────────────                                                                           │ │
│   │                                                                                                     │ │
│   │   Compare: [ SpiffMaster ▼ ]  vs  [ RocketRaj ▼ ]                                                  │ │
│   │                                                                                                     │ │
│   │   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐  │ │
│   │   │                                                                                             │  │ │
│   │   │   METRIC                │  SpiffMaster       │  RocketRaj         │  DIFF                  │  │ │
│   │   │   ═════════════════════╪════════════════════╪════════════════════╪════════════════════════ │  │ │
│   │   │   Total Points          │  1,24,850          │  98,450            │  You +26,400 ▲        │  │ │
│   │   │   Avg / Match           │  3,902             │  3,077             │  You +825 ▲           │  │ │
│   │   │   Best Match            │  +18,650           │  +12,200           │  You +6,450 ▲         │  │ │
│   │   │   Worst Match           │  -1,450            │  +450              │  Them better          │  │ │
│   │   │   Times #1 in Group     │  4                 │  12                │  Them +8              │  │ │
│   │   │   Side Bet Accuracy     │  67%               │  72%               │  Them +5%             │  │ │
│   │   │   Most Picked Player    │  S. Samson         │  V. Kohli          │  —                    │  │ │
│   │   │                                                                                             │  │ │
│   │   └─────────────────────────────────────────────────────────────────────────────────────────────┘  │ │
│   │                                                                                                     │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                            │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                                     │ │
│   │   MATCH-BY-MATCH GROUP RESULTS                                                                      │ │
│   │   ────────────────────────────                                                                      │ │
│   │                                                                                                     │ │
│   │   MATCH      │ #1 (Winner)    │ YOUR RANK │ YOUR PTS  │ WINNER'S PTS │ GAP                         │ │
│   │   ═══════════╪════════════════╪═══════════╪═══════════╪══════════════╪═══════════════════════════  │ │
│   │   RR vs DC   │ SpiffMaster    │    #1 🏆  │  +18,650  │   —          │   You won!                 │ │
│   │   GT vs SRH  │ RocketRaj      │    #4     │   +3,200  │   +8,400     │   -5,200                   │ │
│   │   PBKS vs LSG│ SlamDunk       │    #5     │   -1,450  │   +6,200     │   -7,650 (neg match)       │ │
│   │   KKR vs RCB │ RocketRaj      │    #2     │   +8,900  │   +9,100     │   -200                     │ │
│   │   CSK vs MI  │ CoolCricket    │    #3     │   +5,400  │   +7,800     │   -2,400                   │ │
│   │   ...        │ ...            │   ...     │   ...     │   ...        │   ...                      │ │
│   │                                                                                                     │ │
│   │   Your wins: 4 │ RocketRaj wins: 12 │ Others: 16                                                   │ │
│   │                                                                                                     │ │
│   │   ┌─────────────────────────────────────────────────────────────────────────────────────────────┐  │ │
│   │   │  ⓘ SCORING NOTES                                                                            │  │ │
│   │   │  • Negative match scores are possible when negatives are enabled for that match            │  │ │
│   │   │  • Group "wins" are based on relative performance — even if all members scored negative,  │  │ │
│   │   │    whoever had the highest (or least negative) score wins that match for the group        │  │ │
│   │   │  • A "win" with -500 pts beats a "loss" with -2,000 pts                                    │  │ │
│   │   └─────────────────────────────────────────────────────────────────────────────────────────────┘  │ │
│   │                                                                                                     │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                            │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### I.6 Join Group Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│   JOIN A GROUP                                                                          │
│   ════════════                                                                          │
│                                                                                         │
│   You've been invited to join:                                                          │
│                                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                 │  │
│   │   FANTASY LEGENDS                                                               │  │
│   │   ═══════════════                                                               │  │
│   │                                                                                 │  │
│   │   12 members  │  Code: FLEG-2024-QRS  │  Created by: CricketKing_99            │  │
│   │                                                                                 │  │
│   │   Privacy: Private (invite only)                                               │  │
│   │                                                                                 │  │
│   │   Current Leader: CricketKing_99 (1,12,400 pts)                               │  │
│   │                                                                                 │  │
│   └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                 │  │
│   │   ⓘ JOINING THIS GROUP                                                          │  │
│   │                                                                                 │  │
│   │   • Your existing global points will appear on this group's leaderboard        │  │
│   │   • You can leave the group at any time                                        │  │
│   │   • The group admin can remove members                                          │  │
│   │   • Scoring rules are the same as the global tournament                        │  │
│   │                                                                                 │  │
│   └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│             ┌───────────────────────┐    ┌───────────────────────┐                     │
│             │       Cancel          │    │     Join Group        │                     │
│             └───────────────────────┘    └───────────────────────┘                     │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### I.7 Groups — Mobile View

```
┌─────────────────────────────────────────┐
│  My Groups                    + Create  │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  FRIENDS LEAGUE         ★ Admin │   │
│  │  ─────────────────────────────  │   │
│  │                                 │   │
│  │  8 members │ Code: FRND-...    │   │
│  │                                 │   │
│  │  Your Rank: #3 of 8    ▲ 1    │   │
│  │  Leader: RocketRaj             │   │
│  │  Gap to #1: 26,400 pts        │   │
│  │                                 │   │
│  │  [ View Leaderboard → ]        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  OFFICE POOL                    │   │
│  │  ─────────────────────────────  │   │
│  │                                 │   │
│  │  12 members │ Code: OFFC-...   │   │
│  │                                 │   │
│  │  Your Rank: #5 of 12   ▼ 2    │   │
│  │  Leader: BossMan               │   │
│  │  Gap to #1: 12,550 pts        │   │
│  │                                 │   │
│  │  [ View Leaderboard → ]        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  CRICKET FANATICS               │   │
│  │  ─────────────────────────────  │   │
│  │                                 │   │
│  │  24 members │ Your Rank: #7   │   │
│  │                                 │   │
│  │  [ View Leaderboard → ]        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  JOIN A GROUP                          │
│  ┌─────────────────────────────────┐   │
│  │  Enter code...            Join │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  🏠    │    🎯    │    📊    │    👤   │
│ Home   │  Match  │  Ranks  │ Profile │
└─────────────────────────────────────────┘
```

---

### I.8 Group Leaderboard — Mobile View

```
┌─────────────────────────────────────────┐
│  ← Friends League          ⚙️ Settings │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  YOUR POSITION                  │   │
│  │  ─────────────                  │   │
│  │                                 │   │
│  │  #3 of 8             ▲ 1      │   │
│  │  Gap to #1: 26,400 pts        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🥇 RocketRaj                    │   │
│  │    98,450 pts         ─ 0     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🥈 SlamDunk                     │   │
│  │    94,200 pts         ▲ 1     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌═════════════════════════════════┐   │
│  ║ ▶ #3 SpiffMaster (You)         ║   │
│  ║    1,24,850 pts       ▲ 1     ║   │
│  └═════════════════════════════════┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🥉 CoolCricket                  │   │
│  │    88,100 pts         ▼ 2     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  5  BattingBeast                │   │
│  │     82,400 pts        ─ 0     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ... scroll for more ...               │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  📊 Group Analytics             │   │
│  │  📤 Invite Members              │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  🏠    │    🎯    │    📊    │    👤   │
│ Home   │  Match  │  Ranks  │ Profile │
└─────────────────────────────────────────┘
```

---

## KEY UX DECISIONS — BATCH 6

| Decision | Rationale |
|----------|-----------|
| Group overview shows rank + gap | Instant context without clicking into each group |
| Global Group automatic membership | Everyone competes globally by default; cannot leave |
| Public vs Private groups explicit | Clear distinction in discoverability |
| Admin limitations stated explicitly | Prevents perception of outcome manipulation |
| Invite code format (XXXX-YYYY-ZZZ) | Human-readable, easy to share verbally |
| Share options (Copy, WhatsApp, QR) | Multiple sharing paths for different contexts |
| Admin badge (★) | Clear who controls the group |
| Recent activity feed | Creates social narrative, shows movement |
| Head-to-head comparison | Direct competition visualization between friends |
| Match-by-match group results | Shows who "won" each match within the group |
| Negative match scoring explained | Clarifies relative wins even when all scores negative |
| Group ranking rules note | Clarifies tied ranks behave same as global |
| Remove member clarification | Precise explanation: view changes, no score recalculation |
| Join flow shows existing points | Clarifies you bring your global points, not start fresh |
| Terminology: "Global Points" | Consistent language throughout (not "tournament points") |
| Mobile: card-based groups | Scannable at a glance, tap to expand |

---

**END OF BATCH 6**

---

*Ready for review. Upon approval, I'll proceed to Batch 7: Admin Panel.*

---

---

# IPL Fantasy Betting Game — Screen Designs

> **Batch 7 of 7** | Admin Panel

---

## ADMIN PANEL OVERVIEW

**Purpose:** Tournament-level administration. Admins configure matches, toggle rules, manage chaos, and maintain transparency. The admin panel follows strict principles from the Design System (Section 15):

- **Muted palette** (darker base, blue accent instead of cyan)
- **No animations or glows** (serious operational context)
- **Tiered action buttons** by severity
- **Audit trail with timestamps** for every change
- **Type-to-confirm** for destructive actions
- **Read-before-write pattern** (review state before changing)

---

## CRITICAL ADMIN PRINCIPLES

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│   ADMIN POWERS & LIMITATIONS                                                            │
│   ══════════════════════════                                                            │
│                                                                                         │
│   ✓ ADMINS CAN:                          ✗ ADMINS CANNOT:                              │
│   ─────────────                          ────────────────                              │
│                                                                                         │
│   • Toggle multipliers ON/OFF            • Modify user picks after submission          │
│   • Toggle negative scoring ON/OFF       • Change runner selections                    │
│   • Set slot multiplier values           • Alter locked bets in any way               │
│   • Configure side bets for match        • Edit player stats or match outcomes        │
│   • Set checkpoint milestones            • Apply rule changes to ongoing matches      │
│   • Reveal side bets at milestones       • Apply rule changes to completed matches    │
│   • Mark matches as abandoned            • Manipulate user scores directly            │
│   • Trigger correction flow (logged)     • See user picks before lock                  │
│                                          • Grant bonuses to specific users            │
│                                          • Override constitution scoring rules         │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## RULE CHANGE SCOPE (NON-NEGOTIABLE)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│   RULE CHANGES ARE MATCH-SCOPED AND FORWARD-ONLY                                       │
│   ══════════════════════════════════════════════                                       │
│                                                                                         │
│   Any change to:                                                                        │
│   • Multipliers (ON/OFF or slot values)                                                │
│   • Runner % or max count                                                              │
│   • Side bet points                                                                    │
│   • Negative scoring toggle                                                            │
│                                                                                         │
│   Applies ONLY to matches that have NOT YET STARTED (betting not yet open).           │
│                                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                 │  │
│   │   NO RULE CHANGES CAN AFFECT:                                                   │  │
│   │                                                                                 │  │
│   │   🔴 ONGOING MATCHES — After first ball is bowled, rules are FROZEN            │  │
│   │   🔴 COMPLETED MATCHES — Historical rules are IMMUTABLE                        │  │
│   │                                                                                 │  │
│   │   This is enforced at the system level, not just policy.                       │  │
│   │                                                                                 │  │
│   └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## SCORE CORRECTION PROTOCOL (STRICT)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│   ADMINS CANNOT EDIT PLAYER STATS OR MATCH OUTCOMES DIRECTLY                           │
│   ═══════════════════════════════════════════════════════════                          │
│                                                                                         │
│   Admins may ONLY trigger a correction flow when:                                      │
│                                                                                         │
│   1. The official data source is DEMONSTRABLY WRONG                                    │
│      (e.g., scorecard error, missing catch, wrong MoM attribution)                     │
│                                                                                         │
│   2. The correction is applied via a LOGGED OVERRIDE that records:                     │
│      • Original value                                                                  │
│      • Corrected value                                                                 │
│      • Reason for correction (mandatory, min 20 characters)                           │
│      • Timestamp of correction                                                         │
│      • Admin identity                                                                  │
│      • Source of correct data (e.g., "Official IPL scorecard update")                 │
│                                                                                         │
│   3. Users CAN SEE that a correction occurred:                                         │
│      • A visible "⚠️ Corrected" flag appears on affected scores                       │
│      • Clicking the flag shows: what changed, when, why                               │
│      • This is READ-ONLY for users                                                    │
│                                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│   │  ⛔ HARD PROHIBITION                                                             │  │
│   │                                                                                 │  │
│   │  Corrections CANNOT be used to:                                                 │  │
│   │  • Favor or penalize specific users                                            │  │
│   │  • Adjust scores without official data source discrepancy                      │  │
│   │  • Override constitution-defined scoring formulas                              │  │
│   │  • Be deleted or hidden from audit trail                                       │  │
│   └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## SCALING CONTROLS — BASE VS SCALED (CLARITY)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│   WHAT ADMINS CAN AND CANNOT SCALE                                                     │
│   ════════════════════════════════                                                     │
│                                                                                         │
│   BASE PLAYER SCORING — NEVER CHANGES                                                  │
│   ─────────────────────────────────                                                    │
│   The following are ALWAYS calculated per constitution formula:                        │
│   • Runs scored (1 pt per run)                                                         │
│   • Fours (10 pts), Sixes (20 pts)                                                    │
│   • Strike Rate points                                                                 │
│   • Wickets (20 pts each)                                                             │
│   • RPO bands (≤6→100, >6-≤8→50, >8→25)                                               │
│   • Catches/Stumpings (5 pts each)                                                    │
│   • Milestones (Century +200, 5-fer +200, Hat-trick +200, MoM +200)                   │
│                                                                                         │
│   These formulas are IMMUTABLE. Admins cannot modify them.                            │
│                                                                                         │
│   ADMIN-CONTROLLED SCALING — MATCH-LEVEL ONLY                                         │
│   ────────────────────────────────────────────                                         │
│   Admins can adjust points for:                                                        │
│   • Match Result bet (e.g., 100 → 200 pts for correct pick)                           │
│   • Total Runs bet (points for accuracy bands)                                        │
│   • Side bet rewards/penalties (per side bet definition)                              │
│                                                                                         │
│   MULTIPLIERS — THE ONLY INFLATION MECHANISM                                          │
│   ───────────────────────────────────────────                                          │
│   Slot multipliers (20× down to 3×) are the ONLY mechanism that inflates              │
│   player base scores into large point totals (lakhs).                                 │
│                                                                                         │
│   Final Score = Base Score × Slot Multiplier                                          │
│                                                                                         │
│   Admins can toggle multipliers ON/OFF and adjust slot values,                        │
│   but ONLY for matches that have not yet opened for betting.                          │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## RULE VISIBILITY — MANDATORY COMMUNICATION

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│   NO SILENT RULE CHANGES — USERS MUST SEE ALL ACTIVE RULES                            │
│   ═════════════════════════════════════════════════════════                            │
│                                                                                         │
│   When an admin configures or changes:                                                 │
│   • Multipliers (ON/OFF or values)                                                    │
│   • Negative scoring toggle                                                            │
│   • Runner % or max count                                                              │
│   • Side bet count or point values                                                    │
│                                                                                         │
│   A RULE SUMMARY MUST BE PUBLISHED to users. This is ENFORCED, not optional.          │
│                                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                 │  │
│   │   RULE SUMMARY VISIBILITY (mandatory)                                           │  │
│   │                                                                                 │  │
│   │   1. BEFORE BETTING OPENS                                                       │  │
│   │      • Match card shows: "Multipliers: ON │ Negatives: OFF │ Runners: 50%"     │  │
│   │      • Expandable to see slot values and side bet count                        │  │
│   │                                                                                 │  │
│   │   2. ON BETTING PAGE                                                            │  │
│   │      • Rules banner at top of betting interface                                │  │
│   │      • Cannot be dismissed until user acknowledges                             │  │
│   │                                                                                 │  │
│   │   3. IN MATCH RULES SNAPSHOT                                                    │  │
│   │      • Collapsible panel on live scoring and analytics                         │  │
│   │      • Shows exact rules that were active for that match                       │  │
│   │                                                                                 │  │
│   │   4. IN AUDIT LOG                                                               │  │
│   │      • Every rule change logged with before/after values                       │  │
│   │                                                                                 │  │
│   └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│   ⚠️ SYSTEM ENFORCEMENT: Admin cannot save rule changes without the summary           │
│      being auto-generated and queued for display to users.                            │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## SCREEN J: ADMIN DASHBOARD

### J.1 Admin Dashboard — Full Layout

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ADMIN SIDEBAR  │  TOP BAR                                                                                       │
│ (dark: #0F0F10)│  Admin Panel                                               🔔 Alerts    👤 AdminUser          │
├────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
│                │                                                                                                │
│  📊 Dashboard◀ │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│  📅 Matches    │  │                                                                                        │   │
│  ⚙️ Rules      │  │   ADMIN DASHBOARD                                                                      │   │
│  📝 Audit Log  │  │   ═══════════════                                                                      │   │
│  👥 Users      │  │                                                                                        │   │
│                │  │   Welcome, AdminUser. You have 3 pending actions.                                     │   │
│  ────────────  │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│  QUICK STATS   │                                                                                                │
│  ───────────   │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│  47 Users      │  │                                                                                        │   │
│  32 Matches    │  │   ⚠️ PENDING ACTIONS                                                                    │   │
│  8 Groups      │  │   ══════════════════                                                                   │   │
│                │  │                                                                                        │   │
│                │  │   ┌────────────────────────────────────────────────────────────────────────────────┐  │   │
│                │  │   │  🔴 HIGH   │  Match #33 (RR vs DC) needs side bet configuration              │  │   │
│                │  │   │            │  Match starts in 4 hours                                         │  │   │
│                │  │   │            │                                           [ Configure Now → ]   │  │   │
│                │  │   └────────────────────────────────────────────────────────────────────────────────┘  │   │
│                │  │                                                                                        │   │
│                │  │   ┌────────────────────────────────────────────────────────────────────────────────┐  │   │
│                │  │   │  🟡 MEDIUM │  Match #32 (GT vs SRH) completed — enter final scores & MoM     │  │   │
│                │  │   │            │  Match ended 2 hours ago                                         │  │   │
│                │  │   │            │                                           [ Enter Scores → ]    │  │   │
│                │  │   └────────────────────────────────────────────────────────────────────────────────┘  │   │
│                │  │                                                                                        │   │
│                │  │   ┌────────────────────────────────────────────────────────────────────────────────┐  │   │
│                │  │   │  🟢 LOW    │  3 side bets pending reveal for Match #31                        │  │   │
│                │  │   │            │  Match in progress — reveal at appropriate milestones           │  │   │
│                │  │   │            │                                           [ Manage Reveals → ]  │  │   │
│                │  │   └────────────────────────────────────────────────────────────────────────────────┘  │   │
│                │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                │                                                                                                │
│                │  ┌──────────────────────────────────────────┐  ┌──────────────────────────────────────────┐   │
│                │  │                                          │  │                                          │   │
│                │  │   UPCOMING MATCHES                       │  │   RECENT ACTIVITY                        │   │
│                │  │   ═════════════════                      │  │   ═══════════════                        │   │
│                │  │                                          │  │                                          │   │
│                │  │   #33 RR vs DC     Today 7:30 PM        │  │   2m ago   You configured side bets     │   │
│                │  │       Status: ◉ Betting Open            │  │            for Match #31                 │   │
│                │  │       Rules: Configured ✓               │  │                                          │   │
│                │  │                                          │  │   15m ago  You entered final scores     │   │
│                │  │   #34 CSK vs MI    Tomorrow 7:30 PM     │  │            for Match #30                 │   │
│                │  │       Status: ○ Not Yet Open            │  │                                          │   │
│                │  │       Rules: Pending ⚠️                 │  │   1h ago   OtherAdmin toggled negatives │   │
│                │  │                                          │  │            OFF for Match #33            │   │
│                │  │   #35 KKR vs RCB   Apr 18, 3:30 PM      │  │                                          │   │
│                │  │       Status: ○ Not Yet Open            │  │   2h ago   Match #30 auto-locked        │   │
│                │  │       Rules: Pending ⚠️                 │  │            (first ball bowled)          │   │
│                │  │                                          │  │                                          │   │
│                │  │   [ View All Matches → ]                │  │   [ View Full Audit Log → ]             │   │
│                │  │                                          │  │                                          │   │
│                │  └──────────────────────────────────────────┘  └──────────────────────────────────────────┘   │
│                │                                                                                                │
└────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### J.2 Match Configuration Page

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ADMIN SIDEBAR  │  TOP BAR                                                                                       │
│                │  Admin Panel › Match #33 Configuration                         🔔 Alerts    👤 AdminUser      │
├────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
│                │                                                                                                │
│                │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│                │  │                                                                                        │   │
│                │  │   MATCH #33: RR vs DC                                                                  │   │
│                │  │   ═══════════════════                                                                  │   │
│                │  │                                                                                        │   │
│                │  │   Date: Apr 16, 2024  │  Time: 7:30 PM IST  │  Venue: Sawai Mansingh Stadium          │   │
│                │  │                                                                                        │   │
│                │  │   ┌─────────────────────────────────────────────────────────────────────────────────┐ │   │
│                │  │   │                                                                                 │ │   │
│                │  │   │   STATUS: ◉ BETTING OPEN                                                        │ │   │
│                │  │   │   Locks at: First ball (auto-lock enabled)                                     │ │   │
│                │  │   │   Time to lock: 4h 23m                                                         │ │   │
│                │  │   │                                                                                 │ │   │
│                │  │   │   ⚠️ RULE FREEZE ACTIVE: Rules for this match are now LOCKED.                  │ │   │
│                │  │   │      Changes below will apply to FUTURE matches only.                          │ │   │
│                │  │   │                                                                                 │ │   │
│                │  │   └─────────────────────────────────────────────────────────────────────────────────┘ │   │
│                │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                │                                                                                                │
│                │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│                │  │                                                                                        │   │
│                │  │   RULE CONFIGURATION (for this match — LOCKED)                                        │   │
│                │  │   ════════════════════════════════════════════                                        │   │
│                │  │                                                                                        │   │
│                │  │   ┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐  │   │
│                │  │   │                                      │  │                                      │  │   │
│                │  │   │   MULTIPLIERS                        │  │   NEGATIVE SCORING                   │  │   │
│                │  │   │   ───────────                        │  │   ────────────────                   │  │   │
│                │  │   │                                      │  │                                      │  │   │
│                │  │   │   Status: ✓ ENABLED                 │  │   Status: ✗ DISABLED                │  │   │
│                │  │   │   🔒 Locked for this match          │  │   🔒 Locked for this match          │  │   │
│                │  │   │                                      │  │                                      │  │   │
│                │  │   │   Slot 1:  20×                      │  │   When enabled, players can score   │  │   │
│                │  │   │   Slot 2:  18×                      │  │   negative points for:              │  │   │
│                │  │   │   Slot 3:  15×                      │  │   • Low strike rate                 │  │   │
│                │  │   │   Slot 4:  12×                      │  │   • High economy rate               │  │   │
│                │  │   │   Slot 5:  10×                      │  │   • Ducks                           │  │   │
│                │  │   │   Slot 6:   8×                      │  │                                      │  │   │
│                │  │   │   Slot 7:   6×                      │  │                                      │  │   │
│                │  │   │   Slot 8:   5×                      │  │                                      │  │   │
│                │  │   │   Slot 9:   4×                      │  │                                      │  │   │
│                │  │   │   Slot 10:  3×                      │  │                                      │  │   │
│                │  │   │   Slot 11:  3×                      │  │                                      │  │   │
│                │  │   │                                      │  │                                      │  │   │
│                │  │   └──────────────────────────────────────┘  └──────────────────────────────────────┘  │   │
│                │  │                                                                                        │   │
│                │  │   ┌──────────────────────────────────────┐  ┌──────────────────────────────────────┐  │   │
│                │  │   │                                      │  │                                      │  │   │
│                │  │   │   RUNNER CONFIGURATION               │  │   CHECKPOINTS                        │  │   │
│                │  │   │   ────────────────────               │  │   ───────────                        │  │   │
│                │  │   │                                      │  │                                      │  │   │
│                │  │   │   Max Runners: 2                    │  │   Checkpoints: 8 (Standard T20)     │  │   │
│                │  │   │   Transfer %: 50%                   │  │   🔒 Locked for this match          │  │   │
│                │  │   │   🔒 Locked for this match          │  │                                      │  │   │
│                │  │   │                                      │  │   1. End of PP (Inn 1)              │  │   │
│                │  │   │                                      │  │   2. End of 10 ov (Inn 1)           │  │   │
│                │  │   │                                      │  │   3. End of Inn 1                   │  │   │
│                │  │   │                                      │  │   4. End of PP (Inn 2)              │  │   │
│                │  │   │                                      │  │   5. End of 10 ov (Inn 2)           │  │   │
│                │  │   │                                      │  │   6. End of 15 ov (Inn 2)           │  │   │
│                │  │   │                                      │  │   7. End of Match                   │  │   │
│                │  │   │                                      │  │   8. MoM Award                      │  │   │
│                │  │   │                                      │  │                                      │  │   │
│                │  │   └──────────────────────────────────────┘  └──────────────────────────────────────┘  │   │
│                │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                │                                                                                                │
└────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### J.3 Side Bet Configuration

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                                │
│   SIDE BET CONFIGURATION — MATCH #33 (RR vs DC)                                                   🔒 LOCKED   │
│   ═════════════════════════════════════════════                                                                │
│                                                                                                                │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                                         │ │
│   │   ⓘ SIDE BET RULES (per constitution)                                                                   │ │
│   │                                                                                                         │ │
│   │   • Side bets are defined before the match but HIDDEN from users until revealed                        │ │
│   │   • Reveal happens at specific milestones (e.g., end of powerplay)                                     │ │
│   │   • Users answer revealed side bets during the match                                                   │ │
│   │   • Scoring: Defined per side bet (typically +100 to +200 for correct, -50 to -100 for wrong)         │ │
│   │   • No retroactive edits after reveal                                                                  │ │
│   │                                                                                                         │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                                │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                                         │ │
│   │   ⛔ SIDE BET VALIDATION RULES (HARD ENFORCEMENT)                                                       │ │
│   │                                                                                                         │ │
│   │   All side bets MUST be:                                                                               │ │
│   │   ✓ Binary (Yes/No) OR mutually exclusive options (A/B/C where only one can be true)                  │ │
│   │   ✓ Fully resolvable from official scorecard data (no subjective judgment)                            │ │
│   │   ✓ Unambiguous in wording (system will flag vague questions)                                         │ │
│   │                                                                                                         │ │
│   │   No side bet can:                                                                                     │ │
│   │   ✗ Duplicate a standard bet (e.g., "Who will win?" — already covered by Match Result bet)           │ │
│   │   ✗ Overlap with another side bet in the same match (system prevents duplicates)                     │ │
│   │   ✗ Reference data not available on official scorecard                                                │ │
│   │   ✗ Require admin interpretation to resolve (must be objectively determinable)                        │ │
│   │                                                                                                         │ │
│   │   BLOCKED QUESTION PATTERNS (auto-rejected):                                                           │ │
│   │   • "Will [Team] win?" — duplicates Match Result                                                      │ │
│   │   • "Best player of the match?" — duplicates MoM                                                      │ │
│   │   • "Will [Player] play well?" — subjective, not resolvable                                           │ │
│   │   • "Will there be controversy?" — not on scorecard                                                   │ │
│   │                                                                                                         │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                                │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                                         │ │
│   │   CONFIGURED SIDE BETS (3)                                                    [ + Add Side Bet ]       │ │
│   │   ═════════════════════════                                                   (disabled - locked)      │ │
│   │                                                                                                         │ │
│   │   ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐  │ │
│   │   │                                                                                                 │  │ │
│   │   │   SIDE BET #1                                                           Status: 🔒 Configured  │  │ │
│   │   │   ───────────                                                                                   │  │ │
│   │   │                                                                                                 │  │ │
│   │   │   Question:     "Will RR score 50+ runs in the powerplay?"                                     │  │ │
│   │   │   Type:         Binary (Yes/No) ✓                                                              │  │ │
│   │   │   Resolvable:   Scorecard powerplay total ✓                                                    │  │ │
│   │   │   Options:      Yes / No                                                                        │  │ │
│   │   │   Reveal At:    End of Powerplay (Innings 1)                                                   │  │ │
│   │   │   Scoring:      Correct: +150 pts  │  Wrong: -50 pts                                           │  │ │
│   │   │                                                                                                 │  │ │
│   │   │   [ Edit ] [ Delete ]  (disabled - match locked)                                               │  │ │
│   │   │                                                                                                 │  │ │
│   │   └─────────────────────────────────────────────────────────────────────────────────────────────────┘  │ │
│   │                                                                                                         │ │
│   │   ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐  │ │
│   │   │                                                                                                 │  │ │
│   │   │   SIDE BET #2                                                           Status: 🔒 Configured  │  │ │
│   │   │   ───────────                                                                                   │  │ │
│   │   │                                                                                                 │  │ │
│   │   │   Question:     "Will there be a Super Over?"                                                  │  │ │
│   │   │   Type:         Binary (Yes/No) ✓                                                              │  │ │
│   │   │   Resolvable:   Match result field ✓                                                           │  │ │
│   │   │   Options:      Yes / No                                                                        │  │ │
│   │   │   Reveal At:    End of Match                                                                   │  │ │
│   │   │   Scoring:      Correct: +200 pts  │  Wrong: -100 pts                                          │  │ │
│   │   │                                                                                                 │  │ │
│   │   └─────────────────────────────────────────────────────────────────────────────────────────────────┘  │ │
│   │                                                                                                         │ │
│   │   ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐  │ │
│   │   │                                                                                                 │  │ │
│   │   │   SIDE BET #3                                                           Status: 🔒 Configured  │  │ │
│   │   │   ───────────                                                                                   │  │ │
│   │   │                                                                                                 │  │ │
│   │   │   Question:     "Will the Man of the Match be from RR?"                                        │  │ │
│   │   │   Type:         Binary (Yes/No) ✓                                                              │  │ │
│   │   │   Resolvable:   MoM team field ✓                                                               │  │ │
│   │   │   Options:      Yes / No                                                                        │  │ │
│   │   │   Reveal At:    MoM Award                                                                      │  │ │
│   │   │   Scoring:      Correct: +100 pts  │  Wrong: +0 pts (neutral)                                  │  │ │
│   │   │                                                                                                 │  │ │
│   │   └─────────────────────────────────────────────────────────────────────────────────────────────────┘  │ │
│   │                                                                                                         │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                                │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### J.4 Side Bet Reveal Interface (During Match)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                                │
│   SIDE BET REVEAL — MATCH #33 (RR vs DC)                                               🔴 MATCH IN PROGRESS   │
│   ══════════════════════════════════════                                                                       │
│                                                                                                                │
│   Current Score: RR 58/1 (6.0 overs) — Powerplay just ended                                                   │
│                                                                                                                │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                                         │ │
│   │   SIDE BET #1 — READY TO REVEAL                                                                         │ │
│   │   ═════════════════════════════════                                                                     │ │
│   │                                                                                                         │ │
│   │   Question:     "Will RR score 50+ runs in the powerplay?"                                             │ │
│   │   Milestone:    End of Powerplay (Innings 1) ✓ REACHED                                                 │ │
│   │                                                                                                         │ │
│   │   Actual Result: RR scored 58/1 in powerplay                                                           │ │
│   │   Answer:        YES (50+ achieved)                                                                    │ │
│   │                                                                                                         │ │
│   │   ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐  │ │
│   │   │                                                                                                 │  │ │
│   │   │   CONFIRM REVEAL & ANSWER                                                                       │  │ │
│   │   │                                                                                                 │  │ │
│   │   │   Answer to lock in:  ● YES  ○ NO                                                              │  │ │
│   │   │                                                                                                 │  │ │
│   │   │   ⚠️ This action will:                                                                          │  │ │
│   │   │   • Reveal this side bet to all users                                                          │  │ │
│   │   │   • Lock in the answer (cannot be changed)                                                     │  │ │
│   │   │   • Score users who answered before reveal                                                     │  │ │
│   │   │                                                                                                 │  │ │
│   │   │                    ┌─────────────────────────────────┐                                         │  │ │
│   │   │                    │   REVEAL & LOCK ANSWER          │                                         │  │ │
│   │   │                    └─────────────────────────────────┘                                         │  │ │
│   │   │                           (blue, primary action)                                                │  │ │
│   │   │                                                                                                 │  │ │
│   │   └─────────────────────────────────────────────────────────────────────────────────────────────────┘  │ │
│   │                                                                                                         │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                                │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                                         │ │
│   │   SIDE BET #2 — PENDING                                          Reveals at: End of Match             │ │
│   │   SIDE BET #3 — PENDING                                          Reveals at: MoM Award               │ │
│   │                                                                                                         │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                                │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### J.5 Final Score Entry

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                                │
│   ENTER FINAL SCORES — MATCH #32 (GT vs SRH)                                          Status: MATCH COMPLETE  │
│   ══════════════════════════════════════════                                                                   │
│                                                                                                                │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                                         │ │
│   │   MATCH RESULT                                                                                          │ │
│   │   ════════════                                                                                          │ │
│   │                                                                                                         │ │
│   │   ┌────────────────────────────────────┐  ┌────────────────────────────────────┐                       │ │
│   │   │                                    │  │                                    │                       │ │
│   │   │   GUJARAT TITANS                   │  │   SUNRISERS HYDERABAD              │                       │ │
│   │   │                                    │  │                                    │                       │ │
│   │   │   Score: [ 187 ] / [ 5 ]          │  │   Score: [ 163 ] / [ 8 ]          │                       │ │
│   │   │   Overs: [ 20.0 ]                 │  │   Overs: [ 20.0 ]                 │                       │ │
│   │   │                                    │  │                                    │                       │ │
│   │   └────────────────────────────────────┘  └────────────────────────────────────┘                       │ │
│   │                                                                                                         │ │
│   │   Winner:  ● GT Won  ○ SRH Won  ○ Tie / Super Over  ○ No Result / Abandoned                           │ │
│   │   Margin:  [ by 24 runs ]                                                                              │ │
│   │                                                                                                         │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                                │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                                         │ │
│   │   MAN OF THE MATCH                                                                                      │ │
│   │   ════════════════                                                                                      │ │
│   │                                                                                                         │ │
│   │   Search Player: [ Shubman Gill                              ▼ ]                                       │ │
│   │                                                                                                         │ │
│   │   Selected: Shubman Gill (GT) — 89(52) 8×4 4×6                                                        │ │
│   │                                                                                                         │ │
│   │   ⓘ MoM bonus (+200 pts) will be awarded and multiplied by user's slot value.                          │ │
│   │                                                                                                         │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                                │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                                         │ │
│   │   PLAYER PERFORMANCES (auto-populated from data feed — verify)                                         │ │
│   │   ═══════════════════════════════════════════════════════════════                                      │ │
│   │                                                                                                         │ │
│   │   [ ] I have verified all player performances are correct                                              │ │
│   │                                                                                                         │ │
│   │   ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐ │ │
│   │   │  PLAYER           │ TEAM │ BAT             │ BOWL           │ FIELD   │ BASE PTS │ VERIFY      │ │ │
│   │   │  ═════════════════╪══════╪═════════════════╪════════════════╪═════════╪══════════╪═════════════ │ │ │
│   │   │  S. Gill          │ GT   │ 89(52) 8×4 4×6 │ —              │ 1 catch │   590    │ ✓ Correct   │ │ │
│   │   │  W. Saha          │ GT   │ 45(32) 4×4 2×6 │ —              │ 2 ct/st │   285    │ ✓ Correct   │ │ │
│   │   │  R. Tewatia       │ GT   │ 28(18) 2×4 1×6 │ 1-24 (2 ov)    │ —       │   178    │ ✓ Correct   │ │ │
│   │   │  H. Pandya        │ GT   │ 12(8)          │ 2-32 (4 ov)    │ —       │   142    │ ✓ Correct   │ │ │
│   │   │  ...              │ ...  │ ...            │ ...            │ ...     │ ...      │ ...         │ │ │
│   │   └──────────────────────────────────────────────────────────────────────────────────────────────────┘ │ │
│   │                                                                                                         │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                                │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                                         │ │
│   │   ⚠️ CONFIRMATION REQUIRED                                                                               │ │
│   │                                                                                                         │ │
│   │   This action will:                                                                                    │ │
│   │   • Finalize all player scores for this match                                                          │ │
│   │   • Calculate and apply multipliers to all user picks                                                  │ │
│   │   • Update global and group leaderboards                                                               │ │
│   │   • This cannot be undone without a formal correction process                                          │ │
│   │                                                                                                         │ │
│   │   Type "FINALIZE" to confirm: [ ______________ ]                                                       │ │
│   │                                                                                                         │ │
│   │                         ┌─────────────────────────────────┐                                            │ │
│   │                         │   FINALIZE MATCH SCORES         │                                            │ │
│   │                         └─────────────────────────────────┘                                            │ │
│   │                              (disabled until typed)                                                     │ │
│   │                                                                                                         │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                                │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### J.6 Audit Log

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ADMIN SIDEBAR  │  TOP BAR                                                                                       │
│                │  Admin Panel › Audit Log                                       🔔 Alerts    👤 AdminUser      │
├────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
│                │                                                                                                │
│  📊 Dashboard  │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│  📅 Matches    │  │                                                                                        │   │
│  ⚙️ Rules      │  │   AUDIT LOG                                                          [ Export CSV ↓ ]  │   │
│  📝 Audit Log◀ │  │   ═════════                                                                            │   │
│  👥 Users      │  │                                                                                        │   │
│                │  │   Filter: [ All Actions ▼ ]  [ All Admins ▼ ]  [ All Matches ▼ ]  [ Date Range ]      │   │
│                │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                │                                                                                                │
│                │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│                │  │                                                                                        │   │
│                │  │   ┌────────────────────────────────────────────────────────────────────────────────┐  │   │
│                │  │   │                                                                                │  │   │
│                │  │   │  TIMESTAMP          │ ADMIN       │ ACTION           │ DETAILS                │  │   │
│                │  │   │  ══════════════════╪═════════════╪══════════════════╪════════════════════════ │  │   │
│                │  │   │                    │             │                  │                         │  │   │
│                │  │   │  Apr 16, 3:45 PM   │ AdminUser   │ SIDE_BET_REVEAL  │ Match #31, Bet #1      │  │   │
│                │  │   │                    │             │                  │ Answer: YES             │  │   │
│                │  │   │                    │             │                  │ Milestone: End of PP    │  │   │
│                │  │   │                    │             │                  │                         │  │   │
│                │  │   │  Apr 16, 3:30 PM   │ SYSTEM      │ MATCH_LOCKED     │ Match #31               │  │   │
│                │  │   │                    │             │                  │ Trigger: First ball     │  │   │
│                │  │   │                    │             │                  │ Users locked: 47        │  │   │
│                │  │   │                    │             │                  │                         │  │   │
│                │  │   │  Apr 16, 2:15 PM   │ OtherAdmin  │ RULE_CHANGE      │ Match #33               │  │   │
│                │  │   │                    │             │                  │ Negatives: ON → OFF     │  │   │
│                │  │   │                    │             │                  │ (before betting open)   │  │   │
│                │  │   │                    │             │                  │                         │  │   │
│                │  │   │  Apr 16, 1:00 PM   │ AdminUser   │ MATCH_FINALIZED  │ Match #30               │  │   │
│                │  │   │                    │             │                  │ Winner: CSK             │  │   │
│                │  │   │                    │             │                  │ MoM: R. Jadeja          │  │   │
│                │  │   │                    │             │                  │ Users scored: 47        │  │   │
│                │  │   │                    │             │                  │                         │  │   │
│                │  │   │  Apr 16, 12:30 PM  │ AdminUser   │ SIDE_BET_CONFIG  │ Match #31               │  │   │
│                │  │   │                    │             │                  │ Added 3 side bets       │  │   │
│                │  │   │                    │             │                  │                         │  │   │
│                │  │   │  Apr 16, 11:00 AM  │ SYSTEM      │ BETTING_OPENED   │ Match #31               │  │   │
│                │  │   │                    │             │                  │ Rules: Mult ON, Neg OFF │  │   │
│                │  │   │                    │             │                  │ Side bets: 3            │  │   │
│                │  │   │                    │             │  (rule summary auto-published to users)   │  │   │
│                │  │   │                    │             │                  │                         │  │   │
│                │  │   │  Apr 15, 11:45 PM  │ AdminUser   │ SCORE_CORRECTION │ Match #29               │  │   │
│                │  │   │                    │             │                  │ Player: V. Kohli        │  │   │
│                │  │   │                    │             │                  │ Old: 312 → New: 318     │  │   │
│                │  │   │                    │             │                  │ Reason: "Missed catch   │  │   │
│                │  │   │                    │             │                  │  credit per official    │  │   │
│                │  │   │                    │             │                  │  IPL scorecard update"  │  │   │
│                │  │   │                    │             │                  │ Source: iplt20.com      │  │   │
│                │  │   │                    │             │                  │ User flag: ⚠️ Corrected │  │   │
│                │  │   │                    │             │                  │                         │  │   │
│                │  │   │  ...               │ ...         │ ...              │ ...                     │  │   │
│                │  │   │                    │             │                  │                         │  │   │
│                │  │   └────────────────────────────────────────────────────────────────────────────────┘  │   │
│                │  │                                                                                        │   │
│                │  │   Showing 1-20 of 1,247 entries                              ◀  1  2  3  ...  63  ▶   │   │
│                │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                │                                                                                                │
│                │  ┌────────────────────────────────────────────────────────────────────────────────────────┐   │
│                │  │                                                                                        │   │
│                │  │   ACTION TYPES LEGEND                                                                  │   │
│                │  │   ═══════════════════                                                                  │   │
│                │  │                                                                                        │   │
│                │  │   SYSTEM Actions (automatic):                                                          │   │
│                │  │   • BETTING_OPENED — Betting window opened, rule summary auto-published               │   │
│                │  │   • MATCH_LOCKED — First ball bowled, all bets locked                                 │   │
│                │  │   • CHECKPOINT_REACHED — Scoring checkpoint triggered                                  │   │
│                │  │                                                                                        │   │
│                │  │   ADMIN Actions (manual):                                                              │   │
│                │  │   • RULE_CHANGE — Multipliers, negatives, or other rule toggled (future matches only)│   │
│                │  │   • SIDE_BET_CONFIG — Side bet added, edited, or removed (before betting opens)      │   │
│                │  │   • SIDE_BET_REVEAL — Side bet revealed and answer locked                             │   │
│                │  │   • MATCH_FINALIZED — Final scores entered and locked                                 │   │
│                │  │   • SCORE_CORRECTION — Data source error correction (requires reason, source,        │   │
│                │  │                         original/corrected values; creates user-visible flag)        │   │
│                │  │   • MATCH_ABANDONED — Match marked as abandoned/no-result                             │   │
│                │  │                                                                                        │   │
│                │  └────────────────────────────────────────────────────────────────────────────────────────┘   │
│                │                                                                                                │
└────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### J.7 Future Match Rule Configuration (Before Betting Opens)

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                                │
│   CONFIGURE MATCH #34 — CSK vs MI                                                   Status: ○ NOT YET OPEN    │
│   ═══════════════════════════════                                                                              │
│                                                                                                                │
│   Date: Apr 17, 2024  │  Time: 7:30 PM IST  │  Venue: Wankhede Stadium                                        │
│   Betting opens: Apr 17, 10:00 AM (9.5 hours before match)                                                    │
│                                                                                                                │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│   │                                                                                                         │ │
│   │   ⓘ Changes made here will be LOCKED when betting opens.                                                │ │
│   │      After that point, rules cannot be modified for this match.                                        │ │
│   │                                                                                                         │ │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                                                │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                                        │  │
│   │   MULTIPLIERS                                         NEGATIVE SCORING                                 │  │
│   │   ───────────                                         ────────────────                                 │  │
│   │                                                                                                        │  │
│   │   [ ● Enabled  ○ Disabled ]                          [ ○ Enabled  ● Disabled ]                        │  │
│   │                                                                                                        │  │
│   │   Slot Values:                                        When enabled:                                    │  │
│   │   ┌─────────────────────────────────────────┐        • SR < 100 (10+ balls): -10 pts                  │  │
│   │   │  Slot 1:  [ 20 ] ×                      │        • Duck: -20 pts                                   │  │
│   │   │  Slot 2:  [ 18 ] ×                      │        • RPO > 10: -25 pts                               │  │
│   │   │  Slot 3:  [ 15 ] ×                      │                                                          │  │
│   │   │  Slot 4:  [ 12 ] ×                      │                                                          │  │
│   │   │  Slot 5:  [ 10 ] ×                      │                                                          │  │
│   │   │  Slot 6:  [  8 ] ×                      │                                                          │  │
│   │   │  Slot 7:  [  6 ] ×                      │                                                          │  │
│   │   │  Slot 8:  [  5 ] ×                      │                                                          │  │
│   │   │  Slot 9:  [  4 ] ×                      │                                                          │  │
│   │   │  Slot 10: [  3 ] ×                      │                                                          │  │
│   │   │  Slot 11: [  3 ] ×                      │                                                          │  │
│   │   └─────────────────────────────────────────┘                                                          │  │
│   │                                                                                                        │  │
│   │   [ Use Default Values ]                                                                               │  │
│   │                                                                                                        │  │
│   └────────────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                                │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                                        │  │
│   │   RUNNER CONFIGURATION                               CHECKPOINTS                                       │  │
│   │   ────────────────────                               ───────────                                       │  │
│   │                                                                                                        │  │
│   │   Max Runners: [ 2 ]                                 Format: [ Standard T20 (20 ov) ▼ ]               │  │
│   │   Transfer %:  [ 50 ] %                              Checkpoints: 8                                   │  │
│   │                                                                                                        │  │
│   │                                                      [ Customize Checkpoints ]                         │  │
│   │                                                                                                        │  │
│   └────────────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                                │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                                        │  │
│   │   SIDE BETS                                                                    [ + Add Side Bet ]     │  │
│   │   ─────────                                                                                            │  │
│   │                                                                                                        │  │
│   │   No side bets configured yet.                                                                        │  │
│   │                                                                                                        │  │
│   │   Recommended: 2-4 side bets per match                                                                │  │
│   │                                                                                                        │  │
│   └────────────────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                                │
│                              ┌─────────────────────────────┐                                                  │
│                              │     SAVE CONFIGURATION      │                                                  │
│                              └─────────────────────────────┘                                                  │
│                                                                                                                │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### J.8 Match Abandonment Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│   ⚠️ MARK MATCH AS ABANDONED — MATCH #35 (KKR vs RCB)                                   │
│   ═════════════════════════════════════════════════════                                 │
│                                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                 │  │
│   │   This match will be marked as ABANDONED / NO RESULT.                          │  │
│   │                                                                                 │  │
│   │   CONSEQUENCES (per constitution):                                             │  │
│   │                                                                                 │  │
│   │   • All user bets for this match will be VOIDED                               │  │
│   │   • No points will be awarded or deducted for any user                        │  │
│   │   • Match will not appear in user match history or analytics                  │  │
│   │   • Tournament predictions (if any) remain unaffected                         │  │
│   │   • This action is IRREVERSIBLE                                               │  │
│   │                                                                                 │  │
│   └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                 │  │
│   │   REASON FOR ABANDONMENT                                                        │  │
│   │   ──────────────────────                                                        │  │
│   │                                                                                 │  │
│   │   ○ Rain / Weather                                                             │  │
│   │   ○ Unplayable Pitch                                                           │  │
│   │   ○ Floodlight Failure                                                         │  │
│   │   ○ Security Concerns                                                          │  │
│   │   ○ Other: [ _________________________________ ]                               │  │
│   │                                                                                 │  │
│   └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                                 │  │
│   │   Type "ABANDON MATCH" to confirm: [ __________________ ]                      │  │
│   │                                                                                 │  │
│   │        ┌───────────────────────┐    ┌───────────────────────────────┐         │  │
│   │        │       Cancel          │    │   CONFIRM ABANDONMENT         │         │  │
│   │        └───────────────────────┘    └───────────────────────────────┘         │  │
│   │                                          (red, destructive)                    │  │
│   │                                          (disabled until typed)                │  │
│   │                                                                                 │  │
│   └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### J.9 Admin Mobile View

```
┌─────────────────────────────────────────┐
│  Admin Panel                      ☰    │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  ⚠️ PENDING ACTIONS (3)         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  🔴 Match #33 (RR vs DC)        │   │
│  │     Side bets need config       │   │
│  │     4h until match              │   │
│  │              [ Configure → ]    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  🟡 Match #32 (GT vs SRH)       │   │
│  │     Enter final scores          │   │
│  │     Ended 2h ago                │   │
│  │              [ Enter Scores → ] │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  🟢 Match #31 (Live)            │   │
│  │     3 side bets pending reveal  │   │
│  │              [ Manage → ]       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  RECENT ACTIVITY                       │
│  ─────────────────                     │
│                                         │
│  2m ago • Side bet revealed (#31)      │
│  15m ago • Scores entered (#30)        │
│  1h ago • Negatives toggled (#33)      │
│                                         │
│  [ View Full Audit Log → ]             │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  QUICK ACTIONS                         │
│  ─────────────                         │
│                                         │
│  [ 📅 All Matches ]                    │
│  [ ⚙️ Rule Defaults ]                  │
│  [ 📝 Audit Log ]                      │
│  [ 👥 User Management ]                │
│                                         │
├─────────────────────────────────────────┤
│  📊    │    📅    │    📝    │    ⚙️   │
│ Dash   │ Matches │   Log   │ Settings│
└─────────────────────────────────────────┘

Mobile admin limitations:
- View-only for complex configurations
- Full editing on desktop recommended
- Critical actions require desktop
```

---

## KEY UX DECISIONS — BATCH 7

| Decision | Rationale |
|----------|-----------|
| Powers & Limitations upfront | Establishes trust boundaries immediately |
| Rule changes forward-only (system-enforced) | Ongoing/completed matches are immutable |
| Base scoring is sacred | Admins control multipliers, not scoring formulas |
| Correction flow with evidence requirement | Only for demonstrable data source errors |
| Correction visibility flag for users | "⚠️ Corrected" visible, read-only, auditable |
| Side bet validation (hard enforcement) | Binary/exclusive, scorecard-resolvable, no duplicates |
| Mandatory rule visibility | Auto-published summary, no silent changes |
| Rule Freeze clearly indicated | Prevents accidental post-lock changes |
| Locked states visually distinct | 🔒 icons + disabled controls + muted colors |
| Type-to-confirm for destructive actions | Prevents accidental finalizations |
| Audit log with full details | Complete transparency, exportable |
| SYSTEM vs ADMIN actions distinguished | Shows what's automatic vs manual |
| Side bet reveal is two-step | Confirm answer before reveal |
| Abandonment consequences explicit | No surprises about voided bets |
| Mobile admin is view-heavy | Critical actions require desktop for safety |
| Muted palette throughout | Serious operational context, no playfulness |

---

## ADMIN PANEL SUMMARY

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│   WHAT ADMINS CAN DO                     │   WHAT ADMINS CANNOT DO                     │
│   ══════════════════                     │   ════════════════════                      │
│                                          │                                             │
│   Before betting opens:                  │   At any time:                              │
│   ✓ Configure multipliers (ON/OFF)      │   ✗ See user picks before lock             │
│   ✓ Set slot multiplier values          │   ✗ Modify any user's picks                │
│   ✓ Toggle negative scoring             │   ✗ Change runner selections               │
│   ✓ Set runner % and max count          │   ✗ Grant bonuses to specific users        │
│   ✓ Configure checkpoints               │   ✗ Override constitution scoring formulas │
│   ✓ Add/edit/remove side bets           │   ✗ Edit player stats directly             │
│                                          │   ✗ Change base scoring rules              │
│   During match:                          │                                             │
│   ✓ Reveal side bets at milestones      │   After betting opens (for that match):    │
│   ✓ Monitor live scoring                │   ✗ Change multipliers                     │
│                                          │   ✗ Toggle negatives                       │
│   After match:                           │   ✗ Edit side bet definitions              │
│   ✓ Enter final scores                  │   ✗ Add new side bets                      │
│   ✓ Select Man of the Match             │   ✗ Change runner %                        │
│   ✓ Mark match as abandoned             │                                             │
│   ✓ Trigger correction flow (logged)    │   After match finalized:                    │
│                                          │   ✗ Edit without correction flow           │
│                                          │   ✗ Delete or hide audit trail             │
│                                          │   ✗ Retroactively change rules             │
│                                          │   ✗ Remove correction visibility flags    │
│                                          │                                             │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## CONSTITUTIONAL GUARDRAILS SUMMARY

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│   1. RULE CHANGES ARE FORWARD-ONLY                                                     │
│      • Changes apply only to matches not yet open for betting                          │
│      • Ongoing and completed matches are IMMUTABLE                                     │
│      • System-enforced, not just policy                                                │
│                                                                                         │
│   2. BASE SCORING IS SACRED                                                            │
│      • Runs, wickets, SR, RPO bands, milestones — all per constitution               │
│      • Admins control multipliers and match-level bets, not base formulas            │
│      • Multipliers are the ONLY inflation mechanism                                   │
│                                                                                         │
│   3. CORRECTIONS REQUIRE EVIDENCE                                                      │
│      • Only when official data source is demonstrably wrong                           │
│      • Full audit: original, corrected, reason, timestamp, admin, source             │
│      • Users see "⚠️ Corrected" flag (read-only)                                      │
│                                                                                         │
│   4. SIDE BETS MUST BE UNAMBIGUOUS                                                    │
│      • Binary or mutually exclusive options only                                      │
│      • Resolvable from official scorecard data                                        │
│      • No duplicates of standard bets                                                 │
│      • System validates and blocks invalid patterns                                   │
│                                                                                         │
│   5. NO SILENT RULE CHANGES                                                           │
│      • Rule summary auto-published when admin saves config                            │
│      • Visible before betting, on betting page, in match snapshot                    │
│      • Users always know what rules apply                                             │
│                                                                                         │
│   6. FULL AUDIT TRAIL                                                                 │
│      • Every action logged with timestamp, admin, details                            │
│      • Exportable, visible to all admins                                             │
│      • Cannot be deleted or modified                                                  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

**END OF BATCH 7**

---

**END OF ALL BATCHES**

---

## COMPLETE BATCH SUMMARY

| Batch | Content | Status |
|-------|---------|--------|
| 1 | Design System | ✓ Complete |
| 2 | Authentication & Betting Day | ✓ Complete |
| 3 | Live Scoring & Leaderboards | ✓ Complete |
| 4 | User Profile & Analytics | ✓ Complete |
| 5 | Team & Player Pages | ✓ Complete |
| 6 | Groups & Social | ✓ Complete |
| 7 | Admin Panel | ✓ Complete |

All 7 batches are now complete. The design system covers the full user journey from authentication through gameplay, analytics, social features, and administration — all aligned with the constitution document.
