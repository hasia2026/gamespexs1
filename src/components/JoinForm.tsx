"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";

const STANDARD_CENTS = 225;
const PREMIUM_CENTS = 11000;
const BOTH_CENTS = 11225; // $2.25 activation + $110 premium bundle
const CHARITY_CENTS = 1000; // exactly 1% of the premium bundle

const usd = (c: number) => `$${(c / 100).toFixed(2)}`;

export function JoinForm({ initialShowUpgrade = false }: { initialShowUpgrade?: boolean }) {
  const router = useRouter();
  const [tier, setTier] = useState<"standard" | "premium" | "both">("standard");
  // Addendum Q2 upgrade window: modal choice view triggered by a paid-study link.
  const [showUpgrade, setShowUpgrade] = useState(initialShowUpgrade);
  const [firstName, setFirstName] = useState("");
  const [lastInitial, setLastInitial] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // 18+ attestation (blueprint Level 2): required checkbox; the DB trigger records it.
  const [attested, setAttested] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError("Membership signup requires the live database.");
      return;
    }
    if (!/^[A-Za-z]$/.test(lastInitial)) {
      setError("Last initial must be a single letter.");
      return;
    }
    if (!attested) {
      setError("Please confirm you are 18 or older to continue.");
      return;
    }
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_initial: lastInitial.trim().toUpperCase(),
          tier,
          // Trigger compares this string to 'true' and stamps attested_at.
          attested_18: attested ? "true" : undefined,
        },
        emailRedirectTo: `${window.location.origin}/member`,
      },
    });

    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    router.replace("/member?welcome=1");
    router.refresh();
  }

  if (showUpgrade) {
    return (
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Choose your membership tier"
        className="rounded-xl border border-gsx-accent/30 bg-gsx-panel p-6"
      >
        <h2 className="text-lg font-semibold">Continue to the paid study</h2>
        <p className="mt-1 text-xs text-gsx-muted">
          Paid research sessions require an active membership. Choose your tier to
          unlock the full research path — your seat in the study is held while you decide.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => {
              setTier("standard");
              setShowUpgrade(false);
            }}
            className="rounded-xl border border-gsx-border p-5 text-left transition-colors hover:border-gsx-accent/40"
          >
            <div className="text-xs uppercase tracking-wider text-gsx-muted">Base · Standard</div>
            <div className="mt-1 text-2xl font-bold">{usd(STANDARD_CENTS)}</div>
            <div className="mt-1 text-xs text-gsx-muted">one-time registration activation</div>
          </button>
          <button
            type="button"
            onClick={() => {
              setTier("premium");
              setShowUpgrade(false);
            }}
            className="rounded-xl border border-gsx-border p-5 text-left transition-colors hover:border-gsx-gold/40"
          >
            <div className="text-xs uppercase tracking-wider text-gsx-muted">Premium bundle</div>
            <div className="mt-1 text-2xl font-bold text-gsx-gold">{usd(PREMIUM_CENTS)}</div>
            <div className="mt-1 text-xs text-gsx-muted">
              includes {usd(CHARITY_CENTS)} charity allocation
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setTier("both");
              setShowUpgrade(false);
            }}
            className="rounded-xl border border-gsx-border p-5 text-left transition-colors hover:border-gsx-gold/40"
          >
            <div className="text-xs uppercase tracking-wider text-gsx-muted">Both fees</div>
            <div className="mt-1 text-2xl font-bold text-gsx-gold">{usd(BOTH_CENTS)}</div>
            <div className="mt-1 text-xs text-gsx-muted">
              {usd(STANDARD_CENTS)} activation + {usd(PREMIUM_CENTS)} bundle
            </div>
          </button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-gsx-muted">Pick a tier to continue — the full form opens below.</span>
          <button
            type="button"
            onClick={() => setShowUpgrade(false)}
            className="text-sm text-gsx-muted hover:text-gsx-text"
          >
            Not now
          </button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Pricing columns (blueprint: Column A / Column B, plus the optional both-fees choice) */}
      <div className="grid gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setTier("standard")}
          className={`rounded-xl border p-5 text-left transition-colors ${
            tier === "standard"
              ? "border-gsx-accent bg-gsx-accent/10"
              : "border-gsx-border bg-gsx-panel hover:border-gsx-accent/40"
          }`}
        >
          <div className="text-xs uppercase tracking-wider text-gsx-muted">Column A · Standard</div>
          <div className="mt-1 text-3xl font-bold text-gsx-text">{usd(STANDARD_CENTS)}</div>
          <div className="mt-1 text-xs text-gsx-muted">one-time registration activation</div>
        </button>
        <button
          type="button"
          onClick={() => setTier("premium")}
          className={`rounded-xl border p-5 text-left transition-colors ${
            tier === "premium"
              ? "border-gsx-gold bg-gsx-gold/10"
              : "border-gsx-border bg-gsx-panel hover:border-gsx-gold/40"
          }`}
        >
          <div className="text-xs uppercase tracking-wider text-gsx-muted">Column B · Premium</div>
          <div className="mt-1 text-3xl font-bold text-gsx-gold">{usd(PREMIUM_CENTS)}</div>
          <div className="mt-1 text-xs text-gsx-muted">
            onboarding bundle · {usd(CHARITY_CENTS)} goes to the children&apos;s charity ledger
          </div>
        </button>
        <button
          type="button"
          onClick={() => setTier("both")}
          className={`rounded-xl border p-5 text-left transition-colors ${
            tier === "both"
              ? "border-gsx-gold bg-gsx-gold/10"
              : "border-gsx-border bg-gsx-panel hover:border-gsx-gold/40"
          }`}
        >
          <div className="text-xs uppercase tracking-wider text-gsx-muted">Both fees</div>
          <div className="mt-1 text-3xl font-bold text-gsx-gold">{usd(BOTH_CENTS)}</div>
          <div className="mt-1 text-xs text-gsx-muted">
            {usd(STANDARD_CENTS)} activation + the {usd(PREMIUM_CENTS)} bundle
          </div>
        </button>
      </div>

      {(tier === "premium" || tier === "both") && (
        <div className="rounded-lg border border-gsx-gold/30 bg-gsx-gold/5 p-3 text-xs text-gsx-gold">
          Charity allocation: exactly 1% of the bundle ({usd(CHARITY_CENTS)} of{" "}
          {usd(PREMIUM_CENTS)}) is routed to the children&apos;s charity ledger.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm sm:col-span-1">
          <span className="text-xs font-medium uppercase tracking-wider text-gsx-muted">First name</span>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="mt-1 w-full rounded border border-gsx-border bg-gsx-panel px-3 py-2 text-sm outline-none focus:border-gsx-accent/60"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-gsx-muted">Last initial</span>
          <input
            value={lastInitial}
            onChange={(e) => setLastInitial(e.target.value)}
            required
            maxLength={1}
            placeholder="J"
            className="mt-1 w-full rounded border border-gsx-border bg-gsx-panel px-3 py-2 text-sm uppercase outline-none focus:border-gsx-accent/60"
          />
        </label>
        <div className="hidden sm:block" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-gsx-muted">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded border border-gsx-border bg-gsx-panel px-3 py-2 text-sm outline-none focus:border-gsx-accent/60"
          />
        </label>
        <label className="block text-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-gsx-muted">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1 w-full rounded border border-gsx-border bg-gsx-panel px-3 py-2 text-sm outline-none focus:border-gsx-accent/60"
          />
        </label>
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-gsx-border bg-gsx-panel p-3">
        <input
          type="checkbox"
          checked={attested}
          onChange={(e) => setAttested(e.target.checked)}
          required
          className="mt-0.5 h-4 w-4 accent-[var(--color-gsx-accent,theme(colors.blue.400))]"
        />
        <span className="text-xs text-gsx-muted">
          I confirm that I am 18 years of age or older. Membership, participation in
          research sessions, and any prizes are limited to adults 18+. Identity checks
          (if requested) are handled by a third-party verification vendor — we never
          store your ID documents or date of birth.
        </span>
      </label>

      {error && <p className="text-xs text-gsx-danger">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded gsx-brand-gradient px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {busy
          ? "Creating membership…"
          : tier === "premium"
            ? `Join Premium — ${usd(PREMIUM_CENTS)}`
            : tier === "both"
              ? `Join both fees — ${usd(BOTH_CENTS)}`
              : `Join Standard — ${usd(STANDARD_CENTS)}`}
      </button>
      <p className="text-center text-[11px] text-gsx-muted">
        Demo build: payment processing is simulated. Wire Stripe (or similar) before
        charging real cards.
      </p>
    </form>
  );
}
