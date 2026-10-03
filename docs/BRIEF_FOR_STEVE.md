# Brief for Steve — platform status, domain, and the revised org

*From Jun · after deploying the GAMESPEXS platform to production*

---

## 1. The domain (gamespexs.com) — keep it, point it

The Wix purchase doesn't lock us in; a domain is just a name. The platform
now lives on Vercel (auto-deploys from GitHub on every change). To move:

1. Vercel → Settings → Domains → add `gamespexs.com` + `www.gamespexs.com`.
2. Wix → Domains → DNS: point the **A record (@)** to `76.76.21.21` and the
   **CNAME (www)** to `cname.vercel-dns.com`. ~15 minutes, SSL automatic.
3. I then update Supabase auth (Site URL + reset-link redirects) so emails
   use the pretty domain.

**Heads-up:** anything still live on the Wix site goes dark once we point
the domain — confirm nothing critical is hosted there before we flip it.

## 2. My role: Founder & Platform Lead

The "Website & Programming Coordinator (Wix architecture)" seat on the chart
is filled — by me. The platform is built and running (Next.js + Supabase,
the stack that replaced Wix). I also cover ongoing development with AI
engineering tools, which is why the chart shrinks below. No hire needed.

## 3. The revised chart: 30 → ~10 ongoing, thanks to the platform

| Chart position | Recommendation |
|---|---|
| Website & Programming Coordinator | **Eliminate** — platform is built; I maintain it |
| On-Site Technology Coordinator | **Reframe** — "local servers" don't exist; becomes event AV/equipment (dual-hat with Camera Lead) |
| Board + Video Game Experts | **Merge to 1** Catalog & Trends Editor (in-platform catalog makes this part-time) |
| Journalist + Game Author | **Merge to 1** Content Lead (articles + survey copy) |
| 8× Verification Specialists | **1–2 part-time** — the platform auto-flags integrity/consent issues; scale with volume |
| Payroll Specialist | **Contract bookkeeper** — once the payout ledger automates splits |
| 2× Media Editors | **1** (contract, per sponsor package) |
| Lead Coordinator, Interviewer Captains, Judges, DJs, Camera | **Keep** — human work; judges/interviewers are per-event 1099s per the blueprint |

Net: roughly **8–10 ongoing people plus per-event crew** instead of 30 —
on the order of $150–250k/year of planned payroll removed.

## 4. What the platform already enforces (DB-level, not just screens)

$2.25 / $110 pricing with exactly $10 to charity · optional both-fees choice
($112.25) left open per your ask — choices counted on the Command Center ·
permanent Player Numbers
from #1001 · 1,000-member founding scarcity · identity masking (last initial
+ colors only, everywhere public) · open-ended free look (no countdown —
your call) + permanent consent signature · quadrant-balanced question routing
with 14-day lockouts · brand-permission policy · full audit log of every write.

## 5. Blueprint items still unbuilt (roadmap, in order of value)

1. ~~Payout ledger~~ — **built and verified (Oct 2026)**: the ⅓–⅓–⅓ study
   split, judge percentages, and street-team commissions (50¢/75¢/$1+comm)
   are automatic, auditable, and admin-only, at /admin/payouts.
2. **Corporate packages** — $333/10 and $3,330/100 purchase flow.
3. **Street-team attribution** — the ledger records commissions; the
   attribution/claim flow for workers is the remaining piece.

## 6. One compliance caution (protects us both)

"Age firewall auditing" by staff is not legal age verification — that
requires a real verification service and, for minors, parental consent. The
platform deliberately labels this not-implemented. Before we sell
verified-age research data to sponsors, this needs a legal review.

## 7. What members see vs. what only you see

The platform has two faces, and members only ever meet one of them.

**Members see one page.** Sign in as `member.demo@gamespexs.com` /
`Gsx!Member-2026` and you're looking at the *entire* member experience: the
Player Number, the free-look tour, lock-in, signature colors, the member
card, and rating games. Deliberately simple and phone-shaped — no menus,
no dashboards, nothing to learn.

**Everything else is back office — yours.** Sign in as
`admin@gamespexs.com` / `Gsx!Admin-2026` and you get the Command Center:
research engine, sessions and findings, field ops (the mobile unit), the
game library, sponsors, people, the payouts ledger, and the audit log.
Members can't reach any of it — the tools are gated by login role, and a
member who stumbles onto an admin URL sees a "restricted" message, not the
tools.

**Why it's built this way:** the blueprint is a business plan, not an app
screen list. Its 36 sections describe how GAMESPEXS *operates* — studies,
interviews, judges, street teams, payroll. Members participate; they don't
operate. It's a restaurant: members get the dining room, you get the
kitchen, the office, and the books — and the books are the payout ledger.

**60-second demo for anyone who asks:** sign in as the demo member → show
the one page → sign out → sign in as admin → let the sidebar load → "this
half is ours."

## 8. Value notes — before removing anything

Some items on the October directive list would remove things that are
already built, working, and saving money. Before deleting them, here's what
each one does in plain terms:

**The automatic money splitter (Payouts Ledger).** When a research package
sells — say $333 — the platform splits it three ways instantly: $111 to the
participant side, $111 to the interviewer, $111 stays with the company. It
also records judge percentages and street-team commissions. **The value:**
nobody has to do this math in a spreadsheet ever again, and it never makes
a math mistake. It keeps a permanent receipt for every dollar, and it
totals each person's yearly earnings and flags anyone who crosses **$600**
— that's the IRS line where we must collect a W-9 and file a 1099 form.
Missing that means penalties. The splitter is already built and costs $0 a
month to run (it lives in the database we already pay for). Removing it
doesn't remove the work — the splits and the $600 rule still have to
happen; we'd just be doing them slower, by hand, with more mistakes. If the
concern is control: we can make every payout wait for a manual "approve"
click — the receipts stay, but nothing moves until you say so.

**QR check-in at events.** A person walks up, scans the code with their
phone, and they're checked in — two seconds, no staff member typing names.
Every scan is logged, so attendance counts are exact and sponsors can trust
the numbers. **The value:** shorter lines at the door, no spelling errors,
and accurate attendance the sponsors pay for. Removing it means typing every
attendee in by hand. (If the concern is phones at the door: staff can keep
the scanner and attendees never touch their phones — same accurate numbers.)

**Survey tablet rules — built, not removed.** The evaluation screens now
follow the directive: the post-game questions display first, the
play-frequency question comes last, question 8 is the favorite-sports-team
field, text shows fully and can't be skipped or auto-filled, and everything
sits in a strict 2×2 quadrant grid made for tablets.
