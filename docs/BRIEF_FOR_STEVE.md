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

$2.25 / $110 pricing with exactly $10 to charity · permanent Player Numbers
from #1001 · 1,000-member founding scarcity · identity masking (last initial
+ colors only, everywhere public) · 72-hour free look + permanent consent
signature · quadrant-balanced question routing with 14-day lockouts ·
brand-permission policy · full audit log of every write.

## 5. Blueprint items still unbuilt (roadmap, in order of value)

1. **Payout ledger** — makes the ⅓–⅓–⅓ split, judge percentages, and
   street-team commissions automatic and auditable.
2. **Corporate packages** — $333/10 and $3,330/100 purchase flow.
3. **Street-team attribution** — 50¢/card → 75¢/click → $1+commission tracking.

## 6. One compliance caution (protects us both)

"Age firewall auditing" by staff is not legal age verification — that
requires a real verification service and, for minors, parental consent. The
platform deliberately labels this not-implemented. Before we sell
verified-age research data to sponsors, this needs a legal review.
