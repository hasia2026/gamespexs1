# GAMESPEXS Platform Guide — every page, what it does, and why it matters

> The 💬 assistant (bottom-right on every page) can give you a live version of
> this tour — ask it about any page. This document is the full reference.

Roles: **Members** (the researched audience), **Staff** (operations & research),
**Sponsors** (paying partners, read-only). Where you land after login depends
on your account type: members → `/member`, staff → Command Center, sponsors →
`/portal`.

---

## The member experience

### `/join` — Become a member
- **What:** The signup gate. Two mandatory paths: **$2.25 standard** or the
  **$110 premium bundle** (exactly $10 goes to charity). A permanent
  **Player Number** (starting at #1001) is reserved the moment you join.
- **How:** Fill name/email/password, pick a tier, consent. Guests arriving from
  a paid-study link (`/join?paid=1`) see the tier-choice upgrade modal.
- **Why:** This is the blueprint's membership economy in one page — pricing,
  charity ledger, and the Player Number that follows you forever.

### `/login`, `/forgot-password`, `/reset-password` — Account access
- **What:** Sign-in for everyone; self-serve password recovery via a branded
  email that lands on the reset page.
- **Why:** Role-based routing keeps members, staff, and sponsors in their own
  lane automatically.

### `/member` — Member home (the heart of the member app)
- **What:** Your identity card (name, permanent Player Number, tier,
  paid-to-date), your **signature identity** (two locked colors + last
  initial), a downloadable **shareable member card** (PNG), the live
  **Founding-1,000 leaderboard** (masked to initials — no first names, ever),
  the sponsor **shout-out ticker**, and — before you lock — the 72-hour
  free-look countdown.
- **How:** While in free-look you can browse and sample questions. Locking
  runs the three-step consent: pick color 1 → pick color 2 → sign the canvas.
  The pair is permanent (addendum Q4) and Sign out lives top-right.
- **Why:** This page *is* the member contract: scarcity (first 1,000, forever),
  permanence, identity masking, and the 1% charity promise — all enforced by
  the database, not just the screen.

### `/member/play` — The quadrant matrix
- **What:** A 2×2 catalog of games. Members rate titles 1–5 stars and answer
  survey questions dealt round-robin across all four quadrants.
- **How:** Open a game, rate it, answer the pop-up questions. Completing a
  quadrant session starts a **14-day lockout** on that quadrant's competitors —
  honest answers today, fresh comparisons later.
- **Why:** This is where research data comes from: balanced routing prevents
  bias, and lockouts prevent rating fatigue.

### Public kiosk pages (no login, by design)
- `/checkin/[eventId]` — QR/walk-up event check-in. Writes only through a
  security-definer RPC; the data lands in the event command center.
- `/research/sessions/[id]/run` — the unauthenticated survey runner used at
  events. Same strict rule: validated RPC writes only, nothing else exposed.

---

## The staff console (after admin/staff login)

### `/*` Command Center (Executive Dashboard)
- **What:** The pulse: active studies, participants, sessions, survey
  responses, captured metrics — plus recent sessions, active studies, library
  stats, and latest findings.
- **How:** Read it every morning; every card links deeper.
- **Why:** One screen answers "is the machine running?"

### `/operations` — Operations Status
- **What:** Channel & location summary of where work happens.
- **Why:** Capacity planning for mobile units and venues.

### `/games`, `/games/categories`, `/games/mechanics` — Game Library
- **What:** The full game catalog plus its taxonomy: categories (board, video,
  …) and mechanics (the *why it's fun* tags). Create forms on every page.
- **Why:** The quadrant engine and mechanic insights are computed **from this
  catalog** — garbage in, garbage insights out. Keep it current.

### `/research` — Research Engine hub
- `/research/studies` — define studies (the research question, status, linked
  surveys). Everything else hangs off a study.
- `/research/participants` — the people pool with consent timestamps.
- `/research/sessions` — every research session; open one for behavioral
  metric gauges and the gaze heatmap (eye-tracking data).
- `/research/surveys` — survey definitions (capped at 15 questions, 10–12
  minute duration — enforced by DB triggers) with per-question response
  distribution charts.
- `/research/mechanics` — mechanic-level behavioral rollups across games.
- `/research/quality` — response-pattern and duplicate-code flags **for human
  review** (signals, not verdicts).
- `/research/findings` — findings and published reports, readable at
  `/content/[id]`.
- `/research/integrity` — consent, duration, and duplication audit view.
- **Why:** This is the research product sponsors ultimately pay for.

### `/field` — Field Operations (5 tabs)
- **Fleet / Routes / Events / Teams / Equipment:** the physical layer — mobile
  units, their routes and stops, events, staffing, and gear.
- **Event command center** (`/field/events/[eventId]`): check-ins, team
  assignments, judges, equipment, sponsor activations, and linked research
  signals for ONE event. Missing age verification, match management, payouts,
  and media tooling are **explicitly labeled not implemented** — a birth year
  is not identity verification.
- `/field/qr/[eventId]` — printable QR poster that opens the check-in kiosk.
- **Why:** Events are where members, judges, sponsors, and research meet.

### `/sponsors` + `/sponsors/report` — Revenue side
- **What:** Sponsors, their packages, activations at events, and a printable
  engagement report.
- **Why:** Sponsorship is a core revenue line; this is how you sell and report it.

### `/community`, `/institutional`, `/content`, `/people`
- **Community:** Local Heroes, partner organizations, community events — the
  goodwill network.
- **Institutional:** grants & programs tracking.
- **Content:** media library + markdown reader (findings, guides, articles).
- **People:** directory of everyone, by person type.
- **Why:** The relationship layers around the core product.

### `/admin` + `/admin/audit` — Settings & accountability
- **What:** System settings and connection status; the audit log records every
  write to core tables, timestamped, trigger-enforced.
- **Why:** The blueprint's "every action leaves a trace" rule lives here.

### `/storefront` — Phase 7 stub
- Scope card only. Merchandise + the street-team commission engine is the
  natural first build here.

### `/portal` — Sponsor portal (sponsor login)
- **What:** A sponsor sees only their own mention tallies, activations, and
  engagement-per-dollar. Read-only by RLS — sponsors cannot see each other.
- **Why:** Sponsors self-serve their ROI; staff never hand-build reports.

---

## The five blueprint promises (all DB-enforced, not just UI)

1. **Permanent Player Numbers** — sequence from #1001, sealed at consent.
2. **1% charity ledger** — exactly $10.00 of every $110 bundle.
3. **Identity masking** — public identity is `[Last Initial] + [Colors]` only.
4. **Founding-1,000 scarcity** — live member count vs. capacity on `/member`.
5. **Quadrant integrity** — balanced routing + 14-day lockouts.
