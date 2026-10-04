"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Street Team desk — the contractor tracking home. One row per worker with
 * their personal ?ref= link, live clicks, referred signups, conversion
 * percentage, and commission owed (paid through the existing payouts desk).
 * All numbers come from the ref_desk_overview database RPC — the UI never
 * hand-counts.
 */

export interface RefWorker {
  id: string;
  label: string;
  code: string;
  is_active: boolean;
  created_at: string;
  clicks_total: number;
  clicks_7d: number;
  conversions: number;
  gross_cents: number;
  owed_cents: number;
  paid_cents: number;
}

export interface RefTotals {
  workers_active: number;
  workers_total: number;
  clicks_7d: number;
  clicks_total: number;
  conversions: number;
  attributed_members: number;
  members_total: number;
  owed_cents: number;
  paid_cents: number;
}

export interface RefOverview {
  workers: RefWorker[];
  totals: RefTotals;
}

const usd = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

const pct = (num: number, den: number) =>
  den > 0 ? `${Math.round((num / den) * 100)}%` : "—";

export default function StreetTeamDesk({ initial }: { initial: RefOverview }) {
  const [overview, setOverview] = useState<RefOverview>(initial);
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);

  const t = overview.totals;

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.rpc("ref_desk_overview");
    if (data) setOverview(data as RefOverview);
  }, []);

  async function addWorker(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFlash(null);
    setNewCode(null);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("ref_create_worker", {
      p_label: label,
    });
    if (rpcError) {
      setError(rpcError.message);
    } else {
      const worker = (data as { code?: string } | null) ?? null;
      setNewCode(worker?.code ?? null);
      setFlash(`Worker added. Their link: /join?ref=${worker?.code ?? ""}`);
      setLabel("");
      await refresh();
    }
    setBusy(false);
  }

  async function toggleActive(worker: RefWorker) {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("ref_set_worker_active", {
      p_worker_id: worker.id,
      p_active: !worker.is_active,
    });
    if (rpcError) setError(rpcError.message);
    else await refresh();
    setBusy(false);
  }

  async function copyLink(code: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/join?ref=${code}`);
      setFlash(`Link copied — /join?ref=${code}`);
    } catch {
      setFlash(`Copy failed — link is /join?ref=${code}`);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-xl border border-gsx-border bg-gsx-panel p-4">
          <div className="text-xs uppercase tracking-wider text-gsx-muted">Active workers</div>
          <div className="mt-1 text-2xl font-bold">{t.workers_active}</div>
          <div className="text-xs text-gsx-muted">{t.workers_total} total</div>
        </div>
        <div className="rounded-xl border border-gsx-border bg-gsx-panel p-4">
          <div className="text-xs uppercase tracking-wider text-gsx-muted">Clicks · 7 days</div>
          <div className="mt-1 text-2xl font-bold tabular-nums">{t.clicks_7d}</div>
          <div className="text-xs text-gsx-muted">{t.clicks_total} all time</div>
        </div>
        <div className="rounded-xl border border-gsx-border bg-gsx-panel p-4">
          <div className="text-xs uppercase tracking-wider text-gsx-muted">Signups referred</div>
          <div className="mt-1 text-2xl font-bold tabular-nums">{t.conversions}</div>
          <div className="text-xs text-gsx-muted">{pct(t.conversions, t.clicks_total)} of clicks</div>
        </div>
        <div className="rounded-xl border border-gsx-border bg-gsx-panel p-4">
          <div className="text-xs uppercase tracking-wider text-gsx-muted">Members via street team</div>
          <div className="mt-1 text-2xl font-bold tabular-nums">
            {pct(t.attributed_members, t.members_total)}
          </div>
          <div className="text-xs text-gsx-muted">
            {t.attributed_members} of {t.members_total} members
          </div>
        </div>
        <div className="rounded-xl border border-gsx-border bg-gsx-panel p-4">
          <div className="text-xs uppercase tracking-wider text-gsx-muted">Commission owed</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-gsx-gold">{usd(t.owed_cents)}</div>
          <div className="text-xs text-gsx-muted">{usd(t.paid_cents)} paid out</div>
        </div>
        <div className="rounded-xl border border-gsx-border bg-gsx-panel p-4">
          <div className="text-xs uppercase tracking-wider text-gsx-muted">How payouts work</div>
          <div className="mt-1 text-xs text-gsx-muted">
            75¢ per click when posted in bulk · $1 + 10% of what the member paid, per signup —
            posted automatically
          </div>
        </div>
      </section>

      <form onSubmit={addWorker} className="rounded-xl border border-gsx-border bg-gsx-panel p-5">
        <label className="text-xs font-medium uppercase tracking-wider text-gsx-muted" htmlFor="worker-label">
          Add a contractor
        </label>
        <div className="mt-2 flex gap-3">
          <input
            id="worker-label"
            className="w-full rounded border border-gsx-border bg-gsx-bg px-3 py-2 text-sm outline-none focus:border-gsx-accent/60"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
            placeholder="Worker or group name — e.g. Jay · OSU campus"
          />
          <button
            type="submit"
            disabled={busy}
            className="whitespace-nowrap rounded gsx-brand-gradient px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {busy ? "Adding…" : "Create link"}
          </button>
        </div>
        {error && <p className="mt-3 text-xs text-gsx-danger">{error}</p>}
        {flash && <p className="mt-3 text-xs text-gsx-accent">{flash}</p>}
        {newCode && (
          <p className="mt-2 font-mono text-xs text-gsx-muted">
            Share this link: {typeof window !== "undefined" ? window.location.origin : ""}
            /join?ref={newCode}
          </p>
        )}
      </form>

      <section className="rounded-xl border border-gsx-border bg-gsx-panel">
        <div className="border-b border-gsx-border px-5 py-3">
          <h2 className="text-sm font-semibold">Contractors</h2>
        </div>
        {overview.workers.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gsx-muted">
            No workers yet. Add a contractor above to generate their tracking link.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gsx-border text-left text-xs uppercase tracking-wider text-gsx-muted">
                  <th className="px-5 py-2 font-medium">Worker</th>
                  <th className="px-5 py-2 font-medium">Ref link</th>
                  <th className="px-5 py-2 font-medium">Clicks</th>
                  <th className="px-5 py-2 font-medium">Signups</th>
                  <th className="px-5 py-2 font-medium">Conv %</th>
                  <th className="px-5 py-2 font-medium">Owed</th>
                  <th className="px-5 py-2 font-medium">Paid</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {overview.workers.map((w) => (
                  <tr key={w.id} className="border-b border-gsx-border/50 last:border-0">
                    <td className="px-5 py-2 font-medium">
                      {w.label}
                      {!w.is_active && (
                        <span className="ml-2 rounded border border-gsx-border px-1 py-0.5 text-[10px] text-gsx-muted">
                          paused
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-2">
                      <button
                        onClick={() => copyLink(w.code)}
                        className="font-mono text-xs text-gsx-accent hover:underline"
                        title="Copy link"
                      >
                        /join?ref={w.code}
                      </button>
                    </td>
                    <td className="px-5 py-2 tabular-nums">
                      {w.clicks_total}
                      <span className="text-xs text-gsx-muted"> ({w.clicks_7d}·7d)</span>
                    </td>
                    <td className="px-5 py-2 tabular-nums">{w.conversions}</td>
                    <td className="px-5 py-2 tabular-nums">{pct(w.conversions, w.clicks_total)}</td>
                    <td className="px-5 py-2 tabular-nums text-gsx-gold">{usd(w.owed_cents)}</td>
                    <td className="px-5 py-2 tabular-nums text-gsx-muted">{usd(w.paid_cents)}</td>
                    <td className="px-5 py-2">
                      <span className={w.is_active ? "text-gsx-accent" : "text-gsx-muted"}>
                        {w.is_active ? "active" : "paused"}
                      </span>
                    </td>
                    <td className="px-5 py-2 text-right">
                      <button
                        onClick={() => toggleActive(w)}
                        disabled={busy}
                        className="rounded border border-gsx-border px-2 py-1 text-xs text-gsx-muted transition-colors hover:text-gsx-text disabled:opacity-40"
                      >
                        {w.is_active ? "Pause" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-gsx-muted">
        Clicks are logged when someone lands on /join with the worker&apos;s code. A signup within
        30 days of any ?ref= visit attributes to the first active code the visitor used. Commissions
        post to the Payouts Ledger automatically for signups; bulk click payouts stay on the payouts
        desk.
      </p>
    </div>
  );
}
