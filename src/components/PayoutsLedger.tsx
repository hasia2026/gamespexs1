"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Payouts Ledger — the staff money desk. Automates the blueprint's fixed
 * splits (⅓-⅓-⅓ studies, judge %, street-team commissions) and tracks
 * computed → paid. All math happens in database RPCs; this UI never
 * hand-types an amount the ledger is meant to compute.
 */

interface KindRow {
  kind: string;
  entries: number;
  gross_cents: number;
  participant_cents: number;
  interviewer_cents: number;
  judge_cents: number;
  platform_cents: number;
  amount_cents: number;
  paid_count: number;
}

interface LedgerRow {
  id: string;
  kind: string;
  status: string;
  payee_label: string | null;
  gross_cents: number;
  participant_cents: number;
  interviewer_cents: number;
  judge_cents: number;
  platform_cents: number;
  amount_cents: number;
  note: string | null;
  created_at: string;
}

export interface LedgerOverview {
  by_kind: KindRow[];
  recent: LedgerRow[];
}

const KIND_LABEL: Record<string, string> = {
  study_split: "Study split (⅓ / ⅓ / ⅓)",
  session_judge: "Judge session %",
  street_team_card: "Street team — cards",
  street_team_click: "Street team — clicks",
  street_team_sale: "Street team — sales",
  charity_allocation: "Charity allocation",
  adjustment: "Adjustment",
};

const usd = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

const field =
  "w-full rounded border border-gsx-border bg-gsx-bg px-3 py-2 text-sm outline-none focus:border-gsx-accent/60";

