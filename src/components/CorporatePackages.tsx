"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Corporate Packages — staff-side sales desk for the two fixed packages
 * ($333 / 10 seats, $3,330 / 100 seats). One click records the sale: the
 * order is stored, the payout ledger splits the gross into thirds, and the
 * $10-per-seat charity allocation posts to the charity ledger. All money
 * math happens in the corporate_record_sale database RPC — this UI never
 * hand-types an amount the ledger is meant to compute.
 */

export interface CorporateOrder {
  id: string;
  company_name: string;
  contact_email: string;
  seats: number;
  price_cents: number;
  charity_cents: number;
  note: string | null;
  created_at: string;
}

const usd = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

const field =
  "w-full rounded border border-gsx-border bg-gsx-bg px-3 py-2 text-sm outline-none focus:border-gsx-accent/60";
const label = "text-xs font-medium uppercase tracking-wider text-gsx-muted";

export default function CorporatePackages({ initial }: { initial: CorporateOrder[] }) {
  const [orders, setOrders] = useState<CorporateOrder[]>(initial);
  const [pkg, setPkg] = useState<"10" | "100">("10");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("corporate_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setOrders(data as CorporateOrder[]);
  }, []);

  async function recordSale(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFlash(null);
    const seats = pkg === "10" ? 10 : 100;
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("corporate_record_sale", {
      p_company: company,
      p_contact_email: email,
      p_seats: seats,
      p_note: note || null,
    });
    if (rpcError) {
      setError(rpcError.message);
    } else {
      setFlash(
        `Sale recorded — ${seats} seats for ${company.trim()}. Ledger split into thirds and $${(
          (seats * 1000) /
          100
        ).toFixed(0)} charity allocation posted.`,
      );
      setCompany("");
      setEmail("");
      setNote("");
      await refresh();
    }
    setBusy(false);
  }

  const total = orders.reduce((s, o) => s + o.price_cents, 0);
  const charity = orders.reduce((s, o) => s + o.charity_cents, 0);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        {(
          [
            { seats: 10, price: 33300, blurb: "One session block · up to 10 players" },
            { seats: 100, price: 333000, blurb: "Full program · up to 100 players" },
          ] as const
        ).map((p) => (
          <div
            key={p.seats}
            className={`rounded-xl border p-5 transition-colors ${
              pkg === String(p.seats)
                ? "border-gsx-accent/60 bg-gsx-accent/5"
                : "border-gsx-border bg-gsx-panel"
            }`}
          >
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">{usd(p.price)}</div>
              <div className="text-sm text-gsx-muted">{p.seats} players</div>
            </div>
            <p className="mt-1 text-sm text-gsx-muted">{p.blurb}</p>
            <p className="mt-2 text-xs text-gsx-muted">
              Split automatically: ⅓ participants · ⅓ interviewers · ⅓ platform — plus ${" "}
              {(p.seats * 10).toLocaleString()} to charity.
            </p>
          </div>
        ))}
      </section>

      <form onSubmit={recordSale} className="rounded-xl border border-gsx-border bg-gsx-panel p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={label} htmlFor="corp-pkg">
              Package
            </label>
            <select
              id="corp-pkg"
              className={`${field} mt-1`}
              value={pkg}
              onChange={(e) => setPkg(e.target.value as "10" | "100")}
            >
              <option value="10">10-player — $333.00</option>
              <option value="100">100-player — $3,330.00</option>
            </select>
          </div>
          <div>
            <label className={label} htmlFor="corp-company">
              Company
            </label>
            <input
              id="corp-company"
              className={`${field} mt-1`}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              placeholder="Acme Family Centers"
            />
          </div>
          <div>
            <label className={label} htmlFor="corp-email">
              Contact email
            </label>
            <input
              id="corp-email"
              type="email"
              className={`${field} mt-1`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ops@acme.com"
            />
          </div>
          <div>
            <label className={label} htmlFor="corp-note">
              Note (optional)
            </label>
            <input
              id="corp-note"
              className={`${field} mt-1`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Invoice terms, event date…"
            />
          </div>
        </div>
        {error && <p className="mt-3 text-xs text-gsx-danger">{error}</p>}
        {flash && <p className="mt-3 text-xs text-gsx-accent">{flash}</p>}
        <button
          type="submit"
          disabled={busy}
          className="mt-4 rounded gsx-brand-gradient px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {busy ? "Recording…" : "Record sale — split ledger automatically"}
        </button>
      </form>

      <section className="rounded-xl border border-gsx-border bg-gsx-panel">
        <div className="flex items-center justify-between border-b border-gsx-border px-5 py-3">
          <h2 className="text-sm font-semibold">Recorded corporate sales</h2>
          <div className="text-xs text-gsx-muted">
            {orders.length} sale{orders.length === 1 ? "" : "s"} · {usd(total)} booked ·{" "}
            {usd(charity)} to charity
          </div>
        </div>
        {orders.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gsx-muted">No corporate sales recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gsx-border text-left text-xs uppercase tracking-wider text-gsx-muted">
                  <th className="px-5 py-2 font-medium">Company</th>
                  <th className="px-5 py-2 font-medium">Contact</th>
                  <th className="px-5 py-2 font-medium">Seats</th>
                  <th className="px-5 py-2 font-medium">Price</th>
                  <th className="px-5 py-2 font-medium">Charity</th>
                  <th className="px-5 py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-gsx-border/50 last:border-0">
                    <td className="px-5 py-2 font-medium">
                      {o.company_name}
                      {o.note && <div className="text-xs text-gsx-muted">{o.note}</div>}
                    </td>
                    <td className="px-5 py-2 text-gsx-muted">{o.contact_email}</td>
                    <td className="px-5 py-2">{o.seats}</td>
                    <td className="px-5 py-2">{usd(o.price_cents)}</td>
                    <td className="px-5 py-2 text-gsx-accent">{usd(o.charity_cents)}</td>
                    <td className="px-5 py-2 text-gsx-muted">
                      {new Date(o.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
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
