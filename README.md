# GAMESPEXS

> *In games you get another life, in life you get another game!!!!!*

**Game Research & Operations Platform** — the central nervous system connecting games, participants, field teams, surveys, sponsors, locations, events, equipment, research data, and institutional programs.

> New here? Read the page-by-page guide in [docs/PLATFORM_GUIDE.md](docs/PLATFORM_GUIDE.md) — or ask the in-app assistant (💬 bottom-right on every page) for a live tour.

Built on the Master Blueprint: Next.js + TypeScript + Supabase + Tailwind (Vercel-ready).

## Quick start

```bash
cd gamespexs
npm install
npm run dev          # http://localhost:3000 — demo mode with seed data
```

If local Supabase credentials are present but you still want to browse the
seeded demo, set `GAMESPEXS_DEMO_MODE=true` in `.env.local` and restart the
server. This bypass is limited to non-production runs; production always uses
Supabase authentication and live data.

### Connect the live database

1. Create a project at [supabase.com](https://supabase.com).
2. `cp .env.example .env.local` and paste your project URL + anon key.
3. In the Supabase SQL editor, run:
   - `supabase/migrations/0001_gamespexs_core.sql`
   - `supabase/migrations/0002_seed.sql`
4. Run the remaining migrations in numeric order:
   - `supabase/migrations/0003_field_ops.sql`
   - `supabase/migrations/0004_seed_phase3.sql`
   - `supabase/migrations/0005_brand_mentions.sql`
   - `supabase/migrations/0006_production_access.sql`
5. Provision each operator in Supabase Auth and create a matching active
   `public.profiles` row with the intended least-privilege role. The migrations
   do not create a default admin account.
6. Restart the server — it uses live Supabase data and requires a provisioned
   account for staff pages. Keep `.env.local` secrets private.

> Use only the Supabase project URL and publishable/anon key in `.env.local`; never put a `service_role` secret in a `NEXT_PUBLIC_` variable or commit secrets.

## What's built (Phases 1–4 foundations)

| System | Status |
|---|---|
| Command Center | ✅ Executive dashboard with live metrics |
| Game Library | ✅ Games, categories, mechanics + create forms |
| Research Engine | ✅ Studies, participants, sessions, surveys, findings, reports + create forms |
| Session Detail | ✅ Behavioral metric gauges + gaze heatmap (eye-tracking) |
| Survey Analytics | ✅ Response distribution charts per question |
| Field Operations | ✅ Fleet, routes, events, teams, equipment (Phase 3); event command center joins check-ins, staffing, equipment, sponsor activations, and research signals |
| Sponsors | ✅ Sponsors, packages, activations + printable report (Phase 4) |
| Operations Status | ✅ Channel & location summary |
| Research Integrity & Game Intelligence | ✅ Quality flags for human review and mechanic-level behavioral rollups |
| Community | ✅ Local Heroes, cities & counties coverage, partner organizations, community events |
| Sponsor Portal | ✅ Read-only partner view: own mention tally, activations, engagement-per-dollar (`/portal`) |
| Event command center | ✅ Event-flow view with explicit flags for missing age verification, match management, payouts, and media tooling |
| People | ✅ Directory by person type |
| Admin | ✅ Settings, connection status, audit log |
| Community | ✅ Local Heroes, partner orgs, community events (`/community`) |
| Institutional | ✅ Grants & programs tracking (`/institutional`) |
| Content | ✅ Media library + reader (`/content`) |
| Member Foundation | ✅ Dual pricing, Player Numbers, 1% charity ledger, 72-hour free-look consent (`/join`, `/member`) |
| Quadrant Engine | ✅ 2×2 matrix, balanced question routing, 1–5 star catalog, 14-day lockouts (`/member/play`) |
| Member Engagement | ✅ Founding-1,000 leaderboard + sponsor shout-out ticker on the member dashboard |
| Member Identity Card | ✅ Shareable PNG card — last initial in signature colors, Player Number, motto (`/member`) |
| Storefront | 🗺️ Phase 7 stub with scope card |

## The data model

The relationships that turn the blueprint into software (all in `supabase/migrations/0001_gamespexs_core.sql`):

```
Participant → Research Session → Game → Game Mechanic
                     ↓
        Survey → Questions → Responses → Metrics
                     ↓
        Findings → Reports
```

Phase 3–4 migrations extend the model:

```
Mobile Unit → Route → Stops → Locations → Events
Event → Field Teams → People · Equipment → Units
Event → Check-ins → Participants
Event → Command Center roll-up → linked field teams, event equipment, sponsor activations, and study/session signals
Session → Gaze Fixations (heatmap-ready)
Sponsor → Package → Event Sponsorship → Fee
```

Run these in the SQL editor after the core files:

- `supabase/migrations/0003_field_ops.sql`
- `supabase/migrations/0004_seed_phase3.sql`
- `supabase/migrations/0005_brand_mentions.sql`
- `supabase/migrations/0006_production_access.sql`
- `supabase/migrations/0008_sponsor_portal.sql`
- `supabase/migrations/0009_institutional_content.sql`
- `supabase/migrations/0010_member_foundation.sql`
- `supabase/migrations/0011_member_signup_trigger.sql`
- `supabase/migrations/0012_quadrant_engine.sql`
- `supabase/migrations/0013_member_dashboard_rpc.sql`

### Event operations differentiator

Open any event from **Field Operations → Events** to see its command-center flow: check-ins, team assignments, judges, event equipment, sponsor fees/mentions, linked study sessions, and consent follow-up signals. The dashboard deliberately labels age verification, tournament match/score management, payouts, and media-asset handling as **not implemented**; a birth year or research-consent flag is not an identity/age verification system.

### Research integrity & game intelligence

The Research Engine's **Integrity & Insights** view surfaces response-pattern, duplicate-code, consent, duration, and missing-metric flags for human review, plus observational mechanic-level rollups. These are review signals, not automated fraud findings or causal research conclusions.

### Writable platform

Server actions back create-forms for games, studies, participants, and sessions.
In live mode every mutation lands in the database and the audit log; in demo mode
the forms validate and report what would be written. Demo mutations are not
persisted across reloads.

### Blueprint constraints enforced in the database

- **15-question survey cap** — DB trigger, not just UI validation
- **10–12 minute survey duration** — CHECK constraint
- **Audit log** — trigger on every core table
- **RLS on every table** — policies shipped in the migration
- **Consent tracking** — timestamped on participants
- **Permanent Player Numbers** — sequence from #1001, reserved at signup, sealed at consent
- **1% charity ledger** — exactly $10.00 of every $110.00 premium bundle
- **14-day competitor lockout** — trigger on session completion, per member per quadrant
- **Quadrant-balanced routing** — `quadrant_routing_plan()` deals questions round-robin across Q1–Q4
- **Founding-1,000 scarcity** — `founding_leaderboard()` shows lowest Player Numbers + live member count
- **Sponsor shout-outs** — `sponsor_shoutouts()` aggregates brand-mention tallies for the member ticker (no raw rows exposed)
- **Guest persistence (addendum Q1)** — no time-expiry scripts; guest accounts browse freely and are excluded from paid research sessions until membership
- **Upgrade window (addendum Q2)** — guests arriving from a paid-study link (`/join?paid=1`) get the tier-choice modal: $2.25 base vs $110 premium
- **Identity masking (addendum Q2)** — custom text usernames are banned; public identity is the automated `[Last Initial] + [Color]` format (leaderboard ships no first names)
- **Dynamic signature (addendum Q3)** — the color pair is randomized on open and `🎲 Shuffle` re-rolls a fresh pair
- **Record permanence (addendum Q4)** — the pair locks to the profile only at final signature execution; active members unlock the full research path

## Production scope and remaining work

Migration `0006_production_access.sql` replaces the initial broad authenticated
policies with a role-based baseline for this single-organization deployment.
Review the policies against your actual operating model before applying it.
It does not create multi-tenant isolation or production staff accounts.

The unauthenticated survey-runner and event-check-in flows write only through
server-validated security-definer RPCs (`check_in_event`, `submit_survey_run`),
which are the sole anonymous write path — direct table writes are blocked by
RLS. Anonymous reads are scoped to event/survey content needed to render the
kiosk pages. A participant birth year or consent checkbox is not identity/age
verification or proof of compliant consent. Production launch also requires a
privacy/legal review, backups and recovery testing, monitoring, domain/Auth
configuration, and a staging deployment exercise.

## Next phases

See the application navigation and stub pages for each planned system.

## Staff & sponsor accounts

Provision the 33-person depth chart (Executive Core 3, Field Ops 10,
Data/Compliance/Research 18, Admin Core 2) with
[docs/STAFF_PROVISIONING.md](docs/STAFF_PROVISIONING.md) and
`scripts/provision-staff.mjs` (requires the service-role key; never commit it).
Sponsor contacts get the `sponsor` role plus a `profiles.sponsor_id` link and
sign in to the read-only partner portal at `/portal`.

## Branded auth emails (password reset)

The `/forgot-password` page calls `resetPasswordForEmail` with a redirect to
`/reset-password`, where the member sets a new password. There is no CLI or MCP
tool for auth email templates — this is a one-time Dashboard step:

1. Supabase Dashboard → **Authentication → Emails → "Reset Password"**.
2. Subject: `Reset your GAMESPEXS password`
3. Copy the HTML from [docs/reset-email-template.html](docs/reset-email-template.html)
   (everything between `BEGIN TEMPLATE` and `END TEMPLATE`) into the message
   body and Save. A plain-text version is included at the bottom of that file.
4. **Authentication → URL Configuration** — allow-list the reset page for every
   environment, or Supabase will refuse the redirect:
   - `https://YOUR-PRODUCTION-DOMAIN/reset-password`
   - `http://localhost:3000/reset-password`
   - `http://localhost:62169/reset-password`
   - Set **Site URL** to the production domain.
5. Test end-to-end from `/forgot-password`. The emailed link lands on
   `/reset-password?code=…`, the browser client exchanges the code, and the
   member sets a new password.

> The template's `{{ .ConfirmationURL }}` variable is required — it carries the
> single-use recovery link. For production volume, configure custom SMTP
> (Authentication → SMTP) so resets don't hit the built-in mailer's rate limits.