export default function PayoutsLedger({ initial }: { initial: LedgerOverview }) {
  const [overview, setOverview] = useState<LedgerOverview>(initial);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Form state — money is typed in dollars, stored as cents.
  const [splitGross, setSplitGross] = useState("");
  const [splitNote, setSplitNote] = useState("");
  const [judgeSession, setJudgeSession] = useState("");
  const [judgeGross, setJudgeGross] = useState("");
  const [judgePct, setJudgePct] = useState("10");
  const [stKind, setStKind] = useState<"card" | "click" | "sale">("card");
  const [stQty, setStQty] = useState("1");
  const [stPayee, setStPayee] = useState("");
  const [stSale, setStSale] = useState("");
  const [stPct, setStPct] = useState("10");

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("ledger_overview");
    if (!error && data) setOverview(data as LedgerOverview);
  }, []);

  async function run(fn: () => Promise<string | null>, okMsg: string) {
    setBusy(true);
    setError(null);
    setFlash(null);
    const err = await fn();
    if (err) setError(err);
    else {
      setFlash(okMsg);
      await refresh();
    }
    setBusy(false);
  }

  const toCents = (v: string) => Math.round(parseFloat(v) * 100) || 0;

  const recordSplit = () =>
    run(async () => {
      const gross = toCents(splitGross);
      if (gross <= 0) return "Enter a gross amount greater than zero.";
      const supabase = createClient();
      const { error } = await supabase.rpc("ledger_record_study_split", {
        p_gross_cents: gross,
        p_note: splitNote || null,
      });
      if (!error) {
        setSplitGross("");
        setSplitNote("");
      }
      return error?.message ?? null;
    }, "Study split recorded — three even shares computed.");

  const recordJudge = () =>
    run(async () => {
      const gross = toCents(judgeGross);
      if (gross <= 0) return "Enter a session gross greater than zero.";
      const pct = parseFloat(judgePct);
      if (!pct || pct < 0 || pct > 100) return "Judge percentage must be 0–100.";
      const supabase = createClient();
      const { error } = await supabase.rpc("ledger_record_judge_payout", {
        p_session_id: judgeSession.trim() || null,
        p_gross_cents: gross,
        p_judge_pct: pct,
      });
      if (!error) {
        setJudgeSession("");
        setJudgeGross("");
      }
      return error?.message ?? null;
    }, "Judge payout recorded — percentage share computed.");

  const recordStreetTeam = () =>
    run(async () => {
      const qty = parseInt(stQty, 10);
      if (!qty || qty < 1) return "Quantity must be at least 1.";
      const supabase = createClient();
      const { error } = await supabase.rpc("ledger_record_street_team", {
        p_kind: stKind,
        p_quantity: qty,
        p_payee_label: stPayee || null,
        p_sale_cents: stKind === "sale" ? toCents(stSale) : 0,
        p_commission_pct: stKind === "sale" ? parseFloat(stPct) || 10 : 10,
      });
      if (!error) {
        setStQty("1");
        setStSale("");
      }
      return error?.message ?? null;
    }, "Street-team commission recorded at the blueprint rate.");

  async function markPaid(id: string) {
    await run(async () => {
      const supabase = createClient();
      const { error, data } = await supabase.rpc("ledger_mark_paid", { p_ids: [id] });
      return error?.message ?? null;
    }, "Marked paid.");
  }

  const totals = overview.by_kind.reduce(
    (acc, k) => ({
      gross: acc.gross + k.gross_cents,
      participant: acc.participant + k.participant_cents,
      interviewer: acc.interviewer + k.interviewer_cents,
      judge: acc.judge + k.judge_cents,
      platform: acc.platform + k.platform_cents,
      amount: acc.amount + k.amount_cents,
      pending: acc.pending + (k.entries - k.paid_count),
    }),
    { gross: 0, participant: 0, interviewer: 0, judge: 0, platform: 0, amount: 0, pending: 0 },
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-gsx-danger/40 bg-gsx-danger/10 px-4 py-3 text-sm text-gsx-danger">{error}</div>
      )}
      {flash && (
        <div className="rounded-lg border border-gsx-accent/40 bg-gsx-accent/10 px-4 py-3 text-sm text-gsx-accent">{flash}</div>
      )}

      {/* CSV export — per-payee totals with the $600 W-9 / 1099-NEC flag. */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gsx-border bg-gsx-panel px-4 py-3">
        <div>
          <div className="text-sm font-semibold">Accountant export</div>
          <div className="text-xs text-gsx-muted">
            Totals by payee, full transaction detail, and a W9_REQUIRED flag for anyone over $600 / year (1099-NEC).
          </div>
        </div>
        <a
          href="/api/admin/payouts/export"
          className="rounded border border-gsx-border bg-gsx-panel-2 px-3 py-1.5 text-sm text-gsx-accent hover:border-gsx-accent/40"
        >
          ↓ Export CSV
        </a>
      </div>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-gsx-border bg-gsx-panel p-4">
          <div className="text-xs uppercase tracking-wider text-gsx-muted">Total gross recorded</div>
          <div className="mt-1 text-2xl font-bold tabular-nums">{usd(totals.gross)}</div>
        </div>
        <div className="rounded-xl border border-gsx-border bg-gsx-panel p-4">
          <div className="text-xs uppercase tracking-wider text-gsx-muted">Owed to participants</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-gsx-accent">{usd(totals.participant)}</div>
        </div>
        <div className="rounded-xl border border-gsx-border bg-gsx-panel p-4">
          <div className="text-xs uppercase tracking-wider text-gsx-muted">Owed to contractors</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-gsx-gold">
            {usd(totals.interviewer + totals.judge + totals.amount)}
          </div>
        </div>
        <div className="rounded-xl border border-gsx-border bg-gsx-panel p-4">
          <div className="text-xs uppercase tracking-wider text-gsx-muted">Awaiting payout</div>
          <div className="mt-1 text-2xl font-bold tabular-nums">{totals.pending}</div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <form
          onSubmit={(e) => { e.preventDefault(); recordSplit(); }}
          className="space-y-3 rounded-xl border border-gsx-border bg-gsx-panel p-4"
        >
          <h3 className="text-sm font-semibold">Study split — ⅓ / ⅓ / ⅓</h3>
          <p className="text-xs text-gsx-muted">Blueprint rule: participant / interviewer / platform, remainder cents to platform.</p>
          <input className={field} inputMode="decimal" placeholder="Gross amount ($)" value={splitGross} onChange={(e) => setSplitGross(e.target.value)} />
          <input className={field} placeholder="Note (study or package reference)" value={splitNote} onChange={(e) => setSplitNote(e.target.value)} />
          <button type="submit" disabled={busy} className="w-full rounded gsx-brand-gradient px-3 py-2 text-sm font-semibold disabled:opacity-40">Record split</button>
        </form>

        <form
          onSubmit={(e) => { e.preventDefault(); recordJudge(); }}
          className="space-y-3 rounded-xl border border-gsx-border bg-gsx-panel p-4"
        >
          <h3 className="text-sm font-semibold">Judge payout — session %</h3>
          <p className="text-xs text-gsx-muted">Flat percentage of a live session transaction, per the blueprint.</p>
          <input className={field} placeholder="Session UUID (optional)" value={judgeSession} onChange={(e) => setJudgeSession(e.target.value)} />
          <input className={field} inputMode="decimal" placeholder="Session gross ($)" value={judgeGross} onChange={(e) => setJudgeGross(e.target.value)} />
          <input className={field} inputMode="decimal" placeholder="Judge % (default 10)" value={judgePct} onChange={(e) => setJudgePct(e.target.value)} />
          <button type="submit" disabled={busy} className="w-full rounded gsx-brand-gradient px-3 py-2 text-sm font-semibold disabled:opacity-40">Record judge payout</button>
        </form>

        <form
          onSubmit={(e) => { e.preventDefault(); recordStreetTeam(); }}
          className="space-y-3 rounded-xl border border-gsx-border bg-gsx-panel p-4"
        >
          <h3 className="text-sm font-semibold">Street-team commission</h3>
          <p className="text-xs text-gsx-muted">50¢ / card · 75¢ / click · $1 + commission / sale.</p>
          <select className={field} value={stKind} onChange={(e) => setStKind(e.target.value as "card" | "click" | "sale")}>
            <option value="card">Business cards</option>
            <option value="click">Page clicks</option>
            <option value="sale">Merch sales</option>
          </select>
          <input className={field} inputMode="numeric" placeholder="Quantity" value={stQty} onChange={(e) => setStQty(e.target.value)} />
          <input className={field} placeholder="Worker name / label" value={stPayee} onChange={(e) => setStPayee(e.target.value)} />
          {stKind === "sale" && (
            <div className="flex gap-2">
              <input className={field} inputMode="decimal" placeholder="Sale total ($)" value={stSale} onChange={(e) => setStSale(e.target.value)} />
              <input className={`${field} w-24`} inputMode="decimal" placeholder="Comm. %" value={stPct} onChange={(e) => setStPct(e.target.value)} />
            </div>
          )}
          <button type="submit" disabled={busy} className="w-full rounded gsx-brand-gradient px-3 py-2 text-sm font-semibold disabled:opacity-40">Record commission</button>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-gsx-border bg-gsx-panel">
        <div className="border-b border-gsx-border px-4 py-3">
          <h3 className="text-sm font-semibold">Ledger entries (latest 40)</h3>
        </div>
        {overview.recent.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gsx-muted">
            No entries yet — record the first study split, judge payout, or street-team commission above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gsx-border text-xs uppercase tracking-wider text-gsx-muted">
                <tr>
                  <th className="px-4 py-2">When</th>
                  <th className="px-4 py-2">Kind</th>
                  <th className="px-4 py-2">Payee / note</th>
                  <th className="px-4 py-2 text-right">Gross</th>
                  <th className="px-4 py-2 text-right">Participant</th>
                  <th className="px-4 py-2 text-right">Interviewer</th>
                  <th className="px-4 py-2 text-right">Judge</th>
                  <th className="px-4 py-2 text-right">Platform</th>
                  <th className="px-4 py-2 text-right">Flat</th>
                  <th className="px-4 py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {overview.recent.map((row) => (
                  <tr key={row.id} className="border-b border-gsx-border/60 last:border-0">
                    <td className="whitespace-nowrap px-4 py-2 text-xs text-gsx-muted">{row.created_at}</td>
                    <td className="whitespace-nowrap px-4 py-2">{KIND_LABEL[row.kind] ?? row.kind}</td>
                    <td className="max-w-[180px] truncate px-4 py-2 text-xs text-gsx-muted">{row.payee_label ?? row.note ?? "—"}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{usd(row.gross_cents)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-gsx-accent">{usd(row.participant_cents)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{usd(row.interviewer_cents)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{usd(row.judge_cents)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{usd(row.platform_cents)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-gsx-gold">{usd(row.amount_cents)}</td>
                    <td className="px-4 py-2 text-right">
                      {row.status === "computed" ? (
                        <button
                          type="button"
                          onClick={() => markPaid(row.id)}
                          disabled={busy}
                          className="rounded border border-gsx-accent/50 px-2 py-1 text-xs text-gsx-accent transition-colors hover:bg-gsx-accent/10 disabled:opacity-40"
                        >
                          Mark paid
                        </button>
                      ) : (
                        <span className={row.status === "paid" ? "text-xs text-gsx-accent" : "text-xs text-gsx-muted"}>
                          {row.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
