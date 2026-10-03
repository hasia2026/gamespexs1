# Age Verification — Legal Notes (for Steve)

*Context: the blueprint's Level 2 Gateway calls for a mandatory state-issued ID photo
upload, automatic date-of-birth extraction, and a hard 18+ lock until verified. This
document explains why that exact design is legally dangerous, and what to build instead.
Not legal advice — have an attorney confirm before launch.*

## Why "upload your ID photo to us" is the risky version

1. **Government ID is "sensitive personal data."** Nearly every U.S. state privacy law
   (California CCPA/CPRA, Virginia, Colorado, Connecticut, Texas…) puts government
   identifiers in the highest-protected tier: it requires explicit consent, honoring
   deletion requests, and disclosure of exactly how it's stored.
2. **You become a breach target.** A database containing photos of driver's licenses is
   the single most valuable thing an attacker could steal from GAMESPEXS. A breach of ID
   images = notification duties, potential fines, and a story no sponsor wants attached
   to their brand.
3. **Minors change everything.** If any data is ever collected from someone under 13,
   COPPA applies (parental consent, strict limits — realistically: don't do it at all).
   The safest design never collects a minor's data in the first place rather than
   verifying them and then excluding them.
4. **Automated DOB extraction is unreliable.** Glare, crooked photos, fake IDs. A wrong
   "verified 18+" answer for a real minor is liability; a wrong rejection of an adult is
   a lost member. In-house photo checks by Verification Specialists don't fix this —
   they just move the error to humans with no fraud tooling.
5. **Data minimization is the law.** Even with consent, you must keep the *minimum*
   data needed. That means: once DOB is verified, the ID photo's job is done — keep the
   verified flag, delete the image.

## The safe build pattern (recommended)

- **Step 1 — Attestation at signup.** The join form adds an "I am 18 or older"
  checkbox. This alone gates the free-look tour.
- **Step 2 — Vendor verification, not in-house.** For access to live games/payouts, use
  an established KYC vendor (Stripe Identity, Persona — roughly $1–2 per check). They
  handle fake-ID detection, image handling, and compliance certifications. We never
  store the photo at all; the vendor returns "verified: true + DOB".
- **Step 3 — Store only derived data.** Our database keeps a `verified_18` flag and the
  birth year. No ID images in Supabase storage, ever.
- **Step 4 — Governance.** Privacy policy page, retention schedule, and staff access
  controls: Verification Specialists see verification *status*, never raw documents.
  Every access is already covered by the platform's audit log.

### Implementation status (October 2026)

The safe pattern is now **partially implemented** in software:

- **Attestation — live.** The join form requires an "I am 18 or older" checkbox;
  signup records `attested_18` + `attested_at` on the member row (migration 0016).
- **Vendor KYC hook — wired, awaiting a vendor key.** "Verify your age with ID" on the
  member dashboard calls `/api/verification/start`. With `STRIPE_IDENTITY_SECRET_KEY`
  set it opens a Stripe Identity document-check session and returns only the session
  URL; with no vendor key it answers with a friendly "not switched on yet" message.
- **Derived flags only — enforced.** The database stores `verified_18`, `verified_at`,
  `verification_vendor`, and `verification_ref`. No ID images or dates of birth are
  ever received or stored. Until a completion webhook flips `verified_18`, members who
  have only attested show an "18+ attested" (not verified) badge.
- **Remaining before switch-on:** add the vendor key to the environment, implement the
  completion webhook that writes `verified_18` from the vendor's session result, and
  run the privacy-policy/retention review from Step 4.

## Related payroll note (the ledger helps here)

Street-team workers, judges, and interviewers who earn **$600+ in a year** require a
W-9 on file and a 1099-NEC filing. The payout ledger automatically totals each payee's
earnings, so the Payroll Specialist can see exactly who crosses the threshold — that's
one more reason the ledger exists in software instead of a spreadsheet.

## Bottom line for the blueprint

The **goal** (nobody under 18 in live games, rosters, or studies) is absolutely right
and stays. The **mechanism** (hosting ID photos ourselves) should change to
attestation + vendor verification + derived-data-only storage. Same firewall, none of
the liability.
