# GAMESPEXS Staff Provisioning Guide

Provisions the **33-person depth chart** (Jun's revised org: Executive Core 3,
Field Ops & Production 10, Data/Compliance/Research 18, Administrative Core 2)
as Supabase auth users with least-privilege platform roles.

## One-time setup

1. Get the **service role key**: Supabase Dashboard → Project Settings → API →
   `service_role` secret. It bypasses RLS — never commit it or expose it in the
   browser.
2. Open `scripts/provision-staff.mjs` and replace the placeholder names with
   the real hires (each entry has a `name` and `email`). Emails are the login.
3. Run from `gamespexs/`:

```bash
export PATH="/c/Program Files/nodejs:$PATH"   # Windows Git Bash
SUPABASE_SERVICE_ROLE_KEY=<service key> node scripts/provision-staff.mjs
```

The script is **idempotent** — re-running updates existing accounts instead of
duplicating them.

## What each role gets

| Depth-chart position | Platform role | Access |
|---|---|---|
| Principal Director & Legal Owner (Ryn James) | `executive` | Full read, studies/games writes, audit log |
| Founder & Operations Manager (Jun) | `executive` | Full read, studies/games writes, audit log |
| On-Site Technology Coordinator | `admin` | Everything incl. user/admin surfaces |
| Board/Video Game Experts, Game Author | `researcher` | Library + research writes, metrics |
| Journalist | `storefront` | Content-facing surfaces |
| Interviewer Captains (4) | `interviewer` | Sessions, participants, survey submission |
| Verification Specialists (10) | `viewer` | Read-only operational data |
| Payroll Specialist | `executive` | Full read + financial surfaces |
| DJs / Emcees (2) | `field_operator` | Events, routes, check-ins, equipment |
| Game Judges (4) | `judge` | Events, check-ins, team rosters |
| Camera Operators (2) | `field_operator` | Events, routes, check-ins, equipment |
| Media Editors (2) | `storefront` | Content-facing surfaces |
| Short-Term Graphic Designer (contract) | `storefront` | Content-facing surfaces |

Role → table permissions are enforced in the database
(`0006_production_access.sql`), not just in the UI.

## First login

- URL: `/login` (or the deployed domain)
- Initial password: `Gsx!Onboard-2026`
- Each account should change its password after first sign-in
  (Supabase Dashboard → Authentication → Users → ⋯ → Send password recovery,
  or the user requests a reset from the login screen once SMTP is configured).

## Sponsor contacts (separate flow)

Sponsor partners are **not** on the staff roster. To give a sponsor contact
portal access:

1. Create the auth user (Dashboard → Authentication → Add user, or the same
   script with role `sponsor`).
2. Link them to their sponsor record:

```sql
update public.profiles
set role = 'sponsor',
    sponsor_id = (select id from public.sponsors where name = 'Buckeye Family Fun Centers')
where email = 'rita@bffcenters.example';
```

They sign in and land on `/portal` — a read-only view of their own mention
tally, activations, and engagement-per-dollar. Staff roles cannot see the
portal; sponsor accounts are redirected away from the Command Center.
